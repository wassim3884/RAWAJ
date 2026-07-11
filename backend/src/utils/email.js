const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
