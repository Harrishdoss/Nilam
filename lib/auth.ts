'use client';
import { useSyncExternalStore } from 'react';
import type { Role } from './types';

export interface Session { email: string; name: string; org: string; roles: Role[]; role?: Role }
export interface DemoUser { email: string; password: string; name: string; org: string; roles: Role[]; note: string }

export const DEMO_USERS: DemoUser[] = [
  { email: 'admin@landintel.demo', password: 'demo123', name: 'Demo Administrator', org: 'Nilam prototype team', roles: ['government', 'researcher', 'public'], note: 'Access to all three portals – best for the SIH demo' },
  { email: 'officer@landintel.demo', password: 'demo123', name: 'Anjali Rao, IAS (demo)', org: 'Revenue Reform Cell', roles: ['government'], note: 'Government & Policy portal only' },
  { email: 'researcher@landintel.demo', password: 'demo123', name: 'Dr. Suresh Iyer (demo)', org: 'Institute for Governance Research', roles: ['researcher'], note: 'Research & Academia portal only' },
  { email: 'citizen@landintel.demo', password: 'demo123', name: 'Ravi Kumar (demo)', org: 'Citizen', roles: ['public'], note: 'Public & Citizen portal only' },
];

const KEY = 'landintel-session';
const listeners = new Set<() => void>();
let cache: { raw: string | null; val: Session | null } = { raw: null, val: null };
function read(): Session | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null; try { raw = window.localStorage.getItem(KEY); } catch { return cache.val; }
  if (raw === cache.raw) return cache.val;
  let val: Session | null = null; try { val = raw ? JSON.parse(raw) : null; } catch { val = null; }
  cache = { raw, val }; return val;
}
function write(s: Session | null) { try { if (s) window.localStorage.setItem(KEY, JSON.stringify(s)); else window.localStorage.removeItem(KEY); } catch { /* ignore */ } listeners.forEach(l => l()); }
export const getSession = read;
export function signIn(email: string, password: string): Session | string {
  const u = DEMO_USERS.find(x => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) return 'No demo account with that email. Use one of the demo credentials shown on this page.';
  if (u.password !== password) return 'Incorrect password for this demo account.';
  const s: Session = { email: u.email, name: u.name, org: u.org, roles: u.roles, role: u.roles.length === 1 ? u.roles[0] : undefined }; write(s); return s;
}
export function guest(): Session { const s: Session = { email: 'guest', name: 'Guest visitor', org: 'Public', roles: ['public'], role: 'public' }; write(s); return s; }
export function chooseRole(role: Role) { const s = read(); if (s && s.roles.includes(role)) write({ ...s, role }); }
export function signOut() { write(null); }
export function useSession(): Session | null | undefined {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, read, () => undefined);
}
