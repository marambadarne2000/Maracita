'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, CircleAlert, Database, FlaskConical, LoaderCircle, MessageSquareHeart, RefreshCw, ShieldCheck, Users, XCircle } from 'lucide-react';

type CheckStatus = 'checking' | 'passed' | 'failed';
type Check = { id: string; title: string; detail: string; endpoint: string; icon: typeof ShieldCheck; status: CheckStatus; note: string };

const definitions = [
  { id: 'account', title: 'Secure account', detail: 'Checks that your signed-in account can be read safely.', endpoint: '/api/account', icon: ShieldCheck },
  { id: 'workspace', title: 'Business workspace', detail: 'Checks the workspace, membership and dashboard data connection.', endpoint: '/api/workspace', icon: Database },
  { id: 'customers', title: 'Customer records', detail: 'Checks that customer profiles can load from your private workspace.', endpoint: '/api/customers', icon: Users },
  { id: 'schedule', title: 'Smart Schedule', detail: 'Checks appointment, team and service data for the calendar.', endpoint: '/api/appointments', icon: CalendarDays },
  { id: 'analytics', title: 'Analytics Lab', detail: 'Checks live dashboard metrics and appointment reporting.', endpoint: '/api/analytics', icon: BarChart3 },
  { id: 'feedback', title: 'Feedback workflow', detail: 'Checks saved surveys and customer feedback reporting.', endpoint: '/api/communication', icon: MessageSquareHeart },
] as const;

const initialChecks = (): Check[] => definitions.map((check) => ({ ...check, status: 'checking', note: 'Waiting to run.' }));

export default function QualityPage() {
  const [checks, setChecks] = useState<Check[]>(initialChecks);
  const [running, setRunning] = useState(false);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setFinishedAt(null);
    setChecks(definitions.map((check) => ({ ...check, status: 'checking', note: 'Testing secure connection…' })));
    const results = await Promise.all(definitions.map(async (check): Promise<Check> => {
      const started = performance.now();
      try {
        const response = await fetch(check.endpoint, { cache: 'no-store', headers: { 'x-maracita-quality-check': '1' } });
        const body = await response.json().catch(() => ({})) as { error?: string };
        const elapsed = Math.round(performance.now() - started);
        if (!response.ok) return { ...check, status: 'failed', note: body.error || `The service returned ${response.status}.` };
        return { ...check, status: 'passed', note: `Working normally · checked in ${elapsed} ms` };
      } catch {
        return { ...check, status: 'failed', note: 'Could not reach this service. Check your connection and try again.' };
      }
    }));
    setChecks(results);
    setFinishedAt(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void runChecks(); }, 0);
    return () => window.clearTimeout(timer);
  }, [runChecks]);
  const passed = checks.filter((check) => check.status === 'passed').length;
  const failed = checks.filter((check) => check.status === 'failed').length;
  const statusIcon = (status: CheckStatus) => status === 'passed'
    ? <CheckCircle2 className="text-[#c9f66b]" size={22} />
    : status === 'failed' ? <XCircle className="text-red-300" size={22} />
      : <LoaderCircle className="animate-spin text-[#85b7ff]" size={22} />;

  return <main className="min-h-screen bg-[#07111f] text-[#eaf1fb]">
    <header className="border-b border-white/8 bg-[#091526]"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><button onClick={() => window.location.assign('/workspace')} className="flex items-center gap-2 font-extrabold tracking-[.08em]"><span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#62a7ff] to-[#7257f6]">M</span>MARACITA</button><span className="text-sm text-[#9db0c6]">Quality Lab</span></div></header>
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <button onClick={() => window.location.assign('/workspace')} className="flex items-center gap-2 text-sm text-[#91a6bf] hover:text-white"><ArrowLeft size={16} /> Back to Command Center</button>
      <div className="mt-7 flex flex-col gap-5 rounded-3xl border border-[#85b7ff]/20 bg-gradient-to-br from-[#102743] to-[#0d1a2d] p-7 sm:flex-row sm:items-end sm:justify-between sm:p-9"><div><span className="grid size-12 place-items-center rounded-2xl bg-[#17375e] text-[#85b7ff]"><FlaskConical size={25} /></span><p className="mt-5 text-xs font-bold tracking-[.16em] text-[#70a8ff]">STEP 6 · SOFTWARE QUALITY</p><h1 className="mt-2 text-3xl font-black text-white">System health check</h1><p className="mt-3 max-w-2xl leading-7 text-[#b6c7dc]">A safe, read-only check of the core systems in your private workspace. It does not change records, charge money or send customer messages.</p></div><button onClick={() => void runChecks()} disabled={running} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c9f66b] px-5 py-3 font-bold text-[#10120d] transition hover:bg-[#ddff96] disabled:cursor-wait disabled:opacity-60"><RefreshCw className={running ? 'animate-spin' : ''} size={18} /> {running ? 'Checking…' : 'Run all checks'}</button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-5"><p className="text-3xl font-black text-[#c9f66b]">{passed}/6</p><p className="mt-1 text-sm text-[#b6c7dc]">Core checks passed</p></article><article className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-5"><p className={`text-3xl font-black ${failed ? 'text-red-300' : 'text-[#85b7ff]'}`}>{failed}</p><p className="mt-1 text-sm text-[#b6c7dc]">Items needing attention</p></article><article className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-5"><p className="text-sm font-bold text-white">{finishedAt ? finishedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Running now'}</p><p className="mt-1 text-sm text-[#b6c7dc]">Last safe check</p></article></div>
      {failed > 0 && !running && <div className="mt-6 flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm leading-6 text-red-100"><CircleAlert className="mt-0.5 shrink-0 text-red-300" size={20} /><p>One or more checks could not complete. The exact reason is shown below. Nothing was changed in your workspace.</p></div>}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">{checks.map((check) => <article key={check.id} className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-6"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[.05] text-[#85b7ff]"><check.icon size={21} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-white">{check.title}</h2>{statusIcon(check.status)}</div><p className="mt-2 text-sm leading-6 text-[#9db0c6]">{check.detail}</p><p className={`mt-4 text-sm font-semibold ${check.status === 'failed' ? 'text-red-200' : check.status === 'passed' ? 'text-[#d9ffa1]' : 'text-[#b8d5ff]'}`}>{check.note}</p></div></div></article>)}</div>
      <section className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-6"><h2 className="font-bold text-[#ffe0a0]">What this check does not simulate</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-[#d9c99f]">Real card payments, live SMS and WhatsApp delivery require their own approved providers and credentials. Email sending is intentionally not triggered here, so a quality check never contacts a customer by mistake.</p></section>
    </section>
  </main>;
}
