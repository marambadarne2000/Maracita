import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { randomToken, tokenHash } from '@/lib/local-auth';

const database = env as unknown as MaracitaRuntime;
const mail = env as unknown as { RESEND_API_KEY?: string; EMAIL_FROM?: string };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { email?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
  if (!emailPattern.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  const account = await database.DB.prepare('SELECT id, full_name AS fullName FROM accounts WHERE email = ?').bind(email).first<{ id: string; fullName: string }>();
  if (!account) return Response.json({ ok: true });
  if (!mail.RESEND_API_KEY) return Response.json({ error: 'Email delivery is not configured yet.' }, { status: 503 });
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  await database.DB.prepare('DELETE FROM password_reset_tokens WHERE account_id = ? OR expires_at <= ?').bind(account.id, now.toISOString()).run();
  await database.DB.prepare('INSERT INTO password_reset_tokens (id, account_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), account.id, await tokenHash(token), expiresAt, now.toISOString()).run();
  const resetUrl = new URL('/', request.url); resetUrl.searchParams.set('reset', token);
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${mail.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: mail.EMAIL_FROM || 'Maracita <onboarding@resend.dev>', to: [email], subject: 'Reset your Maracita password', html: `<p>Hello ${account.fullName || 'there'},</p><p>Use this secure link to choose a new Maracita password. It expires in 30 minutes.</p><p><a href="${resetUrl.toString()}">Reset my password</a></p><p>If you did not request this, you can ignore this email.</p>` }) });
  if (!response.ok) { await database.DB.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?').bind(await tokenHash(token)).run(); return Response.json({ error: 'We could not send the reset email. Check the email-delivery settings and try again.' }, { status: 502 }); }
  return Response.json({ ok: true });
}
