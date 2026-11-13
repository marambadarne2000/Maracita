import {mailReadiness} from '@/lib/mail-readiness';
import {systemMail} from '@/lib/system-mail';
import {SUPPORT_EMAIL} from '@/lib/operations';
export async function GET(){try{const connection=await systemMail();return Response.json({emailConfigured:Boolean(connection),...mailReadiness(connection?.externalAccountId,connection?.provider),supportEmail:SUPPORT_EMAIL},{headers:{'cache-control':'no-store'}});}catch{return Response.json({emailConfigured:false,supportEmail:SUPPORT_EMAIL},{status:503,headers:{'cache-control':'no-store'}});}}
