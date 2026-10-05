'use client';
/** All state-changing workflows. Every action writes to the store so its result is visible on another page. */
import type { CaseStudy, Entity, Pilot, PolicyProblem, Publication, Report, ResearchProject, SimConfig } from './types';
import { getEntity, ofKind, regionName as regionNameSafe } from './registry';
import { logActivity, today, uid, update, getState } from './store';
import { runSim, leverSummary, type Scenario, type LeverValues } from './sim';
import { buildBrief } from './brief';

const isUser = (list: { id: string }[], id: string) => list.some(x => x.id === id);

export function patchProblem(id: string, patch: Partial<PolicyProblem>) {
  update(s => isUser(s.problems, id)
    ? { ...s, problems: s.problems.map(p => p.id === id ? { ...p, ...patch } : p) }
    : { ...s, problemOverrides: { ...s.problemOverrides, [id]: { ...(s.problemOverrides[id] ?? {}), ...patch } } });
}
export function patchPilot(id: string, patch: Partial<Pilot>) {
  update(s => isUser(s.pilots, id)
    ? { ...s, pilots: s.pilots.map(p => p.id === id ? { ...p, ...patch } : p) }
    : { ...s, pilotOverrides: { ...s.pilotOverrides, [id]: { ...(s.pilotOverrides[id] ?? {}), ...patch } } });
}
export function patchPublication(id: string, patch: Partial<Publication>) {
  update(s => isUser(s.publications, id)
    ? { ...s, publications: s.publications.map(p => p.id === id ? { ...p, ...patch } : p) }
    : { ...s, pubOverrides: { ...s.pubOverrides, [id]: { ...(s.pubOverrides[id] ?? {}), ...patch } } });
}
export function patchResearch(id: string, patch: Partial<ResearchProject>) {
  update(s => isUser(s.research, id)
    ? { ...s, research: s.research.map(p => p.id === id ? { ...p, ...patch } : p) }
    : { ...s, researchOverrides: { ...s.researchOverrides, [id]: { ...(s.researchOverrides[id] ?? {}), ...patch } } });
}

const FIELD_FOR: Record<string, keyof PolicyProblem> = { dataset: 'datasets', research: 'research', literature: 'literature', policy: 'policies', case: 'cases' };
/** Add a piece of evidence to a policy problem's evidence base. Returns false if already present / not applicable. */
export function addToProblem(problemId: string, entityId: string): boolean {
  const p = getEntity<PolicyProblem>(problemId); const e = getEntity(entityId); if (!p || !e) return false;
  const f = FIELD_FOR[e.kind]; if (!f) return false; const arr = p[f] as string[];
  if (arr.includes(entityId)) return false;
  patchProblem(problemId, { [f]: [...arr, entityId] } as Partial<PolicyProblem>);
  logActivity(`Added ${e.title} to ${p.title}`, `/portal/government/problems/${problemId}#evidence`, 'government'); return true;
}
export function addDatasetToProject(projectId: string, dsId: string): boolean {
  const p = getEntity<ResearchProject>(projectId); if (!p || p.datasets.includes(dsId)) return false;
  patchResearch(projectId, { datasets: [...p.datasets, dsId] }); logActivity(`Added dataset ${dsId} to ${p.title}`, `/portal/researcher/projects/${projectId}`, 'researcher'); return true;
}

export function saveScenario(sim: string, name: string, levers: LeverValues, note?: string): Scenario {
  const sc: Scenario = { id: uid('SC'), sim, name: name.trim() || 'Untitled scenario', levers, created: today(), note };
  update(s => ({ ...s, scenarios: [sc, ...s.scenarios] }));
  const s = getEntity<SimConfig>(sim); logActivity(`Saved scenario “${sc.name}” (${s?.problem})`, `/portal/government/simulator/${sim}#scenarios`, 'government'); return sc;
}
export function deleteScenario(id: string) { update(s => ({ ...s, scenarios: s.scenarios.filter(x => x.id !== id) })); }

export function createPilotFromScenario(sc: Scenario, o: { title: string; location: string; months: number; gisRegion: string; lead: string }): string {
  const sim = getEntity<SimConfig>(sc.sim)!; const prob = getEntity<PolicyProblem>(sim.problem)!; const res = runSim(sim, sc.levers);
  const id = uid('PL');
  const pilot: Pilot = { kind: 'pilot', id, title: o.title, provenance: 'demo', problem: sim.problem, simulation: sim.id, scenarioName: sc.name, intervention: leverSummary(sim, sc.levers), location: o.location, regions: prob.regions, gisRegion: o.gisRegion, start: today().slice(0, 7), durationMonths: o.months, status: 'Planned',
    objectives: prob.objectives, design: `Pilot derived from simulation scenario “${sc.name}”. Define treatment and comparison units before launch.`, comparison: 'To be defined', datasets: prob.datasets.slice(0, 3), research: prob.research,
    kpis: sim.indicators.map(i => ({ id: i.id, label: i.label, unit: i.unit, baseline: i.baseline, target: res.final[i.id].scenario, better: i.better, readings: [] })), budgetCr: res.cost, lead: o.lead,
    evaluation: { verdict: 'Not started', summary: 'Pilot planned from a simulation scenario. Targets are the simulated end-of-horizon values – review them with stakeholders.', lessons: [], recommendation: 'Pending' }, userCreated: true };
  update(s => ({ ...s, pilots: [pilot, ...s.pilots] }));
  if (prob.stage === 'Problem framing' || prob.stage === 'Evidence synthesis' || prob.stage === 'Simulation') patchProblem(prob.id, { stage: 'Pilot design' });
  logActivity(`Planned pilot “${o.title}” from scenario “${sc.name}”`, `/portal/government/pilots/${id}`, 'government'); return id;
}
export function recordReading(pilotId: string, values: Record<string, number>) {
  const p = getEntity<Pilot>(pilotId); if (!p) return;
  const kpis = p.kpis.map(k => values[k.id] !== undefined && !Number.isNaN(values[k.id]) ? { ...k, readings: [...k.readings, values[k.id]] } : k);
  patchPilot(pilotId, { kpis, status: p.status === 'Planned' ? 'Running' : p.status });
  const prob = getEntity<PolicyProblem>(p.problem); if (prob && ['Pilot design', 'Simulation', 'Evidence synthesis', 'Problem framing'].includes(prob.stage)) patchProblem(prob.id, { stage: 'Pilot running' });
  logActivity(`Recorded monitoring reading for ${p.title}`, `/portal/government/pilots/${pilotId}#evaluation`, 'government');
}
export function concludePilot(pilotId: string, ev: Pilot['evaluation']) {
  const p = getEntity<Pilot>(pilotId); if (!p) return;
  patchPilot(pilotId, { status: 'Completed', evaluation: ev });
  const prob = getEntity<PolicyProblem>(p.problem); if (prob) patchProblem(prob.id, { stage: ev.recommendation === 'Scale up' ? 'Scaled / Closed' : 'Evaluation' });
  logActivity(`Concluded evaluation of ${p.title}: ${ev.recommendation}`, `/portal/government/pilots/${pilotId}#evaluation`, 'government');
}
export function publishCaseFromPilot(pilotId: string): string | undefined {
  const p = getEntity<Pilot>(pilotId); if (!p) return; if (p.case) return p.case;
  const prob = getEntity<PolicyProblem>(p.problem); const id = uid('CS');
  const c: CaseStudy = { kind: 'case', id, title: `${p.title} – pilot case study`, provenance: 'demo', theme: prob?.theme ?? 'General', location: p.location, regions: p.regions, year: p.start.slice(0, 4), problem: prob?.statement ?? '', intervention: p.intervention, implementation: [p.design, `Comparison: ${p.comparison}`, `Duration: ${p.durationMonths} months · budget ₹${p.budgetCr} crore (demo)`],
    outcome: p.kpis.map(k => { const last = k.readings.length ? k.readings[k.readings.length - 1] : k.baseline; return `${k.label}: ${k.baseline} → ${last} ${k.unit} (target ${k.target})`; }).concat([`Verdict: ${p.evaluation.verdict}`]), evidence: p.research, lessons: p.evaluation.lessons.length ? p.evaluation.lessons : ['No lessons recorded yet.'], replicability: p.evaluation.recommendation === 'Scale up' ? 'High – evaluation recommends scale-up.' : 'To be determined after further piloting.', problems: [p.problem], pilot: p.id, policies: prob?.policies ?? [], datasets: p.datasets,
    publicSummary: `${p.intervention} was tried in ${p.location}. Result: ${p.evaluation.verdict}.`, userCreated: true };
  update(s => ({ ...s, cases: [c, ...s.cases] })); patchPilot(pilotId, { case: id });
  if (prob) { const cs = prob.cases.includes(id) ? prob.cases : [...prob.cases, id]; patchProblem(prob.id, { cases: cs }); }
  logActivity(`Published case study from ${p.title}`, `/portal/government/cases/${id}`, 'government'); return id;
}

export function generateBrief(problemId: string, scenarioIds: string[] = []): string | undefined {
  const p = getEntity<PolicyProblem>(problemId); if (!p) return;
  const pool = { research: ofKind('research'), literature: ofKind('literature'), policies: ofKind('policy'), datasets: ofKind('dataset'), cases: ofKind('case'), pilots: ofKind('pilot'), simulations: ofKind('simulation') };
  const scs = getState().scenarios.filter(s => scenarioIds.includes(s.id) || (scenarioIds.length === 0 && s.sim === p.simulation)).slice(0, 3);
  let note: string | undefined;
  if (scs.length) { const sim = getEntity<SimConfig>(scs[0].sim)!; note = `Saved scenarios (model horizon ${sim.horizonMonths} months):`; }
  const sections = buildBrief(p, pool, note);
  if (scs.length) { const sim = getEntity<SimConfig>(scs[0].sim)!; const sec = sections.find(s => s.h.startsWith('7.'))!; sec.bullets = scs.map(sc => { const r = runSim(sim, sc.levers); return `${sc.name}: ` + sim.indicators.map(i => `${i.label} ${r.final[i.id].baseline} → ${r.final[i.id].scenario} ${i.unit}`).join('; ') + `; indicative cost ₹${r.cost} crore (demo model)`; }); }
  const id = uid('RPT'); const r: Report = { kind: 'report', id, title: `Evidence brief – ${p.title}`, provenance: 'demo', problem: problemId, created: today(), author: 'You (demo)', sections, userCreated: true };
  update(s => ({ ...s, reports: [r, ...s.reports] })); logActivity(`Generated evidence brief for ${p.title}`, `/portal/government/reports/${id}`, 'government'); return id;
}

export function startProjectFromGap(gapId: string): string | undefined {
  const g = getEntity<Entity & { kind: 'gap' }>(gapId); if (!g || g.kind !== 'gap') return;
  const id = uid('RP'); const proj: ResearchProject = { kind: 'research', id, title: `${g.theme}: ${g.title.split(' – ')[0].replace(/ in .*/, '')} (${g.region})`, provenance: 'demo', lead: 'You (demo)', leadRole: 'Principal Investigator', institution: 'Your institution (demo)', status: 'Draft', progress: 5, regions: [g.gisRegion.split('-')[0]], studyArea: g.region + ' India', summary: g.why, publicSummary: g.why, question: g.questions[0] ?? '', methodology: ['To be defined'], datasets: g.datasets, layers: [g.layer], findings: [], outputs: [], problems: g.problems, policies: [], team: [{ name: 'You (demo)', role: 'PI' }], themes: [g.theme], start: today().slice(0, 7), end: '', evidenceStrength: 'Emerging', public: false, userCreated: true } as ResearchProject;
  update(s => ({ ...s, research: [proj, ...s.research], activeProject: id })); logActivity(`Started research project from gap “${g.title}”`, `/portal/researcher/projects/${id}`, 'researcher'); return id;
}

export function createProject(o: { title: string; question: string; institution: string; themes: string[]; region: string; layer: string; datasets?: string[]; problems?: string[] }): string {
  const id = uid('RP');
  const proj = { kind: 'research', id, title: o.title, provenance: 'demo', lead: 'You (demo)', leadRole: 'Principal Investigator', institution: o.institution, status: 'Draft', progress: 5, regions: [o.region], studyArea: regionNameSafe(o.region), summary: o.question, publicSummary: o.question, question: o.question, methodology: ['To be defined'], datasets: o.datasets ?? [], layers: [o.layer], findings: [], outputs: [], problems: o.problems ?? [], policies: [], team: [{ name: 'You (demo)', role: 'PI' }], themes: o.themes, start: today().slice(0, 7), end: '', evidenceStrength: 'Emerging', public: false } as ResearchProject;
  update(s => ({ ...s, research: [proj, ...s.research], activeProject: id })); logActivity(`Started research project “${o.title}”`, `/portal/researcher/projects/${id}`, 'researcher'); return id;
}

export function createPublication(o: { project: string; type: Publication['type']; title: string }): string {
  const r = getEntity<ResearchProject>(o.project)!; const id = uid('PUB');
  const pub: Publication = { kind: 'publication', id, title: o.title, provenance: 'demo', type: o.type, authors: r.lead, project: o.project, status: 'Draft', date: today(), abstract: r.summary,
    sections: [{ h: 'Introduction', p: r.question }, { h: 'Data and methods', p: r.methodology.join('; ') + '. Datasets: ' + r.datasets.join(', ') + '.' }, { h: 'Findings', p: r.findings.length ? r.findings.join(' ') : 'To be written.' }, { h: 'Policy implications', p: r.problems.length ? `Relevant to policy problem(s): ${r.problems.join(', ')}.` : 'To be written.' }], datasets: r.datasets, problems: r.problems, userCreated: true };
  update(s => ({ ...s, publications: [pub, ...s.publications] })); logActivity(`Drafted ${o.type.toLowerCase()} “${o.title}”`, `/portal/researcher/publish/${id}`, 'researcher'); return id;
}
export function caseFromPublication(pubId: string): string | undefined {
  const p = getEntity<Publication>(pubId); if (!p) return; const r = getEntity<ResearchProject>(p.project); const id = uid('CS'); const sec = (h: string) => p.sections.find(s => s.h.toLowerCase().includes(h))?.p ?? '';
  const c: CaseStudy = { kind: 'case', id, title: p.title.replace(/\(.*\)$/, '').trim(), provenance: 'demo', theme: r?.themes[0] ?? 'General', location: r?.studyArea ?? '', regions: r?.regions ?? [], year: p.date.slice(0, 4), problem: sec('problem') || sec('intro'), intervention: sec('intervention') || sec('method'), implementation: p.sections.map(s => `${s.h}: ${s.p}`), outcome: sec('finding') ? [sec('finding')] : [p.abstract], evidence: r ? [r.id] : [], lessons: [sec('implication') || 'To be written.'], replicability: 'To be assessed.', problems: p.problems, policies: r?.policies ?? [], datasets: p.datasets, publicSummary: p.abstract, userCreated: true };
  update(s => ({ ...s, cases: [c, ...s.cases] })); patchPublication(pubId, { status: 'Published' }); logActivity(`Published case study “${c.title}”`, `/portal/researcher/publish/${id}`, 'researcher'); return id;
}
