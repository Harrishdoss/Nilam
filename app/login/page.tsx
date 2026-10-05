'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Role } from '@/lib/types';
import { DEMO_USERS, chooseRole, guest, signIn, signOut, useSession } from '@/lib/auth';
import { roleMeta, ROLES } from '@/lib/registry';

const ROLE_CARD: Record<Role, { icon: string; who: string; first: string; bullets: string[] }> = {
  government: { icon: 'G', who: 'Policymakers and government officials', first: 'Opens the Command Centre', bullets: ['Frame policy problems and build the evidence base', 'GIS hotspots, simulation, pilots and evaluation', 'Programme monitoring and evidence briefs'] },
  researcher: { icon: 'R', who: 'Researchers, universities and institutions', first: 'Opens Research Home', bullets: ['Dataset discovery and literature library', 'GIS workspace and research-gap finder', 'Collaboration, grants and publishing'] },
  public: { icon: 'P', who: 'Citizens and public users', first: 'Opens Knowledge Home', bullets: ['Plain-language explainers and the Land Atlas', 'State and district insights, open data', 'Public consultations and land programmes'] },
};

function LoginInner() {
  const router = useRouter(); const sp = useSearchParams(); const session = useSession();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState('');
  const go = (r: Role) => { chooseRole(r); const next = sp.get('next'); router.push(next && next.startsWith(`/portal/${r}`) ? next : `/portal/${r}/overview`); };
  function submit(e: React.FormEvent) { e.preventDefault(); const r = signIn(email, password); if (typeof r === 'string') setErr(r); else setErr(''); }

  const step = session ? 2 : 1;
  return <main className="login-wrap"><div className="login-card">
    <section className="login-info">
      <div className="row"><div className="brand-mark" style={{ background: '#fff' }}>Ni</div><div><div style={{ fontWeight: 700, fontSize: 20 }}>Nilam</div><div style={{ opacity: .75, fontSize: 12 }}>National Digital Platform for Land Governance Research &amp; Policy Innovation</div></div></div>
      <h1>One ecosystem from data to decision.</h1>
      <div className="pipeline" aria-label="Platform pipeline">{['Data', 'Research', 'Evidence', 'Policy', 'Simulation', 'Pilot', 'Evaluation', 'Knowledge'].map((s, i) => <span key={s}><b>{i + 1}</b> {s}</span>)}</div>
      <p style={{ opacity: .85, marginTop: 14 }}>Connects researchers, government officials, institutions and citizens. Every record on every page links to the data, research, maps and policies behind it.</p>
      <div className="steps"><div className={step === 1 ? 'on' : ''}><b>1</b> Sign in</div><div className={step === 2 ? 'on' : ''}><b>2</b> Choose portal</div><div><b>3</b> Dashboard</div></div>
      <p className="tiny" style={{ color: '#cbd9e2', marginTop: 20 }}>SIH prototype. All records are demo data unless marked “official programme”.</p>
    </section>
    <section className="login-form">
      {step === 1 && <>
        <h2 className="h2">Sign in</h2><p className="tiny mb12">Use a demo account – click one to fill the form.</p>
        <form onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@landintel.demo" /></div>
          <div className="field"><label htmlFor="pw">Password</label><input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="demo123" /></div>
          {err && <div className="notice bad mb12" role="alert">{err}</div>}
          <button className="btn primary lg" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Sign in</button>
        </form>
        <div className="demo-accts"><div className="tiny" style={{ fontWeight: 700, marginBottom: 6 }}>DEMO ACCOUNTS (password: demo123)</div>
          {DEMO_USERS.map(u => <button key={u.email} className="acct" onClick={() => { setEmail(u.email); setPassword(u.password); setErr(''); }}><b>{u.email}</b><span>{u.note}</span></button>)}</div>
        <button className="btn ghost mt12" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { guest(); }}>Continue as guest (public portal)</button>
      </>}
      {step === 2 && session && <>
        <h2 className="h2">Choose your portal</h2><p className="tiny mb12">Signed in as <b>{session.name}</b> · {session.org}. <button className="link" style={{ background: 'none', border: 0, padding: 0 }} onClick={() => signOut()}>Not you? Sign out</button></p>
        <div className="col">{ROLES.map(r => { const ok = session.roles.includes(r); const c = ROLE_CARD[r]; return <button key={r} className={`role-card role-${r}`} disabled={!ok} onClick={() => go(r)} aria-label={`${roleMeta[r].label}${ok ? '' : ' (not available for this account)'}`}>
          <span className="ric">{c.icon}</span><span className="grow" style={{ textAlign: 'left' }}><b>{roleMeta[r].label}</b><span className="tiny" style={{ display: 'block' }}>{c.who}</span><span style={{ display: 'block', fontSize: 12, marginTop: 4 }}>{c.bullets.join(' · ')}</span>{!ok && <span className="badge" style={{ marginTop: 6 }}>Not available for this account</span>}</span>{ok && <span className="arrow">→</span>}</button>; })}</div>
      </>}
    </section>
  </div>
  <style>{`
   .login-wrap{min-height:100vh;display:grid;place-items:center;padding:20px;background:#e9eef0}
   .login-card{display:grid;grid-template-columns:1.05fr .95fr;width:min(1080px,100%);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 40px rgba(16,32,44,.15)}
   .login-info{background:linear-gradient(160deg,#0d3043,#145963);color:#fff;padding:36px}
   .login-info h1{font-size:32px;line-height:1.15;margin:28px 0 14px;font-weight:700}
   .pipeline{display:flex;flex-wrap:wrap;gap:6px}.pipeline span{background:rgba(255,255,255,.12);border-radius:99px;padding:4px 10px;font-size:12px}.pipeline b{opacity:.6;margin-right:3px}
   .steps{display:flex;gap:8px;margin-top:26px;flex-wrap:wrap}.steps div{font-size:12px;padding:6px 12px;border:1px solid rgba(255,255,255,.3);border-radius:99px;opacity:.6}.steps div.on{background:#fff;color:#0d3043;opacity:1;font-weight:700}.steps b{margin-right:4px}
   .login-form{padding:36px}
   .demo-accts{margin-top:18px;border-top:1px solid var(--line);padding-top:14px}
   .acct{display:flex;flex-direction:column;align-items:flex-start;width:100%;text-align:left;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 12px;margin-bottom:6px}.acct:hover{border-color:var(--accent);background:var(--accent-soft)}.acct b{font-size:13px}.acct span{font-size:12px;color:var(--muted)}
   .role-card{display:flex;align-items:center;gap:14px;width:100%;padding:14px;border:2px solid var(--line);border-radius:10px;background:#fff;text-align:left}
   .role-card:not(:disabled):hover{border-color:var(--accent);background:var(--accent-soft)}.role-card:disabled{opacity:.5;cursor:not-allowed}
   .role-card .ric{width:42px;height:42px;border-radius:10px;display:grid;place-items:center;font-weight:800;color:#fff;flex:none}
   .role-government .ric{background:#126a73}.role-researcher .ric{background:#5b49a0}.role-public .ric{background:#2f7a4f}
   .role-card .arrow{font-size:20px;color:var(--accent);font-weight:700}
   @media(max-width:860px){.login-card{grid-template-columns:1fr}.login-info{padding:24px}.login-info h1{font-size:24px;margin-top:18px}.login-form{padding:24px}}
  `}</style></main>;
}
export default function Login() { return <Suspense fallback={null}><LoginInner /></Suspense>; }
