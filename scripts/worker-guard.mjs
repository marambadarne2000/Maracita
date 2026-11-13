import application from './application.js';
const denial=(message,status)=>Response.json({error:message},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url),origin=request.headers.get('origin');
  // Enforce the same global rules before Vinext clones request streams.
  // Middleware retains its checks as an additional layer.
  if(!['GET','HEAD','OPTIONS'].includes(request.method)&&origin&&origin!==url.origin){if(Number(request.headers.get('content-length')||0)<=1500000)await request.arrayBuffer().catch(()=>{});return denial('Cross-site writes are not allowed.',403);}
  if(Number(request.headers.get('content-length')||0)>1500000)return denial('Request is too large.',413);
  return application.fetch(request,env,ctx);
 },
 async scheduled(_event,env,ctx){if(!env.JOB_SECRET||!env.PUBLIC_BASE_URL){console.error('Scheduled processing requires configuration');return;}ctx.waitUntil(application.fetch(new Request(new URL('/api/internal/jobs',env.PUBLIC_BASE_URL),{method:'POST',headers:{Authorization:`Bearer ${env.JOB_SECRET}`}}),env,ctx).then(r=>{if(!r.ok)throw Error('Scheduled processing failed: '+r.status);}));}
};
