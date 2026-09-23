import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;
const locales = new Set(['en', 'he', 'ar', 'fr', 'ru', 'es']);

async function account(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT id, full_name AS fullName, email, preferred_locale AS preferredLocale FROM accounts WHERE auth_subject = ?').bind(identity.subject).first<{ id: string; fullName: string; email: string; preferredLocale: string }>();
}

export async function GET(request: Request) {
  const user = await account(request);
  if (!user) return Response.json({ error: 'Account not found.' }, { status: 401 });
  return Response.json({ account: user });
}

export async function POST(request: Request) {
  const user = await account(request);
  if (!user) return Response.json({ error: 'Account not found.' }, { status: 401 });
  const body: { locale?: unknown } = await request.json().catch(() => ({}));
  const locale = typeof body.locale === 'string' ? body.locale : '';
  if (!locales.has(locale)) return Response.json({ error: 'Unsupported language.' }, { status: 400 });
  await database.DB.prepare('UPDATE accounts SET preferred_locale = ?, updated_at = ? WHERE id = ?').bind(locale, new Date().toISOString(), user.id).run();
  return Response.json({ preferredLocale: locale });
}
