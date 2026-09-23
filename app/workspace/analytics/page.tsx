'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, CircleAlert, CreditCard, Users } from 'lucide-react';

type Analytics = {
  currency: string;
  metrics: {
    customers: number; staff: number; totalAppointments: number; activeAppointments: number;
    cancelledAppointments: number; completedAppointments: number; revenueMinor: number;
    paymentCount: number; openSignals: number;
  };
  daily: { date: string; count: number }[];
  error?: string;
};

function formatMoney(currency: string, minor: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try {
      const response = await fetch('/api/analytics');
      const payload = await response.json() as Analytics;
      if (!response.ok) throw new Error(payload.error || 'Could not load analytics.');
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load analytics.');
    }
  };
  useEffect(() => { load(); }, []);

  const chart = useMemo(() => [...(data?.daily ?? [])].reverse(), [data]);
  const max = Math.max(...chart.map((item) => item.count), 1);
  if (!data) return <main className="grid min-h-screen place-items-center bg-[#07111f] text-[#a9bad0]">{error || 'Opening Analytics Lab…'}</main>;
  const { metrics } = data;
  const cancellationRate = metrics.totalAppointments ? Math.round((metrics.cancelledAppointments / metrics.totalAppointments) * 100) : 0;
  const cards = [
    { label: 'Recorded revenue', value: formatMoney(data.currency, metrics.revenueMinor), meta: `${metrics.paymentCount} payment record${metrics.paymentCount === 1 ? '' : 's'}`, icon: CreditCard, color: 'text-[#62e2b5]' },
    { label: 'Appointments', value: String(metrics.totalAppointments), meta: `${metrics.activeAppointments} active · ${metrics.completedAppointments} completed`, icon: CalendarDays, color: 'text-[#75a9ff]' },
    { label: 'Customers & team', value: `${metrics.customers} / ${metrics.staff}`, meta: 'Customers / active team members', icon: Users, color: 'text-[#c3a0ff]' },
    { label: 'Cancellation rate', value: `${cancellationRate}%`, meta: `${metrics.cancelledAppointments} cancelled appointment${metrics.cancelledAppointments === 1 ? '' : 's'}`, icon: CircleAlert, color: 'text-[#ffc266]' },
  ];

  return <main className="min-h-screen bg-[#07111f] text-[#eaf1fb]">
    <header className="border-b border-white/8 bg-[#091526]"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><button onClick={() => window.location.assign('/workspace')} className="flex items-center gap-2 font-extrabold tracking-[.08em]"><span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#62a7ff] to-[#7257f6]">M</span>MARACITA</button><span className="text-sm text-[#9db0c6]">Analytics Lab</span></div></header>
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <button onClick={() => window.location.assign('/workspace')} className="flex items-center gap-2 text-sm text-[#91a6bf] hover:text-white"><ArrowLeft size={16} /> Back to Command Center</button>
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[.16em] text-[#70a8ff]">LIVE BUSINESS VIEW</p><h1 className="mt-2 text-3xl font-black text-white">Analytics Lab</h1><p className="mt-2 max-w-2xl text-[#a9bad0]">A clear view of the numbers recorded in your Maracita workspace.</p></div><button onClick={load} className="rounded-lg border border-white/12 bg-[#15243a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3150]">Refresh data</button></div>
      {error && <p className="mt-6 rounded-xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, meta, icon: Icon, color }) => <article key={label} className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-5"><Icon className={color} size={22} /><p className="mt-7 text-3xl font-black text-white">{value}</p><h2 className="mt-1 font-semibold text-white">{label}</h2><p className="mt-2 text-sm text-[#9db0c6]">{meta}</p></article>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#17375e] text-[#85b7ff]"><BarChart3 /></span><div><h2 className="font-bold text-white">Appointment activity</h2><p className="text-sm text-[#9db0c6]">Bookings by date from your saved appointments.</p></div></div>{chart.length ? <div className="mt-8 flex h-56 items-end gap-3">{chart.map((item) => <div key={item.date} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="mb-2 text-center text-xs font-bold text-[#dce9fc]">{item.count}</div><div className="rounded-t-lg bg-gradient-to-t from-[#4c8df6] to-[#7caeff]" style={{ height: `${Math.max((item.count / max) * 100, 8)}%` }} /><p className="mt-3 truncate text-center text-[11px] text-[#9db0c6]">{new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p></div>)}</div> : <div className="mt-7 rounded-xl border border-dashed border-white/12 p-10 text-center text-[#9db0c6]">Create appointments to see activity here.</div>}</section>
        <section className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-6"><h2 className="font-bold text-white">Flow intelligence</h2><p className="mt-1 text-sm text-[#9db0c6]">Operational details that need attention.</p><div className="mt-6 space-y-3"><div className="rounded-xl border border-white/7 bg-white/[.03] p-4"><p className="text-2xl font-black text-[#ffc266]">{metrics.openSignals}</p><p className="mt-1 text-sm text-[#c5d2e2]">Open flow signal{metrics.openSignals === 1 ? '' : 's'}</p></div><div className="rounded-xl border border-white/7 bg-white/[.03] p-4"><p className="text-2xl font-black text-[#62e2b5]">{metrics.activeAppointments}</p><p className="mt-1 text-sm text-[#c5d2e2]">Active bookings to manage</p></div><p className="pt-2 text-sm leading-6 text-[#9db0c6]">Numbers update from your workspace data when you refresh this page.</p></div></section>
      </div>
    </section>
  </main>;
}
