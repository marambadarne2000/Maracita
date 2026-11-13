CREATE TABLE IF NOT EXISTS booking_settings (
 business_id TEXT PRIMARY KEY REFERENCES businesses(id), slug TEXT NOT NULL UNIQUE,
 public_enabled INTEGER NOT NULL DEFAULT 0, lead_minutes INTEGER NOT NULL DEFAULT 60,
 horizon_days INTEGER NOT NULL DEFAULT 90, slot_interval INTEGER NOT NULL DEFAULT 15,
 auto_fill INTEGER NOT NULL DEFAULT 0, offer_minutes INTEGER NOT NULL DEFAULT 15,
 offer_channel TEXT NOT NULL DEFAULT 'email', updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS staff_hours (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), staff_id TEXT NOT NULL REFERENCES staff(id),
 weekday INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6), start_minute INTEGER NOT NULL, end_minute INTEGER NOT NULL,
 closed INTEGER NOT NULL DEFAULT 0, UNIQUE(business_id,staff_id,weekday)
);
CREATE TABLE IF NOT EXISTS time_off (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), staff_id TEXT REFERENCES staff(id),
 starts_at TEXT NOT NULL, ends_at TEXT NOT NULL CHECK(ends_at>starts_at), reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_time_off_range ON time_off(business_id,starts_at,ends_at);
CREATE TABLE IF NOT EXISTS public_booking_tokens (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), appointment_id TEXT NOT NULL UNIQUE REFERENCES appointments(id), token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS waitlist_offers (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), source_appointment_id TEXT NOT NULL REFERENCES appointments(id),
 waitlist_id TEXT NOT NULL REFERENCES waitlist_entries(id), customer_id TEXT NOT NULL REFERENCES customers(id),
 staff_id TEXT NOT NULL REFERENCES staff(id), service_id TEXT NOT NULL REFERENCES services(id), starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending', expires_at TEXT NOT NULL,
 delivery_status TEXT NOT NULL DEFAULT 'pending', channel TEXT NOT NULL, appointment_id TEXT REFERENCES appointments(id), created_at TEXT NOT NULL,
 UNIQUE(source_appointment_id,waitlist_id)
);
CREATE INDEX IF NOT EXISTS idx_waitlist_offers_status ON waitlist_offers(business_id,status,expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_one_pending_offer ON waitlist_offers(source_appointment_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS integrations (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), channel TEXT NOT NULL,
 external_account_id TEXT NOT NULL DEFAULT '', display_name TEXT NOT NULL DEFAULT '', encrypted_config TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(business_id,channel)
);
CREATE TABLE IF NOT EXISTS inbox_conversations (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), connection_id TEXT REFERENCES integrations(id),
 customer_id TEXT REFERENCES customers(id), channel TEXT NOT NULL, external_contact_id TEXT NOT NULL,
 contact_name TEXT NOT NULL, unread_count INTEGER NOT NULL DEFAULT 0, last_message_at TEXT NOT NULL,
 UNIQUE(business_id,channel,external_contact_id)
);
CREATE TABLE IF NOT EXISTS inbox_messages (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), conversation_id TEXT NOT NULL REFERENCES inbox_conversations(id),
 direction TEXT NOT NULL, body TEXT NOT NULL, delivery_status TEXT NOT NULL, provider_message_id TEXT,
 error TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_conversation ON inbox_messages(business_id,conversation_id,created_at);
CREATE TABLE IF NOT EXISTS integration_events (
 connection_id TEXT NOT NULL REFERENCES integrations(id), event_id TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(connection_id,event_id)
);
INSERT OR IGNORE INTO inbox_conversations(id,business_id,customer_id,channel,external_contact_id,contact_name,last_message_at)
 SELECT 'legacy:'||m.business_id||':'||m.customer_id,m.business_id,m.customer_id,'internal',m.customer_id,c.first_name||' '||c.last_name,MAX(m.created_at)
 FROM customer_messages m JOIN customers c ON c.id=m.customer_id WHERE m.id NOT LIKE 'inbox:%' AND m.author_type NOT LIKE 'inbox_%' GROUP BY m.business_id,m.customer_id;
INSERT OR IGNORE INTO inbox_messages(id,business_id,conversation_id,direction,body,delivery_status,created_at)
 SELECT 'legacy:'||id,business_id,'legacy:'||business_id||':'||customer_id,'outbound',body,'saved',created_at FROM customer_messages WHERE id NOT LIKE 'inbox:%' AND author_type NOT LIKE 'inbox_%';
CREATE TRIGGER IF NOT EXISTS appointment_no_overlap_insert BEFORE INSERT ON appointments
 WHEN NEW.status NOT IN ('cancelled','no_show')
 BEGIN
 SELECT CASE WHEN NEW.ends_at<=NEW.starts_at THEN RAISE(ABORT,'INVALID_APPOINTMENT_RANGE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM time_off t WHERE t.business_id=NEW.business_id AND (t.staff_id IS NULL OR t.staff_id=NEW.staff_id) AND t.starts_at<NEW.ends_at AND t.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_UNAVAILABLE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.business_id=NEW.business_id AND a.staff_id=NEW.staff_id AND a.status NOT IN ('cancelled','no_show') AND a.starts_at<NEW.ends_at AND a.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_CONFLICT') END;
 END;
CREATE TRIGGER IF NOT EXISTS appointment_no_overlap_update BEFORE UPDATE OF starts_at,ends_at,staff_id,status ON appointments
 WHEN NEW.status NOT IN ('cancelled','no_show')
 BEGIN
 SELECT CASE WHEN NEW.ends_at<=NEW.starts_at THEN RAISE(ABORT,'INVALID_APPOINTMENT_RANGE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM time_off t WHERE t.business_id=NEW.business_id AND (t.staff_id IS NULL OR t.staff_id=NEW.staff_id) AND t.starts_at<NEW.ends_at AND t.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_UNAVAILABLE') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.id<>NEW.id AND a.business_id=NEW.business_id AND a.staff_id=NEW.staff_id AND a.status NOT IN ('cancelled','no_show') AND a.starts_at<NEW.ends_at AND a.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_CONFLICT') END;
 END;

CREATE TRIGGER IF NOT EXISTS closure_no_bookings_insert BEFORE INSERT ON time_off
 BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.business_id=NEW.business_id AND (NEW.staff_id IS NULL OR a.staff_id=NEW.staff_id) AND a.status NOT IN ('cancelled','no_show','completed') AND a.starts_at<NEW.ends_at AND a.ends_at>NEW.starts_at) THEN RAISE(ABORT,'APPOINTMENT_UNAVAILABLE') END;
 END;
