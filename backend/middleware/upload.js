const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories per type
    const subDir = req.uploadSubDir || 'general';
    const dest = path.join(uploadDir, subDir);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `${file.fieldname}-${uniqueSuffix}${safeExt}`);
  },
});

const { secureFileFilter } = require('./securityMiddleware');

// File filter with whitelist & dangerous extension rejection
const fileFilter = (req, file, cb) => {
  secureFileFilter(req, file, cb);
};

// General upload (single file, 10MB limit)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Middleware to set subdirectory based on route
const setUploadDir = (subDir) => (req, res, next) => {
  req.uploadSubDir = subDir;
  next();
};

module.exports = { upload, setUploadDir };
