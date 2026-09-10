const Medicine = require('../models/Medicine');
const Medication = require('../models/Medication');
const Dose = require('../models/Dose');

// Helper to generate Doses when a new Medicine is created
const generateDosesForMedicine = async (medicine) => {
  try {
    const times = Array.isArray(medicine.times) && medicine.times.length > 0 ? medicine.times : ['09:00 AM'];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (const timeStr of times) {
      const existing = await Dose.findOne({
        $or: [{ medicineId: medicine._id }, { medication: medicine._id }],
        scheduledTime: timeStr,
        scheduledDate: {
          $gte: new Date(todayStr),
          $lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!existing) {
        await Dose.create({
          patientId: medicine.patientId || medicine.user,
          user: medicine.patientId || medicine.user,
          medicineId: medicine._id,
          medication: medicine._id,
          scheduledTime: timeStr,
          scheduledDate: new Date(),
          status: 'Scheduled'
        });
      }
    }
  } catch (err) {
    console.error('Failed to auto-generate doses:', err);
  }
};

// @desc    Get all medicines for logged-in user
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const userId = req.user.id;
    const filter = { $or: [{ patientId: userId }, { user: userId }] };
    if (req.query.status) filter.status = req.query.status;

    let medicines = await Medicine.find(filter).sort('-createdAt').lean();
    if (medicines.length === 0) {
      medicines = await Medication.find({ user: userId }).sort('-createdAt').lean();
    }

    res.json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single medicine
// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  try {
    let medicine = await Medicine.findOne({
      _id: req.params.id,
      $or: [{ patientId: req.user.id }, { user: req.user.id }]
    }).lean();

    if (!medicine) {
      medicine = await Medication.findOne({ _id: req.params.id, user: req.user.id }).lean();
    }

    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create medicine
// @route   POST /api/medicines
// @access  Private
const createMedicine = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { name, dosage, frequency, times, startDate, endDate, instructions, status } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ success: false, message: 'Please provide medicine name and dosage' });
    }

    const medicine = await Medicine.create({
      patientId,
      user: patientId,
      name,
      dosage,
      frequency: frequency || 'once_daily',
      times: times || ['09:00 AM'],
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      instructions: instructions || '',
      status: status || 'Active'
    });

    // Also sync to Medication model for legacy compatibility
    await Medication.create({
      user: patientId,
      name,
      dosage,
      frequency: frequency || 'once_daily',
      times: times || ['09:00 AM'],
      startDate: startDate || new Date(),
      endDate: endDate || null,
      instructions: instructions || '',
      isActive: status !== 'Discontinued'
    }).catch(() => {});

    // Generate initial Doses
    await generateDosesForMedicine(medicine);

    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, $or: [{ patientId: req.user.id }, { user: req.user.id }] },
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      const medication = await Medication.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true }
      );
      if (!medication) return res.status(404).json({ success: false, message: 'Medicine not found' });
      return res.json({ success: true, data: medication });
    }

    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({
      _id: req.params.id,
      $or: [{ patientId: req.user.id }, { user: req.user.id }]
    });

    await Medication.findOneAndDelete({ _id: req.params.id, user: req.user.id }).catch(() => {});
    await Dose.deleteMany({ $or: [{ medicineId: req.params.id }, { medication: req.params.id }] }).catch(() => {});

    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine };
