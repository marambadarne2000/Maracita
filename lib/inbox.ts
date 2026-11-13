import {database} from '@/lib/scheduling';
import type {Connection} from '@/lib/connections';
import {tokenHash} from '@/lib/local-auth';
export async function receiveMessage(connection:Connection,eventId:string,sender:string,name:string,message:string){
 const prior=await database.DB.prepare('SELECT event_id FROM integration_events WHERE connection_id=? AND event_id=?').bind(connection.id,eventId).first();if(prior)return false;
 const now=new Date().toISOString(),customer=await database.DB.prepare("SELECT id,first_name||' '||last_name AS name FROM customers WHERE business_id=? AND (lower(email)=lower(?) OR phone=?) LIMIT 1").bind(connection.businessId,sender,sender).first<{id:string;name:string}>();
 const old=await database.DB.prepare('SELECT id FROM inbox_conversations WHERE business_id=? AND channel=? AND external_contact_id=?').bind(connection.businessId,connection.channel,sender).first<{id:string}>();
 const conversationId=old?.id||'inbound:'+await tokenHash(`${connection.businessId}:${connection.channel}:${sender}`),messageId='received:'+await tokenHash(`${connection.id}:${eventId}`);
 try{await database.DB.batch([
  database.DB.prepare('INSERT INTO integration_events(connection_id,event_id,created_at) VALUES(?,?,?)').bind(connection.id,eventId,now),
  database.DB.prepare('INSERT INTO inbox_conversations(id,business_id,connection_id,customer_id,channel,external_contact_id,contact_name,unread_count,last_message_at) VALUES(?,?,?,?,?,?,?,1,?) ON CONFLICT(business_id,channel,external_contact_id) DO UPDATE SET connection_id=excluded.connection_id,customer_id=COALESCE(excluded.customer_id,inbox_conversations.customer_id),unread_count=unread_count+1,last_message_at=excluded.last_message_at').bind(conversationId,connection.businessId,connection.id,customer?.id||null,connection.channel,sender,customer?.name||name||sender,now),
  database.DB.prepare("INSERT INTO inbox_messages(id,business_id,conversation_id,direction,body,delivery_status,provider_message_id,created_at) VALUES(?,?,?,'inbound',?,'received',?,?)").bind(messageId,connection.businessId,conversationId,message.slice(0,10000),eventId,now),
 ]);}catch(error){if(/UNIQUE constraint failed: integration_events|UNIQUE constraint failed: inbox_messages.id/.test(String(error)))return false;throw error;}
 if(customer)await database.DB.prepare('INSERT OR IGNORE INTO customer_messages(id,business_id,customer_id,author_type,body,created_at) VALUES(?,?,?,?,?,?)').bind('inbox:'+messageId,connection.businessId,customer.id,`inbox_customer_${connection.channel}`,message.slice(0,10000),now).run().catch(()=>console.error('Inbox CRM mirror write failed; original inbound message retained.'));
 return true;
}
