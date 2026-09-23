import { env } from 'cloudflare:workers';
import type { MaracitaRuntime } from '@/db/client';
import { localIdentity } from '@/lib/local-auth';

type SupabaseRuntime = { SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };
type SupabaseUser = { id: string; email?: string; user_metadata?: { full_name?: string } };
export type MaracitaIdentity = { subject: string; email: string; fullName: string };
export const portfolioDemoToken = 'maracita-portfolio-demo';

export async function authenticatedIdentity(request: Request): Promise<MaracitaIdentity | null> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token === portfolioDemoToken) return { subject: 'demo:portfolio', email: 'demo@maracita.local', fullName: 'Portfolio Explorer' };
  if (!token) return null;
  const local = await localIdentity(env as unknown as MaracitaRuntime, token);
  if (local) return { subject: `local:${local.id}`, email: local.email, fullName: local.fullName };
  const settings = env as unknown as SupabaseRuntime;
  if (!settings.SUPABASE_URL || !settings.SUPABASE_PUBLISHABLE_KEY) return null;
  try {
    const response = await fetch(`${settings.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: settings.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const user = await response.json() as SupabaseUser;
    if (!user.id || !user.email) return null;
    return { subject: `supabase:${user.id}`, email: user.email, fullName: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.slice(0, 120) : user.email.split('@')[0].slice(0, 120) };
  } catch { return null; }
}
