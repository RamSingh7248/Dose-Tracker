const Dose = require('../models/Dose');
const Medicine = require('../models/Medicine');
const Medication = require('../models/Medication');

// @desc    Get today's doses for patient
// @route   GET /api/doses/today
// @access  Private
const getTodayDoses = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let doses = await Dose.find({
      $or: [{ patientId: userId }, { user: userId }],
      $or: [
        { scheduledDate: { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ],
    })
      .populate('medicineId', 'name dosage instructions times')
      .populate('medication', 'name dosage instructions times')
      .sort('scheduledTime')
      .lean();

    // Auto generate doses for today if none exist yet for active medicines
    if (doses.length === 0) {
      const activeMeds = await Medicine.find({
        $or: [{ patientId: userId }, { user: userId }],
        status: 'Active',
      }).lean();

      for (const med of activeMeds) {
        const times = Array.isArray(med.times) && med.times.length > 0 ? med.times : ['09:00 AM'];
        for (const timeStr of times) {
          await Dose.create({
            patientId: userId,
            user: userId,
            medicineId: med._id,
            medication: med._id,
            scheduledTime: timeStr,
            scheduledDate: new Date(),
            status: 'Scheduled',
          }).catch(() => {});
        }
      }

      doses = await Dose.find({
        $or: [{ patientId: userId }, { user: userId }],
        $or: [
          { scheduledDate: { $gte: startOfDay, $lte: endOfDay } },
          { createdAt: { $gte: startOfDay, $lte: endOfDay } },
        ],
      })
        .populate('medicineId', 'name dosage instructions times')
        .populate('medication', 'name dosage instructions times')
        .sort('scheduledTime')
        .lean();
    }

    res.json({ success: true, count: doses.length, data: doses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dose history & adherence stats
// @route   GET /api/doses/history
// @access  Private
const getDoseHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const doses = await Dose.find({
      $or: [{ patientId: userId }, { user: userId }],
    })
      .populate('medicineId', 'name dosage')
      .populate('medication', 'name dosage')
      .sort('-createdAt')
      .lean();

    const total = doses.length;
    const taken = doses.filter((d) => d.status === 'Taken' || d.status === 'taken').length;
    const skipped = doses.filter((d) => d.status === 'Skipped' || d.status === 'skipped').length;
    const missed = doses.filter((d) => d.status === 'Missed' || d.status === 'missed').length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;

    res.json({
      success: true,
      stats: { total, taken, skipped, missed, adherence },
      data: doses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark dose as Taken
// @route   PUT /api/doses/:id/taken
// @access  Private
const markDoseTaken = async (req, res) => {
  try {
    const dose = await Dose.findOneAndUpdate(
      { _id: req.params.id, $or: [{ patientId: req.user.id }, { user: req.user.id }] },
      { status: 'Taken', takenAt: new Date() },
      { new: true }
    );
    if (!dose) return res.status(404).json({ success: false, message: 'Dose record not found' });
    res.json({ success: true, data: dose });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark dose as Skipped
// @route   PUT /api/doses/:id/skipped
// @access  Private
const markDoseSkipped = async (req, res) => {
  try {
    const dose = await Dose.findOneAndUpdate(
      { _id: req.params.id, $or: [{ patientId: req.user.id }, { user: req.user.id }] },
      { status: 'Skipped' },
      { new: true }
    );
    if (!dose) return res.status(404).json({ success: false, message: 'Dose record not found' });
    res.json({ success: true, data: dose });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Doctor / Admin get patient dose history
// @route   GET /api/doses/patient/:patientId
// @access  Private (Doctor/Admin)
const getPatientDoseHistory = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const doses = await Dose.find({
      $or: [{ patientId }, { user: patientId }],
    })
      .populate('medicineId', 'name dosage')
      .populate('medication', 'name dosage')
      .sort('-createdAt')
      .lean();

    const total = doses.length;
    const taken = doses.filter((d) => d.status === 'Taken' || d.status === 'taken').length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;

    res.json({
      success: true,
      stats: { total, taken, adherence },
      data: doses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generic get all doses handler for backward compatibility
const getDoses = async (req, res) => {
  return getDoseHistory(req, res);
};

module.exports = {
  getTodayDoses,
  getDoseHistory,
  markDoseTaken,
  markDoseSkipped,
  getPatientDoseHistory,
  getDoses,
};
