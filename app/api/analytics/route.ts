import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

async function business(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id, b.currency FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string; currency: string }>();
}

export async function GET(request: Request) {
  const workspace = await business(request);
  if (!workspace) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const [customers, staff, appointmentStats, payments, signals, daily] = await database.DB.batch([
    database.DB.prepare('SELECT COUNT(*) AS count FROM customers WHERE business_id = ?').bind(workspace.id),
    database.DB.prepare('SELECT COUNT(*) AS count FROM staff WHERE business_id = ? AND active = 1').bind(workspace.id),
    database.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status IN ('scheduled', 'confirmed') THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed FROM appointments WHERE business_id = ?").bind(workspace.id),
    database.DB.prepare("SELECT COALESCE(SUM(amount_agorot), 0) AS revenueMinor, COUNT(*) AS count FROM payments WHERE business_id = ? AND status = 'paid'").bind(workspace.id),
    database.DB.prepare('SELECT COUNT(*) AS count FROM schedule_signals WHERE business_id = ? AND resolved_at IS NULL').bind(workspace.id),
    database.DB.prepare("SELECT substr(starts_at, 1, 10) AS date, COUNT(*) AS count FROM appointments WHERE business_id = ? GROUP BY substr(starts_at, 1, 10) ORDER BY date DESC LIMIT 7").bind(workspace.id),
  ]);
  const first = <T,>(result: D1Result<unknown>) => result.results[0] as T | undefined;
  return Response.json({
    currency: workspace.currency,
    metrics: {
      customers: Number(first<{ count?: number }>(customers)?.count ?? 0), staff: Number(first<{ count?: number }>(staff)?.count ?? 0),
      totalAppointments: Number(first<{ total?: number }>(appointmentStats)?.total ?? 0), activeAppointments: Number(first<{ active?: number }>(appointmentStats)?.active ?? 0), cancelledAppointments: Number(first<{ cancelled?: number }>(appointmentStats)?.cancelled ?? 0), completedAppointments: Number(first<{ completed?: number }>(appointmentStats)?.completed ?? 0),
      revenueMinor: Number(first<{ revenueMinor?: number }>(payments)?.revenueMinor ?? 0), paymentCount: Number(first<{ count?: number }>(payments)?.count ?? 0), openSignals: Number(first<{ count?: number }>(signals)?.count ?? 0),
    },
    daily: daily.results,
  });
}
