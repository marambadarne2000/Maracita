CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_updated_at_idx ON auth_rate_limits(updated_at);
