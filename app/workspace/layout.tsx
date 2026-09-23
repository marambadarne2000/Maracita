'use client';

import { WorkspaceAccess, WorkspaceLogout } from '@/components/workspace-access';
import { BusinessFocus } from '@/components/business-focus';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceAccess>
      {children}
      <BusinessFocus />
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <a href="/workspace/actions" className="rounded-md border border-[#c9f66b]/30 bg-[#15151b] px-3 py-2 text-sm font-semibold text-[#dcff98] hover:bg-[#c9f66b]/10">Customer actions</a>
        <a href="/workspace/reschedule" className="rounded-md border border-[#85b7ff]/30 bg-[#15151b] px-3 py-2 text-sm font-semibold text-[#b8d5ff] hover:bg-[#85b7ff]/10">Reschedule</a>
        <a href="/workspace/feedback" className="rounded-md border border-[#c3a0ff]/30 bg-[#15151b] px-3 py-2 text-sm font-semibold text-[#dfcfff] hover:bg-[#c3a0ff]/10">Feedback</a>
        <a href="/workspace/quality" className="rounded-md border border-[#85b7ff]/30 bg-[#15151b] px-3 py-2 text-sm font-semibold text-[#b8d5ff] hover:bg-[#85b7ff]/10">Quality check</a>
        <a href="/workspace/email" className="rounded-md border border-[#c9f66b]/30 bg-[#15151b] px-3 py-2 text-sm font-semibold text-[#dcff98] hover:bg-[#c9f66b]/10">Send real email</a>
        <WorkspaceLogout />
      </div>
    </WorkspaceAccess>
  );
}
