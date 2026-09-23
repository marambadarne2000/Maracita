'use client';

import { useEffect, useState } from 'react';
import { Activity, BriefcaseBusiness, CarFront, Dumbbell, Sparkles, Stethoscope } from 'lucide-react';

type Workspace = { businessType: string; name: string };
type Focus = { label: string; message: string; icon: typeof Sparkles };

function focusFor(type: string): Focus {
  const value = type.toLowerCase();
  if (value.includes('clinic') || value.includes('therapy')) return { label: 'CARE MODE', message: 'Prioritize patient follow-ups and confirmed visits.', icon: Stethoscope };
  if (value.includes('fitness') || value.includes('coaching')) return { label: 'MOMENTUM MODE', message: 'Keep members moving with sessions and follow-ups.', icon: Dumbbell };
  if (value.includes('automotive')) return { label: 'SERVICE BAY MODE', message: 'Track vehicle bookings, approvals and collection.', icon: CarFront };
  if (value.includes('professional')) return { label: 'CLIENT DELIVERY MODE', message: 'Keep client commitments, meetings and invoices visible.', icon: BriefcaseBusiness };
  if (value.includes('beauty') || value.includes('wellness')) return { label: 'STUDIO RHYTHM', message: 'Focus on treatments, returning clients and care moments.', icon: Sparkles };
  return { label: 'BUSINESS RHYTHM', message: 'Focus on the next customer action that moves your day forward.', icon: Activity };
}

export function BusinessFocus() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  useEffect(() => { fetch('/api/workspace').then((response) => response.ok ? response.json() : null).then((data: { workspace?: Workspace | null } | null) => setWorkspace(data?.workspace ?? null)).catch(() => undefined); }, []);
  if (!workspace) return null;
  const focus = focusFor(workspace.businessType); const Icon = focus.icon;
  return <aside className="fixed bottom-5 left-5 z-40 hidden max-w-xs rounded-2xl border border-[#c9f66b]/25 bg-[#141a12]/95 p-4 shadow-xl shadow-black/30 backdrop-blur-xl lg:block"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#c9f66b] text-[#10120d]"><Icon size={18} /></span><div><p className="text-[11px] font-extrabold tracking-[.14em] text-[#dfffa8]">{focus.label}</p><p className="mt-1 text-sm font-semibold text-white">{workspace.name}</p><p className="mt-1 text-xs leading-5 text-[#b9c2ad]">{focus.message}</p></div></div></aside>;
}
