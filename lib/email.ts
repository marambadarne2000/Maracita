import {sendSystemMail} from '@/lib/system-mail';
export async function sendEmail(to:string,subject:string,message:string){return sendSystemMail(to,subject,message);}
export function emailHtml(message:string){return message.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
