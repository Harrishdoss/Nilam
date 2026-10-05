'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Pilot, PolicyProblem, Report } from '@/lib/types';
import { getEntity, ofKind, hrefFor, gisHref, modHref, KIND_LABEL, entityMeta, regionName, allEntities } from '@/lib/registry';
import { NATIONAL, REGION_LAYERS, layerById, fmt } from '@/lib/geo';
import { Badge, Btn, Card, CardHead, DataTable, EntityLink, Field, KV, Notice, PageHead, Progress, Stat, Empty, ProvBadge, Section } from '@/components/ui';
import { TileMap, Legend } from '@/components/gis/TileMap';
import { addToProblem, generateBrief } from '@/lib/actions';
import { useStore, useStoreVersion } from '@/lib/store';
import { PROBLEM_STAGES, pilotProgress } from '@/components/views/problem';
import { AddToProblem, BackLink } from '@/components/views/shared';
import { tally } from '@/components/views/consultation';
import { THEMES } from '@/lib/data/datasets';
import { NotFoundRecord } from '@/components/views/records';

// ---------------------------------------------------------------- Command Centre
export function GovOverview() {
  useStoreVersion(); const router = useRouter(); const act = useStore(s => s.activity).filter(a => a.role === 'government'); const scn = useStore(s => s.scenarios);
  const [layer, setLayer] = useState('mutation');
  const problems = ofKind('problem'); const pilots = ofKind('pilot'); const running = pilots.filter(p => p.status === 'Running');
  const stageCounts = PROBLEM_STAGES.map(s => [s, problems.filter(p => p.stage === s).length] as const);
  const alerts: { tone: 'bad' | 'warn' | 'info'; text: string; href: string }[] = [];
  for (const p of running) { const elapsed = Math.max(...p.kpis.map(k => k.readings.length)); const expected = Math.round(100 * elapsed / p.durationMonths); const prog = pilotProgress(p); if (prog + 10 < expected) alerts.push({ tone: 'warn', text: `${p.title}: ${prog}% of target vs ~${expected}% of time elapsed – behind pace`, href: hrefFor('government', p.id)! }); }
  for (const p of problems) if (p.priority === 'High' && !ofKind('pilot').some(x => x.problem === p.id)) alerts.push({ tone: 'info', text: `High-priority problem “${p.title}” has no pilot yet`, href: hrefFor('government', p.id)! });
  for (const c of ofKind('consultation')) if (c.status === 'Open') alerts.push({ tone: 'info', text: `Consultation open until ${c.closes}: ${c.title}`, href: hrefFor('government', c.id)! });
  for (const o of ofKind('opportunity')) if (o.status === 'Closing soon') alerts.push({ tone: 'warn', text: `${o.title} closes ${o.deadline}`, href: hrefFor('government', o.id)! });
  const top = [...problems].sort((a, b) => ({ High: 0, Medium: 1, Low: 2 })[a.priority] - ({ High: 0, Medium: 1, Low: 2 })[b.priority]).slice(0, 5);
  const def = layerById(layer)!;
  return <>
    <PageHead eyebrow="Workspace" title="Command Centre" desc="Where the platform stands today: problems moving through the pipeline, pilots against target, and where on the map to look next." actions={<><Btn kind="primary" href={modHref('government', 'problems')}>Open policy problems</Btn><Btn href={modHref('government', 'gis')}>GIS Intelligence</Btn></>} />
    <div className="grid g4 mb16"><Stat label="Policy problems" value={problems.length} foot={`${problems.filter(p => p.priority === 'High').length} high priority`} href={modHref('government', 'problems')} /><Stat label="Pilots running" value={running.length} foot={`${pilots.filter(p => p.status === 'Completed').length} completed · ${pilots.filter(p => p.status === 'Planned').length} planned`} href={modHref('government', 'pilots')} />
      <Stat label="Saved scenarios" value={scn.length} foot="Open the simulator to add more" href={modHref('government', 'simulator')} /><Stat label="Evidence records" value={ofKind('research').length + ofKind('literature').length + ofKind('policy').length} foot="research · literature · policy" href={modHref('government', 'evidence')} /></div>
    <Section title="Policy pipeline" sub="Problems by stage – click a stage to filter the list"><div className="life">{stageCounts.map(([s, n], i) => <Link key={s} href={modHref('government', 'problems')} className={`life-step ${n ? 'has' : 'empty-s'}`} style={{ textDecoration: 'none' }}><div className="n">{i + 1}</div><div className="nm">{s}</div><div className="ct">{n} problem{n === 1 ? '' : 's'}</div></Link>)}</div></Section>
    <div className="split">
      <div className="col" style={{ gap: 16 }}>
        <Card pad={false}><CardHead title="Priority problems" right={<Btn size="sm" href={modHref('government', 'problems')}>All problems →</Btn>} /><DataTable rows={top} rowKey={p => p.id} onRow={p => router.push(hrefFor('government', p.id)!)} cols={[{ key: 't', label: 'Problem', render: p => <div><Link className="link" href={hrefFor('government', p.id)!} onClick={e => e.stopPropagation()}>{p.title}</Link><div className="tiny">{p.geography}</div></div> }, { key: 'pr', label: 'Priority', render: p => <Badge tone={p.priority === 'High' ? 'bad' : 'warn'}>{p.priority}</Badge> }, { key: 's', label: 'Stage', render: p => p.stage }]} /></Card>
        <Card pad={false}><CardHead title="Pilots against target" right={<Btn size="sm" href={modHref('government', 'pilots')}>All pilots →</Btn>} />{pilots.filter(p => p.status !== 'Planned').slice(0, 4).map(p => <Link key={p.id} href={hrefFor('government', p.id)!} className="erow"><div className="grow"><div className="t1">{p.title}</div><div className="t2">{p.location} · {p.status}</div><div className="mt4" style={{ maxWidth: 360 }}><Progress value={pilotProgress(p)} /></div></div><b>{pilotProgress(p)}%</b></Link>)}</Card>
        <Card pad={false}><CardHead title="Recent activity" sub="Your actions in this browser" />{act.length ? act.slice(0, 6).map(a => <Link key={a.id} href={a.href ?? '#'} className="erow"><div className="grow"><div className="t1" style={{ fontWeight: 500 }}>{a.text}</div><div className="t2">{new Date(a.t).toLocaleString()}</div></div><span className="arrow">→</span></Link>) : <Empty>No activity yet – open a problem, simulate a scenario or plan a pilot and it will appear here.</Empty>}</Card>
      </div>
      <div className="col" style={{ gap: 16 }}>
        <Card pad={false}><CardHead title="Where to look" sub="Click a state to open it in GIS" right={<select className="select" style={{ width: 'auto' }} aria-label="Map layer" value={layer} onChange={e => setLayer(e.target.value)}>{REGION_LAYERS.map(l => <option key={l.id} value={l.id}>{l.short}</option>)}</select>} />
          <div className="card-body"><TileMap scope="IN" layer={layer} compact onSelect={r => router.push(gisHref('government', { region: r, layer }))} /><div className="mt8"><Legend layer={layer} /></div><div className="tiny mt4">All-India average: <b>{fmt(layer, NATIONAL.values[layer])}</b> · {def.what}</div></div></Card>
        <Card pad={false}><CardHead title={`Alerts (${alerts.length})`} />{alerts.length ? alerts.slice(0, 6).map((a, i) => <Link key={i} href={a.href} className="erow"><Badge tone={a.tone}>{a.tone === 'warn' ? 'Attention' : 'Info'}</Badge><div className="grow t1" style={{ fontWeight: 500, fontSize: 13 }}>{a.text}</div></Link>) : <Empty>No alerts.</Empty>}</Card>
        <Card><div className="h3 mb8">Programme baselines <Badge tone="official">reference</Badge></div><KV items={[['RoR villages digitised', '6.25 lakh'], ['Cadastral maps digitised', '2.52 crore'], ['ULPIN / Bhu-Aadhaar generated', '40.85 crore'], ['SROs computerised', '5,611']]} /><p className="tiny mt8">Reference figures from programme dashboards as cited in the project brief – verify against the official DoLR dashboard before external use. <Link className="link" href={modHref('government', 'programmes')}>Programme Monitor →</Link></p></Card>
      </div></div></>;
}

// ---------------------------------------------------------------- Evidence Explorer
type EvKind = 'research' | 'literature' | 'policy' | 'dataset' | 'case' | 'programme';
const EV_KINDS: [EvKind | '', string][] = [['', 'All'], ['research', 'Research'], ['literature', 'Literature'], ['policy', 'Policies'], ['dataset', 'Datasets'], ['case', 'Case studies']];
export function EvidenceExplorer() {
  useStoreVersion(); const sp = useSearchParams(); const pid = sp.get('problem'); const prob = pid ? getEntity<PolicyProblem>(pid) : undefined;
  const [kind, setKind] = useState<EvKind | ''>(''); const [q, setQ] = useState(''); const [theme, setTheme] = useState(''); const [state, setState] = useState(''); const [strength, setStrength] = useState('');
  const pool = allEntities().filter(e => ['research', 'literature', 'policy', 'dataset', 'case'].includes(e.kind)) as (import('@/lib/types').Entity)[];
  const rows = pool.filter(e => { const x = e as unknown as { themes?: string[]; theme?: string; regions?: string[]; evidenceStrength?: string; summary?: string; abstract?: string; problem?: string };
    const themes = x.themes ?? (x.theme ? [x.theme] : []);
    return (!kind || e.kind === kind) && (!q || (e.title + (x.summary ?? '') + (x.abstract ?? '')).toLowerCase().includes(q.toLowerCase())) && (!theme || themes.includes(theme)) && (!state || (x.regions ?? []).some(r => r === state || r === 'IN')) && (!strength || x.evidenceStrength === strength); });
  const inProblem = (id: string) => !!prob && [...prob.research, ...prob.literature, ...prob.policies, ...prob.datasets, ...prob.cases].includes(id);
  return <><PageHead eyebrow="Evidence & Policy" title="Evidence Explorer" desc="Search everything the platform knows: research, literature, policies, datasets and case studies. Add useful items to a policy problem’s evidence base." />
    {prob && <div className="notice mb12"><div className="row between"><span>Adding evidence to <b>{prob.id} · {prob.title}</b></span><Btn size="sm" href={`/portal/government/problems/${prob.id}#evidence`}>Back to problem →</Btn></div></div>}
    <div className="chips mb12">{EV_KINDS.map(([k, l]) => <button key={k || 'all'} className={`chip ${kind === k ? 'on' : ''}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{l} · {k ? pool.filter(e => e.kind === k).length : pool.length}</button>)}</div>
    <div className="filters" role="search"><input type="search" aria-label="Search evidence" placeholder="Search evidence…" value={q} onChange={e => setQ(e.target.value)} /><select aria-label="Theme" value={theme} onChange={e => setTheme(e.target.value)}><option value="">All themes</option>{THEMES.map(t => <option key={t}>{t}</option>)}</select>
      <select aria-label="State" value={state} onChange={e => setState(e.target.value)}><option value="">Any geography</option>{['TN', 'MH', 'UP', 'KL', 'GJ', 'OD', 'BR'].map(c => <option key={c} value={c}>{regionName(c)}</option>)}</select><select aria-label="Evidence strength" value={strength} onChange={e => setStrength(e.target.value)}><option value="">Any strength</option><option>Strong</option><option>Moderate</option><option>Emerging</option></select>
      {(q || theme || state || strength || kind) && <Btn size="sm" onClick={() => { setQ(''); setTheme(''); setState(''); setStrength(''); setKind(''); }}>Clear</Btn>}<span className="tiny">{rows.length} results</span></div>
    <Card pad={false}>{rows.length === 0 ? <Empty>No evidence matches. Clear the filters.</Empty> : rows.map(e => { const href = hrefFor('government', e.id); const r = e as unknown as { evidenceStrength?: string };
      return <div key={e.id} className="erow" style={{ alignItems: 'center' }}><div className="grow"><div className="kind">{KIND_LABEL[e.kind]} · {e.id}</div><div className="t1">{href ? <Link className="link" href={href}>{e.title}</Link> : e.title}</div><div className="t2">{entityMeta(e)}</div></div>
        {r.evidenceStrength && <Badge tone={r.evidenceStrength === 'Strong' ? 'good' : r.evidenceStrength === 'Moderate' ? 'info' : 'warn'}>{r.evidenceStrength}</Badge>}{e.provenance === 'demo' && <Badge tone="demo">DEMO</Badge>}
        <div className="row no-print">{href && <Btn size="sm" href={href}>Open</Btn>}{prob ? <Btn size="sm" kind="primary" disabled={inProblem(e.id)} onClick={() => addToProblem(prob.id, e.id)}>{inProblem(e.id) ? '✓ Added' : '+ Add'}</Btn> : <AddToProblem id={e.id} />}</div></div>; })}</Card></>;
}

// ---------------------------------------------------------------- Programme Monitor
export function ProgrammeMonitor() {
  const progs = ofKind('programme');
  return <><PageHead eyebrow="Implementation" title="Programme Monitor" desc="Track the national land-records programmes. Open a programme to see implementation by state, then jump to the map." />
    <div className="grid g3">{progs.map(p => <Link key={p.id} href={hrefFor('government', p.id)!} className="card ecard"><div className="row between"><span className="eyebrow">{p.agency}</span><ProvBadge p={p.provenance} /></div><div className="t1">{p.title}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{p.summary}</p>{p.headline.slice(0, 2).map(h => <div key={h.label} className="row between tiny"><span>{h.label}</span><b>{h.value}</b></div>)}<div className="mt4"><span className="link">Open monitor →</span></div></Link>)}</div>
    <Notice><b>About these figures.</b> Headline numbers are reference figures as cited in the project brief and should be verified against the official dashboard. State-level implementation values on the next page are demo indicators from the GIS layers.</Notice></>;
}

// ---------------------------------------------------------------- Reports & Briefs
export function ReportsModule() {
  useStoreVersion(); const router = useRouter(); const resp = useStore(s => s.responses);
  const reports = ofKind('report'); const problems = ofKind('problem'); const [pid, setPid] = useState(problems[0]?.id ?? '');
  const cons = ofKind('consultation');
  return <><PageHead eyebrow="Knowledge" title="Reports & Briefs" desc="Generate a printable evidence brief for any policy problem – it assembles the baseline, evidence, options, simulation results, pilots and case studies in one document." />
    <Card className="mb16"><div className="h3 mb8">Generate a new brief</div><div className="row"><select className="select" style={{ maxWidth: 480 }} aria-label="Policy problem" value={pid} onChange={e => setPid(e.target.value)}>{problems.map(p => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select><Btn kind="primary" onClick={() => { const id = generateBrief(pid); if (id) router.push(`/portal/government/reports/${id}`); }}>Generate brief</Btn></div><p className="tiny mt8">Includes any scenarios you saved in the simulator for that problem.</p></Card>
    <Section title={`Evidence briefs (${reports.length})`}><Card pad={false}>{reports.map(r => <Link key={r.id} href={`/portal/government/reports/${r.id}`} className="erow"><div className="grow"><div className="kind">Evidence brief · {r.id}</div><div className="t1">{r.title}</div><div className="t2">{r.created} · {r.author}</div></div>{(r as Report).userCreated && <Badge tone="good">New</Badge>}<span className="arrow">→</span></Link>)}</Card></Section>
    <Section title="Consultation outcomes" sub="Public responses to draft proposals"><div className="grid g3">{cons.map(c => { const t = tally(c, resp[c.id]?.answers); return <Link key={c.id} href={`/portal/government/reports/${c.id}`} className="card ecard"><Badge tone={c.status === 'Open' ? 'good' : ''}>{c.status}</Badge><div className="t1">{c.title}</div><div className="tiny">{t[0].n} responses · {Math.round(100 * t[0].s.agree / t[0].n)}% agree on first statement</div><span className="link">View results →</span></Link>; })}</div></Section></>;
}
export function ReportDetail({ id }: { id: string }) {
  useStoreVersion(); const router = useRouter(); const r = getEntity<Report>(id); if (!r || r.kind !== 'report') return <NotFoundRecord role="government" module="reports" />;
  const p = getEntity<PolicyProblem>(r.problem);
  return <div><BackLink role="government" module="reports" label="Reports & Briefs" />
    <PageHead eyebrow={`Evidence brief · ${r.id}`} title={r.title} desc={`Created ${r.created} · ${r.author}`} actions={<><Btn kind="primary" onClick={() => window.print()}>Print / Save as PDF</Btn>{p && <Btn onClick={() => { const nid = generateBrief(p.id); if (nid) router.push(`/portal/government/reports/${nid}`); }}>Regenerate with latest data</Btn>}{p && <Btn href={hrefFor('government', p.id)}>Open problem</Btn>}</>} />
    <Notice tone="warn"><b>Demo brief.</b> Generated from prototype records. Replace demo values with official data before circulating.</Notice>
    <div className="col mt16" style={{ gap: 14 }}>{r.sections.map(s => <Card key={s.h}><h2 className="h2 mb8">{s.h}</h2><p>{s.p}</p>{s.bullets && s.bullets.length > 0 && <ul className="list mt8">{s.bullets.map((b, i) => <li key={i} style={b.startsWith('  •') ? { listStyle: 'circle', marginLeft: 18 } : undefined}>{b.replace(/^ {2}• /, '')}</li>)}</ul>}</Card>)}</div></div>;
}
export { EntityLink, Field, KV, Stat };
