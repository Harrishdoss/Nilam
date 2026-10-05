'use client';
import { useSyncExternalStore, useCallback } from 'react';
import type { CaseStudy, Entity, Opportunity, Pilot, PolicyProblem, Publication, Report, ResearchProject } from './types';
import type { Scenario } from './sim';
import { syncUserEntities } from './registry';

export interface Activity { id: string; t: string; text: string; href?: string; role?: string }
export interface Application { id: string; opportunity: string; name: string; org: string; pitch: string; created: string; status: 'Submitted' | 'Shortlisted' | 'Declined' }
export interface Thread { id: string; author: string; when: string; text: string }
export interface Analysis { id: string; title: string; xLayer: string; yLayer: string; r: number; n: number; scope: string; project: string; created: string; note: string }
export interface ConsultationResponse { answers: Record<string, 'agree' | 'neutral' | 'disagree'>; comment: string; created: string }

export interface State {
  scenarios: Scenario[];
  pilots: Pilot[]; cases: CaseStudy[]; publications: Publication[]; reports: Report[]; research: ResearchProject[]; problems: PolicyProblem[];
  pilotOverrides: Record<string, Partial<Pilot>>;
  problemOverrides: Record<string, Partial<PolicyProblem>>;
  pubOverrides: Record<string, Partial<Publication>>;
  researchOverrides: Record<string, Partial<ResearchProject>>;
  threads: Record<string, Thread[]>;
  reviews: Record<string, 'Requested' | 'Approved' | 'Changes requested'>;
  joined: string[];
  applications: Application[];
  appStatus: Record<string, Application['status']>;
  opps: Opportunity[];
  responses: Record<string, ConsultationResponse>;
  basket: Record<string, string[]>;
  bookmarks: string[];
  analyses: Analysis[];
  activeProject: string;
  access: Record<string, { purpose: string; created: string }>;
  activity: Activity[];
}
export const EMPTY: State = { scenarios: [], pilots: [], cases: [], publications: [], reports: [], research: [], problems: [], pilotOverrides: {}, problemOverrides: {}, pubOverrides: {}, researchOverrides: {}, threads: {}, reviews: {}, joined: [], applications: [], appStatus: {}, opps: [], responses: {}, basket: {}, bookmarks: [], analyses: [], activeProject: "RP-02", access: {}, activity: [] };

const KEY = 'landintel-store-v1';
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return; loaded = true;
  try { const raw = window.localStorage.getItem(KEY); if (raw) state = { ...EMPTY, ...JSON.parse(raw) }; } catch { /* storage unavailable */ }
  push();
}
function push() {
  const list: Entity[] = [...state.pilots, ...state.cases, ...state.publications, ...state.reports, ...state.research, ...state.problems, ...state.opps];
  const ov: Record<string, Partial<Entity>> = { ...state.pilotOverrides, ...state.problemOverrides, ...state.pubOverrides, ...state.researchOverrides } as Record<string, Partial<Entity>>;
  syncUserEntities(list, ov);
}
export function getState(): State { load(); return state; }
export function update(fn: (s: State) => State) {
  load(); state = fn(state); push();
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach(l => l());
}
export function resetStore() { update(() => EMPTY); }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useStore<T>(sel: (s: State) => T): T {
  const get = useCallback(() => sel(getState()), [sel]);
  return useSyncExternalStore(subscribe, get, () => sel(EMPTY));
}
/** subscribe a component to any store change (so registry lookups of user-created entities re-render) */
export function useStoreVersion(): State { return useSyncExternalStore(subscribe, getState, () => EMPTY); }

export const uid = (p: string) => `${p}-${Date.now().toString(36).slice(-5).toUpperCase()}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;
export const today = () => new Date().toISOString().slice(0, 10);
export function logActivity(text: string, href?: string, role?: string) {
  update(s => ({ ...s, activity: [{ id: uid('A'), t: new Date().toISOString(), text, href, role }, ...s.activity].slice(0, 40) }));
}
