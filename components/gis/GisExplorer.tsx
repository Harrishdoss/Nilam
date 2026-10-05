'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Role, PolicyProblem } from '@/lib/types';
import { LAYERS, REGION_LAYERS, PARCEL_LAYERS, layerById, regionById, benchmarkOf, rankOf, fmt, judge, peersOf, hasDistricts, districtsOf, searchRegions, parcels, parcelStats, parcelsCsv, regionsCsv, LAND_USE_COLORS, FLOOD_COLORS, FLOOD_LABEL, PARCEL_VILLAGE, type Region, type Parcel, NATIONAL } from '@/lib/geo';
import { ofKind, getEntity, related, modHref, hrefFor } from '@/lib/registry';
import { LAYER_SIM, LAYER_THEME, LAYER_ARTICLE } from '@/lib/links';
import { Badge, Btn, Card, CardHead, EntityList, Field, Modal, Notice, DataTable, download, csvCell } from '@/components/ui';
import { ScatterPlot } from '@/components/ui/charts';
import { TileMap, Legend, buildTiles } from './TileMap';
import { logActivity, uid, today, update, useStore, useStoreVersion } from '@/lib/store';
import { THEMES } from '@/lib/data/datasets';

const DEFAULT_LAYER: Record<Role, string> = { government: 'mutation', researcher: 'ror', public: 'ror' };
const pearson = (xs: number[], ys: number[]) => { const n = xs.length; const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; } return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0; };

export default function GisExplorer({ role }: { role: Role }) {
  const sp = useSearchParams(); const router = useRouter(); const path = usePathname(); useStoreVersion();
  const simple = role === 'public';
  const regionParam = sp.get('region') && regionById(sp.get('region')!) ? sp.get('region')! : 'IN';
  const layerParam = sp.get('layer') && layerById(sp.get('layer')!)?.level === 'region' ? sp.get('layer')! : DEFAULT_LAYER[role];
  const view = sp.get('view') === 'parcels' ? 'parcels' : 'regions';
  const pl = sp.get('pl') && layerById(sp.get('pl')!)?.level === 'parcel' ? sp.get('pl')! : 'p_mutation';
  const parcelId = sp.get('parcel');
  const sel = regionById(regionParam)!;
  const scope = view === 'parcels' ? 'TN-CGL' : sel.level === 'district' ? sel.parent! : sel.level === 'state' && sp.get('drill') === '1' && hasDistricts(sel.id) ? sel.id : 'IN';
  const scopeRegion = scope === 'IN' ? NATIONAL : regionById(scope)!;
  const layer = layerParam; const def = layerById(layer)!;

  function nav(upd: Record<string, string | null>) {
    const q = new URLSearchParams(sp.toString()); for (const [k, v] of Object.entries(upd)) { if (v === null) q.delete(k); else q.set(k, v); }
    router.replace(`${path}?${q.toString()}`, { scroll: false });
  }
  const [query, setQuery] = useState(''); const [showSug, setShowSug] = useState(false);
  const sugg = useMemo(() => { const s = searchRegions(query); const village = 'kolathur'.includes(query.trim().toLowerCase()) && query.trim().length > 2 ? [{ id: 'V', name: PARCEL_VILLAGE.name } as unknown as Region] : []; return [...village, ...s]; }, [query]);
  function pick(r: Region) {
    setQuery(''); setShowSug(false);
    if (r.id === 'V') { nav({ region: 'TN-CGL', view: 'parcels', drill: null, parcel: null }); return; }
    nav({ region: r.id, view: null, parcel: null, drill: r.level === 'district' ? null : (hasDistricts(r.id) ? '1' : null) });
  }
  const layerList = (simple ? REGION_LAYERS.filter(l => l.simple) : REGION_LAYERS);
  const groups = [...new Set(layerList.map(l => l.group))];

  return <div>
    <div className="gis" aria-label="Land map explorer">
      {/* ---------------- left: geography + layers ---------------- */}
      <div className="gis-left">
        <div className="h3 mb8">1 · Pick an area</div>
        <div style={{ position: 'relative' }} className="mb8">
          <input className="input" aria-label="Search a state, district or place" placeholder="Search state, district or “Kolathur”…" value={query} onChange={e => { setQuery(e.target.value); setShowSug(true); }} onFocus={() => setShowSug(true)} onKeyDown={e => { if (e.key === 'Enter' && sugg[0]) pick(sugg[0]); if (e.key === 'Escape') setShowSug(false); }} />
          {showSug && query.trim() && <div className="search-pop" role="listbox">{sugg.length === 0 ? <div className="tiny" style={{ padding: 10 }}>No matching area. Try “Tamil Nadu”, “Pune” or “Kolathur”.</div> : sugg.map(r => <button key={r.id} role="option" aria-selected={false} onClick={() => pick(r)}><span>{r.name}</span><span className="tiny">{r.id === 'V' ? 'demo village (parcels)' : r.level === 'district' ? `district · ${regionById(r.parent!)?.name}` : r.ut ? 'union territory' : 'state'}</span></button>)}</div>}
        </div>
        <div className="field"><label htmlFor="g-state">State / UT</label>
          <select id="g-state" className="select" value={sel.level === 'state' ? sel.id : sel.level === 'district' ? sel.parent! : ''} onChange={e => e.target.value ? nav({ region: e.target.value, view: null, parcel: null, drill: hasDistricts(e.target.value) ? '1' : null }) : nav({ region: 'IN', view: null, parcel: null, drill: null })}>
            <option value="">All India</option>{NATIONAL && REGION_STATES.map(s => <option key={s.id} value={s.id}>{s.name}{hasDistricts(s.id) ? ' (districts)' : ''}</option>)}</select></div>
        {(sel.level === 'state' && hasDistricts(sel.id)) || sel.level === 'district' ? <div className="field"><label htmlFor="g-dist">District</label>
          <select id="g-dist" className="select" value={sel.level === 'district' ? sel.id : ''} onChange={e => nav({ region: e.target.value || (sel.level === 'district' ? sel.parent! : sel.id), view: null, parcel: null, drill: e.target.value ? null : '1' })}>
            <option value="">All districts</option>{districtsOf(sel.level === 'district' ? sel.parent! : sel.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div> : <div className="tiny mb12">District tiles are available for 6 focus states in this demo: Tamil Nadu, Maharashtra, Uttar Pradesh, Kerala, Gujarat, Odisha.</div>}

        <div className="h3 mb8 mt16">2 · Pick what to show</div>
        {view === 'parcels' ? <>
          {PARCEL_LAYERS.filter(l => !simple || l.simple).map(l => <button key={l.id} className={`layer-btn ${pl === l.id ? 'on' : ''}`} aria-pressed={pl === l.id} onClick={() => nav({ pl: l.id })}><div className="n">{l.short}</div><div className="d">{l.what}</div></button>)}
        </> : groups.map(g => <div key={g}><div className="tiny" style={{ fontWeight: 700, margin: '8px 0 4px' }}>{g.toUpperCase()}</div>{layerList.filter(l => l.group === g).map(l => <button key={l.id} className={`layer-btn ${layer === l.id ? 'on' : ''}`} aria-pressed={layer === l.id} onClick={() => nav({ layer: l.id })}><div className="n">{simple ? l.short : l.label}</div><div className="d">{l.what}</div></button>)}</div>)}
        <div className="notice warn mt12" style={{ fontSize: 12 }}><b>Demo data.</b> Values are synthetic; tiles are a schematic cartogram, not official boundaries.</div>
      </div>

      {/* ---------------- centre: map ---------------- */}
      <div className="gis-mid">
        <div className="gis-bar">
          <div className="row" style={{ gap: 6 }} aria-label="Map level">
            <button className={`chip ${view === 'regions' && scope === 'IN' ? 'on' : ''}`} onClick={() => nav({ view: null, drill: null, parcel: null, region: view === 'parcels' ? 'IN' : sel.level === 'country' ? 'IN' : sel.level === 'district' ? sel.parent! : sel.id })}>All India</button>
            {scope !== 'IN' && view !== 'parcels' && <button className="chip on" onClick={() => undefined}>{scopeRegion.name} districts</button>}
            {view === 'parcels' && <><button className="chip" onClick={() => nav({ view: null, parcel: null, region: 'TN-CGL', drill: null })}>← Chengalpattu district</button><button className="chip on">Demo village parcels</button></>}
          </div>
          <div className="grow" />
          <span className="tiny">{view === 'parcels' ? pl && layerById(pl)?.short : def.short}</span>
        </div>
        <Insight layer={layer} scope={scope} sel={sel} view={view} pl={pl} />
        <div className="gis-map" style={{ position: 'relative' }}>
          <span className="demo-tag">{view === 'parcels' ? 'SYNTHETIC PARCELS · NOT A CADASTRAL BOUNDARY' : 'DEMO DATA · SCHEMATIC TILE MAP'}</span>
          {view === 'parcels'
            ? <ParcelMap layer={pl} selected={parcelId} onSelect={id => nav({ parcel: id })} />
            : <TileMap scope={scope} layer={layer} selected={sel.id === 'IN' ? null : sel.id} onSelect={id => nav({ region: id, parcel: null, drill: scope !== 'IN' ? null : (sel.id === id && hasDistricts(id) ? '1' : null) })} onOpen={id => hasDistricts(id) && scope === 'IN' ? nav({ region: id, drill: '1' }) : undefined} />}
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)' }}>
          {view === 'parcels' ? <ParcelLegend layer={pl} /> : <Legend layer={layer} />}
          <div className="tiny mt4">{view === 'parcels' ? 'Each polygon is a generated demo parcel. Click one to see its details.' : scope === 'IN' ? 'Each tile is one State / Union Territory (not to scale). Click a tile for details; click again (or use the button) to drill into districts where available.' : 'Each tile is one district (schematic). Click a district for details.'}</div>
        </div>
      </div>

      {/* ---------------- right: selected area ---------------- */}
      <div className="gis-right">
        {view === 'parcels' ? <ParcelPanel role={role} layer={pl} parcelId={parcelId} /> : <RegionPanel role={role} sel={sel} layer={layer} scope={scope} nav={nav} />}
      </div>
    </div>
    {view === 'regions' && !simple && <Analysis role={role} layer={layer} scope={scope} sel={sel} />}
    {view === 'regions' && <HotspotTable role={role} layer={layer} scope={scope} nav={nav} sel={sel} />}
  </div>;
}
const REGION_STATES = peersOf(regionById('TN')!);

// ------------------------------------------------------------------ insight bar
function Insight({ layer, scope, sel, view, pl }: { layer: string; scope: string; sel: Region; view: string; pl: string }) {
  if (view === 'parcels') {
    const s = parcelStats();
    const m: Record<string, string> = {
      p_mutation: `${s.pending} of ${s.total} private parcels (${s.pendingPct}%) are waiting for a record update – on average ${s.avgPendingDays} days. ${s.pendingAndFlood} of them also sit in moderate-to-high flood exposure.`,
      p_flood: `${s.highFlood} parcels (${Math.round(100 * s.highFlood / s.total)}%) have moderate-to-high modelled flood exposure, clustered around the village tank.`,
      p_dispute: `${s.disputes} parcels carry a recorded dispute; most are also among those with pending record updates.`,
      p_landuse: `${s.farmland} of ${s.total} parcels are still farmland; homes and shops cluster along the eastern road.`,
    };
    return <div className="gis-insight"><b>What this shows:</b> {m[pl]}</div>;
  }
  const def = layerById(layer)!; const { regions } = buildTiles(scope, layer);
  const bad = def.polarity === 'bad-high'; const sorted = [...regions].sort((a, b) => b.values[layer] - a.values[layer]);
  const worst = bad ? sorted.slice(0, 3) : sorted.slice(-3).reverse(); const best = bad ? sorted.slice(-1)[0] : sorted[0];
  const bench = scope === 'IN' ? NATIONAL : regionById(scope)!;
  const sc = scope === 'IN' ? 'states' : 'districts';
  let selTxt = '';
  if (sel.id !== 'IN') { const b = benchmarkOf(sel); const j = judge(layer, sel.values[layer], b.values[layer]); selTxt = ` ${sel.name} is ${fmt(layer, sel.values[layer])} – ${j === 'similar' ? 'close to' : j === 'worse' ? 'worse than' : 'better than'} ${b.id === 'IN' ? 'the all-India average' : b.name} (${fmt(layer, b.values[layer])}).`; }
  void bench;
  return <div className="gis-insight"><b>What this shows:</b> {bad ? 'Most concerning' : 'Furthest behind'} among {sc}: {worst.map(r => `${r.name} (${fmt(layer, r.values[layer])})`).join(', ')}. {bad ? 'Best' : 'Furthest ahead'}: {best.name} ({fmt(layer, best.values[layer])}).{selTxt}</div>;
}

// ------------------------------------------------------------------ region panel
function RegionPanel({ role, sel, layer, scope, nav }: { role: Role; sel: Region; layer: string; scope: string; nav: (u: Record<string, string | null>) => void }) {
  const def = layerById(layer)!; const [makeProb, setMakeProb] = useState(false);
  const bench = sel.id === 'IN' ? null : benchmarkOf(sel); const rk = sel.id === 'IN' ? null : rankOf(sel, layer);
  const stateId = sel.level === 'district' ? sel.parent! : sel.id;
  const dsMain = getEntity(def.datasetId);
  const rel = useMemo(() => {
    const research = ofKind('research').filter(r => r.layers.includes(layer) || r.regions.includes(stateId)).sort((a, b) => Number(b.layers.includes(layer) && b.regions.includes(stateId)) - Number(a.layers.includes(layer) && a.regions.includes(stateId))).slice(0, 3);
    const pol = new Set<string>(); [def.datasetId, ...research.map(r => r.id)].forEach(id => related(id, ['policy']).forEach(p => pol.add(p.id)));
    const problems = ofKind('problem').filter(p => p.gisLayer === layer || p.regions.includes(stateId)).sort((a, b) => Number(b.gisLayer === layer) - Number(a.gisLayer === layer)).slice(0, 3);
    const datasets = [def.datasetId, ...research.flatMap(r => r.datasets)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
    return { research: research.map(r => r.id), policies: [...pol].slice(0, 3), problems: problems.map(p => p.id), datasets };
  }, [layer, stateId, def.datasetId]);

  if (sel.id === 'IN') return <>
    <div className="eyebrow">Selected area</div><h2 className="h2 mt4">All India (state average)</h2>
    <p className="tiny mt4">Click a state tile to see its numbers, how it compares, and linked research and policy.</p>
    <Card className="mt12"><div className="tiny">{def.label}</div><div className="row" style={{ alignItems: 'baseline' }}><b style={{ fontSize: 28, color: 'var(--accent)' }}>{fmt(layer, NATIONAL.values[layer])}</b><span className="tiny">simple average of states (demo)</span></div></Card>
    <div className="h3 mt16">What this layer means</div><p className="mt4" style={{ fontSize: 13 }}>{def.what}</p><p className="tiny mt4">{def.read}</p>
    <div className="h3 mt16">Related datasets</div><div className="mt4"><EntityList ids={rel.datasets} /></div>
    <div className="h3 mt16">Related research</div><div className="mt4"><EntityList ids={rel.research} /></div>
    {role !== 'public' && <><div className="h3 mt16">Policy problems on this theme</div><div className="mt4"><EntityList ids={rel.problems} empty="None linked." /></div></>}
    {role === 'public' && <ArticleLink layer={layer} />}
  </>;
  return <>
    <div className="eyebrow">{sel.level === 'district' ? `District · ${regionById(sel.parent!)?.name}` : sel.ut ? 'Union territory' : 'State'}</div>
    <h2 className="h2 mt4">{sel.name}</h2>
    <Card className="mt12">
      <div className="tiny">{def.label}</div>
      <div className="row" style={{ alignItems: 'baseline' }}><b style={{ fontSize: 30, color: 'var(--accent)' }}>{fmt(layer, sel.values[layer])}</b>
        {bench && (() => { const j = judge(layer, sel.values[layer], bench.values[layer]); return <Badge tone={j === 'worse' ? 'bad' : j === 'better' ? 'good' : ''}>{j === 'worse' ? 'worse' : j === 'better' ? 'better' : 'similar'} than {bench.id === 'IN' ? 'India avg' : bench.name} ({fmt(layer, bench.values[layer])})</Badge>; })()}</div>
      {rk && <div className="tiny mt4">Rank {rk.rank} of {rk.of} {sel.level === 'district' ? 'districts in the state' : 'states / UTs'} (1 = highest value)</div>}
    </Card>
    {sel.level === 'state' && hasDistricts(sel.id) && scope === 'IN' && <Btn kind="primary" onClick={() => nav({ drill: '1' })}>View districts of {sel.name} →</Btn>}
    {sel.id === 'TN-CGL' && <div className="mt8"><Btn kind="primary" onClick={() => nav({ view: 'parcels', parcel: null })}>View demo village parcels →</Btn><div className="tiny mt4">Synthetic village used to show parcel-level analysis.</div></div>}
    <div className="h3 mt16">All indicators for {sel.name}</div>
    <div className="tiny">Marker (│) = {bench?.id === 'IN' ? 'all-India average' : bench?.name}</div>
    {(simple(role) ? REGION_LAYERS.filter(l => l.simple) : REGION_LAYERS).map(l => { const max = l.id === 'disputes' ? 200 : l.unit === '%' ? 100 : l.id === 'mutation' ? 90 : l.id === 'conversion' ? 12 : 100; const b = bench!.values[l.id];
      return <button key={l.id} className="mini-bar" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', width: '100%' }} onClick={() => nav({ layer: l.id })} title={`Show ${l.label} on the map`}><span style={{ fontWeight: l.id === layer ? 700 : 400 }}>{l.short}</span><span className="tr"><i style={{ width: `${Math.min(100, 100 * sel.values[l.id] / max)}%` }} /><u style={{ left: `${Math.min(100, 100 * b / max)}%` }} /></span><span>{fmt(l.id, sel.values[l.id])}</span></button>; })}
    <div className="h3 mt16">What this layer means</div><p className="mt4" style={{ fontSize: 13 }}>{def.what}</p>
    <PlainInsight layer={layer} sel={sel} bench={bench!} />
    <div className="h3 mt16">Related datasets</div><div className="mt4"><EntityList ids={rel.datasets} /></div>
    <div className="h3 mt16">Related research</div><div className="mt4"><EntityList ids={rel.research} /></div>
    <div className="h3 mt16">Related policies</div><div className="mt4"><EntityList ids={rel.policies} empty="No policies linked." /></div>
    {role !== 'public' && <><div className="h3 mt16">Policy problems</div><div className="mt4"><EntityList ids={rel.problems} empty="None linked." /></div></>}
    {role === 'public' && <ArticleLink layer={layer} />}
    <div className="h3 mt16">Next steps</div>
    <div className="col mt4">
      {role === 'government' && <><Btn kind="primary" onClick={() => setMakeProb(true)}>Create a policy problem from this finding</Btn>{rel.problems[0] && <Btn href={hrefFor(role, rel.problems[0])}>Open related policy problem</Btn>}<Btn href={modHref(role, 'simulator', {})}>Run a simulation</Btn></>}
      {role === 'researcher' && <><Btn href={modHref(role, 'gaps')}>Check research gaps</Btn>{rel.datasets[0] && <Btn href={hrefFor(role, rel.datasets[0])}>Open dataset</Btn>}<a className="btn" href="#analysis">Correlate with another layer ↓</a></>}
      {role === 'public' && <><Btn href={modHref(role, 'insights', {})} kind="primary">Compare in State &amp; District Insights</Btn><Btn href={modHref(role, 'consultations')}>See open consultations</Btn></>}
      <Btn onClick={() => download(`nilam-demo-${sel.id}.csv`, regionsCsv(sel.level === 'district' ? 'district' : 'state', sel.level === 'district' ? sel.parent : undefined))} title="Download the demo indicator table for this view">Download this table (CSV, demo)</Btn>
    </div>
    {makeProb && <MakeProblem sel={sel} layer={layer} rel={rel} onClose={() => setMakeProb(false)} />}
  </>;
}
const simple = (r: Role) => r === 'public';
function ArticleLink({ layer }: { layer: string }) {
  const id = LAYER_ARTICLE[layer]; const a = getEntity(id); if (!a) return null; const href = hrefFor('public', id);
  return <><div className="h3 mt16">Learn more</div><div className="mt4">{href && <Link className="erow" href={href} style={{ border: '1px solid var(--line)', borderRadius: 10 }}><div className="grow"><div className="kind">Explainer</div><div className="t1">{a.title}</div></div><span className="arrow">→</span></Link>}</div></>;
}
function PlainInsight({ layer, sel, bench }: { layer: string; sel: Region; bench: Region }) {
  const def = layerById(layer)!; const j = judge(layer, sel.values[layer], bench.values[layer]); const v = sel.values[layer], b = bench.values[layer];
  const pct = Math.round(Math.abs(v - b) / (b || 1) * 100);
  const msg: Record<string, string> = {
    ror: j === 'worse' ? 'A smaller share of records is digital here, so more people may still need paper certificates or office visits.' : 'Most records are already digital, so the priority is accuracy and keeping them updated.',
    cadastral: j === 'worse' ? 'Fewer village maps are digital, which makes it harder to link records to exact plots.' : 'Map coverage is relatively strong; linking maps to records is the next step.',
    mutation: j === 'worse' ? 'Land records take longer to update after a sale or inheritance here, so buyers wait longer for their name to appear.' : 'Record updates after a sale are relatively quick here.',
    conversion: j === 'worse' ? 'More farmland is turning into other uses here – a sign of urban growth pressure.' : 'Farmland is changing use more slowly than elsewhere.',
    urban: j === 'worse' ? 'Urban growth is pressing strongly on surrounding land.' : 'Urban pressure is moderate or low.',
    climate: j === 'worse' ? 'Land here is more exposed to floods, cyclones or drought, so building decisions need extra care.' : 'Land here is less exposed to climate hazards than average.',
    disputes: j === 'worse' ? 'More land disputes per 10,000 plots – often a sign of unclear titles or stale records.' : 'Fewer land disputes per 10,000 plots than average.',
  };
  return <div className="notice mt12" style={{ fontSize: 13 }}><b>Insight:</b> {j === 'similar' ? `${sel.name} is close to ${bench.id === 'IN' ? 'the all-India average' : bench.name} on ${def.short.toLowerCase()}.` : `${sel.name} is ${pct}% ${v > b ? 'above' : 'below'} ${bench.id === 'IN' ? 'the all-India average' : bench.name} on ${def.short.toLowerCase()}.`} {msg[layer]}</div>;
}

// ------------------------------------------------------------------ create problem from finding (gov)
function MakeProblem({ sel, layer, rel, onClose }: { sel: Region; layer: string; rel: { research: string[]; policies: string[]; datasets: string[] }; onClose: () => void }) {
  const router = useRouter(); const def = layerById(layer)!; const b = benchmarkOf(sel);
  const [title, setTitle] = useState(`${def.short} concern in ${sel.name}`);
  const [theme, setTheme] = useState(LAYER_THEME[layer]); const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [statement, setStatement] = useState(`${def.label} in ${sel.name} is ${fmt(layer, sel.values[layer])}, compared with ${fmt(layer, b.values[layer])} for ${b.id === 'IN' ? 'the all-India average' : b.name}. Identified from the GIS layer (demo data) – to be validated with official data.`);
  function create() {
    const stateId = sel.level === 'district' ? sel.parent! : sel.id; const id = uid('PP');
    const p: PolicyProblem = { kind: 'problem', id, title, provenance: 'demo', owner: 'Your department (demo)', priority, stage: 'Problem framing', theme, regions: [stateId], geography: sel.name, statement, whyNow: 'Raised from a GIS finding in the Command Centre.', baseline: [{ indicator: `${def.label} – ${sel.name}`, value: fmt(layer, sel.values[layer]), source: `${def.datasetId} (demo)`, datasetId: def.datasetId }, { indicator: `${def.label} – ${b.name}`, value: fmt(layer, b.values[layer]), source: `${def.datasetId} (demo)`, datasetId: def.datasetId }], objectives: ['Define a measurable target', 'Agree success indicators with stakeholders'], interventions: [], datasets: rel.datasets, research: rel.research, literature: [], policies: rel.policies, cases: [], gisLayer: layer, gisRegion: sel.id, simulation: LAYER_SIM[layer], consultations: [], created: today() };
    update(s => ({ ...s, problems: [p, ...s.problems] })); logActivity(`Created policy problem “${title}” from GIS`, `/portal/government/problems/${id}`, 'government'); router.push(`/portal/government/problems/${id}`);
  }
  return <Modal title="Create policy problem from this finding" onClose={onClose} foot={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" onClick={create} disabled={!title.trim()}>Create and open</Btn></>}>
    <Field label="Problem title"><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field>
    <div className="grid g2"><Field label="Theme"><select className="select" value={theme} onChange={e => setTheme(e.target.value)}>{THEMES.map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Priority"><select className="select" value={priority} onChange={e => setPriority(e.target.value as 'High')}><option>High</option><option>Medium</option><option>Low</option></select></Field></div>
    <Field label="Problem statement" hint="Pre-filled from the map. Edit before creating."><textarea className="textarea" value={statement} onChange={e => setStatement(e.target.value)} /></Field>
    <div className="notice tiny">The new problem is linked to this area, layer <b>{def.short}</b>, {rel.datasets.length} datasets, {rel.research.length} research projects and {rel.policies.length} policies, and uses the matching simulation template.</div>
  </Modal>;
}

// ------------------------------------------------------------------ hotspots + analysis
function HotspotTable({ role, layer, scope, nav, sel }: { role: Role; layer: string; scope: string; nav: (u: Record<string, string | null>) => void; sel: Region }) {
  const def = layerById(layer)!; const { regions } = buildTiles(scope, layer);
  const bad = def.polarity === 'bad-high'; const rows = [...regions].sort((a, b) => bad ? b.values[layer] - a.values[layer] : a.values[layer] - b.values[layer]);
  if (role === 'public') return null;
  return <Card className="mt16" pad={false}><CardHead title={`${bad ? 'Hotspots' : 'Lagging areas'}: ${def.label}`} sub={`${scope === 'IN' ? 'States / UTs' : regionById(scope)!.name + ' districts'}, ordered ${bad ? 'highest first' : 'lowest first'} – click a row to select it on the map`} right={<Btn size="sm" onClick={() => download(`nilam-demo-${layer}-${scope}.csv`, regionsCsv(scope === 'IN' ? 'state' : 'district', scope === 'IN' ? undefined : scope))}>Download CSV</Btn>} />
    <DataTable rows={rows.slice(0, 10)} rowKey={r => r.id} onRow={r => nav({ region: r.id, drill: scope !== 'IN' ? null : null })} cols={[{ key: 'rk', label: '#', render: r => rows.indexOf(r) + 1 }, { key: 'n', label: 'Area', render: r => <b style={{ color: sel.id === r.id ? 'var(--accent)' : undefined }}>{r.name}</b>, sort: r => r.name }, { key: 'v', label: def.short, num: true, render: r => fmt(layer, r.values[layer]), sort: r => r.values[layer] }, { key: 'b', label: 'vs benchmark', render: r => { const b = benchmarkOf(r); const j = judge(layer, r.values[layer], b.values[layer]); return <Badge tone={j === 'worse' ? 'bad' : j === 'better' ? 'good' : ''}>{j}</Badge>; } }]} /></Card>;
}
function Analysis({ role, layer, scope, sel }: { role: Role; layer: string; scope: string; sel: Region }) {
  const [yl, setYl] = useState(layer === 'conversion' ? 'climate' : 'conversion'); const [saved, setSaved] = useState<string | null>(null);
  const active = useStore(s => s.activeProject);
  const { regions } = buildTiles(scope, layer); const xs = regions.map(r => r.values[layer]); const ys = regions.map(r => r.values[yl]); const r = pearson(xs, ys);
  const dx = layerById(layer)!, dy = layerById(yl)!; const strength = Math.abs(r) > .7 ? 'strong' : Math.abs(r) > .4 ? 'moderate' : 'weak';
  const proj = getEntity(active);
  function save() {
    const id = uid('AN'); update(s => ({ ...s, analyses: [{ id, title: `${dx.short} vs ${dy.short} – ${scope === 'IN' ? 'states' : regionById(scope)!.name}`, xLayer: layer, yLayer: yl, r: Math.round(r * 100) / 100, n: regions.length, scope, project: s.activeProject, created: today(), note: `${strength} ${r >= 0 ? 'positive' : 'negative'} association across ${regions.length} areas (demo data).` }, ...s.analyses] }));
    logActivity(`Saved GIS analysis ${dx.short} vs ${dy.short} to ${active}`, `/portal/researcher/projects/${active}#analyses`, 'researcher'); setSaved(id);
  }
  return <Card className="mt16" pad={false}><div id="analysis" /><CardHead title="Compare two layers" sub={`Does ${dx.short.toLowerCase()} move together with another layer across ${scope === 'IN' ? 'states' : 'districts'}?`} right={<><label className="tiny" htmlFor="yl">Compare with</label><select id="yl" className="select" style={{ width: 'auto' }} value={yl} onChange={e => setYl(e.target.value)}>{REGION_LAYERS.filter(l => l.id !== layer).map(l => <option key={l.id} value={l.id}>{l.short}</option>)}</select></>} />
    <div className="card-body"><div className="grid g2"><ScatterPlot points={regions.map((x, i) => ({ x: xs[i], y: ys[i], name: x.name }))} xLabel={dx.short} yLabel={dy.short} highlight={sel.name} />
      <div><div className="tiny">Pearson correlation (r)</div><div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>{r.toFixed(2)}</div><p style={{ fontSize: 13 }}>A {strength} {r >= 0 ? 'positive' : 'negative'} association across {regions.length} areas: where <b>{dx.short.toLowerCase()}</b> is higher, <b>{dy.short.toLowerCase()}</b> tends to be {r >= 0 ? 'higher' : 'lower'}.</p><Notice tone="warn">Correlation is not causation, and these are synthetic values – use this as a way to form research questions, not to draw conclusions.</Notice>
        <div className="row mt12">{role === 'researcher' && <Btn kind="primary" onClick={save}>Save analysis to {active}</Btn>}<Btn onClick={() => download(`nilam-demo-${layer}-vs-${yl}.csv`, ['area,' + dx.id + ',' + dy.id, ...regions.map((x, i) => `${csvCell(x.name)},${xs[i]},${ys[i]}`)].join('\n'))}>Download data (CSV)</Btn></div>
        {saved && <div className="notice good mt12">Saved to <b>{proj?.title}</b>. <Link className="link" href={`/portal/researcher/projects/${active}#analyses`}>Open project analyses →</Link></div>}</div></div></div></Card>;
}

// ------------------------------------------------------------------ parcels
function parcelColor(p: Parcel, layer: string): string {
  if (layer === 'p_landuse') return LAND_USE_COLORS[p.landUse];
  if (p.landUse === 'Road / public') return '#d5d9dd'; if (p.landUse === 'Water body') return '#a8cfe8';
  if (layer === 'p_mutation') return p.mutationPending ? '#c8553d' : '#9ccbb0';
  if (layer === 'p_dispute') return p.dispute ? '#8c2f39' : '#dfe8e2';
  return FLOOD_COLORS[p.flood];
}
function ParcelMap({ layer, selected, onSelect }: { layer: string; selected: string | null; onSelect: (id: string) => void }) {
  const ps = parcels(); const sel = ps.find(p => p.id === selected);
  return <svg viewBox="-2 -2 104 74" role="group" aria-label="Demo village parcels (synthetic)"><rect x={-2} y={-2} width={104} height={74} fill="#f3f1e6" />
    {ps.map(p => <polygon key={p.id} className="tile" points={p.points.map(q => q.join(',')).join(' ')} fill={parcelColor(p, layer)} stroke="#fff" strokeWidth={.35} onClick={() => onSelect(p.id)} role="button" tabIndex={0} aria-label={`Parcel ${p.id}, ${p.landUse}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p.id); } }}><title>{`${p.id} · ${p.landUse}${p.mutationPending ? ' · update pending' : ''}`}</title></polygon>)}
    {sel && <polygon points={sel.points.map(q => q.join(',')).join(' ')} fill="none" stroke="#17232c" strokeWidth={.9} pointerEvents="none" />}
    <text x={2} y={68} fontSize={2.6} fill="#5d6b75">Synthetic demo village – not to scale – not a cadastral boundary</text></svg>;
}
function ParcelLegend({ layer }: { layer: string }) {
  const items: [string, string][] = layer === 'p_landuse' ? Object.entries(LAND_USE_COLORS).map(([k, c]) => [c, k]) : layer === 'p_mutation' ? [['#9ccbb0', 'Record up to date'], ['#c8553d', 'Update pending'], ['#a8cfe8', 'Water body'], ['#d5d9dd', 'Road / public']] : layer === 'p_dispute' ? [['#8c2f39', 'Recorded dispute'], ['#dfe8e2', 'No dispute recorded']] : FLOOD_LABEL.map((l, i) => [FLOOD_COLORS[i], `${l} exposure`] as [string, string]);
  return <div className="legend" style={{ flexWrap: 'wrap' }}>{items.map(([c, l]) => <span key={l} className="sw"><i style={{ background: c }} />{l}</span>)}</div>;
}
function ParcelPanel({ role, layer, parcelId }: { role: Role; layer: string; parcelId: string | null }) {
  const p = parcels().find(x => x.id === parcelId); const s = parcelStats(); const def = layerById(layer)!;
  return <>
    <div className="eyebrow">Demo village · {PARCEL_VILLAGE.name}</div><h2 className="h2 mt4">{p ? `Parcel ${p.id}` : 'Village summary'}</h2>
    <Notice tone="warn">Synthetic parcels. Identifiers begin with “DEMO” and are not real ULPINs. Boundaries are not cadastral.</Notice>
    {!p ? <>
      <Card className="mt12"><div className="grid g2"><div><div className="tiny">Private parcels</div><b style={{ fontSize: 22 }}>{s.total}</b></div><div><div className="tiny">Record update pending</div><b style={{ fontSize: 22, color: 'var(--bad)' }}>{s.pendingPct}%</b></div><div><div className="tiny">Avg days pending</div><b style={{ fontSize: 22 }}>{s.avgPendingDays}</b></div><div><div className="tiny">Pending <u>and</u> flood-exposed</div><b style={{ fontSize: 22, color: 'var(--bad)' }}>{s.pendingAndFlood}</b></div></div></Card>
      <p className="tiny mt12">Click a parcel on the map to see its details.</p>
    </> : <>
      <dl className="kv mt12"><dt>Demo ID</dt><dd>{p.ulpin}</dd><dt>Land use</dt><dd>{p.landUse}</dd><dt>Holder type</dt><dd>{p.holder}</dd><dt>Area</dt><dd>{p.area} ha (synthetic)</dd><dt>Record status</dt><dd>{p.mutationPending ? <Badge tone="bad">Update pending · {p.pendingDays} days</Badge> : <Badge tone="good">Up to date</Badge>}</dd><dt>Dispute</dt><dd>{p.dispute ? <Badge tone="bad">Recorded</Badge> : 'None recorded'}</dd><dt>Flood exposure</dt><dd><Badge tone={p.flood >= 2 ? 'warn' : ''}>{FLOOD_LABEL[p.flood]}</Badge></dd><dt>Last updated</dt><dd>{p.lastUpdated}</dd></dl>
      <div className="notice mt12" style={{ fontSize: 13 }}><b>Why it matters:</b> {p.mutationPending && p.flood >= 2 ? 'This parcel has a stale record and sits in a flood-exposed zone – it should be prioritised for record clearing and flood advisory checks.' : p.mutationPending ? 'The record is waiting for an update after a registered transaction.' : p.flood >= 2 ? 'The record is current, but planners should check hazard advice before any land-use change.' : 'No immediate concern in this demo data.'}</div>
    </>}
    <div className="h3 mt16">About this layer</div><p className="mt4" style={{ fontSize: 13 }}>{def.what}</p>
    <div className="h3 mt16">Related</div><div className="mt4"><EntityList ids={['DS-08', 'RP-02', 'POL-01', ...(role !== 'public' ? ['PP-024'] : [])]} /></div>
    <div className="col mt12">{role === 'government' && <Btn kind="primary" href={hrefFor(role, 'PP-024')}>Open “Mutation delay” policy problem</Btn>}<Btn onClick={() => download('nilam-demo-village-parcels.csv', parcelsCsv())}>Download parcels (CSV, demo)</Btn></div>
  </>;
}
