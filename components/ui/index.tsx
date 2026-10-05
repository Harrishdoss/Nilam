'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Entity, Kind, Provenance } from '@/lib/types';
import { usePortal } from './portal-context';
import { useStoreVersion } from '@/lib/store';
import { KIND_LABEL, entityMeta, getEntity, hrefFor, relatedFor, lifecycle, STAGES, type Stage } from '@/lib/registry';

export { usePortal };

export function PageHead({ eyebrow, title, desc, actions }: { eyebrow?: string; title: string; desc?: ReactNode; actions?: ReactNode }) {
  return <div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="h1">{title}</h1>{desc && <p className="lead">{desc}</p>}</div>{actions && <div className="row no-print">{actions}</div>}</div>;
}
export const Card = ({ children, className = '', pad = true }: { children: ReactNode; className?: string; pad?: boolean }) => <div className={`card ${pad ? 'pad' : ''} ${className}`}>{children}</div>;
export function CardHead({ title, right, sub }: { title: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return <div className="card-head"><div><div className="h3">{title}</div>{sub && <div className="tiny">{sub}</div>}</div>{right && <div className="row">{right}</div>}</div>;
}
export function Section({ title, sub, right, children }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return <section className="mb16"><div className="row between mb8"><div><h2 className="h2">{title}</h2>{sub && <div className="tiny">{sub}</div>}</div>{right}</div>{children}</section>;
}
export function Stat({ label, value, foot, href }: { label: string; value: ReactNode; foot?: ReactNode; href?: string }) {
  const body = <><div className="l">{label}</div><div className="v">{value}</div>{foot && <div className="f">{foot}</div>}</>;
  return href ? <Link href={href} className="card stat stat-link">{body}</Link> : <div className="card stat">{body}</div>;
}
export const Badge = ({ children, tone = '' }: { children: ReactNode; tone?: 'good' | 'warn' | 'bad' | 'info' | 'accent' | 'demo' | 'official' | '' }) => <span className={`badge ${tone}`}>{children}</span>;
export const ProvBadge = ({ p }: { p: Provenance }) => p === 'demo' ? <Badge tone="demo">DEMO DATA</Badge> : <Badge tone="official">Official programme · summary</Badge>;
export function Btn({ children, onClick, href, kind = '', size = '', disabled, type = 'button', title }: { children: ReactNode; onClick?: () => void; href?: string; kind?: 'primary' | 'dark' | 'ghost' | ''; size?: 'sm' | 'lg' | ''; disabled?: boolean; type?: 'button' | 'submit'; title?: string }) {
  const cls = `btn ${kind} ${size}`;
  if (href && !disabled) return <Link href={href} className={cls} title={title}>{children}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}
export const Notice = ({ children, tone = '' }: { children: ReactNode; tone?: 'warn' | 'bad' | 'good' | '' }) => <div className={`notice ${tone}`}>{children}</div>;
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;
export const KV = ({ items }: { items: [string, ReactNode][] }) => <dl className="kv">{items.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
export const Bullets = ({ items }: { items: ReactNode[] }) => items.length ? <ul className="list">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : <div className="tiny">None recorded.</div>;
export function Progress({ value, lg }: { value: number; lg?: boolean }) { return <div className={`bar ${lg ? 'lg' : ''}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; n?: number }[]; value: T; onChange: (t: T) => void }) {
  return <div className="tabs" role="tablist">{tabs.map(t => <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'on' : ''}`} onClick={() => onChange(t.id)}>{t.label}{t.n !== undefined && <span className="n">{t.n}</span>}</button>)}</div>;
}
/** tab state kept in the URL hash so detail tabs are linkable */
export function useHashTab<T extends string>(valid: T[], def: T): [T, (t: T) => void] {
  const [t, setT] = useState<T>(def);
  useEffect(() => { const h = window.location.hash.replace('#', '') as T; if (valid.includes(h)) setT(h); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return [t, (n: T) => { setT(n); try { history.replaceState(null, '', `#${n}`); } catch { /* ignore */ } }];
}

export function Modal({ title, onClose, children, foot, lg }: { title: string; onClose: () => void; children: ReactNode; foot?: ReactNode; lg?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return <div className="modal-bg" onClick={onClose}><div className={`modal ${lg ? 'lg' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}><div className="modal-head"><div className="h2">{title}</div><button className="x" aria-label="Close" onClick={onClose}>×</button></div><div className="modal-body">{children}</div>{foot && <div className="modal-foot">{foot}</div>}</div></div>;
}
export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => <div className="field"><label>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>;

// ------------------------------------------------------------------ entity links
export function EntityLink({ id, children, kind = 'row' }: { id: string; children?: ReactNode; kind?: 'row' | 'chip' | 'inline' }) {
  const { role } = usePortal(); useStoreVersion();
  const e = getEntity(id); const href = hrefFor(role, id);
  if (!e) return <span className="tiny">{id}</span>;
  if (kind === 'inline') return href ? <Link href={href} className="link">{children ?? e.title}</Link> : <span>{children ?? e.title}</span>;
  if (kind === 'chip') return href ? <Link href={href} className="chip" title={e.title}>{children ?? shorten(e.title, 34)}</Link> : <span className="chip static" title={`${e.title} (not available in this portal)`}>{children ?? shorten(e.title, 34)}</span>;
  const body = <><div className="grow"><div className="kind">{KIND_LABEL[e.kind]} · {e.id}</div><div className="t1">{e.title}</div><div className="t2">{entityMeta(e)}</div></div>{e.provenance === 'demo' && <Badge tone="demo">DEMO</Badge>}{href && <span className="arrow" aria-hidden>→</span>}</>;
  return href ? <Link href={href} className="erow">{body}</Link> : <div className="erow">{body}</div>;
}
export const shorten = (s: string, n: number) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
export function EntityList({ ids, empty = 'Nothing linked yet.' }: { ids: string[]; empty?: string }) {
  if (!ids.length) return <div className="empty tiny">{empty}</div>;
  return <div>{ids.map(i => <EntityLink key={i} id={i} />)}</div>;
}
export function EntityCards({ ids, cols = 3 }: { ids: string[]; cols?: 2 | 3 | 4 }) {
  const { role } = usePortal(); useStoreVersion();
  if (!ids.length) return <div className="empty tiny">Nothing here yet.</div>;
  return <div className={`grid ${cols === 2 ? 'g2' : cols === 4 ? 'g4' : 'g3'}`}>{ids.map(i => { const e = getEntity(i); if (!e) return null; const href = hrefFor(role, i);
    const inner = <><div className="row between"><span className="kind eyebrow">{KIND_LABEL[e.kind]}</span>{e.provenance === 'demo' && <Badge tone="demo">DEMO</Badge>}</div><div className="t1">{e.title}</div><div className="tiny">{entityMeta(e)}</div></>;
    return href ? <Link key={i} href={href} className="card ecard">{inner}</Link> : <div key={i} className="card ecard">{inner}</div>; })}</div>;
}

/** Generic "connected records" panel: everything linked to an entity, grouped by type and openable in this portal */
export function RelatedPanel({ id, kinds, title = 'Connected records', max = 8 }: { id: string; kinds?: Kind[]; title?: string; max?: number }) {
  const { role } = usePortal(); useStoreVersion();
  const groups = useMemo(() => { const rel = relatedFor(role, id, kinds); const m = new Map<Kind, Entity[]>(); rel.forEach(e => m.set(e.kind, [...(m.get(e.kind) ?? []), e])); return [...m.entries()]; }, [role, id, kinds]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="card"><CardHead title={title} sub="Everything in Nilam linked to this record" />
    {groups.length === 0 ? <Empty>No linked records are available in this portal.</Empty> : groups.map(([k, list]) => <div key={k}><div className="tiny" style={{ padding: '8px 14px 0', fontWeight: 700 }}>{KIND_LABEL[k]}s ({list.length})</div>{list.slice(0, max).map(e => <EntityLink key={e.id} id={e.id} />)}</div>)}</div>;
}

/** The platform's spine: DATA → RESEARCH → EVIDENCE → POLICY → SIMULATION → PILOT → EVALUATION → KNOWLEDGE */
export function Lifecycle({ problemId, current }: { problemId: string; current?: Stage }) {
  useStoreVersion();
  const lc = lifecycle(problemId); const [open, setOpen] = useState<Stage | null>(current ?? null);
  return <div className="no-print"><div className="life" role="list">{STAGES.map((s, i) => { const items = lc[s]; const cls = `life-step ${items.length ? 'has' : 'empty-s'} ${open === s ? 'cur' : ''}`;
    return <button key={s} role="listitem" className={cls} onClick={() => setOpen(open === s ? null : s)} aria-expanded={open === s}><div className="n">{i + 1}</div><div className="nm">{s}</div><div className="ct">{items.length ? `${items.length} linked` : 'none yet'}</div></button>; })}</div>
    {open && <div className="life-detail"><div className="tiny" style={{ padding: '8px 14px' }}><b>{open}</b> – records linked to this problem</div><EntityList ids={lc[open].map(e => e.id)} empty={`Nothing at the ${open.toLowerCase()} stage yet.`} /></div>}</div>;
}

// ------------------------------------------------------------------ table
export interface Col<T> { key: string; label: string; render: (r: T) => ReactNode; sort?: (r: T) => string | number; num?: boolean }
export function DataTable<T>({ rows, cols, onRow, rowKey, empty = 'No records match the filters.', initialSort }: { rows: T[]; cols: Col<T>[]; onRow?: (r: T) => void; rowKey: (r: T) => string; empty?: string; initialSort?: { key: string; dir: 1 | -1 } }) {
  const [sort, setSort] = useState(initialSort ?? { key: '', dir: 1 as 1 | -1 });
  const sorted = useMemo(() => { const c = cols.find(x => x.key === sort.key); if (!c?.sort) return rows; return [...rows].sort((a, b) => { const x = c.sort!(a), y = c.sort!(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; }); }, [rows, sort, cols]);
  if (!rows.length) return <Empty>{empty}</Empty>;
  return <div className="table-wrap"><table className="t"><thead><tr>{cols.map(c => <th key={c.key} className={`${c.sort ? 'sortable' : ''} ${c.num ? 'num' : ''}`} onClick={() => c.sort && setSort(s => ({ key: c.key, dir: s.key === c.key ? (-s.dir as 1 | -1) : 1 }))} aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>{c.label}{sort.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</th>)}</tr></thead>
    <tbody>{sorted.map(r => <tr key={rowKey(r)} className={onRow ? 'click' : ''} onClick={() => onRow?.(r)}>{cols.map(c => <td key={c.key} className={c.num ? 'num' : ''}>{c.render(r)}</td>)}</tr>)}</tbody></table></div>;
}
/** Download helper (creates a real file in the browser) */
export function download(name: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
}
export const csvCell = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const useQueryFilter = <T extends string>(init: T) => useState<T>(init);
