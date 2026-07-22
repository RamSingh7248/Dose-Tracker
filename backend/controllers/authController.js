const User = require('../models/User');
const Medication = require('../models/Medication');
const Dose = require('../models/Dose');
const HealthDocument = require('../models/HealthDocument');
const Appointment = require('../models/Appointment');

const { logAuditAction } = require('../middleware/securityMiddleware');

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

    // Public registration only allows 'patient' or 'doctor'. Admin role cannot be self-registered.
    const userRole = role === 'doctor' ? 'doctor' : 'patient';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      specialization: userRole === 'doctor' ? (specialization || '') : '',
      hospital: userRole === 'doctor' ? (hospital || '') : '',
      licenseNumber: userRole === 'doctor' ? (licenseNumber || '') : '',
    });
    const token = user.generateToken();

    await logAuditAction({ req, user, action: 'USER_REGISTERED', resource: 'Auth', status: 'SUCCESS' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        notificationsEnabled: user.notificationsEnabled,
        specialization: user.specialization,
        hospital: user.hospital,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
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

    // Reset failed attempts on successful login
    await user.resetFailedAttempts(req.ip);
    await logAuditAction({ req, user, action: 'USER_LOGIN', resource: 'Auth', status: 'SUCCESS' });

    const token = user.generateToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        notificationsEnabled: user.notificationsEnabled,
        specialization: user.specialization,
        hospital: user.hospital,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
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
      // Create new user with Google Auth
      const userRole = (role === 'doctor' || role === 'admin') ? role : 'patient';
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

    const token = user.generateToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isGoogleAuth: user.isGoogleAuth,
        notificationsEnabled: user.notificationsEnabled,
        specialization: user.specialization,
        hospital: user.hospital,
      },
    });
  } catch (error) {
    console.error('Google auth controller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
  }
};

module.exports = { register, login, googleAuth, getMe, updateMe, changePassword, exportUserData };

