'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authFetch, openPortfolioDemo } from '@/lib/auth-client';

export default function PortfolioDemoPage() {
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const open = async () => { setLoading(true); setError(''); try { openPortfolioDemo(); const response = await authFetch('/api/demo', { method: 'POST' }); const payload = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) throw new Error(payload.error || 'Could not prepare the demo.'); window.location.assign('/workspace'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare the demo.'); } finally { setLoading(false); } };
  useEffect(() => { open(); }, []);
  return <main className="grid min-h-screen place-items-center bg-[#0b0b0f] p-6 text-[#f4f5ed]"><section className="w-full max-w-lg rounded-[2rem] border border-[#c9f66b]/25 bg-[#15151b] p-8 text-center shadow-2xl"><span className="signal-orb mx-auto grid size-12 place-items-center rounded-full bg-[#c9f66b] text-[#10120d]"><Sparkles /></span><p className="mt-6 text-xs font-bold tracking-[.16em] text-[#c9f66b]">PORTFOLIO DEMO</p><h1 className="mt-3 text-3xl font-black text-white">Opening the Maracita workspace</h1><p className="mt-3 leading-7 text-[#a7a89d]">A safe demo business is being prepared with fictional customers, appointments, payments and follow-up signals.</p>{error ? <><p className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p><Button onClick={open} disabled={loading} className="mt-5 bg-[#c9f66b] text-[#10120d] hover:bg-[#dcff98]">Try demo again <ArrowRight /></Button></> : <p className="mt-6 text-sm text-[#c9f66b]">{loading ? 'Preparing demo…' : 'Starting…'}</p>}</section></main>;
}
