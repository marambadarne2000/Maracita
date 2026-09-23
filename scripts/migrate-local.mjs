import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const migrations = readdirSync('drizzle').filter((file) => file.endsWith('.sql')).sort();
for (const migration of migrations) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB', '--local', '--persist-to', '.wrangler/state', '--config', 'dist/server/wrangler.json', '--file', join('drizzle', migration)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
