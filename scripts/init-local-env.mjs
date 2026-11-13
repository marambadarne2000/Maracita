import {randomBytes} from 'node:crypto';
import {writeFileSync,existsSync} from 'node:fs';
const path=new URL('../.dev.vars',import.meta.url);
if(existsSync(path)){console.log('.dev.vars already exists; preserved without changes.');}else{const token=()=>randomBytes(32).toString('hex');writeFileSync(path,`INTEGRATIONS_ENCRYPTION_KEY=${token()}\nJOB_SECRET=${token()}\nBACKUP_ENCRYPTION_KEY=${token()}\nPUBLIC_BASE_URL=http://localhost:3000\nSUPPORT_EMAIL=maram.software.tech@gmail.com\nENVIRONMENT=development\nALLOW_DEMO=1\n`,{flag:'wx',mode:0o600});console.log('Created ignored .dev.vars with independent random local keys. Values are not printed.');}
