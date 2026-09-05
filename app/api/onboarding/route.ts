import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';

const planCodes = new Set(['Solo', 'Team', 'Business']);
const database = env as unknown as MaracitaRuntime;

function clean(value: unknown, maximum: number) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

export async function POST(request: Request) {
  const identity = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  const encodedName = request.headers.get('oai-authenticated-user-full-name');
  const nameEncoding = request.headers.get('oai-authenticated-user-full-name-encoding');

  if (!identity || !email) {
    return Response.json({ error: 'Please sign in before creating a workspace.' }, { status: 401 });
  }

  const body: { businessName?: unknown; businessType?: unknown; phone?: unknown; planCode?: unknown; timezone?: unknown; currency?: unknown } = await request.json().catch(() => ({}));
  const businessName = clean(body?.businessName, 100);
  const businessType = clean(body?.businessType, 80);
  const phone = clean(body?.phone, 30);
  const planCode = clean(body?.planCode, 20);
  const timezone = clean(body?.timezone, 64) || 'UTC';
  const currency = clean(body?.currency, 3).toUpperCase() || 'USD';

  if (!businessName || !businessType || !phone || !planCodes.has(planCode)) {
    return Response.json({ error: 'Please complete all business details and choose a plan.' }, { status: 400 });
  }

  const fullName = nameEncoding === 'percent-encoded-utf-8' && encodedName
    ? decodeURIComponent(encodedName).slice(0, 120)
    : email.split('@')[0].slice(0, 120);
  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const existingAccount = await database.DB
    .prepare('SELECT id FROM accounts WHERE auth_subject = ?')
    .bind(identity)
    .first<{ id: string }>();

  const accountId = existingAccount?.id ?? crypto.randomUUID();
  const businessId = crypto.randomUUID();
  const subscriptionId = crypto.randomUUID();

  try {
    const statements = [];
    if (!existingAccount) {
      statements.push(database.DB.prepare(
        'INSERT INTO accounts (id, auth_subject, email, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(accountId, identity, email.slice(0, 254), fullName, now, now));
    }
    statements.push(
      database.DB.prepare(
        'INSERT INTO businesses (id, owner_account_id, name, business_type, phone, timezone, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(businessId, accountId, businessName, businessType, phone, timezone, currency, 'trial', now, now),
      database.DB.prepare(
        'INSERT INTO memberships (business_id, account_id, role, created_at) VALUES (?, ?, ?, ?)',
      ).bind(businessId, accountId, 'owner', now),
      database.DB.prepare(
        'INSERT INTO subscriptions (id, business_id, plan_code, status, trial_ends_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).bind(subscriptionId, businessId, planCode, 'trialing', trialEndsAt, now, now),
    );
    await database.DB.batch(statements);
  } catch (error) {
    console.error('workspace onboarding failed', error);
    return Response.json({ error: 'We could not create your workspace. Please try again.' }, { status: 500 });
  }

  return Response.json({
    business: { id: businessId, name: businessName, planCode, trialEndsAt },
  }, { status: 201 });
}
