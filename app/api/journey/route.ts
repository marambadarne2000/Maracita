import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

async function businessId(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id, b.currency FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string; currency: string }>();
}

export async function GET(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const [appointments, pendingSurvey, openPayments] = await database.DB.batch([
    database.DB.prepare("SELECT a.id, a.starts_at AS startsAt, a.ends_at AS endsAt, a.status, a.arrived_at AS arrivedAt, c.id AS customerId, c.first_name || ' ' || c.last_name AS customerName, s.full_name AS staffName, sv.name AS serviceName, sv.price_agorot AS priceMinor, p.id AS paymentId, p.status AS paymentStatus, p.paid_at AS paidAt, p.installments, r.receipt_number AS receiptNumber, f.status AS feedbackStatus FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN staff s ON s.id = a.staff_id INNER JOIN services sv ON sv.id = a.service_id LEFT JOIN payments p ON p.appointment_id = a.id AND p.business_id = a.business_id LEFT JOIN receipts r ON r.payment_id = p.id LEFT JOIN feedback_surveys f ON f.appointment_id = a.id WHERE a.business_id = ? ORDER BY a.starts_at DESC LIMIT 80").bind(business.id),
    database.DB.prepare("SELECT COUNT(*) AS count FROM feedback_surveys WHERE business_id = ? AND status = 'pending'").bind(business.id),
    database.DB.prepare("SELECT COUNT(*) AS count FROM payments WHERE business_id = ? AND status = 'pending'").bind(business.id),
  ]);
  const count = (result: D1Result<unknown>) => Number((result.results[0] as { count?: number } | undefined)?.count ?? 0);
  return Response.json({ appointments: appointments.results, currency: business.currency, pulse: { feedbackWaiting: count(pendingSurvey), paymentsWaiting: count(openPayments) } });
}
