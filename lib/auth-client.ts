type Session = { access_token?: string; cookieSession?:boolean; refresh_token?: string; user: { id: string; email?: string; user_metadata?: { full_name?: string } } };
const storageKey = 'maracita.session';
const demoToken = 'maracita-portfolio-demo';
export function saveSession(session:Session){localStorage.setItem(storageKey,JSON.stringify({cookieSession:true,user:session.user}));}const save=saveSession;
export function getSession(): Session | null { try { const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) as Session : null; } catch { return null; } }
export function openPortfolioDemo() { save({ access_token: demoToken, user: { id: 'portfolio-demo', email: 'demo@maracita.local', user_metadata: { full_name: 'Portfolio Explorer' } } }); }
export async function signOut() { const session = getSession(); localStorage.removeItem(storageKey); try { await fetch('/api/auth/local/signout', { method: 'POST', headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{},credentials:'same-origin' }); } catch { /* Local sign-out already completed. */ } }
async function localAuth(path: 'signup' | 'signin', body: unknown) { const response = await fetch(`/api/auth/local/${path}`, { method: 'POST', headers: { 'content-type': 'application/json','x-maracita-browser':'1' },credentials:'same-origin', body: JSON.stringify(body) }); const data = await response.json().catch(() => ({})) as Session & { error?: string }; if (!response.ok) throw new Error(data.error || 'Authentication request failed.'); return data; }
export async function signUp(email: string, password: string, fullName: string) { const data = await localAuth('signup', { email, password, fullName }); if (data.user) save(data); return data; }
export async function signIn(email: string, password: string, businessNumber = '', ownerId = '') { const data = await localAuth('signin', { email, password, businessNumber, ownerId }); save(data); return data; }
export async function requestPasswordReset(email: string) { await localAuth('password-reset/request' as 'signup', { email }); }
export function captureRecoverySession(){
 const query=new URLSearchParams(window.location.search),fragment=new URLSearchParams(window.location.hash.slice(1));
 const token=fragment.get('reset')||query.get('reset');
 if(token&&/^[a-f0-9]{64}$/.test(token)){sessionStorage.setItem('maracita.password-reset',token);sessionStorage.setItem('maracita.password-reset-expires',String(Date.now()+1800000));window.history.replaceState({},'','/?reset=1');return true;}
 const stored=sessionStorage.getItem('maracita.password-reset'),expires=Number(sessionStorage.getItem('maracita.password-reset-expires'));
 if(query.get('reset')==='1'&&stored&&/^[a-f0-9]{64}$/.test(stored)&&expires>Date.now())return true;
 if(expires&&expires<=Date.now()){sessionStorage.removeItem('maracita.password-reset');sessionStorage.removeItem('maracita.password-reset-expires');}
 return false;
}
export async function updatePassword(password:string){const token=sessionStorage.getItem('maracita.password-reset');if(!token||!/^[a-f0-9]{64}$/.test(token))throw new Error('This reset link is missing or has expired. Request a new one.');await localAuth('password-reset/complete' as 'signup',{token,password});sessionStorage.removeItem('maracita.password-reset');sessionStorage.removeItem('maracita.password-reset-expires');window.history.replaceState({},'','/?signin=1');}
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) { const session = getSession(); const headers = new Headers(init.headers); if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`); return fetch(input, { ...init, headers }); }
