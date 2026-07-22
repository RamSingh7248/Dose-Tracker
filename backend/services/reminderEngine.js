const Reminder = require('../models/Reminder');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Dose = require('../models/Dose');
const User = require('../models/User');
const { sendNotificationEmail, buildDoseReminderEmail, buildFollowUpEmail } = require('./emailService');

let engineInterval = null;

/**
 * Enterprise Background Reminder & Notification Engine
 */
const checkAndProcessReminders = async () => {
  try {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];

    // 1. Process active reminders matching current time or snoozed time
    const reminders = await Reminder.find({
      isActive: true,
      $or: [
        { time: currentTimeStr, days: currentDay },
        { snoozedUntil: { $lte: now } },
      ],
    }).populate('medication').populate('user');

    for (const r of reminders) {
      // Check if already triggered in the last 50 seconds
      if (r.lastTriggeredAt && (now.getTime() - new Date(r.lastTriggeredAt).getTime()) < 50000) {
        continue;
      }

      if (!r.medication || !r.user) continue;

      const medName = r.medication.name;
      const dosage = `${r.medication.dosage || ''} ${r.medication.dosageUnit || ''}`.trim();
      const title = `💊 Reminder: ${medName}`;
      const message = `Time to take your scheduled dose of ${medName} (${dosage}) at ${currentTimeStr}.`;

      // Create Database Notification
      await Notification.create({
        user: r.user._id,
        title,
        message,
        type: 'medicine',
        referenceId: r.medication._id,
        referenceModel: 'Medication',
        metadata: {
          reminderId: r._id,
          time: currentTimeStr,
          soundEnabled: r.soundEnabled,
          voiceEnabled: r.voiceEnabled,
        },
      });

      // Send Email if enabled
      if (r.emailNotifyEnabled && r.user.email) {
        const mail = buildDoseReminderEmail(r.user.name, medName, dosage, currentTimeStr);
        await sendNotificationEmail({ to: r.user.email, ...mail });
      }

      // Update reminder state
      r.lastTriggeredAt = now;
      if (r.snoozedUntil) r.snoozedUntil = null; // Clear snooze after trigger
      await r.save();
    }

    // 2. Check for Missed Doses (> 30 mins overdue)
    await processMissedDoses(now, currentDay);

    // 3. Check for Upcoming Follow-ups (24 hours prior)
    await processUpcomingFollowUps(now);

    // 4. Check for Medicine Course Completion
    await processMedicineCompletions(now);

  } catch (error) {
    console.error('Reminder Engine Processing Error:', error);
  }
};

/**
 * Detect missed doses and dispatch alerts
 */
const processMissedDoses = async (now, currentDay) => {
  try {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfRange = new Date(now);
    endOfRange.setMinutes(endOfRange.getMinutes() - 30); // 30 minutes ago

    const activeReminders = await Reminder.find({ isActive: true, days: currentDay }).populate('medication').populate('user');

    for (const r of activeReminders) {
      if (!r.medication || !r.user) continue;

      const [rHour, rMin] = r.time.split(':').map(Number);
      const scheduledTime = new Date(now);
      scheduledTime.setHours(rHour, rMin, 0, 0);

      // If scheduled time was >30m ago today and hasn't been logged
      if (scheduledTime < endOfRange && scheduledTime >= startOfDay) {
        // Check if dose log exists for this time
        const doseTaken = await Dose.findOne({
          user: r.user._id,
          medication: r.medication._id,
          scheduledTime: {
            $gte: new Date(scheduledTime.getTime() - 15 * 60000),
            $lte: new Date(scheduledTime.getTime() + 15 * 60000),
          },
          status: 'taken',
        });

        if (!doseTaken) {
          // Check if missed notification already created today
          const existingNotif = await Notification.findOne({
            user: r.user._id,
            type: 'medicine',
            referenceId: r.medication._id,
            createdAt: { $gte: startOfDay },
            title: { $regex: /Missed/i },
          });

          if (!existingNotif) {
            await Notification.create({
              user: r.user._id,
              title: `⚠️ Missed Dose: ${r.medication.name}`,
              message: `You missed your scheduled dose of ${r.medication.name} at ${r.time}. Please record or adjust your schedule.`,
              type: 'medicine',
              referenceId: r.medication._id,
              referenceModel: 'Medication',
              metadata: { isMissed: true, scheduledTime: r.time },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing missed doses:', err);
  }
};

/**
 * Process upcoming follow-ups and send reminders
 */
const processUpcomingFollowUps = async (now) => {
  try {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const windowStart = new Date(tomorrow.getTime() - 30 * 60000);
    const windowEnd = new Date(tomorrow.getTime() + 30 * 60000);

    const upcomingApps = await Appointment.find({
      status: 'scheduled',
      reminderSent: false,
      appointmentDate: { $gte: windowStart, $lte: windowEnd },
    }).populate('user');

    for (const app of upcomingApps) {
      if (!app.user) continue;

      const dateStr = new Date(app.appointmentDate).toLocaleDateString();
      const title = `🩺 Follow-up Tomorrow: ${app.doctorName || app.title}`;
      const message = `Reminder: You have an appointment with ${app.doctorName || app.title} scheduled for tomorrow (${dateStr}) at ${app.appointmentTime || 'scheduled time'}.`;

      await Notification.create({
        user: app.user._id,
        title,
        message,
        type: 'followup',
        referenceId: app._id,
        referenceModel: 'Appointment',
        metadata: { appointmentTime: app.appointmentTime },
      });

      if (app.user.email) {
        const mail = buildFollowUpEmail(app.user.name, app.doctorName || app.title, dateStr, app.appointmentTime || 'scheduled time');
        await sendNotificationEmail({ to: app.user.email, ...mail });
      }

      app.reminderSent = true;
      await app.save();
    }
  } catch (err) {
    console.error('Error processing follow-up reminders:', err);
  }
};

/**
 * Process medicine course completions
 */
const processMedicineCompletions = async (now) => {
  try {
    const activeMeds = await Medication.find({ isActive: true });

    for (const med of activeMeds) {
      if (!med.startDate || !med.duration || typeof med.duration !== 'string') continue;

      // Parse duration string e.g. "5 days" or "2 weeks"
      const durationMatch = med.duration.match(/(\d+)\s*(day|week|month)/i);
      if (durationMatch) {
        const amount = parseInt(durationMatch[1], 10);
        const unit = durationMatch[2].toLowerCase();

        const endDate = new Date(med.startDate);
        if (unit.startsWith('day')) endDate.setDate(endDate.getDate() + amount);
        else if (unit.startsWith('week')) endDate.setDate(endDate.getDate() + amount * 7);
        else if (unit.startsWith('month')) endDate.setMonth(endDate.getMonth() + amount);

        if (now >= endDate) {
          // Check if completion alert already sent
          const existingNotif = await Notification.findOne({
            user: med.user,
            type: 'medicine',
            referenceId: med._id,
            title: { $regex: /Completed/i },
          });

          if (!existingNotif) {
            await Notification.create({
              user: med.user,
              title: `🎉 Medication Course Completed: ${med.name}`,
              message: `Congratulations! You have completed your prescription course for ${med.name}.`,
              type: 'medicine',
              referenceId: med._id,
              referenceModel: 'Medication',
              metadata: { courseCompleted: true },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing medicine completions:', err);
  }
};

/**
 * Start the Enterprise Reminder Engine
 */
const start = () => {
  if (engineInterval) return;
  console.log('🚀 Enterprise Reminder Engine background service initialized.');
  // Run check every 10 seconds for high precision
  engineInterval = setInterval(checkAndProcessReminders, 10000);
  // Initial check
  checkAndProcessReminders();
};

const stop = () => {
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
  }
};

module.exports = {
  start,
  stop,
  checkAndProcessReminders,
};
