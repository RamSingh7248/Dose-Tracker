const jwt             = require('jsonwebtoken');
const crypto          = require('crypto');
const User            = require('../models/User');
const Medication      = require('../models/Medication');
const Dose            = require('../models/Dose');
const HealthDocument  = require('../models/HealthDocument');
const Appointment     = require('../models/Appointment');
const sendEmail       = require('../utils/sendEmail');
const { logAuditAction } = require('../middleware/securityMiddleware');
const { emitDashboardEvent } = require('../services/socketEmitter');

// ── In-Memory Cache for /auth/me ─────────────────────────────────────────────
// Avoids a DB round-trip on every page navigation.
// TTL: 60 seconds — short enough to reflect profile updates quickly.
const userCache = new Map(); // key: userId → { user, ts }
const USER_CACHE_TTL = 60 * 1000; // 60 seconds

function getCachedUser(id) {
  const entry = userCache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.ts > USER_CACHE_TTL) {
    userCache.delete(id);
    return null;
  }
  return entry.user;
}

function setCachedUser(id, user) {
  userCache.set(id, { user, ts: Date.now() });
  // Evict after TTL to avoid unbounded growth
  setTimeout(() => userCache.delete(id), USER_CACHE_TTL + 1000);
}

function invalidateCachedUser(id) {
  userCache.delete(id);
}

// ── Helper: Issue HTTP-only cookies and JSON response ─────────────────────
const sendTokenResponse = async (user, statusCode, res, message = 'Authenticated successfully') => {
  const token = user.generateToken();
  const refreshTokenStr = user.generateRefreshToken();

  // Save refresh token to database
  user.refreshToken = refreshTokenStr;
  user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };

  // 15m access token cookie
  res.cookie('accessToken', token, {
    ...cookieOptions,
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  // 7d refresh token cookie
  res.cookie('refreshToken', refreshTokenStr, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    refreshToken: refreshTokenStr,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      notificationsEnabled: user.notificationsEnabled,
      specialization: user.specialization,
      hospital: user.hospital,
      isGoogleAuth: user.isGoogleAuth || false,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, specialization, hospital, licenseNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await logAuditAction({ req, action: 'REGISTER_FAILED_DUPLICATE', status: 'WARNING', details: { email } });
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Public registration strictly prohibits creating Admin accounts
    if (role === 'admin' || role === 'ROLE_ADMIN') {
      await logAuditAction({ req, action: 'UNAUTHORIZED_ADMIN_REGISTER_ATTEMPT', status: 'DENIED', details: { email } });
      return res.status(403).json({ success: false, message: '403 Forbidden: Admin accounts cannot be created via public registration.' });
    }

    // Public registration only allows 'ROLE_PATIENT' or 'ROLE_DOCTOR'
    const isDoctorRole = (role === 'doctor' || role === 'ROLE_DOCTOR');
    const userRole = isDoctorRole ? 'ROLE_DOCTOR' : 'ROLE_PATIENT';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      specialization: isDoctorRole ? (specialization || '') : '',
      hospital: isDoctorRole ? (hospital || '') : '',
      licenseNumber: isDoctorRole ? (licenseNumber || '') : '',
      isVerifiedDoctor: isDoctorRole ? 'pending' : 'approved',
    });

    await logAuditAction({ req, user, action: 'USER_REGISTERED', resource: 'Auth', status: 'SUCCESS' });

    // 🔴 Real-time: notify all admin dashboards of new registration
    emitDashboardEvent('user.registered', {
      userId: user._id,
      name:   user.name,
      role:   user.role,
    });

    return sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, portal } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      await logAuditAction({ req, action: 'LOGIN_FAILED_NOT_FOUND', status: 'WARNING', details: { email } });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Account lockout check
    if (user.isLocked()) {
      await logAuditAction({ req, user, action: 'LOGIN_BLOCKED_LOCKED_ACCOUNT', status: 'DENIED' });
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incFailedAttempts();
      await logAuditAction({ req, user, action: 'LOGIN_FAILED_WRONG_PASSWORD', status: 'FAILURE' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Multi-portal role authorization checks
    const normalizedUserRole = user.role === 'admin' || user.role === 'ROLE_ADMIN' ? 'ROLE_ADMIN' :
                               user.role === 'doctor' || user.role === 'ROLE_DOCTOR' ? 'ROLE_DOCTOR' : 'ROLE_PATIENT';

    if (portal === 'patient' && normalizedUserRole !== 'ROLE_PATIENT') {
      await logAuditAction({ req, user, action: 'LOGIN_BLOCKED_UNAUTHORIZED_PORTAL', status: 'DENIED', details: { portal, role: user.role } });
      return res.status(403).json({
        success: false,
        message: 'This account is not authorized for the Patient Portal.'
      });
    }

    if (portal === 'doctor' && normalizedUserRole !== 'ROLE_DOCTOR') {
      await logAuditAction({ req, user, action: 'LOGIN_BLOCKED_UNAUTHORIZED_PORTAL', status: 'DENIED', details: { portal, role: user.role } });
      return res.status(403).json({
        success: false,
        message: 'This account is not authorized for the Doctor Portal.'
      });
    }

    if (portal === 'admin') {
      if (normalizedUserRole !== 'ROLE_ADMIN') {
        await logAuditAction({ req, user, action: 'LOGIN_BLOCKED_UNAUTHORIZED_PORTAL', status: 'DENIED', details: { portal, role: user.role } });
        return res.status(403).json({
          success: false,
          message: 'Administrator access is restricted.'
        });
      }

      // Verify email against ADMIN_EMAILS whitelist
      const adminEmailsEnv = process.env.ADMIN_EMAILS || 'ramub9349@gmail.com';
      const allowedAdminEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase());
      if (!allowedAdminEmails.includes(user.email.toLowerCase())) {
        await logAuditAction({ req, user, action: 'LOGIN_BLOCKED_ADMIN_EMAIL_NOT_WHITELISTED', status: 'DENIED', details: { email: user.email } });
        return res.status(403).json({
          success: false,
          message: 'Administrator access is restricted.'
        });
      }
    }

    // Reset failed attempts on successful login
    await user.resetFailedAttempts(req.ip);
    await logAuditAction({ req, user, action: 'USER_LOGIN', resource: 'Auth', status: 'SUCCESS', details: { portal } });

    return sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id?.toString();

    // Serve from cache if available — avoids a DB round-trip on every page load
    const cached = getCachedUser(userId);
    if (cached) {
      return res.json({ success: true, user: cached });
    }

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    setCachedUser(userId, user);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'timezone', 'notificationsEnabled',
      'avatar', 'specialization', 'hospital', 'bloodGroup',
      'height', 'weight', 'gender', 'dateOfBirth',
      'themeColor', 'language', 'fontSize', 'doctorName',
      'doctorPhone', 'doctorEmail', 'hospitalAddress',
    ];

    const update = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        update[f] = req.body[f];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      update,
      { new: true, runValidators: true }
    );

    // Invalidate the /me cache so the next request gets fresh data
    invalidateCachedUser(req.user.id?.toString());

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export complete user medical & medication history
// @route   GET /api/auth/export-data
// @access  Private
const exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, medications, doses, documents, appointments] = await Promise.all([
      User.findById(userId).select('-password'),
      Medication.find({ user: userId }),
      Dose.find({ user: userId }).sort({ scheduledTime: -1 }).limit(100),
      HealthDocument.find({ user: userId, isDeleted: false }),
      Appointment.find({ user: userId }),
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        height: user.height,
        weight: user.weight,
        timezone: user.timezone,
        emergencyContact: user.emergencyContact || null,
        doctorName: user.doctorName || null,
        doctorPhone: user.doctorPhone || null,
        hospitalAddress: user.hospitalAddress || null,
      },
      medications: medications || [],
      doseLogHistory: doses || [],
      healthVaultDocuments: documents || [],
      appointments: appointments || [],
    };

    res.json({ success: true, data: exportBundle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google SSO Login / Register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { email, name, picture, googleId, credential, role } = req.body;

    let userEmail = email;
    let userName = name;
    let userAvatar = picture || '';
    let gId = googleId || '';

    // If a Google ID token (credential) was passed, decode or parse payload if needed
    if (credential && (!userEmail || !userName)) {
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        userEmail = payload.email || userEmail;
        userName = payload.name || userName;
        userAvatar = payload.picture || userAvatar;
        gId = payload.sub || gId;
      } catch (e) {
        console.warn('Failed to parse Google ID token credential:', e.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Google account email is required' });
    }

    let user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      // Create new user with Google Auth. Admin role cannot be created via public Google SSO.
      const isDoctorRole = (role === 'doctor' || role === 'ROLE_DOCTOR');
      const userRole = isDoctorRole ? 'ROLE_DOCTOR' : 'ROLE_PATIENT';
      const randomPassword = 'GAuth_' + Math.random().toString(36).slice(-10) + '!' + Date.now();
      
      user = await User.create({
        name: userName || userEmail.split('@')[0],
        email: userEmail.toLowerCase(),
        password: randomPassword,
        role: userRole,
        avatar: userAvatar,
        googleId: gId,
        isGoogleAuth: true,
        termsAccepted: true,
        isVerifiedDoctor: isDoctorRole ? 'pending' : 'approved',
      });

      await logAuditAction({ req, user, action: 'USER_REGISTERED_GOOGLE', resource: 'Auth', status: 'SUCCESS' });
    } else {
      // Existing user: update Google SSO info if not already marked
      let updated = false;
      if (!user.isGoogleAuth) {
        user.isGoogleAuth = true;
        updated = true;
      }
      if (gId && !user.googleId) {
        user.googleId = gId;
        updated = true;
      }
      if (userAvatar && !user.avatar) {
        user.avatar = userAvatar;
        updated = true;
      }

      if (updated) {
        await user.save();
      }

      await user.resetFailedAttempts(req.ip);
      await logAuditAction({ req, user, action: 'USER_LOGIN_GOOGLE', resource: 'Auth', status: 'SUCCESS' });
    }

    return sendTokenResponse(user, 200, res, 'Google login successful');
  } catch (error) {
    console.error('Google auth controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
  }
};

// @desc    Refresh Token Rotation Endpoint
// @route   POST /api/auth/refresh
// @access  Public
const refreshTokenEndpoint = async (req, res) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromHeader = req.headers['x-refresh-token'] || req.body?.refreshToken;
    const refToken = tokenFromCookie || tokenFromHeader;

    if (!refToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(refToken, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: `Refresh token invalid or expired: ${err.message}` });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User inactive or not found' });
    }

    // Verify token reuse check (if user has a stored refreshToken in DB)
    if (user.refreshToken && user.refreshToken !== refToken) {
      user.refreshToken = '';
      user.refreshTokenExpiresAt = null;
      await user.save({ validateBeforeSave: false });
      await logAuditAction({ req, user, action: 'REFRESH_TOKEN_REUSE_DETECTED', status: 'DENIED' });
      return res.status(401).json({ success: false, message: 'Token reuse security alert. Log in again.' });
    }

    return sendTokenResponse(user, 200, res, 'Token refreshed successfully');
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user & clear secure cookies
// @route   POST /api/auth/logout
// @access  Private / Public
const logout = async (req, res) => {
  try {
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: '', refreshTokenExpiresAt: null });
      await logAuditAction({ req, action: 'USER_LOGOUT', status: 'SUCCESS' });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('XSRF-TOKEN', { sameSite: 'lax', path: '/' });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password — Generate cryptographically secure token & dispatch reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      await logAuditAction({ req, action: 'FORGOT_PASSWORD_FAILED_NOT_FOUND', status: 'WARNING', details: { email } });
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent.'
      });
    }

    // Generate cryptographic reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Construct frontend reset URL
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; color: #0f172a;">
        <h2 style="color: #2563eb; margin-top: 0; font-size: 20px;">DoseTracker — Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">You requested a password reset for your DoseTracker account.</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Click the button below to reset your password. This secure link expires in <strong>15 minutes</strong>.</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; word-break: break-all;">Direct Link: ${resetUrl}</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 Password Reset Request — DoseTracker',
        message: `You requested a password reset. Click link to reset: ${resetUrl}`,
        html: htmlMessage,
        resetUrl,
      });

      await logAuditAction({ req, action: 'FORGOT_PASSWORD_SUCCESS', status: 'SUCCESS', details: { email: user.email } });
    } catch (emailErr) {
      console.warn('Email dispatch notice:', emailErr.message);
    }

    // Always return generic response regardless of whether email service sent or failed
    res.status(200).json({
      success: true,
      message: 'If an account exists for this email, password reset instructions have been sent.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password — Validate token & update password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password, newPassword, token } = req.body;
    const rawToken = req.params.resetToken || req.params.token || token || req.query.token;
    const finalPassword = password || newPassword;

    if (!finalPassword) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    if (finalPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Invalid or missing password reset token' });
    }

    // Hash token from request to match stored SHA-256 hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      await logAuditAction({ req, action: 'RESET_PASSWORD_FAILED_INVALID_TOKEN', status: 'WARNING' });
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    // Set new password (pre('save') automatically hashes it with bcrypt)
    user.password = finalPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    invalidateCachedUser(user._id.toString());
    await logAuditAction({ req, action: 'RESET_PASSWORD_SUCCESS', status: 'SUCCESS', details: { userId: user._id } });

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  refreshTokenEndpoint,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
  exportUserData,
  invalidateCachedUser,
};

