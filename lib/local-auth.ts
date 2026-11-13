import {scrypt} from 'node:crypto';
import type { MaracitaRuntime } from '@/db/client';

const encoder = new TextEncoder();
const alphabet = '0123456789abcdef';

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => `${alphabet[value >> 4]}${alphabet[value & 15]}`).join('');
}

function randomHex(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

export async function tokenHash(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

export function randomToken() { return randomHex(32); }

async function derive(password: string, salt: string) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  // Cloudflare Workers supports PBKDF2 up to 100,000 iterations. Keeping the
  // value at that supported maximum lets the same secure auth flow work in
  // both local development and the public Worker.
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 }, material, 256);
  return hex(new Uint8Array(bits));
}

async function scryptHash(password:string,salt:string){return new Promise<string>((resolve,reject)=>scrypt(password,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key.toString('hex'))));}
export async function passwordHash(password:string){const salt=randomHex(16);return `scrypt$32768$8$3$${salt}$${await scryptHash(password,salt)}`;}
export async function passwordMatches(password:string,stored:string|null){if(!stored)return false;let expected:string,actual:string;if(stored.startsWith('scrypt$')){const parts=stored.split('$');if(parts.length!==6||parts.slice(1,4).join('$')!=='32768$8$3'||!/^[a-f0-9]{32}$/.test(parts[4])||!/^[a-f0-9]{64}$/.test(parts[5]))return false;expected=parts[5];actual=await scryptHash(password,parts[4]);}else{const [salt,hash]=stored.split('.');if(!salt||!hash)return false;expected=hash;actual=await derive(password,salt);}if(actual.length!==expected.length)return false;let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);return diff===0;}

export async function createSession(database: MaracitaRuntime, accountId: string) {
  const token = randomHex(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await database.DB.prepare('INSERT INTO auth_sessions (id, account_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), accountId, await tokenHash(token), expiresAt, now.toISOString()).run();
  return token;
}

export async function localIdentity(database: MaracitaRuntime, token: string) {
  const hash = await tokenHash(token);
  return database.DB.prepare("SELECT a.id, a.email, a.full_name AS fullName FROM auth_sessions s INNER JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1").bind(hash, new Date().toISOString()).first<{ id: string; email: string; fullName: string }>();
}

export async function removeSession(database: MaracitaRuntime, token: string) {
  await database.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await tokenHash(token)).run();
}
