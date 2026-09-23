import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';
import { sendEmail } from '@/lib/email';

const database = env as unknown as MaracitaRuntime;

async function workspace(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string }>();
}

export async function GET(request: Request) {
  const business = await workspace(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const url = new URL(request.url); const customerId = url.searchParams.get('customerId') ?? '';
  const customers = await database.DB.prepare("SELECT id, first_name || ' ' || last_name AS name, phone, national_id AS nationalId, email FROM customers WHERE business_id = ? ORDER BY last_name, first_name").bind(business.id).all();
  if (!customerId) return Response.json({ customers: customers.results, messages: [] });
  const valid = await database.DB.prepare('SELECT id FROM customers WHERE id = ? AND business_id = ?').bind(customerId, business.id).first();
  if (!valid) return Response.json({ error: 'Customer is not available.' }, { status: 400 });
  const [messages, appointments] = await database.DB.batch([
    database.DB.prepare('SELECT id, author_type AS authorType, body, attachment_name AS attachmentName, attachment_type AS attachmentType, attachment_data AS attachmentData, created_at AS createdAt FROM customer_messages WHERE business_id = ? AND customer_id = ? ORDER BY created_at ASC').bind(business.id, customerId),
    database.DB.prepare("SELECT a.id, a.starts_at AS startsAt, a.status, sv.name AS serviceName FROM appointments a INNER JOIN services sv ON sv.id = a.service_id WHERE a.business_id = ? AND a.customer_id = ? AND a.status NOT IN ('cancelled', 'completed') ORDER BY a.starts_at ASC LIMIT 20").bind(business.id, customerId),
  ]);
  return Response.json({ customers: customers.results, messages: messages.results, appointments: appointments.results });
}

export async function POST(request: Request) {
  const business = await workspace(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { customerId?: unknown; message?: unknown; attachment?: unknown; delivery?: unknown; subject?: unknown };
  const customerId = typeof body.customerId === 'string' ? body.customerId : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 5000) : '';
  const delivery = body.delivery === 'email' ? 'email' : 'internal';
  const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 180) : '';
  const attachment = body.attachment && typeof body.attachment === 'object' ? body.attachment as { name?: unknown; type?: unknown; data?: unknown } : null;
  const name = typeof attachment?.name === 'string' ? attachment.name.slice(0, 160) : null;
  const type = typeof attachment?.type === 'string' ? attachment.type.slice(0, 120) : null;
  const data = typeof attachment?.data === 'string' ? attachment.data : null;
  if (!customerId || (!message && !data)) return Response.json({ error: 'Choose a customer and add a message or file.' }, { status: 400 });
  if (delivery === 'email' && (!message || subject.length < 3)) return Response.json({ error: 'Write a detailed email message and subject before sending.' }, { status: 400 });
  if (data && (data.length > 1_400_000 || !data.startsWith('data:'))) return Response.json({ error: 'File is too large. Upload a file up to 1 MB.' }, { status: 400 });
  const customer = await database.DB.prepare("SELECT id, email, first_name AS firstName, last_name AS lastName FROM customers WHERE id = ? AND business_id = ?").bind(customerId, business.id).first<{ id: string; email: string | null; firstName: string; lastName: string }>();
  if (!customer) return Response.json({ error: 'Customer is not available.' }, { status: 400 });
  if (delivery === 'email' && !customer.email) return Response.json({ error: 'Add an email address to this customer before sending an email.' }, { status: 400 });
  const now = new Date().toISOString(); const id = crypto.randomUUID();
  await database.DB.prepare('INSERT INTO customer_messages (id, business_id, customer_id, author_type, body, attachment_name, attachment_type, attachment_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, business.id, customerId, delivery === 'email' ? 'business_email' : 'business', message, name, type, data, now).run();
  if (delivery === 'email') {
    const businessName = await database.DB.prepare('SELECT name FROM businesses WHERE id = ?').bind(business.id).first<{ name: string }>();
    const personalized = `Hello ${customer.firstName},\n\n${message}\n\n— ${businessName?.name || 'Maracita'}`;
    const result = await sendEmail(customer.email as string, subject, personalized);
    if (!result.ok) return Response.json({ error: `${result.error} Your note was saved privately, but no email was sent.` }, { status: 502 });
  }
  return Response.json({ id, delivered: delivery === 'email' }, { status: 201 });
}
