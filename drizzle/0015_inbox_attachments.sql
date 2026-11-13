CREATE TABLE IF NOT EXISTS inbox_attachments (
 message_id TEXT PRIMARY KEY REFERENCES inbox_messages(id), business_id TEXT NOT NULL REFERENCES businesses(id),
 name TEXT NOT NULL, mime_type TEXT NOT NULL, data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inbox_attachments_business ON inbox_attachments(business_id);
INSERT OR IGNORE INTO inbox_attachments(message_id,business_id,name,mime_type,data)
 SELECT 'legacy:'||m.id,m.business_id,m.attachment_name,COALESCE(m.attachment_type,'application/octet-stream'),m.attachment_data
 FROM customer_messages m JOIN inbox_messages i ON i.id='legacy:'||m.id
 WHERE m.attachment_data IS NOT NULL AND m.attachment_name IS NOT NULL AND m.id NOT LIKE 'inbox:%';
