CREATE TABLE IF NOT EXISTS platform_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS operational_events(id TEXT PRIMARY KEY,business_id TEXT,category TEXT NOT NULL,code TEXT NOT NULL,route TEXT NOT NULL,created_at TEXT NOT NULL,resolved_at TEXT);
CREATE INDEX IF NOT EXISTS operational_events_created ON operational_events(created_at);
CREATE TABLE IF NOT EXISTS launch_evidence(key TEXT PRIMARY KEY,status TEXT NOT NULL,details TEXT NOT NULL,checked_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pilot_feedback(id TEXT PRIMARY KEY,business_id TEXT NOT NULL REFERENCES businesses(id),device TEXT NOT NULL,scenario TEXT NOT NULL,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),notes TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS privacy_requests(id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(id),business_id TEXT NOT NULL REFERENCES businesses(id),kind TEXT NOT NULL CHECK(kind IN('export','correction','deletion')),status TEXT NOT NULL DEFAULT 'requested',details TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS policy_acceptances(account_id TEXT NOT NULL REFERENCES accounts(id),version TEXT NOT NULL,accepted_at TEXT NOT NULL,PRIMARY KEY(account_id,version));
CREATE TABLE IF NOT EXISTS email_verifications(id TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(id),token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,verified_at TEXT,created_at TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS reset_token_single_use BEFORE UPDATE OF used_at ON password_reset_tokens WHEN OLD.used_at IS NOT NULL BEGIN SELECT RAISE(ABORT,'RESET_ALREADY_USED'); END;
