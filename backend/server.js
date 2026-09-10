const http        = require('http');
const https       = require('https');
const express     = require('express');
const cors        = require('cors');
const compression = require('compression');
const dotenv      = require('dotenv');
const path        = require('path');
const jwt         = require('jsonwebtoken');
const { Server }  = require('socket.io');

const connectDB        = require('./config/db');
const reminderEngine   = require('./services/reminderEngine');
const socketEmitter    = require('./services/socketEmitter');

const helmet           = require('helmet');
const cookieParser     = require('cookie-parser');
const mongoSanitize    = require('express-mongo-sanitize');
const xssSanitizer     = require('./middleware/xssSanitizer');
const { attachCsrfToken, verifyCsrfToken } = require('./middleware/csrfMiddleware');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// ── Express app ─────────────────────────────────────────
const app = express();

// ── HTTP server (needed for Socket.IO) ──────────────────
const server = http.createServer(app);

// ── Socket.IO server ─────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://dose-tracker-3d4ky53wi-ram-singhs-projects-7070122d.vercel.app',
  'https://dose-tracker-nine.vercel.app',
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
  // Use polling as transport fallback for proxied environments
  transports: ['websocket', 'polling'],
});

// Initialise singleton so all controllers can emit events
socketEmitter.init(io);

// ── Socket.IO Authentication Middleware ──────────────────
// Validates JWT on every connection handshake.
// Admins are placed in the 'admin-dashboard' room.
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Non-authenticated sockets are allowed (patient app uses no socket)
      // but will NOT be placed in the admin room.
      socket.userRole = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('role name isActive').lean();

    if (!user || !user.isActive) {
      return next(new Error('Authentication failed'));
    }

    socket.userId   = user._id.toString();
    socket.userName = user.name;
    socket.userRole = user.role;
    next();
  } catch {
    socket.userRole = null;
    next(); // allow connection but without admin privileges
  }
});

// ── Socket.IO Connection Handler ─────────────────────────
io.on('connection', (socket) => {
  const isAdmin =
    socket.userRole === 'ROLE_ADMIN' || socket.userRole === 'admin';

  if (isAdmin) {
    socket.join('admin-dashboard');
    console.log(`🛡️  Admin connected to dashboard: ${socket.userName} [${socket.id}]`);

    socket.emit('dashboard:connected', {
      message: 'Connected to real-time dashboard',
      room: 'admin-dashboard',
      ts: new Date().toISOString(),
    });
  }

  socket.on('disconnect', (reason) => {
    if (isAdmin) {
      console.log(`🛡️  Admin disconnected: ${socket.userName} — ${reason}`);
    }
  });
});

// ── Connect MongoDB & start services ─────────────────────
connectDB().then(() => {
  reminderEngine.start();
});

// ── Gzip Compression ─────────────────────────────────────
// Must be the FIRST middleware — compresses all responses before they leave.
// Reduces API payload sizes by 60-80% (e.g. 80KB → 12KB for dashboard).
app.use(compression({
  // Only compress responses >= 1KB (no point compressing tiny responses)
  threshold: 1024,
  // Compression level 6 = good balance between speed and ratio
  level: 6,
  // Compress all content types (JSON, HTML, CSS, JS)
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ── Security Headers Middleware ───────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── In-Memory Rate Limiter ────────────────────────────────
const rateLimitMap = new Map();

const rateLimiter = (maxRequests = 300, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip  = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, startTime: now };

    if (now - record.startTime > windowMs) {
      record.count     = 1;
      record.startTime = now;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(key, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.',
      });
    }

    next();
  };
};

// ── Rate Limiter Memory Leak Fix ──────────────────────────
// The rateLimitMap grows unbounded as new IPs accumulate.
// This cleanup job runs every 5 minutes and removes expired entries,
// preventing the Render instance from running out of memory over days.
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`🧹 Rate limiter cleanup: removed ${removed} expired entries`);
  }
}, 5 * 60 * 1000);

// Express 5 Compatible Mongo Injection Defense
const mongoSanitizeMiddleware = (req, res, next) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObj(obj[key]);
      }
    }
  };
  if (req.body) sanitizeObj(req.body);
  if (req.params) sanitizeObj(req.params);
  if (req.query) sanitizeObj(req.query);
  next();
};

// ── Enterprise Cyber Security Middleware Stack ─────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cookieParser(process.env.COOKIE_SECRET || 'dose_tracker_secure_cookie_secret_332211'));
app.use(mongoSanitizeMiddleware);
app.use(xssSanitizer);
app.use(attachCsrfToken);
app.use(verifyCsrfToken);

// Apply rate limiting (5 login attempts per 15 minutes window)
app.use('/api/auth/login',    rateLimiter(5, 15 * 60 * 1000));
app.use('/api/auth/register', rateLimiter(5, 15 * 60 * 1000));
app.use('/api/',              rateLimiter(500, 15 * 60 * 1000));

// ── Core Middleware ───────────────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger (dev)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/users',           require('./routes/userRoutes'));
app.use('/api/medicines',       require('./routes/medicineRoutes'));
app.use('/api/medications',     require('./routes/medicationRoutes'));
app.use('/api/doses',           require('./routes/doseRoutes'));
app.use('/api/members',         require('./routes/memberRoutes'));
app.use('/api/reminders',       require('./routes/reminderRoutes'));
app.use('/api/admin',           require('./routes/adminRoutes'));
app.use('/api/doctor',          require('./routes/doctorRoutes'));
app.use('/api/notifications',   require('./routes/notificationRoutes'));
app.use('/api/appointments',    require('./routes/appointmentRoutes'));
app.use('/api/adherence',       require('./routes/adherenceRoutes'));
app.use('/api/health-events',   require('./routes/healthEventRoutes'));
app.use('/api/timeline',        require('./routes/timelineRoutes'));
app.use('/api/documents',       require('./routes/documentRoutes'));
app.use('/api/emergency-card',  require('./routes/emergencyRoutes'));
app.use('/api/stock',           require('./routes/stockRoutes'));
app.use('/api/prescriptions',   require('./routes/prescriptionRoutes'));
app.use('/api/ai',              require('./routes/aiRoutes'));
app.use('/api/ai-hub',          require('./routes/aiHubRoutes'));
app.use('/api/system-settings', require('./routes/systemSettingsRoutes'));

// API Root welcome route
app.get(['/api', '/api/'], (_, res) => res.json({
  success: true,
  message: '🚀 DoseTracker Enterprise Health API Server',
  status: 'online',
  timestamp: new Date().toISOString(),
  realtime: 'Socket.IO enabled',
}));

// Health check — used by keep-alive ping & Render health monitoring
app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  socketIO: !!io,
  connectedAdmins: io.sockets.adapter.rooms.get('admin-dashboard')?.size ?? 0,
}));

// ── Error handler ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('API Error:', err.message, err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    stack: err.stack,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found` });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 DoseTracker Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
  console.log(`📡 API:       http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
  console.log(`❤️  Health:   http://localhost:${PORT}/api/health\n`);

  // ── Keep-Alive Ping ─────────────────────────────────────
  // Render free-tier shuts down after 15 minutes of inactivity.
  // This self-ping every 14 minutes prevents the cold-start problem
  // that causes recruiters to wait 30-50s for the page to load.
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL && process.env.NODE_ENV !== 'development') {
    const pingUrl = `${RENDER_URL}/api/health`;
    console.log(`🏓 Keep-alive ping configured: ${pingUrl} (every 14 min)`);

    setInterval(() => {
      const protocol = pingUrl.startsWith('https') ? https : http;
      const req = protocol.get(pingUrl, (res) => {
        console.log(`🏓 Keep-alive ping: ${res.statusCode}`);
      });
      req.on('error', (err) => {
        console.warn('🏓 Keep-alive ping failed:', err.message);
      });
      req.end();
    }, 14 * 60 * 1000); // 14 minutes
  } else {
    console.log('🏓 Keep-alive: set RENDER_EXTERNAL_URL env var in Render dashboard to enable');
  }
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\nStopping DoseTracker Server gracefully...');
  reminderEngine.stop();
  io.close();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\nStopping DoseTracker Server gracefully...');
  reminderEngine.stop();
  io.close();
  server.close(() => process.exit(0));
});
