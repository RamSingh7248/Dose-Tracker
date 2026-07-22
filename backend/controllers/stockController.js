const Medication = require('../models/Medication');
const Dose = require('../models/Dose');

// @desc    Get stock predictions for all active medications
// @route   GET /api/stock/predictions
// @access  Private
const getPredictions = async (req, res) => {
  try {
    const medications = await Medication.find({ user: req.user.id, isActive: true })
      .populate('member', 'name')
      .sort('-createdAt');

    const predictions = await Promise.all(
      medications.map(async (med) => {
        // Calculate average daily consumption from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentDoses = await Dose.find({
          medication: med._id,
          user: req.user.id,
          status: 'taken',
          scheduledTime: { $gte: thirtyDaysAgo },
        });

        const totalPillsTaken = recentDoses.reduce((sum, d) => sum + (d.pillsTaken || 1), 0);
        const daysCovered = Math.min(30, Math.ceil((Date.now() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyConsumption = daysCovered > 0 ? totalPillsTaken / daysCovered : med.pillsPerDose || 1;

        // Predict days until empty
        const daysUntilEmpty = dailyConsumption > 0 ? Math.floor(med.pillsRemaining / dailyConsumption) : null;
        const refillDate = daysUntilEmpty !== null ? new Date(Date.now() + daysUntilEmpty * 24 * 60 * 60 * 1000) : null;

        // Status determination
        let stockStatus = 'good';
        if (med.pillsRemaining <= 0) stockStatus = 'empty';
        else if (med.pillsRemaining <= med.refillThreshold) stockStatus = 'low';
        else if (daysUntilEmpty !== null && daysUntilEmpty <= 7) stockStatus = 'warning';

        return {
          _id: med._id,
          name: med.name,
          icon: med.icon,
          color: med.color,
          dosage: `${med.dosage} ${med.dosageUnit}`,
          pillsRemaining: med.pillsRemaining,
          refillThreshold: med.refillThreshold,
          pillsPerDose: med.pillsPerDose,
          dailyConsumption: Math.round(dailyConsumption * 10) / 10,
          daysUntilEmpty,
          refillDate: refillDate?.toISOString().split('T')[0] || null,
          stockStatus,
          member: med.member,
        };
      })
    );

    // Sort: empty first, then low, then warning, then good
    const statusOrder = { empty: 0, low: 1, warning: 2, good: 3 };
    predictions.sort((a, b) => statusOrder[a.stockStatus] - statusOrder[b.stockStatus]);

    res.json({ success: true, count: predictions.length, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restock a medication
// @route   PUT /api/stock/:id/restock
// @access  Private
const restock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Provide a valid quantity' });
    }

    const med = await Medication.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $inc: { pillsRemaining: quantity } },
      { new: true }
    );
    if (!med) return res.status(404).json({ success: false, message: 'Medication not found' });

    res.json({ success: true, data: med, message: `Added ${quantity} pills. Now ${med.pillsRemaining} remaining.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPredictions, restock };
