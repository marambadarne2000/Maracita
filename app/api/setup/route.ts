import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;
const colors = new Set(['#4c8df6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ec4899']);

function clean(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

async function currentBusiness(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id, b.currency FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string; currency: string }>();
}

export async function GET(request: Request) {
  const business = await currentBusiness(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const [staff, services] = await database.DB.batch([
    database.DB.prepare('SELECT id, full_name AS fullName, phone, email, calendar_color AS calendarColor FROM staff WHERE business_id = ? AND active = 1 ORDER BY created_at DESC').bind(business.id),
    database.DB.prepare('SELECT id, name, duration_minutes AS durationMinutes, buffer_minutes AS bufferMinutes, price_agorot AS priceMinor FROM services WHERE business_id = ? AND active = 1 ORDER BY created_at DESC').bind(business.id),
  ]);
  return Response.json({ currency: business.currency, staff: staff.results, services: services.results });
}

export async function POST(request: Request) {
  const business = await currentBusiness(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { kind?: unknown; name?: unknown; phone?: unknown; email?: unknown; color?: unknown; duration?: unknown; buffer?: unknown; price?: unknown };
  const kind = clean(body.kind, 20); const name = clean(body.name, 120); const now = new Date().toISOString();
  if (!name) return Response.json({ error: 'A name is required.' }, { status: 400 });
  if (kind === 'staff') {
    const id = crypto.randomUUID(); const color = clean(body.color, 10);
    await database.DB.prepare('INSERT INTO staff (id, business_id, full_name, phone, email, calendar_color, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, business.id, name, clean(body.phone, 30) || null, clean(body.email, 254) || null, colors.has(color) ? color : '#4c8df6', 1, now, now).run();
    return Response.json({ id }, { status: 201 });
  }
  if (kind === 'service') {
    const duration = Number(body.duration); const buffer = Number(body.buffer || 0); const price = Number(body.price || 0);
    if (!Number.isInteger(duration) || duration < 5 || duration > 480 || !Number.isInteger(buffer) || buffer < 0 || buffer > 120 || !Number.isFinite(price) || price < 0) return Response.json({ error: 'Check duration, buffer and price.' }, { status: 400 });
    const id = crypto.randomUUID();
    await database.DB.prepare('INSERT INTO services (id, business_id, name, duration_minutes, buffer_minutes, price_agorot, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, business.id, name, duration, buffer, Math.round(price * 100), 1, now, now).run();
    return Response.json({ id }, { status: 201 });
  }
  return Response.json({ error: 'Unknown setup action.' }, { status: 400 });
}
