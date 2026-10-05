/**
 * Nilam geography & GIS demo data.
 *
 * IMPORTANT — everything in this file is SYNTHETIC / DEMO:
 *  - The national map is a schematic "tile grid" (one tile per State/UT). It is not drawn to scale
 *    and does not show official boundaries.
 *  - District tiles are schematic too.
 *  - Indicator values are generated deterministically from hand-set traits (maturity, urbanisation,
 *    coast, dispute load) so the demo is repeatable. They are NOT official statistics.
 *  - The parcel cluster is a procedurally generated village; it is not a cadastral boundary.
 */

export interface RegionTraits { maturity: number; urban: number; coast: number; dispute: number }
export interface StateDef extends RegionTraits { code: string; name: string; x: number; y: number; ut?: boolean; zone: string }
export interface DistrictDef extends RegionTraits { id: string; name: string; state: string; x: number; y: number }

export const STATES: StateDef[] = [
  { code: 'JK', name: 'Jammu & Kashmir', x: 2, y: 0, maturity: .45, urban: .25, coast: 0, dispute: .5, ut: true, zone: 'North' },
  { code: 'LA', name: 'Ladakh', x: 3, y: 0, maturity: .30, urban: .05, coast: 0, dispute: .2, ut: true, zone: 'North' },
  { code: 'CH', name: 'Chandigarh', x: 1, y: 1, maturity: .88, urban: .95, coast: 0, dispute: .2, ut: true, zone: 'North' },
  { code: 'PB', name: 'Punjab', x: 2, y: 1, maturity: .85, urban: .45, coast: 0, dispute: .35, zone: 'North' },
  { code: 'HP', name: 'Himachal Pradesh', x: 3, y: 1, maturity: .75, urban: .20, coast: 0, dispute: .30, zone: 'North' },
  { code: 'UK', name: 'Uttarakhand', x: 4, y: 1, maturity: .70, urban: .30, coast: 0, dispute: .40, zone: 'North' },
  { code: 'SK', name: 'Sikkim', x: 6, y: 1, maturity: .60, urban: .10, coast: 0, dispute: .20, zone: 'North-East' },
  { code: 'AR', name: 'Arunachal Pradesh', x: 8, y: 1, maturity: .35, urban: .05, coast: 0, dispute: .30, zone: 'North-East' },
  { code: 'RJ', name: 'Rajasthan', x: 1, y: 2, maturity: .70, urban: .30, coast: 0, dispute: .50, zone: 'West' },
  { code: 'HR', name: 'Haryana', x: 2, y: 2, maturity: .82, urban: .55, coast: 0, dispute: .45, zone: 'North' },
  { code: 'DL', name: 'Delhi', x: 3, y: 2, maturity: .90, urban: 1.0, coast: 0, dispute: .50, ut: true, zone: 'North' },
  { code: 'UP', name: 'Uttar Pradesh', x: 4, y: 2, maturity: .72, urban: .40, coast: 0, dispute: .75, zone: 'Central' },
  { code: 'BR', name: 'Bihar', x: 5, y: 2, maturity: .55, urban: .30, coast: 0, dispute: .80, zone: 'East' },
  { code: 'WB', name: 'West Bengal', x: 6, y: 2, maturity: .62, urban: .50, coast: .30, dispute: .70, zone: 'East' },
  { code: 'AS', name: 'Assam', x: 7, y: 2, maturity: .50, urban: .25, coast: 0, dispute: .50, zone: 'North-East' },
  { code: 'NL', name: 'Nagaland', x: 8, y: 2, maturity: .40, urban: .10, coast: 0, dispute: .30, zone: 'North-East' },
  { code: 'GJ', name: 'Gujarat', x: 1, y: 3, maturity: .85, urban: .60, coast: .70, dispute: .40, zone: 'West' },
  { code: 'MP', name: 'Madhya Pradesh', x: 3, y: 3, maturity: .78, urban: .35, coast: 0, dispute: .50, zone: 'Central' },
  { code: 'CG', name: 'Chhattisgarh', x: 4, y: 3, maturity: .75, urban: .25, coast: 0, dispute: .40, zone: 'Central' },
  { code: 'JH', name: 'Jharkhand', x: 5, y: 3, maturity: .55, urban: .30, coast: 0, dispute: .60, zone: 'East' },
  { code: 'OD', name: 'Odisha', x: 6, y: 3, maturity: .80, urban: .30, coast: .85, dispute: .60, zone: 'East' },
  { code: 'ML', name: 'Meghalaya', x: 7, y: 3, maturity: .40, urban: .10, coast: 0, dispute: .30, zone: 'North-East' },
  { code: 'MN', name: 'Manipur', x: 8, y: 3, maturity: .40, urban: .10, coast: 0, dispute: .30, zone: 'North-East' },
  { code: 'DD', name: 'Dadra & Nagar Haveli and Daman & Diu', x: 2, y: 4, maturity: .80, urban: .60, coast: .80, dispute: .30, ut: true, zone: 'West' },
  { code: 'MH', name: 'Maharashtra', x: 3, y: 4, maturity: .80, urban: .65, coast: .60, dispute: .65, zone: 'West' },
  { code: 'TG', name: 'Telangana', x: 4, y: 4, maturity: .78, urban: .55, coast: 0, dispute: .50, zone: 'South' },
  { code: 'AP', name: 'Andhra Pradesh', x: 5, y: 4, maturity: .78, urban: .45, coast: .80, dispute: .50, zone: 'South' },
  { code: 'TR', name: 'Tripura', x: 7, y: 4, maturity: .55, urban: .20, coast: 0, dispute: .30, zone: 'North-East' },
  { code: 'MZ', name: 'Mizoram', x: 8, y: 4, maturity: .45, urban: .10, coast: 0, dispute: .20, zone: 'North-East' },
  { code: 'GA', name: 'Goa', x: 2, y: 5, maturity: .85, urban: .60, coast: .90, dispute: .35, zone: 'West' },
  { code: 'KA', name: 'Karnataka', x: 3, y: 5, maturity: .85, urban: .55, coast: .30, dispute: .50, zone: 'South' },
  { code: 'TN', name: 'Tamil Nadu', x: 4, y: 5, maturity: .90, urban: .60, coast: .75, dispute: .55, zone: 'South' },
  { code: 'PY', name: 'Puducherry', x: 5, y: 5, maturity: .80, urban: .80, coast: .90, dispute: .30, ut: true, zone: 'South' },
  { code: 'KL', name: 'Kerala', x: 3, y: 6, maturity: .85, urban: .60, coast: .85, dispute: .50, zone: 'South' },
  { code: 'LD', name: 'Lakshadweep', x: 1, y: 6, maturity: .50, urban: .20, coast: 1, dispute: .10, ut: true, zone: 'Islands' },
  { code: 'AN', name: 'Andaman & Nicobar Islands', x: 7, y: 6, maturity: .45, urban: .10, coast: 1, dispute: .10, ut: true, zone: 'Islands' },
];

export const DISTRICTS: DistrictDef[] = [
  // Tamil Nadu
  d('TN', 'VLR', 'Vellore', 1, 0, .70, .30, 0.0, .55), d('TN', 'TVL', 'Tiruvallur', 2, 0, .88, .40, .35, .55), d('TN', 'CHE', 'Chennai', 3, 0, .95, 1, .90, .70),
  d('TN', 'SLM', 'Salem', 1, 1, .88, .45, 0, .50), d('TN', 'KAN', 'Kancheepuram', 2, 1, .90, .60, .20, .60), d('TN', 'CGL', 'Chengalpattu', 3, 1, .90, .70, .80, .65),
  d('TN', 'CBE', 'Coimbatore', 0, 2, .90, .75, 0, .45), d('TN', 'TRI', 'Tiruchirappalli', 1, 2, .88, .50, 0, .50), d('TN', 'TNJ', 'Thanjavur', 2, 2, .85, .30, .40, .50),
  d('TN', 'CUD', 'Cuddalore', 3, 2, .85, .30, .85, .55), d('TN', 'MDU', 'Madurai', 1, 3, .90, .60, 0, .55), d('TN', 'TUT', 'Thoothukudi', 2, 3, .88, .40, .85, .45),
  // Maharashtra
  d('MH', 'NGP', 'Nagpur', 3, 0, .80, .65, 0, .60), d('MH', 'NSK', 'Nashik', 1, 0, .80, .55, 0, .60), d('MH', 'SBN', 'Chh. Sambhajinagar', 2, 1, .75, .55, 0, .65),
  d('MH', 'THA', 'Thane', 0, 1, .85, .90, .50, .75), d('MH', 'MUS', 'Mumbai Suburban', 0, 2, .90, 1, .95, .80), d('MH', 'RGD', 'Raigad', 0, 3, .78, .40, .90, .60),
  d('MH', 'PUN', 'Pune', 1, 2, .85, .85, 0, .65), d('MH', 'KOP', 'Kolhapur', 1, 3, .78, .45, 0, .55),
  // Uttar Pradesh
  d('UP', 'MRT', 'Meerut', 0, 0, .75, .60, 0, .70), d('UP', 'GBN', 'Gautam Buddh Nagar', 1, 0, .85, .85, 0, .80), d('UP', 'AGR', 'Agra', 1, 1, .72, .60, 0, .70),
  d('UP', 'LKO', 'Lucknow', 2, 1, .80, .85, 0, .75), d('UP', 'KNP', 'Kanpur Nagar', 2, 2, .72, .75, 0, .80), d('UP', 'PRG', 'Prayagraj', 3, 2, .70, .55, 0, .85),
  d('UP', 'GKP', 'Gorakhpur', 4, 1, .65, .45, 0, .85), d('UP', 'VNS', 'Varanasi', 4, 2, .70, .60, 0, .80),
  // Kerala
  d('KL', 'KNR', 'Kannur', 0, 0, .85, .45, .80, .45), d('KL', 'KZD', 'Kozhikode', 0, 1, .85, .60, .85, .50), d('KL', 'TSR', 'Thrissur', 0, 2, .85, .50, .85, .50),
  d('KL', 'PKD', 'Palakkad', 1, 2, .82, .30, 0, .45), d('KL', 'EKM', 'Ernakulam', 0, 3, .88, .80, .90, .60), d('KL', 'ALP', 'Alappuzha', 0, 4, .85, .45, .95, .50),
  d('KL', 'TVM', 'Thiruvananthapuram', 1, 5, .88, .70, .85, .55),
  // Gujarat
  d('GJ', 'KUT', 'Kutch', 0, 0, .80, .20, .85, .35), d('GJ', 'AMD', 'Ahmedabad', 2, 0, .90, .90, 0, .45), d('GJ', 'GNR', 'Gandhinagar', 3, 0, .88, .70, 0, .35),
  d('GJ', 'RJK', 'Rajkot', 1, 1, .85, .65, .20, .40), d('GJ', 'BVN', 'Bhavnagar', 2, 1, .80, .50, .85, .40), d('GJ', 'VDR', 'Vadodara', 3, 1, .88, .70, 0, .40),
  d('GJ', 'SRT', 'Surat', 3, 2, .90, .90, .70, .45),
  // Odisha
  d('OD', 'SUN', 'Sundargarh', 0, 0, .75, .30, 0, .60), d('OD', 'BLS', 'Balasore', 2, 0, .80, .30, .85, .55), d('OD', 'KRP', 'Koraput', 1, 2, .70, .15, 0, .65),
  d('OD', 'CTC', 'Cuttack', 2, 1, .82, .55, .50, .60), d('OD', 'KHU', 'Khordha', 2, 2, .88, .75, .60, .60), d('OD', 'PUR', 'Puri', 3, 2, .80, .35, .95, .60),
  d('OD', 'GNJ', 'Ganjam', 3, 3, .78, .35, .90, .65),
];
function d(state: string, short: string, name: string, x: number, y: number, maturity: number, urban: number, coast: number, dispute: number): DistrictDef {
  return { id: `${state}-${short}`, name, state, x, y, maturity, urban, coast, dispute };
}

export const FOCUS_STATES = ['TN', 'MH', 'UP', 'KL', 'GJ', 'OD'];

// ---------- deterministic noise ----------
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function noise(id: string, k: string, amp: number) { const r = rng(hash(id + k))(); return (r * 2 - 1) * amp; }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

// ---------- layers ----------
export interface LayerDef {
  id: string; label: string; short: string; unit: string; decimals: number;
  polarity: 'good-high' | 'bad-high';
  /** what the layer represents, in plain words */
  what: string;
  /** how to read the colours */
  read: string;
  datasetId: string;
  group: 'Records' | 'Land use' | 'Risk' | 'Parcel';
  level: 'region' | 'parcel';
  /** shown in the simple public atlas */
  simple: boolean;
  low: string; high: string;
}
export const LAYERS: LayerDef[] = [
  { id: 'ror', label: 'Land records digitised (RoR)', short: 'Records digitised', unit: '%', decimals: 1, polarity: 'good-high', group: 'Records', level: 'region', simple: true, datasetId: 'DS-01',
    what: 'Share of village Records of Rights (RoR) that have been converted from paper into a computerised record.', read: 'Darker green = more records are digital.', low: 'Less digital', high: 'More digital' },
  { id: 'cadastral', label: 'Cadastral maps digitised', short: 'Maps digitised', unit: '%', decimals: 1, polarity: 'good-high', group: 'Records', level: 'region', simple: false, datasetId: 'DS-02',
    what: 'Share of village parcel (cadastral) maps that exist as digital, geo-referenced maps and can be linked to the record.', read: 'Darker green = more maps are digital.', low: 'Fewer maps', high: 'More maps' },
  { id: 'mutation', label: 'Average mutation time', short: 'Mutation delay', unit: 'days', decimals: 0, polarity: 'bad-high', group: 'Records', level: 'region', simple: true, datasetId: 'DS-04',
    what: 'Average days between a sale/inheritance being registered and the land record (mutation) being updated.', read: 'Darker red = longer waits for record updates.', low: 'Faster', high: 'Slower' },
  { id: 'conversion', label: 'Farmland converted to other uses (5 yr)', short: 'Farmland conversion', unit: '%', decimals: 1, polarity: 'bad-high', group: 'Land use', level: 'region', simple: true, datasetId: 'DS-05',
    what: 'Share of agricultural land that changed to non-agricultural use over the last five years (housing, industry, roads).', read: 'Darker red = more farmland lost to other uses.', low: 'Little change', high: 'High change' },
  { id: 'urban', label: 'Urbanisation pressure', short: 'Urban pressure', unit: 'index', decimals: 0, polarity: 'bad-high', group: 'Land use', level: 'region', simple: false, datasetId: 'DS-05',
    what: 'Composite index (0–100) of how strongly urban growth is pressing on surrounding land.', read: 'Darker = stronger pressure on land.', low: 'Low pressure', high: 'High pressure' },
  { id: 'climate', label: 'Climate vulnerability of land', short: 'Climate risk', unit: 'index', decimals: 0, polarity: 'bad-high', group: 'Risk', level: 'region', simple: true, datasetId: 'DS-06',
    what: 'Composite index (0–100) of exposure of land to floods, cyclones, sea-level rise and drought.', read: 'Darker red = land is more exposed to climate hazards.', low: 'Lower risk', high: 'Higher risk' },
  { id: 'disputes', label: 'Pending land disputes', short: 'Land disputes', unit: 'per 10k parcels', decimals: 0, polarity: 'bad-high', group: 'Risk', level: 'region', simple: false, datasetId: 'DS-07',
    what: 'Pending land-related disputes per 10,000 land parcels. Higher numbers suggest unclear titles or stale records.', read: 'Darker red = more disputes per 10,000 parcels.', low: 'Fewer', high: 'More' },
  // parcel-level
  { id: 'p_landuse', label: 'Land use (parcel)', short: 'Land use', unit: '', decimals: 0, polarity: 'good-high', group: 'Parcel', level: 'parcel', simple: true, datasetId: 'DS-08',
    what: 'Recorded use of each demo parcel: farmland, homes, business, water body or open land.', read: 'Each colour is a land-use class — see the legend.', low: '', high: '' },
  { id: 'p_mutation', label: 'Record update status (parcel)', short: 'Record status', unit: '', decimals: 0, polarity: 'bad-high', group: 'Parcel', level: 'parcel', simple: true, datasetId: 'DS-08',
    what: 'Whether the parcel\'s record is up to date, or a registered transaction is still waiting to be reflected (mutation pending).', read: 'Red = update pending; green = record up to date.', low: '', high: '' },
  { id: 'p_dispute', label: 'Dispute flag (parcel)', short: 'Disputes', unit: '', decimals: 0, polarity: 'bad-high', group: 'Parcel', level: 'parcel', simple: false, datasetId: 'DS-08',
    what: 'Parcels with a recorded boundary or ownership dispute.', read: 'Red = recorded dispute.', low: '', high: '' },
  { id: 'p_flood', label: 'Flood exposure (parcel)', short: 'Flood exposure', unit: '', decimals: 0, polarity: 'bad-high', group: 'Parcel', level: 'parcel', simple: true, datasetId: 'DS-08',
    what: 'Modelled flood exposure of each demo parcel based on distance from the tank / low-lying area.', read: 'Darker blue = higher modelled flood exposure.', low: '', high: '' },
];
export const REGION_LAYERS = LAYERS.filter(l => l.level === 'region');
export const PARCEL_LAYERS = LAYERS.filter(l => l.level === 'parcel');
export const layerById = (id: string) => LAYERS.find(l => l.id === id);

function indicators(id: string, t: RegionTraits, base?: Record<string, number>): Record<string, number> {
  const m = t.maturity;
  const ror = clamp(72 + 27 * m + noise(id, 'ror', 1.6), 60, 99.8);
  const cadastral = clamp(32 + 62 * m + noise(id, 'cad', 4), 20, 98);
  const mutation = clamp(64 - 50 * m + 16 * t.dispute + 8 * t.urban + noise(id, 'mut', 3), 9, 80);
  const conversion = clamp(.7 + 8.2 * t.urban + 1.8 * t.coast + noise(id, 'conv', .6), .3, 11);
  const urban = clamp(t.urban * 88 + 6 + noise(id, 'urb', 4), 3, 99);
  const climate = clamp(20 + 56 * t.coast + 14 * (1 - m) + 6 * t.urban + noise(id, 'cli', 5), 8, 96);
  const disputes = clamp(16 + 128 * t.dispute + 24 * t.urban + noise(id, 'dis', 7), 6, 190);
  void base;
  return { ror: r1(ror), cadastral: r1(cadastral), mutation: Math.round(mutation), conversion: r1(conversion), urban: Math.round(urban), climate: Math.round(climate), disputes: Math.round(disputes) };
}

export interface Region { id: string; name: string; level: 'country' | 'state' | 'district'; parent?: string; zone?: string; ut?: boolean; values: Record<string, number>; traits?: RegionTraits }
const stateRegions: Region[] = STATES.map(s => ({ id: s.code, name: s.name, level: 'state', parent: 'IN', zone: s.zone, ut: s.ut, traits: s, values: indicators(s.code, s) }));
const districtRegions: Region[] = DISTRICTS.map(x => {
  const st = STATES.find(s => s.code === x.state)!;
  // districts inherit the state's record-system maturity ± their own trait
  const v = indicators(x.id, { ...x, maturity: clamp((x.maturity + st.maturity) / 2, 0, 1) });
  return { id: x.id, name: x.name, level: 'district', parent: x.state, zone: st.zone, traits: x, values: v };
});

const avg = (k: string) => r1(stateRegions.reduce((a, r) => a + r.values[k], 0) / stateRegions.length);
export const NATIONAL: Region = {
  id: 'IN', name: 'India (state average)', level: 'country',
  values: Object.fromEntries(REGION_LAYERS.map(l => [l.id, l.decimals === 0 ? Math.round(avg(l.id)) : avg(l.id)])),
};
export const REGIONS: Region[] = [NATIONAL, ...stateRegions, ...districtRegions];
export const regionById = (id: string) => REGIONS.find(r => r.id === id);
export const regionName = (id: string) => regionById(id)?.name ?? id;
export const statesList = () => stateRegions;
export const districtsOf = (state: string) => districtRegions.filter(r => r.parent === state);
export const hasDistricts = (state: string) => districtsOf(state).length > 0;
export const stateDef = (code: string) => STATES.find(s => s.code === code);
export const districtDef = (id: string) => DISTRICTS.find(x => x.id === id);

/** Peers used for ranking: states for states, sibling districts for districts. */
export function peersOf(r: Region): Region[] {
  if (r.level === 'state') return stateRegions;
  if (r.level === 'district') return districtsOf(r.parent!);
  return stateRegions;
}
export function rankOf(r: Region, layer: string): { rank: number; of: number } {
  const peers = peersOf(r); const def = layerById(layer)!;
  const sorted = [...peers].sort((a, b) => def.polarity === 'bad-high' ? b.values[layer] - a.values[layer] : b.values[layer] - a.values[layer]);
  return { rank: sorted.findIndex(p => p.id === r.id) + 1, of: peers.length };
}
export function benchmarkOf(r: Region): Region { return r.level === 'district' ? regionById(r.parent!)! : NATIONAL; }
export function fmt(layer: string, v: number | undefined): string {
  if (v === undefined) return '—'; const def = layerById(layer); if (!def) return String(v);
  const n = def.decimals === 0 ? String(Math.round(v)) : v.toFixed(def.decimals);
  return def.unit === '%' ? `${n}%` : def.unit === 'days' ? `${n} days` : def.unit === 'per 10k parcels' ? `${n} / 10k` : n;
}

/** Worse/better judgement relative to benchmark, based on polarity. */
export function judge(layer: string, v: number, bench: number): 'better' | 'worse' | 'similar' {
  const def = layerById(layer)!; const diff = (v - bench) / (Math.abs(bench) || 1);
  if (Math.abs(diff) < 0.05) return 'similar';
  const higher = diff > 0; return def.polarity === 'good-high' ? (higher ? 'better' : 'worse') : (higher ? 'worse' : 'better');
}

// ---------- colour scales ----------
function mix(a: [number, number, number], b: [number, number, number], t: number) { return a.map((x, i) => Math.round(x + (b[i] - x) * t)) as [number, number, number]; }
const GOOD: [number, number, number][] = [[226, 240, 236], [128, 190, 170], [38, 128, 112], [14, 78, 76]];
const BAD: [number, number, number][] = [[253, 240, 214], [244, 190, 120], [214, 104, 70], [140, 40, 44]];
export function scaleColor(polarity: 'good-high' | 'bad-high', t: number): string {
  const stops = polarity === 'good-high' ? GOOD : BAD; const x = clamp(t, 0, 1) * (stops.length - 1); const i = Math.min(stops.length - 2, Math.floor(x));
  const c = mix(stops[i], stops[i + 1], x - i); return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function layerRange(layer: string, regions: Region[]): [number, number] {
  const vals = regions.map(r => r.values[layer]); return [Math.min(...vals), Math.max(...vals)];
}
export function colorFor(layer: string, v: number, range: [number, number]): string {
  const def = layerById(layer)!; const [lo, hi] = range; return scaleColor(def.polarity, hi === lo ? .5 : (v - lo) / (hi - lo));
}
export function textOn(color: string): string {
  const m = color.match(/\d+/g)!.map(Number); const l = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]); return l < 140 ? '#fff' : '#17232c';
}

// ---------- parcel cluster (synthetic village) ----------
export interface Parcel {
  id: string; ulpin: string; points: [number, number][]; cx: number; cy: number; area: number;
  landUse: 'Farmland' | 'Homes' | 'Business' | 'Water body' | 'Open land' | 'Road / public';
  holder: 'Individual' | 'Joint holding' | 'Government' | 'Trust / institution';
  mutationPending: boolean; pendingDays: number; dispute: boolean; flood: 0 | 1 | 2 | 3; lastUpdated: string;
}
export const PARCEL_VILLAGE = { id: 'V-DEMO-01', name: 'Kolathur (demo village)', district: 'TN-CGL', state: 'TN' };
export const LAND_USE_COLORS: Record<Parcel['landUse'], string> = {
  'Farmland': '#a8c98a', 'Homes': '#e9b872', 'Business': '#c97b84', 'Water body': '#8fc1e3', 'Open land': '#d9d2b8', 'Road / public': '#b9bec4',
};
let parcelCache: Parcel[] | null = null;
export function parcels(): Parcel[] {
  if (parcelCache) return parcelCache;
  const R = rng(20261002); const cols = 16, rows = 11, W = 100, H = 70, cw = W / cols, ch = H / rows;
  const vx: number[][] = [], vy: number[][] = [];
  for (let j = 0; j <= rows; j++) { vx[j] = []; vy[j] = []; for (let i = 0; i <= cols; i++) {
    const edge = i === 0 || j === 0 || i === cols || j === rows;
    vx[j][i] = i * cw + (edge ? 0 : (R() - .5) * cw * .55); vy[j][i] = j * ch + (edge ? 0 : (R() - .5) * ch * .55); } }
  const out: Parcel[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const pts: [number, number][] = [[vx[j][i], vy[j][i]], [vx[j][i + 1], vy[j][i + 1]], [vx[j + 1][i + 1], vy[j + 1][i + 1]], [vx[j + 1][i], vy[j + 1][i]]];
    const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
    // low-lying tank band running diagonally; village core on the east near the road
    const tankDist = Math.abs((cx - 38) * .8 + (cy - 30) * .6 - 6) ; // distance to a diagonal line
    const inTank = (cx > 28 && cx < 46 && cy > 22 && cy < 40) && R() > .25;
    const core = Math.hypot(cx - 78, cy - 34); const road = i === 9 || j === 5;
    let landUse: Parcel['landUse'];
    if (inTank) landUse = 'Water body';
    else if (road) landUse = 'Road / public';
    else if (core < 14) landUse = R() > .78 ? 'Business' : 'Homes';
    else if (core < 24) landUse = R() > .55 ? 'Homes' : (R() > .5 ? 'Open land' : 'Farmland');
    else landUse = R() > .9 ? 'Open land' : 'Farmland';
    const n = out.length + 1;
    const pend = landUse !== 'Water body' && landUse !== 'Road / public' && R() < (core < 24 ? .30 : .12);
    const dispute = landUse !== 'Water body' && landUse !== 'Road / public' && R() < (pend ? .17 : .05);
    const flood = (tankDist < 7 ? 3 : tankDist < 13 ? 2 : tankDist < 20 ? 1 : 0) as 0 | 1 | 2 | 3;
    const area = Math.abs(((pts[0][0] * pts[1][1] - pts[1][0] * pts[0][1]) + (pts[1][0] * pts[2][1] - pts[2][0] * pts[1][1]) + (pts[2][0] * pts[3][1] - pts[3][0] * pts[2][1]) + (pts[3][0] * pts[0][1] - pts[0][0] * pts[3][1])) / 2) / 28;
    out.push({
      id: `P-${String(n).padStart(4, '0')}`, ulpin: `DEMO-TN-CGL-${String(n).padStart(4, '0')}`, points: pts, cx, cy, area: Math.round(area * 100) / 100,
      landUse, holder: landUse === 'Road / public' || landUse === 'Water body' ? 'Government' : (R() < .12 ? 'Joint holding' : R() < .04 ? 'Trust / institution' : 'Individual'),
      mutationPending: pend, pendingDays: pend ? Math.round(20 + R() * 150) : 0, dispute, flood,
      lastUpdated: pend ? `2026-0${1 + Math.floor(R() * 5)}-1${Math.floor(R() * 9)}` : `2026-0${3 + Math.floor(R() * 6)}-0${1 + Math.floor(R() * 8)}`,
    });
  }
  parcelCache = out; return out;
}
export const FLOOD_LABEL = ['Low', 'Moderate', 'High', 'Very high'];
export const FLOOD_COLORS = ['#e4f1f8', '#a7d1ea', '#5b9fd0', '#2b5f9e'];
export function parcelStats() {
  const ps = parcels().filter(p => p.landUse !== 'Road / public' && p.landUse !== 'Water body');
  const pend = ps.filter(p => p.mutationPending); const hiFlood = ps.filter(p => p.flood >= 2);
  return {
    total: ps.length, pending: pend.length, pendingPct: Math.round(100 * pend.length / ps.length),
    disputes: ps.filter(p => p.dispute).length, highFlood: hiFlood.length,
    pendingAndFlood: pend.filter(p => p.flood >= 2).length,
    avgPendingDays: Math.round(pend.reduce((a, p) => a + p.pendingDays, 0) / Math.max(1, pend.length)),
    farmland: ps.filter(p => p.landUse === 'Farmland').length,
  };
}

// ---------- helpers for search & CSV ----------
export function searchRegions(q: string, limit = 8): Region[] {
  const s = q.trim().toLowerCase(); if (!s) return [];
  return REGIONS.filter(r => r.level !== 'country' && (r.name.toLowerCase().includes(s) || r.id.toLowerCase() === s))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(s)) - Number(a.name.toLowerCase().startsWith(s))).slice(0, limit);
}
export function regionsCsv(level: 'state' | 'district', state?: string): string {
  const rows = REGIONS.filter(r => r.level === level && (!state || r.parent === state));
  const head = ['region_id', 'name', 'level', 'parent', ...REGION_LAYERS.map(l => `${l.id}_${l.unit.replace(/\W+/g, '_') || 'index'}`), 'data_status'];
  return [head.join(','), ...rows.map(r => [r.id, `"${r.name}"`, r.level, r.parent ?? '', ...REGION_LAYERS.map(l => r.values[l.id]), 'DEMO - synthetic prototype data'].join(','))].join('\n');
}
export function parcelsCsv(): string {
  const head = 'parcel_id,demo_ulpin,land_use,holder,area_ha,mutation_pending,pending_days,dispute,flood_exposure,last_updated,data_status';
  return [head, ...parcels().map(p => [p.id, p.ulpin, p.landUse, p.holder, p.area, p.mutationPending, p.pendingDays, p.dispute, FLOOD_LABEL[p.flood], p.lastUpdated, 'DEMO - synthetic parcel, not a cadastral boundary'].join(','))].join('\n');
}
