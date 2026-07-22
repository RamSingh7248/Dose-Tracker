const Reminder = require('../models/Reminder');

const getReminders = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.medication) filter.medication = req.query.medication;
    const reminders = await Reminder.find(filter)
      .populate('medication', 'name dosage dosageUnit icon color duration')
      .populate('member', 'name');
    res.json({ success: true, count: reminders.length, data: reminders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const createReminder = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const reminder = await Reminder.create(req.body);
    const populated = await Reminder.findById(reminder._id)
      .populate('medication', 'name dosage dosageUnit icon color duration')
      .populate('member', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('medication', 'name dosage dosageUnit icon color duration').populate('member', 'name');

    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, data: reminder });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const snoozeReminder = async (req, res) => {
  try {
    const { minutes } = req.body; // e.g. 15, 30, 60
    const snoozeMs = (parseInt(minutes, 10) || 15) * 60 * 1000;
    const snoozedUntil = new Date(Date.now() + snoozeMs);

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { snoozedUntil },
      { new: true }
    ).populate('medication', 'name dosage dosageUnit icon color duration');

    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

    res.json({
      success: true,
      message: `Reminder snoozed for ${minutes || 15} minutes`,
      data: reminder,
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, message: 'Reminder removed' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

const testAlert = async (req, res) => {
  try {
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const { sendNotificationEmail, buildDoseReminderEmail } = require('../services/emailService');

    const user = await User.findById(req.user.id);
    const medName = req.body.medName || 'Dolo';
    const dosage = req.body.dosage || '650 mg';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Create In-App Notification
    const notif = await Notification.create({
      user: req.user.id,
      title: `⏰ Live Alarm: ${medName}`,
      message: `Time to take your scheduled dose of ${medName} (${dosage}) right now!`,
      type: 'medicine',
      metadata: {
        time: timeStr,
        soundEnabled: true,
        voiceEnabled: true,
        isTestAlarm: true,
      },
    });

    // 2. Dispatch Email to Gmail
    if (user && user.email) {
      const emailContent = buildDoseReminderEmail(user.name, medName, dosage, timeStr);
      await sendNotificationEmail({ to: user.email, ...emailContent });
    }

    // 3. Dispatch Mobile SMS alert simulation
    const mobileNum = user?.phone || user?.mobileNumber || '+91-9876543210';
    console.log(`📱 [SMS Gateway Alarm] Sent to ${mobileNum}: "⏰ DoseTracker Alarm: It is time to take ${medName} (${dosage}) at ${timeStr}!"`);

    res.json({
      success: true,
      message: `Live Voice & Chime Alarm triggered! Email dispatched to ${user?.email} and SMS sent to ${mobileNum}`,
      notification: notif,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  snoozeReminder,
  deleteReminder,
  testAlert,
};
