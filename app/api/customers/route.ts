import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

async function businessId(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  const record = await database.DB.prepare('SELECT b.id FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string }>();
  return record?.id ?? null;
}

export async function GET(request: Request) {
  const id = await businessId(request);
  if (!id) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const result = await database.DB.prepare('SELECT id, first_name AS firstName, last_name AS lastName, phone, national_id AS nationalId, email, tags, notes, created_at AS createdAt FROM customers WHERE business_id = ? ORDER BY created_at DESC').bind(id).all();
  return Response.json({ customers: result.results });
}

export async function POST(request: Request) {
  const business = await businessId(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body: { firstName?: unknown; lastName?: unknown; phone?: unknown; nationalId?: unknown; email?: unknown; tags?: unknown; notes?: unknown } = await request.json().catch(() => ({}));
  const firstName = clean(body.firstName, 80); const lastName = clean(body.lastName, 80); const phone = clean(body.phone, 30);
  if (!firstName || !lastName || !phone) return Response.json({ error: 'First name, last name and phone are required.' }, { status: 400 });
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  await database.DB.prepare('INSERT INTO customers (id, business_id, first_name, last_name, phone, national_id, email, tags, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, business, firstName, lastName, phone, clean(body.nationalId, 40) || null, clean(body.email, 254) || null, clean(body.tags, 180), clean(body.notes, 2000), now, now).run();
  return Response.json({ id }, { status: 201 });
}
