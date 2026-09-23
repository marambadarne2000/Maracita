import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const planCodes = new Set(['Solo', 'Team', 'Business']);
const database = env as unknown as MaracitaRuntime;

function clean(value: unknown, maximum: number) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

export async function POST(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) {
    return Response.json({ error: 'Please sign in before creating a workspace.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { businessName?: unknown; businessType?: unknown; phone?: unknown; planCode?: unknown; timezone?: unknown; currency?: unknown };
  const businessName = clean(body?.businessName, 100);
  const businessType = clean(body?.businessType, 80);
  const phone = clean(body?.phone, 30);
  const planCode = clean(body?.planCode, 20);
  const timezone = clean(body?.timezone, 64) || 'UTC';
  const currency = clean(body?.currency, 3).toUpperCase() || 'USD';

  if (!businessName || !businessType || !phone || !planCodes.has(planCode)) {
    return Response.json({ error: 'Please complete all business details and choose a plan.' }, { status: 400 });
  }

  const fullName = identity.fullName;
  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const existingAccount = await database.DB
    .prepare('SELECT id FROM accounts WHERE auth_subject = ? OR email = ? LIMIT 1')
    .bind(identity.subject, identity.email.slice(0, 254))
    .first<{ id: string }>();

  const accountId = existingAccount?.id ?? crypto.randomUUID();
  const businessId = crypto.randomUUID();
  const subscriptionId = crypto.randomUUID();

  try {
    const statements = [];
    if (existingAccount) {
      // A local-password account may be reclaiming a workspace created before
      // local authentication existed. Its verified local session proves the email.
      statements.push(database.DB.prepare(
        'UPDATE accounts SET auth_subject = ?, full_name = ?, updated_at = ? WHERE id = ?',
      ).bind(identity.subject, fullName, now, existingAccount.id));
      const existingWorkspace = await database.DB.prepare(
        'SELECT b.id, b.name FROM businesses b INNER JOIN memberships m ON m.business_id = b.id WHERE m.account_id = ? ORDER BY b.created_at DESC LIMIT 1',
      ).bind(existingAccount.id).first<{ id: string; name: string }>();
      if (existingWorkspace) {
        await database.DB.batch(statements);
        return Response.json({ business: { id: existingWorkspace.id, name: existingWorkspace.name, planCode, trialEndsAt }, alreadyExists: true });
      }
    } else {
      statements.push(database.DB.prepare(
        'INSERT INTO accounts (id, auth_subject, email, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(accountId, identity.subject, identity.email.slice(0, 254), fullName, now, now));
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
