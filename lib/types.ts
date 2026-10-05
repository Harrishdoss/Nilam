export type Role = 'government' | 'researcher' | 'public';

export type Provenance = 'official-reference' | 'demo';

/** Every record in the platform shares this base so it can be linked, searched and labelled. */
export interface Base {
  id: string;
  title: string;
  /** 'demo' = synthetic prototype record. 'official-reference' = a real programme/law, summarised (verify before citing). */
  provenance: Provenance;
}

export interface Dataset extends Base {
  kind: 'dataset';
  owner: string;
  custodian: string;
  summary: string;
  geography: string;            // plain-text coverage
  regions: string[];            // state codes the dataset covers ('IN' = national)
  period: string;
  format: string;
  access: 'Public' | 'Registered' | 'Restricted';
  update: string;
  quality: { completeness: number; accuracy: number; timeliness: number; note: string };
  license: string;
  fields: { name: string; type: string; description: string }[];
  layer?: string;               // GIS layer id this dataset powers
  themes: string[];
  publicSummary: string;
  downloadable: boolean;
}

export interface ResearchProject extends Base {
  kind: 'research';
  lead: string;
  leadRole: string;
  institution: string;
  status: 'Draft' | 'Active' | 'Under review' | 'Published';
  progress: number;
  regions: string[];
  studyArea: string;
  summary: string;
  publicSummary: string;
  question: string;
  methodology: string[];
  datasets: string[];
  layers: string[];
  findings: string[];
  outputs: string[];            // PUB / LIT ids
  problems: string[];           // PP ids
  policies: string[];           // POL ids
  team: { name: string; role: string }[];
  themes: string[];
  start: string;
  end: string;
  evidenceStrength: 'Strong' | 'Moderate' | 'Emerging';
  public: boolean;
}

export interface Literature extends Base {
  kind: 'literature';
  type: 'Paper' | 'Report' | 'Policy document' | 'Legal document';
  authors: string;
  year: number;
  source: string;
  abstract: string;
  themes: string[];
  regions: string[];
  policies: string[];
  research: string[];
  url?: string;
}

export interface Policy extends Base {
  kind: 'policy';
  type: 'Programme' | 'Act / Law' | 'Notification' | 'Reform proposal' | 'State measure';
  level: 'Central' | 'State' | 'Local';
  authority: string;
  since: string;
  status: 'In force' | 'Under implementation' | 'Proposed' | 'Pilot';
  summary: string;
  objectives: string[];
  keyProvisions: string[];
  plain: string;                // plain-language "what it means for you"
  whoItAffects: string[];
  themes: string[];
  datasets: string[];
  research: string[];
  problems: string[];
  programme?: string;           // PRG id
}

export interface Intervention {
  id: string;
  title: string;
  description: string;
  evidence: 'Strong' | 'Moderate' | 'Emerging';
  cost: 'Low' | 'Medium' | 'High';
  time: string;
  leverPreset?: Record<string, number>;
  supportedBy: string[];        // RP / LIT / CS ids
}

export interface PolicyProblem extends Base {
  kind: 'problem';
  owner: string;
  priority: 'High' | 'Medium' | 'Low';
  stage: 'Problem framing' | 'Evidence synthesis' | 'Simulation' | 'Pilot design' | 'Pilot running' | 'Evaluation' | 'Scaled / Closed';
  theme: string;
  regions: string[];
  geography: string;
  statement: string;
  whyNow: string;
  baseline: { indicator: string; value: string; source: string; datasetId?: string }[];
  objectives: string[];
  interventions: Intervention[];
  datasets: string[];
  research: string[];
  literature: string[];
  policies: string[];
  cases: string[];
  gisLayer: string;
  gisRegion: string;
  simulation?: string;          // SIM id
  consultations: string[];
  created: string;
}

export interface Lever {
  id: string; label: string; help: string; unit: string;
  min: number; max: number; step: number; default: number;
  cost: number;                 // ₹ crore per unit, illustrative
}
export interface SimIndicator {
  id: string; label: string; unit: string; baseline: number;
  better: 'lower' | 'higher'; min: number; max: number; decimals: number;
  effects: Record<string, number>; // absolute change in indicator per 1 unit of lever (at full effect)
  explain: string;
}
export interface SimConfig extends Base {
  kind: 'simulation';
  problem: string;
  horizonMonths: number;
  timeConstant: number;         // months for ~63% of effect
  levers: Lever[];
  indicators: SimIndicator[];
  assumptions: string[];
  limitations: string[];
}

export interface PilotKpi {
  id: string; label: string; unit: string; baseline: number; target: number;
  better: 'lower' | 'higher'; readings: number[]; // monthly readings after start
}
export interface Pilot extends Base {
  kind: 'pilot';
  problem: string;
  simulation?: string;
  scenarioName?: string;
  intervention: string;
  location: string;
  regions: string[];
  gisRegion: string;
  start: string;
  durationMonths: number;
  status: 'Planned' | 'Running' | 'Completed';
  objectives: string[];
  design: string;
  comparison: string;
  kpis: PilotKpi[];
  datasets: string[];
  research: string[];
  budgetCr: number;
  lead: string;
  evaluation: { verdict: string; summary: string; lessons: string[]; recommendation: 'Scale up' | 'Refine and re-pilot' | 'Stop' | 'Pending' };
  case?: string;
  userCreated?: boolean;
}

export interface CaseStudy extends Base {
  kind: 'case';
  theme: string;
  location: string;
  regions: string[];
  year: string;
  problem: string;
  intervention: string;
  implementation: string[];
  outcome: string[];
  evidence: string[];           // LIT / RP ids
  lessons: string[];
  replicability: string;
  problems: string[];
  pilot?: string;
  policies: string[];
  datasets: string[];
  publicSummary: string;
  userCreated?: boolean;
}

export interface Programme extends Base {
  kind: 'programme';
  agency: string;
  summary: string;
  plain: string;
  components: { id: string; name: string; description: string; layer: string }[];
  headline: { label: string; value: string; note: string }[];
  eligibility: string[];
  howToAccess: string[];
  policies: string[];
  datasets: string[];
}

export interface Opportunity extends Base {
  kind: 'opportunity';
  type: 'Innovation challenge' | 'Research grant' | 'Pilot call' | 'Fellowship' | 'Hackathon';
  sponsor: string;
  deadline: string;
  status: 'Open' | 'Closing soon' | 'Reference programme';
  amount: string;
  summary: string;
  eligibility: string[];
  deliverables: string[];
  themes: string[];
  problems: string[];
  datasets: string[];
}

export interface Article extends Base {
  kind: 'article';
  category: string;
  readTime: string;
  summary: string;
  body: { h?: string; p: string }[];
  policies: string[];
  research: string[];
  datasets: string[];
  region: string;
  layer: string;
  consultations: string[];
  question: string;
}

export interface Consultation extends Base {
  kind: 'consultation';
  authority: string;
  opens: string;
  closes: string;
  status: 'Open' | 'Closed';
  summary: string;
  background: string;
  questions: { id: string; text: string }[];
  seed: Record<string, { agree: number; neutral: number; disagree: number }>;
  problems: string[];
  policies: string[];
  research: string[];
}

export interface Gap extends Base {
  kind: 'gap';
  theme: string;
  region: string;               // zone label
  why: string;
  evidenceCount: number;
  questions: string[];
  datasets: string[];
  layer: string;
  gisRegion: string;
  problems: string[];
  research: string[];
  score: number;                // priority 0-100
}

export interface Team extends Base {
  kind: 'team';
  purpose: string;
  members: { name: string; role: string; org: string }[];
  projects: string[];
  datasets: string[];
  threads: { id: string; author: string; when: string; text: string }[];
  reviews: { id: string; item: string; requester: string; status: 'Requested' | 'Approved' | 'Changes requested' }[];
}

export interface Publication extends Base {
  kind: 'publication';
  type: 'Journal paper' | 'Policy brief' | 'Working paper' | 'Dataset release' | 'Case study draft';
  authors: string;
  project: string;
  status: 'Draft' | 'In review' | 'Published';
  date: string;
  abstract: string;
  sections: { h: string; p: string }[];
  datasets: string[];
  problems: string[];
  userCreated?: boolean;
}

export interface Report extends Base {
  kind: 'report';
  problem: string;
  created: string;
  author: string;
  sections: { h: string; p: string; bullets?: string[] }[];
  userCreated?: boolean;
}

export type Entity =
  | Dataset | ResearchProject | Literature | Policy | PolicyProblem | SimConfig | Pilot | CaseStudy
  | Programme | Opportunity | Article | Consultation | Gap | Team | Publication | Report;

export type Kind = Entity['kind'];

export interface ModuleDef { id: string; label: string; section: string; desc: string; icon: string }
