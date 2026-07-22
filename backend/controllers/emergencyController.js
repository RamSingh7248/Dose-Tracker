const User = require('../models/User');
const Medication = require('../models/Medication');

// @desc    Get emergency card data
// @route   GET /api/emergency-card
// @access  Private
const getEmergencyCard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name bloodGroup allergies conditions emergencyContact phone dateOfBirth gender height weight assignedDoctor')
      .populate('assignedDoctor', 'name specialization hospital phone');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const medications = await Medication.find({ user: req.user.id, isActive: true })
      .select('name dosage dosageUnit frequency instructions')
      .limit(20);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        bloodGroup: user.bloodGroup || '',
        allergies: user.allergies || [],
        conditions: user.conditions || [],
        emergencyContact: user.emergencyContact || { name: '', phone: '', relationship: '' },
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || null,
        gender: user.gender || '',
        height: user.height || null,
        weight: user.weight || null,
        doctor: user.assignedDoctor ? {
          name: user.assignedDoctor.name,
          specialization: user.assignedDoctor.specialization || 'General Physician',
          hospital: user.assignedDoctor.hospital || 'General Clinic',
          phone: user.assignedDoctor.phone || '',
        } : null,
        hospital: user.assignedDoctor?.hospital || 'City Hospital',
        medications: medications.map(m => ({
          name: m.name,
          dosage: `${m.dosage} ${m.dosageUnit}`,
          frequency: m.frequency,
          instructions: m.instructions,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update emergency card / health profile
// @route   PUT /api/emergency-card
// @access  Private
const updateEmergencyCard = async (req, res) => {
  try {
    const allowedFields = [
      'bloodGroup', 'allergies', 'conditions',
      'emergencyContact', 'phone', 'height', 'weight',
      'dateOfBirth', 'gender',
    ];
    const update = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'height' || f === 'weight') {
          update[f] = req.body[f] !== '' && req.body[f] !== null ? Number(req.body[f]) : null;
        } else if (f === 'dateOfBirth') {
          update[f] = req.body[f] ? new Date(req.body[f]) : null;
        } else {
          update[f] = req.body[f];
        }
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true,
    })
      .select('name bloodGroup allergies conditions emergencyContact phone height weight dateOfBirth gender assignedDoctor')
      .populate('assignedDoctor', 'name specialization hospital phone');

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public QR endpoint — get emergency info
// @route   GET /api/emergency-card/qr/:userId
// @access  Public (no auth)
const getPublicEmergencyCard = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name bloodGroup allergies conditions emergencyContact phone dateOfBirth gender height weight assignedDoctor')
      .populate('assignedDoctor', 'name specialization hospital phone');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const medications = await Medication.find({ user: req.params.userId, isActive: true })
      .select('name dosage dosageUnit instructions')
      .limit(20);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        bloodGroup: user.bloodGroup || '',
        allergies: user.allergies || [],
        conditions: user.conditions || [],
        emergencyContact: user.emergencyContact || { name: '', phone: '', relationship: '' },
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || null,
        gender: user.gender || '',
        height: user.height || null,
        weight: user.weight || null,
        doctor: user.assignedDoctor ? {
          name: user.assignedDoctor.name,
          specialization: user.assignedDoctor.specialization || 'General Physician',
          hospital: user.assignedDoctor.hospital || 'General Hospital',
          phone: user.assignedDoctor.phone || '',
        } : null,
        hospital: user.assignedDoctor?.hospital || 'City Hospital',
        medications: medications.map(m => ({
          name: m.name,
          dosage: `${m.dosage} ${m.dosageUnit}`,
          instructions: m.instructions,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEmergencyCard, updateEmergencyCard, getPublicEmergencyCard };
