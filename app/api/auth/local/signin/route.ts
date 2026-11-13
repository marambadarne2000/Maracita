import {sessionHeaders} from '@/lib/session-cookie';
import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { createSession, passwordMatches, passwordHash, tokenHash } from '@/lib/local-auth';
import { clearAuthAttempts, consumeAuthAttempt } from '@/lib/auth-rate-limit';
const database = env as unknown as MaracitaRuntime;
export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) || {}) as { email?: unknown; password?: unknown; businessNumber?: unknown; ownerId?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const key = `signin:${email || 'invalid'}`;
  const rate = await consumeAuthAttempt(database, key, { limit: 5, windowMinutes: 15 });
  if (!rate.allowed) return Response.json({ error: 'Too many sign-in attempts. Please wait before trying again.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const account = await database.DB.prepare('SELECT id, email, full_name AS fullName, password_hash AS passwordHash FROM accounts WHERE email = ?').bind(email).first<{ id: string; email: string; fullName: string; passwordHash: string | null }>();
  if (account && !account.passwordHash) return Response.json({ error: 'This older preview account has no password. Email recovery must be connected before it can be recovered securely.' }, { status: 409 });
  if (!account || !(await passwordMatches(password, account.passwordHash))) return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  const credentials = await database.DB.prepare('SELECT business_number AS businessNumber, owner_id_hash AS ownerIdHash FROM business_credentials WHERE account_id = ?').bind(account.id).all<{ businessNumber: string; ownerIdHash: string }>();
  if (credentials.results.length) {
    const number = typeof body.businessNumber === 'string' ? body.businessNumber.trim() : '';
    const ownerId = typeof body.ownerId === 'string' ? body.ownerId.trim() : '';
    const ownerIdHash = await tokenHash(`${account.id}:${ownerId}`);
    if (!credentials.results.some(item => item.businessNumber === number && item.ownerIdHash === ownerIdHash)) return Response.json({ error: 'Business number or owner ID does not match this account.' }, { status: 401 });
  }
  if(!account.passwordHash?.startsWith('scrypt$'))await database.DB.prepare('UPDATE accounts SET password_hash=?,updated_at=? WHERE id=?').bind(await passwordHash(password),new Date().toISOString(),account.id).run();
  await clearAuthAttempts(database, key);
  const accessToken = await createSession(database, account.id);
  return Response.json({ ...(request.headers.get('x-maracita-browser')==='1'?{cookieSession:true}:{access_token:accessToken}), user: { id: account.id, email: account.email, user_metadata: { full_name: account.fullName } } },{headers:sessionHeaders(request,accessToken)});
}
