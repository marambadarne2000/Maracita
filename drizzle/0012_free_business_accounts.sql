CREATE TABLE IF NOT EXISTS business_credentials (
 business_id TEXT PRIMARY KEY NOT NULL REFERENCES businesses(id),
 account_id TEXT NOT NULL REFERENCES accounts(id),
 business_number TEXT NOT NULL UNIQUE,
 owner_id_hash TEXT NOT NULL,
 city TEXT NOT NULL DEFAULT '',
 address TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL
);
UPDATE businesses SET status = 'active';
UPDATE subscriptions SET plan_code = 'Free', status = 'active', trial_ends_at = NULL, current_period_ends_at = NULL;
CREATE TABLE IF NOT EXISTS business_tasks (
 id TEXT PRIMARY KEY NOT NULL,
 business_id TEXT NOT NULL REFERENCES businesses(id),
 title TEXT NOT NULL,
 due_date TEXT,
 completed INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_business_tasks_business ON business_tasks(business_id, completed);
