 'use client';
import {translateLabel,uiLocale} from '@/lib/ui-translate';
import {usePathname} from 'next/navigation';
import { WorkspaceAccess, WorkspaceLogout } from '@/components/workspace-access';
import { useI18n } from '@/components/i18n-provider';
export default function WorkspaceLayout({children}:{children:React.ReactNode}) {
 const {locale}=useI18n();const path=usePathname();
 const he=locale==='he', ar=locale==='ar';
 const links=[['/workspace/actions','פעולות לקוח','إجراءات العميل','Customer actions'],['/workspace/reschedule','שינוי תור','تغيير موعد','Reschedule'],['/workspace/feedback','משוב','التقييمات','Feedback'],['/workspace/quality','בדיקת איכות','فحص الجودة','Quality check'],['/workspace/export','ייצוא נתונים','تصدير البيانات','Export data'],['/workspace/connections','חיבורי ספקים','الاتصالات','Connections']];
 return <WorkspaceAccess operatorPage={path==='/workspace/launch'}>{children}<div data-i18n-ignore className="fixed bottom-4 inset-x-4 z-40 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#0f1e34]/95 px-4 py-3 shadow-xl backdrop-blur"><a href="/workspace" className="text-sm font-semibold text-sky-200">{he?'העסק שלי':ar?'عملي':translateLabel("My business")}</a><details className="relative"><summary className="cursor-pointer text-sm text-slate-200">{he?'כלים נוספים':ar?'أدوات إضافية':translateLabel("More tools")}</summary><nav className="absolute bottom-10 start-0 grid min-w-52 gap-1 rounded-2xl border border-white/15 bg-[#102039] p-3 shadow-xl">{links.map(link=><a key={link[0]} href={link[0]} className="rounded-lg p-2 text-sm text-slate-200 hover:bg-white/10">{link[he?1:ar?2:3]}</a>)}<a href="/?guide=1" className="rounded-lg p-2 text-sm text-sky-200">{he?'מדריך שימוש':ar?'دليل الاستخدام':translateLabel("User guide")}</a></nav></details><WorkspaceLogout/></div></WorkspaceAccess>;
}
