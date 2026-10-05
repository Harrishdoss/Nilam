'use client';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Role } from '@/lib/types';
import { modules, roleMeta, moduleDef, getEntity, ofKind, ROLES } from '@/lib/registry';
import { signOut, useSession } from '@/lib/auth';
import { update, useStore, useStoreVersion } from '@/lib/store';
import { PortalContext } from '@/components/ui/portal-context';
import { Modal, Btn } from '@/components/ui';
import { GUIDE } from '@/components/shell/guide';

const PUB_SHORT: Record<string, string> = { overview: 'Home', atlas: 'Land Atlas', research: 'Research', policy: 'Policy Explainers', insights: 'State Insights', data: 'Public Data', consultations: 'Consultations', schemes: 'Programmes' };
const HIDDEN_LABEL: Record<string, string> = { search: 'Search results', about: 'Data & methods' };

export default function PortalFrame({ role, children }: { role: Role; children: ReactNode }) {
  const session = useSession(); const router = useRouter(); const path = usePathname();
  useEffect(() => { if (session === null) router.replace(`/login?next=${encodeURIComponent(path)}`); else if (session && !session.roles.includes(role)) router.replace('/login'); }, [session, role, router, path]);
  if (!session || !session.roles.includes(role)) return <div className="empty" style={{ padding: 80 }}>Checking your session…</div>;
  return <PortalContext.Provider value={{ role }}><Shell role={role}>{children}</Shell></PortalContext.Provider>;
}

function Crumbs({ role, className = '' }: { role: Role; className?: string }) {
  const path = usePathname(); useStoreVersion();
  const [, , , mod, id] = path.split('/'); const items: { label: string; href?: string }[] = [{ label: 'Nilam', href: `/portal/${role}/overview` }];
  if (mod && mod !== 'overview') {
    const label = moduleDef(role, mod)?.label ?? HIDDEN_LABEL[mod] ?? mod;
    items.push({ label, href: id ? `/portal/${role}/${mod}` : undefined });
    if (id) items.push({ label: getEntity(id)?.title ?? decodeURIComponent(id) });
  } else items.push({ label: moduleDef(role, 'overview')!.label });
  return <nav className={`crumbs ${className}`} aria-label="Breadcrumb">{items.map((it, i) => <span key={i} className="row" style={{ gap: 6 }}>{i > 0 && <span className="sep">/</span>}{it.href ? <Link href={it.href}>{it.label}</Link> : <span className="cur">{it.label}</span>}</span>)}</nav>;
}

function DemoStrip({ role }: { role: Role }) {
  return <div className="demo-strip no-print"><b>DEMO PROTOTYPE</b> · All figures, boundaries and records are synthetic unless labelled “official programme”. Not for real decisions. <Link href={`/portal/${role}/about`} className="link">Data &amp; methods →</Link></div>;
}

function SearchBox({ role }: { role: Role }) {
  const router = useRouter(); const [q, setQ] = useState('');
  return <form className="topsearch no-print" role="search" onSubmit={e => { e.preventDefault(); router.push(`/portal/${role}/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}><input aria-label="Search Nilam" placeholder="Search datasets, research, policies…" value={q} onChange={e => setQ(e.target.value)} /><button className="btn sm primary" type="submit">Search</button></form>;
}

function UserBox({ role }: { role: Role }) {
  const session = useSession(); const router = useRouter(); const [guide, setGuide] = useState(false);
  if (!session) return null; const g = GUIDE[role];
  return <div className="userbox no-print">
    <button className="btn sm" onClick={() => setGuide(true)} aria-haspopup="dialog">Guide</button>
    {session.roles.length > 1 && <Link className="btn sm" href="/login">Switch portal</Link>}
    <div className="avatar" title={session.name}>{session.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div>
    <button className="btn sm" onClick={() => { signOut(); router.push('/login'); }}>Sign out</button>
    {guide && <Modal title={g.title} lg onClose={() => setGuide(false)} foot={<Btn onClick={() => setGuide(false)} kind="primary">Close</Btn>}>
      <p>{g.intro}</p><h3 className="h3 mt16">Suggested walk-through</h3><ol className="list">{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <h3 className="h3 mt16">Reading the data labels</h3><p><span className="badge demo">DEMO DATA</span> marks synthetic prototype records. <span className="badge official">Official programme · summary</span> marks a real programme or law that is summarised here (verify details against the official source).</p></Modal>}
  </div>;
}

function Shell({ role, children }: { role: Role; children: ReactNode }) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const meta = roleMeta[role]; const [, , , mod] = path.split('/'); const active = mod || 'overview';
  const groups = [...new Set(modules[role].map(m => m.section))];
  const sessionName = useSession()?.name ?? '';

  if (role === 'public') return <div className="shell-pub theme-public">
    <DemoStrip role={role} />
    <header className="pub-head"><div className="pub-head-in">
      <Link href="/portal/public/overview" className="brand"><div className="brand-mark">Ni</div><div><div className="brand-name">Nilam</div><div className="brand-sub">Land knowledge for everyone</div></div></Link>
      <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
      <nav className={`pub-nav ${open ? 'open' : ''}`} aria-label="Main">{modules.public.map(m => <Link key={m.id} href={`/portal/public/${m.id}`} className={active === m.id ? 'active' : ''} aria-current={active === m.id ? 'page' : undefined}>{PUB_SHORT[m.id]}</Link>)}</nav>
      <UserBox role={role} />
    </div></header>
    <div className="pub-crumbs"><Crumbs role={role} /></div>
    <main className="pub-main"><Suspense fallback={<div className="empty">Loading…</div>}>{children}</Suspense></main>
    <footer className="pub-foot"><div className="pub-foot-in"><div><b>Nilam</b> · Public portal<br />Signed in as {sessionName}</div><div>Information here is for understanding, not legal advice.<br />Maps are schematic. <Link href="/portal/public/about">How we label data</Link></div></div></footer>
  </div>;

  const cls = role === 'government' ? 'shell-gov theme-government' : 'shell-res theme-researcher';
  return <div className={cls}>
    <aside className={`side ${open ? 'open' : ''}`} aria-label="Sidebar">
      <div className="brand"><div className="brand-mark">Ni</div><div><div className="brand-name">Nilam</div><div className="brand-sub">{role === 'government' ? 'Policy Decision Support' : 'Research Workspace'}</div></div></div>
      {role === 'government' ? <div className="role-box"><div className="lbl">Portal</div><div className="nm">{meta.label}</div><div className="tiny" style={{ color: '#9fb1bd', marginTop: 4 }}>{meta.purpose}</div></div> : <ProjectSwitch />}
      <nav className="nav" aria-label="Modules">{groups.map(g => <div key={g}><div className="nav-sec">{g}</div>{modules[role].filter(m => m.section === g).map(m => <Link key={m.id} href={`/portal/${role}/${m.id}`} className={`nav-item ${active === m.id ? 'active' : ''}`} aria-current={active === m.id ? 'page' : undefined}><span className="nav-ic" aria-hidden>{m.icon}</span><span>{m.label}</span></Link>)}</div>)}</nav>
      <div className="side-foot">{sessionName}<br /><Link href={`/portal/${role}/about`} style={{ textDecoration: 'underline' }}>Data &amp; methods</Link></div>
    </aside>
    <div className="main">
      <DemoStrip role={role} />
      <header className="topbar"><button className="burger no-print" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button><Crumbs role={role} /><SearchBox role={role} /><UserBox role={role} /></header>
      <main className="content"><Suspense fallback={<div className="empty">Loading…</div>}>{children}</Suspense></main>
    </div>
  </div>;
}

function ProjectSwitch() {
  useStoreVersion(); const active = useStore(s => s.activeProject); const projects = ofKind('research');
  return <div className="proj-switch"><label htmlFor="proj">Active project</label><select id="proj" value={active} onChange={e => update(s => ({ ...s, activeProject: e.target.value }))}>{projects.map(p => <option key={p.id} value={p.id}>{p.id} · {p.title.slice(0, 34)}</option>)}</select><div className="tiny" style={{ marginTop: 6 }}>Datasets, analyses and publications you save go to this project.</div></div>;
}
export { ROLES };
