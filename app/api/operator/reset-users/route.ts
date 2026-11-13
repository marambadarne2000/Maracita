import {operator} from '@/lib/operations';
import {body,clean,failure,ScheduleError} from '@/lib/scheduling';
import {sessionHeaders} from '@/lib/session-cookie';
import {resetSummary,prepareUserReset,executeUserReset} from '@/lib/reset-users';
export async function GET(request:Request){try{await operator(request);return Response.json(await resetSummary(),{headers:{'cache-control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(request:Request){try{await operator(request);if(request.headers.get('origin')!==new URL(request.url).origin)throw new ScheduleError('Open this reset form on the application website.',403);const d=await body(request);if(d.action==='prepare')return Response.json(await prepareUserReset(),{headers:{'cache-control':'no-store'}});if(d.action!=='execute')throw new ScheduleError('Choose a supported reset action.');const result=await executeUserReset(clean(d.nonce,64),clean(d.phrase,80),d.confirmed===true);return Response.json(result,{headers:sessionHeaders(request,'',true)});}catch(e){return failure(e);}}
