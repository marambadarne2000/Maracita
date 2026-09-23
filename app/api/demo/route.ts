import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;
const ids = { account: 'demo-account', business: 'demo-business', staff: 'demo-staff', service: 'demo-service', customer: 'demo-customer', appointment: 'demo-appointment', payment: 'demo-payment' };

export async function POST(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity || identity.subject !== 'demo:portfolio') return Response.json({ error: 'Demo access is required.' }, { status: 401 });
  const now = new Date().toISOString(); const start = new Date(Date.now() + 60 * 60 * 1000).toISOString(); const end = new Date(Date.now() + 90 * 60 * 1000).toISOString();
  try {
    await database.DB.batch([
      database.DB.prepare('INSERT OR IGNORE INTO accounts (id, auth_subject, email, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(ids.account, identity.subject, identity.email, identity.fullName, now, now),
      database.DB.prepare('INSERT OR IGNORE INTO businesses (id, owner_account_id, name, business_type, phone, timezone, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(ids.business, ids.account, 'Luma Studio', 'Beauty & wellness', '+1 555 014 210', 'UTC', 'USD', 'trial', now, now),
      database.DB.prepare('INSERT OR IGNORE INTO memberships (business_id, account_id, role, created_at) VALUES (?, ?, ?, ?)').bind(ids.business, ids.account, 'owner', now),
      database.DB.prepare('INSERT OR IGNORE INTO subscriptions (id, business_id, plan_code, status, trial_ends_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind('demo-subscription', ids.business, 'Team', 'trialing', new Date(Date.now() + 3 * 86400000).toISOString(), now, now),
      database.DB.prepare('INSERT OR IGNORE INTO staff (id, business_id, full_name, phone, email, calendar_color, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(ids.staff, ids.business, 'Sofia Lane', '+1 555 010 110', 'sofia@luma.example', '#c9f66b', 1, now, now),
      database.DB.prepare('INSERT OR IGNORE INTO services (id, business_id, name, duration_minutes, buffer_minutes, price_agorot, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(ids.service, ids.business, 'Signature treatment', 30, 10, 8500, 1, now, now),
      database.DB.prepare('INSERT OR IGNORE INTO customers (id, business_id, first_name, last_name, phone, email, national_id, tags, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(ids.customer, ids.business, 'Maya', 'Cohen', '+1 555 019 343', 'maya@example.com', 'DEMO-1001', 'VIP, returning', 'Portfolio demo record only.', now, now),
      database.DB.prepare('INSERT OR IGNORE INTO appointments (id, business_id, customer_id, staff_id, service_id, starts_at, ends_at, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(ids.appointment, ids.business, ids.customer, ids.staff, ids.service, start, end, 'confirmed', 'Demo appointment', now, now),
      database.DB.prepare('INSERT OR IGNORE INTO payments (id, business_id, appointment_id, customer_id, amount_agorot, currency, installments, status, provider, paid_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(ids.payment, ids.business, ids.appointment, ids.customer, 8500, 'USD', 1, 'paid', 'demo', now, now, now),
      database.DB.prepare('INSERT OR IGNORE INTO receipts (id, business_id, payment_id, receipt_number, issued_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind('demo-receipt', ids.business, ids.payment, 'DEMO-0001', now, now),
      database.DB.prepare('INSERT OR IGNORE INTO schedule_signals (id, business_id, signal_date, signal_type, priority, summary, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind('demo-signal', ids.business, now.slice(0, 10), 'feedback_ready', 'normal', 'Demo feedback follow-up is ready for Maya Cohen.', '{}', now),
    ]);
  } catch (error) {
    console.error('portfolio demo seed failed', error);
    return Response.json({ error: 'Demo data is not ready. Run npm run db:migrate:local once, then try again.' }, { status: 503 });
  }
  return Response.json({ ok: true });
}
