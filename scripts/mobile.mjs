/* Responsive check: loads pages at phone/tablet widths and reports horizontal overflow and page errors.
   Usage: BASE=http://localhost:3000 node scripts/mobile.mjs */
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:3000';
const ROLES = ['government', 'researcher', 'public'];
const PAGES = {
  government: ['overview', 'problems/PP-024', 'evidence', 'simulator/SIM-024', 'pilots/PL-01', 'gis', 'gis?region=TN-CGL&view=parcels', 'datasets/DS-01', 'reports/RPT-01'],
  researcher: ['overview', 'projects/RP-02', 'datasets', 'gis', 'gaps', 'collab/TM-01', 'publish/PUB-01'],
  public: ['overview', 'atlas', 'research/RP-02', 'policy/ART-05', 'insights/TN', 'data', 'consultations/CN-01', 'schemes/PRG-01'],
};
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let bad = 0;
for (const w of [390, 768]) for (const role of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 } });
  await ctx.addInitScript(s => localStorage.setItem('landintel-session', JSON.stringify(s)), { email: 'admin@landintel.demo', name: 'Demo Administrator', org: 'x', roles: ROLES, role });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  for (const p of PAGES[role]) {
    errs.length = 0; await page.goto(`${BASE}/portal/${role}/${p}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(200);
    const o = await page.evaluate(() => {
      const d = document.documentElement;
      const off = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && !e.closest('.side') && getComputedStyle(e).position !== 'fixed'; }).slice(0, 3).map(e => e.tagName + '.' + String(e.className).slice(0, 30));
      return { over: d.scrollWidth - innerWidth, off };
    });
    if (o.over > 2 || errs.length) { bad++; console.log(`✗ ${w}px [${role}] /${p} overflow=${o.over} ${o.off.join(',')} ${errs.join('|')}`); }
  }
  await ctx.close();
}
await browser.close(); console.log(bad ? `${bad} problem page(s)` : 'No overflow or errors'); process.exit(bad ? 1 : 0);
