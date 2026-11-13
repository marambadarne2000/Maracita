import worker from './dist/server/index.js';
export default {
 fetch(request,env,ctx){return worker.fetch(request,env,ctx);},
 async scheduled(_event,env,ctx){
  if(!env.JOB_SECRET||!env.PUBLIC_BASE_URL)return;
  const request=new Request(new URL('/api/internal/jobs',env.PUBLIC_BASE_URL),{method:'POST',headers:{Authorization:`Bearer ${env.JOB_SECRET}`}});
  ctx.waitUntil(worker.fetch(request,env,ctx).then(response=>{if(!response.ok)console.error('Scheduled offer processing failed:',response.status);}));
 }
};
