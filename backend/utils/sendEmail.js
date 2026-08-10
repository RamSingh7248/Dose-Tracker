const nodemailer = require('nodemailer');

/**
 * Send Email via Nodemailer SMTP Transport
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || 'no-reply@dosetracker.com';
  const fromName = process.env.FROM_NAME || 'DoseTracker AI Security';

  console.log(`📧 Dispatching email request to: ${options.email} | Subject: "${options.subject}"`);

  // Check if SMTP user and pass are configured
  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials (SMTP_USER/SMTP_PASS) not configured in .env.');
    console.log(`✉️  [FALLBACK DEV EMAIL SIMULATION] To: ${options.email}`);
    console.log(`✉️  [RESET LINK]: ${options.resetUrl || options.message}`);
    // If running in development without SMTP credentials, allow testing link to print to console
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return { success: true, simulated: true };
    }
    throw new Error('SMTP email service is not configured. Please set SMTP_USER and SMTP_PASS in backend/.env');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ SMTP Email dispatch error to ${options.email}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
