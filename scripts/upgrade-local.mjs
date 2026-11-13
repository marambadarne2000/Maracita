import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for (const migration of ['0013_scheduling_and_inbox.sql','0014_atomic_closures.sql','0015_inbox_attachments.sql','0016_reminders_resources.sql','0017_delivery_events.sql','0018_launch_readiness.sql']) {
const result=spawnSync(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'d1','execute','DB','--local','--persist-to',resolve(root,'.wrangler/state'),'--config',resolve(root,'dist/server/wrangler.json'),'--file',resolve(root,'drizzle',migration)],{cwd:root,stdio:'inherit'});
if(result.status!==0)process.exit(result.status??1);
}

