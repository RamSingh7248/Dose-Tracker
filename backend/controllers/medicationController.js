const Medication = require('../models/Medication');
const Reminder = require('../models/Reminder');
const { emitDashboardEvent } = require('../services/socketEmitter');

const syncMedicationReminders = async (medication) => {
  try {
    if (!medication) return;
    await Reminder.deleteMany({ medication: medication._id });

    if (medication.isActive && Array.isArray(medication.times)) {
      for (const timeStr of medication.times) {
        if (!timeStr) continue;
        await Reminder.create({
          user: medication.user,
          medication: medication._id,
          member: medication.member || null,
          time: timeStr,
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          label: `${medication.name} (${medication.dosage || ''} ${medication.dosageUnit || ''})`.trim(),
          isActive: true,
          soundEnabled: true,
          voiceEnabled: true,
          browserNotifyEnabled: true,
          emailNotifyEnabled: true,
          pushNotifyEnabled: true,
        });
      }
    }
  } catch (err) {
    console.error('Failed to sync medication reminders:', err);
  }
};

// @desc    Get all medications
// @route   GET /api/medications
// @access  Private
const getMedications = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.member)    filter.member   = req.query.member;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const medications = await Medication.find(filter)
      .populate('member', 'name avatar color')
      .sort('-createdAt')
      .lean();
    res.json({ success: true, count: medications.length, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single medication
// @route   GET /api/medications/:id
// @access  Private
const getMedication = async (req, res) => {
  try {
    const medication = await Medication.findOne({ _id: req.params.id, user: req.user.id })
      .populate('member', 'name avatar color')
      .lean();
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create medication
// @route   POST /api/medications
// @access  Private
const createMedication = async (req, res) => {
  try {
    req.body.user = req.user.id;
    if (!req.body.member) req.body.member = null;

    if (req.body.name) {
      const existing = await Medication.findOne({
        user: req.user.id,
        member: req.body.member || null,
        name: req.body.name.trim(),
        isActive: true,
      }).lean();

      if (existing) {
        return res.status(200).json({
          success: true,
          data: existing,
          message: 'Existing active medication retrieved',
        });
      }
    }

    const medication = await Medication.create(req.body);

    // Sync reminders
    await syncMedicationReminders(medication);

    // 🔴 Real-time dashboard update
    emitDashboardEvent('medication.created', {
      medicationId: medication._id,
      name:         medication.name,
      userId:       req.user.id,
    });

    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update medication
// @route   PUT /api/medications/:id
// @access  Private
const updateMedication = async (req, res) => {
  try {
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });

    // Sync reminders
    await syncMedicationReminders(medication);

    // 🔴 Real-time
    emitDashboardEvent('medication.updated', { medicationId: medication._id, userId: req.user.id });

    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete medication
// @route   DELETE /api/medications/:id
// @access  Private
const deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });

    // Remove matching reminders
    await Reminder.deleteMany({ medication: req.params.id });

    // 🔴 Real-time
    emitDashboardEvent('medication.deleted', { medicationId: req.params.id, userId: req.user.id });

    res.json({ success: true, message: 'Medication removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get low stock / refill alerts
// @route   GET /api/medications/refill-alerts
// @access  Private
const getRefillAlerts = async (req, res) => {
  try {
    const medications = await Medication.find({
      user:     req.user.id,
      isActive: true,
      $expr:    { $lte: ['$pillsRemaining', '$refillThreshold'] },
    })
      .populate('member', 'name avatar color')
      .lean();
    res.json({ success: true, count: medications.length, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMedications, getMedication, createMedication, updateMedication, deleteMedication, getRefillAlerts };
