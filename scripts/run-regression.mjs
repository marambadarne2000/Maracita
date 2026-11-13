import {spawnSync} from 'node:child_process';import {mkdirSync} from 'node:fs';import {fileURLToPath} from 'node:url';
mkdirSync(new URL('../qa/regression/results/',import.meta.url),{recursive:true});
for(const name of ['inbox-recovery','inbound','trial-messaging','gmail-access']){const r=spawnSync(process.execPath,[fileURLToPath(new URL('../qa/regression/'+name+'.mjs',import.meta.url))],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
