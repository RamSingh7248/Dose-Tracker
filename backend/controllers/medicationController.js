const Medication = require('../models/Medication');

// @desc    Get all medications
// @route   GET /api/medications
// @access  Private
const getMedications = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.member) filter.member = req.query.member;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const medications = await Medication.find(filter).populate('member', 'name avatar color').sort('-createdAt');
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
    const medication = await Medication.findOne({ _id: req.params.id, user: req.user.id }).populate('member', 'name avatar color');
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
    const medication = await Medication.create(req.body);
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
      user: req.user.id,
      isActive: true,
      $expr: { $lte: ['$pillsRemaining', '$refillThreshold'] },
    }).populate('member', 'name avatar color');
    res.json({ success: true, count: medications.length, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMedications, getMedication, createMedication, updateMedication, deleteMedication, getRefillAlerts };
