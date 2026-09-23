import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';

const database = env as unknown as MaracitaRuntime;

async function workspace(request: Request) {
  const identity = await authenticatedIdentity(request);
  if (!identity) return null;
  return database.DB.prepare('SELECT b.id FROM businesses b INNER JOIN memberships m ON m.business_id = b.id INNER JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{ id: string }>();
}

export async function GET(request: Request) {
  const business = await workspace(request);
  if (!business) return Response.json({ error: 'Create a workspace first.' }, { status: 401 });

  const [feedback, generalFeedback, recentMessages] = await Promise.all([
    database.DB.prepare("SELECT f.id, f.customer_id AS customerId, f.status, f.token, f.responses_json AS responsesJson, f.completed_at AS completedAt, f.created_at AS createdAt, c.first_name || ' ' || c.last_name AS customerName, c.phone, c.email, a.starts_at AS startsAt, sv.name AS serviceName FROM feedback_surveys f INNER JOIN customers c ON c.id = f.customer_id INNER JOIN appointments a ON a.id = f.appointment_id INNER JOIN services sv ON sv.id = a.service_id WHERE f.business_id = ? ORDER BY CASE f.status WHEN 'pending' THEN 0 ELSE 1 END, f.created_at DESC LIMIT 80").bind(business.id).all(),
    database.DB.prepare("SELECT f.id, f.customer_id AS customerId, f.status, f.token, f.responses_json AS responsesJson, f.completed_at AS completedAt, f.created_at AS createdAt, c.first_name || ' ' || c.last_name AS customerName, c.phone, c.email, f.created_at AS startsAt, 'General feedback' AS serviceName FROM general_feedback_surveys f INNER JOIN customers c ON c.id = f.customer_id WHERE f.business_id = ? ORDER BY CASE f.status WHEN 'pending' THEN 0 ELSE 1 END, f.created_at DESC LIMIT 80").bind(business.id).all(),
    database.DB.prepare("SELECT m.customer_id AS customerId, m.body, m.created_at AS createdAt, c.first_name || ' ' || c.last_name AS customerName FROM customer_messages m INNER JOIN customers c ON c.id = m.customer_id WHERE m.business_id = ? ORDER BY m.created_at DESC LIMIT 80").bind(business.id).all(),
  ]);

  const surveys = [...feedback.results, ...generalFeedback.results].map((row) => {
    const item = row as Record<string, unknown>;
    let responses: Record<string, unknown> = {};
    if (typeof item.responsesJson === 'string') {
      try { responses = JSON.parse(item.responsesJson) as Record<string, unknown>; } catch { responses = {}; }
    }
    const scores = ['arrival', 'service', 'staff', 'payment', 'location'].map((key) => Number(responses[key])).filter((value) => Number.isFinite(value) && value > 0);
    const average = scores.length ? Math.round((scores.reduce((total, value) => total + value, 0) / scores.length) * 10) / 10 : null;
    return { ...item, status: typeof item.status === 'string' ? item.status : 'pending', responses, average };
  });
  const pending = surveys.filter((survey) => survey.status === 'pending').length;
  const completed = surveys.filter((survey) => survey.status === 'completed').length;
  const averages = surveys.map((survey) => survey.average).filter((value): value is number => typeof value === 'number');

  return Response.json({
    surveys,
    recentMessages: recentMessages.results,
    pulse: {
      ready: pending,
      completed,
      average: averages.length ? Math.round((averages.reduce((total, value) => total + value, 0) / averages.length) * 10) / 10 : null,
    },
  });
}
