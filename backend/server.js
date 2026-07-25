const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const reminderEngine = require('./services/reminderEngine');

// Load env
dotenv.config();

// Connect MongoDB & start services
connectDB().then(() => {
  seedAdmin();
  seedDoctor();
  seedPatient();
  reminderEngine.start();
});


const app = express();

// ── Security Headers Middleware ────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── In-Memory Rate Limiter Middleware ───────────────
const rateLimitMap = new Map();

const rateLimiter = (maxRequests = 300, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, startTime: now };

    if (now - record.startTime > windowMs) {
      record.count = 1;
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

// Apply rate limiting
app.use('/api/auth/login', rateLimiter(100, 15 * 60 * 1000));
app.use('/api/auth/register', rateLimiter(100, 15 * 60 * 1000));
app.use('/api/', rateLimiter(500, 15 * 60 * 1000));

// ── Middleware ──────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://dose-tracker-3d4ky53wi-ram-singhs-projects-7070122d.vercel.app"
  ],
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

// ── Routes ──────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medications', require('./routes/medicationRoutes'));
app.use('/api/doses', require('./routes/doseRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));

// ── Feature Routes ─────────────────────────────────
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/adherence', require('./routes/adherenceRoutes'));
app.use('/api/health-events', require('./routes/healthEventRoutes'));
app.use('/api/timeline', require('./routes/timelineRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/emergency-card', require('./routes/emergencyRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/ai-hub', require('./routes/aiHubRoutes'));
app.use('/api/system-settings', require('./routes/systemSettingsRoutes'));

// API Root welcome route
app.get(['/api', '/api/'], (_, res) => res.json({
  success: true,
  message: '🚀 DoseTracker Enterprise Health API Server',
  status: 'online',
  timestamp: new Date().toISOString(),
  endpoints: {
    health: '/api/health',
    auth: '/api/auth',
    medications: '/api/medications',
    doses: '/api/doses',
    appointments: '/api/appointments',
    notifications: '/api/notifications',
    timeline: '/api/timeline',
    prescriptions: '/api/prescriptions',
    emergencyCard: '/api/emergency-card',
    ai: '/api/ai',
  }
}));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found` });
});

// ── Start Server ───────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 DoseTracker Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
});

// Graceful Shutdown Handlers
process.on('SIGINT', () => {
  console.log('\nStopping DoseTracker Server gracefully...');
  reminderEngine.stop();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\nStopping DoseTracker Server gracefully...');
  reminderEngine.stop();
  server.close(() => process.exit(0));
});

// ── Seed default admin ───────────────────────────────
async function seedAdmin() {
  try {
    const User = require('./models/User');
    let admin = await User.findOne({ email: 'admin@dosetracker.com' });
    if (!admin) {
      await User.create({
        name: 'System Admin',
        email: 'admin@dosetracker.com',
        password: 'AdminPassword123!',
        role: 'ROLE_ADMIN',
      });
      console.log('🔑 Default admin created: admin@dosetracker.com');
    } else {
      admin.password = 'AdminPassword123!';
      console.log('🔑 Default admin password verified: admin@dosetracker.com');
    }
  } catch (e) {
    console.error('Admin seed error:', e.message);
  }
}

// ── Seed default doctor ──────────────────────────────
async function seedDoctor() {
  try {
    const User = require('./models/User');
    let doctor = await User.findOne({ email: 'doctor@dosetracker.com' });
    if (!doctor) {
      await User.create({
        name: 'Dr. Sarah Jenkins',
        email: 'doctor@dosetracker.com',
        password: 'DoctorPassword123!',
        role: 'ROLE_DOCTOR',
        specialization: 'Cardiologist & Physician',
        hospital: 'City General Hospital',
        isVerifiedDoctor: 'approved',
      });
      console.log('🩺 Default doctor created: doctor@dosetracker.com');
    } else {
      doctor.password = 'DoctorPassword123!';
      doctor.role = 'ROLE_DOCTOR';
      doctor.isVerifiedDoctor = 'approved';
      await doctor.save();
      console.log('🩺 Default doctor password verified: doctor@dosetracker.com');
    }
  } catch (e) {
    console.error('Doctor seed error:', e.message);
  }
}

// ── Seed default patient ─────────────────────────────
async function seedPatient() {
  try {
    const User = require('./models/User');
    let patient = await User.findOne({ email: 'patient@dosetracker.com' });
    if (!patient) {
      await User.create({
        name: 'Alex Johnson',
        email: 'patient@dosetracker.com',
        password: 'PatientPassword123!',
        role: 'ROLE_PATIENT',
      });
      console.log('👤 Default patient created: patient@dosetracker.com');
    } else {
      patient.password = 'PatientPassword123!';
      patient.role = 'ROLE_PATIENT';
      await patient.save();
      console.log('👤 Default patient password verified: patient@dosetracker.com');
    }

    // Ensure ramub9349@gmail.com is set to ROLE_PATIENT
    let ramuUser = await User.findOne({ email: 'ramub9349@gmail.com' });
    if (ramuUser && ramuUser.role !== 'ROLE_PATIENT') {
      ramuUser.role = 'ROLE_PATIENT';
      await ramuUser.save();
      console.log('👤 Ramu user role updated to ROLE_PATIENT: ramub9349@gmail.com');
    }
  } catch (e) {
    console.error('Patient seed error:', e.message);
  }
}

