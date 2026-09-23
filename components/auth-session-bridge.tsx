'use client';
import { useEffect } from 'react';
import { getSession } from '@/lib/auth-client';
export function AuthSessionBridge() { useEffect(() => { const originalFetch = window.fetch.bind(window); window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => { const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url; const headers = new Headers(init?.headers); if (url.startsWith('/api/') && !headers.has('Authorization')) { const token = getSession()?.access_token; if (token) headers.set('Authorization', `Bearer ${token}`); } return originalFetch(input, { ...init, headers }); }) as typeof fetch; return () => { window.fetch = originalFetch; }; }, []); return null; }
