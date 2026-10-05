'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Article } from '@/lib/types';
import { getEntity, ofKind, hrefFor, gisHref, modHref } from '@/lib/registry';
import { REGIONS, STATES, NATIONAL, REGION_LAYERS, layerById, fmt, judge, rankOf, districtsOf, regionById, hasDistricts } from '@/lib/geo';
import { Badge, Btn, Card, CardHead, EntityList, Notice, PageHead, Empty, Section, ProvBadge, DataTable } from '@/components/ui';
import { BarCompare } from '@/components/ui/charts';
import { TileMap, Legend } from '@/components/gis/TileMap';
import { ResearchList, CasesList, NotFoundRecord } from '@/components/views/records';
import { BackLink } from '@/components/views/shared';
import { tally } from '@/components/views/consultation';
import { useStore, useStoreVersion } from '@/lib/store';

// ---------------------------------------------------------------- Home
export function PublicHome() {
  useStoreVersion(); const router = useRouter(); const [q, setQ] = useState(''); const [layer, setLayer] = useState('mutation'); const resp = useStore(s => s.responses);
  const arts = ofKind('article'); const research = ofKind('research').filter(r => r.public).slice(0, 3); const cons = ofKind('consultation').filter(c => c.status === 'Open');
  const sorted = [...STATES].map(s => REGIONS.find(r => r.id === s.code)!).sort((a, b) => a.values.mutation - b.values.mutation);
  return <>
    <section className="hero"><h1>Understand how land is recorded, mapped and governed in India.</h1><p>Plain-language guides, simple maps, research summaries and open data – and a say in how policy is shaped.</p>
      <form className="bigsearch" role="search" onSubmit={e => { e.preventDefault(); if (q.trim()) router.push(`/portal/public/search?q=${encodeURIComponent(q.trim())}`); }}><input aria-label="Search Nilam" placeholder="Try “mutation”, “ULPIN” or “flood risk”…" value={q} onChange={e => setQ(e.target.value)} /><button className="btn primary lg" type="submit">Search</button></form>
      <div className="chips mt12">{['ULPIN', 'mutation', 'flood', 'land records', 'NAKSHA'].map(t => <Link key={t} className="chip" href={`/portal/public/search?q=${encodeURIComponent(t)}`}>{t}</Link>)}</div></section>
    <Section title="Start with a question" sub="Each guide links to the research, the policy, a map and a consultation"><div className="grid g3">{arts.slice(0, 6).map(a => <Link key={a.id} href={hrefFor('public', a.id)!} className="qcard">{a.question}<div className="s">{a.title} · {a.readTime}</div></Link>)}</div></Section>
    <div className="grid g2 mb16" style={{ alignItems: 'start' }}>
      <Card pad={false}><CardHead title="Explore the Land Atlas" sub="Click a state to see how it compares" right={<select className="select" style={{ width: 'auto' }} aria-label="Map topic" value={layer} onChange={e => setLayer(e.target.value)}>{REGION_LAYERS.filter(l => l.simple).map(l => <option key={l.id} value={l.id}>{l.short}</option>)}</select>} />
        <div className="card-body"><TileMap scope="IN" layer={layer} compact onSelect={r => router.push(gisHref('public', { region: r, layer }))} /><div className="mt8"><Legend layer={layer} /></div><div className="mt8"><Btn kind="primary" href={modHref('public', 'atlas', { layer })}>Open the full Atlas →</Btn></div></div></Card>
      <div className="col" style={{ gap: 16 }}>
        <Card><div className="eyebrow">Did you know? <span className="badge demo" style={{ marginLeft: 6 }}>demo data</span></div><p className="mt4" style={{ fontSize: 17 }}>Waiting for a land record to be updated after a sale ranges from about <b>{sorted[0].values.mutation} days</b> in {sorted[0].name} to <b>{sorted[sorted.length - 1].values.mutation} days</b> in {sorted[sorted.length - 1].name}.</p><div className="mt8"><Btn href={gisHref('public', { layer: 'mutation' })}>See the map</Btn> <Btn href={hrefFor('public', 'ART-05')}>Why does it take so long?</Btn></div></Card>
        <Card pad={false}><CardHead title="Have your say" right={<Btn size="sm" href={modHref('public', 'consultations')}>All →</Btn>} />{cons.map(c => <Link key={c.id} href={hrefFor('public', c.id)!} className="erow"><div className="grow"><div className="t1">{c.title}</div><div className="t2">Closes {c.closes} · {tally(c, resp[c.id]?.answers)[0].n} responses</div></div>{resp[c.id] ? <Badge tone="info">Responded</Badge> : <span className="arrow">→</span>}</Link>)}</Card></div></div>
    <Section title="Latest research, in plain words" right={<Btn size="sm" href={modHref('public', 'research')}>Research Library →</Btn>}><div className="grid g3">{research.map(r => <Link key={r.id} href={hrefFor('public', r.id)!} className="card ecard"><span className="eyebrow">{r.themes[0]}</span><div className="t1">{r.title}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{r.publicSummary}</p><span className="link">Read summary →</span></Link>)}</div></Section>
    <Section title="Land programmes" right={<Btn size="sm" href={modHref('public', 'schemes')}>All programmes →</Btn>}><div className="grid g3">{ofKind('programme').slice(0, 3).map(p => <Link key={p.id} href={hrefFor('public', p.id)!} className="card ecard"><div className="t1">{p.title}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{p.plain}</p><span className="link">How it works →</span></Link>)}</div></Section></>;
}

// ---------------------------------------------------------------- Research library
export function PublicResearch() {
  const [tab, setTab] = useState<'research' | 'stories'>('research');
  return <><PageHead eyebrow="Explore" title="Research Library" desc="Short, plain-language summaries of what researchers are finding – and real-world stories of what has been tried." />
    <div className="chips mb16"><button className={`chip ${tab === 'research' ? 'on' : ''}`} onClick={() => setTab('research')} aria-pressed={tab === 'research'}>Research summaries</button><button className={`chip ${tab === 'stories' ? 'on' : ''}`} onClick={() => setTab('stories')} aria-pressed={tab === 'stories'}>Real-world stories (case studies)</button></div>
    {tab === 'research' ? <ResearchList role="public" /> : <CasesList role="public" />}</>;
}

// ---------------------------------------------------------------- Policy explainers
export function PublicPolicy() {
  useStoreVersion(); const [tab, setTab] = useState<'guides' | 'policies'>('guides'); const [q, setQ] = useState('');
  const arts = ofKind('article').filter(a => !q || (a.title + a.summary).toLowerCase().includes(q.toLowerCase())); const pol = ofKind('policy').filter(p => !q || (p.title + p.plain).toLowerCase().includes(q.toLowerCase()));
  return <><PageHead eyebrow="Explore" title="Policy Explainers" desc="Guides that explain land policies and processes in everyday language, plus summaries of the main laws and programmes." />
    <div className="filters"><div className="chips"><button className={`chip ${tab === 'guides' ? 'on' : ''}`} onClick={() => setTab('guides')} aria-pressed={tab === 'guides'}>Guides · {arts.length}</button><button className={`chip ${tab === 'policies' ? 'on' : ''}`} onClick={() => setTab('policies')} aria-pressed={tab === 'policies'}>Policies & laws · {pol.length}</button></div><input type="search" aria-label="Search" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} /></div>
    {tab === 'guides' ? (arts.length ? <div className="grid g3">{arts.map(a => <Link key={a.id} href={hrefFor('public', a.id)!} className="card ecard"><span className="eyebrow">{a.category} · {a.readTime}</span><div className="t1">{a.title}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{a.summary}</p><span className="link">Read guide →</span></Link>)}</div> : <Card><Empty>No guides match.</Empty></Card>)
      : (pol.length ? <div className="grid g3">{pol.map(p => <Link key={p.id} href={hrefFor('public', p.id)!} className="card ecard"><div className="row between"><span className="eyebrow">{p.type}</span><ProvBadge p={p.provenance} /></div><div className="t1">{p.title}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{p.plain}</p><span className="link">What it means for you →</span></Link>)}</div> : <Card><Empty>No policies match.</Empty></Card>)}</>;
}
export function ArticleDetail({ id }: { id: string }) {
  useStoreVersion(); const a = getEntity<Article>(id); const resp = useStore(s => s.responses); if (!a || a.kind !== 'article') return <NotFoundRecord role="public" module="policy" />;
  const regionLabel = regionById(a.region)?.name ?? 'India'; const cons = a.consultations.map(c => getEntity(c)).filter(Boolean);
  return <div><BackLink role="public" module="policy" label="Policy Explainers" />
    <div className="split"><div><article className="article"><div className="eyebrow">{a.category} · {a.readTime} read</div><h1 className="h1" style={{ marginBottom: 12 }}>{a.title}</h1><p style={{ fontSize: 19, color: 'var(--muted)' }}>{a.summary}</p>{a.body.map((b, i) => <div key={i}>{b.h && <h3>{b.h}</h3>}<p>{b.p}</p></div>)}
      {a.provenance === 'demo' && <Notice tone="warn">Illustrative explainer prepared for the prototype.</Notice>}</article>
      <Card className="mt16"><h2 className="h2 mb8">Keep exploring</h2><div className="row"><Btn kind="primary" href={gisHref('public', { region: a.region, layer: a.layer })}>🗺 See this on the map – {regionLabel}</Btn>{a.research[0] && <Btn href={hrefFor('public', a.research[0])}>Read the research behind it</Btn>}{a.policies[0] && <Btn href={hrefFor('public', a.policies[0])}>Read the policy</Btn>}</div></Card>
      {cons.length > 0 && <Card className="mt16"><h2 className="h2 mb8">Have your say</h2>{cons.map(c => c && <Link key={c.id} className="erow" href={hrefFor('public', c.id)!}><div className="grow"><div className="t1">{c.title}</div><div className="t2">{c.kind === 'consultation' ? (c.status === 'Open' ? `Open until ${c.closes}` : 'Closed – see results') : ''}</div></div>{resp[c.id] ? <Badge tone="info">You responded</Badge> : <span className="arrow">→</span>}</Link>)}</Card>}</div>
      <div className="col" style={{ gap: 16 }}><Card pad={false}><CardHead title="Related policies & programmes" /><EntityList ids={a.policies} /></Card><Card pad={false}><CardHead title="Related research" /><EntityList ids={a.research.filter(r => hrefFor('public', r))} empty="No public research linked." /></Card><Card pad={false}><CardHead title="Open data" /><EntityList ids={a.datasets.filter(d => hrefFor('public', d))} empty="No open dataset linked." /></Card></div></div></div>;
}

// ---------------------------------------------------------------- State & district insights
export function InsightsHome() {
  const router = useRouter(); const [picked, setPicked] = useState<string[]>(['TN', 'UP']); const [layer, setLayer] = useState('mutation'); const layers = REGION_LAYERS.filter(l => l.simple);
  const def = layerById(layer)!; const sel = picked.map(p => regionById(p)!); const toggle = (c: string) => setPicked(picked.includes(c) ? picked.filter(x => x !== c) : picked.length >= 3 ? picked : [...picked, c]);
  const all = STATES.map(s => REGIONS.find(r => r.id === s.code)!);
  return <><PageHead eyebrow="Explore" title="State & District Insights" desc="See how a state compares with the all-India average, or compare up to three states side by side. Open a state for its district picture." />
    <Card className="mb16"><div className="h3 mb8">1 · Choose up to three states to compare</div><div className="chips">{all.map(s => <button key={s.id} className={`chip ${picked.includes(s.id) ? 'on' : ''}`} aria-pressed={picked.includes(s.id)} onClick={() => toggle(s.id)}>{s.name.length > 20 ? s.id : s.name}</button>)}</div>
      <div className="h3 mt16 mb8">2 · Choose what to compare</div><div className="chips">{layers.map(l => <button key={l.id} className={`chip ${layer === l.id ? 'on' : ''}`} aria-pressed={layer === l.id} onClick={() => setLayer(l.id)}>{l.short}</button>)}</div></Card>
    {sel.length === 0 ? <Notice>Pick at least one state above.</Notice> : <div className="grid g2"><Card pad={false}><CardHead title={def.label} sub={`${def.what}`} /><div className="card-body"><BarCompare data={[{ name: 'India avg', value: NATIONAL.values[layer] }, ...sel.map(s => ({ name: s.id, value: s.values[layer] }))]} unit={def.unit} highlight="India avg" color="#2f7a4f" /><p className="tiny">Red bar = all-India (simple) average of states. {def.read}</p></div></Card>
      <Card pad={false}><CardHead title="Side by side" /><div className="table-wrap"><table className="t"><thead><tr><th>Indicator</th><th>India avg</th>{sel.map(s => <th key={s.id}><Link className="link" href={`/portal/public/insights/${s.id}`}>{s.name}</Link></th>)}</tr></thead><tbody>{layers.map(l => <tr key={l.id}><td>{l.short}</td><td>{fmt(l.id, NATIONAL.values[l.id])}</td>{sel.map(s => { const j = judge(l.id, s.values[l.id], NATIONAL.values[l.id]); return <td key={s.id}><b>{fmt(l.id, s.values[l.id])}</b> <Badge tone={j === 'better' ? 'good' : j === 'worse' ? 'bad' : ''}>{j}</Badge></td>; })}</tr>)}</tbody></table></div></Card></div>}
    <Section title="All states and union territories" sub="Click a state to open its insight page"><Card pad={false}><DataTable rows={all} rowKey={r => r.id} onRow={r => router.push(`/portal/public/insights/${r.id}`)} cols={[{ key: 'n', label: 'State / UT', sort: r => r.name, render: r => <Link className="link" href={`/portal/public/insights/${r.id}`} onClick={e => e.stopPropagation()}>{r.name}</Link> }, { key: 'v', label: def.short, num: true, sort: r => r.values[layer], render: r => fmt(layer, r.values[layer]) }, { key: 'd', label: 'Districts', render: r => hasDistricts(r.id) ? <Badge tone="good">district view</Badge> : <span className="tiny">–</span> }]} /></Card></Section></>;
}
export function InsightDetail({ id }: { id: string }) {
  useStoreVersion(); const router = useRouter(); const r = regionById(id); const [layer, setLayer] = useState('mutation');
  if (!r || r.level !== 'state') return <NotFoundRecord role="public" module="insights" />;
  const layers = REGION_LAYERS.filter(l => l.simple); const def = layerById(layer)!; const ds = districtsOf(id); const arts = ofKind('article').filter(a => a.region.startsWith(id) || a.region === 'IN').slice(0, 3); const res = ofKind('research').filter(x => x.public && x.regions.includes(id));
  const worse = layers.filter(l => judge(l.id, r.values[l.id], NATIONAL.values[l.id]) === 'worse'); const better = layers.filter(l => judge(l.id, r.values[l.id], NATIONAL.values[l.id]) === 'better');
  return <div><BackLink role="public" module="insights" label="State & District Insights" />
    <PageHead eyebrow={r.ut ? 'Union territory insight' : 'State insight'} title={r.name} desc={`${worse.length ? `Compared with the all-India average, ${r.name} does worse on ${worse.map(l => l.short.toLowerCase()).join(', ')}` : `${r.name} is at or better than the all-India average on every simple indicator`}${better.length ? ` and better on ${better.map(l => l.short.toLowerCase()).join(', ')}` : ''}. Values are demo data.`} actions={<><Badge tone="demo">DEMO DATA</Badge><Btn kind="primary" href={`${gisHref('public', { region: id })}${hasDistricts(id) ? '&drill=1' : ''}`}>View on the Atlas</Btn></>} />
    <div className="grid g4 mb16">{layers.map(l => { const j = judge(l.id, r.values[l.id], NATIONAL.values[l.id]); const rk = rankOf(r, l.id); return <button key={l.id} onClick={() => setLayer(l.id)} className="card stat" style={{ textAlign: 'left', borderColor: layer === l.id ? 'var(--accent)' : undefined }} aria-pressed={layer === l.id}><div className="l">{l.short}</div><div className="v">{fmt(l.id, r.values[l.id])}</div><div className="f"><Badge tone={j === 'better' ? 'good' : j === 'worse' ? 'bad' : ''}>{j} than average ({fmt(l.id, NATIONAL.values[l.id])})</Badge></div><div className="f">Rank {rk.rank} of {rk.of} (1 = highest value)</div></button>; })}</div>
    <div className="split"><div className="col" style={{ gap: 16 }}>
      {ds.length > 0 ? <Card pad={false}><CardHead title={`${def.short}: districts of ${r.name}`} sub={def.read} /><div className="card-body"><BarCompare data={ds.map(d => ({ name: d.name.split(' ')[0].slice(0, 9), value: d.values[layer] }))} unit={def.unit} /></div>
        <DataTable rows={[...ds].sort((a, b) => b.values[layer] - a.values[layer])} rowKey={d => d.id} onRow={d => router.push(gisHref('public', { region: d.id, layer }))} cols={[{ key: 'n', label: 'District', render: d => <Link className="link" href={gisHref('public', { region: d.id, layer })} onClick={e => e.stopPropagation()}>{d.name}</Link> }, { key: 'v', label: def.short, num: true, render: d => fmt(layer, d.values[layer]) }, { key: 'j', label: 'vs state', render: d => { const j = judge(layer, d.values[layer], r.values[layer]); return <Badge tone={j === 'better' ? 'good' : j === 'worse' ? 'bad' : ''}>{j}</Badge>; } }]} /></Card> : <Notice>District-level view is available for Tamil Nadu, Maharashtra, Uttar Pradesh, Kerala, Gujarat and Odisha in this demo.</Notice>}
      <Card><h2 className="h2 mb8">What this means</h2><p>{def.what}</p><p className="tiny mt4">{def.read}</p></Card></div>
      <div className="col" style={{ gap: 16 }}><Card pad={false}><CardHead title="Guides" /><EntityList ids={arts.map(a => a.id)} /></Card><Card pad={false}><CardHead title={`Research in ${r.name}`} /><EntityList ids={res.map(x => x.id)} empty="No public research summaries for this state yet." /></Card><Card><div className="h3 mb8">Next</div><div className="col"><Btn href={modHref('public', 'consultations')}>Open consultations</Btn><Btn href={modHref('public', 'data')}>Download open data</Btn></div></Card></div></div></div>;
}

// ---------------------------------------------------------------- Programmes list
export function SchemesList() {
  const progs = ofKind('programme');
  return <><PageHead eyebrow="Open knowledge" title="Land Programmes" desc="The main national programmes that modernise land records, explained simply – what they do, who can use them and how." />
    <div className="grid g3">{progs.map(p => <Link key={p.id} href={hrefFor('public', p.id)!} className="card ecard"><div className="row between"><span className="eyebrow">{p.agency}</span><ProvBadge p={p.provenance} /></div><div className="t1">{p.title}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{p.plain}</p><span className="link">How it works →</span></Link>)}</div></>;
}
