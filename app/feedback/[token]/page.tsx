'use client';

import { useEffect, useState } from 'react';
import { HeartHandshake, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const questions = [
  ['arrival', 'How was your arrival and waiting experience?'],
  ['service', 'How was the service you received?'],
  ['staff', 'How was the staff member who helped you?'],
  ['payment', 'How was the payment experience?'],
  ['location', 'How was the location and overall atmosphere?'],
] as const;

type Survey = { status: string; firstName: string; serviceName: string; businessName: string; error?: string };

export default function FeedbackPage() {
  const [token, setToken] = useState(''); const [survey, setSurvey] = useState<Survey | null>(null); const [error, setError] = useState(''); const [done, setDone] = useState(false); const [saving, setSaving] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({ arrival: 0, service: 0, staff: 0, payment: 0, location: 0 }); const [comment, setComment] = useState('');
  useEffect(() => { const value = window.location.pathname.split('/').filter(Boolean).pop() || ''; setToken(value); fetch(`/api/feedback?token=${encodeURIComponent(value)}`).then(async (response) => { const payload = await response.json() as Survey; if (!response.ok) throw new Error(payload.error || 'This survey is unavailable.'); setSurvey(payload); }).catch((cause) => setError(cause instanceof Error ? cause.message : 'This survey is unavailable.')); }, []);
  const submit = async () => { setSaving(true); setError(''); try { const response = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, ratings, comment }) }); const payload = await response.json() as { error?: string }; if (!response.ok) throw new Error(payload.error || 'We could not save your feedback.'); setDone(true); } catch (cause) { setError(cause instanceof Error ? cause.message : 'We could not save your feedback.'); } finally { setSaving(false); } };
  if (error) return <main className="grid min-h-screen place-items-center bg-[#07111f] p-6 text-center text-[#eaf1fb]"><div><HeartHandshake className="mx-auto text-[#85b7ff]" size={38} /><h1 className="mt-4 text-2xl font-bold">Feedback link unavailable</h1><p className="mt-2 text-[#a9bad0]">{error}</p></div></main>;
  if (!survey) return <main className="grid min-h-screen place-items-center bg-[#07111f] text-[#a9bad0]">Opening your feedback form…</main>;
  if (done || survey.status === 'completed') return <main className="grid min-h-screen place-items-center bg-[#07111f] p-6 text-center text-[#eaf1fb]"><div className="max-w-md rounded-3xl border border-[#62e2b5]/30 bg-[#0d1a2d] p-9"><HeartHandshake className="mx-auto text-[#62e2b5]" size={42} /><h1 className="mt-5 text-2xl font-bold">Thank you, {survey.firstName}.</h1><p className="mt-3 leading-7 text-[#a9bad0]">Your feedback has been shared with {survey.businessName}.</p></div></main>;
  return <main className="min-h-screen bg-[#07111f] px-5 py-12 text-[#eaf1fb]"><section className="mx-auto max-w-xl rounded-3xl border border-white/9 bg-[#0d1a2d] p-6 sm:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-[#163b36] text-[#62e2b5]"><HeartHandshake /></div><p className="mt-6 text-xs font-bold tracking-[.16em] text-[#85b7ff]">MARACITA FEEDBACK</p><h1 className="mt-3 text-3xl font-black">How was your visit?</h1><p className="mt-3 leading-7 text-[#a9bad0]">Hi {survey.firstName}, your feedback about {survey.serviceName} helps {survey.businessName} improve.</p><div className="mt-8 space-y-6">{questions.map(([key, label]) => <fieldset key={key}><legend className="text-sm font-semibold text-white">{label}</legend><div className="mt-3 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Rate ${label}: ${value} out of 5`} onClick={() => setRatings({ ...ratings, [key]: value })} className={`grid size-10 place-items-center rounded-xl border transition ${ratings[key] >= value ? 'border-[#ffc266] bg-[#3d3420] text-[#ffc266]' : 'border-white/10 bg-white/[.03] text-[#7890ab] hover:border-[#85b7ff]'}`}><Star size={17} fill={ratings[key] >= value ? 'currentColor' : 'none'} /></button>)}</div></fieldset>)}<label className="block text-sm font-semibold text-white">Anything else you would like us to know?<textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Optional comment" className="mt-3 min-h-28 w-full rounded-xl border border-white/12 bg-white/[.03] p-3 text-white outline-none placeholder:text-[#7890ab]" /></label><Button disabled={saving || Object.values(ratings).some((value) => !value)} onClick={submit} className="h-12 w-full bg-[#4c8df6] text-white">{saving ? 'Sending feedback…' : 'Send feedback'}</Button>{error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}</div></section></main>;
}
