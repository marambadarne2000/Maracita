import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email';

const database = env as unknown as MaracitaRuntime;

async function businessId(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  const record = await database.DB.prepare('SELECT b.id FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string }>();
  return record?.id ?? null;
}

export async function GET(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const [customers, staff, services, appointments] = await database.DB.batch([
    database.DB.prepare("SELECT id, first_name || ' ' || last_name AS name, phone FROM customers WHERE business_id = ? ORDER BY last_name, first_name").bind(business),
    database.DB.prepare('SELECT id, full_name AS name, calendar_color AS color FROM staff WHERE business_id = ? AND active = 1 ORDER BY full_name').bind(business),
    database.DB.prepare('SELECT id, name, duration_minutes AS durationMinutes, buffer_minutes AS bufferMinutes, price_agorot AS priceMinor FROM services WHERE business_id = ? AND active = 1 ORDER BY name').bind(business),
    database.DB.prepare("SELECT a.id, a.starts_at AS startsAt, a.ends_at AS endsAt, a.status, a.arrived_at AS arrivedAt, c.first_name || ' ' || c.last_name AS customerName, s.full_name AS staffName, sv.name AS serviceName FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN staff s ON s.id = a.staff_id INNER JOIN services sv ON sv.id = a.service_id WHERE a.business_id = ? ORDER BY a.starts_at DESC LIMIT 50").bind(business),
  ]);
  return Response.json({ customers: customers.results, staff: staff.results, services: services.results, appointments: appointments.results });
}

export async function POST(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body: { customerId?: unknown; staffId?: unknown; serviceId?: unknown; startsAt?: unknown; notes?: unknown } = await request.json().catch(() => ({}));
  const customerId = typeof body.customerId === 'string' ? body.customerId : ''; const staffId = typeof body.staffId === 'string' ? body.staffId : ''; const serviceId = typeof body.serviceId === 'string' ? body.serviceId : '';
  const startsAt = typeof body.startsAt === 'string' ? new Date(body.startsAt) : new Date('invalid');
  if (!customerId || !staffId || !serviceId || Number.isNaN(startsAt.getTime())) return Response.json({ error: 'Choose customer, team member, service and start time.' }, { status: 400 });
  const [customer, staff, service] = await database.DB.batch([
    database.DB.prepare('SELECT id FROM customers WHERE id = ? AND business_id = ?').bind(customerId, business),
    database.DB.prepare('SELECT id FROM staff WHERE id = ? AND business_id = ? AND active = 1').bind(staffId, business),
    database.DB.prepare('SELECT duration_minutes AS durationMinutes, buffer_minutes AS bufferMinutes FROM services WHERE id = ? AND business_id = ? AND active = 1').bind(serviceId, business),
  ]);
  const serviceData = service.results[0] as { durationMinutes?: number; bufferMinutes?: number } | undefined;
  if (!customer.results[0] || !staff.results[0] || !serviceData) return Response.json({ error: 'One of the selected records is no longer available.' }, { status: 400 });
  const starts = startsAt.toISOString(); const ends = new Date(startsAt.getTime() + ((serviceData.durationMinutes ?? 0) + (serviceData.bufferMinutes ?? 0)) * 60000).toISOString();
  const conflict = await database.DB.prepare("SELECT id FROM appointments WHERE business_id = ? AND staff_id = ? AND status NOT IN ('cancelled', 'completed') AND starts_at < ? AND ends_at > ? LIMIT 1").bind(business, staffId, ends, starts).first();
  if (conflict) return Response.json({ error: 'This team member already has an overlapping appointment.' }, { status: 409 });
  const id = crypto.randomUUID(); const now = new Date().toISOString(); const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';
  await database.DB.prepare('INSERT INTO appointments (id, business_id, customer_id, staff_id, service_id, starts_at, ends_at, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, business, customerId, staffId, serviceId, starts, ends, 'scheduled', notes, now, now).run();
  return Response.json({ id, startsAt: starts, endsAt: ends }, { status: 201 });
}

export async function PATCH(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body: { id?: unknown; status?: unknown } = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const status = ['scheduled', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show'].includes(String(body.status)) ? String(body.status) : '';
  if (!id || !status) return Response.json({ error: 'Select a valid appointment status.' }, { status: 400 });
  const appointment = await database.DB.prepare("SELECT a.id, a.status, a.starts_at AS startsAt, a.customer_id AS customerId, a.staff_id AS staffId, a.service_id AS serviceId, c.first_name || ' ' || c.last_name AS customerName, c.first_name AS customerFirstName, c.phone AS customerPhone, c.email AS customerEmail, s.full_name AS staffName, sv.name AS serviceName, b.name AS businessName FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN staff s ON s.id = a.staff_id INNER JOIN services sv ON sv.id = a.service_id INNER JOIN businesses b ON b.id = a.business_id WHERE a.id = ? AND a.business_id = ?").bind(id, business).first<{ id: string; status: string; startsAt: string; customerId: string; staffId: string; serviceId: string; customerName: string; customerFirstName: string; customerPhone: string; customerEmail: string | null; staffName: string; serviceName: string; businessName: string }>();
  if (!appointment) return Response.json({ error: 'Appointment was not found.' }, { status: 404 });
  const now = new Date().toISOString();
  const arrivedAt = status === 'arrived' ? now : null;
  const result = await database.DB.prepare("UPDATE appointments SET status = ?, arrived_at = CASE WHEN ? = 'arrived' THEN ? ELSE arrived_at END, updated_at = ? WHERE id = ? AND business_id = ?").bind(status, status, arrivedAt, now, id, business).run();
  if (!result.meta.changes) return Response.json({ error: 'Appointment was not found.' }, { status: 404 });

  let waitlistMatches: { id: string; name: string; phone: string; contactPreference: string; earliestTime: string | null; latestTime: string | null }[] = [];
  let feedbackQueued = false;
  const firstChangeToStatus = appointment.status !== status;

  if (status === 'cancelled' && firstChangeToStatus) {
    const matches = await database.DB.prepare("SELECT w.id, c.first_name || ' ' || c.last_name AS name, c.phone, w.contact_preference AS contactPreference, w.earliest_time AS earliestTime, w.latest_time AS latestTime FROM waitlist_entries w INNER JOIN customers c ON c.id = w.customer_id WHERE w.business_id = ? AND w.status = 'waiting' AND (w.service_id IS NULL OR w.service_id = ?) AND (w.staff_id IS NULL OR w.staff_id = ?) AND (w.requested_date IS NULL OR w.requested_date = substr(?, 1, 10)) AND (w.earliest_time IS NULL OR w.earliest_time <= substr(?, 12, 5)) AND (w.latest_time IS NULL OR w.latest_time >= substr(?, 12, 5)) ORDER BY w.created_at ASC LIMIT 5").bind(business, appointment.serviceId, appointment.staffId, appointment.startsAt, appointment.startsAt, appointment.startsAt).all<{ id: string; name: string; phone: string; contactPreference: string; earliestTime: string | null; latestTime: string | null }>();
    waitlistMatches = matches.results;
    if (waitlistMatches.length) {
      const context = JSON.stringify({ appointmentId: appointment.id, startsAt: appointment.startsAt, serviceName: appointment.serviceName, staffName: appointment.staffName, matches: waitlistMatches });
      await database.DB.prepare('INSERT INTO schedule_signals (id, business_id, signal_date, signal_type, priority, summary, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), business, appointment.startsAt.slice(0, 10), 'waitlist_match', 'high', `${waitlistMatches.length} waiting customer${waitlistMatches.length === 1 ? '' : 's'} match the cancelled ${appointment.serviceName} slot.`, context, now).run();
    }
  }

  if (status === 'completed' && firstChangeToStatus) {
    const paid = await database.DB.prepare("SELECT id FROM payments WHERE business_id = ? AND appointment_id = ? AND status = 'paid' LIMIT 1").bind(business, appointment.id).first<{ id: string }>();
    if (paid) {
      const surveyId = crypto.randomUUID(); const token = crypto.randomUUID().replaceAll('-', '');
      await database.DB.prepare("INSERT OR IGNORE INTO feedback_surveys (id, business_id, appointment_id, customer_id, token, status, responses_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', '{}', ?, ?)").bind(surveyId, business, appointment.id, appointment.customerId, token, now, now).run();
      const savedSurvey = await database.DB.prepare('SELECT token FROM feedback_surveys WHERE appointment_id = ? AND business_id = ?').bind(appointment.id, business).first<{ token: string }>();
      const surveyUrl = `${new URL(request.url).origin}/feedback/${savedSurvey?.token ?? token}`;
      const survey = `Hi ${appointment.customerName}, thank you for visiting. Please share quick feedback about your arrival, service, staff member, payment and location: ${surveyUrl}`;
      let delivery = 'email_not_available';
      if (appointment.customerEmail) {
        const email = await sendEmail(appointment.customerEmail, `How was your ${appointment.serviceName} visit?`, `Hello ${appointment.customerFirstName},\n\nThank you for choosing ${appointment.businessName}. We would value your feedback about your ${appointment.serviceName} visit — it takes less than a minute.\n\n${surveyUrl}\n\nThank you!`);
        delivery = email.ok ? 'email_sent' : 'email_failed';
      }
      const context = JSON.stringify({ appointmentId: appointment.id, customerId: appointment.customerId, customerName: appointment.customerName, phone: appointment.customerPhone, email: appointment.customerEmail, serviceName: appointment.serviceName, staffName: appointment.staffName, surveyUrl, smsText: survey, whatsappText: survey, delivery });
      await database.DB.prepare('INSERT INTO schedule_signals (id, business_id, signal_date, signal_type, priority, summary, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), business, appointment.startsAt.slice(0, 10), 'feedback_ready', 'normal', `Feedback survey is ready for ${appointment.customerName} after completed, paid service.`, context, now).run();
      feedbackQueued = true;
    }
  }

  return Response.json({ ok: true, status, waitlistMatches, feedbackQueued });
}
