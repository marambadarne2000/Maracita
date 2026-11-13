import { spawn } from 'node:child_process';
import { readFileSync,existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const variables=resolve(root,'.dev.vars');
const args=[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'dev','--config',resolve(root,'dist/server/wrangler.json'),'--persist-to',resolve(root,'.wrangler/state'),'--port','3000',...(existsSync(variables)?['--env-file',variables]:[]),...process.argv.slice(2)];
const child=spawn(process.execPath,args,{cwd:root,stdio:'inherit'});
let jobKey='';if(existsSync(variables)){const line=readFileSync(variables,'utf8').split(/\r?\n/).find(line=>line.startsWith('JOB_SECRET='));jobKey=line?.slice('JOB_SECRET='.length).trim().replace(/^"|"$/g,'')||'';}
let running=false;let backupRunning=false;const backupOnce=()=>{if(backupRunning||process.env.MARACITA_DISABLE_JOBS==='1')return;backupRunning=true;const task=spawn(process.execPath,[resolve(root,'scripts/backup-local.mjs')],{cwd:root,stdio:['ignore','ignore','pipe']});task.on('exit',code=>{backupRunning=false;if(code)console.error('Encrypted backup or restore verification failed; check Launch Center.');});};const backupTimer=process.env.MARACITA_DISABLE_JOBS==='1'?null:setInterval(backupOnce,6*60*60*1000);if(backupTimer)backupOnce();
const timer=process.env.MARACITA_DISABLE_JOBS==='1'||!jobKey?null:setInterval(async()=>{if(running)return;running=true;try{await fetch('http://127.0.0.1:3000/api/internal/jobs',{method:'POST',headers:{Authorization:`Bearer ${jobKey}`},signal:AbortSignal.timeout(25000)});}catch{/* Startup and provider failures are retried on the next tick. */}finally{running=false;}},60000);
child.on('exit',code=>{if(timer)clearInterval(timer);if(backupTimer)clearInterval(backupTimer);process.exit(code??1);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(timer)clearInterval(timer);if(backupTimer)clearInterval(backupTimer);child.kill(signal);});
