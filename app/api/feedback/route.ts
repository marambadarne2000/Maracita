import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';

const database = env as unknown as MaracitaRuntime;
const fields = ['arrival', 'service', 'staff', 'payment', 'location'] as const;
type Field = typeof fields[number];

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';
  if (!token || token.length < 20) return Response.json({ error: 'This feedback link is invalid.' }, { status: 400 });
  const survey = await database.DB.prepare("SELECT f.status, c.first_name AS firstName, sv.name AS serviceName, b.name AS businessName FROM feedback_surveys f INNER JOIN customers c ON c.id = f.customer_id INNER JOIN appointments a ON a.id = f.appointment_id INNER JOIN services sv ON sv.id = a.service_id INNER JOIN businesses b ON b.id = f.business_id WHERE f.token = ?").bind(token).first<{ status: string; firstName: string; serviceName: string; businessName: string }>();
  if (survey) return Response.json(survey);
  const general = await database.DB.prepare("SELECT f.status, c.first_name AS firstName, 'your experience' AS serviceName, b.name AS businessName FROM general_feedback_surveys f INNER JOIN customers c ON c.id = f.customer_id INNER JOIN businesses b ON b.id = f.business_id WHERE f.token = ?").bind(token).first<{ status: string; firstName: string; serviceName: string; businessName: string }>();
  if (!general) return Response.json({ error: 'This feedback link is no longer available.' }, { status: 404 });
  return Response.json(general);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: unknown; ratings?: unknown; comment?: unknown };
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const ratings = typeof body.ratings === 'object' && body.ratings !== null ? body.ratings as Record<string, unknown> : {};
  const values = Object.fromEntries(fields.map((field) => [field, Number(ratings[field])])) as Record<Field, number>;
  if (!token || !fields.every((field) => Number.isInteger(values[field]) && values[field] >= 1 && values[field] <= 5)) return Response.json({ error: 'Please rate every part of your visit from 1 to 5.' }, { status: 400 });
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) : '';
  const now = new Date().toISOString();
  const result = await database.DB.prepare("UPDATE feedback_surveys SET status = 'completed', responses_json = ?, completed_at = ?, updated_at = ? WHERE token = ? AND status = 'pending'").bind(JSON.stringify({ ...values, comment }), now, now, token).run();
  if (!result.meta.changes) {
    const general = await database.DB.prepare("UPDATE general_feedback_surveys SET status = 'completed', responses_json = ?, completed_at = ?, updated_at = ? WHERE token = ? AND status = 'pending'").bind(JSON.stringify({ ...values, comment }), now, now, token).run();
    if (!general.meta.changes) return Response.json({ error: 'This survey has already been completed or is unavailable.' }, { status: 409 });
  }
  return Response.json({ ok: true });
}
