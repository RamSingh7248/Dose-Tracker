const Dose = require('../models/Dose');
const Medication = require('../models/Medication');

// @desc    Get weekly adherence breakdown
// @route   GET /api/adherence/weekly
// @access  Private
const getWeekly = async (req, res) => {
  try {
    const days = 7;
    const data = await buildBreakdown(req.user.id, days);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly adherence breakdown
// @route   GET /api/adherence/monthly
// @access  Private
const getMonthly = async (req, res) => {
  try {
    const days = 30;
    const data = await buildBreakdown(req.user.id, days);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get yearly adherence breakdown
// @route   GET /api/adherence/yearly
// @access  Private
const getYearly = async (req, res) => {
  try {
    const data = await buildYearlyBreakdown(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get health score & adherence analytics
// @route   GET /api/adherence/health-score
// @access  Private
const getHealthScore = async (req, res) => {
  try {
    const from = new Date();
    from.setDate(from.getDate() - 30);

    const doses = await Dose.find({ user: req.user.id, scheduledTime: { $gte: from } }).populate('medication', 'name dosage dosageUnit');
    const total = doses.length;
    const taken = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const skipped = doses.filter(d => d.status === 'skipped').length;

    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 100;
    const completionRate = total > 0 ? Math.round(((taken + skipped) / total) * 100) : 100;

    // Health score calculation:
    // Base: adherence rate (0-100)
    // Penalty: -2 per missed dose (capped at -30)
    // Bonus: +5 for >= 90% adherence, +10 for 100%
    let score = adherenceRate;
    score -= Math.min(missed * 2, 30);
    if (adherenceRate >= 100) score += 10;
    else if (adherenceRate >= 90) score += 5;
    score = Math.max(0, Math.min(100, score));

    // Current streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayDoses = doses.filter(dose => dose.scheduledTime?.toISOString().startsWith(dStr));
      if (dayDoses.length === 0) break;
      const allTaken = dayDoses.every(dose => dose.status === 'taken');
      if (allTaken) streak++;
      else break;
    }

    // Active medications
    const activeMeds = await Medication.countDocuments({ user: req.user.id, isActive: true });

    // Missed dose list
    const missedDosesList = doses
      .filter(d => d.status === 'missed')
      .slice(0, 5)
      .map(d => ({
        _id: d._id,
        medName: d.medication?.name || 'Medication',
        dosage: d.medication ? `${d.medication.dosage} ${d.medication.dosageUnit}` : '',
        scheduledTime: d.scheduledTime,
      }));

    res.json({
      success: true,
      data: {
        healthScore: score,
        adherenceRate,
        completionRate,
        total,
        taken,
        missed,
        skipped,
        streak,
        activeMeds,
        period: '30 days',
        missedDosesList,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Helpers ──

async function buildBreakdown(userId, days) {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  const doses = await Dose.find({
    user: userId,
    scheduledTime: { $gte: from },
  }).populate('medication', 'name icon color dosage dosageUnit');

  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayDoses = doses.filter(dose => dose.scheduledTime?.toISOString().startsWith(dStr));
    const taken = dayDoses.filter(dose => dose.status === 'taken').length;
    const missed = dayDoses.filter(dose => dose.status === 'missed').length;
    const skipped = dayDoses.filter(dose => dose.status === 'skipped').length;
    const total = dayDoses.length;
    daily.push({
      date: dStr,
      label: dayLabel,
      taken,
      missed,
      skipped,
      total,
      rate: total > 0 ? Math.round((taken / total) * 100) : 100,
      completionRate: total > 0 ? Math.round(((taken + skipped) / total) * 100) : 100,
    });
  }

  const totalDoses = doses.length;
  const totalTaken = doses.filter(d => d.status === 'taken').length;
  const totalMissed = doses.filter(d => d.status === 'missed').length;
  const totalSkipped = doses.filter(d => d.status === 'skipped').length;

  // Per-medication breakdown
  const medMap = {};
  doses.forEach(d => {
    const medId = d.medication?._id?.toString();
    if (!medId) return;
    if (!medMap[medId]) {
      medMap[medId] = {
        medication: d.medication,
        taken: 0,
        missed: 0,
        skipped: 0,
        total: 0,
      };
    }
    medMap[medId].total++;
    if (d.status === 'taken') medMap[medId].taken++;
    if (d.status === 'missed') medMap[medId].missed++;
    if (d.status === 'skipped') medMap[medId].skipped++;
  });

  const perMedication = Object.values(medMap).map(m => ({
    ...m,
    rate: m.total > 0 ? Math.round((m.taken / m.total) * 100) : 100,
    completionRate: m.total > 0 ? Math.round(((m.taken + m.skipped) / m.total) * 100) : 100,
  }));

  return {
    daily,
    summary: {
      total: totalDoses,
      taken: totalTaken,
      missed: totalMissed,
      skipped: totalSkipped,
      adherenceRate: totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 100,
      completionRate: totalDoses > 0 ? Math.round(((totalTaken + totalSkipped) / totalDoses) * 100) : 100,
    },
    perMedication,
  };
}

async function buildYearlyBreakdown(userId) {
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const doses = await Dose.find({
    user: userId,
    scheduledTime: { $gte: from },
  });

  const monthly = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const year = d.getFullYear();
    const month = d.getMonth();

    const monthDoses = doses.filter(dose => {
      const dd = new Date(dose.scheduledTime);
      return dd.getFullYear() === year && dd.getMonth() === month;
    });

    const taken = monthDoses.filter(dose => dose.status === 'taken').length;
    const missed = monthDoses.filter(dose => dose.status === 'missed').length;
    const skipped = monthDoses.filter(dose => dose.status === 'skipped').length;
    const total = monthDoses.length;

    monthly.push({
      label: monthStr,
      taken,
      missed,
      skipped,
      total,
      rate: total > 0 ? Math.round((taken / total) * 100) : 100,
      completionRate: total > 0 ? Math.round(((taken + skipped) / total) * 100) : 100,
    });
  }

  const totalDoses = doses.length;
  const totalTaken = doses.filter(d => d.status === 'taken').length;
  const totalSkipped = doses.filter(d => d.status === 'skipped').length;

  return {
    monthly,
    summary: {
      total: totalDoses,
      taken: totalTaken,
      missed: doses.filter(d => d.status === 'missed').length,
      skipped: totalSkipped,
      adherenceRate: totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 100,
      completionRate: totalDoses > 0 ? Math.round(((totalTaken + totalSkipped) / totalDoses) * 100) : 100,
    },
  };
}

module.exports = { getWeekly, getMonthly, getYearly, getHealthScore };
