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

export async function POST(request:Request){try{const d=await request.json() as Record<string,unknown>;if(!d||typeof d!=='object')return Response.json({error:'Enter a valid message.'},{status:400});const {POST:send}=await import('@/app/api/inbox/route');const forward=(value:unknown)=>new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(value)});const opened=await send(forward({action:'new',customerId:d.customerId,channel:d.delivery==='email'?'email':'internal'}));const thread=await opened.json() as {id?:string;error?:string};if(!opened.ok)return Response.json(thread,{status:opened.status});const sent=await send(forward({conversationId:thread.id,message:d.message,attachment:d.attachment,subject:d.subject,requestId:typeof d.requestId==='string'?d.requestId:crypto.randomUUID()}));const result=await sent.json() as Record<string,unknown>;return Response.json({...result,delivered:false,submitted:result.status==='sent',note:result.status==='saved'?'Saved privately; not sent to the customer.':'Provider acceptance is not delivery confirmation.'},{status:sent.ok?201:sent.status});}catch{return Response.json({error:'The message could not be processed.'},{status:400});}}

