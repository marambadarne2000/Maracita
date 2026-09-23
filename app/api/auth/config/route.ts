import { env } from 'cloudflare:workers';
type SupabaseRuntime = { SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };
export async function GET() { const settings = env as unknown as SupabaseRuntime; if (!settings.SUPABASE_URL || !settings.SUPABASE_PUBLISHABLE_KEY) return Response.json({ error: 'Authentication is not configured yet.' }, { status: 503, headers: { 'cache-control': 'no-store' } }); return Response.json({ url: settings.SUPABASE_URL, publishableKey: settings.SUPABASE_PUBLISHABLE_KEY }, { headers: { 'cache-control': 'no-store' } }); }
