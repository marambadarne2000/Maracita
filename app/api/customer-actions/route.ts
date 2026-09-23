import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email';

const database = env as unknown as MaracitaRuntime;

async function workspace(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id, b.name FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string; name: string }>();
}

export async function POST(request: Request) {
  const business = await workspace(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { type?: unknown; customerId?: unknown };
  const type = body.type === 'feedback' ? 'feedback' : ''; const customerId = typeof body.customerId === 'string' ? body.customerId : '';
  if (!type || !customerId) return Response.json({ error: 'Choose a customer and action.' }, { status: 400 });
  const visit = await database.DB.prepare("SELECT a.id AS appointmentId, c.id AS customerId, c.first_name AS firstName, c.email, sv.name AS serviceName, (SELECT token FROM feedback_surveys f WHERE f.appointment_id = a.id) AS surveyToken, (SELECT status FROM feedback_surveys f WHERE f.appointment_id = a.id) AS surveyStatus FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN services sv ON sv.id = a.service_id WHERE a.business_id = ? AND a.customer_id = ? AND a.status = 'completed' AND EXISTS (SELECT 1 FROM payments p WHERE p.business_id = a.business_id AND p.appointment_id = a.id AND p.status = 'paid') ORDER BY CASE WHEN (SELECT status FROM feedback_surveys f WHERE f.appointment_id = a.id) = 'pending' THEN 0 WHEN (SELECT status FROM feedback_surveys f WHERE f.appointment_id = a.id) IS NULL THEN 1 ELSE 2 END, a.ends_at DESC LIMIT 1").bind(business.id, customerId).first<{ appointmentId: string; customerId: string; firstName: string; email: string | null; serviceName: string; surveyToken: string | null; surveyStatus: string | null }>();
  const customer = await database.DB.prepare('SELECT id, first_name AS firstName, email FROM customers WHERE id = ? AND business_id = ?').bind(customerId, business.id).first<{ id: string; firstName: string; email: string | null }>();
  const recipient = visit?.email ?? customer?.email;
  if (!customer || !recipient) return Response.json({ error: 'Add an email address to this customer before sending the feedback form.' }, { status: 400 });
  if (visit?.surveyStatus === 'completed') return Response.json({ error: 'This customer has already completed the feedback form for the latest paid visit.' }, { status: 400 });
  const token = visit?.surveyToken || crypto.randomUUID().replaceAll('-', ''); const now = new Date().toISOString();
  if (visit && !visit.surveyToken) await database.DB.prepare("INSERT INTO feedback_surveys (id, business_id, appointment_id, customer_id, token, status, responses_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', '{}', ?, ?)").bind(crypto.randomUUID(), business.id, visit.appointmentId, visit.customerId, token, now, now).run();
  if (!visit) await database.DB.prepare("INSERT INTO general_feedback_surveys (id, business_id, customer_id, token, status, responses_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', '{}', ?, ?)").bind(crypto.randomUUID(), business.id, customer.id, token, now, now).run();
  const link = `${new URL(request.url).origin}/feedback/${token}`;
  const subject = visit ? `How was your ${visit.serviceName} visit?` : `How was your experience with ${business.name}?`;
  const email = await sendEmail(recipient, subject, `Hello ${visit?.firstName ?? customer.firstName},\n\nThank you for choosing ${business.name}. Please share your experience in this private form — it takes less than a minute:\n\n${link}\n\nYour answers go directly to ${business.name} and help improve the service.`);
  if (!email.ok) return Response.json({ error: `${email.error} The form was created but no email was sent.` }, { status: 502 });
  await database.DB.prepare('INSERT INTO customer_messages (id, business_id, customer_id, author_type, body, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), business.id, customer.id, 'business_email', visit ? `Feedback form sent for completed ${visit.serviceName} visit.` : 'General feedback form sent.', now).run();
  return Response.json({ ok: true, link });
}
