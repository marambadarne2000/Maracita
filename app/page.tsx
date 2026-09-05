'use client';

import { useState } from 'react';
import { ArrowRight, Building2, Check, CreditCard, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Modal = 'signup' | 'signin' | null;

const plans = [
  { name: 'Solo', price: '79', description: 'For independent businesses', features: ['1 team member', 'Customers & appointments', 'Basic reports'] },
  { name: 'Team', price: '149', description: 'For growing teams', features: ['Up to 8 team members', 'Smart schedule engine', 'Payments & receipts', 'Business reports'], featured: true },
  { name: 'Business', price: '299', description: 'For established operations', features: ['Unlimited team members', 'Advanced insights', 'Priority support', 'Multi-location ready'] },
];

const steps = [
  ['01', 'Create your business', 'Enter your business name, category and owner details.'],
  ['02', 'Choose your plan', 'Start with a 14-day free trial. Upgrade whenever you need.'],
  ['03', 'Run your day clearly', 'Invite your team and manage customers, bookings and payments.'],
];

export default function Home() {
  const [modal, setModal] = useState<Modal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111f] text-[#eaf1fb]">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#07111f]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button onClick={() => scrollTo('top')} className="flex items-center gap-2 text-left" aria-label="Maracita home"><span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#62a7ff] to-[#7257f6] font-black text-white">M</span><span className="text-lg font-extrabold tracking-[0.08em]">MARACITA</span></button>
          <div className="hidden items-center gap-7 text-sm text-[#a8b7ca] md:flex"><button onClick={() => scrollTo('how-it-works')} className="hover:text-white">How it works</button><button onClick={() => scrollTo('pricing')} className="hover:text-white">Pricing</button><button onClick={() => scrollTo('security')} className="hover:text-white">Security</button></div>
          <div className="hidden items-center gap-3 md:flex"><Button variant="ghost" onClick={() => setModal('signin')} className="text-[#c8d5e5] hover:bg-white/8 hover:text-white">Sign in</Button><Button onClick={() => setModal('signup')} className="h-10 rounded-xl bg-[#4c8df6] px-4 font-semibold text-white hover:bg-[#367de9]">Start free trial <ArrowRight /></Button></div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-xl border border-white/10 md:hidden" aria-label="Open menu">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        </nav>
        {menuOpen && <div className="border-t border-white/8 bg-[#0a1628] p-4 md:hidden"><div className="flex flex-col gap-2 text-sm"><button onClick={() => scrollTo('how-it-works')} className="rounded-lg px-3 py-2 text-left hover:bg-white/6">How it works</button><button onClick={() => scrollTo('pricing')} className="rounded-lg px-3 py-2 text-left hover:bg-white/6">Pricing</button><button onClick={() => setModal('signup')} className="rounded-lg bg-[#4c8df6] px-3 py-2 text-left font-semibold">Start free trial</button></div></div>}
      </header>

      <section id="top" className="relative isolate border-b border-white/7"><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_12%,rgba(76,141,246,.25),transparent_27%),radial-gradient(circle_at_25%_25%,rgba(115,87,246,.16),transparent_25%)]" /><div className="mx-auto grid max-w-7xl gap-12 px-5 py-18 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
        <div className="flex flex-col justify-center"><div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#5595f8]/30 bg-[#4284ee]/10 px-3 py-1.5 text-xs font-semibold text-[#93bfff]"><Sparkles size={14} /> Built for every service business</div><h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">Your business day,<br /><span className="text-[#70a8ff]">finally in flow.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#adbed1]">Maracita gives every service business one clear place for customers, bookings, team schedules, payments and decisions.</p><div className="mt-9 flex flex-wrap gap-3"><Button onClick={() => setModal('signup')} className="h-12 rounded-xl bg-[#4c8df6] px-5 text-base font-bold text-white hover:bg-[#367de9]">Start your free trial <ArrowRight /></Button><Button variant="outline" onClick={() => scrollTo('pricing')} className="h-12 rounded-xl border-white/16 bg-white/4 px-5 text-base text-white hover:bg-white/10 hover:text-white">View plans</Button></div><p className="mt-4 text-sm text-[#7f92a9]">No card required for your 14-day trial.</p></div>
        <div className="relative mx-auto w-full max-w-xl rounded-[28px] border border-white/12 bg-[#0e1b2e]/90 p-3 shadow-2xl shadow-black/35"><div className="rounded-[20px] border border-white/8 bg-[#111f34] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.14em] text-[#7e94af]">TODAY AT MARACITA</p><h2 className="mt-1 text-xl font-bold">Good morning, Maram</h2></div><span className="rounded-full bg-[#17375e] px-3 py-1 text-xs text-[#8cbdff]">Live workspace</span></div><div className="mt-6 grid grid-cols-3 gap-3">{[['08','Appointments'],['₪1,240','Expected'],['04','Team online']].map(([value,label], index) => <div key={label} className="rounded-2xl bg-[#172841] p-3"><p className={`text-lg font-bold ${index === 1 ? 'text-[#6ee7bb]' : 'text-white'}`}>{value}</p><p className="mt-1 text-[11px] text-[#91a5bd]">{label}</p></div>)}</div><div className="mt-5 rounded-2xl border border-white/7 bg-[#0d192b] p-4"><div className="mb-4 flex items-center justify-between"><p className="font-semibold">Upcoming appointments</p><p className="text-xs text-[#79acfb]">Open schedule</p></div>{[['09:00','Maya Cohen','Hair colour','confirmed'],['10:30','Noa Levi','Consultation','scheduled'],['12:00','Dana Saad','Treatment','paid']].map(([time,name,service,status]) => <div key={time} className="grid grid-cols-[48px_1fr_auto] items-center gap-2 border-t border-white/7 py-3 first:border-0 first:pt-0"><span className="text-xs font-bold text-[#9fc6ff]">{time}</span><span><b className="block text-sm">{name}</b><small className="text-xs text-[#8fa2b9]">{service}</small></span><span className="rounded-md bg-[#123c3b] px-2 py-1 text-[10px] font-bold uppercase text-[#62e6bb]">{status}</span></div>)}</div></div></div>
      </div></section>

      <section className="border-b border-white/7 bg-[#0a1628] py-7"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-5 text-sm font-medium text-[#8ca1bb]"><span>Made for clinics</span><span>Beauty & wellness</span><span>Professional services</span><span>Fitness studios</span><span>Auto services</span></div></section>
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-22 lg:px-8"><p className="text-xs font-bold tracking-[.16em] text-[#70a8ff]">HOW MARACITA WORKS</p><div className="mt-3 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">From registration to a fully private business workspace.</h2><p className="max-w-sm leading-7 text-[#9db0c6]">Your account, your business data, your plan. Everything starts in one guided flow.</p></div><div className="mt-11 grid gap-4 md:grid-cols-3">{steps.map(([number,title,description]) => <article key={number} className="rounded-2xl border border-white/9 bg-[#0d1a2d] p-6"><span className="text-sm font-black text-[#5f9fff]">{number}</span><h3 className="mt-10 text-xl font-bold text-white">{title}</h3><p className="mt-3 leading-7 text-[#9bb0c7]">{description}</p></article>)}</div></section>
      <section id="pricing" className="border-y border-white/7 bg-[#0a1628] py-22"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="text-center"><p className="text-xs font-bold tracking-[.16em] text-[#70a8ff]">SIMPLE PRICING</p><h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">A plan that fits your next stage.</h2><p className="mt-3 text-[#9db0c6]">Start free for 14 days. Cancel or change your plan anytime.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={`relative rounded-2xl border p-6 ${plan.featured ? 'border-[#4c8df6] bg-[#12233c] shadow-xl shadow-[#0a5bd4]/12' : 'border-white/9 bg-[#0d1a2d]'}`}>{plan.featured && <span className="absolute -top-3 left-6 rounded-full bg-[#4c8df6] px-3 py-1 text-xs font-bold text-white">Most popular</span>}<h3 className="text-xl font-bold text-white">{plan.name}</h3><p className="mt-2 text-sm text-[#94a9c0]">{plan.description}</p><p className="mt-7 text-4xl font-black text-white">₪{plan.price}<span className="text-sm font-medium text-[#91a7c0]"> / month</span></p><Button onClick={() => setModal('signup')} className={`mt-7 h-11 w-full rounded-xl font-bold ${plan.featured ? 'bg-[#4c8df6] text-white hover:bg-[#367de9]' : 'bg-white/9 text-white hover:bg-white/15'}`}>Choose {plan.name}</Button><ul className="mt-7 space-y-3 border-t border-white/8 pt-6 text-sm text-[#b8c7d8]">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check size={17} className="shrink-0 text-[#62d8ad]" />{feature}</li>)}</ul></article>)}</div></div></section>
      <section id="security" className="mx-auto max-w-7xl px-5 py-22 lg:px-8"><div className="grid gap-8 rounded-3xl border border-white/9 bg-[#0d1a2d] p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12"><div><div className="mb-5 grid size-11 place-items-center rounded-xl bg-[#173b46] text-[#63e3b8]"><ShieldCheck /></div><h2 className="text-3xl font-bold text-white">Your business data stays yours.</h2><p className="mt-4 max-w-2xl leading-7 text-[#a5b7ca]">Every Maracita workspace belongs to one business. Payments are completed through a secure payment provider — card details never live inside your workspace.</p></div><div className="flex gap-6 text-sm text-[#b2c4d8]"><span className="flex items-center gap-2"><Building2 className="text-[#75a9ff]" size={19} />Private workspace</span><span className="flex items-center gap-2"><CreditCard className="text-[#75a9ff]" size={19} />Secure checkout</span></div></div></section>
      <footer className="border-t border-white/7 py-7"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 text-sm text-[#71869f] sm:flex-row lg:px-8"><p>© 2026 Maracita. Crafted by Maram Abbas.</p><p>Smart scheduling. Clear decisions.</p></div></footer>
      {modal && <AuthModal mode={modal} onClose={() => { setModal(null); setSubmitted(false); }} submitted={submitted} setSubmitted={setSubmitted} />}
    </main>
  );
}

function AuthModal({ mode, onClose, submitted, setSubmitted }: { mode: Exclude<Modal, null>; onClose: () => void; submitted: boolean; setSubmitted: (value: boolean) => void }) {
  const [step, setStep] = useState(1);
  const [chosenPlan, setChosenPlan] = useState('Team');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';
  const fieldClass = 'h-11 border-white/12 bg-white/5 text-white placeholder:text-[#71869f]';
  const continueSignup = (event: { preventDefault: () => void }) => { event.preventDefault(); setStep((current) => current + 1); };
  const createWorkspace = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ businessName, businessType, phone, planCode: chosenPlan }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'We could not create your workspace.');
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not create your workspace.');
    } finally {
      setSaving(false);
    }
  };

  if (!isSignup) {
    return <ModalFrame onClose={onClose}><div className="grid size-11 place-items-center rounded-xl bg-[#1a3d69] text-[#88b9ff]"><ShieldCheck /></div><h3 className="mt-5 text-2xl font-bold text-white">Secure preview access</h3><p className="mt-2 text-sm leading-6 text-[#9db0c6]">This preview recognizes the ChatGPT account you used to open Maracita. Public email sign-in and password recovery will be connected before launch.</p><Button onClick={onClose} className="mt-6 h-11 w-full rounded-xl bg-[#4c8df6] text-white hover:bg-[#367de9]">Continue to Maracita <ArrowRight /></Button></ModalFrame>;
  }

  if (submitted) return <ModalFrame onClose={onClose}><div className="py-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#143e39] text-[#63e3b8]"><Check /></div><h3 className="mt-5 text-2xl font-bold text-white">Your private workspace is ready.</h3><p className="mt-3 leading-6 text-[#9db0c6]">{businessName} is now saved with a {chosenPlan} 14-day trial. Secure billing will be connected before the public launch.</p><Button onClick={onClose} className="mt-6 bg-[#4c8df6] text-white">Done</Button></div></ModalFrame>;

  return <ModalFrame onClose={onClose} wide><div className="mb-7 flex items-center gap-2">{[1, 2, 3, 4].map((number) => <span key={number} className={`h-1.5 flex-1 rounded-full ${number <= step ? 'bg-[#5b99fa]' : 'bg-white/10'}`} />)}</div>
    {step === 1 && <div><div className="grid size-11 place-items-center rounded-xl bg-[#1a3d69] text-[#88b9ff]"><ShieldCheck /></div><h3 className="mt-5 text-2xl font-bold text-white">Create your owner account</h3><p className="mt-2 text-sm leading-6 text-[#9db0c6]">Step 1 of 4 — this private preview links the workspace to your secure ChatGPT session. Your business email and password sign-in will be added for public launch.</p><Button onClick={() => setStep(2)} className="mt-6 h-11 w-full rounded-xl bg-[#4c8df6] text-white">Continue <ArrowRight /></Button></div>}
    {step === 2 && <form onSubmit={continueSignup}><div className="grid size-11 place-items-center rounded-xl bg-[#1a3d69] text-[#88b9ff]"><Building2 /></div><h3 className="mt-5 text-2xl font-bold text-white">Tell us about your business</h3><p className="mt-2 text-sm text-[#9db0c6]">Step 2 of 4 — we will create a private workspace for it.</p><div className="mt-6 space-y-3"><Input required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Business name" className={fieldClass} /><select required value={businessType} onChange={(event) => setBusinessType(event.target.value)} className="h-11 w-full rounded-lg border border-white/12 bg-[#15243a] px-3 text-sm text-[#c8d5e5] outline-none"><option value="" disabled>Select business type</option><option>Beauty & wellness</option><option>Clinic or therapy</option><option>Fitness & coaching</option><option>Professional services</option><option>Automotive services</option><option>Other service business</option></select><Input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Business phone number" className={fieldClass} /></div><div className="mt-6 flex gap-3"><Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 border-white/12 bg-transparent text-white hover:bg-white/8 hover:text-white">Back</Button><Button type="submit" className="h-11 flex-1 bg-[#4c8df6] text-white">Continue <ArrowRight /></Button></div></form>}
    {step === 3 && <div><h3 className="text-2xl font-bold text-white">Choose a plan</h3><p className="mt-2 text-sm text-[#9db0c6]">Step 3 of 4 — every plan starts with a 14-day free trial.</p><div className="mt-6 grid gap-3">{plans.map((plan) => <button key={plan.name} onClick={() => setChosenPlan(plan.name)} className={`rounded-xl border p-4 text-left transition ${chosenPlan === plan.name ? 'border-[#5b99fa] bg-[#1a3458]' : 'border-white/10 bg-white/4 hover:bg-white/7'}`}><div className="flex justify-between"><span className="font-bold text-white">{plan.name}</span><span className="font-bold text-[#8dbaff]">₪{plan.price}/mo</span></div><p className="mt-1 text-xs text-[#9db0c6]">{plan.description}</p></button>)}</div><div className="mt-6 flex gap-3"><Button variant="outline" onClick={() => setStep(2)} className="h-11 border-white/12 bg-transparent text-white hover:bg-white/8 hover:text-white">Back</Button><Button onClick={() => setStep(4)} className="h-11 flex-1 bg-[#4c8df6] text-white">Continue to payment <ArrowRight /></Button></div></div>}
    {step === 4 && <div><div className="grid size-11 place-items-center rounded-xl bg-[#173b46] text-[#63e3b8]"><CreditCard /></div><h3 className="mt-5 text-2xl font-bold text-white">Review and create</h3><p className="mt-2 text-sm text-[#9db0c6]">Step 4 of 4 — {chosenPlan} plan with a 14-day free trial.</p><div className="mt-6 rounded-xl border border-white/10 bg-white/4 p-4 text-sm text-[#b5c6d9]"><div className="flex justify-between"><span>Business</span><b className="text-white">{businessName}</b></div><div className="mt-3 flex justify-between"><span>Selected plan</span><b className="text-white">{chosenPlan}</b></div><div className="mt-3 flex justify-between"><span>Billing</span><b className="text-[#63e3b8]">No charge during trial</b></div></div><p className="mt-5 text-xs leading-5 text-[#8297ae]">The payment provider connection is deliberately not live yet, so no card is requested and no money is charged.</p>{error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}<div className="mt-6 flex gap-3"><Button variant="outline" onClick={() => setStep(3)} disabled={saving} className="h-11 border-white/12 bg-transparent text-white hover:bg-white/8 hover:text-white">Back</Button><Button onClick={createWorkspace} disabled={saving} className="h-11 flex-1 bg-[#4c8df6] text-white">{saving ? 'Creating workspace…' : 'Create private workspace'} <ArrowRight /></Button></div></div>}
  </ModalFrame>;
}

function ModalFrame({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <dialog open className="fixed inset-0 z-50 grid h-full w-full max-h-none max-w-none place-items-center bg-[#020711]/75 p-4 backdrop-blur-sm"><div className={`relative w-full ${wide ? 'max-w-lg' : 'max-w-md'} rounded-2xl border border-white/12 bg-[#101e33] p-7 shadow-2xl`}><button onClick={onClose} className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-[#91a6bf] hover:bg-white/8 hover:text-white" aria-label="Close"><X size={18} /></button>{children}</div></dialog>;
}
