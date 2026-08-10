const nodemailer = require('nodemailer');

let transporter = null;

function initializeTransporter() {
  if (transporter) return;

  if (process.env.RESEND_API_KEY) {
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
    console.log('[Email] Configured: Resend SMTP');
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Email] Configured: SMTP');
  } else {
    console.warn('[Email] WARNING: No email provider configured.');
    transporter = null;
  }
}

async function sendEmail(to, subject, htmlContent) {
  if (!process.env.EMAIL_FROM) {
    console.error('[Email] EMAIL_FROM not configured');
    return false;
  }

  try {
    initializeTransporter();
    if (!transporter) {
      console.warn('[Email] Service not configured. Skipping send.');
      return false;
    }

    await Promise.race([
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html: htmlContent,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email timeout')), 30000)
      ),
    ]);

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    return false;
  }
}

function emailVerificationTemplate(verificationUrl, userName) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;background:#f5f5f5}.container{max-width:600px;margin:0 auto;padding:20px}.card{background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #1a5f7a;padding-bottom:20px}.logo{font-size:28px;font-weight:bold;color:#1a5f7a;margin-bottom:10px}.title{font-size:20px;color:#333}.content{margin:20px 0;text-align:right}.content p{margin:15px 0}.cta-button{display:inline-block;padding:14px 32px;background:#1a5f7a;color:#fff!important;text-decoration:none;border-radius:6px;margin:25px 0;font-weight:600}.link-fallback{word-break:break-all;font-size:11px;color:#666;background:#f9f9f9;padding:10px;border-radius:4px;margin:15px 0;font-family:monospace}.warning{background:#fff8dc;border-left:4px solid #ffc107;padding:12px;margin:15px 0;font-size:13px;text-align:right}.footer{text-align:center;font-size:11px;color:#999;margin-top:40px;border-top:1px solid #eee;padding-top:20px}.footer p{margin:5px 0}</style>
</head>
<body><div class="container"><div class="card"><div class="header"><div class="logo">رواج</div><div class="title">تحقق من عنوان بريدك</div></div><div class="content"><p>السلام عليكم،</p><p>مرحباً <strong>${userName}</strong> 👋</p><p>شكراً لك على الانضمام إلى <strong>رواج</strong>!</p><p>لتفعيل حسابك، يرجى تأكيد عنوان بريدك:</p><a href="${verificationUrl}" class="cta-button">✓ تحقق من البريد</a><p style="font-size:12px;color:#666">أو انسخ الرابط:</p><div class="link-fallback">${verificationUrl}</div><div class="warning">⚠️ لا تشارك هذا مع أحد. صالح لمدة 24 ساعة فقط.</div></div><div class="footer"><p><strong>رواج</strong> - منصة التسويق بالعمولة</p><p>© 2024 جميع الحقوق محفوظة</p></div></div></div></body></html>`;
}

function passwordResetTemplate(resetUrl, userName) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;background:#f5f5f5}.container{max-width:600px;margin:0 auto;padding:20px}.card{background:#fff;border-radius:8px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.1)}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #d9534f;padding-bottom:20px}.logo{font-size:28px;font-weight:bold;color:#d9534f;margin-bottom:10px}.title{font-size:20px;color:#333}.content{margin:20px 0;text-align:right}.content p{margin:15px 0}.cta-button{display:inline-block;padding:14px 32px;background:#d9534f;color:#fff!important;text-decoration:none;border-radius:6px;margin:25px 0;font-weight:600}.link-fallback{word-break:break-all;font-size:11px;color:#666;background:#f9f9f9;padding:10px;border-radius:4px;margin:15px 0;font-family:monospace}.security{background:#f8d7da;border-left:4px solid #f5c6cb;padding:12px;margin:15px 0;font-size:13px;text-align:right}.footer{text-align:center;font-size:11px;color:#999;margin-top:40px;border-top:1px solid #eee;padding-top:20px}.footer p{margin:5px 0}</style>
</head>
<body><div class="container"><div class="card"><div class="header"><div class="logo">رواج</div><div class="title">إعادة تعيين كلمة المرور</div></div><div class="content"><p>السلام عليكم،</p><p>مرحباً <strong>${userName}</strong></p><p>لقد طلبت إعادة تعيين كلمة المرور. انقر أدناه:</p><a href="${resetUrl}" class="cta-button">🔐 إعادة تعيين</a><p style="font-size:12px;color:#666">أو انسخ الرابط:</p><div class="link-fallback">${resetUrl}</div><div class="security">🔒 صالح لمدة ساعة واحدة فقط. لم تطلب هذا؟ تجاهل البريد.</div></div><div class="footer"><p><strong>رواج</strong> - منصة التسويق بالعمولة</p><p>© 2024</p></div></div></div></body></html>`;
}

module.exports = {
  sendEmail,
  emailVerificationTemplate,
  passwordResetTemplate,
};
