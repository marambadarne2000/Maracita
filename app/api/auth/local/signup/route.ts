import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { createSession, passwordHash } from '@/lib/local-auth';
const database = env as unknown as MaracitaRuntime;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { email?: unknown; password?: unknown; fullName?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : '';
  if (!emailPattern.test(email) || password.length < 8 || !fullName) return Response.json({ error: 'Enter your name, a valid email, and a password of at least 8 characters.' }, { status: 400 });
  const existing = await database.DB.prepare('SELECT id, password_hash AS passwordHash FROM accounts WHERE email = ?').bind(email).first<{ id: string; passwordHash: string | null }>();
  if (existing?.passwordHash) return Response.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
  if (existing) return Response.json({ error: 'This is an older preview account without a password. Connect email recovery to reclaim it safely, or have its owner remove the old workspace before signing up again.' }, { status: 409 });
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  await database.DB.prepare('INSERT INTO accounts (id, auth_subject, email, full_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, `local:${id}`, email, fullName, await passwordHash(password), now, now).run();
  const accessToken = await createSession(database, id);
  return Response.json({ access_token: accessToken, user: { id, email, user_metadata: { full_name: fullName } } }, { status: 201 });
}
