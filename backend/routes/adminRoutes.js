const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getSystemStats);
router.get('/reports', getSystemReports);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/assign-doctor', assignDoctor);
router.post('/doctors', createDoctorAccount);
router.delete('/users/:id', deleteUser);
router.get('/appointments', getAdminAppointments);
router.get('/prescriptions', getAdminPrescriptions);
router.get('/audit-logs', getAdminAuditLogs);

module.exports = router;
