'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { getSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

const leaveLabels = {
  en: { leave: 'Sign out', leaving: 'Signing out…', opening: 'Opening your secure workspace…' },
  he: { leave: 'התנתקות', leaving: 'מתנתק/ת…', opening: 'פותח/ת את סביבת העבודה המאובטחת…' },
  ar: { leave: 'تسجيل الخروج', leaving: 'جارٍ تسجيل الخروج…', opening: 'جارٍ فتح مساحة العمل الآمنة…' },
  fr: { leave: 'Se déconnecter', leaving: 'Déconnexion…', opening: 'Ouverture de votre espace sécurisé…' },
  ru: { leave: 'Выйти', leaving: 'Выход…', opening: 'Открывается защищённое рабочее пространство…' },
  es: { leave: 'Cerrar sesión', leaving: 'Cerrando sesión…', opening: 'Abriendo tu espacio seguro…' },
};

export function WorkspaceAccess({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const { locale } = useI18n();

  useEffect(() => {
    setHasSession(Boolean(getSession()?.access_token));
    setChecking(false);
  }, []);

  if (checking) {
    return <main className="grid min-h-screen place-items-center bg-[#07111f] text-sm text-[#a9bad0]">{leaveLabels[locale].opening}</main>;
  }

  if (!hasSession) {
    return <main className="grid min-h-screen place-items-center bg-[#07111f] px-5 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101c30] p-7 shadow-2xl shadow-black/30"><p className="text-xs font-bold tracking-[.16em] text-[#c9f66b]">MARACITA ACCESS</p><h1 className="mt-3 text-3xl font-black">Choose how to enter</h1><p className="mt-3 leading-6 text-[#a9bad0]">Explore a complete fictional workspace instantly, or sign in to your own workspace.</p><div className="mt-7 grid gap-3"><a href="/demo" className="rounded-xl bg-[#c9f66b] px-4 py-3 text-center font-bold text-[#10120d] hover:bg-[#ddff96]">Explore portfolio demo</a><a href="/?signin=1" className="rounded-xl border border-white/15 px-4 py-3 text-center font-semibold text-white hover:bg-white/8">Sign in to my workspace</a></div></section></main>;
  }

  return <>{children}</>;
}

export function WorkspaceLogout() {
  const [leaving, setLeaving] = useState(false);
  const { locale } = useI18n();

  const leaveWorkspace = async () => {
    if (leaving) return;
    setLeaving(true);
    await signOut();
    window.location.replace('/');
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={leaveWorkspace}
      disabled={leaving}
      className="border-white/12 bg-white/[.03] text-white hover:bg-white/10 hover:text-white"
    >
      <LogOut size={16} /> {leaving ? leaveLabels[locale].leaving : leaveLabels[locale].leave}
    </Button>
  );
}
