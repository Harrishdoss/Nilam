import type { PolicyProblem, Report, ResearchProject, Literature, Policy, Dataset, CaseStudy, Pilot, SimConfig } from './types';
import { regionName } from './geo';

interface Pool { research: ResearchProject[]; literature: Literature[]; policies: Policy[]; datasets: Dataset[]; cases: CaseStudy[]; pilots: Pilot[]; simulations: SimConfig[] }

/** Assemble an evidence brief from the linked records of a policy problem. */
export function buildBrief(p: PolicyProblem, pool: Pool, scenarioNote?: string): Report['sections'] {
  const find = <T extends { id: string }>(arr: T[], ids: string[]) => ids.map(i => arr.find(a => a.id === i)).filter(Boolean) as T[];
  const rs = find(pool.research, p.research); const ps = find(pool.policies, p.policies); const ds = find(pool.datasets, p.datasets);
  const cs = find(pool.cases, p.cases); const pl = pool.pilots.filter(x => x.problem === p.id);
  const demoNote = 'Figures marked (demo) are synthetic prototype values and must be replaced with official data before use in decisions.';
  return [
    { h: '1. Summary', p: `${p.title} (${p.id}) is a ${p.priority.toLowerCase()}-priority problem for ${p.owner}, currently at the "${p.stage}" stage. ${p.statement}` },
    { h: '2. Geography & context', p: `${p.geography}. ${p.whyNow}`, bullets: [`Regions in scope: ${p.regions.map(regionName).join(', ')}`, `Primary GIS view: ${regionName(p.gisRegion)}`] },
    { h: '3. Baseline indicators', p: 'Current position on the indicators that define the problem.', bullets: p.baseline.map(b => `${b.indicator}: ${b.value} (source ${b.source})`) },
    { h: '4. Evidence from research', p: rs.length ? 'Linked research projects and their headline findings.' : 'No linked research yet – see Research Gap Finder.', bullets: rs.flatMap(r => [`${r.title} – ${r.institution} (${r.evidenceStrength} evidence)`, ...r.findings.map(f => `  • ${f}`)]) },
    { h: '5. Policy context', p: ps.length ? 'Existing policies and programmes that bear on the problem.' : 'No linked policy documents yet.', bullets: ps.map(x => `${x.title} – ${x.status}`) },
    { h: '6. Options and strength of evidence', p: 'Candidate interventions with the strength of supporting evidence.', bullets: p.interventions.map(i => `${i.title} – evidence: ${i.evidence}; cost: ${i.cost}; time: ${i.time}`) },
    { h: '7. Simulation', p: scenarioNote ?? (p.simulation ? 'A scenario model is available for this problem. Run it in the Policy Simulator and regenerate this brief to include the saved scenario.' : 'No simulation configured.') },
    { h: '8. Pilots and evaluation', p: pl.length ? 'Pilots linked to this problem.' : 'No pilot yet.', bullets: pl.map(x => `${x.title} – ${x.status}. Verdict: ${x.evaluation.verdict}. Recommendation: ${x.evaluation.recommendation}`) },
    { h: '9. Related case studies', p: cs.length ? 'Documented experience.' : 'None yet.', bullets: cs.map(c => `${c.title} – ${c.location}`) },
    { h: '10. Data used and caveats', p: demoNote, bullets: ds.map(d => `${d.title} (${d.provenance === 'demo' ? 'DEMO' : 'official reference'})`) },
  ];
}
