const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    // Doctor-specific fields
    specialization:     { type: String, default: '' },
    qualification:      { type: String, default: '' },
    licenseNumber:       { type: String, default: '' },
    hospital:            { type: String, default: '' },
    yearsOfExp:          { type: Number, default: 0 },
    isVerifiedDoctor:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    mobileNumber:       { type: String, default: '' },
    termsAccepted:      { type: Boolean, default: true },
    // For patients — assigned doctor
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ── Health Profile (for Emergency Card, Health Wallet, AI) ──
    phone: {
      type: String,
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: '',
    },
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    emergencyContact: {
      name:         { type: String, default: '' },
      phone:        { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    height: {
      type: Number, // in cm
      default: null,
    },
    weight: {
      type: Number, // in kg
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['', 'male', 'female', 'other', 'prefer_not_to_say'],
      default: '',
    },
    // ── Security Hardening & SSO Fields ──
    googleId: {
      type: String,
      default: '',
    },
    isGoogleAuth: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Account Lockout check method
UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment Failed Attempts method
UserSchema.methods.incFailedAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  const updates = { $inc: { failedLoginAttempts: 1 } };
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) }; // 15 min lock
  }
  return this.updateOne(updates);
};

// Reset Lockout method
UserSchema.methods.resetFailedAttempts = async function (ip) {
  return this.updateOne({
    $set: {
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
      lastLoginIp: ip || ''
    },
    $unset: { lockUntil: 1 }
  });
};

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
UserSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', UserSchema);
