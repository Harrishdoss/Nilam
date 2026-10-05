'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Role } from '@/lib/types';
import { ofKind, getEntity, hrefFor, KIND_LABEL } from '@/lib/registry';
import { Btn, Modal, Field, Notice, Badge } from '@/components/ui';
import { addDatasetToProject, addToProblem } from '@/lib/actions';
import { useStore, useStoreVersion } from '@/lib/store';

/** Government: add a record to a policy problem's evidence base */
export function AddToProblem({ id, size = 'sm', kind = '' }: { id: string; size?: 'sm' | ''; kind?: '' | 'primary' }) {
  useStoreVersion(); const [open, setOpen] = useState(false); const [pid, setPid] = useState(''); const [msg, setMsg] = useState<{ ok: boolean; text: string; href?: string } | null>(null);
  const problems = ofKind('problem'); const e = getEntity(id);
  function go() {
    if (!pid) return; const ok = addToProblem(pid, id); const p = getEntity(pid);
    setMsg(ok ? { ok: true, text: `Added to “${p?.title}”.`, href: `/portal/government/problems/${pid}#evidence` } : { ok: false, text: 'This record is already in that problem’s evidence base (or cannot be added).' });
  }
  return <>
    <Btn size={size} kind={kind} onClick={() => { setOpen(true); setMsg(null); }}>+ Add to policy problem</Btn>
    {open && <Modal title="Add to a policy problem" onClose={() => setOpen(false)} foot={<><Btn onClick={() => setOpen(false)}>Close</Btn><Btn kind="primary" onClick={go} disabled={!pid}>Add</Btn></>}>
      <p className="tiny mb12">Adds <b>{e?.title}</b> to the evidence base of the problem you choose. It then appears in that problem’s Evidence tab and brief.</p>
      <Field label="Policy problem"><select className="select" value={pid} onChange={e2 => { setPid(e2.target.value); setMsg(null); }}><option value="">Select a problem…</option>{problems.map(p => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}</select></Field>
      {msg && <Notice tone={msg.ok ? 'good' : 'warn'}>{msg.text} {msg.href && <Link className="link" href={msg.href}>Open problem →</Link>}</Notice>}
    </Modal>}
  </>;
}

/** Researcher: add dataset to the active project */
export function AddToProject({ id }: { id: string }) {
  useStoreVersion(); const active = useStore(s => s.activeProject); const p = getEntity(active); const [done, setDone] = useState<null | boolean>(null);
  const has = p && p.kind === 'research' && p.datasets.includes(id);
  return <div className="col" style={{ gap: 6 }}><Btn kind="primary" disabled={!!has} onClick={() => setDone(addDatasetToProject(active, id))}>{has ? '✓ In active project' : `+ Add to ${active}`}</Btn>
    {(has || done) && <div className="tiny">In <Link className="link" href={`/portal/researcher/projects/${active}#data`}>{p?.title}</Link></div>}</div>;
}

export function RequestAccess({ id }: { id: string }) {
  const req = useStore(s => s.access[id]); const [open, setOpen] = useState(false); const [purpose, setPurpose] = useState('');
  if (req) return <Notice tone="good">Access requested on {req.created} – status: <b>Pending review (demo)</b>.<div className="tiny mt4">Purpose: {req.purpose}</div></Notice>;
  return <>
    <Btn onClick={() => setOpen(true)}>Request access</Btn>
    {open && <Modal title="Request dataset access" onClose={() => setOpen(false)} foot={<><Btn onClick={() => setOpen(false)}>Cancel</Btn><Btn kind="primary" disabled={purpose.trim().length < 5} onClick={() => { import('@/lib/store').then(m => m.update(s => ({ ...s, access: { ...s.access, [id]: { purpose: purpose.trim(), created: m.today() } } }))); setOpen(false); }}>Submit request</Btn></>}>
      <p className="tiny mb12">Restricted datasets are shared by the custodian after review. In this demo the request is recorded locally.</p>
      <Field label="Purpose of use"><textarea className="textarea" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Evaluate mutation delays in two districts for RP-02" /></Field></Modal>}
  </>;
}

export const ProvLine = ({ p }: { p: 'demo' | 'official-reference' }) => p === 'demo' ? <Badge tone="demo">DEMO DATA</Badge> : <Badge tone="official">Official programme · summary</Badge>;
export function BackLink({ role, module, label }: { role: Role; module: string; label: string }) { return <Link href={`/portal/${role}/${module}`} className="link tiny no-print">← {label}</Link>; }
export { hrefFor, KIND_LABEL };
