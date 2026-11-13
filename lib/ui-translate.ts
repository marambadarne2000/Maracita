import dictionaries from './ui-translations.json';
let active='en';
export function setUILocale(locale:string){active=['he','ar'].includes(locale)?locale:'en';}
export function uiLocale(){return typeof window==='undefined'?'en':active;}
export function translateLabel<T>(value:T):T {if(typeof value!=='string'||uiLocale()==='en')return value;const key=value.trim().replace(/\s+/g,' ');const dictionary=dictionaries[uiLocale() as 'he'|'ar'] as Record<string,string>;const translated=dictionary[key];return (translated===undefined?value:(value.match(/^\s*/)?.[0]??'')+translated+(value.match(/\s*$/)?.[0]??'')) as T;}
