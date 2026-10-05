'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Gap, Publication, Team, ResearchProject } from '@/lib/types';
import { getEntity, ofKind, hrefFor, gisHref, modHref, regionName, allEntities } from '@/lib/registry';
import { STATES, layerById } from '@/lib/geo';
import { Badge, Btn, Card, CardHead, DataTable, EntityLink, EntityList, Field, KV, Modal, Notice, PageHead, Progress, Stat, Tabs, Empty, Section, Bullets, ProvBadge } from '@/components/ui';
import { AddToProject, BackLink } from '@/components/views/shared';
import { THEMES } from '@/lib/data/datasets';
import { ResearchList, CasesList, NotFoundRecord } from '@/components/views/records';
import { createProject, createPublication, startProjectFromGap, patchPublication, caseFromPublication } from '@/lib/actions';
import { logActivity, today, uid, update, useStore, useStoreVersion } from '@/lib/store';

// ---------------------------------------------------------------- Home
export function ResearchHome() {
  useStoreVersion(); const active = useStore(s => s.activeProject); const analyses = useStore(s => s.analyses); const act = useStore(s => s.activity).filter(a => a.role === 'researcher');
  const proj = getEntity<ResearchProject>(active) ?? ofKind('research')[0]; const gaps = [...ofKind('gap')].sort((a, b) => b.score - a.score).slice(0, 3);
  const suggested = ofKind('dataset').filter(d => !proj.datasets.includes(d.id) && d.themes.some(t => proj.themes.includes(t))).slice(0, 4);
  const opps = ofKind('opportunity').filter(o => o.status !== 'Reference programme').slice(0, 3);
  const team = ofKind('team').find(t => t.projects.includes(proj.id)); const needs = ofKind('problem').filter(p => proj.problems.includes(p.id));
  return <><PageHead eyebrow="Workspace" title="Research Home" desc="Your active project, the data that could strengthen it, where the evidence gaps are and what funding is open." actions={<><Btn kind="primary" href={modHref('researcher', 'projects')}>Research Workspace</Btn><Btn href={modHref('researcher', 'gaps')}>Find a gap</Btn></>} />
    <div className="grid g4 mb16"><Stat label="Projects" value={ofKind('research').length} foot="across the platform" href={modHref('researcher', 'projects')} /><Stat label="Datasets" value={ofKind('dataset').length} foot="in discovery" href={modHref('researcher', 'datasets')} /><Stat label="Saved GIS analyses" value={analyses.length} foot="from the GIS Workspace" href={`/portal/researcher/projects/${proj.id}#analyses`} /><Stat label="Open opportunities" value={ofKind('opportunity').filter(o => o.status === 'Open' || o.status === 'Closing soon').length} foot="grants & challenges" href={modHref('researcher', 'grants')} /></div>
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><div className="row between"><div><div className="eyebrow">Active project · {proj.id}</div><h2 className="h2 mt4"><Link className="link" href={hrefFor('researcher', proj.id)!}>{proj.title}</Link></h2></div><Badge tone="info">{proj.status}</Badge></div><p className="mt8" style={{ fontSize: 13 }}>{proj.question}</p><div className="mt12"><div className="row between tiny"><span>Progress</span><b>{proj.progress}%</b></div><Progress value={proj.progress} lg /></div>
        <div className="row mt12"><Btn kind="primary" href={hrefFor('researcher', proj.id)}>Open workspace</Btn><Btn href={gisHref('researcher', { region: proj.regions[0], layer: proj.layers[0] })}>⌖ GIS for study area</Btn><Btn href={modHref('researcher', 'publish')}>Publish</Btn></div></Card>
      <Card pad={false}><CardHead title="Suggested datasets for this project" sub="Share a theme with your project" />{suggested.length ? suggested.map(d => <div key={d.id} className="row" style={{ alignItems: 'stretch', gap: 0 }}><div className="grow"><EntityLink id={d.id} /></div><div style={{ padding: 10 }}><AddToProject id={d.id} /></div></div>) : <Empty>Everything relevant is already attached.</Empty>}</Card>
      <Card pad={false}><CardHead title="Saved GIS analyses" right={<Btn size="sm" href={modHref('researcher', 'gis')}>New analysis</Btn>} />{analyses.length ? analyses.slice(0, 4).map(a => <Link key={a.id} className="erow" href={gisHref('researcher', { layer: a.xLayer })}><div className="grow"><div className="t1">{a.title}</div><div className="t2">r = {a.r.toFixed(2)} · n = {a.n} · {a.project}</div></div><span className="arrow">→</span></Link>) : <Empty>None yet. In the GIS Workspace, correlate two layers and save.</Empty>}</Card>
    </div><div className="col" style={{ gap: 16 }}>
      <Card pad={false}><CardHead title="Top research gaps" right={<Btn size="sm" href={modHref('researcher', 'gaps')}>Gap Finder →</Btn>} />{gaps.map(g => <EntityLink key={g.id} id={g.id} />)}</Card>
      <Card pad={false}><CardHead title="Policy questions needing evidence" sub="Tracked by government users" /><div className="card-body">{needs.length ? needs.map(p => <div key={p.id} className="mb8"><b>{p.title}</b><div className="tiny">{p.owner} · {p.stage}</div></div>) : <div className="tiny">None linked to this project.</div>}</div></Card>
      <Card pad={false}><CardHead title="Team" />{team ? <Link className="erow" href={hrefFor('researcher', team.id)!}><div className="grow"><div className="t1">{team.title}</div><div className="t2">{team.threads.length} threads · {team.reviews.filter(r => r.status === 'Requested').length} reviews waiting</div></div><span className="arrow">→</span></Link> : <Empty>No team workspace for this project.</Empty>}</Card>
      <Card pad={false}><CardHead title="Opportunities" right={<Btn size="sm" href={modHref('researcher', 'grants')}>All →</Btn>} />{opps.map(o => <EntityLink key={o.id} id={o.id} />)}</Card>
      {act.length > 0 && <Card pad={false}><CardHead title="Your recent activity" />{act.slice(0, 4).map(a => <Link key={a.id} href={a.href ?? '#'} className="erow"><div className="grow t1" style={{ fontWeight: 500, fontSize: 13 }}>{a.text}</div></Link>)}</Card>}
    </div></div></>;
}

// ---------------------------------------------------------------- Projects
export function ProjectsModule() {
  const [open, setOpen] = useState(false);
  return <><PageHead eyebrow="Research" title="Research Workspace" desc="Every project connects a question to datasets, GIS layers, methods, findings and policy relevance. Open one to work on it, or start a new project." actions={<Btn kind="primary" onClick={() => setOpen(true)}>+ New project</Btn>} /><ResearchList role="researcher" />{open && <NewProject onClose={() => setOpen(false)} />}</>;
}
function NewProject({ onClose }: { onClose: () => void }) {
  const router = useRouter(); const [title, setTitle] = useState(''); const [q, setQ] = useState(''); const [theme, setTheme] = useState<string>(THEMES[0]); const [region, setRegion] = useState('TN'); const [layer, setLayer] = useState('ror');
  return <Modal title="New research project" onClose={onClose} foot={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" disabled={title.trim().length < 5 || q.trim().length < 10} onClick={() => { const id = createProject({ title: title.trim(), question: q.trim(), institution: 'Institute for Governance Research', themes: [theme], region, layer }); router.push(`/portal/researcher/projects/${id}`); }}>Create project</Btn></>}>
    <Field label="Project title"><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field><Field label="Research question"><textarea className="textarea" value={q} onChange={e => setQ(e.target.value)} /></Field>
    <div className="grid g3"><Field label="Theme"><select className="select" value={theme} onChange={e => setTheme(e.target.value)}>{THEMES.map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Study state"><select className="select" value={region} onChange={e => setRegion(e.target.value)}>{STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}</select></Field><Field label="Main GIS layer"><select className="select" value={layer} onChange={e => setLayer(e.target.value)}>{['ror', 'cadastral', 'mutation', 'conversion', 'climate', 'disputes'].map(l => <option key={l} value={l}>{layerById(l)!.short}</option>)}</select></Field></div></Modal>;
}

// ---------------------------------------------------------------- Gap finder
const ZONES = ['North', 'West', 'Central', 'East', 'North-East', 'South'];
export function GapFinder() {
  useStoreVersion(); const router = useRouter(); const [cell, setCell] = useState<{ t: string; z: string } | null>(null);
  const studies = useMemo(() => [...ofKind('research'), ...ofKind('literature')], []);
  const zoneOf = (r: string) => STATES.find(s => s.code === r)?.zone;
  const inCell = (t: string, z: string) => studies.filter(s => s.themes.includes(t) && (s.regions as string[]).some(r => zoneOf(r) === z));
  const gaps = [...ofKind('gap')].sort((a, b) => b.score - a.score); const gapFor = (t: string, z: string) => gaps.find(g => g.theme === t && g.region === z);
  const startCell = () => { if (!cell) return; const g = gapFor(cell.t, cell.z); if (g) { const id = startProjectFromGap(g.id); if (id) router.push(`/portal/researcher/projects/${id}`); } else { const id = createProject({ title: `${cell.t} – ${cell.z} India`, question: `What does the evidence say about ${cell.t.toLowerCase()} in ${cell.z} India, and where are the gaps?`, institution: 'Institute for Governance Research', themes: [cell.t], region: STATES.find(s => s.zone === cell.z)!.code, layer: 'ror' }); router.push(`/portal/researcher/projects/${id}`); } };
  const max = 3;
  return <><PageHead eyebrow="Analysis" title="Research Gap Finder" desc="Studies in the platform counted by theme and region. Empty and thin cells are under-researched – click one to see what exists and start a project." />
    <Card pad={false} className="mb16"><CardHead title="Evidence map: theme × region" sub="Number of research projects and papers (demo catalogue). Darker = more studies; red outline = prioritised gap brief exists." />
      <div className="table-wrap"><table className="t" style={{ textAlign: 'center' }}><thead><tr><th>Theme</th>{ZONES.map(z => <th key={z} style={{ textAlign: 'center' }}>{z}</th>)}</tr></thead><tbody>{THEMES.map(t => <tr key={t}><td style={{ textAlign: 'left', fontWeight: 600 }}>{t}</td>{ZONES.map(z => { const n = inCell(t, z).length; const g = gapFor(t, z); const on = cell?.t === t && cell?.z === z;
        return <td key={z} style={{ padding: 4 }}><button aria-label={`${t}, ${z}: ${n} studies${g ? ', gap brief available' : ''}`} aria-pressed={on} onClick={() => setCell({ t, z })} style={{ width: '100%', minHeight: 40, borderRadius: 6, border: g ? '2px solid #9b3d36' : on ? '2px solid var(--ink)' : '1px solid var(--line)', background: n === 0 ? '#fff' : `rgba(91,73,160,${Math.min(.85, .15 + .22 * Math.min(n, max))})`, color: n >= 2 ? '#fff' : 'var(--ink)', fontWeight: 700 }}>{n}</button></td>; })}</tr>)}</tbody></table></div></Card>
    {cell && <Card className="mb16"><div className="row between"><h2 className="h2">{cell.t} · {cell.z}</h2><Btn size="sm" onClick={() => setCell(null)}>Close</Btn></div>
      <div className="grid g2 mt8"><div><div className="h3 mb8">Existing studies ({inCell(cell.t, cell.z).length})</div>{inCell(cell.t, cell.z).length ? <EntityList ids={inCell(cell.t, cell.z).map(s => s.id)} /> : <Notice tone="warn">No studies in this cell – a clear gap.</Notice>}</div>
        <div><div className="h3 mb8">What to do</div>{gapFor(cell.t, cell.z) ? <div className="notice mb12"><b>Gap brief:</b> {gapFor(cell.t, cell.z)!.why}<div className="mt8"><Btn size="sm" href={hrefFor('researcher', gapFor(cell.t, cell.z)!.id)}>Open gap brief →</Btn></div></div> : <p className="tiny mb12">No curated gap brief for this cell yet – you can still start a project.</p>}<Btn kind="primary" onClick={startCell}>Start a research project on this gap</Btn></div></div></Card>}
    <Section title="Prioritised gap briefs" sub="Curated by priority score"><Card pad={false}>{gaps.map(g => <Link key={g.id} href={hrefFor('researcher', g.id)!} className="erow"><div style={{ width: 54 }}><div className="tiny">Priority</div><b style={{ fontSize: 20, color: 'var(--accent)' }}>{g.score}</b></div><div className="grow"><div className="t1">{g.title}</div><div className="t2">{g.theme} · {g.region} · {g.evidenceCount} existing {g.evidenceCount === 1 ? 'study' : 'studies'}</div></div><span className="arrow">→</span></Link>)}</Card></Section></>;
}
export function GapDetail({ id }: { id: string }) {
  useStoreVersion(); const router = useRouter(); const g = getEntity<Gap>(id); if (!g || g.kind !== 'gap') return <NotFoundRecord role="researcher" module="gaps" />;
  return <div><BackLink role="researcher" module="gaps" label="Research Gap Finder" />
    <PageHead eyebrow={`Research gap · ${g.theme} · ${g.region}`} title={g.title} desc={g.why} actions={<Btn kind="primary" onClick={() => { const pid = startProjectFromGap(g.id); if (pid) router.push(`/portal/researcher/projects/${pid}`); }}>Start a project on this gap</Btn>} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <div className="grid g3"><Stat label="Priority score" value={g.score} foot="0–100" /><Stat label="Existing studies" value={g.evidenceCount} foot="in this theme & region" /><Stat label="Linked policy problems" value={g.problems.length} foot="evidence demand" /></div>
      <Card><h2 className="h2 mb8">Suggested research questions</h2><Bullets items={g.questions} /></Card>
      <Card pad={false}><CardHead title="Datasets you could use" /><EntityList ids={g.datasets} /></Card>
      <Card pad={false}><CardHead title="Related research" /><EntityList ids={g.research} /></Card></div>
      <div className="col" style={{ gap: 16 }}><Card><div className="h3 mb8">Explore the area</div><div className="col"><Btn kind="primary" href={gisHref('researcher', { region: g.gisRegion, layer: g.layer })}>⌖ Open {regionName(g.gisRegion)} in GIS Workspace</Btn><Btn href={modHref('researcher', 'datasets')}>Browse datasets</Btn><Btn href={modHref('researcher', 'library')}>Search the literature</Btn></div></Card>
        <Card pad={false}><CardHead title="Policy demand" sub="Problems that need this evidence" /><div className="card-body">{g.problems.map(pid => { const p = getEntity(pid); return p && p.kind === 'problem' ? <div key={pid} className="mb8"><b>{p.title}</b><div className="tiny">{p.owner} · stage: {p.stage}</div></div> : null; })}</div></Card></div></div></div>;
}

// ---------------------------------------------------------------- Collaboration
const NO_THREADS: never[] = [];
export function CollabList() {
  useStoreVersion(); const teams = ofKind('team'); const joined = useStore(s => s.joined);
  return <><PageHead eyebrow="Research" title="Collaboration" desc="Team workspaces share projects and data. Open one to read discussion threads, post a message and respond to peer-review requests." />
    <div className="grid g3">{teams.map(t => <Link key={t.id} href={hrefFor('researcher', t.id)!} className="card ecard"><div className="row between"><span className="eyebrow">{t.members.length} members</span>{joined.includes(t.id) && <Badge tone="good">Joined</Badge>}</div><div className="t1">{t.title}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{t.purpose}</p><div className="tiny">{t.projects.length} projects · {t.threads.length} threads · {t.reviews.filter(r => r.status === 'Requested').length} reviews waiting</div></Link>)}</div></>;
}
export function CollabDetail({ id }: { id: string }) {
  useStoreVersion(); const t = getEntity<Team>(id); const extraRaw = useStore(s => s.threads[id]); const extra = extraRaw ?? NO_THREADS; const rev = useStore(s => s.reviews); const joined = useStore(s => s.joined.includes(id)); const [msg, setMsg] = useState('');
  if (!t || t.kind !== 'team') return <NotFoundRecord role="researcher" module="collab" />;
  const threads = [...t.threads, ...extra]; const post = () => { update(s => ({ ...s, threads: { ...s.threads, [id]: [...(s.threads[id] ?? []), { id: uid('T'), author: 'Dr. Suresh Iyer (you)', when: today(), text: msg.trim() }] } })); logActivity(`Posted in ${t.title}`, `/portal/researcher/collab/${id}`, 'researcher'); setMsg(''); };
  return <div><BackLink role="researcher" module="collab" label="Collaboration" />
    <PageHead eyebrow="Team workspace" title={t.title} desc={t.purpose} actions={<Btn kind={joined ? '' : 'primary'} onClick={() => update(s => ({ ...s, joined: joined ? s.joined.filter(x => x !== id) : [...s.joined, id] }))}>{joined ? '✓ Joined – leave' : 'Join team'}</Btn>} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card pad={false}><CardHead title={`Discussion (${threads.length})`} />{threads.map(th => <div key={th.id} className="erow"><div className="avatar">{th.author.split(' ').map(x => x[0]).slice(0, 2).join('')}</div><div className="grow"><div className="t1">{th.author} <span className="tiny" style={{ fontWeight: 400 }}>· {th.when}</span></div><div style={{ fontSize: 13 }}>{th.text}</div></div></div>)}
        <div className="card-body"><div className="field"><label htmlFor="msg">Post a message</label><textarea id="msg" className="textarea" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Share an update or ask a question…" /></div><Btn kind="primary" disabled={msg.trim().length < 3} onClick={post}>Post</Btn></div></Card>
      <Card pad={false}><CardHead title={`Peer-review requests (${t.reviews.length})`} />{t.reviews.length ? t.reviews.map(r => { const st = rev[`${id}:${r.id}`] ?? r.status; return <div key={r.id} className="erow" style={{ alignItems: 'center' }}><div className="grow"><div className="t1">{r.item}</div><div className="t2">Requested by {r.requester}</div></div><Badge tone={st === 'Approved' ? 'good' : st === 'Changes requested' ? 'warn' : 'info'}>{st}</Badge><div className="row"><Btn size="sm" onClick={() => update(s => ({ ...s, reviews: { ...s.reviews, [`${id}:${r.id}`]: 'Approved' } }))}>Approve</Btn><Btn size="sm" onClick={() => update(s => ({ ...s, reviews: { ...s.reviews, [`${id}:${r.id}`]: 'Changes requested' } }))}>Request changes</Btn></div></div>; }) : <Empty>No review requests.</Empty>}</Card></div>
      <div className="col" style={{ gap: 16 }}><Card pad={false}><CardHead title="Members" />{t.members.map(m => <div key={m.name} className="erow"><div className="avatar">{m.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div><div className="grow"><div className="t1">{m.name}</div><div className="t2">{m.role} · {m.org}</div></div></div>)}</Card><Card pad={false}><CardHead title="Shared projects" /><EntityList ids={t.projects} /></Card><Card pad={false}><CardHead title="Shared datasets" /><EntityList ids={t.datasets} /></Card></div></div></div>;
}

// ---------------------------------------------------------------- Publish & case studies
export function PublishModule() {
  useStoreVersion(); const [tab, setTab] = useState<'pubs' | 'cases'>('pubs'); const [open, setOpen] = useState(false); const pubs = ofKind('publication');
  return <><PageHead eyebrow="Outputs" title="Publish & Case Studies" desc="Package findings as papers, briefs and datasets, and turn implementation experience into structured case studies." actions={<Btn kind="primary" onClick={() => setOpen(true)}>+ New publication</Btn>} />
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'pubs', label: 'My publications', n: pubs.length }, { id: 'cases', label: 'Case studies', n: ofKind('case').length }]} />
    {tab === 'pubs' ? <Card pad={false}>{pubs.map(p => <Link key={p.id} href={hrefFor('researcher', p.id)!} className="erow"><div className="grow"><div className="kind">{p.type} · {p.id}</div><div className="t1">{p.title}</div><div className="t2">{p.authors} · {p.date} · project {p.project}</div></div>{p.userCreated && <Badge tone="good">New</Badge>}<Badge tone={p.status === 'Published' ? 'good' : p.status === 'In review' ? 'info' : ''}>{p.status}</Badge><span className="arrow">→</span></Link>)}</Card> : <CasesList role="researcher" />}
    {open && <NewPublication onClose={() => setOpen(false)} />}</>;
}
function NewPublication({ onClose }: { onClose: () => void }) {
  const router = useRouter(); const active = useStore(s => s.activeProject); const projects = ofKind('research'); const [project, setProject] = useState(active); const [type, setType] = useState<Publication['type']>('Working paper'); const [title, setTitle] = useState('');
  return <Modal title="New publication" onClose={onClose} foot={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" disabled={title.trim().length < 5} onClick={() => { const id = createPublication({ project, type, title: title.trim() }); router.push(`/portal/researcher/publish/${id}`); }}>Create draft</Btn></>}>
    <Field label="From project" hint="The draft is pre-filled with the project’s question, methods, datasets and findings"><select className="select" value={project} onChange={e => setProject(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select></Field>
    <div className="grid g2"><Field label="Type"><select className="select" value={type} onChange={e => setType(e.target.value as Publication['type'])}>{(['Journal paper', 'Policy brief', 'Working paper', 'Dataset release', 'Case study draft'] as const).map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Title"><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field></div></Modal>;
}
export function PublicationDetail({ id }: { id: string }) {
  useStoreVersion(); const router = useRouter(); const p = getEntity<Publication>(id); const [edit, setEdit] = useState(false); const [abs, setAbs] = useState(''); const [secs, setSecs] = useState<{ h: string; p: string }[]>([]);
  if (!p || p.kind !== 'publication') return <NotFoundRecord role="researcher" module="publish" />;
  const proj = getEntity(p.project);
  return <div><BackLink role="researcher" module="publish" label="Publish & Case Studies" />
    <PageHead eyebrow={`${p.type} · ${p.id}`} title={p.title} desc={`${p.authors} · ${p.date}`} actions={<><Badge tone={p.status === 'Published' ? 'good' : p.status === 'In review' ? 'info' : ''}>{p.status}</Badge><ProvBadge p={p.provenance} /></>} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><h2 className="h2 mb8">Abstract</h2>{edit ? <textarea className="textarea" value={abs} onChange={e => setAbs(e.target.value)} /> : <p>{p.abstract}</p>}</Card>
      {(edit ? secs : p.sections).map((s, i) => <Card key={i}><h2 className="h2 mb8">{s.h}</h2>{edit ? <textarea className="textarea" value={s.p} onChange={e => setSecs(secs.map((x, j) => j === i ? { ...x, p: e.target.value } : x))} /> : <p>{s.p}</p>}</Card>)}
      <div className="row">{edit ? <><Btn kind="primary" onClick={() => { patchPublication(id, { abstract: abs, sections: secs }); setEdit(false); }}>Save changes</Btn><Btn onClick={() => setEdit(false)}>Cancel</Btn></> : p.status !== 'Published' && <Btn onClick={() => { setAbs(p.abstract); setSecs(p.sections.map(s => ({ ...s }))); setEdit(true); }}>Edit draft</Btn>}</div></div>
      <div className="col" style={{ gap: 16 }}><Card><div className="h3 mb8">Publishing workflow</div><div className="col">
        {p.status === 'Draft' && <Btn kind="primary" onClick={() => patchPublication(id, { status: 'In review' })}>Submit for review</Btn>}
        {p.status === 'In review' && <><Btn kind="primary" onClick={() => patchPublication(id, { status: 'Published', date: today() })}>Mark as published</Btn><Btn onClick={() => patchPublication(id, { status: 'Draft' })}>Return to draft</Btn></>}
        {p.status === 'Published' && <Notice tone="good">Published {p.date}.</Notice>}
        {p.type === 'Case study draft' && p.status !== 'Published' && <Btn onClick={() => { const cid = caseFromPublication(id); if (cid) router.push(`/portal/researcher/publish/${cid}`); }}>Publish as case study</Btn>}</div></Card>
        <Card pad={false}><CardHead title="Source" /><div className="card-body">{proj && <EntityLink id={p.project} />}</div></Card><Card pad={false}><CardHead title="Datasets cited" /><EntityList ids={p.datasets} /></Card></div></div></div>;
}
export { KV, DataTable, allEntities, Field };
