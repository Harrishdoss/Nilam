'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Role, Consultation } from '@/lib/types';
import { getEntity, ofKind, hrefFor, modHref } from '@/lib/registry';
import { Badge, Btn, Card, CardHead, EntityList, KV, Notice, PageHead, ProvBadge, RelatedPanel, Empty } from '@/components/ui';
import { logActivity, today, update, useStore, useStoreVersion } from '@/lib/store';
import { BackLink } from './shared';
import { NotFoundRecord } from './records';

type Ans = 'agree' | 'neutral' | 'disagree';
export function tally(c: Consultation, mine?: Record<string, Ans>) {
  return c.questions.map(q => { const s = { ...c.seed[q.id] }; if (mine?.[q.id]) s[mine[q.id]] += 1; const n = s.agree + s.neutral + s.disagree; return { q, s, n }; });
}
export function ConsultationsList({ role }: { role: Role }) {
  useStoreVersion(); const resp = useStore(s => s.responses); const all = ofKind('consultation'); const mod = role === 'government' ? 'reports' : 'consultations';
  return <><PageHead eyebrow="Participation" title="Public Consultations" desc="Government departments publish draft proposals here. Read the summary, then tell them whether you agree." />
    <div className="grid g3">{all.map(c => { const total = tally(c, resp[c.id]?.answers)[0].n; return <Link key={c.id} href={`/portal/${role}/${mod}/${c.id}`} className="card ecard"><div className="row between"><Badge tone={c.status === 'Open' ? 'good' : ''}>{c.status}</Badge>{resp[c.id] && <Badge tone="info">You responded</Badge>}</div><div className="t1">{c.title}</div><div className="tiny">{c.authority}</div><p className="tiny" style={{ color: 'var(--ink)' }}>{c.summary}</p><div className="tiny mt4">{c.status === 'Open' ? `Closes ${c.closes}` : `Closed ${c.closes}`} · {total} responses</div></Link>; })}</div></>;
}
export function ConsultationDetail({ role, id }: { role: Role; id: string }) {
  useStoreVersion(); const c = getEntity<Consultation>(id); const mine = useStore(s => s.responses[id]); const mod = role === 'government' ? 'reports' : 'consultations';
  const [answers, setAnswers] = useState<Record<string, Ans>>({}); const [comment, setComment] = useState('');
  if (!c || c.kind !== 'consultation') return <NotFoundRecord role={role} module={mod} />;
  const canRespond = role === 'public' && c.status === 'Open' && !mine; const showResults = role !== 'public' || !!mine || c.status === 'Closed';
  const t = tally(c, mine?.answers); const complete = c.questions.every(q => answers[q.id]);
  function submit() { update(s => ({ ...s, responses: { ...s.responses, [id]: { answers, comment: comment.trim(), created: today() } } })); logActivity(`Responded to consultation “${c!.title}”`, `/portal/public/consultations/${id}`, 'public'); }
  return <div><BackLink role={role} module={mod} label={role === 'government' ? 'Reports & Briefs' : 'Public Consultations'} />
    <PageHead eyebrow={`Consultation · ${c.authority}`} title={c.title} desc={c.summary} actions={<><Badge tone={c.status === 'Open' ? 'good' : ''}>{c.status}</Badge><ProvBadge p={c.provenance} /></>} />
    <div className="split"><div className="col" style={{ gap: 16 }}>
      <Card><h2 className="h2 mb8">Background</h2><p>{c.background}</p><div className="mt12"><KV items={[['Opens', c.opens], ['Closes', c.closes]]} /></div></Card>
      {canRespond && <Card><h2 className="h2 mb8">Your response</h2><p className="tiny mb12">Choose one option for each statement. Responses are stored in this browser for the demo.</p>
        {c.questions.map((q, i) => <fieldset key={q.id} style={{ border: 0, padding: 0, margin: '0 0 16px' }}><legend style={{ fontWeight: 600, marginBottom: 6 }}>{i + 1}. {q.text}</legend><div className="chips">{(['agree', 'neutral', 'disagree'] as Ans[]).map(a => <label key={a} className={`chip ${answers[q.id] === a ? 'on' : ''}`} style={{ cursor: 'pointer' }}><input type="radio" name={q.id} className="sr-only" checked={answers[q.id] === a} onChange={() => setAnswers({ ...answers, [q.id]: a })} />{a[0].toUpperCase() + a.slice(1)}</label>)}</div></fieldset>)}
        <div className="field"><label htmlFor="cm">Comments (optional)</label><textarea id="cm" className="textarea" value={comment} onChange={e => setComment(e.target.value)} /></div><Btn kind="primary" disabled={!complete} onClick={submit}>Submit response</Btn>{!complete && <span className="tiny" style={{ marginLeft: 8 }}>Answer all statements to submit.</span>}</Card>}
      {mine && <Notice tone="good">Thank you – your response was recorded on {mine.created}.{mine.comment && <div className="tiny mt4">Your comment: “{mine.comment}”</div>}</Notice>}
      {role === 'public' && c.status === 'Open' && !mine && !showResults && <Notice>Results are shown after you respond.</Notice>}
      {showResults && <Card><h2 className="h2 mb8">{c.status === 'Closed' ? 'Final results' : 'Results so far'}</h2>{t.map(({ q, s, n }) => <div key={q.id} className="mb16"><div style={{ fontWeight: 600, fontSize: 13 }}>{q.text}</div><div className="row mt4" style={{ gap: 0, height: 14, borderRadius: 99, overflow: 'hidden' }} role="img" aria-label={`${s.agree} agree, ${s.neutral} neutral, ${s.disagree} disagree`}><span style={{ width: `${100 * s.agree / n}%`, background: '#2f6f55', height: '100%' }} /><span style={{ width: `${100 * s.neutral / n}%`, background: '#b8c2c8', height: '100%' }} /><span style={{ width: `${100 * s.disagree / n}%`, background: '#9b3d36', height: '100%' }} /></div><div className="tiny mt4">{Math.round(100 * s.agree / n)}% agree · {Math.round(100 * s.neutral / n)}% neutral · {Math.round(100 * s.disagree / n)}% disagree · {n} responses</div></div>)}<p className="tiny">Seed responses are demo data; yours is added when you submit.</p></Card>}
      {role === 'government' && <Card><h2 className="h2 mb8">Use in policy</h2><p className="tiny mb8">Link these results to the problem they inform.</p><EntityList ids={c.problems} /></Card>}
    </div><div className="col" style={{ gap: 16 }}>
      {role === 'public' && c.policies[0] && <Card><div className="h3 mb8">Understand the issue</div><div className="col"><Btn href={hrefFor(role, c.policies[0])}>Read the policy explainer</Btn>{ofKind('article').find(a => a.consultations.includes(c.id)) && <Btn href={hrefFor(role, ofKind('article').find(a => a.consultations.includes(c.id))!.id)}>Read the plain-language guide</Btn>}<Btn href={modHref('public', 'atlas')}>See the data on the Land Atlas</Btn></div></Card>}
      <RelatedPanel id={c.id} /></div></div></div>;
}
export { Empty, CardHead };
