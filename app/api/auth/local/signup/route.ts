import {sessionHeaders} from '@/lib/session-cookie';
import {POLICY_VERSION} from '@/lib/operations';
import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { createSession, passwordHash, tokenHash } from '@/lib/local-auth';
import { clearAuthAttempts, consumeAuthAttempt } from '@/lib/auth-rate-limit';
import { registrationError } from '@/lib/business-registration';
const database = env as unknown as MaracitaRuntime;
export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) || {}) as Record<string, unknown>;
  const error = registrationError(body);
  if (error) return Response.json({ error }, { status: 400 });if(body.acceptedTerms!==true)return Response.json({error:'Read and accept the Terms and Privacy Notice before creating an account.'},{status:400});
  const s = (key: string) => (body[key] as string).trim();
  const email = s('email').toLowerCase();
  const key = `signup:${email}`;
  const rate = await consumeAuthAttempt(database, key, { limit: 5, windowMinutes: 15 });
  if (!rate.allowed) return Response.json({ error: 'Too many account requests. Please try again later.' }, { status: 429 });
  const existing = await database.DB.prepare('SELECT id FROM accounts WHERE email = ?').bind(email).first();
  const usedBusiness = await database.DB.prepare('SELECT business_id FROM business_credentials WHERE business_number = ?').bind(s('businessNumber')).first();
  if (existing || usedBusiness) return Response.json({ error: 'An account or business with these details already exists. Sign in or recover your account.' }, { status: 409 });
  const id = crypto.randomUUID(), businessId = crypto.randomUUID(), now = new Date().toISOString();
  try {
    await database.DB.batch([
      database.DB.prepare('INSERT INTO accounts (id, auth_subject, email, full_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, `local:${id}`, email, s('fullName'), await passwordHash(body.password as string), now, now),
      database.DB.prepare('INSERT INTO businesses (id, owner_account_id, name, business_type, phone, timezone, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(businessId, id, s('businessName'), s('businessType'), s('phone'), s('timezone'), s('currency'), 'active', now, now),
      database.DB.prepare('INSERT INTO policy_acceptances(account_id,version,accepted_at) VALUES(?,?,?)').bind(id,POLICY_VERSION,now),
      database.DB.prepare('INSERT INTO memberships (business_id, account_id, role, created_at) VALUES (?, ?, ?, ?)').bind(businessId, id, 'owner', now),
      database.DB.prepare('INSERT INTO subscriptions (id, business_id, plan_code, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), businessId, 'Free', 'active', now, now),
      database.DB.prepare('INSERT INTO business_credentials (business_id, account_id, business_number, owner_id_hash, city, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(businessId, id, s('businessNumber'), await tokenHash(`${id}:${s('ownerId')}`), s('city'), s('address'), now),
    ]);
  } catch { return Response.json({ error: 'Registration could not be completed. Please check the details and try again.' }, { status: 409 }); }
  await clearAuthAttempts(database, key);
  const accessToken = await createSession(database, id);
  return Response.json({ ...(request.headers.get('x-maracita-browser')==='1'?{cookieSession:true}:{access_token:accessToken}), user: { id, email, user_metadata: { full_name: s('fullName') } } }, { status: 201,headers:sessionHeaders(request,accessToken) });
}
