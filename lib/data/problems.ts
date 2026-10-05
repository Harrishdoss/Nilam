import type { PolicyProblem, SimConfig } from '../types';
import { regionById } from '../geo';

const v = (region: string, layer: string) => regionById(region)!.values[layer];

export const problems: PolicyProblem[] = [
  { kind: 'problem', id: 'PP-024', title: 'Reducing mutation processing delays', provenance: 'demo', owner: 'Revenue Reform Cell', priority: 'High', stage: 'Pilot running', theme: 'Registration & mutation', regions: ['TN'], geography: 'Tamil Nadu – focus on Chengalpattu district', statement: 'After a land sale or inheritance is registered, the revenue record often takes weeks to update. Stale records lead to repeated verification, disputes and delayed loans.', whyNow: 'Registration offices are already digital, so the data to trigger mutation exists. The bottleneck is workflow, staffing and accountability.',
    baseline: [{ indicator: 'Average mutation time (Chengalpattu)', value: `${v('TN-CGL', 'mutation')} days`, source: 'DS-04 (demo)', datasetId: 'DS-04' }, { indicator: 'Average mutation time (Tamil Nadu)', value: `${v('TN', 'mutation')} days`, source: 'DS-04 (demo)', datasetId: 'DS-04' }, { indicator: 'Pending mutation applications (Chengalpattu)', value: '62,000', source: 'DS-04 (demo)', datasetId: 'DS-04' }, { indicator: 'Records digitised (Tamil Nadu)', value: `${v('TN', 'ror')}%`, source: 'DS-01', datasetId: 'DS-01' }],
    objectives: ['Bring average mutation time below 15 days within 12 months', 'Auto-trigger mutation for at least 60% of registered sale deeds', 'Cut pending applications by half'],
    interventions: [{ id: 'I1', title: 'Auto-trigger mutation from registration data', description: 'Registration office pushes deed data to the revenue system; a mutation case opens automatically.', evidence: 'Strong', cost: 'Medium', time: '6–9 months', leverPreset: { auto: 80, notify: 60 }, supportedBy: ['RP-02', 'LIT-06'] }, { id: 'I2', title: 'Time-bound service guarantee with escalation', description: 'Fixed days to dispose of mutation; automatic escalation to the next officer when missed.', evidence: 'Moderate', cost: 'Low', time: '3–6 months', leverPreset: { sla: 100, notify: 60 }, supportedBy: ['LIT-06'] }, { id: 'I3', title: 'Temporary surge of village-level staff', description: 'Add contract staff in the busiest taluks to clear the backlog.', evidence: 'Emerging', cost: 'High', time: '2–4 months', leverPreset: { staff: 20 }, supportedBy: ['RP-02'] }],
    datasets: ['DS-04', 'DS-01', 'DS-10', 'DS-08'], research: ['RP-02'], literature: ['LIT-01', 'LIT-02', 'LIT-06'], policies: ['POL-01', 'POL-05', 'POL-08'], cases: ['CS-04', 'CS-02'], gisLayer: 'mutation', gisRegion: 'TN-CGL', simulation: 'SIM-024', consultations: ['CN-01'], created: '2026-03-12' },
  { kind: 'problem', id: 'PP-019', title: 'Urban land record and map inconsistency', provenance: 'demo', owner: 'Urban Land Mission', priority: 'High', stage: 'Simulation', theme: 'Urban land', regions: ['MH', 'GJ'], geography: 'Pilot urban local bodies in Maharashtra and Gujarat', statement: 'In many towns the surveyed parcel boundary does not match the area or owner in the property record, blocking transactions, taxation and planning.', whyNow: 'Aerial survey under NAKSHA gives accurate maps; the missing piece is a reconciliation workflow that gets every parcel tagged to a record.',
    baseline: [{ indicator: 'Parcels where map and record agree', value: '61%', source: 'DS-09 (demo)', datasetId: 'DS-09' }, { indicator: 'Open discrepancies in pilot ULBs', value: '48,000', source: 'DS-09 (demo)', datasetId: 'DS-09' }, { indicator: 'Maps digitised (Maharashtra)', value: `${v('MH', 'cadastral')}%`, source: 'DS-02', datasetId: 'DS-02' }],
    objectives: ['Raise map–record agreement above 85%', 'Cut average correction time to under 30 days'],
    interventions: [{ id: 'I1', title: 'Complete aerial + ground survey of pilot ULBs', description: 'Finish survey coverage so every parcel has an accurate polygon.', evidence: 'Strong', cost: 'High', time: '9–12 months', leverPreset: { survey: 90 }, supportedBy: ['RP-03', 'LIT-05'] }, { id: 'I2', title: 'Dedicated reconciliation teams', description: 'Teams that resolve boundary/area mismatches with owners in camps.', evidence: 'Moderate', cost: 'Medium', time: '4–6 months', leverPreset: { team: 20, camps: 8 }, supportedBy: ['RP-03', 'LIT-08'] }],
    datasets: ['DS-09', 'DS-02', 'DS-01'], research: ['RP-03'], literature: ['LIT-05', 'LIT-08'], policies: ['POL-03', 'POL-01', 'POL-02'], cases: ['CS-01'], gisLayer: 'cadastral', gisRegion: 'MH', simulation: 'SIM-019', consultations: ['CN-03'], created: '2026-04-02' },
  { kind: 'problem', id: 'PP-011', title: 'Climate-resilient land-use planning', provenance: 'demo', owner: 'Planning & Environment Dept.', priority: 'Medium', stage: 'Evaluation', theme: 'Climate & resilience', regions: ['KL', 'TN', 'OD'], geography: 'Coastal districts – pilot in Ernakulam (Kerala)', statement: 'New homes and businesses are being built on land with high flood and cyclone exposure because planning maps do not reflect current hazard data.', whyNow: 'Hazard data and land records can now be overlaid at parcel level, making advisory zoning feasible.',
    baseline: [{ indicator: 'Climate vulnerability index (Kerala)', value: String(v('KL', 'climate')), source: 'DS-06 (demo)', datasetId: 'DS-06' }, { indicator: 'High-risk hectares converted per year (Ernakulam)', value: '410 ha', source: 'RP-04 (demo)' }, { indicator: 'Households in exposed zones (Ernakulam)', value: '120,000', source: 'DS-06 (demo)', datasetId: 'DS-06' }],
    objectives: ['Halve conversion of high-risk land within 24 months', 'Embed hazard layers in all local planning approvals'],
    interventions: [{ id: 'I1', title: 'Flood-plain land-use advisory layer in approvals', description: 'Planners see parcel-level hazard when approving land-use change.', evidence: 'Moderate', cost: 'Low', time: '6 months', leverPreset: { zoning: 60, mapping: 80 }, supportedBy: ['RP-04', 'LIT-09', 'CS-05'] }, { id: 'I2', title: 'Wider no-build buffers', description: 'Extend protected buffers along rivers and tanks.', evidence: 'Emerging', cost: 'Medium', time: '12 months', leverPreset: { buffer: 150 }, supportedBy: ['LIT-09'] }],
    datasets: ['DS-06', 'DS-05', 'DS-14'], research: ['RP-04', 'RP-08'], literature: ['LIT-04', 'LIT-09'], policies: ['POL-07'], cases: ['CS-05'], gisLayer: 'climate', gisRegion: 'KL-EKM', simulation: 'SIM-011', consultations: [], created: '2026-02-01' },
  { kind: 'problem', id: 'PP-015', title: 'Pending land disputes and unclear titles', provenance: 'demo', owner: 'Law & Revenue Coordination Committee', priority: 'High', stage: 'Evidence synthesis', theme: 'Land disputes', regions: ['UP', 'BR'], geography: 'Uttar Pradesh (focus: Prayagraj, Gorakhpur)', statement: 'A large share of civil disputes concern land. Unclear titles and stale records prolong cases and discourage investment.', whyNow: 'ULPIN assignment and record linkage create the chance to attach disputes and records to the same parcel.',
    baseline: [{ indicator: 'Pending disputes per 10k parcels (Uttar Pradesh)', value: String(v('UP', 'disputes')), source: 'DS-07 (demo)', datasetId: 'DS-07' }, { indicator: 'Average resolution time', value: '34 months', source: 'DS-07 (demo)', datasetId: 'DS-07' }],
    objectives: ['Increase the share of disputes resolved through mediation', 'Link at least 70% of disputes to ULPIN'],
    interventions: [{ id: 'I1', title: 'Mediation / Lok Adalat camps for land cases', description: 'Regular camps with revenue officials and mediators.', evidence: 'Moderate', cost: 'Low', time: '3–6 months', leverPreset: { adr: 12 }, supportedBy: ['RP-05'] }, { id: 'I2', title: 'ULPIN-linked title verification', description: 'Verify and flag unclear titles using the parcel identifier before disputes arise.', evidence: 'Emerging', cost: 'Medium', time: '9–12 months', leverPreset: { ulpin: 70 }, supportedBy: ['RP-05', 'LIT-10'] }],
    datasets: ['DS-07', 'DS-03', 'DS-01'], research: ['RP-05'], literature: ['LIT-10'], policies: ['POL-02', 'POL-09'], cases: ['CS-02'], gisLayer: 'disputes', gisRegion: 'UP', simulation: 'SIM-015', consultations: [], created: '2026-05-20' },
  { kind: 'problem', id: 'PP-008', title: 'Unplanned farmland conversion at the urban fringe', provenance: 'demo', owner: 'Urban Development & Agriculture Joint Cell', priority: 'Medium', stage: 'Evidence synthesis', theme: 'Land-use change', regions: ['TN', 'MH', 'GJ'], geography: 'Chennai Metropolitan Region (Chengalpattu focus)', statement: 'Farmland near growing cities is converted informally, with infrastructure and services lagging behind.', whyNow: 'Satellite change data can now quantify conversion district-by-district, enabling targeted instruments.',
    baseline: [{ indicator: 'Farmland converted over 5 years (Chengalpattu)', value: `${v('TN-CGL', 'conversion')}%`, source: 'DS-05 (demo)', datasetId: 'DS-05' }, { indicator: 'Urbanisation pressure (Chengalpattu)', value: String(v('TN-CGL', 'urban')), source: 'DS-05 (demo)', datasetId: 'DS-05' }],
    objectives: ['Slow net farmland loss', 'Channel growth into planned areas'],
    interventions: [{ id: 'I1', title: 'Differential conversion charge', description: 'Higher charges for conversion outside planned growth zones.', evidence: 'Emerging', cost: 'Low', time: '6 months', leverPreset: { fee: 15 }, supportedBy: ['RP-07'] }, { id: 'I2', title: 'Land pooling in planned corridors', description: 'Owners pool land and receive developed plots.', evidence: 'Moderate', cost: 'Medium', time: '18 months', leverPreset: { pooling: 40 }, supportedBy: ['RP-01'] }],
    datasets: ['DS-05', 'DS-12', 'DS-14'], research: ['RP-01', 'RP-07'], literature: ['LIT-07', 'LIT-13', 'LIT-03'], policies: ['POL-06'], cases: [], gisLayer: 'conversion', gisRegion: 'TN-CGL', simulation: 'SIM-008', consultations: [], created: '2026-06-09' },
  { kind: 'problem', id: 'PP-031', title: 'Low visibility of women\'s land ownership in records', provenance: 'demo', owner: 'Women & Rural Development Cell', priority: 'Medium', stage: 'Pilot design', theme: 'Gender & land rights', regions: ['OD'], geography: 'Odisha – Khordha, Puri, Ganjam', statement: 'Women hold land but records often omit holder gender or list only the male head, reducing credit access and bargaining power.', whyNow: 'Property cards and record redesign are being rolled out, so gender-visible design can be built in now.',
    baseline: [{ indicator: 'Parcels with a woman as holder (Khordha, demo)', value: '14%', source: 'DS-13 (demo)', datasetId: 'DS-13' }, { indicator: 'Records with gender field', value: '35%', source: 'DS-13 (demo)', datasetId: 'DS-13' }],
    objectives: ['Double the share of parcels recorded with women as holders or joint holders', 'Make gender a mandatory field in new records'],
    interventions: [{ id: 'I1', title: 'Joint-title campaign with property cards', description: 'Prompt households to register joint names at card issue.', evidence: 'Emerging', cost: 'Low', time: '6–9 months', leverPreset: { joint: 60, camps: 3 }, supportedBy: ['RP-06', 'LIT-11'] }],
    datasets: ['DS-13', 'DS-11'], research: ['RP-06'], literature: ['LIT-11', 'LIT-12'], policies: ['POL-04'], cases: [], gisLayer: 'ror', gisRegion: 'OD-KHU', simulation: 'SIM-031', consultations: [], created: '2026-07-14' },
];

const sim = (s: Omit<SimConfig, 'kind' | 'provenance'>): SimConfig => ({ kind: 'simulation', provenance: 'demo', ...s });
const COMMON_LIMITS = ['Effects are additive and linear until a floor/ceiling – real interventions interact.', 'Coefficients are illustrative placeholders, not validated estimates. Replace them with values from the linked research before using results for decisions.', 'The model does not include political, legal or implementation-capacity risk.'];

export const simulations: SimConfig[] = [
  sim({ id: 'SIM-024', title: 'Mutation delay – scenario model', problem: 'PP-024', horizonMonths: 24, timeConstant: 8,
    levers: [
      { id: 'auto', label: 'Auto-trigger mutation from registration', help: 'Share of registered sale deeds that automatically open a mutation case.', unit: '% of deeds', min: 0, max: 100, step: 5, default: 15, cost: 0.08 },
      { id: 'staff', label: 'Additional village-level staff', help: 'Increase in mutation-handling staff versus today.', unit: '% more staff', min: 0, max: 40, step: 5, default: 0, cost: 0.35 },
      { id: 'sla', label: 'Service guarantee with escalation', help: 'Share of offices covered by a time-bound guarantee with auto-escalation.', unit: '% of offices', min: 0, max: 100, step: 10, default: 0, cost: 0.02 },
      { id: 'notify', label: 'Citizen SMS / online tracking', help: 'Share of applicants who can track status by SMS or portal.', unit: '% of applicants', min: 0, max: 100, step: 10, default: 20, cost: 0.015 },
    ],
    indicators: [
      { id: 'days', label: 'Average mutation time', unit: 'days', baseline: v('TN-CGL', 'mutation'), better: 'lower', min: 5, max: 90, decimals: 0, effects: { auto: -0.22, staff: -0.25, sla: -0.10, notify: -0.03 }, explain: 'Days between registration and updated record.' },
      { id: 'pending', label: 'Pending mutation applications', unit: 'thousand', baseline: 62, better: 'lower', min: 3, max: 120, decimals: 0, effects: { auto: -0.42, staff: -0.35, sla: -0.20, notify: 0 }, explain: 'Open applications waiting for disposal.' },
      { id: 'disputes', label: 'Disputes linked to stale records', unit: 'per 10k parcels', baseline: Math.round(v('TN-CGL', 'disputes') * 0.35), better: 'lower', min: 2, max: 80, decimals: 0, effects: { auto: -0.12, staff: -0.05, sla: -0.08, notify: -0.04 }, explain: 'Share of the dispute rate attributable to out-of-date records.' },
      { id: 'sat', label: 'Citizen satisfaction index', unit: 'index', baseline: 58, better: 'higher', min: 0, max: 100, decimals: 0, effects: { auto: 0.20, staff: 0.10, sla: 0.15, notify: 0.18 }, explain: 'Survey-based index (0–100).' },
    ],
    assumptions: ['Baseline mutation time equals the Chengalpattu value on the GIS layer (demo).', 'Effects build up gradually – about 63% of the final effect is reached after the time constant (8 months).', 'Costs are in ₹ crore, illustrative.'], limitations: COMMON_LIMITS }),
  sim({ id: 'SIM-019', title: 'Urban record–map consistency – scenario model', problem: 'PP-019', horizonMonths: 24, timeConstant: 10,
    levers: [
      { id: 'survey', label: 'Survey coverage of pilot ULB area', help: 'Share of urban area with completed aerial + ground survey.', unit: '% of area', min: 0, max: 100, step: 10, default: 20, cost: 0.30 },
      { id: 'team', label: 'Reconciliation teams', help: 'Dedicated teams that tag parcels to records.', unit: 'teams', min: 0, max: 40, step: 5, default: 5, cost: 0.6 },
      { id: 'camps', label: 'Owner correction camps per quarter', help: 'Camps where owners confirm boundaries and records.', unit: 'camps / qtr', min: 0, max: 12, step: 1, default: 2, cost: 0.4 },
    ],
    indicators: [
      { id: 'match', label: 'Parcels where map and record agree', unit: '%', baseline: 61, better: 'higher', min: 0, max: 99, decimals: 0, effects: { survey: 0.20, team: 0.35, camps: 0.9 }, explain: 'Share of parcels with matching boundary, area and owner.' },
      { id: 'open', label: 'Open discrepancies', unit: 'thousand', baseline: 48, better: 'lower', min: 2, max: 90, decimals: 0, effects: { survey: -0.15, team: -0.55, camps: -1.1 }, explain: 'Mismatches awaiting resolution.' },
      { id: 'time', label: 'Average correction time', unit: 'days', baseline: 75, better: 'lower', min: 10, max: 120, decimals: 0, effects: { survey: -0.12, team: -0.9, camps: -1.4 }, explain: 'Days from complaint to corrected record.' },
    ],
    assumptions: ['Baseline matches the pilot-ULB estimate (demo).', 'Time constant 10 months because survey and teams take time to scale.'], limitations: COMMON_LIMITS }),
  sim({ id: 'SIM-011', title: 'Climate-resilient planning – scenario model', problem: 'PP-011', horizonMonths: 36, timeConstant: 12,
    levers: [
      { id: 'zoning', label: 'High-risk cells covered by advisory zoning', help: 'Share of high-exposure land where approvals use hazard advice.', unit: '% of cells', min: 0, max: 100, step: 10, default: 10, cost: 0.05 },
      { id: 'mapping', label: 'Hazard-map update coverage', help: 'Share of the district with hazard maps updated at parcel scale.', unit: '% of district', min: 0, max: 100, step: 10, default: 30, cost: 0.06 },
      { id: 'buffer', label: 'No-build buffer width', help: 'Buffer from rivers/tanks where building is restricted.', unit: 'metres', min: 0, max: 300, step: 25, default: 50, cost: 0.02 },
      { id: 'comp', label: 'Relocation / compensation fund', help: 'Budget for voluntary relocation from exposed land.', unit: '₹ crore', min: 0, max: 200, step: 20, default: 0, cost: 1 },
    ],
    indicators: [
      { id: 'conv', label: 'High-risk land converted per year', unit: 'ha', baseline: 410, better: 'lower', min: 20, max: 600, decimals: 0, effects: { zoning: -2.2, mapping: -0.9, buffer: -0.35, comp: -0.4 }, explain: 'Hectares of high-exposure land converted to built-up use each year.' },
      { id: 'hh', label: 'Households in exposed zones', unit: 'thousand', baseline: 120, better: 'lower', min: 20, max: 180, decimals: 0, effects: { zoning: -0.15, mapping: -0.05, buffer: -0.08, comp: -0.35 }, explain: 'Households living on high-exposure land.' },
      { id: 'comp2', label: 'Approvals checked against hazard data', unit: '%', baseline: 54, better: 'higher', min: 0, max: 100, decimals: 0, effects: { zoning: 0.25, mapping: 0.3, buffer: 0.02, comp: 0 }, explain: 'Share of land-use approvals that consult current hazard layers.' },
    ],
    assumptions: ['Baseline reflects Ernakulam (demo).', 'Slow time constant (12 months) because zoning changes need approvals.'], limitations: COMMON_LIMITS }),
  sim({ id: 'SIM-015', title: 'Land dispute backlog – scenario model', problem: 'PP-015', horizonMonths: 36, timeConstant: 14,
    levers: [
      { id: 'adr', label: 'Mediation / Lok Adalat camps per district per year', help: 'Number of land-focused camps.', unit: 'camps / yr', min: 0, max: 24, step: 2, default: 2, cost: 0.5 },
      { id: 'ulpin', label: 'Disputes linked to ULPIN', help: 'Share of disputes tagged to a parcel identifier.', unit: '% of disputes', min: 0, max: 100, step: 10, default: 25, cost: 0.06 },
      { id: 'clear', label: 'Title-clearing drives', help: 'Share of flagged parcels with a title-clarification drive.', unit: '% of flagged parcels', min: 0, max: 100, step: 10, default: 0, cost: 0.09 },
    ],
    indicators: [
      { id: 'pend', label: 'Pending disputes', unit: 'per 10k parcels', baseline: v('UP', 'disputes'), better: 'lower', min: 10, max: 190, decimals: 0, effects: { adr: -1.4, ulpin: -0.35, clear: -0.45 }, explain: 'Pending land disputes per 10,000 parcels.' },
      { id: 'months', label: 'Average resolution time', unit: 'months', baseline: 34, better: 'lower', min: 6, max: 60, decimals: 0, effects: { adr: -0.35, ulpin: -0.10, clear: -0.08 }, explain: 'Months from filing to disposal.' },
      { id: 'adrpct', label: 'Disputes resolved through mediation', unit: '%', baseline: 8, better: 'higher', min: 0, max: 80, decimals: 0, effects: { adr: 1.6, ulpin: 0.1, clear: 0.05 }, explain: 'Share of disposed disputes resolved by mediation.' },
    ],
    assumptions: ['Baseline = Uttar Pradesh state value on the GIS layer (demo).'], limitations: COMMON_LIMITS }),
  sim({ id: 'SIM-008', title: 'Fringe farmland conversion – scenario model', problem: 'PP-008', horizonMonths: 36, timeConstant: 14,
    levers: [
      { id: 'fee', label: 'Differential conversion charge', help: 'Extra charge on conversion outside planned zones as % of market value.', unit: '% of value', min: 0, max: 30, step: 2.5, default: 2, cost: 0.03 },
      { id: 'pooling', label: 'Land pooling in planned corridors', help: 'Share of planned corridor land brought under pooling.', unit: '% of corridor land', min: 0, max: 100, step: 10, default: 0, cost: 0.12 },
      { id: 'protect', label: 'Farmland protection zones', help: 'Share of prime farmland notified as protection zone.', unit: '% of prime farmland', min: 0, max: 100, step: 10, default: 10, cost: 0.05 },
    ],
    indicators: [
      { id: 'loss', label: 'Farmland lost per year', unit: 'ha', baseline: 2400, better: 'lower', min: 200, max: 4000, decimals: 0, effects: { fee: -45, pooling: -9, protect: -14 }, explain: 'Net hectares converted to non-agricultural use each year.' },
      { id: 'vol', label: 'Fringe land-price volatility', unit: 'index', baseline: 100, better: 'lower', min: 40, max: 160, decimals: 0, effects: { fee: -0.8, pooling: -0.25, protect: 0.15 }, explain: 'Index of price swings at the fringe (baseline = 100).' },
      { id: 'inc', label: 'Farmer income index', unit: 'index', baseline: 100, better: 'higher', min: 70, max: 140, decimals: 0, effects: { fee: -0.3, pooling: 0.25, protect: -0.05 }, explain: 'Index of farmer income (baseline = 100). Higher charges can reduce sale proceeds.' },
    ],
    assumptions: ['Trade-off modelled: charges slow conversion but may reduce farmer sale proceeds.'], limitations: COMMON_LIMITS }),
  sim({ id: 'SIM-031', title: 'Women\'s land visibility – scenario model', problem: 'PP-031', horizonMonths: 24, timeConstant: 10,
    levers: [
      { id: 'joint', label: 'Joint-title campaign coverage', help: 'Share of property-card households reached by a joint-title prompt.', unit: '% of households', min: 0, max: 100, step: 10, default: 10, cost: 0.04 },
      { id: 'flag', label: 'Gender field in records', help: 'Share of records carrying a mandatory gender field.', unit: '% of records', min: 0, max: 100, step: 10, default: 35, cost: 0.03 },
      { id: 'camps', label: 'Legal-awareness camps per village panchayat per year', help: 'Camps explaining land rights.', unit: 'camps / yr', min: 0, max: 6, step: 1, default: 1, cost: 0.25 },
    ],
    indicators: [
      { id: 'women', label: 'Parcels with a woman as holder', unit: '%', baseline: 14, better: 'higher', min: 0, max: 60, decimals: 1, effects: { joint: 0.11, flag: 0.03, camps: 0.6 }, explain: 'Share of parcels with a woman as sole or joint holder.' },
      { id: 'gflag', label: 'Records with a gender field', unit: '%', baseline: 35, better: 'higher', min: 0, max: 100, decimals: 0, effects: { joint: 0, flag: 1, camps: 0 }, explain: 'Share of records where holder gender can be read.' },
      { id: 'apps', label: 'Mutation applications by women', unit: '%', baseline: 11, better: 'higher', min: 0, max: 50, decimals: 1, effects: { joint: 0.05, flag: 0.02, camps: 0.9 }, explain: 'Share of mutation applications filed by women.' },
    ],
    assumptions: ['Baseline is a demo estimate for Khordha.'], limitations: COMMON_LIMITS }),
];
