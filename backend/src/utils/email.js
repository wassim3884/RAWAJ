const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false (STARTTLS) for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (!process.env.SMTP_HOST) {
  console.warn(
    '⚠️  SMTP_HOST is not set — verification emails will NOT be sent to users, only logged here. ' +
    'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM to enable real email delivery.'
  );
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[email:mock] to=${to} subject="${subject}"`);
    return;
  }
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@rawaj.com',
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
