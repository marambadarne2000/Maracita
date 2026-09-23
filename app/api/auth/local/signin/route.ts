import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { createSession, passwordMatches } from '@/lib/local-auth';
const database = env as unknown as MaracitaRuntime;
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { email?: unknown; password?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const account = await database.DB.prepare('SELECT id, email, full_name AS fullName, password_hash AS passwordHash FROM accounts WHERE email = ?').bind(email).first<{ id: string; email: string; fullName: string; passwordHash: string | null }>();
  if (account && !account.passwordHash) return Response.json({ error: 'This older preview account has no password. Email recovery must be connected before it can be recovered securely.' }, { status: 409 });
  if (!account || !(await passwordMatches(password, account.passwordHash))) return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  const accessToken = await createSession(database, account.id);
  return Response.json({ access_token: accessToken, user: { id: account.id, email: account.email, user_metadata: { full_name: account.fullName } } });
}
