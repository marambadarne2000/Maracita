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
  const [customers, staff, services, appointments, payments, receipts, messages, waitlist, feedback, generalFeedback, reschedules, tasks] = await database.DB.batch([
    database.DB.prepare('SELECT * FROM customers WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM staff WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM services WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM appointments WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM payments WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM receipts WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM customer_messages WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM waitlist_entries WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM feedback_surveys WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM general_feedback_surveys WHERE business_id = ?').bind(id), database.DB.prepare('SELECT * FROM reschedule_offers WHERE business_id = ?').bind(id), database.DB.prepare('SELECT id, title, due_date AS dueDate, completed, created_at AS createdAt FROM business_tasks WHERE business_id = ?').bind(id),
  ]);
  const advancedQueries = [
 ['deliveryEvents','SELECT * FROM provider_delivery_events WHERE business_id = ?'],
 ['resources','SELECT * FROM resources WHERE business_id = ?'],['serviceResources','SELECT * FROM service_resources WHERE business_id = ?'],['reminderSettings','SELECT * FROM reminder_settings WHERE business_id = ?'],['reminderPreferences','SELECT * FROM reminder_preferences WHERE business_id = ?'],['reminderHistory','SELECT * FROM appointment_reminders WHERE business_id = ?'],
    ['bookingSettings','SELECT * FROM booking_settings WHERE business_id = ?'],
    ['staffHours','SELECT * FROM staff_hours WHERE business_id = ?'],
    ['timeOff','SELECT * FROM time_off WHERE business_id = ?'],
    ['waitlistOffers','SELECT id,source_appointment_id,waitlist_id,customer_id,staff_id,service_id,starts_at,ends_at,status,expires_at,delivery_status,channel,appointment_id,created_at FROM waitlist_offers WHERE business_id = ?'],
    ['inboxConversations','SELECT * FROM inbox_conversations WHERE business_id = ?'],
    ['inboxMessages','SELECT * FROM inbox_messages WHERE business_id = ?'],
    ['inboxAttachments','SELECT * FROM inbox_attachments WHERE business_id = ?'],
    ['connections','SELECT id,channel,external_account_id,display_name,enabled,created_at,updated_at FROM integrations WHERE business_id = ?'],
  ];
  const advancedResults=await database.DB.batch(advancedQueries.map(([,query])=>database.DB.prepare(query).bind(id)));
  const advanced=Object.fromEntries(advancedQueries.map(([name],index)=>[name,advancedResults[index].results]));
  return Response.json({ exportedAt: new Date().toISOString(), account, workspace, records: { ...advanced, customers: customers.results, staff: staff.results, services: services.results, appointments: appointments.results, payments: payments.results, receipts: receipts.results, messages: messages.results, waitlist: waitlist.results, feedback: feedback.results, generalFeedback: generalFeedback.results, reschedules: reschedules.results, tasks: tasks.results } }, { headers: { 'Cache-Control': 'no-store' } });
}
