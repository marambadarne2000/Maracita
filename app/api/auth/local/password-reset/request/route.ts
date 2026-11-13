import {mailReadiness} from '@/lib/mail-readiness';
import {systemMail,sendSystemMail} from '@/lib/system-mail';
import {env} from 'cloudflare:workers';
import type {MaracitaRuntime} from '@/db/client';
import {randomToken,tokenHash} from '@/lib/local-auth';
import {consumeAuthAttempt} from '@/lib/auth-rate-limit';
import {incident,SUPPORT_EMAIL} from '@/lib/operations';
const database=env as unknown as MaracitaRuntime;
export async function POST(request:Request){
 const input=await request.json().catch(()=>({})) as {email?:unknown};
 const email=typeof input.email==='string'?input.email.trim().toLowerCase().slice(0,254):'';
 const headers={'cache-control':'no-store'};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({error:'Enter a valid email address.'},{status:400,headers});
 const address=request.headers.get('cf-connecting-ip')||'local';
 const ipRate=await consumeAuthAttempt(database,'reset-ip:'+await tokenHash(address),{limit:15,windowMinutes:15});
 const rate=await consumeAuthAttempt(database,'reset:'+email,{limit:3,windowMinutes:15});
 if(!ipRate.allowed||!rate.allowed)return Response.json({error:'Too many password-reset requests. Please wait before trying again.'},{status:429,headers:{...headers,'retry-after':String(Math.max(ipRate.retryAfterSeconds,rate.retryAfterSeconds))}});
 // Check shared configuration before looking up an account. A missing sender
 // must return the same result for registered and unregistered addresses.
 const connection=await systemMail();
 if(!connection)return Response.json({error:'Password recovery email is unavailable. Contact support or ask the application owner to configure account recovery.',code:'EMAIL_NOT_CONFIGURED',supportEmail:SUPPORT_EMAIL},{status:503,headers});
 if(['test_only','domain_required'].includes(mailReadiness(connection.externalAccountId,connection.provider).mode))return Response.json({error:'Public password recovery is not enabled. The application owner must authorize Gmail or configure a verified sending domain.',code:'EMAIL_TEST_MODE',supportEmail:SUPPORT_EMAIL},{status:503,headers});
 const account=await database.DB.prepare('SELECT id,full_name AS fullName FROM accounts WHERE email=?').bind(email).first<{id:string;fullName:string}>();
 if(!account)return Response.json({ok:true},{headers});
 const token=randomToken(),hash=await tokenHash(token),now=new Date();
 const publicOrigin=(env as unknown as {PUBLIC_BASE_URL?:string}).PUBLIC_BASE_URL||new URL(request.url).origin;
 const resetUrl=new URL('/',publicOrigin);resetUrl.hash=new URLSearchParams({reset:token}).toString();
 await database.DB.prepare('DELETE FROM password_reset_tokens WHERE account_id=? OR expires_at<=?').bind(account.id,now.toISOString()).run();
 await database.DB.prepare('INSERT INTO password_reset_tokens(id,account_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),account.id,hash,new Date(now.getTime()+1800000).toISOString(),now.toISOString()).run();
 const sent=await sendSystemMail(email,'Reset your Maracita password',`Hello ${account.fullName||'there'},\n\nChoose a new password using this private link. It expires in 30 minutes and can be used once:\n${resetUrl.toString()}\n\nIf you did not request a reset, ignore this message. Never share this link.\nMaracita · Created by Maram Abbas`);
 if(!sent.ok){await database.DB.prepare('DELETE FROM password_reset_tokens WHERE token_hash=?').bind(hash).run();await incident('email','password_reset_delivery_failed','/api/auth/local/password-reset/request');return Response.json({error:mailReadiness(connection.externalAccountId,connection.provider).mode==='test_only'?'Account recovery is currently limited by the application email provider test mode. The application owner must connect Gmail or activate a verified sending domain. Your personal email address does not need to change.':'The reset email could not be sent. Contact support; the application owner must check the system email sender.',code:mailReadiness(connection.externalAccountId,connection.provider).mode==='test_only'?'EMAIL_TEST_MODE':'EMAIL_DELIVERY_FAILED',supportEmail:SUPPORT_EMAIL},{status:502,headers});}
 return Response.json({ok:true},{headers});
}
