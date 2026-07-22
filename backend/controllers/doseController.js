const Dose = require('../models/Dose');
const Medication = require('../models/Medication');

// @desc    Get all doses (with filters)
// @route   GET /api/doses
// @access  Private
const getDoses = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.medication) filter.medication = req.query.medication;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.member) filter.member = req.query.member;
    if (req.query.from || req.query.to) {
      filter.scheduledTime = {};
      if (req.query.from) filter.scheduledTime.$gte = new Date(req.query.from);
      if (req.query.to)   filter.scheduledTime.$lte = new Date(req.query.to);
    }
    const limit = parseInt(req.query.limit) || 100;
    const doses = await Dose.find(filter)
      .populate('medication', 'name dosage dosageUnit icon color')
      .populate('member', 'name')
      .sort('-scheduledTime')
      .limit(limit);
    res.json({ success: true, count: doses.length, data: doses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a dose
// @route   POST /api/doses/log
// @access  Private
const logDose = async (req, res) => {
  try {
    const { medicationId, status, scheduledTime, notes, sideEffects, pillsTaken } = req.body;

    // Check medication belongs to user
    const med = await Medication.findOne({ _id: medicationId, user: req.user.id });
    if (!med) return res.status(404).json({ success: false, message: 'Medication not found' });

    const dose = await Dose.create({
      user: req.user.id,
      medication: medicationId,
      member: med.member || null,
      status: status || 'taken',
      scheduledTime: scheduledTime || new Date(),
      takenAt: status === 'taken' ? new Date() : null,
      notes, sideEffects,
      pillsTaken: pillsTaken || med.pillsPerDose || 1,
    });

    // Deduct pills if taken
    if (status === 'taken' && med.pillsRemaining > 0) {
      await Medication.findByIdAndUpdate(medicationId, {
        $inc: { pillsRemaining: -(pillsTaken || med.pillsPerDose || 1) }
      });
    }

    await dose.populate('medication', 'name dosage icon');
    res.status(201).json({ success: true, data: dose });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dose stats
// @route   GET /api/doses/stats
// @access  Private
const getDoseStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const doses = await Dose.find({
      user: req.user.id,
      scheduledTime: { $gte: from }
    });

    const total  = doses.length;
    const taken  = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const skipped = doses.filter(d => d.status === 'skipped').length;

    res.json({
      success: true,
      data: {
        total, taken, missed, skipped,
        adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a logged dose (undo)
// @route   DELETE /api/doses/:id
// @access  Private
const deleteDose = async (req, res) => {
  try {
    const dose = await Dose.findOne({ _id: req.params.id, user: req.user.id });
    if (!dose) return res.status(404).json({ success: false, message: 'Dose log not found' });

    // If it was 'taken', increment back the pills remaining
    if (dose.status === 'taken') {
      const med = await Medication.findById(dose.medication);
      if (med) {
        await Medication.findByIdAndUpdate(dose.medication, {
          $inc: { pillsRemaining: dose.pillsTaken }
        });
      }
    }

    await Dose.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Dose log deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDoses, logDose, getDoseStats, deleteDose };
