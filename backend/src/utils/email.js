/**
 * Sends transactional email via Resend's HTTP API (https://resend.com).
 * Using an HTTP API instead of raw SMTP avoids outbound SMTP port blocking,
 * which is common on free-tier hosts like Render.
 */
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:mock] to=${to} subject="${subject}"`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Rawaj <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${errText}`);
  }

  return response.json();
}

module.exports = { sendEmail };