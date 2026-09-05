import { drizzle } from 'drizzle-orm/d1';

/**
 * The only database entry point used by server code.  Browser code never
 * receives the D1 binding, so business-level authorization stays server-side.
 */
export type MaracitaRuntime = { DB: D1Database };

export function createDatabase(env: MaracitaRuntime) {
  return drizzle(env.DB);
}
