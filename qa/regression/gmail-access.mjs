import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url)),ts=createRequire(root+'package.json')('typescript'),checks=[];
async function load(file,prefix=''){const source=fs.readFileSync(root+file,'utf8').replace(/^import .*?;\r?\n/gm,'');return import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(prefix+'\n'+source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));}
function check(name,value){assert.ok(value,name);checks.push(name);console.log('PASS',name);}
let authorized=false,allowed=true,saved=0,begun=0;
class ScheduleError extends Error{constructor(message,status=400){super(message);this.status=status;}}
globalThis.__gmailRoute={operator:async()=>{if(!authorized)throw new ScheduleError('Operator only',403);},database:{},ScheduleError,body:async r=>r.json(),clean:(v,n)=>typeof v==='string'?v.trim().slice(0,n):'',failure:e=>Response.json({error:e.message},{status:e.status||500}),consumeAuthAttempt:async()=>({allowed}),gmailStatus:async()=>({clientConfigured:true,connected:false,redirectUri:'https://app.example.invalid/api/system-email/gmail/callback'}),saveGmailClient:async()=>saved++,beginGmail:async()=>{begun++;return {url:'https://accounts.google.com/o/oauth2/v2/auth?state=fixture',cookie:'state=fixture; HttpOnly; SameSite=Lax; Secure'};}};
const route=await load('app/api/system-email/gmail/route.ts','const {operator,database,ScheduleError,body,clean,failure,consumeAuthAttempt,gmailStatus,saveGmailClient,beginGmail}=globalThis.__gmailRoute;');
const req=(action,origin='https://app.example.invalid')=>new Request('https://app.example.invalid/api/system-email/gmail',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({action,clientId:'fixture',clientSecret:'fixture',sender:'fixture@gmail.com'})});
check('Anonymous operator settings GET denied',(await route.GET(new Request('https://app.example.invalid/api/system-email/gmail'))).status===403);
check('Anonymous configuration write denied',(await route.POST(req('save'))).status===403&&saved===0);authorized=true;
check('Cross-origin setup write denied',(await route.POST(req('save','https://attacker.invalid'))).status===403&&saved===0);
allowed=false;check('Setup rate limit enforced',(await route.POST(req('save'))).status===429&&saved===0);allowed=true;
check('Operator can save configuration',(await route.POST(req('save'))).status===200&&saved===1);
const connection=await route.POST(req('connect'));check('Connect sets HttpOnly state cookie',connection.status===200&&connection.headers.get('set-cookie').includes('HttpOnly')&&begun===1);
check('Unknown setup action denied',(await route.POST(req('unknown'))).status===400);
const {mailReadiness}=await load('lib/mail-readiness.ts');check('Connected Gmail is distinct from unverified Resend Gmail sender',mailReadiness('sender@gmail.com','gmail').publicRecoveryReady===true&&mailReadiness('sender@gmail.com').publicRecoveryReady===false);
const connections=await load('lib/connections.ts',"const env={INTEGRATIONS_ENCRYPTION_KEY:'a'.repeat(64)},database={},ScheduleError=class extends Error{};");
const payload={clientId:'fixture.apps.googleusercontent.com',clientSecret:'fixture-secret',refreshToken:'fixture-refresh'};const sealed=await connections.seal(payload,'platform','email');check('Gmail OAuth payload stored as encrypted ciphertext',!sealed.includes('fixture')&&sealed.includes('.'));
check('Encrypted Gmail payload round trips',(await connections.unseal({encryptedConfig:sealed,businessId:'platform',channel:'email'})).refreshToken===payload.refreshToken);
await assert.rejects(()=>connections.unseal({encryptedConfig:sealed,businessId:'another-business',channel:'email'}));checks.push('OAuth secrets cannot decrypt under another business context');console.log('PASS',checks.at(-1));
fs.writeFileSync(new URL('./results/gmail-access.json',import.meta.url),JSON.stringify({passed:checks.length,checks,externalMessagesSent:0},null,2));
