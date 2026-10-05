import type { Entity, Kind, ModuleDef, Role, Report, PolicyProblem, Pilot, CaseStudy, Publication, ResearchProject, SimConfig, Dataset, Policy, Programme, Literature, Article, Consultation, Gap, Team, Opportunity } from './types';
import { datasets } from './data/datasets';
import { policies, programmes, literature } from './data/policy';
import { research } from './data/research';
import { problems, simulations } from './data/problems';
import { pilots, cases, opportunities } from './data/delivery';
import { articles, consultations, gaps, teams, publications } from './data/public';
import { buildBrief } from './brief';
import { regionById, regionName } from './geo';

export const roleMeta: Record<Role, { label: string; short: string; purpose: string; tagline: string; home: string }> = {
  government: { label: 'Government & Policy', short: 'Government', purpose: 'Move from a policy problem to evidence, GIS, simulation, pilot and evaluation.', tagline: 'Decision-support workspace for policymakers and officials', home: 'overview' },
  researcher: { label: 'Research & Academia', short: 'Research', purpose: 'Discover data and literature, run GIS analysis, find gaps, collaborate and publish.', tagline: 'Workspace for researchers, universities and institutions', home: 'overview' },
  public: { label: 'Public & Citizen', short: 'Public', purpose: 'Understand land governance through plain-language maps, research, policy and open data.', tagline: 'Land knowledge for everyone', home: 'overview' },
};
export const ROLES: Role[] = ['government', 'researcher', 'public'];

export const modules: Record<Role, ModuleDef[]> = {
  government: [
    { id: 'overview', label: 'Command Centre', section: 'Workspace', icon: '⌂', desc: 'National and state land-governance indicators, the policy pipeline and alerts.' },
    { id: 'problems', label: 'Policy Problems', section: 'Evidence & Policy', icon: '!', desc: 'Frame a problem and build its evidence base.' },
    { id: 'evidence', label: 'Evidence Explorer', section: 'Evidence & Policy', icon: 'E', desc: 'Search research, policies, literature and datasets and add them to a problem.' },
    { id: 'simulator', label: 'Policy Simulator', section: 'Evidence & Policy', icon: '≈', desc: 'Compare intervention scenarios with explicit assumptions.' },
    { id: 'pilots', label: 'Pilot & Evaluation', section: 'Implementation', icon: 'P', desc: 'Track pilots, baselines, KPIs and evaluation results.' },
    { id: 'programmes', label: 'Programme Monitor', section: 'Implementation', icon: '▦', desc: 'Monitor DILRMP, ULPIN, NAKSHA and related programme indicators by state.' },
    { id: 'gis', label: 'GIS Intelligence', section: 'Intelligence', icon: '⌖', desc: 'Map hotspots, compare areas and turn a finding into a policy problem.' },
    { id: 'datasets', label: 'Data Catalogue', section: 'Data', icon: 'D', desc: 'Discover datasets, metadata, quality and linked work.' },
    { id: 'cases', label: 'Case Studies', section: 'Knowledge', icon: 'C', desc: 'Structured interventions, outcomes and lessons.' },
    { id: 'innovation', label: 'Innovation Hub', section: 'Knowledge', icon: '✦', desc: 'Challenges, grants and pilot calls; review submissions.' },
    { id: 'reports', label: 'Reports & Briefs', section: 'Knowledge', icon: 'R', desc: 'Generate and print evidence briefs; view consultation outcomes.' },
  ],
  researcher: [
    { id: 'overview', label: 'Research Home', section: 'Workspace', icon: '⌂', desc: 'Your projects, suggested data, gaps and opportunities.' },
    { id: 'projects', label: 'Research Workspace', section: 'Research', icon: '◈', desc: 'Manage questions, methods, teams, datasets and outputs.' },
    { id: 'datasets', label: 'Dataset Discovery', section: 'Research', icon: 'D', desc: 'Find datasets with metadata, provenance and access.' },
    { id: 'library', label: 'Literature & Policy', section: 'Research', icon: 'L', desc: 'Search papers, policy documents, laws and programmes.' },
    { id: 'gis', label: 'GIS Workspace', section: 'Analysis', icon: '⌖', desc: 'Compose and correlate layers; save analyses to a project.' },
    { id: 'gaps', label: 'Research Gap Finder', section: 'Analysis', icon: '?', desc: 'Find under-studied themes and regions and start a project.' },
    { id: 'collab', label: 'Collaboration', section: 'Research', icon: '↔', desc: 'Teams, reviews and discussion threads.' },
    { id: 'grants', label: 'Grants & Challenges', section: 'Opportunities', icon: 'G', desc: 'Research grants, hackathons and government challenges.' },
    { id: 'publish', label: 'Publish & Case Studies', section: 'Outputs', icon: '↑', desc: 'Package findings and implementation lessons.' },
  ],
  public: [
    { id: 'overview', label: 'Knowledge Home', section: 'Explore', icon: '⌂', desc: 'Plain-language land governance knowledge.' },
    { id: 'atlas', label: 'Land Atlas', section: 'Explore', icon: '⌖', desc: 'Simple maps of land records, land use and climate risk.' },
    { id: 'research', label: 'Research Library', section: 'Explore', icon: 'R', desc: 'Accessible summaries of research and real-world case studies.' },
    { id: 'policy', label: 'Policy Explainers', section: 'Explore', icon: '§', desc: 'Understand policies, laws and guides.' },
    { id: 'insights', label: 'State & District Insights', section: 'Explore', icon: 'I', desc: 'Compare indicators by state and district.' },
    { id: 'data', label: 'Public Data', section: 'Open Knowledge', icon: 'D', desc: 'Browse and download open datasets.' },
    { id: 'consultations', label: 'Public Consultations', section: 'Participation', icon: 'C', desc: 'Read and respond to open consultations.' },
    { id: 'schemes', label: 'Land Programmes', section: 'Open Knowledge', icon: 'S', desc: 'Understand major national initiatives and how to use them.' },
  ],
};
/** extra routable modules that are not in the sidebar */
export const HIDDEN_MODULES = ['search', 'about'];
export const isModule = (role: Role, m: string) => modules[role].some(x => x.id === m) || HIDDEN_MODULES.includes(m);
export const moduleDef = (role: Role, m: string) => modules[role].find(x => x.id === m);

// ------------------------------------------------------------------ entities
const seedReports = (): Report[] => {
  const mk = (id: string, pid: string): Report => {
    const p = problems.find(x => x.id === pid)!; return { kind: 'report', id, title: `Evidence brief – ${p.title}`, provenance: 'demo', problem: pid, created: '2026-09-20', author: 'Policy Evidence Unit (demo)', sections: buildBrief(p, { research, literature, policies, datasets, cases, pilots, simulations }) };
  };
  return [mk('RPT-01', 'PP-024'), mk('RPT-02', 'PP-011')];
};
export const reports: Report[] = seedReports();

const SEED: Entity[] = [...datasets, ...research, ...literature, ...policies, ...problems, ...simulations, ...pilots, ...cases, ...programmes, ...opportunities, ...articles, ...consultations, ...gaps, ...teams, ...publications, ...reports];
const seedIndex = new Map<string, Entity>(SEED.map(e => [e.id, e]));
let userIndex = new Map<string, Entity>();
let overrides: Record<string, Partial<Entity>> = {};
let version = 0;

/** called by the store whenever user-created entities or overrides change */
export function syncUserEntities(list: Entity[], ov: Record<string, Partial<Entity>>) {
  userIndex = new Map(list.map(e => [e.id, e])); overrides = ov; version++; edgeCache = null;
}
export const registryVersion = () => version;
export function getEntity<T extends Entity = Entity>(id: string): T | undefined {
  const base = (userIndex.get(id) ?? seedIndex.get(id)) as Entity | undefined; if (!base) return undefined;
  const o = overrides[id]; return (o ? { ...base, ...o } : base) as T;
}
export const allEntities = (): Entity[] => [...SEED.map(e => getEntity(e.id)!), ...[...userIndex.values()].map(e => getEntity(e.id)!)];
export function ofKind<K extends Kind>(kind: K): Extract<Entity, { kind: K }>[] { return allEntities().filter(e => e.kind === kind) as Extract<Entity, { kind: K }>[]; }
export const kindOfId = (id: string): Kind | undefined => getEntity(id)?.kind;

export const KIND_LABEL: Record<Kind, string> = { dataset: 'Dataset', research: 'Research project', literature: 'Literature', policy: 'Policy', problem: 'Policy problem', simulation: 'Simulation', pilot: 'Pilot', case: 'Case study', programme: 'Programme', opportunity: 'Opportunity', article: 'Explainer', consultation: 'Consultation', gap: 'Research gap', team: 'Team workspace', publication: 'Publication', report: 'Evidence brief' };

// ------------------------------------------------------------------ routing
const MAP: Record<Role, Partial<Record<Kind, string>>> = {
  government: { dataset: 'datasets', research: 'evidence', literature: 'evidence', policy: 'evidence', problem: 'problems', simulation: 'simulator', pilot: 'pilots', case: 'cases', programme: 'programmes', opportunity: 'innovation', report: 'reports', consultation: 'reports' },
  researcher: { dataset: 'datasets', research: 'projects', literature: 'library', policy: 'library', programme: 'library', case: 'publish', publication: 'publish', opportunity: 'grants', gap: 'gaps', team: 'collab' },
  public: { dataset: 'data', research: 'research', case: 'research', policy: 'policy', article: 'policy', programme: 'schemes', consultation: 'consultations' },
};
export function canOpen(role: Role, id: string): boolean {
  const e = getEntity(id); if (!e) return false; if (!MAP[role][e.kind]) return false;
  if (role === 'public') {
    if (e.kind === 'research') return (e as ResearchProject).public;
    if (e.kind === 'dataset') return (e as Dataset).access === 'Public';
    if (e.kind === 'case') return true;
  }
  return true;
}
export function hrefFor(role: Role, id: string): string | undefined {
  const e = getEntity(id); if (!e || !canOpen(role, id)) return undefined;
  const mod = MAP[role][e.kind]!; return `/portal/${role}/${mod}/${id}`;
}
export const modHref = (role: Role, m: string, qs?: Record<string, string | undefined>) => {
  const q = qs ? Object.entries(qs).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&') : '';
  return `/portal/${role}/${m}${q ? `?${q}` : ''}`;
};
export const gisModule = (role: Role) => (role === 'public' ? 'atlas' : 'gis');
export function gisHref(role: Role, o: { region?: string; layer?: string; compare?: string }) { return modHref(role, gisModule(role), { region: o.region, layer: o.layer, compare: o.compare }); }
export function regionHref(role: Role, region: string) {
  return role === 'public' ? gisHref(role, { region }) : gisHref(role, { region });
}

// ------------------------------------------------------------------ relations
const FIELDS: Record<Kind, string[]> = {
  dataset: [], research: ['datasets', 'outputs', 'problems', 'policies'], literature: ['policies', 'research'],
  policy: ['datasets', 'research', 'problems', 'programme'], problem: ['datasets', 'research', 'literature', 'policies', 'cases', 'simulation', 'consultations'],
  simulation: ['problem'], pilot: ['problem', 'simulation', 'datasets', 'research', 'case'], case: ['evidence', 'problems', 'pilot', 'policies', 'datasets'],
  programme: ['policies', 'datasets'], opportunity: ['problems', 'datasets'], article: ['policies', 'research', 'datasets', 'consultations'],
  consultation: ['problems', 'policies', 'research'], gap: ['datasets', 'problems', 'research'], team: ['projects', 'datasets'], publication: ['project', 'datasets', 'problems'], report: ['problem'],
};
let edgeCache: Map<string, Set<string>> | null = null;
function edges(): Map<string, Set<string>> {
  if (edgeCache) return edgeCache; const m = new Map<string, Set<string>>();
  const add = (a: string, b: string) => { if (!seedIndex.has(b) && !userIndex.has(b)) return; if (!m.has(a)) m.set(a, new Set()); if (!m.has(b)) m.set(b, new Set()); m.get(a)!.add(b); m.get(b)!.add(a); };
  for (const e of allEntities()) for (const f of FIELDS[e.kind]) { const v = (e as unknown as Record<string, unknown>)[f]; if (typeof v === 'string') add(e.id, v); else if (Array.isArray(v)) v.forEach(x => typeof x === 'string' && add(e.id, x)); }
  edgeCache = m; return m;
}
export function related(id: string, kinds?: Kind[]): Entity[] {
  const s = edges().get(id); if (!s) return [];
  return [...s].map(x => getEntity(x)!).filter(Boolean).filter(e => !kinds || kinds.includes(e.kind));
}
export function relatedFor(role: Role, id: string, kinds?: Kind[]): Entity[] { return related(id, kinds).filter(e => canOpen(role, e.id)); }

// ------------------------------------------------------------------ lifecycle
export const STAGES = ['Data', 'Research', 'Evidence', 'Policy', 'Simulation', 'Pilot', 'Evaluation', 'Knowledge'] as const;
export type Stage = typeof STAGES[number];
export function problemOf(id: string): PolicyProblem | undefined {
  const e = getEntity(id); if (!e) return undefined;
  if (e.kind === 'problem') return e;
  if (e.kind === 'simulation' || e.kind === 'pilot' || e.kind === 'report') return getEntity<PolicyProblem>(e.problem);
  const ps = related(id, ['problem']) as PolicyProblem[]; return ps[0];
}
export function lifecycle(problemId: string): Record<Stage, Entity[]> {
  const p = getEntity<PolicyProblem>(problemId); const empty = { Data: [], Research: [], Evidence: [], Policy: [], Simulation: [], Pilot: [], Evaluation: [], Knowledge: [] } as Record<Stage, Entity[]>;
  if (!p) return empty;
  const get = (ids: string[]) => ids.map(i => getEntity(i)).filter(Boolean) as Entity[];
  const pl = ofKind('pilot').filter(x => x.problem === problemId);
  const casesFor = new Set<string>([...p.cases, ...ofKind('case').filter(c => c.problems.includes(problemId)).map(c => c.id)]);
  return {
    Data: get(p.datasets), Research: get(p.research), Evidence: get(p.literature), Policy: get(p.policies),
    Simulation: get(p.simulation ? [p.simulation] : []), Pilot: pl, Evaluation: pl.filter(x => x.status !== 'Planned'),
    Knowledge: [...get([...casesFor]), ...ofKind('report').filter(r => r.problem === problemId)],
  };
}

// ------------------------------------------------------------------ search
export function visibleTo(role: Role, e: Entity): boolean { return canOpen(role, e.id); }
function textOf(e: Entity): string {
  const x = e as unknown as Record<string, unknown>;
  const parts = [e.title, x.summary, x.abstract, x.statement, x.publicSummary, x.plain, x.question, x.purpose, x.why, x.theme, x.category, x.institution, x.lead, x.authors, x.owner, x.studyArea, x.geography, x.location];
  const themes = x.themes as string[] | undefined; if (themes) parts.push(themes.join(' '));
  return parts.filter(p => typeof p === 'string').join(' ').toLowerCase();
}
export interface SearchHit { e: Entity; score: number }
export function search(role: Role, q: string, kinds?: Kind[]): SearchHit[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean); if (!terms.length) return [];
  const out: SearchHit[] = [];
  for (const e of allEntities()) {
    if (!visibleTo(role, e) || (kinds && !kinds.includes(e.kind))) continue;
    const t = textOf(e); const title = e.title.toLowerCase(); let score = 0; let ok = true;
    for (const w of terms) { if (title.includes(w)) score += 10; else if (t.includes(w)) score += 3; else if (e.id.toLowerCase() === w) score += 20; else { ok = false; break; } }
    if (ok) out.push({ e, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ------------------------------------------------------------------ display helpers
export function entityMeta(e: Entity): string {
  switch (e.kind) {
    case 'dataset': return `${e.owner.split(' / ')[0]} · ${e.access}`;
    case 'research': return `${e.institution} · ${e.status}`;
    case 'literature': return `${e.type} · ${e.year}`;
    case 'policy': return `${e.type} · ${e.level} · ${e.status}`;
    case 'problem': return `${e.owner} · ${e.stage}`;
    case 'simulation': return `${e.levers.length} levers · ${e.indicators.length} indicators`;
    case 'pilot': return `${e.location} · ${e.status}`;
    case 'case': return `${e.location} · ${e.theme}`;
    case 'programme': return e.agency;
    case 'opportunity': return `${e.type} · closes ${e.deadline}`;
    case 'article': return `${e.category} · ${e.readTime}`;
    case 'consultation': return `${e.authority} · ${e.status}`;
    case 'gap': return `${e.theme} · ${e.region}`;
    case 'team': return `${e.members.length} members`;
    case 'publication': return `${e.type} · ${e.status}`;
    case 'report': return `Created ${e.created}`;
  }
}
export function entityTitle(id: string): string { return getEntity(id)?.title ?? id; }
export { regionById, regionName };
export type { SimConfig, Dataset, Policy, Programme, Literature, Article, Consultation, Gap, Team, Opportunity, Pilot, CaseStudy, Publication, ResearchProject, PolicyProblem, Report };
