let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.log('ℹ️ Nodemailer package not present; using console fallback for emails.');
}

// Initialize transporter if SMTP credentials exist in env
let transporter = null;

if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email notification for reminders, follow-ups, or alerts
 */
const sendNotificationEmail = async ({ to, subject, html, text }) => {
  try {
    if (transporter && to) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"DoseTracker Health" <no-reply@dosetracker.app>',
        to,
        subject,
        text,
        html,
      });
      console.log(`✉️ Email dispatched to ${to}: Message ID ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      // Development mode / fallback logging
      console.log(`[Email Service Sim] To: ${to} | Subject: "${subject}" | Content: ${text || subject}`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('Email Dispatch Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Template generators for DoseTracker emails
 */
const buildDoseReminderEmail = (userName, medName, dosage, timeStr) => {
  return {
    subject: `💊 Medication Reminder: ${medName} (${dosage})`,
    text: `Hi ${userName}, it's time to take your medication: ${medName} (${dosage}) scheduled for ${timeStr}. Stay healthy!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #0d0e15;">
        <div style="max-width: 500px; margin: 0 auto; background: #161926; border-radius: 12px; padding: 24px; border: 1px solid #2a2e45; color: #fff;">
          <h2 style="color: #8b5cf6; margin-top: 0;">💊 DoseTracker Reminder</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 16px;">It's time to take your scheduled medication:</p>
          <div style="background: rgba(139,92,246,0.15); border-left: 4px solid #8b5cf6; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
            <strong style="font-size: 18px; color: #a78bfa;">${medName}</strong> — ${dosage}<br/>
            <span style="color: #9ca3af; font-size: 14px;">Scheduled Time: ${timeStr}</span>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">Open DoseTracker app to mark this dose as taken.</p>
        </div>
      </div>
    `,
  };
};

const buildFollowUpEmail = (userName, doctorName, dateStr, timeStr) => {
  return {
    subject: `🩺 Appointment Reminder: Follow-up with ${doctorName}`,
    text: `Hi ${userName}, you have an upcoming doctor follow-up with ${doctorName} on ${dateStr} at ${timeStr}.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #0d0e15;">
        <div style="max-width: 500px; margin: 0 auto; background: #161926; border-radius: 12px; padding: 24px; border: 1px solid #2a2e45; color: #fff;">
          <h2 style="color: #10b981; margin-top: 0;">🩺 Doctor Follow-Up Reminder</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 16px;">You have an upcoming appointment scheduled:</p>
          <div style="background: rgba(16,185,129,0.15); border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
            <strong style="font-size: 18px; color: #34d399;">${doctorName}</strong><br/>
            <span style="color: #9ca3af; font-size: 14px;">Date: ${dateStr} at ${timeStr}</span>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">Please make sure to arrive 10 minutes prior to your scheduled time.</p>
        </div>
      </div>
    `,
  };
};

module.exports = {
  sendNotificationEmail,
  buildDoseReminderEmail,
  buildFollowUpEmail,
};
