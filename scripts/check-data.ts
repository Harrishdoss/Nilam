/* Data integrity check: every cross-reference in the seed data must resolve.  Run: npm run check:data */
import { allEntities, getEntity, hrefFor, ROLES, modules } from '../lib/registry';
import type { Role } from '../lib/types';
import { regionById } from '../lib/geo';
import { layerById } from '../lib/geo';

let bad = 0; const err = (m: string) => { bad++; console.error('✗ ' + m); };
const ents = allEntities();
const FIELDS = ['datasets', 'research', 'literature', 'policies', 'problems', 'cases', 'simulation', 'consultations', 'outputs', 'evidence', 'pilot', 'case', 'problem', 'projects', 'project', 'programme'];
for (const e of ents) {
  const x = e as unknown as Record<string, unknown>;
  for (const f of FIELDS) { const v = x[f]; const ids = typeof v === 'string' ? [v] : Array.isArray(v) ? v : []; for (const id of ids) if (typeof id === 'string' && /^[A-Z]+-/.test(id) && !getEntity(id)) err(`${e.id}.${f} -> missing ${id}`); }
  if (typeof x.gisRegion === 'string' && !regionById(x.gisRegion)) err(`${e.id}.gisRegion invalid ${x.gisRegion}`);
  if (typeof x.gisLayer === 'string' && !layerById(x.gisLayer)) err(`${e.id}.gisLayer invalid ${x.gisLayer}`);
  if (typeof x.layer === 'string' && !layerById(x.layer)) err(`${e.id}.layer invalid ${x.layer}`);
  if (Array.isArray(x.layers)) for (const l of x.layers) if (!layerById(l as string)) err(`${e.id}.layers invalid ${l}`);
  if (Array.isArray(x.regions)) for (const r of x.regions) if (r !== 'IN' && !regionById(r as string)) err(`${e.id}.regions invalid ${r}`);
}
for (const e of ents) {
  let n = 0; for (const r of ROLES as Role[]) if (hrefFor(r, e.id)) n++;
  if (!n) console.warn(`! ${e.id} (${e.kind}) not openable in any portal`);
}
const counts: Record<string, number> = {}; ents.forEach(e => counts[e.kind] = (counts[e.kind] || 0) + 1);
console.log('Entities:', ents.length, JSON.stringify(counts));
console.log('Modules:', ROLES.map(r => `${r}=${modules[r].length}`).join(' '));
if (bad) { console.error(`${bad} problem(s)`); process.exit(1); } else console.log('✓ all cross-references resolve');
