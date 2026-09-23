import type { MaracitaRuntime } from '@/db/client';

type LimitOptions = { limit: number; windowMinutes: number };
type StoredLimit = { attempts: number; windowStartedAt: string; blockedUntil: string | null };

export async function consumeAuthAttempt(database: MaracitaRuntime, key: string, options: LimitOptions) {
  const now = new Date();
  const nowIso = now.toISOString();
  const stored = await database.DB.prepare('SELECT attempts, window_started_at AS windowStartedAt, blocked_until AS blockedUntil FROM auth_rate_limits WHERE key = ?').bind(key).first<StoredLimit>();
  const retryAfterSeconds = (until: string) => Math.max(1, Math.ceil((new Date(until).getTime() - now.getTime()) / 1000));

  if (stored?.blockedUntil && new Date(stored.blockedUntil).getTime() > now.getTime()) {
    return { allowed: false, retryAfterSeconds: retryAfterSeconds(stored.blockedUntil) };
  }

  const windowStarted = stored ? new Date(stored.windowStartedAt) : now;
  const expired = now.getTime() - windowStarted.getTime() >= options.windowMinutes * 60 * 1000;
  const attempts = expired ? 1 : (stored?.attempts ?? 0) + 1;
  const blockedUntil = attempts > options.limit ? new Date(now.getTime() + options.windowMinutes * 60 * 1000).toISOString() : null;

  await database.DB.prepare(
    'INSERT INTO auth_rate_limits (key, attempts, window_started_at, blocked_until, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET attempts = excluded.attempts, window_started_at = excluded.window_started_at, blocked_until = excluded.blocked_until, updated_at = excluded.updated_at',
  ).bind(key, attempts, expired ? nowIso : windowStarted.toISOString(), blockedUntil, nowIso).run();

  if (blockedUntil) return { allowed: false, retryAfterSeconds: retryAfterSeconds(blockedUntil) };
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function clearAuthAttempts(database: MaracitaRuntime, key: string) {
  await database.DB.prepare('DELETE FROM auth_rate_limits WHERE key = ?').bind(key).run();
}
