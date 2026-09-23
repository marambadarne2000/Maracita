import { env } from 'cloudflare:workers';

type MailRuntime = { RESEND_API_KEY?: string; EMAIL_FROM?: string };

export function emailHtml(message: string) {
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  return escape(message).split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replaceAll('\n', '<br />')}</p>`).join('');
}

export async function sendEmail(to: string, subject: string, message: string) {
  const mail = env as unknown as MailRuntime;
  if (!mail.RESEND_API_KEY) return { ok: false, error: 'Email delivery is not configured.' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mail.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: mail.EMAIL_FROM || 'Maracita <onboarding@resend.dev>', to: [to], subject, text: message, html: emailHtml(message) }),
  });
  if (!response.ok) return { ok: false, error: 'The email provider could not deliver this message. Check the sender settings.' };
  return { ok: true };
}
