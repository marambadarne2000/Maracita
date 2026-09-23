import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

async function businessId(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  const row = await database.DB.prepare('SELECT b.id FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string }>();
  return row?.id ?? null;
}

const validDate = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
const validTime = (value: string) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export async function GET(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const [customers, staff, services, entries] = await database.DB.batch([
    database.DB.prepare("SELECT id, first_name || ' ' || last_name AS name FROM customers WHERE business_id = ? ORDER BY last_name, first_name").bind(business),
    database.DB.prepare('SELECT id, full_name AS name FROM staff WHERE business_id = ? AND active = 1 ORDER BY full_name').bind(business),
    database.DB.prepare('SELECT id, name FROM services WHERE business_id = ? AND active = 1 ORDER BY name').bind(business),
    database.DB.prepare("SELECT w.id, w.requested_date AS requestedDate, w.earliest_time AS earliestTime, w.latest_time AS latestTime, w.contact_preference AS contactPreference, w.status, w.created_at AS createdAt, c.first_name || ' ' || c.last_name AS customerName, s.full_name AS staffName, sv.name AS serviceName FROM waitlist_entries w INNER JOIN customers c ON c.id = w.customer_id LEFT JOIN staff s ON s.id = w.staff_id LEFT JOIN services sv ON sv.id = w.service_id WHERE w.business_id = ? ORDER BY CASE w.status WHEN 'waiting' THEN 0 WHEN 'offered' THEN 1 ELSE 2 END, w.requested_date ASC, w.created_at DESC").bind(business),
  ]);
  return Response.json({ customers: customers.results, staff: staff.results, services: services.results, entries: entries.results });
}

export async function POST(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { customerId?: unknown; staffId?: unknown; serviceId?: unknown; requestedDate?: unknown; earliestTime?: unknown; latestTime?: unknown; contactPreference?: unknown };
  const customerId = typeof body.customerId === 'string' ? body.customerId : '';
  const staffId = typeof body.staffId === 'string' ? body.staffId : '';
  const serviceId = typeof body.serviceId === 'string' ? body.serviceId : '';
  const requestedDate = typeof body.requestedDate === 'string' ? body.requestedDate : '';
  const earliestTime = typeof body.earliestTime === 'string' ? body.earliestTime : '';
  const latestTime = typeof body.latestTime === 'string' ? body.latestTime : '';
  const contactPreference = ['manual', 'email', 'phone'].includes(String(body.contactPreference)) ? String(body.contactPreference) : 'manual';
  if (!customerId || !validDate(requestedDate) || !validTime(earliestTime) || !validTime(latestTime) || (earliestTime && latestTime && earliestTime > latestTime)) return Response.json({ error: 'Choose a customer and provide a valid preferred date or time window.' }, { status: 400 });
  const [customer, staff, service] = await database.DB.batch([
    database.DB.prepare('SELECT id FROM customers WHERE id = ? AND business_id = ?').bind(customerId, business),
    staffId ? database.DB.prepare('SELECT id FROM staff WHERE id = ? AND business_id = ? AND active = 1').bind(staffId, business) : database.DB.prepare('SELECT 1 AS id'),
    serviceId ? database.DB.prepare('SELECT id FROM services WHERE id = ? AND business_id = ? AND active = 1').bind(serviceId, business) : database.DB.prepare('SELECT 1 AS id'),
  ]);
  if (!customer.results[0] || !staff.results[0] || !service.results[0]) return Response.json({ error: 'One of the selected records is no longer available.' }, { status: 400 });
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  await database.DB.prepare('INSERT INTO waitlist_entries (id, business_id, customer_id, staff_id, service_id, requested_date, earliest_time, latest_time, contact_preference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, business, customerId, staffId || null, serviceId || null, requestedDate || null, earliestTime || null, latestTime || null, contactPreference, 'waiting', now, now).run();
  return Response.json({ id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { id?: unknown; status?: unknown };
  const id = typeof body.id === 'string' ? body.id : '';
  const status = ['waiting', 'offered', 'filled', 'closed'].includes(String(body.status)) ? String(body.status) : '';
  if (!id || !status) return Response.json({ error: 'Select a valid waiting-list status.' }, { status: 400 });
  const result = await database.DB.prepare('UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND business_id = ?').bind(status, new Date().toISOString(), id, business).run();
  if (!result.meta.changes) return Response.json({ error: 'Waitlist entry was not found.' }, { status: 404 });
  return Response.json({ ok: true });
}
