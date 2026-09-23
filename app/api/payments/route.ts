import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email';

const database = env as unknown as MaracitaRuntime;

async function business(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id, b.currency FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string; currency: string }>();
}

export async function GET(request: Request) {
  const workspace = await business(request);
  if (!workspace) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const [customers, appointments, payments] = await database.DB.batch([
    database.DB.prepare("SELECT id, first_name || ' ' || last_name AS name FROM customers WHERE business_id = ? ORDER BY last_name, first_name").bind(workspace.id),
    database.DB.prepare("SELECT a.id, c.first_name || ' ' || c.last_name AS customerName, sv.name AS serviceName, a.starts_at AS startsAt FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN services sv ON sv.id = a.service_id WHERE a.business_id = ? ORDER BY a.starts_at DESC").bind(workspace.id),
    database.DB.prepare("SELECT p.id, p.amount_agorot AS amountMinor, p.currency, p.installments, p.status, p.provider, p.paid_at AS paidAt, c.first_name || ' ' || c.last_name AS customerName, r.receipt_number AS receiptNumber, r.issued_at AS issuedAt FROM payments p INNER JOIN customers c ON c.id = p.customer_id LEFT JOIN receipts r ON r.payment_id = p.id WHERE p.business_id = ? ORDER BY p.created_at DESC").bind(workspace.id),
  ]);
  return Response.json({ currency: workspace.currency, customers: customers.results, appointments: appointments.results, payments: payments.results });
}

export async function POST(request: Request) {
  const workspace = await business(request);
  if (!workspace) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { customerId?: unknown; appointmentId?: unknown; amount?: unknown; installments?: unknown; method?: unknown };
  const customerId = typeof body.customerId === 'string' ? body.customerId : ''; const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : '';
  const amount = Number(body.amount); const installments = Number(body.installments); const method = typeof body.method === 'string' ? body.method.slice(0, 30) : 'manual';
  if (!customerId || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(installments) || installments < 1 || installments > 6) return Response.json({ error: 'Choose a customer, amount and 1–6 installments.' }, { status: 400 });
  const customer = await database.DB.prepare('SELECT id FROM customers WHERE id = ? AND business_id = ?').bind(customerId, workspace.id).first();
  if (!customer) return Response.json({ error: 'Customer is not available.' }, { status: 400 });
  if (appointmentId) { const booking = await database.DB.prepare('SELECT id FROM appointments WHERE id = ? AND business_id = ? AND customer_id = ?').bind(appointmentId, workspace.id, customerId).first(); if (!booking) return Response.json({ error: 'Appointment does not belong to this customer.' }, { status: 400 }); }
  const now = new Date().toISOString(); const paymentId = crypto.randomUUID(); const receiptId = crypto.randomUUID();
  const last = await database.DB.prepare('SELECT COUNT(*) AS count FROM receipts WHERE business_id = ?').bind(workspace.id).first<{ count: number }>();
  const receiptNumber = String((last?.count ?? 0) + 1).padStart(6, '0');
  await database.DB.batch([
    database.DB.prepare('INSERT INTO payments (id, business_id, appointment_id, customer_id, amount_agorot, currency, installments, status, provider, paid_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(paymentId, workspace.id, appointmentId || null, customerId, Math.round(amount * 100), workspace.currency, installments, 'paid', `local-${method}`, now, now, now),
    database.DB.prepare('INSERT INTO receipts (id, business_id, payment_id, receipt_number, issued_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(receiptId, workspace.id, paymentId, receiptNumber, now, now),
  ]);
  // A payment can be recorded after the visit has already been marked complete.
  // In that order, create the same one-time feedback request here.
  if (appointmentId) {
    const visit = await database.DB.prepare("SELECT a.id, a.status, c.id AS customerId, c.first_name AS firstName, c.email, sv.name AS serviceName, b.name AS businessName FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN services sv ON sv.id = a.service_id INNER JOIN businesses b ON b.id = a.business_id WHERE a.id = ? AND a.business_id = ?").bind(appointmentId, workspace.id).first<{ id: string; status: string; customerId: string; firstName: string; email: string | null; serviceName: string; businessName: string }>();
    if (visit?.status === 'completed') {
      const token = crypto.randomUUID().replaceAll('-', '');
      const created = await database.DB.prepare("INSERT OR IGNORE INTO feedback_surveys (id, business_id, appointment_id, customer_id, token, status, responses_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', '{}', ?, ?)").bind(crypto.randomUUID(), workspace.id, visit.id, visit.customerId, token, now, now).run();
      if (created.meta.changes && visit.email) {
        const link = `${new URL(request.url).origin}/feedback/${token}`;
        await sendEmail(visit.email, `How was your ${visit.serviceName} visit?`, `Hello ${visit.firstName},\n\nThank you for choosing ${visit.businessName}. We would value your feedback about your ${visit.serviceName} visit. It takes less than a minute.\n\n${link}\n\nThank you!`);
      }
    }
  }
  return Response.json({ paymentId, receiptNumber }, { status: 201 });
}
