import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

async function businessId(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  const row = await database.DB.prepare(
    'SELECT b.id FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1',
  ).bind(identity.subject).first<{ id: string }>();
  return row?.id ?? null;
}

type RescueContext = { appointmentId?: string; customerId?: string; customerName?: string; serviceName?: string; staffName?: string; startsAt?: string; matches?: { id: string; name: string; phone: string; contactPreference: string }[] };

export async function GET(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });

  const [signals, waiting, pendingPayments, todayBookings] = await database.DB.batch([
    database.DB.prepare("SELECT id, signal_type AS signalType, priority, summary, context_json AS contextJson, created_at AS createdAt FROM schedule_signals WHERE business_id = ? AND resolved_at IS NULL ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, created_at DESC LIMIT 20").bind(business),
    database.DB.prepare("SELECT COUNT(*) AS count FROM waitlist_entries WHERE business_id = ? AND status = 'waiting'").bind(business),
    database.DB.prepare("SELECT COUNT(*) AS count FROM payments WHERE business_id = ? AND status = 'pending'").bind(business),
    database.DB.prepare("SELECT COUNT(*) AS count FROM appointments WHERE business_id = ? AND substr(starts_at, 1, 10) = substr(?, 1, 10) AND status NOT IN ('cancelled', 'completed', 'no_show')").bind(business, new Date().toISOString()),
  ]);

  const rescueItems = signals.results.map((item) => {
    const raw = item as { id: string; signalType: string; priority: string; summary: string; contextJson: string; createdAt: string };
    let context: RescueContext = {};
    try { context = JSON.parse(raw.contextJson || '{}') as RescueContext; } catch { context = {}; }
    return { ...raw, context };
  });
  const count = (result: D1Result<unknown>) => Number((result.results[0] as { count?: number } | undefined)?.count ?? 0);
  return Response.json({
    items: rescueItems,
    pulse: { waiting: count(waiting), pendingPayments: count(pendingPayments), todayBookings: count(todayBookings) },
  });
}

export async function PATCH(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body: { id?: unknown } = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return Response.json({ error: 'Choose a rescue item.' }, { status: 400 });
  const result = await database.DB.prepare('UPDATE schedule_signals SET resolved_at = ? WHERE id = ? AND business_id = ? AND resolved_at IS NULL').bind(new Date().toISOString(), id, business).run();
  if (!result.meta.changes) return Response.json({ error: 'This rescue item is no longer available.' }, { status: 404 });
  return Response.json({ ok: true });
}
