import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { authenticatedIdentity } from '@/lib/auth-server';
const database = env as unknown as MaracitaRuntime;
async function business(request: Request) {
 const identity = await authenticatedIdentity(request);
 if (!identity) return null;
 return database.DB.prepare('SELECT b.id FROM businesses b JOIN memberships m ON m.business_id = b.id JOIN accounts a ON a.id = m.account_id WHERE a.auth_subject = ? ORDER BY b.created_at DESC LIMIT 1').bind(identity.subject).first<{id:string}>();
}
export async function GET(request: Request) {
 const workspace = await business(request);
 if (!workspace) return Response.json({error:'Sign in to your business.'},{status:401});
 const rows = await database.DB.prepare('SELECT id, title, due_date AS dueDate, completed FROM business_tasks WHERE business_id = ? ORDER BY completed, CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date, created_at DESC LIMIT 100').bind(workspace.id).all();
 return Response.json({tasks:rows.results});
}
export async function POST(request: Request) {
 const workspace = await business(request);
 if (!workspace) return Response.json({error:'Sign in to your business.'},{status:401});
 const body = ((await request.json().catch(()=>({}))) || {}) as {title?:unknown;dueDate?:unknown};
 const title = typeof body.title === 'string' ? body.title.trim() : '';
 const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null;
 if (!title || title.length>200 || (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate)) || new Date(dueDate).toISOString().slice(0,10)!==dueDate))) return Response.json({error:'Enter a task (up to 200 characters) and a valid date.'},{status:400});
 const id = crypto.randomUUID();
 await database.DB.prepare('INSERT INTO business_tasks (id,business_id,title,due_date,created_at) VALUES (?,?,?,?,?)').bind(id,workspace.id,title,dueDate,new Date().toISOString()).run();
 return Response.json({id},{status:201});
}
export async function PATCH(request: Request) {
 const workspace = await business(request);
 if (!workspace) return Response.json({error:'Sign in to your business.'},{status:401});
 const body = ((await request.json().catch(()=>({}))) || {}) as {id?:unknown;completed?:unknown};
 if (typeof body.id!=='string'||typeof body.completed!=='boolean') return Response.json({error:'Invalid task update.'},{status:400});
 const result = await database.DB.prepare('UPDATE business_tasks SET completed = ? WHERE id = ? AND business_id = ?').bind(body.completed?1:0,body.id,workspace.id).run();
 return result.meta.changes ? Response.json({ok:true}) : Response.json({error:'Task not found.'},{status:404});
}
export async function DELETE(request: Request) {
 const workspace = await business(request);
 if (!workspace) return Response.json({error:'Sign in to your business.'},{status:401});
 const id = new URL(request.url).searchParams.get('id');
 if (!id) return Response.json({error:'Task ID required.'},{status:400});
 const result = await database.DB.prepare('DELETE FROM business_tasks WHERE id = ? AND business_id = ?').bind(id,workspace.id).run();
 return result.meta.changes ? Response.json({ok:true}) : Response.json({error:'Task not found.'},{status:404});
}
