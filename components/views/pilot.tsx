'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Pilot } from '@/lib/types';
import { getEntity, ofKind, hrefFor, gisHref, modHref, regionName } from '@/lib/registry';
import { Badge, Btn, Card, CardHead, DataTable, EntityList, Field, KV, Lifecycle, Notice, PageHead, Progress, Tabs, useHashTab, Bullets, Empty, ProvBadge, EntityLink } from '@/components/ui';
import { KpiLine } from '@/components/ui/charts';
import { recordReading, concludePilot, publishCaseFromPilot, generateBrief } from '@/lib/actions';
import { useStoreVersion } from '@/lib/store';
import { pilotProgress } from './problem';
import { NotFoundRecord } from './records';

const REC_TONE = { 'Scale up': 'good', 'Refine and re-pilot': 'warn', Stop: 'bad', Pending: '' } as const;
export function PilotsList() {
  useStoreVersion(); const router = useRouter(); const [status, setStatus] = useState(''); const all = ofKind('pilot'); const rows = all.filter(p => !status || p.status === status);
  return <><PageHead eyebrow="Implementation" title="Pilot & Evaluation" desc="Pilots test an intervention in a small area before scaling. Open a pilot to record monitoring readings, evaluate results and publish a case study." actions={<Btn kind="primary" href={modHref('government', 'simulator')}>+ Plan a pilot from a simulation</Btn>} />
    <div className="chips mb12">{['', 'Planned', 'Running', 'Completed'].map(s => <button key={s || 'all'} className={`chip ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)} aria-pressed={status === s}>{s || 'All'} · {s ? all.filter(p => p.status === s).length : all.length}</button>)}</div>
    <Card pad={false}><DataTable rows={rows} rowKey={p => p.id} onRow={p => router.push(hrefFor('government', p.id)!)} cols={[
      { key: 't', label: 'Pilot', sort: p => p.title, render: p => <div><Link className="link" href={hrefFor('government', p.id)!} onClick={e => e.stopPropagation()}>{p.title}</Link><div className="tiny">{p.location}</div></div> },
      { key: 'pr', label: 'Policy problem', render: p => <span className="tiny">{getEntity(p.problem)?.title}</span> }, { key: 's', label: 'Status', sort: p => p.status, render: p => <Badge tone={p.status === 'Completed' ? 'good' : p.status === 'Running' ? 'info' : ''}>{p.status}</Badge> },
      { key: 'p', label: 'Progress to target', sort: p => pilotProgress(p), render: p => <div style={{ minWidth: 120 }}><Progress value={pilotProgress(p)} /><div className="tiny">{pilotProgress(p)}%</div></div> }, { key: 'r', label: 'Recommendation', render: p => <Badge tone={REC_TONE[p.evaluation.recommendation]}>{p.evaluation.recommendation}</Badge> }]} /></Card></>;
}

export function PilotDetail({ id }: { id: string }) {
  useStoreVersion(); const router = useRouter(); const p = getEntity<Pilot>(id);
  const TABS = ['overview', 'evaluation'] as const; const [tab, setTab] = useHashTab<typeof TABS[number]>([...TABS], 'overview');
  if (!p || p.kind !== 'pilot') return <NotFoundRecord role="government" module="pilots" />;
  const prob = getEntity(p.problem); const prog = pilotProgress(p); const months = Math.max(0, ...p.kpis.map(k => k.readings.length));
  const done = p.status === 'Completed';
  return <div>
    <Link className="link tiny" href="/portal/government/pilots">← Pilot & Evaluation</Link>
    <PageHead eyebrow={`Pilot · ${p.id}`} title={p.title} desc={p.location} actions={<><Badge tone={done ? 'good' : p.status === 'Running' ? 'info' : ''}>{p.status}</Badge><Badge tone={REC_TONE[p.evaluation.recommendation]}>{p.evaluation.recommendation}</Badge><ProvBadge p={p.provenance} /></>} />
    <div className="mb16"><Lifecycle problemId={p.problem} current={done ? 'Evaluation' : 'Pilot'} /></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Design & overview' }, { id: 'evaluation', label: 'Monitoring & evaluation', n: months }]} />
    {tab === 'overview' && <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><KV items={[['Intervention', p.intervention], ['Location', p.location], ['Start', p.start], ['Duration', `${p.durationMonths} months`], ['Budget', `₹ ${p.budgetCr} crore (demo)`], ['Lead', p.lead], ['Policy problem', <EntityLink key="pp" id={p.problem} kind="inline" />], ['Simulation', p.simulation ? <span key="s"><EntityLink id={p.simulation} kind="inline">{p.scenarioName ?? 'Scenario'}</EntityLink></span> : '–']]} /></Card>
      <div className="grid g2"><Card><h2 className="h2 mb8">Objectives</h2><Bullets items={p.objectives} /></Card><Card><h2 className="h2 mb8">Design</h2><p style={{ fontSize: 13 }}>{p.design}</p><h3 className="h3 mt12 mb8">Comparison</h3><p style={{ fontSize: 13 }}>{p.comparison}</p></Card></div>
      <Card pad={false}><CardHead title="KPIs (baseline → target)" /><div className="table-wrap"><table className="t"><thead><tr><th>KPI</th><th>Baseline</th><th>Target</th><th>Latest</th></tr></thead><tbody>{p.kpis.map(k => <tr key={k.id}><td>{k.label}</td><td>{k.baseline} {k.unit}</td><td>{k.target} {k.unit}</td><td>{k.readings.length ? `${k.readings[k.readings.length - 1]} ${k.unit}` : '–'}</td></tr>)}</tbody></table></div></Card></div>
      <div className="col" style={{ gap: 16 }}><Card><div className="eyebrow">Progress to target</div><div style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent)' }}>{prog}%</div><Progress value={prog} lg /><div className="tiny mt4">Average across KPIs · {months} of {p.durationMonths} months recorded</div></Card>
        <Card><div className="h3 mb8">Next steps</div><div className="col"><Btn kind="primary" onClick={() => setTab('evaluation')}>{done ? 'View evaluation →' : 'Record readings & evaluate →'}</Btn><Btn href={gisHref('government', { region: p.gisRegion, layer: (getEntity(p.problem) as { gisLayer?: string } | undefined)?.gisLayer })}>⌖ View location in GIS</Btn>{prob && <Btn href={hrefFor('government', p.problem)}>Open policy problem</Btn>}</div></Card>
        <Card pad={false}><CardHead title="Linked records" /><EntityList ids={[...p.datasets, ...p.research, ...(p.case ? [p.case] : [])]} /></Card></div></div>}
    {tab === 'evaluation' && <Evaluation p={p} onCase={() => { const cid = publishCaseFromPilot(p.id); if (cid) router.push(`/portal/government/cases/${cid}`); }} onBrief={() => { const r = generateBrief(p.problem); if (r) router.push(`/portal/government/reports/${r}`); }} />}
  </div>;
}

function Evaluation({ p, onCase, onBrief }: { p: Pilot; onCase: () => void; onBrief: () => void }) {
  const [vals, setVals] = useState<Record<string, string>>({}); const [saved, setSaved] = useState(false);
  const done = p.status === 'Completed'; const months = Math.max(0, ...p.kpis.map(k => k.readings.length));
  const attain = p.kpis.map(k => { const last = k.readings.length ? k.readings[k.readings.length - 1] : k.baseline; const span = k.target - k.baseline; return span === 0 ? 100 : Math.round(((last - k.baseline) / span) * 100); });
  const avg = attain.length ? Math.round(attain.reduce((a, b) => a + b, 0) / attain.length) : 0; const suggested = avg >= 95 ? 'Target met' : avg >= 55 ? 'Partly met' : 'Not met';
  const [verdict, setVerdict] = useState(''); const [summary, setSummary] = useState(''); const [lessons, setLessons] = useState(''); const [rec, setRec] = useState<Pilot['evaluation']['recommendation']>('Refine and re-pilot'); const [concluding, setConcluding] = useState(false);
  const canSave = Object.values(vals).some(v => v !== '' && !Number.isNaN(Number(v)));
  return <div className="col" style={{ gap: 16 }}>
    {p.status === 'Planned' && <Notice>This pilot has not started. Recording the first monitoring reading will mark it as <b>Running</b>.</Notice>}
    <div className="grid g2">{p.kpis.map((k, i) => { const last = k.readings.length ? k.readings[k.readings.length - 1] : k.baseline; return <Card key={k.id} pad={false}><CardHead title={k.label} sub={`Baseline ${k.baseline} → target ${k.target} ${k.unit} (${k.better} is better)`} right={<Badge tone={attain[i] >= 95 ? 'good' : attain[i] >= 50 ? 'info' : 'warn'}>{Math.max(0, attain[i])}% of target</Badge>} /><div className="card-body"><div className="row between mb8"><div><div className="tiny">Latest</div><b style={{ fontSize: 22, color: 'var(--accent)' }}>{last}</b> <span className="tiny">{k.unit}</span></div><div style={{ minWidth: 140, flex: 1, maxWidth: 220 }}><Progress value={Math.max(0, attain[i])} /></div></div>{k.readings.length ? <KpiLine baseline={k.baseline} target={k.target} readings={k.readings} unit={k.unit} /> : <Empty>No readings yet.</Empty>}</div></Card>; })}</div>
    {!done && <Card><h2 className="h2 mb8">Record monitoring reading</h2><p className="tiny mb12">Enter this month’s value for each KPI (month {months + 1}). Leave blank to skip.</p>
      <div className="grid g3">{p.kpis.map(k => <Field key={k.id} label={`${k.label} (${k.unit})`}><input className="input" type="number" step="any" value={vals[k.id] ?? ''} onChange={e => { setVals({ ...vals, [k.id]: e.target.value }); setSaved(false); }} placeholder={String(k.readings.length ? k.readings[k.readings.length - 1] : k.baseline)} /></Field>)}</div>
      <div className="row"><Btn kind="primary" disabled={!canSave} onClick={() => { recordReading(p.id, Object.fromEntries(Object.entries(vals).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]))); setVals({}); setSaved(true); }}>Save reading</Btn>{saved && <span className="tiny" style={{ color: 'var(--good)' }}>Saved – charts above updated.</span>}</div></Card>}
    <Card><div className="row between"><h2 className="h2">Evaluation</h2><Badge tone={REC_TONE[p.evaluation.recommendation]}>{p.evaluation.recommendation}</Badge></div>
      {done ? <><p className="mt8"><b>Verdict:</b> {p.evaluation.verdict}</p><p className="mt4">{p.evaluation.summary}</p><h3 className="h3 mt12 mb8">Lessons</h3><Bullets items={p.evaluation.lessons} />
        <div className="row mt16 no-print">{p.case ? <Btn kind="primary" href={hrefFor('government', p.case)}>Open case study →</Btn> : <Btn kind="primary" onClick={onCase}>Publish as case study</Btn>}<Btn onClick={onBrief}>Generate evidence brief</Btn><Btn href={hrefFor('government', p.problem)}>Back to policy problem</Btn></div></>
        : <>
          <p className="mt8" style={{ fontSize: 13 }}>{months === 0 ? 'Record at least one reading before concluding.' : `Based on ${months} reading(s), average attainment is ${avg}% of target – suggested verdict: ${suggested}.`}</p>
          {!concluding ? <div className="mt12"><Btn kind="primary" disabled={months === 0} onClick={() => { setConcluding(true); setVerdict(suggested); setSummary(`After ${months} of ${p.durationMonths} months, ${p.kpis.map((k, i) => `${k.label} reached ${k.readings.length ? k.readings[k.readings.length - 1] : k.baseline} ${k.unit} (${Math.max(0, attain[i])}% of target)`).join('; ')}.`); }}>Conclude pilot & record evaluation</Btn></div> :
            <div className="mt12"><div className="grid g2"><Field label="Verdict"><select className="select" value={verdict} onChange={e => setVerdict(e.target.value)}><option>Target met</option><option>Partly met</option><option>Not met</option></select></Field><Field label="Recommendation"><select className="select" value={rec} onChange={e => setRec(e.target.value as Pilot['evaluation']['recommendation'])}><option>Scale up</option><option>Refine and re-pilot</option><option>Stop</option></select></Field></div>
              <Field label="Summary"><textarea className="textarea" value={summary} onChange={e => setSummary(e.target.value)} /></Field><Field label="Lessons (one per line)"><textarea className="textarea" value={lessons} onChange={e => setLessons(e.target.value)} placeholder={'What worked\nWhat did not\nWhat to change'} /></Field>
              <div className="row"><Btn kind="primary" disabled={summary.trim().length < 10} onClick={() => concludePilot(p.id, { verdict, summary, lessons: lessons.split('\n').map(x => x.trim()).filter(Boolean), recommendation: rec })}>Save evaluation</Btn><Btn onClick={() => setConcluding(false)}>Cancel</Btn></div></div>}</>}</Card>
  </div>;
}
export { modHref, regionName };
