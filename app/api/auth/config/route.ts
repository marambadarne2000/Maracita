import {env} from 'cloudflare:workers';
import {systemMail} from '@/lib/system-mail';
export async function GET(){const settings=env as unknown as {SUPABASE_URL?:string;SUPABASE_PUBLISHABLE_KEY?:string};return Response.json({provider:'local',passwordSignIn:true,passwordRecovery:{emailConfigured:Boolean(await systemMail())},...(settings.SUPABASE_URL&&settings.SUPABASE_PUBLISHABLE_KEY?{url:settings.SUPABASE_URL,publishableKey:settings.SUPABASE_PUBLISHABLE_KEY}:{})},{headers:{'cache-control':'no-store'}});}
