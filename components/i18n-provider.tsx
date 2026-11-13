"use client";
import {createContext,useContext,useState,useEffect,useCallback} from 'react';
import {Globe2} from 'lucide-react';
import {setUILocale} from '@/lib/ui-translate';
export type Locale='en'|'he'|'ar'|'fr'|'ru'|'es';
export const languages:{code:Locale;label:string}[]=[{code:'en',label:'English'},{code:'he',label:'עברית'},{code:'ar',label:'العربية'}];
const Context=createContext<{locale:Locale;setLocale:(locale:Locale)=>void}|null>(null);
export function I18nProvider({children}:{children:React.ReactNode}){const [locale,update]=useState<Locale>('en');setUILocale(locale);const setLocale=useCallback((next:Locale)=>{const supported:Locale=next==='he'||next==='ar'?next:'en';setUILocale(supported);localStorage.setItem('maracita.locale.v2',supported);update(supported);},[]);useEffect(()=>{const stored=localStorage.getItem('maracita.locale.v2');if(stored==='he'||stored==='ar')setLocale(stored);},[setLocale]);useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='en'?'ltr':'rtl';},[locale]);return <Context.Provider value={{locale,setLocale}}><div key={locale}>{children}</div><label className="fixed end-5 top-3 z-50 flex h-9 items-center gap-2 rounded-lg border border-white/12 bg-[#0d1a2d]/95 px-2 text-xs font-semibold text-white shadow-lg"><Globe2 size={15}/><select aria-label="Language" value={locale} onChange={e=>setLocale(e.target.value as Locale)} className="max-w-24 bg-transparent outline-none">{languages.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select></label></Context.Provider>}
export function useI18n(){const value=useContext(Context);if(!value)throw new Error('Missing language provider.');return value;}
