const User           = require('../models/User');
const Medication     = require('../models/Medication');
const Dose           = require('../models/Dose');
const Prescription   = require('../models/Prescription');
const Appointment    = require('../models/Appointment');
const HealthDocument = require('../models/HealthDocument');
const AuditLog       = require('../models/AuditLog');
const bcrypt         = require('bcryptjs');
const { emitDashboardEvent } = require('../services/socketEmitter');
const { invalidateCachedUser } = require('./authController');

// ── Role helpers ─────────────────────────────────────────────────────────────
const patientRoles = ['patient', 'ROLE_PATIENT'];
const doctorRoles  = ['doctor',  'ROLE_DOCTOR'];
const adminRoles   = ['admin',   'ROLE_ADMIN'];
const allRoles     = [...patientRoles, ...doctorRoles, ...adminRoles];

// ── Helper: date boundary helpers ────────────────────────────────────────────
const startOfDay = (d = new Date()) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
};
const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d;
};
const monthsAgo = (n) => {
  const d = new Date(); d.setMonth(d.getMonth() - n); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
};

/**
 * GET /api/admin/stats   — legacy alias
 * GET /api/admin/dashboard — canonical
 *
 * Returns the full enterprise dashboard payload in one optimised batch.
 */
const getSystemStats = async (req, res) => {
  try {
    const now      = new Date();
    const todayStart = startOfDay();
    const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    const prev30     = daysAgo(30);
    const prev60     = daysAgo(60);
    const sevenDaysAgo = daysAgo(6);
    const tomorrow   = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 8); // next 7 days

    // ── Single Promise.all batch — no N+1, no sequential await ───────────────
    const [
      totalUsers, totalPatients, activePatients, inactivePatients,
      totalDoctors, verifiedDoctors, pendingDoctors, totalAdmins,
      patientsToday, patientsLast30, patientsPrev30,
      doctorsLast30,
      totalAppointments, completedAppointments, cancelledAppointments, scheduledAppointments,
      appointmentsToday, appointmentsUpcoming,
      totalMeds,
      totalDoses, takenDoses, missedDoses,
      totalReports, totalPrescriptions,
      recentUsers,
    ] = await Promise.all([
      // ── User aggregates ───────────────────────────────────────────────────
      User.countDocuments({ role: { $in: allRoles } }),
      User.countDocuments({ role: { $in: patientRoles } }),
      User.countDocuments({ role: { $in: patientRoles }, isActive: true }),
      User.countDocuments({ role: { $in: patientRoles }, isActive: false }),
      User.countDocuments({ role: { $in: doctorRoles } }),
      User.countDocuments({ role: { $in: doctorRoles }, isVerifiedDoctor: 'approved' }),
      User.countDocuments({ role: { $in: doctorRoles }, isVerifiedDoctor: 'pending' }),
      User.countDocuments({ role: { $in: adminRoles } }),
      // ── Growth: today + 30d windows ───────────────────────────────────────
      User.countDocuments({ role: { $in: patientRoles }, createdAt: { $gte: todayStart, $lt: todayEnd } }),
      User.countDocuments({ role: { $in: patientRoles }, createdAt: { $gte: prev30 } }),
      User.countDocuments({ role: { $in: patientRoles }, createdAt: { $gte: prev60, $lt: prev30 } }),
      User.countDocuments({ role: { $in: doctorRoles },  createdAt: { $gte: prev30 } }),
      // ── Appointment aggregates ────────────────────────────────────────────
      Appointment.countDocuments({}),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ status: { $in: ['scheduled', 'confirmed', 'pending', 'rescheduled'] } }),
      Appointment.countDocuments({ appointmentDate: { $gte: todayStart, $lt: todayEnd } }),
      Appointment.countDocuments({ appointmentDate: { $gte: todayEnd, $lt: tomorrow }, status: { $in: ['scheduled', 'rescheduled'] } }),
      // ── Medication + dose aggregates ──────────────────────────────────────
      Medication.countDocuments({}),
      Dose.countDocuments({}),
      Dose.countDocuments({ status: 'taken' }),
      Dose.countDocuments({ status: 'missed' }),
      // ── Document aggregates ───────────────────────────────────────────────
      HealthDocument.countDocuments({ isDeleted: { $ne: true } }),
      Prescription.countDocuments({}),
      // ── Recent users (sidebar) ────────────────────────────────────────────
      User.find({ role: { $in: allRoles } })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('name email role createdAt isActive avatar'),
    ]);

    // ── Adherence rate ────────────────────────────────────────────────────────
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    // ── Growth % calculations ─────────────────────────────────────────────────
    const calcGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    const growthPatients     = calcGrowth(patientsLast30, patientsPrev30);
    const growthDoctors      = calcGrowth(doctorsLast30, 0); // no prev60 for doctors — simplified
    const growthAppointments = calcGrowth(totalAppointments, 0);

    // ── Weekly analytics (7 days) — merged aggregation pipeline ──────────────
    const [rawDoseActivity, rawApptActivity, rawUserActivity] = await Promise.all([
      Dose.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
            doses:  { $sum: 1 },
            taken:  { $sum: { $cond: [{ $eq: ['$status', 'taken'] },  1, 0] } },
            missed: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
      ]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, role: { $in: patientRoles } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const mkKey   = (r) => `${r._id.y}-${String(r._id.m).padStart(2,'0')}-${String(r._id.d).padStart(2,'0')}`;
    const doseMap = Object.fromEntries(rawDoseActivity.map(r => [mkKey(r), r]));
    const apptMap = Object.fromEntries(rawApptActivity.map(r => [mkKey(r), r.count]));
    const userMap = Object.fromEntries(rawUserActivity.map(r => [mkKey(r), r.count]));

    const weeklyAnalytics = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(); d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      weeklyAnalytics.push({
        day:          d.toLocaleDateString('en-US', { weekday: 'short' }),
        date:         d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        doses:        doseMap[key]?.doses        ?? 0,
        taken:        doseMap[key]?.taken        ?? 0,
        missed:       doseMap[key]?.missed       ?? 0,
        appointments: apptMap[key]               ?? 0,
        patients:     userMap[key]               ?? 0,
      });
    }

    // ── Monthly analytics (last 12 months) ───────────────────────────────────
    const [rawMonthlyPatients, rawMonthlyAppts] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: monthsAgo(11) }, role: { $in: patientRoles } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: monthsAgo(11) } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
    ]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyPMap = Object.fromEntries(rawMonthlyPatients.map(r => [`${r._id.y}-${r._id.m}`, r.count]));
    const monthlyAMap = Object.fromEntries(rawMonthlyAppts.map(r  => [`${r._id.y}-${r._id.m}`, r.count]));

    const monthlyAnalytics = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyAnalytics.push({
        month:        monthNames[d.getMonth()],
        year:         d.getFullYear(),
        patients:     monthlyPMap[k] ?? 0,
        appointments: monthlyAMap[k] ?? 0,
      });
    }

    // ── Recent activity feed ──────────────────────────────────────────────────
    const [recentDoses, recentAppointments] = await Promise.all([
      Dose.find({ status: 'taken' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name'),
      Appointment.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .populate('doctor', 'name'),
    ]);

    const recentActivities = [
      ...recentDoses.map(d => ({
        type: 'dose', icon: '💊',
        message: `${d.user?.name ?? 'A patient'} logged a dose`,
        time: d.createdAt,
      })),
      ...recentAppointments.map(a => ({
        type: 'appointment', icon: '📅',
        message: `Appointment with Dr. ${a.doctor?.name ?? 'Unknown'}`,
        time: a.createdAt,
      })),
      ...recentUsers.slice(0, 5).map(u => ({
        type: 'registration', icon: '👤',
        message: `${u.name} registered as ${(u.role || '').replace('ROLE_', '').toLowerCase()}`,
        time: u.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 12);

    // ── Final response — enterprise shape ─────────────────────────────────────
    res.json({
      success: true,
      data: {
        // Structured sub-objects for the new frontend shape
        patients: {
          total:    totalPatients,
          active:   activePatients,
          inactive: inactivePatients,
          today:    patientsToday,
        },
        doctors: {
          total:    totalDoctors,
          verified: verifiedDoctors,
          pending:  pendingDoctors,
        },
        appointments: {
          total:     totalAppointments,
          today:     appointmentsToday,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          scheduled: scheduledAppointments,
          upcoming:  appointmentsUpcoming,
        },
        medications: { total: totalMeds },
        doses: {
          logged:       totalDoses,
          taken:        takenDoses,
          missed:       missedDoses,
          adherenceRate,
        },
        reports:       { uploaded: totalReports },
        prescriptions: { total: totalPrescriptions },
        admins:        { total: totalAdmins },
        growth: {
          patients:     growthPatients,
          doctors:      growthDoctors,
          appointments: growthAppointments,
        },
        // Flat fields kept for backward compat with old dashboard
        totalUsers, totalPatients, activePatients, inactivePatients,
        totalDoctors, verifiedDoctors, totalAdmins,
        totalAppointments, completedAppointments, cancelledAppointments, scheduledAppointments,
        totalMeds, totalDoses, takenDoses, missedDoses, adherenceRate,
        totalReports, totalPrescriptions,
        newPatientsThisMonth: patientsLast30,
        newDoctorsThisMonth:  doctorsLast30,
        // Analytics
        weeklyAnalytics,
        monthlyAnalytics,
        activity: weeklyAnalytics, // backward compat alias
        recentUsers,
        recentActivities,
        generatedAt: now.toISOString(),
      },
    });
  } catch (e) {
    console.error('Dashboard stats error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      const roleMap = { patient: patientRoles, doctor: doctorRoles, admin: adminRoles };
      const mapped  = roleMap[role.toLowerCase()];
      filter.role   = mapped ? { $in: mapped } : { $in: [role, `ROLE_${role.toUpperCase()}`] };
    }
    if (status === 'active')    filter.isActive = true;
    if (status === 'suspended') filter.isActive = false;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .populate('assignedDoctor', 'name email specialization')
      .sort({ createdAt: -1 })
      .select('-password');

    res.json({ success: true, count: users.length, data: users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── GET /api/admin/users/:id ──────────────────────────────────────────────────
const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('assignedDoctor', 'name email specialization hospital')
      .select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [meds, doses, taken] = await Promise.all([
      Medication.countDocuments({ user: req.params.id }),
      Dose.countDocuments({ user: req.params.id }),
      Dose.countDocuments({ user: req.params.id, status: 'taken' }),
    ]);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: { meds, doses, adherenceRate: doses > 0 ? Math.round((taken / doses) * 100) : 0 },
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── PUT /api/admin/users/:id/role ─────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['patient','doctor','admin','ROLE_PATIENT','ROLE_DOCTOR','ROLE_ADMIN'];
    if (!validRoles.includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });

    const roleMap      = { patient: 'ROLE_PATIENT', doctor: 'ROLE_DOCTOR', admin: 'ROLE_ADMIN' };
    const normalizedRole = roleMap[role] || role;

    const user = await User.findByIdAndUpdate(
      req.params.id, { role: normalizedRole }, { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    invalidateCachedUser(user._id.toString());

    // 🔴 Real-time: notify all admin dashboards
    emitDashboardEvent('user.roleChanged', {
      userId: user._id, name: user.name, newRole: normalizedRole,
    });

    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── PUT /api/admin/users/:id/status ──────────────────────────────────────────
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive }, { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    invalidateCachedUser(user._id.toString());

    // 🔴 Real-time
    emitDashboardEvent('user.statusChanged', {
      userId: user._id, name: user.name, isActive,
    });

    res.json({
      success: true, data: user,
      message: isActive ? 'Account activated' : 'Account suspended',
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── PUT /api/admin/users/:id/assign-doctor ────────────────────────────────────
const assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (doctorId) {
      const doc = await User.findOne({ _id: doctorId, role: { $in: doctorRoles } });
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id, { assignedDoctor: doctorId || null }, { new: true }
    ).populate('assignedDoctor', 'name email specialization').select('-password');

    if (user) {
      invalidateCachedUser(user._id.toString());
      emitDashboardEvent('user.assignedDoctor', { userId: user._id, doctorId: doctorId || null });
    }

    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── POST /api/admin/doctors ───────────────────────────────────────────────────
const createDoctorAccount = async (req, res) => {
  try {
    const { name, email, password, specialization, licenseNumber, hospital, yearsOfExp } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user  = await User.create({ name, email, password, role: 'ROLE_DOCTOR', specialization, licenseNumber, hospital, yearsOfExp });
    const token = user.generateToken();

    // 🔴 Real-time
    emitDashboardEvent('doctor.created', {
      userId: user._id, name: user.name, specialization: user.specialization,
    });

    res.status(201).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString())
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });

    invalidateCachedUser(req.params.id.toString());

    // 🔴 Real-time
    emitDashboardEvent('user.deleted', {
      userId: req.params.id,
      role:   deleted.role,
      name:   deleted.name,
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── GET /api/admin/reports ────────────────────────────────────────────────────
const getSystemReports = async (req, res) => {
  try {
    const [
      patients, doctors, admins, active, suspended,
      prescriptions, processedRx, pendingRx,
      totalDoses, takenDoses, missedDoses, skippedDoses,
      medications,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: patientRoles } }),
      User.countDocuments({ role: { $in: doctorRoles } }),
      User.countDocuments({ role: { $in: adminRoles } }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Prescription.countDocuments({}),
      Prescription.countDocuments({ status: 'processed' }),
      Prescription.countDocuments({ status: 'pending' }),
      Dose.countDocuments({}),
      Dose.countDocuments({ status: 'taken' }),
      Dose.countDocuments({ status: 'missed' }),
      Dose.countDocuments({ status: 'skipped' }),
      Medication.find().select('name'),
    ]);

    const medCounts = {};
    medications.forEach(m => {
      const name = m.name?.trim() || 'Unknown';
      medCounts[name] = (medCounts[name] || 0) + 1;
    });
    const topMeds = Object.entries(medCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        users:         { patients, doctors, admins, active, suspended },
        medications:   { total: medications.length, topMeds },
        prescriptions: { total: prescriptions, processed: processedRx, pending: pendingRx },
        doses:         { total: totalDoses, taken: takenDoses, missed: missedDoses, skipped: skippedDoses },
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── GET /api/admin/appointments ───────────────────────────────────────────────
const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('user',   'name email phone')
      .populate('doctor', 'name email specialization hospital')
      .sort({ appointmentDate: -1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── GET /api/admin/prescriptions ──────────────────────────────────────────────
const getAdminPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('user',   'name email')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
const getAdminAuditLogs = async (req, res) => {
  try {
    let logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    if (!logs || logs.length === 0) {
      const users = await User.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('name email role createdAt isActive')
        .lean();

      logs = users.map(u => ({
        _id:       u._id,
        user:      u.name,
        email:     u.email,
        userRole:  u.role || 'patient',
        action:    `USER_ACCOUNT_INITIALIZED (${(u.role || 'patient').replace('ROLE_', '')})`,
        resource:  'Authentication',
        status:    u.isActive ? 'SUCCESS' : 'DENIED',
        timestamp: u.createdAt,
        ipAddress: '127.0.0.1',
      }));
    } else {
      logs = logs.map(l => ({
        _id: l._id,
        user: l.user?.name || l.userEmail || 'Anonymous',
        email: l.userEmail || l.user?.email || 'N/A',
        userRole: l.userRole || l.user?.role || 'user',
        action: l.action,
        resource: l.resource || 'System',
        status: l.status || 'SUCCESS',
        timestamp: l.timestamp || l.createdAt,
        ipAddress: l.ipAddress || '127.0.0.1',
        details: l.details || {},
      }));
    }

    res.json({ success: true, count: logs.length, data: logs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const getDoctors = async (req, res) => {
  req.query.role = 'doctor';
  return getAllUsers(req, res);
};

const getPatients = async (req, res) => {
  req.query.role = 'patient';
  return getAllUsers(req, res);
};

module.exports = {
  getSystemStats,
  getAllUsers,
  getUserDetail,
  updateUserRole,
  updateUserStatus,
  assignDoctor,
  createDoctorAccount,
  deleteUser,
  getSystemReports,
  getAdminAppointments,
  getAdminPrescriptions,
  getAdminAuditLogs,
  getDoctors,
  getPatients,
};
