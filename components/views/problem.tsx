'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PolicyProblem, Intervention, Pilot } from '@/lib/types';
import { getEntity, ofKind, hrefFor, gisHref, modHref, regionName, lifecycle } from '@/lib/registry';
import { layerById, regionById } from '@/lib/geo';
import { Badge, Btn, Card, CardHead, DataTable, EntityLink, EntityList, Field, KV, Lifecycle, Modal, PageHead, Progress, Tabs, useHashTab, Bullets, Empty, ProvBadge } from '@/components/ui';
import { TileMap } from '@/components/gis/TileMap';
import { THEMES } from '@/lib/data/datasets';
import { patchProblem, generateBrief } from '@/lib/actions';
import { logActivity, today, uid, update, useStore, useStoreVersion } from '@/lib/store';
import { LAYER_SIM } from '@/lib/links';
import { NotFoundRecord } from './records';

const STAGE_TONE: Record<string, 'info' | 'warn' | 'good' | ''> = { 'Problem framing': '', 'Evidence synthesis': 'info', Simulation: 'info', 'Pilot design': 'warn', 'Pilot running': 'warn', Evaluation: 'accent' as 'info', 'Scaled / Closed': 'good' } as never;
export const PROBLEM_STAGES: PolicyProblem['stage'][] = ['Problem framing', 'Evidence synthesis', 'Simulation', 'Pilot design', 'Pilot running', 'Evaluation', 'Scaled / Closed'];

export function pilotProgress(p: Pilot): number {
  if (!p.kpis.length) return 0;
  const vals = p.kpis.map(k => { const last = k.readings.length ? k.readings[k.readings.length - 1] : k.baseline; const span = k.target - k.baseline; return span === 0 ? 100 : Math.max(0, Math.min(100, ((last - k.baseline) / span) * 100)); });
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ---------------------------------------------------------------- list
export function ProblemsList() {
  useStoreVersion(); const [q, setQ] = useState(''); const [stage, setStage] = useState(''); const [theme, setTheme] = useState(''); const [prio, setPrio] = useState(''); const [open, setOpen] = useState(false);
  const all = ofKind('problem'); const rows = all.filter(p => (!q || (p.title + p.statement + p.geography).toLowerCase().includes(q.toLowerCase())) && (!stage || p.stage === stage) && (!theme || p.theme === theme) && (!prio || p.priority === prio));
  const counts = PROBLEM_STAGES.map(s => [s, all.filter(p => p.stage === s).length] as const);
  const router = useRouter();
  return <><PageHead eyebrow="Evidence & Policy" title="Policy Problems" desc="Each problem moves through the pipeline: evidence → simulation → pilot → evaluation → knowledge. Open a problem to work on any stage." actions={<Btn kind="primary" onClick={() => setOpen(true)}>+ New policy problem</Btn>} />
    <div className="chips mb12" aria-label="Filter by stage">{counts.map(([s, n]) => <button key={s} className={`chip ${stage === s ? 'on' : ''}`} onClick={() => setStage(stage === s ? '' : s)} aria-pressed={stage === s}>{s} · {n}</button>)}</div>
    <div className="filters"><input type="search" aria-label="Search problems" placeholder="Search problems…" value={q} onChange={e => setQ(e.target.value)} /><select aria-label="Theme" value={theme} onChange={e => setTheme(e.target.value)}><option value="">All themes</option>{THEMES.map(t => <option key={t}>{t}</option>)}</select><select aria-label="Priority" value={prio} onChange={e => setPrio(e.target.value)}><option value="">Any priority</option><option>High</option><option>Medium</option><option>Low</option></select>{(q || stage || theme || prio) && <Btn size="sm" onClick={() => { setQ(''); setStage(''); setTheme(''); setPrio(''); }}>Clear filters</Btn>}<span className="tiny">{rows.length} of {all.length}</span></div>
    <Card pad={false}><DataTable rows={rows} rowKey={p => p.id} onRow={p => router.push(hrefFor('government', p.id)!)} cols={[
      { key: 'id', label: 'ID', sort: p => p.id, render: p => p.id }, { key: 't', label: 'Problem', sort: p => p.title, render: p => <div><Link className="link" href={hrefFor('government', p.id)!} onClick={e => e.stopPropagation()}>{p.title}</Link><div className="tiny">{p.geography}</div></div> },
      { key: 'o', label: 'Owner', render: p => <span className="tiny">{p.owner}</span> }, { key: 'pr', label: 'Priority', sort: p => ({ High: 0, Medium: 1, Low: 2 })[p.priority], render: p => <Badge tone={p.priority === 'High' ? 'bad' : p.priority === 'Medium' ? 'warn' : ''}>{p.priority}</Badge> },
      { key: 's', label: 'Stage', sort: p => PROBLEM_STAGES.indexOf(p.stage), render: p => <Badge tone={STAGE_TONE[p.stage]}>{p.stage}</Badge> }, { key: 'e', label: 'Evidence', num: true, sort: p => p.research.length + p.literature.length, render: p => p.research.length + p.literature.length + p.policies.length }]} /></Card>
    {open && <NewProblem onClose={() => setOpen(false)} />}</>;
}

function NewProblem({ onClose }: { onClose: () => void }) {
  const router = useRouter(); const [title, setTitle] = useState(''); const [theme, setTheme] = useState<string>(THEMES[0]); const [region, setRegion] = useState('TN'); const [statement, setStatement] = useState(''); const [prio, setPrio] = useState<'High' | 'Medium' | 'Low'>('Medium'); const [layer, setLayer] = useState('mutation');
  function create() {
    const id = uid('PP'); const r = regionById(region)!;
    const p: PolicyProblem = { kind: 'problem', id, title: title.trim(), provenance: 'demo', owner: 'Your department (demo)', priority: prio, stage: 'Problem framing', theme, regions: [r.level === 'district' ? r.parent! : region], geography: r.name, statement: statement.trim(), whyNow: 'To be articulated.', baseline: [{ indicator: `${layerById(layer)!.label} – ${r.name}`, value: `${r.values[layer]}`, source: `${layerById(layer)!.datasetId} (demo)`, datasetId: layerById(layer)!.datasetId }], objectives: ['Define a measurable target'], interventions: [], datasets: [layerById(layer)!.datasetId], research: [], literature: [], policies: [], cases: [], gisLayer: layer, gisRegion: region, simulation: LAYER_SIM[layer], consultations: [], created: today() };
    update(s => ({ ...s, problems: [p, ...s.problems] })); logActivity(`Created policy problem “${p.title}”`, `/portal/government/problems/${id}`, 'government'); router.push(`/portal/government/problems/${id}`);
  }
  return <Modal title="New policy problem" onClose={onClose} foot={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" onClick={create} disabled={title.trim().length < 5 || statement.trim().length < 10}>Create problem</Btn></>}>
    <Field label="Title"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Delay in digitising village maps" /></Field>
    <div className="grid g2"><Field label="Theme"><select className="select" value={theme} onChange={e => setTheme(e.target.value)}>{THEMES.map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Priority"><select className="select" value={prio} onChange={e => setPrio(e.target.value as 'High')}><option>High</option><option>Medium</option><option>Low</option></select></Field>
      <Field label="Geography"><select className="select" value={region} onChange={e => setRegion(e.target.value)}>{['TN', 'MH', 'UP', 'KL', 'GJ', 'OD', 'BR', 'WB', 'AS', 'RJ', 'MP'].map(c => <option key={c} value={c}>{regionName(c)}</option>)}</select></Field>
      <Field label="Key indicator layer" hint="Sets the baseline, GIS view and the simulation template"><select className="select" value={layer} onChange={e => setLayer(e.target.value)}>{['mutation', 'ror', 'cadastral', 'conversion', 'climate', 'disputes'].map(l => <option key={l} value={l}>{layerById(l)!.label}</option>)}</select></Field></div>
    <Field label="Problem statement"><textarea className="textarea" value={statement} onChange={e => setStatement(e.target.value)} placeholder="What is going wrong, for whom, and why does it matter?" /></Field></Modal>;
}

// ---------------------------------------------------------------- detail
const NEXT: Record<PolicyProblem['stage'], { text: string; cta: string; to: (p: PolicyProblem) => string }> = {
  'Problem framing': { text: 'Build the evidence base: attach research, literature and policies.', cta: 'Open Evidence Explorer', to: p => modHref('government', 'evidence', { problem: p.id }) },
  'Evidence synthesis': { text: 'Look at where the problem is worst, then simulate options.', cta: 'Open in GIS', to: p => gisHref('government', { region: p.gisRegion, layer: p.gisLayer }) },
  Simulation: { text: 'Pick a scenario and turn it into a pilot.', cta: 'Open Policy Simulator', to: p => `/portal/government/simulator/${p.simulation}` },
  'Pilot design': { text: 'Finalise pilot design and start recording KPI readings.', cta: 'Open pilots', to: () => modHref('government', 'pilots') },
  'Pilot running': { text: 'Record monthly KPI readings and watch progress against targets.', cta: 'Open pilots', to: () => modHref('government', 'pilots') },
  Evaluation: { text: 'Conclude the evaluation, publish a case study and brief the decision-makers.', cta: 'Open pilots', to: () => modHref('government', 'pilots') },
  'Scaled / Closed': { text: 'Document lessons and share the evidence brief.', cta: 'Reports & Briefs', to: () => modHref('government', 'reports') },
};

export function ProblemDetail({ id }: { id: string }) {
  useStoreVersion(); const router = useRouter(); const p = getEntity<PolicyProblem>(id);
  const TABS = ['overview', 'evidence', 'data', 'options', 'pipeline'] as const; const [tab, setTab] = useHashTab<typeof TABS[number]>([...TABS], 'overview');
  const scenarios = useStore(s => s.scenarios); const [adding, setAdding] = useState(false); const [briefing, setBriefing] = useState(false);
  if (!p || p.kind !== 'problem') return <NotFoundRecord role="government" module="problems" />;
  const lc = lifecycle(id); const pilots = lc.Pilot as Pilot[]; const myScenarios = scenarios.filter(s => s.sim === p.simulation);
  const evidenceCount = p.research.length + p.literature.length + p.policies.length + p.cases.length;
  const remove = (field: 'research' | 'literature' | 'policies' | 'cases' | 'datasets', rid: string) => patchProblem(id, { [field]: (p[field] as string[]).filter(x => x !== rid) } as Partial<PolicyProblem>);
  const nx = NEXT[p.stage]; const reports = ofKind('report').filter(r => r.problem === id);
  const layer = layerById(p.gisLayer)!;
  return <div>
    <Link className="link tiny" href="/portal/government/problems">← Policy Problems</Link>
    <PageHead eyebrow={`Policy problem · ${p.id} · ${p.theme}`} title={p.title} desc={p.geography} actions={<><Badge tone={p.priority === 'High' ? 'bad' : 'warn'}>{p.priority} priority</Badge><Badge tone={STAGE_TONE[p.stage]}>{p.stage}</Badge><ProvBadge p={p.provenance} /></>} />
    <div className="mb16"><Lifecycle problemId={id} /></div>
    <div className="row mb16 no-print"><Btn kind="primary" href={gisHref('government', { region: p.gisRegion, layer: p.gisLayer })}>⌖ Open in GIS</Btn><Btn href={`/portal/government/simulator/${p.simulation}`}>≈ Simulate</Btn><Btn onClick={() => setBriefing(true)}>R Generate evidence brief</Btn><Btn href={modHref('government', 'evidence', { problem: id })}>E Add evidence</Btn></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'evidence', label: 'Evidence', n: evidenceCount }, { id: 'data', label: 'Data & GIS', n: p.datasets.length }, { id: 'options', label: 'Options', n: p.interventions.length }, { id: 'pipeline', label: 'Pipeline', n: pilots.length + myScenarios.length }]} />
    {tab === 'overview' && <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><h2 className="h2 mb8">Problem statement</h2><p>{p.statement}</p><h3 className="h3 mt16 mb8">Why now</h3><p>{p.whyNow}</p></Card>
      <Card pad={false}><CardHead title="Baseline" sub="Where we are today (demo values)" /><div className="table-wrap"><table className="t"><thead><tr><th>Indicator</th><th>Value</th><th>Source</th></tr></thead><tbody>{p.baseline.map((b, i) => <tr key={i}><td>{b.indicator}</td><td><b>{b.value}</b></td><td>{b.datasetId ? <Link className="link" href={hrefFor('government', b.datasetId)!}>{b.source}</Link> : b.source}</td></tr>)}</tbody></table></div></Card>
      <Card><h2 className="h2 mb8">Objectives</h2><Bullets items={p.objectives} /></Card>
      <Card><h2 className="h2 mb8">Existing policies</h2><EntityList ids={p.policies} empty="No policies linked yet – add some from Evidence Explorer." /></Card></div>
      <div className="col" style={{ gap: 16 }}><Card><div className="eyebrow">Recommended next step</div><p className="mt4">{nx.text}</p><div className="mt8"><Btn kind="primary" href={nx.to(p)}>{nx.cta} →</Btn></div></Card>
        <Card><KV items={[['Owner', p.owner], ['Created', p.created], ['Regions', p.regions.map(regionName).join(', ')], ['Primary layer', layer.label]]} /><div className="field mt12"><label htmlFor="stage">Stage</label><select id="stage" className="select" value={p.stage} onChange={e => patchProblem(id, { stage: e.target.value as PolicyProblem['stage'] })}>{PROBLEM_STAGES.map(s => <option key={s}>{s}</option>)}</select></div></Card>
        {p.consultations.length > 0 && <Card pad={false}><CardHead title="Public consultation" /><EntityList ids={p.consultations} /></Card>}</div></div>}
    {tab === 'evidence' && <div className="col" style={{ gap: 16 }}>
      <div className="row between"><div className="tiny">{evidenceCount} evidence items. Remove anything not relevant; add more from the Evidence Explorer.</div><Btn size="sm" href={modHref('government', 'evidence', { problem: id })}>+ Add evidence</Btn></div>
      {([['research', 'Research', p.research], ['literature', 'Literature', p.literature], ['policies', 'Policies & programmes', p.policies], ['cases', 'Case studies', p.cases]] as const).map(([f, label, ids]) => <Card key={f} pad={false}><CardHead title={`${label} (${ids.length})`} />{ids.length ? ids.map(i => <div key={i} className="row" style={{ alignItems: 'stretch', gap: 0 }}><div className="grow"><EntityLink id={i} /></div><button className="btn sm ghost no-print" style={{ margin: 8 }} aria-label={`Remove ${i}`} onClick={() => remove(f, i)}>Remove</button></div>) : <Empty>None yet.</Empty>}</Card>)}
      {p.research.length > 0 && <Card><h2 className="h2 mb8">What the research says</h2>{p.research.map(rid => { const r = getEntity(rid); return r && r.kind === 'research' ? <div key={rid} className="mb12"><b>{r.title}</b> <Badge tone={r.evidenceStrength === 'Strong' ? 'good' : r.evidenceStrength === 'Moderate' ? 'info' : 'warn'}>{r.evidenceStrength}</Badge><Bullets items={r.findings} /></div> : null; })}</Card>}</div>}
    {tab === 'data' && <div className="split"><div className="col" style={{ gap: 16 }}><Card pad={false}><CardHead title={`Datasets (${p.datasets.length})`} />{p.datasets.length ? p.datasets.map(i => <div key={i} className="row" style={{ alignItems: 'stretch', gap: 0 }}><div className="grow"><EntityLink id={i} /></div><button className="btn sm ghost no-print" style={{ margin: 8 }} onClick={() => remove('datasets', i)}>Remove</button></div>) : <Empty>No datasets linked.</Empty>}</Card></div>
      <Card pad={false}><CardHead title={`Map: ${layer.short}`} sub={`Focus: ${regionName(p.gisRegion)}`} /><div className="card-body"><TileMap scope="IN" layer={p.gisLayer} compact selected={p.gisRegion.split('-')[0]} onSelect={r => router.push(gisHref('government', { region: r, layer: p.gisLayer }))} /><div className="mt8"><Btn kind="primary" href={gisHref('government', { region: p.gisRegion, layer: p.gisLayer })}>Open {regionName(p.gisRegion)} in GIS →</Btn></div></div></Card></div>}
    {tab === 'options' && <div className="col" style={{ gap: 16 }}>{p.interventions.length === 0 ? <Card><Empty>No options defined yet.</Empty></Card> : <div className="grid g2">{p.interventions.map(i => <Card key={i.id}><div className="row between"><h3 className="h3">{i.title}</h3><Badge tone={i.evidence === 'Strong' ? 'good' : i.evidence === 'Moderate' ? 'info' : 'warn'}>{i.evidence} evidence</Badge></div><p className="mt4" style={{ fontSize: 13 }}>{i.description}</p><div className="row mt8"><Badge>Cost: {i.cost}</Badge><Badge>Time: {i.time}</Badge></div>{i.supportedBy.length > 0 && <div className="mt8"><div className="tiny">Supported by</div><div className="chips mt4">{i.supportedBy.map(s => <EntityLink key={s} id={s} kind="chip" />)}</div></div>}<div className="mt12"><Btn kind="primary" href={`/portal/government/simulator/${p.simulation}?preset=${i.id}`} disabled={!i.leverPreset}>Simulate this option →</Btn></div></Card>)}</div>}
      <div><Btn onClick={() => setAdding(true)}>+ Add an option</Btn></div></div>}
    {tab === 'pipeline' && <div className="col" style={{ gap: 16 }}>
      <Card pad={false}><CardHead title={`Saved simulation scenarios (${myScenarios.length})`} right={<Btn size="sm" href={`/portal/government/simulator/${p.simulation}#scenarios`}>Open simulator</Btn>} />{myScenarios.length ? myScenarios.map(s => <div key={s.id} className="erow"><div className="grow"><div className="t1">{s.name}</div><div className="t2">Saved {s.created}</div></div><Link className="link" href={`/portal/government/simulator/${p.simulation}#scenarios`}>View →</Link></div>) : <Empty>No saved scenarios – run the simulator and save one.</Empty>}</Card>
      <Card pad={false}><CardHead title={`Pilots & evaluation (${pilots.length})`} />{pilots.length ? <DataTable rows={pilots} rowKey={x => x.id} onRow={x => router.push(hrefFor('government', x.id)!)} cols={[{ key: 't', label: 'Pilot', render: x => <Link className="link" href={hrefFor('government', x.id)!} onClick={e => e.stopPropagation()}>{x.title}</Link> }, { key: 's', label: 'Status', render: x => <Badge tone={x.status === 'Completed' ? 'good' : x.status === 'Running' ? 'info' : ''}>{x.status}</Badge> }, { key: 'p', label: 'Progress to target', render: x => <div style={{ minWidth: 120 }}><Progress value={pilotProgress(x)} /><div className="tiny">{pilotProgress(x)}%</div></div> }, { key: 'r', label: 'Recommendation', render: x => x.evaluation.recommendation }]} /> : <Empty>No pilots yet.</Empty>}</Card>
      <Card pad={false}><CardHead title="Knowledge outputs" /><EntityList ids={[...lc.Knowledge.map(k => k.id)]} empty="No case studies or briefs yet." /></Card></div>}
    {adding && <AddOption onClose={() => setAdding(false)} onSave={(i: Intervention) => { patchProblem(id, { interventions: [...p.interventions, i] }); setAdding(false); }} />}
    {briefing && <Modal title="Generate evidence brief" onClose={() => setBriefing(false)} foot={<><Btn onClick={() => setBriefing(false)}>Cancel</Btn><Btn kind="primary" onClick={() => { const rid = generateBrief(id); if (rid) router.push(`/portal/government/reports/${rid}`); }}>Generate and open</Btn></>}>
      <p>Assembles a printable brief from this problem’s baseline, evidence, policies, options, {myScenarios.length ? `${Math.min(3, myScenarios.length)} saved scenario(s)` : 'simulation status'}, pilots and case studies.</p><p className="tiny mt8">Records currently included: {evidenceCount} evidence items, {p.datasets.length} datasets, {pilots.length} pilots.</p></Modal>}
  </div>;
}
function AddOption({ onClose, onSave }: { onClose: () => void; onSave: (i: Intervention) => void }) {
  const [t, setT] = useState(''); const [d, setD] = useState(''); const [e, setE] = useState<Intervention['evidence']>('Emerging'); const [c, setC] = useState<Intervention['cost']>('Medium'); const [time, setTime] = useState('6 months');
  return <Modal title="Add an intervention option" onClose={onClose} foot={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" disabled={t.trim().length < 4} onClick={() => onSave({ id: uid('I'), title: t.trim(), description: d.trim(), evidence: e, cost: c, time, supportedBy: [] })}>Add option</Btn></>}>
    <Field label="Option title"><input className="input" value={t} onChange={x => setT(x.target.value)} /></Field><Field label="Description"><textarea className="textarea" value={d} onChange={x => setD(x.target.value)} /></Field>
    <div className="grid g3"><Field label="Evidence"><select className="select" value={e} onChange={x => setE(x.target.value as Intervention['evidence'])}><option>Strong</option><option>Moderate</option><option>Emerging</option></select></Field><Field label="Cost"><select className="select" value={c} onChange={x => setC(x.target.value as Intervention['cost'])}><option>Low</option><option>Medium</option><option>High</option></select></Field><Field label="Time"><input className="input" value={time} onChange={x => setTime(x.target.value)} /></Field></div></Modal>;
}
