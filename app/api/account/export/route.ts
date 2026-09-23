import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

export async function GET(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return Response.json({ error: 'Please sign in to export your data.' }, { status: 401 });
  const account = await database.DB.prepare('SELECT id, email, full_name AS fullName, preferred_locale AS preferredLocale, created_at AS createdAt FROM accounts WHERE auth_subject = ?').bind(identity.subject).first<{ id: string }>();
  if (!account) return Response.json({ error: 'Account not found.' }, { status: 404 });
  const workspace = await database.DB.prepare('SELECT b.id, b.name, b.business_type AS businessType, b.phone, b.timezone, b.currency, b.status, b.created_at AS createdAt FROM businesses b INNER JOIN memberships m ON m.business_id = b.id WHERE m.account_id = ? ORDER BY b.created_at DESC LIMIT 1').bind(account.id).first<{ id: string }>();
  if (!workspace) return Response.json({ exportedAt: new Date().toISOString(), account, workspace: null }, { headers: { 'Cache-Control': 'no-store' } });
  const id = workspace.id;
  const [customers, staff, services, appointments, payments, receipts, messages, waitlist, feedback, generalFeedback, reschedules] = await database.DB.batch([
    database.DB.prepare('SELECT * FROM customers WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM staff WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM services WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM appointments WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM payments WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM receipts WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM customer_messages WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM waitlist_entries WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM feedback_surveys WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM general_feedback_surveys WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM reschedule_offers WHERE business_id = ?').bind(id),
  ]);
  return Response.json({ exportedAt: new Date().toISOString(), account, workspace, records: { customers: customers.results, staff: staff.results, services: services.results, appointments: appointments.results, payments: payments.results, receipts: receipts.results, messages: messages.results, waitlist: waitlist.results, feedback: feedback.results, generalFeedback: generalFeedback.results, reschedules: reschedules.results } }, { headers: { 'Cache-Control': 'no-store' } });
}
