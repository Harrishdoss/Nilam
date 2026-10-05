'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Role, Opportunity } from '@/lib/types';
import { getEntity, ofKind, hrefFor, KIND_LABEL } from '@/lib/registry';
import { Badge, Btn, Card, CardHead, DataTable, EntityList, Field, KV, Modal, Notice, PageHead, Bullets, Empty, ProvBadge } from '@/components/ui';
import { THEMES } from '@/lib/data/datasets';
import { logActivity, today, uid, update, useStore, useStoreVersion } from '@/lib/store';
import { BackLink } from './shared';
import { NotFoundRecord } from './records';

const TYPES: Opportunity['type'][] = ['Innovation challenge', 'Research grant', 'Pilot call', 'Fellowship', 'Hackathon'];
const tone = (s: string) => s === 'Open' ? 'good' : s === 'Closing soon' ? 'warn' : '';

export function OpportunitiesList({ role }: { role: Role }) {
  useStoreVersion(); const [type, setType] = useState(''); const [open, setOpen] = useState(false); const apps = useStore(s => s.applications);
  const mod = role === 'government' ? 'innovation' : 'grants'; const all = ofKind('opportunity'); const rows = all.filter(o => !type || o.type === type);
  return <><PageHead eyebrow={role === 'government' ? 'Knowledge' : 'Opportunities'} title={role === 'government' ? 'Innovation Hub' : 'Grants & Challenges'} desc={role === 'government' ? 'Post challenges and pilot calls tied to a policy problem, and review the submissions you receive.' : 'Research grants, hackathons and government challenges. Open one to read the brief and apply.'} actions={role === 'government' ? <Btn kind="primary" onClick={() => setOpen(true)}>+ Post a challenge</Btn> : undefined} />
    <div className="chips mb12"><button className={`chip ${!type ? 'on' : ''}`} onClick={() => setType('')}>All · {all.length}</button>{TYPES.map(t => <button key={t} className={`chip ${type === t ? 'on' : ''}`} aria-pressed={type === t} onClick={() => setType(type === t ? '' : t)}>{t} · {all.filter(o => o.type === t).length}</button>)}</div>
    <div className="grid g3">{rows.map(o => { const n = apps.filter(a => a.opportunity === o.id).length; return <Link key={o.id} href={`/portal/${role}/${mod}/${o.id}`} className="card ecard"><div className="row between"><span className="eyebrow">{o.type}</span><Badge tone={tone(o.status)}>{o.status}</Badge></div><div className="t1">{o.title}</div><div className="tiny">{o.sponsor}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{o.summary}</p><div className="row between tiny mt4"><span>Closes: <b>{o.deadline}</b></span>{n > 0 && <Badge tone="info">{n} application{n > 1 ? 's' : ''}</Badge>}</div></Link>; })}</div>
    {rows.length === 0 && <Card><Empty>Nothing in this category.</Empty></Card>}
    {open && <NewChallenge onClose={() => setOpen(false)} />}</>;
}
function NewChallenge({ onClose }: { onClose: () => void }) {
  const problems = ofKind('problem'); const [t, setT] = useState(''); const [type, setType] = useState<Opportunity['type']>('Innovation challenge'); const [pid, setPid] = useState(problems[0]?.id ?? ''); const [deadline, setDeadline] = useState('2026-12-31'); const [sum, setSum] = useState(''); const [created, setCreated] = useState<string | null>(null);
  function create() { const p = getEntity(pid); const id = uid('OP'); const o: Opportunity = { kind: 'opportunity', id, title: t.trim(), provenance: 'demo', type, sponsor: 'Your department (demo)', deadline, status: 'Open', amount: 'To be announced', summary: sum.trim(), eligibility: ['Researchers, startups, civil-society groups'], deliverables: ['Proposal', 'Pilot design'], themes: p && p.kind === 'problem' ? [p.theme] : [THEMES[0]], problems: pid ? [pid] : [], datasets: p && p.kind === 'problem' ? p.datasets.slice(0, 3) : [] }; update(s => ({ ...s, opps: [o, ...s.opps] })); logActivity(`Posted challenge “${o.title}”`, `/portal/government/innovation/${id}`, 'government'); setCreated(id); }
  return <Modal title="Post a challenge" onClose={onClose} foot={created ? <Btn kind="primary" href={`/portal/government/innovation/${created}`}>Open challenge →</Btn> : <><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" onClick={create} disabled={t.trim().length < 5 || sum.trim().length < 10}>Publish challenge</Btn></>}>
    {created ? <Notice tone="good">Challenge published. It is now visible to researchers under Grants &amp; Challenges.</Notice> : <><Field label="Title"><input className="input" value={t} onChange={e => setT(e.target.value)} /></Field><div className="grid g2"><Field label="Type"><select className="select" value={type} onChange={e => setType(e.target.value as Opportunity['type'])}>{TYPES.map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Deadline"><input className="input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></Field></div>
      <Field label="Linked policy problem"><select className="select" value={pid} onChange={e => setPid(e.target.value)}>{problems.map(p => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select></Field><Field label="Summary"><textarea className="textarea" value={sum} onChange={e => setSum(e.target.value)} /></Field></>}</Modal>;
}

export function OpportunityDetail({ role, id }: { role: Role; id: string }) {
  useStoreVersion(); const o = getEntity<Opportunity>(id); const apps = useStore(s => s.applications); const status = useStore(s => s.appStatus);
  const mod = role === 'government' ? 'innovation' : 'grants'; const [form, setForm] = useState(false);
  if (!o || o.kind !== 'opportunity') return <NotFoundRecord role={role} module={mod} />;
  const mine = apps.filter(a => a.opportunity === id);
  return <div><BackLink role={role} module={mod} label={role === 'government' ? 'Innovation Hub' : 'Grants & Challenges'} />
    <PageHead eyebrow={`${o.type} · ${o.id}`} title={o.title} desc={o.summary} actions={<><Badge tone={tone(o.status)}>{o.status}</Badge><ProvBadge p={o.provenance} />{role === 'researcher' && o.status !== 'Reference programme' && <Btn kind="primary" onClick={() => setForm(true)}>Apply</Btn>}</>} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><KV items={[['Sponsor', o.sponsor], ['Deadline', o.deadline], ['Funding / prize', o.amount], ['Themes', o.themes.join(', ')]]} /></Card>
      <div className="grid g2"><Card><h2 className="h2 mb8">Who can apply</h2><Bullets items={o.eligibility} /></Card><Card><h2 className="h2 mb8">Deliverables</h2><Bullets items={o.deliverables} /></Card></div>
      {o.status === 'Reference programme' && <Notice>Reference listing of a real programme – check the official notice for dates and terms. Applications cannot be submitted here.</Notice>}
      <Card pad={false}><CardHead title={role === 'government' ? `Submissions (${mine.length})` : `Your applications (${mine.length})`} />
        {mine.length === 0 ? <Empty>{role === 'government' ? 'No submissions yet.' : 'You have not applied yet.'}</Empty> : <DataTable rows={mine} rowKey={a => a.id} cols={[{ key: 'n', label: 'Applicant', render: a => <div><b>{a.name}</b><div className="tiny">{a.org}</div></div> }, { key: 'p', label: 'Pitch', render: a => <span style={{ fontSize: 13 }}>{a.pitch}</span> }, { key: 'd', label: 'Submitted', render: a => a.created }, { key: 's', label: 'Status', render: a => { const st = status[a.id] ?? a.status; return role === 'government' ? <div className="row"><Badge tone={st === 'Shortlisted' ? 'good' : st === 'Declined' ? 'bad' : ''}>{st}</Badge><Btn size="sm" onClick={() => update(s => ({ ...s, appStatus: { ...s.appStatus, [a.id]: 'Shortlisted' } }))}>Shortlist</Btn><Btn size="sm" onClick={() => update(s => ({ ...s, appStatus: { ...s.appStatus, [a.id]: 'Declined' } }))}>Decline</Btn></div> : <Badge tone={st === 'Shortlisted' ? 'good' : st === 'Declined' ? 'bad' : ''}>{st}</Badge>; } }]} />}</Card></div>
      <div className="col" style={{ gap: 16 }}><Card pad={false}><CardHead title="Policy problems" /><EntityList ids={o.problems} /></Card><Card pad={false}><CardHead title="Data provided" /><EntityList ids={o.datasets} /></Card></div></div>
    {form && <Apply o={o} onClose={() => setForm(false)} />}</div>;
}
function Apply({ o, onClose }: { o: Opportunity; onClose: () => void }) {
  const [name, setName] = useState('Dr. Suresh Iyer'); const [org, setOrg] = useState('Institute for Governance Research'); const [pitch, setPitch] = useState(''); const [done, setDone] = useState(false);
  return <Modal title={`Apply: ${o.title}`} onClose={onClose} foot={done ? <Btn kind="primary" onClick={onClose}>Done</Btn> : <><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" disabled={pitch.trim().length < 15 || !name.trim()} onClick={() => { update(s => ({ ...s, applications: [{ id: uid('AP'), opportunity: o.id, name, org, pitch: pitch.trim(), created: today(), status: 'Submitted' }, ...s.applications] })); logActivity(`Applied to ${o.title}`, `/portal/researcher/grants/${o.id}`, 'researcher'); setDone(true); }}>Submit application</Btn></>}>
    {done ? <Notice tone="good">Application submitted. It now appears under “Your applications” here and in the sponsor’s submissions list in the Government portal.</Notice> : <><Field label="Applicant / team lead"><input className="input" value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Organisation"><input className="input" value={org} onChange={e => setOrg(e.target.value)} /></Field><Field label="Pitch (what you will do)" hint="At least 15 characters"><textarea className="textarea" value={pitch} onChange={e => setPitch(e.target.value)} /></Field></>}</Modal>;
}
export { KIND_LABEL, hrefFor };
