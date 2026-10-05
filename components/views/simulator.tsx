'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SimConfig, PolicyProblem } from '@/lib/types';
import { getEntity, ofKind, hrefFor, gisHref, modHref, regionName } from '@/lib/registry';
import { runSim, defaultLevers, leverSummary, type LeverValues, type Scenario } from '@/lib/sim';
import { Badge, Btn, Card, CardHead, Field, Modal, Notice, PageHead, Tabs, Empty, Lifecycle, ProvBadge, DataTable } from '@/components/ui';
import { CompareLine, MultiLine } from '@/components/ui/charts';
import { saveScenario, deleteScenario, createPilotFromScenario } from '@/lib/actions';
import { useStore, useStoreVersion } from '@/lib/store';
import { NotFoundRecord } from './records';

export function presetScenarios(sim: SimConfig): Scenario[] {
  const p = getEntity<PolicyProblem>(sim.problem); if (!p) return [];
  return p.interventions.filter(i => i.leverPreset).map(i => ({ id: `PRESET-${sim.id}-${i.id}`, sim: sim.id, name: `Option: ${i.title}`, levers: { ...defaultLevers(sim), ...i.leverPreset }, created: 'preset', note: i.description }));
}
const fmtN = (v: number, d: number) => d ? v.toFixed(d) : String(Math.round(v));

export function SimulatorHome() {
  useStoreVersion(); const scs = useStore(s => s.scenarios); const sims = ofKind('simulation');
  return <><PageHead eyebrow="Evidence & Policy" title="Policy Simulator" desc="Choose a policy problem, adjust the levers and see how indicators could change over time. Save scenarios, compare them and turn the best one into a pilot." />
    <div className="grid g3">{sims.map(s => { const p = getEntity<PolicyProblem>(s.problem)!; const n = scs.filter(x => x.sim === s.id).length;
      return <Link key={s.id} href={`/portal/government/simulator/${s.id}`} className="card ecard"><div className="row between"><span className="eyebrow">{p.theme}</span>{n > 0 && <Badge tone="good">{n} saved</Badge>}</div><div className="t1">{p.title}</div><div className="tiny">{s.levers.length} levers · {s.indicators.length} indicators · {s.horizonMonths}-month horizon</div><div className="tiny" style={{ color: 'var(--ink)' }}>{p.geography}</div><div className="mt4"><span className="link">Open simulator →</span></div></Link>; })}</div>
    <Card className="mt16"><div className="h3 mb8">How the model works</div><p className="tiny" style={{ fontSize: 13 }}>Each indicator starts at a baseline taken from the problem. Every lever changes the indicator by a fixed amount per unit moved from its current setting; the change phases in over time (about 63% after the “time constant”). Coefficients are illustrative placeholders – every simulator page lists its assumptions and limitations, and the numbers should be replaced by research-derived values before real use.</p></Card>
    <Card className="mt16" pad={false}><CardHead title={`All saved scenarios (${scs.length})`} />{scs.length ? scs.map(sc => { const sim = getEntity<SimConfig>(sc.sim); return <Link key={sc.id} className="erow" href={`/portal/government/simulator/${sc.sim}#scenarios`}><div className="grow"><div className="t1">{sc.name}</div><div className="t2">{getEntity(sim?.problem ?? '')?.title} · saved {sc.created}</div></div><span className="arrow">→</span></Link>; }) : <Empty>No scenarios saved yet. Open a simulator, adjust levers and save one.</Empty>}</Card></>;
}

export function SimulatorDetail({ id }: { id: string }) {
  useStoreVersion(); const router = useRouter(); const sp = useSearchParams();
  const sim = getEntity<SimConfig>(id); const saved = useStore(s => s.scenarios);
  const [lv, setLv] = useState<LeverValues>(() => sim ? defaultLevers(sim) : {}); const [sel, setSel] = useState(sim?.indicators[0].id ?? ''); const [name, setName] = useState(''); const [justSaved, setJustSaved] = useState<string | null>(null);
  const [tab, setTab] = useState<'model' | 'scenarios'>('model'); const [pilotFor, setPilotFor] = useState<Scenario | null>(null); const [cmp, setCmp] = useState<string[]>([]);
  const presets = useMemo(() => sim ? presetScenarios(sim) : [], [sim]);
  useEffect(() => { if (!sim) return; const pr = sp.get('preset'); if (pr) { const f = presets.find(p => p.id.endsWith(`-${pr}`)); if (f) { setLv(f.levers); setName(f.name); } } if (window.location.hash === '#scenarios') setTab('scenarios'); }, [sim, sp, presets]);
  if (!sim || sim.kind !== 'simulation') return <NotFoundRecord role="government" module="simulator" />;
  const prob = getEntity<PolicyProblem>(sim.problem)!; const res = runSim(sim, lv); const mine = saved.filter(s => s.sim === id); const ind = sim.indicators.find(i => i.id === sel)!;
  const all = [...presets, ...mine]; const picked = all.filter(s => cmp.includes(s.id)); const bestFor = (iid: string) => { const i = sim.indicators.find(x => x.id === iid)!; const vals = picked.map(p => runSim(sim, p.levers).final[iid].scenario); return picked.length ? (i.better === 'lower' ? Math.min(...vals) : Math.max(...vals)) : null; };
  function save() { const sc = saveScenario(id, name || `Scenario ${mine.length + 1}`, lv); setJustSaved(sc.id); setName(''); setTab('scenarios'); }
  const setTabHash = (t: 'model' | 'scenarios') => { setTab(t); try { history.replaceState(null, '', t === 'scenarios' ? '#scenarios' : '#model'); } catch { /* ignore */ } };
  return <div>
    <Link className="link tiny" href="/portal/government/simulator">← Policy Simulator</Link>
    <PageHead eyebrow={`Simulation · ${sim.id}`} title={prob.title} desc={`${prob.geography}. Adjust the levers and compare against the baseline over ${sim.horizonMonths} months.`} actions={<><ProvBadge p="demo" /><Btn href={hrefFor('government', prob.id)}>Open policy problem</Btn><Btn href={gisHref('government', { region: prob.gisRegion, layer: prob.gisLayer })}>⌖ View on map</Btn></>} />
    <div className="mb16"><Lifecycle problemId={prob.id} current="Simulation" /></div>
    <Tabs value={tab} onChange={setTabHash} tabs={[{ id: 'model', label: 'Scenario model' }, { id: 'scenarios', label: 'Saved & preset scenarios', n: all.length }]} />
    {tab === 'model' && <div className="split wide">
      <div className="col" style={{ gap: 16 }}>
        <Card pad={false}><CardHead title="Results" sub={res.changed ? 'End of horizon vs baseline' : 'Move a lever to see a change'} right={<span className="tiny">Indicative cost: <b>₹ {res.cost} crore</b> (demo)</span>} />
          <div className="card-body"><div className="grid g3 mb12">{sim.indicators.map(i => { const f = res.final[i.id]; return <button key={i.id} onClick={() => setSel(i.id)} className="card pad-sm" style={{ textAlign: 'left', borderColor: sel === i.id ? 'var(--accent)' : undefined, boxShadow: sel === i.id ? 'inset 3px 0 0 var(--accent)' : undefined }} aria-pressed={sel === i.id}>
            <div className="tiny">{i.label}</div><div className="row" style={{ alignItems: 'baseline', gap: 6 }}><b style={{ fontSize: 22, color: 'var(--accent)' }}>{fmtN(f.scenario, i.decimals)}</b><span className="tiny">{i.unit}</span></div>
            <div className="tiny">Baseline {fmtN(f.baseline, i.decimals)} · <span className={`delta ${f.change === 0 ? 'flat' : f.improved ? 'good' : 'bad'}`}>{f.change > 0 ? '+' : ''}{fmtN(f.change, i.decimals)} ({f.pct > 0 ? '+' : ''}{f.pct}%)</span></div></button>; })}</div>
            <div className="h3">{ind.label} over time</div><div className="tiny mb8">{ind.explain}</div>
            <CompareLine months={res.months} baseline={res.series[ind.id].baseline} scenario={res.series[ind.id].scenario} unit={ind.unit} /></div></Card>
        <div className="grid g2"><Card><h3 className="h3 mb8">Assumptions</h3><ul className="list">{sim.assumptions.map((a, i) => <li key={i}>{a}</li>)}<li>Time constant: {sim.timeConstant} months.</li></ul></Card><Card><h3 className="h3 mb8">Limitations</h3><ul className="list">{sim.limitations.map((a, i) => <li key={i}>{a}</li>)}</ul></Card></div>
      </div>
      <div className="col" style={{ gap: 16 }}>
        <Card pad={false}><CardHead title="Levers" right={<><button className="btn sm" onClick={() => setLv(defaultLevers(sim))}>Reset to baseline</button></>} />
          <div className="card-body">{sim.levers.map(l => <div className="lever" key={l.id}><div className="top"><label htmlFor={`lv-${l.id}`}>{l.label}</label><span className="val">{lv[l.id]} {l.unit}</span></div><input id={`lv-${l.id}`} type="range" min={l.min} max={l.max} step={l.step} value={lv[l.id]} onChange={e => setLv({ ...lv, [l.id]: Number(e.target.value) })} /><div className="row between tiny"><span>{l.min}</span><span>baseline {l.default}</span><span>{l.max}</span></div><div className="tiny">{l.help}</div></div>)}</div></Card>
        {presets.length > 0 && <Card pad={false}><CardHead title="Start from an option" sub="Presets from the policy problem" /><div className="card-body col">{presets.map(p => <Btn key={p.id} size="sm" onClick={() => { setLv(p.levers); setName(p.name); }}>{p.name.replace('Option: ', '')}</Btn>)}</div></Card>}
        <Card><h3 className="h3 mb8">Save this scenario</h3><Field label="Scenario name"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Auto-trigger + SMS tracking" /></Field><Btn kind="primary" onClick={save} disabled={!res.changed} title={res.changed ? '' : 'Change at least one lever first'}>Save scenario</Btn>{!res.changed && <div className="tiny mt4">Change at least one lever to save a scenario.</div>}</Card>
      </div></div>}
    {tab === 'scenarios' && <div className="col" style={{ gap: 16 }}>
      {justSaved && <Notice tone="good">Scenario saved. Select it below to compare, or plan a pilot from it.</Notice>}
      <Card pad={false}><CardHead title="Scenarios" sub="Tick up to 3 to compare" />
        {all.map(s => { const r = runSim(sim, s.levers); const isPreset = s.id.startsWith('PRESET'); return <div key={s.id} className="erow" style={{ alignItems: 'center' }}>
          <input type="checkbox" aria-label={`Compare ${s.name}`} checked={cmp.includes(s.id)} disabled={!cmp.includes(s.id) && cmp.length >= 3} onChange={e => setCmp(e.target.checked ? [...cmp, s.id] : cmp.filter(x => x !== s.id))} />
          <div className="grow"><div className="t1">{s.name} {isPreset ? <Badge>preset</Badge> : <Badge tone="good">saved {s.created}</Badge>}</div><div className="t2">{leverSummary(sim, s.levers)}</div><div className="t2">{sim.indicators.map(i => `${i.label}: ${fmtN(r.final[i.id].scenario, i.decimals)} ${i.unit}`).join(' · ')}</div></div>
          <div className="row no-print"><Btn size="sm" onClick={() => { setLv(s.levers); setTabHash('model'); }}>Load</Btn><Btn size="sm" kind="primary" onClick={() => setPilotFor(s)}>Plan pilot</Btn>{!isPreset && <Btn size="sm" onClick={() => { deleteScenario(s.id); setCmp(cmp.filter(x => x !== s.id)); }}>Delete</Btn>}</div></div>; })}</Card>
      {picked.length >= 2 ? <Card pad={false}><CardHead title="Comparison" sub="Best value per indicator is highlighted" />
        <div className="table-wrap"><table className="t"><thead><tr><th>Indicator</th><th>Baseline</th>{picked.map(p => <th key={p.id}>{p.name}</th>)}</tr></thead><tbody>{sim.indicators.map(i => { const best = bestFor(i.id); return <tr key={i.id}><td>{i.label} <span className="tiny">({i.unit})</span></td><td>{fmtN(i.baseline, i.decimals)}</td>{picked.map(p => { const v = runSim(sim, p.levers).final[i.id].scenario; return <td key={p.id} style={v === best ? { background: 'var(--good-soft)', fontWeight: 700 } : undefined}>{fmtN(v, i.decimals)}</td>; })}</tr>; })}<tr><td>Indicative cost (₹ crore)</td><td>–</td>{picked.map(p => <td key={p.id}>{runSim(sim, p.levers).cost}</td>)}</tr></tbody></table></div>
        <div className="card-body"><div className="h3 mb8">{ind.label}</div><div className="chips mb8">{sim.indicators.map(i => <button key={i.id} className={`chip ${sel === i.id ? 'on' : ''}`} onClick={() => setSel(i.id)}>{i.label}</button>)}</div>
          <MultiLine months={runSim(sim, defaultLevers(sim)).months} unit={ind.unit} series={[{ name: 'Baseline', values: runSim(sim, defaultLevers(sim)).series[ind.id].baseline, color: '#8a97a0' }, ...picked.map(p => ({ name: p.name.replace('Option: ', '').slice(0, 28), values: runSim(sim, p.levers).series[ind.id].scenario }))]} /></div></Card>
        : <Notice>Tick two or three scenarios above to compare them side by side.</Notice>}
    </div>}
    {pilotFor && <PilotModal sc={pilotFor} sim={sim} prob={prob} onClose={() => setPilotFor(null)} onCreate={o => { const pid = createPilotFromScenario(pilotFor, o); router.push(`/portal/government/pilots/${pid}`); }} />}
  </div>;
}
function PilotModal({ sc, sim, prob, onClose, onCreate }: { sc: Scenario; sim: SimConfig; prob: PolicyProblem; onClose: () => void; onCreate: (o: { title: string; location: string; months: number; gisRegion: string; lead: string }) => void }) {
  const [title, setTitle] = useState(`${sc.name.replace('Option: ', '')} pilot`); const [location, setLocation] = useState(prob.geography); const [months, setMonths] = useState(9); const [lead, setLead] = useState('Your department (demo)');
  const r = runSim(sim, sc.levers);
  return <Modal title="Plan a pilot from this scenario" onClose={onClose} foot={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" onClick={() => onCreate({ title, location, months, gisRegion: prob.gisRegion, lead })} disabled={title.trim().length < 4}>Create pilot</Btn></>}>
    <Notice>Pilot KPIs and targets are created from the simulated end-of-horizon values of <b>{sc.name}</b>. You can then record real monitoring readings and evaluate.</Notice>
    <div className="mt12"><Field label="Pilot title"><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field>
      <Field label="Location"><input className="input" value={location} onChange={e => setLocation(e.target.value)} /></Field>
      <div className="grid g2"><Field label="Duration (months)"><input className="input" type="number" min={3} max={36} value={months} onChange={e => setMonths(Number(e.target.value) || 9)} /></Field><Field label="Lead agency"><input className="input" value={lead} onChange={e => setLead(e.target.value)} /></Field></div></div>
    <div className="tiny">KPIs created: {sim.indicators.map(i => `${i.label} (${i.baseline} → ${fmtN(r.final[i.id].scenario, i.decimals)} ${i.unit})`).join('; ')}. Indicative budget ₹ {r.cost} crore (demo).</div></Modal>;
}
export { DataTable, modHref, regionName };
