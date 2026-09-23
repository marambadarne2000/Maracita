import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { removeSession } from '@/lib/local-auth';
const database = env as unknown as MaracitaRuntime;
export async function POST(request: Request) { const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]; if (token) await removeSession(database, token); return Response.json({ ok: true }); }
