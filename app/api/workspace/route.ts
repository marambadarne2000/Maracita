import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

export async function GET(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return Response.json({ error: 'Please sign in to view your workspace.' }, { status: 401 });

  const workspace = await database.DB.prepare(
    'SELECT b.id, b.name, b.business_type AS businessType, b.currency, b.timezone, b.status, s.plan_code AS planCode, s.trial_ends_at AS trialEndsAt FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id LEFT JOIN subscriptions s ON s.business_id = b.id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1',
  ).bind(identity.subject).first<{ id: string; name: string; businessType: string; currency: string; timezone: string; status: string; planCode: string | null; trialEndsAt: string | null }>();

  if (!workspace) return Response.json({ workspace: null });

  const now = new Date().toISOString();
  const [customers, staff, appointments, cancelled, signals, pendingPayments, alerts, nextAppointments] = await database.DB.batch([
    database.DB.prepare('SELECT COUNT(*) AS count FROM customers WHERE business_id = ?').bind(workspace.id),
    database.DB.prepare('SELECT COUNT(*) AS count FROM staff WHERE business_id = ? AND active = 1').bind(workspace.id),
    database.DB.prepare("SELECT COUNT(*) AS count FROM appointments WHERE business_id = ? AND status NOT IN ('cancelled', 'completed')").bind(workspace.id),
    database.DB.prepare("SELECT COUNT(*) AS count FROM appointments WHERE business_id = ? AND status = 'cancelled'").bind(workspace.id),
    database.DB.prepare('SELECT COUNT(*) AS count FROM schedule_signals WHERE business_id = ? AND resolved_at IS NULL').bind(workspace.id),
    database.DB.prepare("SELECT COUNT(*) AS count FROM payments WHERE business_id = ? AND status = 'pending'").bind(workspace.id),
    database.DB.prepare('SELECT id, signal_type AS signalType, priority, summary, created_at AS createdAt FROM schedule_signals WHERE business_id = ? AND resolved_at IS NULL ORDER BY CASE priority WHEN \'high\' THEN 0 ELSE 1 END, created_at DESC LIMIT 4').bind(workspace.id),
    database.DB.prepare("SELECT a.id, a.starts_at AS startsAt, a.status, c.first_name || ' ' || c.last_name AS customerName, s.full_name AS staffName, sv.name AS serviceName FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN staff s ON s.id = a.staff_id INNER JOIN services sv ON sv.id = a.service_id WHERE a.business_id = ? AND a.starts_at >= ? AND a.status NOT IN ('cancelled', 'completed', 'no_show') ORDER BY a.starts_at ASC LIMIT 3").bind(workspace.id, now),
  ]);
  const count = (result: D1Result<unknown>) => Number((result.results[0] as { count?: number } | undefined)?.count ?? 0);

  return Response.json({
    workspace,
    metrics: { customers: count(customers), staff: count(staff), appointments: count(appointments), cancelled: count(cancelled), signals: count(signals), pendingPayments: count(pendingPayments) },
    alerts: alerts.results,
    nextAppointments: nextAppointments.results,
  });
}
