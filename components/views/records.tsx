'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Role, Dataset, ResearchProject, Literature, Policy, Programme, CaseStudy, Entity } from '@/lib/types';
import { getEntity, ofKind, hrefFor, gisHref, modHref, relatedFor, regionName, KIND_LABEL, entityMeta } from '@/lib/registry';
import { layerById, regionsCsv, parcelsCsv, parcels, REGIONS, fmt, STATES, NATIONAL } from '@/lib/geo';
import { Badge, Btn, Card, CardHead, DataTable, EntityCards, EntityLink, EntityList, KV, PageHead, Progress, RelatedPanel, Tabs, useHashTab, Notice, Bullets, download, shorten, Empty } from '@/components/ui';
import { TileMap } from '@/components/gis/TileMap';
import { AddToProblem, AddToProject, BackLink, ProvLine, RequestAccess } from './shared';
import { useStore, useStoreVersion } from '@/lib/store';
import { THEMES } from '@/lib/data/datasets';

const NotFoundRecord = ({ role, module }: { role: Role; module: string }) => <Card><Empty>That record was not found. <Link className="link" href={`/portal/${role}/${module}`}>Back to the list</Link></Empty></Card>;
function csvFor(d: Dataset): { name: string; text: string }[] {
  if (d.id === 'DS-08') return [{ name: 'nilam-demo-village-parcels.csv', text: parcelsCsv() }];
  if (!d.layer) return [];
  return [{ name: `nilam-demo-${d.id}-states.csv`, text: regionsCsv('state') }, { name: `nilam-demo-${d.id}-districts-TN.csv`, text: regionsCsv('district', 'TN') }];
}

// =====================================================================  DATASETS
export function DatasetsList({ role }: { role: Role }) {
  useStoreVersion(); const router = useRouter();
  const [q, setQ] = useState(''); const [theme, setTheme] = useState(''); const [access, setAccess] = useState(''); const [prov, setProv] = useState('');
  const all = ofKind('dataset').filter(d => role !== 'public' || d.access === 'Public');
  const rows = all.filter(d => (!q || (d.title + d.summary + d.owner).toLowerCase().includes(q.toLowerCase())) && (!theme || d.themes.includes(theme)) && (!access || d.access === access) && (!prov || d.provenance === prov));
  const filters = <div className="filters" role="search"><input type="search" aria-label="Search datasets" placeholder="Search datasets…" value={q} onChange={e => setQ(e.target.value)} />
    <select aria-label="Theme" value={theme} onChange={e => setTheme(e.target.value)}><option value="">All themes</option>{THEMES.map(t => <option key={t}>{t}</option>)}</select>
    {role !== 'public' && <select aria-label="Access" value={access} onChange={e => setAccess(e.target.value)}><option value="">Any access</option><option>Public</option><option>Registered</option><option>Restricted</option></select>}
    {role !== 'public' && <select aria-label="Data status" value={prov} onChange={e => setProv(e.target.value)}><option value="">Demo + official reference</option><option value="demo">Demo data only</option><option value="official-reference">Official reference only</option></select>}
    {(q || theme || access || prov) && <Btn size="sm" onClick={() => { setQ(''); setTheme(''); setAccess(''); setProv(''); }}>Clear filters</Btn>}<span className="tiny">{rows.length} of {all.length} datasets</span></div>;
  const head = role === 'government' ? { eyebrow: 'Data', title: 'Data Catalogue', desc: 'Datasets that power the platform: owner, geography, quality and what depends on them. Open a dataset to see metadata, a preview and linked research.' }
    : role === 'researcher' ? { eyebrow: 'Research', title: 'Dataset Discovery', desc: 'Find datasets with provenance, schema and access terms, and add them to your active project.' }
      : { eyebrow: 'Open knowledge', title: 'Public Data', desc: 'Open datasets you can look at and download. Each one explains what it contains in plain words.' };
  if (role === 'government') return <><PageHead {...head} />{filters}<Card pad={false}><DataTable rows={rows} rowKey={d => d.id} onRow={d => router.push(hrefFor(role, d.id)!)}
    cols={[{ key: 't', label: 'Dataset', sort: d => d.title, render: d => <div><Link className="link" href={hrefFor(role, d.id)!} onClick={e => e.stopPropagation()}>{d.title}</Link><div className="tiny">{d.id} · {d.geography}</div></div> },
      { key: 'o', label: 'Owner', sort: d => d.owner, render: d => <span className="tiny">{d.owner.split(' / ')[0]}</span> }, { key: 'a', label: 'Access', sort: d => d.access, render: d => <Badge tone={d.access === 'Public' ? 'good' : d.access === 'Restricted' ? 'warn' : 'info'}>{d.access}</Badge> },
      { key: 'q', label: 'Quality', num: true, sort: d => d.quality.completeness + d.quality.accuracy + d.quality.timeliness, render: d => <span>{Math.round((d.quality.completeness + d.quality.accuracy + d.quality.timeliness) / 3)}%</span> },
      { key: 'u', label: 'Updated', render: d => d.update }, { key: 'p', label: 'Status', render: d => <ProvLine p={d.provenance} /> }]} /></Card></>;
  return <><PageHead {...head} />{filters}{rows.length === 0 ? <Card><Empty>No datasets match. Clear the filters to see all.</Empty></Card> :
    <div className="grid g3">{rows.map(d => <Link key={d.id} href={hrefFor(role, d.id)!} className="card ecard">
      <div className="row between"><span className="eyebrow">{d.themes[0]}</span><ProvLine p={d.provenance} /></div><div className="t1">{d.title}</div>
      <div className="tiny">{role === 'public' ? d.publicSummary : shorten(d.summary, 120)}</div>
      <div className="row mt4"><Badge tone={d.access === 'Public' ? 'good' : 'warn'}>{d.access}</Badge><Badge>{d.format.split(' ')[0]}</Badge>{role === 'researcher' && <Badge tone="accent">Quality {Math.round((d.quality.completeness + d.quality.accuracy + d.quality.timeliness) / 3)}%</Badge>}</div></Link>)}</div>}</>;
}

export function DatasetDetail({ role, id }: { role: Role; id: string }) {
  useStoreVersion(); const d = getEntity<Dataset>(id); if (!d || d.kind !== 'dataset') return <NotFoundRecord role={role} module={role === 'public' ? 'data' : 'datasets'} />;
  return <DatasetView role={role} d={d} />;
}
function DatasetView({ role, d }: { role: Role; d: Dataset }) {
  const router = useRouter();
  const mod = role === 'public' ? 'data' : 'datasets'; const layer = d.layer ? layerById(d.layer) : undefined; const files = csvFor(d);
  const isParcel = d.id === 'DS-08';
  const sample = useMemo(() => layer && layer.level === 'region' ? STATES.slice(0, 8).map(s => ({ s, v: REGIONS.find(r => r.id === s.code)!.values[layer.id] })) : [], [layer]);
  return <div>
    <BackLink role={role} module={mod} label={role === 'public' ? 'All public data' : role === 'government' ? 'Data Catalogue' : 'Dataset Discovery'} />
    <PageHead eyebrow={`Dataset · ${d.id}`} title={d.title} desc={role === 'public' ? d.publicSummary : d.summary} actions={<ProvLine p={d.provenance} />} />
    <div className="split">
      <div className="col" style={{ gap: 16 }}>
        {d.provenance === 'demo' && <Notice tone="warn"><b>Demo dataset.</b> Values in this prototype are synthetic. {d.quality.note}</Notice>}
        {d.provenance === 'official-reference' && <Notice>This record describes a real data system. The prototype holds only a <b>demo extract</b>; confirm availability and terms with the custodian.</Notice>}
        <Card pad={false}><CardHead title={role === 'public' ? 'About this dataset' : 'Metadata'} />
          <div className="card-body"><KV items={[['Owner', d.owner], ['Custodian', d.custodian], ['Geography', d.geography], ['Period', d.period], ['Format', d.format], ['Update frequency', d.update], ['Access', <Badge key="a" tone={d.access === 'Public' ? 'good' : 'warn'}>{d.access}</Badge>], ['Licence', d.license], ['Themes', <span key="t" className="chips">{d.themes.map(t => <span key={t} className="chip static">{t}</span>)}</span>]]} /></div></Card>
        {role !== 'public' && <Card pad={false}><CardHead title="Data quality" sub="Self-assessed – see note" /><div className="card-body">
          {([['Completeness', d.quality.completeness], ['Accuracy', d.quality.accuracy], ['Timeliness', d.quality.timeliness]] as [string, number][]).map(([k, v]) => <div key={k} className="mb8"><div className="row between tiny"><span>{k}</span><b>{v}%</b></div><Progress value={v} /></div>)}<p className="tiny mt8">{d.quality.note}</p></div></Card>}
        <Card pad={false}><CardHead title={role === 'public' ? 'What is inside' : 'Schema'} /><div className="table-wrap"><table className="t"><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody>{d.fields.map(f => <tr key={f.name}><td><code>{f.name}</code></td><td>{f.type}</td><td>{f.description}</td></tr>)}</tbody></table></div></Card>
        {(layer || isParcel) && <Card pad={false}><CardHead title="Preview (demo values)" sub={isParcel ? 'First 6 generated parcels' : `${layer!.label} – first 8 states`} />
          {isParcel ? <DataTable rows={parcels().slice(0, 6)} rowKey={p => p.id} cols={[{ key: 'i', label: 'Parcel', render: p => p.id }, { key: 'u', label: 'Demo ID', render: p => p.ulpin }, { key: 'l', label: 'Land use', render: p => p.landUse }, { key: 'm', label: 'Pending', render: p => p.mutationPending ? `${p.pendingDays} d` : 'No' }]} />
            : <DataTable rows={sample} rowKey={r => r.s.code} cols={[{ key: 'n', label: 'State / UT', render: r => r.s.name }, { key: 'v', label: layer!.short, num: true, render: r => fmt(layer!.id, r.v) }]} />}</Card>}
      </div>
      <div className="col" style={{ gap: 16 }}>
        <Card><div className="h3 mb8">Use this dataset</div><div className="col">
          {layer && <Btn kind="primary" href={gisHref(role, { layer: layer.level === 'region' ? layer.id : undefined, region: isParcel ? 'TN-CGL' : undefined })}>{role === 'public' ? 'See it on the Land Atlas' : 'Open in GIS'}</Btn>}
          {isParcel && <Btn href={`${gisHref(role, { region: 'TN-CGL' })}&view=parcels`}>Open demo village parcels</Btn>}
          {d.downloadable && (d.access === 'Public' || role !== 'public') ? files.map(f => <Btn key={f.name} onClick={() => download(f.name, f.text)}>Download {f.name.replace('nilam-demo-', '').replace('.csv', '')} (CSV)</Btn>) : null}
          {d.access !== 'Public' && role !== 'public' && <RequestAccess id={d.id} />}
          {role === 'government' && <AddToProblem id={d.id} size="" />}
          {role === 'researcher' && <AddToProject id={d.id} />}
          {d.downloadable && files.length === 0 && <div className="tiny">No bundled file for this dataset.</div>}
        </div></Card>
        {layer && layer.level === 'region' && <Card pad={false}><CardHead title={`Map: ${layer.short}`} sub="Click a tile to open it in GIS" /><div className="card-body"><TileMap scope="IN" layer={layer.id} compact onSelect={r => router.push(gisHref(role, { layer: layer.id, region: r }))} /></div></Card>}
        <RelatedPanel id={d.id} />
      </div>
    </div></div>;
}

// =====================================================================  RESEARCH
export function ResearchList({ role }: { role: Role }) {
  useStoreVersion(); const [q, setQ] = useState(''); const [theme, setTheme] = useState(''); const [status, setStatus] = useState('');
  const base = ofKind('research').filter(r => role !== 'public' || r.public);
  const rows = base.filter(r => (!q || (r.title + r.summary + r.institution + r.studyArea).toLowerCase().includes(q.toLowerCase())) && (!theme || r.themes.includes(theme)) && (!status || r.status === status));
  const mod = role === 'government' ? 'evidence' : role === 'researcher' ? 'projects' : 'research';
  return <div className="filters"><input type="search" aria-label="Search research" placeholder="Search research…" value={q} onChange={e => setQ(e.target.value)} /><select aria-label="Theme" value={theme} onChange={e => setTheme(e.target.value)}><option value="">All themes</option>{THEMES.map(t => <option key={t}>{t}</option>)}</select>
    {role !== 'public' && <select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Any status</option><option>Draft</option><option>Active</option><option>Under review</option><option>Published</option></select>}
    <span className="tiny">{rows.length} of {base.length}</span>
    <div style={{ flexBasis: '100%' }} />{rows.length === 0 ? <Card><Empty>No research matches your filters.</Empty></Card> : <div className="grid g3" style={{ width: '100%' }}>{rows.map(r => <Link key={r.id} href={`/portal/${role}/${mod}/${r.id}`} className="card ecard">
      <div className="row between"><span className="eyebrow">{r.themes[0]}</span><Badge tone={r.status === 'Published' ? 'good' : r.status === 'Draft' ? '' : 'info'}>{r.status}</Badge></div><div className="t1">{r.title}</div>
      <div className="tiny">{r.institution} · {r.studyArea.length > 50 ? r.studyArea.slice(0, 50) + '…' : r.studyArea}</div>
      <p className="tiny" style={{ color: 'var(--ink)' }}>{shorten(role === 'public' ? r.publicSummary : r.summary, 130)}</p>
      {role !== 'public' && <><Progress value={r.progress} /><div className="row between tiny"><span>{r.progress}% complete</span><span>Evidence: {r.evidenceStrength}</span></div></>}<div className="row"><ProvLine p={r.provenance} /></div></Link>)}</div>}</div>;
}

export function ResearchDetail({ role, id }: { role: Role; id: string }) {
  useStoreVersion(); const r = getEntity<ResearchProject>(id); const mod = role === 'government' ? 'evidence' : role === 'researcher' ? 'projects' : 'research';
  if (!r || r.kind !== 'research' || (role === 'public' && !r.public)) return <NotFoundRecord role={role} module={mod} />;
  if (role === 'public') return <PublicResearch r={r} />;
  return role === 'researcher' ? <ProjectWorkspace r={r} /> : <GovEvidenceResearch r={r} />;
}
function PublicResearch({ r }: { r: ResearchProject }) {
  const arts = ofKind('article').filter(a => a.research.includes(r.id)); const pol = relatedFor('public', r.id, ['policy']); const cons = relatedFor('public', r.id, ['consultation']);
  return <div><BackLink role="public" module="research" label="Research Library" />
    <PageHead eyebrow="Research summary" title={r.title} desc={r.publicSummary} actions={<ProvLine p={r.provenance} />} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><h2 className="h2 mb8">The question</h2><p>{r.question}</p></Card>
      <Card><h2 className="h2 mb8">What they found</h2>{r.findings.length ? <Bullets items={r.findings} /> : <p className="tiny">Findings will be published when the study completes.</p>}<p className="tiny mt12">Findings are labelled demo where data are synthetic. Evidence strength: <b>{r.evidenceStrength}</b>.</p></Card>
      <Card><h2 className="h2 mb8">Who did the research</h2><p>{r.lead} · {r.institution}</p><p className="tiny mt4">Study area: {r.studyArea}. Period: {r.start} – {r.end || 'ongoing'}.</p></Card>
      <Card><h2 className="h2 mb8">Where to go next</h2><div className="row">
        <Btn kind="primary" href={gisHref('public', { region: r.regions[0], layer: r.layers[0] })}>See this on the Land Atlas</Btn>
        {pol[0] && <Btn href={hrefFor('public', pol[0].id)}>Read the policy behind it</Btn>}{cons[0] && <Btn href={hrefFor('public', cons[0].id)}>Have your say on a consultation</Btn>}</div></Card>
    </div><div className="col" style={{ gap: 16 }}>
      {arts.length > 0 && <Card pad={false}><CardHead title="Explainers" /><EntityList ids={arts.map(a => a.id)} /></Card>}
      <Card pad={false}><CardHead title="Policies and programmes" /><EntityList ids={pol.map(p => p.id)} empty="No related policies." /></Card>
      <Card pad={false}><CardHead title="Open data used" /><EntityList ids={r.datasets} /></Card></div></div></div>;
}
function GovEvidenceResearch({ r }: { r: ResearchProject }) {
  return <div><BackLink role="government" module="evidence" label="Evidence Explorer" />
    <PageHead eyebrow={`Research evidence · ${r.id}`} title={r.title} desc={r.summary} actions={<><ProvLine p={r.provenance} /><AddToProblem id={r.id} size="" kind="primary" /></>} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><div className="row between"><h2 className="h2">Evidence strength</h2><Badge tone={r.evidenceStrength === 'Strong' ? 'good' : r.evidenceStrength === 'Moderate' ? 'info' : 'warn'}>{r.evidenceStrength}</Badge></div><p className="tiny mt4">Assessed from design, sample and replication. Check methods before relying on a finding.</p></Card>
      <Card><h2 className="h2 mb8">Research question</h2><p>{r.question}</p><KV items={[['Lead', `${r.lead}, ${r.institution}`], ['Study area', r.studyArea], ['Period', `${r.start} – ${r.end || 'ongoing'}`], ['Status', r.status]]} /></Card>
      <Card><h2 className="h2 mb8">Key findings</h2>{r.findings.length ? <Bullets items={r.findings} /> : <p className="tiny">None yet.</p>}</Card>
      <Card><h2 className="h2 mb8">Methodology</h2><Bullets items={r.methodology} /></Card>
      <Card pad={false}><CardHead title="Policy problems this research informs" /><EntityList ids={r.problems} empty="Not linked to a problem yet." /></Card>
    </div><div className="col" style={{ gap: 16 }}><Card><div className="h3 mb8">Next steps</div><div className="col">{r.layers[0] && <Btn href={gisHref('government', { region: r.regions[0], layer: r.layers[0] })}>Open study area in GIS</Btn>}{r.problems[0] && <Btn href={hrefFor('government', r.problems[0])}>Open linked policy problem</Btn>}</div></Card><RelatedPanel id={r.id} /></div></div></div>;
}
function ProjectWorkspace({ r }: { r: ResearchProject }) {
  const TABS = ['overview', 'data', 'methods', 'findings', 'analyses', 'policy'] as const; const [tab, setTab] = useHashTab<typeof TABS[number]>([...TABS], 'overview');
  const analyses = useStore(s => s.analyses).filter(a => a.project === r.id); const active = useStore(s => s.activeProject);
  const pubs = ofKind('publication').filter(p => p.project === r.id);
  return <div><BackLink role="researcher" module="projects" label="Research Workspace" />
    <PageHead eyebrow={`Research project · ${r.id}`} title={r.title} desc={r.summary} actions={<><Badge tone={r.status === 'Published' ? 'good' : 'info'}>{r.status}</Badge><ProvLine p={r.provenance} />{active !== r.id && <Btn onClick={() => import('@/lib/store').then(m => m.update(s => ({ ...s, activeProject: r.id })))}>Make active project</Btn>}</>} />
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'data', label: 'Data & GIS', n: r.datasets.length }, { id: 'methods', label: 'Methods' }, { id: 'findings', label: 'Findings & outputs', n: r.outputs.length + pubs.length }, { id: 'analyses', label: 'GIS analyses', n: analyses.length }, { id: 'policy', label: 'Policy relevance' }]} />
    {tab === 'overview' && <div className="split"><div className="col" style={{ gap: 16 }}><Card><h2 className="h2 mb8">Research question</h2><p>{r.question}</p><div className="mt12"><div className="row between tiny"><span>Progress</span><b>{r.progress}%</b></div><Progress value={r.progress} lg /></div></Card>
      <Card><KV items={[['Lead', `${r.lead} (${r.leadRole})`], ['Institution', r.institution], ['Study area', r.studyArea], ['Timeline', `${r.start} → ${r.end || 'open'}`], ['Themes', r.themes.join(', ')], ['Evidence strength', r.evidenceStrength], ['Visibility', r.public ? 'Public summary published' : 'Internal']]} /></Card>
      <Card pad={false}><CardHead title="Team" /><div className="card-body"><div className="chips">{r.team.map(t => <span key={t.name} className="chip static">{t.name} · {t.role}</span>)}</div></div></Card></div>
      <div className="col" style={{ gap: 16 }}><Card><div className="h3 mb8">Continue the work</div><div className="col"><Btn kind="primary" onClick={() => setTab('data')}>Datasets &amp; GIS →</Btn><Btn href={modHref('researcher', 'gaps')}>Find related research gaps</Btn><Btn href={modHref('researcher', 'publish')}>Publish an output</Btn></div></Card><RelatedPanel id={r.id} kinds={['literature', 'policy', 'team', 'gap']} /></div></div>}
    {tab === 'data' && <div className="grid g2"><Card pad={false}><CardHead title="Datasets" right={<Btn size="sm" href={modHref('researcher', 'datasets')}>+ Find more datasets</Btn>} /><EntityList ids={r.datasets} empty="No datasets yet – add some from Dataset Discovery." /></Card>
      <Card pad={false}><CardHead title="GIS layers" sub="Open the study area with each layer" /><div className="card-body col">{r.layers.length ? r.layers.map(l => <Btn key={l} href={gisHref('researcher', { region: r.regions[0], layer: l })}>⌖ {layerById(l)?.label} – {regionName(r.regions[0])}</Btn>) : <div className="tiny">No layers assigned.</div>}</div></Card></div>}
    {tab === 'methods' && <Card><h2 className="h2 mb8">Methodology</h2><Bullets items={r.methodology} /></Card>}
    {tab === 'findings' && <div className="grid g2"><Card><h2 className="h2 mb8">Findings</h2>{r.findings.length ? <Bullets items={r.findings} /> : <p className="tiny">No findings recorded yet.</p>}</Card><Card pad={false}><CardHead title="Outputs" right={<Btn size="sm" href={modHref('researcher', 'publish')}>New publication</Btn>} /><EntityList ids={[...r.outputs, ...pubs.map(p => p.id).filter(i => !r.outputs.includes(i))]} empty="No outputs yet." /></Card></div>}
    {tab === 'analyses' && <Card pad={false}><CardHead title="GIS analyses saved to this project" right={<Btn size="sm" kind="primary" href={modHref('researcher', 'gis')}>New analysis in GIS Workspace</Btn>} />{analyses.length ? <DataTable rows={analyses} rowKey={a => a.id} cols={[{ key: 't', label: 'Analysis', render: a => <b>{a.title}</b> }, { key: 'r', label: 'r', num: true, render: a => a.r.toFixed(2) }, { key: 'n', label: 'n', num: true, render: a => a.n }, { key: 'c', label: 'Saved', render: a => a.created }, { key: 'o', label: '', render: a => <Link className="link" href={gisHref('researcher', { layer: a.xLayer, compare: a.yLayer })}>Reopen →</Link> }]} /> : <Empty>No analyses yet. In the GIS Workspace, compare two layers and choose “Save analysis”.</Empty>}</Card>}
    {tab === 'policy' && <div className="grid g2"><Card pad={false}><CardHead title="Policy problems this informs" sub="Tracked by government users in Policy Problems" /><div className="card-body">{r.problems.length ? r.problems.map(pid => { const p = getEntity(pid); return p && p.kind === 'problem' ? <div key={pid} className="mb8"><b>{p.title}</b><div className="tiny">{p.owner} · stage: {p.stage} · priority {p.priority}</div></div> : null; }) : <div className="tiny">None linked.</div>}</div></Card><Card pad={false}><CardHead title="Policies" /><EntityList ids={r.policies} empty="None linked." /></Card></div>}
  </div>;
}

// =====================================================================  LITERATURE & POLICY
export function LibraryList({ role }: { role: Role }) {
  useStoreVersion(); const [q, setQ] = useState(''); const [type, setType] = useState('');
  const items: Entity[] = [...ofKind('literature'), ...ofKind('policy'), ...ofKind('programme')];
  const rows = items.filter(e => { const x = e as Literature | Policy | Programme; const t = 'type' in x ? x.type : 'Programme'; return (!q || (e.title + ((x as Literature).abstract ?? (x as Policy).summary ?? '')).toLowerCase().includes(q.toLowerCase())) && (!type || t === type); });
  const types = ['Paper', 'Report', 'Policy document', 'Legal document', 'Programme', 'Act / Law', 'Notification', 'Reform proposal', 'State measure'];
  return <><PageHead eyebrow="Research" title="Literature & Policy Library" desc="Research papers, reports, policy documents, laws and programmes. Open an item to see its abstract, linked research and data." />
    <div className="filters"><input type="search" aria-label="Search library" placeholder="Search library…" value={q} onChange={e => setQ(e.target.value)} /><select aria-label="Type" value={type} onChange={e => setType(e.target.value)}><option value="">All types</option>{types.map(t => <option key={t}>{t}</option>)}</select><span className="tiny">{rows.length} of {items.length}</span></div>
    <Card pad={false}>{rows.length ? rows.map(e => <EntityLink key={e.id} id={e.id} />) : <Empty>Nothing matches.</Empty>}</Card></>;
}
export function LiteratureDetail({ role, id }: { role: Role; id: string }) {
  const l = getEntity<Literature>(id); const mod = role === 'government' ? 'evidence' : 'library'; if (!l || l.kind !== 'literature') return <NotFoundRecord role={role} module={mod} />;
  return <div><BackLink role={role} module={mod} label={role === 'government' ? 'Evidence Explorer' : 'Library'} />
    <PageHead eyebrow={`${l.type} · ${l.id}`} title={l.title} desc={l.abstract} actions={<><ProvLine p={l.provenance} />{role === 'government' && <AddToProblem id={l.id} size="" kind="primary" />}</>} />
    <div className="split"><Card><KV items={[['Authors', l.authors], ['Year', String(l.year)], ['Source', l.source], ['Themes', l.themes.join(', ')], ['Regions', l.regions.map(r => r === 'IN' ? 'National' : regionName(r)).join(', ')]]} />{l.provenance === 'demo' && <div className="mt12"><Notice tone="warn">Demo record – a fictional paper created for the prototype.</Notice></div>}</Card><RelatedPanel id={l.id} /></div></div>;
}
export function PolicyDetail({ role, id }: { role: Role; id: string }) {
  const p = getEntity<Policy>(id); const mod = role === 'government' ? 'evidence' : role === 'researcher' ? 'library' : 'policy'; if (!p || p.kind !== 'policy') return <NotFoundRecord role={role} module={mod} />;
  const layers = [...new Set(p.datasets.map(d => getEntity<Dataset>(d)?.layer).filter(Boolean))] as string[];
  const cons = relatedFor(role, p.id, ['consultation']);
  if (role === 'public') return <div><BackLink role="public" module="policy" label="Policy Explainers" />
    <PageHead eyebrow={`${p.type} · ${p.level}`} title={p.title} desc={p.plain} actions={<ProvLine p={p.provenance} />} />
    <div className="split"><div className="col" style={{ gap: 16 }}><Card><h2 className="h2 mb8">What it means for you</h2><p style={{ fontSize: 17 }}>{p.plain}</p><div className="mt12"><b>Who it affects</b><Bullets items={p.whoItAffects} /></div></Card>
      <Card><h2 className="h2 mb8">What it aims to do</h2><Bullets items={p.objectives} /></Card><Card><h2 className="h2 mb8">Key points</h2><Bullets items={p.keyProvisions} /><p className="tiny mt12">Status: {p.status}. Authority: {p.authority}. In force / since: {p.since}. This is a plain-language summary, not legal advice.</p></Card></div>
      <div className="col" style={{ gap: 16 }}><Card><div className="h3 mb8">See it on the map</div><div className="col">{layers[0] ? <Btn kind="primary" href={gisHref('public', { layer: layers[0] })}>Open the Land Atlas</Btn> : <div className="tiny">No map layer for this policy.</div>}{p.programme && <Btn href={hrefFor('public', p.programme)}>How to use this programme</Btn>}{cons[0] && <Btn href={hrefFor('public', cons[0].id)}>Open consultation</Btn>}</div></Card><Card pad={false}><CardHead title="Research behind it" /><EntityList ids={p.research.filter(r => hrefFor('public', r))} empty="No public research linked." /></Card></div></div></div>;
  return <div><BackLink role={role} module={mod} label={role === 'government' ? 'Evidence Explorer' : 'Library'} />
    <PageHead eyebrow={`${p.type} · ${p.level} · ${p.id}`} title={p.title} desc={p.summary} actions={<><ProvLine p={p.provenance} /><Badge tone="info">{p.status}</Badge>{role === 'government' && <AddToProblem id={p.id} size="" kind="primary" />}</>} />
    <div className="split"><div className="col" style={{ gap: 16 }}><Card><KV items={[['Authority', p.authority], ['Since', p.since], ['Status', p.status], ['Themes', p.themes.join(', ')]]} /></Card>
      <div className="grid g2"><Card><h2 className="h2 mb8">Objectives</h2><Bullets items={p.objectives} /></Card><Card><h2 className="h2 mb8">Key provisions</h2><Bullets items={p.keyProvisions} /></Card></div>
      <Card><h2 className="h2 mb8">Plain-language version (as shown to citizens)</h2><p>{p.plain}</p></Card>
      {p.provenance === 'demo' && <Notice tone="warn">This policy record is illustrative and flagged DEMO.</Notice>}
      {layers.length > 0 && <Card><div className="h3 mb8">Related map layers</div><div className="row">{layers.map(l => <Btn key={l} href={gisHref(role, { layer: l })}>⌖ {layerById(l)?.short}</Btn>)}</div></Card>}</div><RelatedPanel id={p.id} /></div></div>;
}
export function ProgrammeDetail({ role, id }: { role: Role; id: string }) {
  useStoreVersion(); const pr = getEntity<Programme>(id); const mod = role === 'government' ? 'programmes' : role === 'researcher' ? 'library' : 'schemes'; if (!pr || pr.kind !== 'programme') return <NotFoundRecord role={role} module={mod} />;
  return <ProgrammeView role={role} pr={pr} mod={mod} />;
}
function ProgrammeView({ role, pr, mod }: { role: Role; pr: Programme; mod: string }) {
  const router = useRouter();
  const [comp, setComp] = useState(pr.components[0].id); const c = pr.components.find(x => x.id === comp)!; const layer = layerById(c.layer)!;
  const rows = useMemo(() => REGIONS.filter(r => r.level === 'state').map(r => ({ r, v: r.values[layer.id] })).sort((a, b) => layer.polarity === 'bad-high' ? b.v - a.v : a.v - b.v), [layer]);
  if (role === 'public') return <div><BackLink role="public" module="schemes" label="Land Programmes" />
    <PageHead eyebrow="Land programme" title={pr.title} desc={pr.plain} actions={<ProvLine p={pr.provenance} />} />
    <div className="split"><div className="col" style={{ gap: 16 }}><Card><h2 className="h2 mb8">What it does</h2><p style={{ fontSize: 17 }}>{pr.summary}</p><div className="mt12"><b>Parts of the programme</b><Bullets items={pr.components.map(x => <span key={x.id}><b>{x.name}</b> – {x.description}</span>)} /></div></Card>
      <Card><h2 className="h2 mb8">Who can use it</h2><Bullets items={pr.eligibility} /></Card><Card><h2 className="h2 mb8">How to use it</h2><ol className="list">{pr.howToAccess.map((h, i) => <li key={i}>{h}</li>)}</ol></Card></div>
      <div className="col" style={{ gap: 16 }}><Card><div className="h3 mb8">Programme facts</div>{pr.headline.map(h => <div key={h.label} className="mb8"><div className="tiny">{h.label}</div><b style={{ fontSize: 20, color: 'var(--accent)' }}>{h.value}</b><div className="tiny">{h.note}</div></div>)}</Card>
        <Card><div className="h3 mb8">See progress by state</div><Btn kind="primary" href={gisHref('public', { layer: layerById(pr.components[0].layer)?.simple ? pr.components[0].layer : 'ror' })}>Open the Land Atlas</Btn></Card>
        <Card pad={false}><CardHead title="Policy behind it" /><EntityList ids={pr.policies} /></Card></div></div></div>;
  return <div><BackLink role={role} module={mod} label={role === 'government' ? 'Programme Monitor' : 'Library'} />
    <PageHead eyebrow={`Programme · ${pr.agency}`} title={pr.title} desc={pr.summary} actions={<ProvLine p={pr.provenance} />} />
    <div className="grid g3 mb16">{pr.headline.map(h => <Card key={h.label}><div className="tiny">{h.label}</div><div className="stat"><div className="v">{h.value}</div></div><div className="tiny">{h.note}</div></Card>)}</div>
    <div className="split wide"><Card pad={false}><CardHead title="Implementation by state" sub="DEMO indicator values from the GIS layers – select a component" right={<select className="select" style={{ width: 'auto' }} aria-label="Component" value={comp} onChange={e => setComp(e.target.value)}>{pr.components.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>} />
      <div className="card-body"><p className="tiny mb8"><b>{c.name}:</b> {c.description} Measured by <b>{layer.label}</b>.</p></div>
      <DataTable rows={rows} rowKey={x => x.r.id} initialSort={{ key: 'v', dir: layer.polarity === 'bad-high' ? -1 : 1 }} onRow={x => router.push(gisHref(role, { region: x.r.id, layer: layer.id }))} cols={[{ key: 'n', label: 'State / UT', sort: x => x.r.name, render: x => <Link className="link" href={gisHref(role, { region: x.r.id, layer: layer.id })} onClick={e => e.stopPropagation()}>{x.r.name}</Link> }, { key: 'v', label: layer.short, num: true, sort: x => x.v, render: x => fmt(layer.id, x.v) }, { key: 'b', label: 'vs all-India', render: x => { const d = x.v - NATIONAL.values[layer.id]; const good = layer.polarity === 'good-high' ? d > 0 : d < 0; return <Badge tone={Math.abs(d) < 1 ? '' : good ? 'good' : 'bad'}>{d > 0 ? '+' : ''}{layer.decimals ? d.toFixed(1) : Math.round(d)}</Badge>; } }]} /></Card>
      <div className="col" style={{ gap: 16 }}><Card><div className="h3 mb8">Components</div>{pr.components.map(x => <div key={x.id} className="mb8"><b>{x.name}</b><div className="tiny">{x.description}</div></div>)}</Card><Btn kind="primary" href={gisHref(role, { layer: layer.id })}>Open {layer.short} in GIS</Btn><RelatedPanel id={pr.id} /></div></div></div>;
}

// =====================================================================  CASES
export function CasesList({ role }: { role: Role }) {
  useStoreVersion(); const [q, setQ] = useState(''); const [theme, setTheme] = useState('');
  const base = ofKind('case'); const themes = [...new Set(base.map(c => c.theme))];
  const rows = base.filter(c => (!q || (c.title + c.problem + c.location).toLowerCase().includes(q.toLowerCase())) && (!theme || c.theme === theme));
  const mod = role === 'government' ? 'cases' : role === 'researcher' ? 'publish' : 'research';
  return <><div className="filters"><input type="search" aria-label="Search case studies" placeholder="Search case studies…" value={q} onChange={e => setQ(e.target.value)} /><select aria-label="Theme" value={theme} onChange={e => setTheme(e.target.value)}><option value="">All themes</option>{themes.map(t => <option key={t}>{t}</option>)}</select><span className="tiny">{rows.length} of {base.length}</span></div>
    {rows.length === 0 ? <Card><Empty>No case studies match.</Empty></Card> : <div className="grid g3">{rows.map(c => <Link key={c.id} href={`/portal/${role}/${mod}/${c.id}`} className="card ecard"><div className="row between"><span className="eyebrow">{c.theme}</span><div className="row" style={{ gap: 4 }}>{c.userCreated && <Badge tone="good">New</Badge>}<ProvLine p={c.provenance} /></div></div><div className="t1">{c.title}</div><div className="tiny">{c.location} · {c.year}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{shorten(role === 'public' ? c.publicSummary : c.problem, 130)}</p></Link>)}</div>}</>;
}
export function CaseDetail({ role, id }: { role: Role; id: string }) {
  useStoreVersion(); const c = getEntity<CaseStudy>(id); const mod = role === 'government' ? 'cases' : role === 'researcher' ? 'publish' : 'research'; if (!c || c.kind !== 'case') return <NotFoundRecord role={role} module={mod} />;
  const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => <Card><h2 className="h2 mb8">{t}</h2>{children}</Card>;
  return <div><BackLink role={role} module={mod} label={role === 'government' ? 'Case Studies' : role === 'researcher' ? 'Publish & Case Studies' : 'Research Library'} />
    <PageHead eyebrow={`Case study · ${c.theme}`} title={c.title} desc={role === 'public' ? c.publicSummary : undefined} actions={<><ProvLine p={c.provenance} />{role === 'government' && <AddToProblem id={c.id} size="" kind="primary" />}</>} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><KV items={[['Location', c.location], ['Period', c.year], ['Theme', c.theme], ['Replicability', c.replicability]]} /></Card>
      <Sec t="1 · The problem"><p>{c.problem}</p></Sec><Sec t="2 · The intervention"><p>{c.intervention}</p></Sec>
      <Sec t="3 · How it was implemented"><Bullets items={c.implementation} /></Sec><Sec t="4 · Outcomes"><Bullets items={c.outcome} /></Sec>
      <Sec t="5 · Evidence"><EntityList ids={c.evidence} empty="No evidence records linked." /></Sec><Sec t="6 · Lessons"><Bullets items={c.lessons} /></Sec>
      {c.provenance === 'demo' && <Notice tone="warn">Illustrative outcomes – demo data for the prototype.</Notice>}</div>
      <div className="col" style={{ gap: 16 }}>
        {c.pilot && role === 'government' && <Card><div className="h3 mb8">Source pilot</div><EntityLink id={c.pilot} /></Card>}
        <Card><div className="h3 mb8">Next steps</div><div className="col">{c.regions[0] && c.regions[0] !== 'IN' && <Btn href={gisHref(role, { region: c.regions[0] })}>⌖ See location on the map</Btn>}{role === 'government' && c.problems[0] && <Btn kind="primary" href={hrefFor(role, c.problems[0])}>Open policy problem</Btn>}{role === 'public' && <Btn href={modHref('public', 'consultations')}>Have your say</Btn>}</div></Card>
        <RelatedPanel id={c.id} /></div></div></div>;
}
export { NotFoundRecord, EntityCards, entityMeta, KIND_LABEL };
