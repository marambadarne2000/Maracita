import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email';

const database = env as unknown as MaracitaRuntime;
type OfferOption = { startsAt: string; endsAt: string };

async function workspace(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string }>();
}

function parseOptions(value: unknown) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4) return null;
  const starts = new Set<string>();
  const options: OfferOption[] = [];
  for (const item of value) {
    const startsAt = typeof item === 'string' ? new Date(item) : new Date('invalid');
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() + 5 * 60_000) return null;
    const iso = startsAt.toISOString();
    if (starts.has(iso)) return null;
    starts.add(iso); options.push({ startsAt: iso, endsAt: '' });
  }
  return options.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function POST(request: Request) {
  const current = await workspace(request);
  if (!current) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { appointmentId?: unknown; options?: unknown };
  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : '';
  const options = parseOptions(body.options);
  if (!appointmentId || !options) return Response.json({ error: 'Choose one appointment and 2–4 different future times.' }, { status: 400 });
  const appointment = await database.DB.prepare("SELECT a.id, a.customer_id AS customerId, a.staff_id AS staffId, a.status, a.starts_at AS startsAt, a.ends_at AS endsAt, c.first_name AS firstName, c.email AS email, sv.name AS serviceName, b.name AS businessName FROM appointments a INNER JOIN customers c ON c.id = a.customer_id INNER JOIN services sv ON sv.id = a.service_id INNER JOIN businesses b ON b.id = a.business_id WHERE a.id = ? AND a.business_id = ?").bind(appointmentId, current.id).first<{ id: string; customerId: string; staffId: string; status: string; startsAt: string; endsAt: string; firstName: string; email: string | null; serviceName: string; businessName: string }>();
  if (!appointment || ['cancelled', 'completed'].includes(appointment.status)) return Response.json({ error: 'This appointment can no longer be rescheduled.' }, { status: 400 });
  const duration = new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime();
  const prepared = options.map((option) => ({ ...option, endsAt: new Date(new Date(option.startsAt).getTime() + duration).toISOString() }));
  const now = new Date().toISOString(); const token = crypto.randomUUID().replaceAll('-', ''); const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await database.DB.batch([
    database.DB.prepare("UPDATE reschedule_offers SET status = 'superseded', updated_at = ? WHERE appointment_id = ? AND status = 'pending'").bind(now, appointment.id),
    database.DB.prepare('INSERT INTO reschedule_offers (id, business_id, appointment_id, customer_id, token, options_json, status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), current.id, appointment.id, appointment.customerId, token, JSON.stringify(prepared), 'pending', expires, now, now),
  ]);
  const url = `${new URL(request.url).origin}/reschedule/${token}`;
  let delivery = 'email_unavailable';
  if (appointment.email) {
    const choices = prepared.map((option, index) => `${index + 1}. ${new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(option.startsAt))}`).join('\n');
    const email = await sendEmail(appointment.email, `Choose a new time for your ${appointment.serviceName}`, `Hello ${appointment.firstName},\n\n${appointment.businessName} would like to offer you a new time for your ${appointment.serviceName}. Choose the option that works best for you within 48 hours:\n\n${url}\n\nAvailable options:\n${choices}\n\nThank you.`);
    delivery = email.ok ? 'email_sent' : 'email_failed';
  }
  if (delivery === 'email_sent') {
    await database.DB.prepare('INSERT INTO customer_messages (id, business_id, customer_id, author_type, body, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), current.id, appointment.customerId, 'business_email', `Secure time choices sent for ${appointment.serviceName}. The customer can choose one of the offered times.`, now).run();
  }
  await database.DB.prepare('INSERT INTO schedule_signals (id, business_id, signal_date, signal_type, priority, summary, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), current.id, appointment.startsAt.slice(0, 10), 'reschedule_offer', 'high', `New time choices sent for ${appointment.serviceName}.`, JSON.stringify({ appointmentId: appointment.id, url, delivery, expiresAt: expires }), now).run();
  return Response.json({ ok: true, delivery, expiresAt: expires, url });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';
  if (!token || token.length < 20) return Response.json({ error: 'This rescheduling link is invalid.' }, { status: 400 });
  const offer = await database.DB.prepare("SELECT r.status, r.options_json AS optionsJson, r.expires_at AS expiresAt, c.first_name AS firstName, sv.name AS serviceName, b.name AS businessName FROM reschedule_offers r INNER JOIN customers c ON c.id = r.customer_id INNER JOIN appointments a ON a.id = r.appointment_id INNER JOIN services sv ON sv.id = a.service_id INNER JOIN businesses b ON b.id = r.business_id WHERE r.token = ?").bind(token).first<{ status: string; optionsJson: string; expiresAt: string; firstName: string; serviceName: string; businessName: string }>();
  if (!offer || offer.status !== 'pending' || new Date(offer.expiresAt).getTime() < Date.now()) return Response.json({ error: 'This time-selection link is no longer available.' }, { status: 404 });
  return Response.json({ ...offer, options: JSON.parse(offer.optionsJson) as OfferOption[] });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: unknown; startsAt?: unknown };
  const token = typeof body.token === 'string' ? body.token.trim() : ''; const startsAt = typeof body.startsAt === 'string' ? body.startsAt : '';
  const offer = await database.DB.prepare("SELECT r.id, r.business_id AS businessId, r.appointment_id AS appointmentId, r.options_json AS optionsJson, r.status, r.expires_at AS expiresAt, a.staff_id AS staffId FROM reschedule_offers r INNER JOIN appointments a ON a.id = r.appointment_id WHERE r.token = ?").bind(token).first<{ id: string; businessId: string; appointmentId: string; optionsJson: string; status: string; expiresAt: string; staffId: string }>();
  if (!offer || offer.status !== 'pending' || new Date(offer.expiresAt).getTime() < Date.now()) return Response.json({ error: 'This time-selection link is no longer available.' }, { status: 409 });
  const option = (JSON.parse(offer.optionsJson) as OfferOption[]).find((value) => value.startsAt === startsAt);
  if (!option) return Response.json({ error: 'Please choose one of the offered times.' }, { status: 400 });
  const conflict = await database.DB.prepare("SELECT id FROM appointments WHERE business_id = ? AND staff_id = ? AND id != ? AND status NOT IN ('cancelled', 'completed') AND starts_at < ? AND ends_at > ? LIMIT 1").bind(offer.businessId, offer.staffId, offer.appointmentId, option.endsAt, option.startsAt).first();
  if (conflict) return Response.json({ error: 'That time was just taken. Please choose another option.' }, { status: 409 });
  const now = new Date().toISOString();
  const changed = await database.DB.prepare("UPDATE reschedule_offers SET status = 'selected', selected_starts_at = ?, updated_at = ? WHERE id = ? AND status = 'pending'").bind(option.startsAt, now, offer.id).run();
  if (!changed.meta.changes) return Response.json({ error: 'This selection was already made.' }, { status: 409 });
  await database.DB.batch([
    database.DB.prepare("UPDATE appointments SET starts_at = ?, ends_at = ?, status = 'confirmed', updated_at = ? WHERE id = ?").bind(option.startsAt, option.endsAt, now, offer.appointmentId),
    database.DB.prepare('INSERT INTO schedule_signals (id, business_id, signal_date, signal_type, priority, summary, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), offer.businessId, option.startsAt.slice(0, 10), 'reschedule_selected', 'high', 'Customer selected a new appointment time.', JSON.stringify({ appointmentId: offer.appointmentId, startsAt: option.startsAt }), now),
  ]);
  return Response.json({ ok: true, startsAt: option.startsAt });
}
