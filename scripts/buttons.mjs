/* Dead-button detector.  Usage: BASE=http://localhost:3000 node scripts/buttons.mjs
   For each module page (and one detail page per record type) clicks every visible, enabled button / role=button element
   and reports any that produce NO observable effect (no navigation, DOM change, stored-state change, download, print or dialog). */
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:3000';
const ROLES = ['government', 'researcher', 'public'];
const SKIP = /sign out|reset demo|yes, reset/i;
const PAGES = {
  government: ['overview', 'problems', 'problems/PP-024', 'problems/PP-019', 'evidence', 'evidence?problem=PP-015', 'evidence/RP-02', 'evidence/POL-01', 'evidence/LIT-06', 'simulator', 'simulator/SIM-024', 'simulator/SIM-019', 'pilots', 'pilots/PL-01', 'pilots/PL-02', 'pilots/PL-04', 'programmes', 'programmes/PRG-01', 'gis', 'gis?region=TN&drill=1&layer=mutation', 'gis?region=TN-CGL&layer=climate', 'gis?region=TN-CGL&view=parcels', 'datasets', 'datasets/DS-01', 'datasets/DS-03', 'datasets/DS-08', 'cases', 'cases/CS-05', 'innovation', 'innovation/OP-01', 'reports', 'reports/RPT-01', 'reports/CN-01', 'about', 'search?q=mutation'],
  researcher: ['overview', 'projects', 'projects/RP-02', 'projects/RP-04', 'datasets', 'datasets/DS-04', 'datasets/DS-03', 'library', 'library/LIT-06', 'library/POL-03', 'library/PRG-01', 'gis', 'gis?region=UP&layer=disputes', 'gaps', 'gaps/GAP-01', 'collab', 'collab/TM-01', 'grants', 'grants/OP-01', 'publish', 'publish/PUB-01', 'publish/PUB-06', 'publish/CS-05', 'about', 'search?q=flood'],
  public: ['overview', 'atlas', 'atlas?region=TN&drill=1&layer=mutation', 'atlas?region=TN-CGL&view=parcels', 'research', 'research/RP-02', 'research/CS-05', 'policy', 'policy/ART-05', 'policy/POL-02', 'insights', 'insights/TN', 'insights/UP', 'data', 'data/DS-01', 'consultations', 'consultations/CN-01', 'consultations/CN-03', 'schemes', 'schemes/PRG-01', 'about', 'search?q=land'],
};
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let dead = 0, clicked = 0;
for (const role of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  await ctx.addInitScript(s => { try { if (!localStorage.getItem('landintel-session')) localStorage.setItem('landintel-session', JSON.stringify(s)); window.__printed = 0; window.print = () => { window.__printed++; }; } catch {} }, { email: 'admin@landintel.demo', name: 'Demo Administrator', org: 'x', roles: ROLES, role });
  const page = await ctx.newPage(); let downloaded = 0, dialogs = 0, errors = [];
  page.on('download', () => downloaded++); page.on('dialog', d => { dialogs++; d.dismiss(); });
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  for (const p of PAGES[role]) {
    const url = `${BASE}/portal/${role}/${p}`; errors = [];
    await page.goto(url, { waitUntil: 'networkidle' }); await page.waitForTimeout(300);
    const sel = 'button:not([disabled]):visible, [role="button"]:visible, [role="tab"]:visible, [role="listitem"]:visible, [role="option"]:visible, summary:visible';
    const n = await page.locator(sel).count();
    for (let i = 0; i < n; i++) {
      const loc = page.locator(sel).nth(i); if (!(await loc.count())) break;
      const label = ((await loc.innerText().catch(() => '')) || (await loc.getAttribute('aria-label').catch(() => '')) || (await loc.getAttribute('title').catch(() => '')) || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      if (SKIP.test(label)) continue;
      const snap = async () => page.evaluate(() => document.body.innerText.length + '|' + document.body.innerText.slice(0, 3000) + '|' + location.href + '|' + localStorage.getItem('landintel-store-v1') + '|' + (window.__printed || 0) + '|' + document.querySelectorAll('[role=dialog]').length + '|' + [...document.querySelectorAll('[aria-pressed],[aria-selected],[aria-expanded]')].map(e => e.getAttribute('aria-pressed') + e.getAttribute('aria-selected') + e.getAttribute('aria-expanded')).join(''));
      const before = await snap(); const d0 = downloaded, dl0 = dialogs;
      try { await loc.scrollIntoViewIfNeeded({ timeout: 1500 }); await loc.click({ timeout: 3000, force: false }); } catch (e) { console.log(`? [${role}] ${p} :: "${label}" not clickable (${String(e).split('\n')[0].slice(0, 80)})`); continue; }
      clicked++; await page.waitForTimeout(220);
      const after = await snap(); const changed = before !== after || downloaded > d0 || dialogs > dl0;
      if (!changed) { dead++; console.log(`✗ DEAD [${role}] /${p} :: "${label}"`); }
      if (page.url() !== before.split('|')[2] && !page.url().startsWith(url.split('?')[0].split('#')[0]) || (await page.locator('[role=dialog]').count())) { await page.goto(url, { waitUntil: 'networkidle' }); await page.waitForTimeout(200); }
    }
    if (errors.length) console.log(`✗ [${role}] /${p} page errors: ${errors.join(' | ')}`);
  }
  await ctx.close();
}
await browser.close(); console.log(`\nClicked ${clicked} controls, ${dead} with no observable effect`); process.exit(dead ? 1 : 0);
