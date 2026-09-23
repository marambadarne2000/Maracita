'use client';

import { useState } from 'react';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { authFetch } from '@/lib/auth-client';

export default function ExportPage() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true); setError(''); setStatus('');
    try {
      const response = await authFetch('/api/account/export');
      if (!response.ok) { const body = await response.json().catch(() => ({})) as { error?: string }; throw new Error(body.error || 'Could not prepare your export.'); }
      const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `maracita-export-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
      setStatus('Your private workspace export was downloaded.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare your export.'); } finally { setLoading(false); }
  };
  return <main className="min-h-screen bg-[#07111f] text-[#eaf1fb]"><header className="border-b border-white/8 bg-[#091526]"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><button onClick={() => window.location.assign('/workspace')} className="flex items-center gap-2 font-extrabold tracking-[.08em]"><span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#62a7ff] to-[#7257f6]">M</span>MARACITA</button><span className="text-sm text-[#9db0c6]">Data controls</span></div></header><section className="mx-auto max-w-2xl px-5 py-12"><button onClick={() => window.location.assign('/workspace')} className="flex items-center gap-2 text-sm text-[#91a6bf] hover:text-white"><ArrowLeft size={16} /> Back to Command Center</button><article className="mt-8 rounded-3xl border border-white/9 bg-[#0d1a2d] p-7"><span className="grid size-12 place-items-center rounded-2xl bg-[#17375e] text-[#85b7ff]"><ShieldCheck size={25} /></span><p className="mt-6 text-xs font-bold tracking-[.16em] text-[#70a8ff]">PRIVATE DATA EXPORT</p><h1 className="mt-2 text-3xl font-black text-white">Download your workspace data</h1><p className="mt-4 leading-7 text-[#b6c7dc]">Create a JSON copy of the customers, services, appointments, payments, receipts, messages, waitlist and feedback saved in your workspace.</p><p className="mt-4 rounded-xl border border-white/8 bg-white/[.03] p-4 text-sm leading-6 text-[#a9bad0]">Passwords and active session tokens are never included. The export is created only for your signed-in account.</p><button onClick={() => void download()} disabled={loading} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9f66b] px-5 py-3 font-bold text-[#10120d] hover:bg-[#ddff96] disabled:opacity-60"><Download size={18} /> {loading ? 'Preparing your export…' : 'Download my data'}</button>{status && <p className="mt-4 rounded-xl bg-[#163b36] px-4 py-3 text-sm text-[#8ef0ca]">{status}</p>}{error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}</article></section></main>;
}
