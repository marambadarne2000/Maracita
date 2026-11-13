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
  const body = await request.json().catch(() => ({})) as { firstName?: unknown; lastName?: unknown; phone?: unknown; nationalId?: unknown; email?: unknown; tags?: unknown; notes?: unknown };
  const firstName = clean(body.firstName, 80); const lastName = clean(body.lastName, 80); const phone = clean(body.phone, 30).replace(/[\s()-]/g,'');
  if (!firstName || !lastName || !/^\+?\d{7,15}$/.test(phone) || (clean(body.email,254)&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(body.email,254)))) return Response.json({ error: 'Enter first and last names, a valid phone number and an optional valid email address.' }, { status: 400 });
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  await database.DB.prepare('INSERT INTO customers (id, business_id, first_name, last_name, phone, national_id, email, tags, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, business, firstName, lastName, phone, clean(body.nationalId, 40) || null, clean(body.email, 254) || null, clean(body.tags, 180), clean(body.notes, 2000), now, now).run();
  return Response.json({ id }, { status: 201 });
}

export async function PATCH(request:Request){const data=await request.json().catch(()=>null) as Record<string,unknown>|null;const business=await businessId(request);if(!business)return Response.json({error:'Please sign in.'},{status:401});if(!data||typeof data.id!=='string')return Response.json({error:'Choose a customer.'},{status:400});const old=await database.DB.prepare('SELECT first_name AS firstName,last_name AS lastName,phone,national_id AS nationalId,email,tags,notes FROM customers WHERE id=? AND business_id=?').bind(data.id,business).first<Record<string,unknown>>();if(!old)return Response.json({error:'Customer not found.'},{status:404});const value={...old,...data},first=clean(value.firstName,80),last=clean(value.lastName,80),phone=clean(value.phone,30).replace(/[\s()-]/g,''),email=clean(value.email,254).toLowerCase();if(!first||!last||!/^\+?\d{7,15}$/.test(phone)||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return Response.json({error:'Enter valid names, phone and optional email.'},{status:400});await database.DB.prepare('UPDATE customers SET first_name=?,last_name=?,phone=?,national_id=?,email=?,tags=?,notes=?,updated_at=? WHERE id=? AND business_id=?').bind(first,last,phone,clean(value.nationalId,40)||null,email||null,clean(value.tags,180),clean(value.notes,2000),new Date().toISOString(),data.id,business).run();return Response.json({ok:true});}
