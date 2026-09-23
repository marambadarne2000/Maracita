import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

async function businessId(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  const record = await database.DB.prepare('SELECT b.id, b.currency FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string; currency: string }>();
  return record ?? null;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const { id } = await context.params;
  const customer = await database.DB.prepare('SELECT id, first_name AS firstName, last_name AS lastName, phone, national_id AS nationalId, email, tags, notes, created_at AS createdAt FROM customers WHERE id = ? AND business_id = ?').bind(id, business.id).first();
  if (!customer) return Response.json({ error: 'Customer not found.' }, { status: 404 });
  const [appointments, payments, messages] = await database.DB.batch([
    database.DB.prepare('SELECT a.id, a.starts_at AS startsAt, a.ends_at AS endsAt, a.status, a.arrived_at AS arrivedAt, a.notes, s.full_name AS staffName, sv.name AS serviceName, sv.price_agorot AS priceMinor FROM appointments a INNER JOIN staff s ON s.id = a.staff_id INNER JOIN services sv ON sv.id = a.service_id WHERE a.business_id = ? AND a.customer_id = ? ORDER BY a.starts_at DESC').bind(business.id, id),
    database.DB.prepare('SELECT p.id, p.amount_agorot AS amountMinor, p.currency, p.installments, p.status, p.provider, p.paid_at AS paidAt, r.receipt_number AS receiptNumber FROM payments p LEFT JOIN receipts r ON r.payment_id = p.id WHERE p.business_id = ? AND p.customer_id = ? ORDER BY p.created_at DESC').bind(business.id, id),
    database.DB.prepare('SELECT id, body, attachment_name AS attachmentName, created_at AS createdAt FROM customer_messages WHERE business_id = ? AND customer_id = ? ORDER BY created_at DESC LIMIT 12').bind(business.id, id),
  ]);
  const appointmentRows = appointments.results as Array<{ startsAt: string; status: string; priceMinor: number }>;
  const paymentRows = payments.results as Array<{ amountMinor: number; installments: number; status: string }>;
  const now = Date.now();
  const totalDueMinor = appointmentRows.filter((row) => row.status !== 'cancelled').reduce((sum, row) => sum + (row.priceMinor || 0), 0);
  const paidMinor = paymentRows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + (row.amountMinor || 0), 0);
  const metrics = {
    totalAppointments: appointmentRows.length,
    upcomingAppointments: appointmentRows.filter((row) => new Date(row.startsAt).getTime() >= now && !['cancelled', 'completed', 'no_show'].includes(row.status)).length,
    cancelledAppointments: appointmentRows.filter((row) => row.status === 'cancelled').length,
    noShows: appointmentRows.filter((row) => row.status === 'no_show').length,
    paidMinor,
    balanceMinor: Math.max(0, totalDueMinor - paidMinor),
    installmentsRemaining: paymentRows.filter((row) => row.status !== 'paid').reduce((sum, row) => sum + row.installments, 0),
  };
  return Response.json({ customer, currency: business.currency, appointments: appointments.results, payments: payments.results, messages: messages.results, metrics });
}
