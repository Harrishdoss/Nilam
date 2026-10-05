'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Role } from '@/lib/types';
import { search, KIND_LABEL, hrefFor, ofKind, modules, entityMeta } from '@/lib/registry';
import { searchRegions, regionById } from '@/lib/geo';
import { Badge, Btn, Card, CardHead, DataTable, Empty, Notice, PageHead, ProvBadge, Section } from '@/components/ui';
import { resetStore, useStoreVersion } from '@/lib/store';
import { gisHref } from '@/lib/registry';

export function SearchPage({ role }: { role: Role }) {
  useStoreVersion(); const sp = useSearchParams(); const router = useRouter(); const q = sp.get('q') ?? ''; const [text, setText] = useState(q);
  const hits = q ? search(role, q) : []; const regions = q ? searchRegions(q, 6) : [];
  const groups = [...new Set(hits.map(h => h.e.kind))];
  return <><PageHead eyebrow="Search" title={q ? `Results for “${q}”` : 'Search Nilam'} desc={`Searching everything available to the ${role === 'government' ? 'Government' : role === 'researcher' ? 'Research' : 'Public'} portal.`} />
    <form className="filters" role="search" onSubmit={e => { e.preventDefault(); router.push(`/portal/${role}/search?q=${encodeURIComponent(text.trim())}`); }}><input type="search" aria-label="Search" style={{ minWidth: 320 }} value={text} onChange={e => setText(e.target.value)} placeholder="Search datasets, research, policies, places…" /><Btn type="submit" kind="primary">Search</Btn></form>
    {!q && <Card><Empty>Type a word such as “mutation”, “flood”, “ULPIN” or “Tamil Nadu”.</Empty></Card>}
    {q && regions.length > 0 && <Section title="Places"><div className="chips">{regions.map(r => <Link key={r.id} className="chip" href={gisHref(role, { region: r.id })}>{r.name} · {r.level === 'district' ? `district, ${regionById(r.parent!)?.name}` : r.ut ? 'UT' : 'state'}</Link>)}</div></Section>}
    {q && hits.length === 0 && regions.length === 0 && <Card><Empty>Nothing found for “{q}”. Try a broader word.</Empty></Card>}
    {groups.map(k => <Section key={k} title={`${KIND_LABEL[k]}s`}><Card pad={false}>{hits.filter(h => h.e.kind === k).slice(0, 8).map(h => <Link key={h.e.id} href={hrefFor(role, h.e.id)!} className="erow"><div className="grow"><div className="kind">{KIND_LABEL[h.e.kind]} · {h.e.id}</div><div className="t1">{h.e.title}</div><div className="t2">{entityMeta(h.e)}</div></div>{h.e.provenance === 'demo' && <Badge tone="demo">DEMO</Badge>}<span className="arrow">→</span></Link>)}</Card></Section>)}</>;
}

export function AboutData({ role }: { role: Role }) {
  useStoreVersion(); const [confirm, setConfirm] = useState(false); const ds = ofKind('dataset'); const router = useRouter();
  const nDemo = ds.filter(d => d.provenance === 'demo').length;
  return <><PageHead eyebrow="Transparency" title="Data & methods" desc="What is real, what is demo, and how the prototype computes what it shows." />
    <div className="grid g2">
      <Card><h2 className="h2 mb8">How data is labelled</h2><div className="col"><div><Badge tone="demo">DEMO DATA</Badge> <span style={{ fontSize: 13 }}>Synthetic prototype records – generated for demonstration. Never use for real decisions.</span></div><div><Badge tone="official">Official programme · summary</Badge> <span style={{ fontSize: 13 }}>A real programme, law or data system summarised in the prototype. The summary is not authoritative – verify against the official source. Any numbers shown for it inside the prototype are demo extracts unless explicitly labelled “reference figure”.</span></div></div></Card>
      <Card><h2 className="h2 mb8">Maps and boundaries</h2><ul className="list" style={{ fontSize: 13 }}><li>The national and district maps are <b>schematic tile maps</b>: one tile per State/UT or district, not to scale. They are not official boundaries.</li><li>The parcel view is a <b>procedurally generated demo village</b>. Its parcels are not cadastral boundaries and its “DEMO-” identifiers are not ULPINs.</li><li>Indicator values are generated deterministically from hand-set traits so the demo is repeatable.</li></ul></Card>
      <Card><h2 className="h2 mb8">Simulation method</h2><p style={{ fontSize: 13 }}>Each simulator starts from a baseline and applies an absolute change per unit of each lever, phased in with an exponential ramp. Coefficients are illustrative placeholders, shown with assumptions and limitations on every page. Replace them with research-derived estimates before real use.</p></Card>
      <Card><h2 className="h2 mb8">Your changes in this demo</h2><p style={{ fontSize: 13 }}>Everything you create (problems, scenarios, pilots, readings, responses, publications) is stored only in this browser. Reset to return to the original seed data.</p>{!confirm ? <Btn onClick={() => setConfirm(true)}>Reset demo data…</Btn> : <div className="row"><Notice tone="warn">This deletes everything you created in this browser.</Notice><Btn kind="primary" onClick={() => { resetStore(); setConfirm(false); router.push(`/portal/${role}/overview`); }}>Yes, reset</Btn><Btn onClick={() => setConfirm(false)}>Cancel</Btn></div>}</Card></div>
    <Section title={`Dataset provenance (${ds.length} datasets, ${nDemo} demo)`}><Card pad={false}><DataTable rows={ds} rowKey={d => d.id} cols={[{ key: 'id', label: 'ID', render: d => d.id }, { key: 't', label: 'Dataset', render: d => { const h = hrefFor(role, d.id); return h ? <Link className="link" href={h}>{d.title}</Link> : d.title; } }, { key: 'p', label: 'Status', render: d => <ProvBadge p={d.provenance} /> }, { key: 'a', label: 'Access', render: d => d.access }]} /></Card></Section>
    <Section title="Where to go"><div className="chips">{modules[role].map(m => <Link key={m.id} className="chip" href={`/portal/${role}/${m.id}`}>{m.label}</Link>)}</div></Section>
    <p className="tiny">Official anchors referenced: DILRMP, ULPIN / Bhu-Aadhaar, NAKSHA, SVAMITVA, the Registration Act 1908 / NGDRS, RFCTLARR Act 2013, CRZ Notification 2019.</p></>;
}
export { CardHead };
