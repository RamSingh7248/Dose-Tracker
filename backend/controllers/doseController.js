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

// @desc    Log or update a dose record (Taken, Skipped, Missed, Pending)
// @route   POST /api/doses/log or POST /api/doses
// @access  Private
const logDose = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicationId, medicineId, status = 'taken', scheduledTime, notes = '' } = req.body;

    const medId = medicationId || medicineId;
    if (!medId) {
      return res.status(400).json({ success: false, message: 'medicationId is required' });
    }

    const scheduledDate = scheduledTime ? new Date(scheduledTime) : new Date();
    const isTaken = status.toLowerCase() === 'taken';
    const isPending = status.toLowerCase() === 'pending';

    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Look for existing dose today for this medication
    let dose = await Dose.findOne({
      $or: [{ patientId: userId }, { user: userId }],
      $or: [{ medicineId: medId }, { medication: medId }],
      $or: [
        { scheduledTime: scheduledTime || { $exists: true } },
        { scheduledDate: { $gte: startOfDay, $lte: endOfDay } },
      ],
    });

    const previousStatus = dose ? (dose.status || '').toLowerCase() : null;

    if (dose) {
      dose.status = status;
      if (scheduledTime) dose.scheduledTime = scheduledTime;
      dose.takenAt = isTaken ? new Date() : null;
      if (notes) dose.notes = notes;
      await dose.save();
    } else {
      dose = await Dose.create({
        patientId: userId,
        user: userId,
        medicineId: medId,
        medication: medId,
        scheduledTime: scheduledTime || new Date().toISOString(),
        scheduledDate,
        status,
        takenAt: isTaken ? new Date() : null,
        notes,
      });
    }

    // Inventory management: decrement if taken, restore if undone from taken to pending
    const med = await Medication.findOne({ _id: medId, user: userId });
    if (med && typeof med.pillsRemaining === 'number') {
      const perDose = med.pillsPerDose || 1;
      if (isTaken && previousStatus !== 'taken') {
        med.pillsRemaining = Math.max(0, med.pillsRemaining - perDose);
        await med.save();
      } else if (isPending && previousStatus === 'taken') {
        med.pillsRemaining = med.pillsRemaining + perDose;
        await med.save();
      }
    }

    const populated = await Dose.findById(dose._id)
      .populate('medicineId', 'name dosage')
      .populate('medication', 'name dosage times');

    res.status(200).json({ success: true, data: populated || dose });
  } catch (error) {
    console.error('logDose error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dose stats (adherence rate, counts)
// @route   GET /api/doses/stats
// @access  Private
const getDoseStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const doses = await Dose.find({
      $or: [{ patientId: userId }, { user: userId }],
      $or: [
        { scheduledDate: { $gte: startDate } },
        { createdAt: { $gte: startDate } },
      ],
    }).lean();

    const total = doses.length;
    const taken = doses.filter(d => (d.status || '').toLowerCase() === 'taken').length;
    const skipped = doses.filter(d => (d.status || '').toLowerCase() === 'skipped').length;
    const missed = doses.filter(d => (d.status || '').toLowerCase() === 'missed').length;
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 100;

    res.json({
      success: true,
      data: {
        total,
        taken,
        skipped,
        missed,
        adherenceRate,
        days,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a dose record (e.g. undo dose log)
// @route   DELETE /api/doses/:id
// @access  Private
const deleteDose = async (req, res) => {
  try {
    const dose = await Dose.findOneAndDelete({
      _id: req.params.id,
      $or: [{ patientId: req.user.id }, { user: req.user.id }],
    });
    if (!dose) return res.status(404).json({ success: false, message: 'Dose not found' });
    res.json({ success: true, message: 'Dose record removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all doses with optional date filtering
// @route   GET /api/doses
// @access  Private
const getDoses = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = {
      $or: [{ patientId: userId }, { user: userId }],
    };

    if (req.query.from || req.query.to) {
      const dateFilter = {};
      if (req.query.from) dateFilter.$gte = new Date(req.query.from);
      if (req.query.to) dateFilter.$lte = new Date(req.query.to);
      query.$and = [
        {
          $or: [
            { scheduledDate: dateFilter },
            { createdAt: dateFilter },
          ],
        },
      ];
    }

    const doses = await Dose.find(query)
      .populate('medicineId', 'name dosage')
      .populate('medication', 'name dosage times')
      .sort('-createdAt')
      .lean();

    res.json({ success: true, data: doses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTodayDoses,
  getDoseHistory,
  getDoseStats,
  markDoseTaken,
  markDoseSkipped,
  logDose,
  deleteDose,
  getPatientDoseHistory,
  getDoses,
};
