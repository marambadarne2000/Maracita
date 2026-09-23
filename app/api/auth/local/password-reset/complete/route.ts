import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { passwordHash, tokenHash } from '@/lib/local-auth';

const database = env as unknown as MaracitaRuntime;
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: unknown; password?: unknown };
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (token.length < 32 || password.length < 8) return Response.json({ error: 'Use a valid reset link and a password of at least 8 characters.' }, { status: 400 });
  const now = new Date().toISOString(); const hash = await tokenHash(token);
  const reset = await database.DB.prepare('SELECT id, account_id AS accountId FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').bind(hash, now).first<{ id: string; accountId: string }>();
  if (!reset) return Response.json({ error: 'This reset link has expired or was already used. Request a new one.' }, { status: 400 });
  await database.DB.batch([
    database.DB.prepare('UPDATE accounts SET password_hash = ?, updated_at = ? WHERE id = ?').bind(await passwordHash(password), now, reset.accountId),
    database.DB.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').bind(now, reset.id),
    database.DB.prepare('DELETE FROM auth_sessions WHERE account_id = ?').bind(reset.accountId),
  ]);
  return Response.json({ ok: true });
}
