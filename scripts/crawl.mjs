/* Link crawler / smoke test.  Usage: BASE=http://localhost:3000 node scripts/crawl.mjs
   Requires playwright (npm i -D playwright) and a running server. Visits every internal link reachable from each portal
   and fails on: HTTP errors, console errors, uncaught exceptions, "not found" pages, empty pages, missing <h1>. */
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:3000';
const ROLES = ['government', 'researcher', 'public'];
const SESSION = { email: 'admin@landintel.demo', name: 'Demo Administrator', org: 'Nilam prototype team', roles: ROLES };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let failures = 0; const seenGlobal = new Set(); let visited = 0;
for (const role of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await ctx.addInitScript(s => { try { localStorage.setItem('landintel-session', JSON.stringify(s)); } catch {} }, { ...SESSION, role });
  const page = await ctx.newPage(); const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE) && !r.url().includes('favicon')) problems.push(`http ${r.status()} ${r.url()}`); });
  const queue = [`/portal/${role}/overview`, `/portal/${role}/about`, `/portal/${role}/search?q=land`]; const seen = new Set(queue);
  while (queue.length) {
    const url = queue.shift(); problems.length = 0;
    await page.goto(BASE + url, { waitUntil: 'networkidle' }).catch(e => problems.push('goto: ' + e.message));
    await page.waitForTimeout(250);
    const info = await page.evaluate(() => ({ h1: document.querySelector('h1')?.textContent?.trim() ?? '', len: document.body.innerText.length, text: document.body.innerText.slice(0, 4000), links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/portal')) }));
    visited++;
    if (!info.h1) problems.push('no <h1>'); if (info.len < 200) problems.push(`page nearly empty (${info.len} chars)`);
    if (/Page not found|record was not found|Opening…|Checking your session/.test(info.text)) problems.push('not-found / stuck page');
    if (page.url().replace(BASE, '') !== url && !url.includes('#')) { const f = page.url().replace(BASE, ''); if (!f.startsWith(`/portal/${role}`)) problems.push(`redirected to ${f}`); }
    if (problems.length) { failures++; console.log(`✗ [${role}] ${url}\n   ${[...new Set(problems)].join('\n   ')}`); }
    for (const l of info.links) { const clean = l.split('#')[0]; if (!seen.has(clean)) { seen.add(clean); queue.push(clean); } }
  }
  console.log(`[${role}] pages visited: ${seen.size}`);
  await ctx.close();
}
await browser.close();
console.log(`\nVisited ${visited} pages, ${failures} with problems`); process.exit(failures ? 1 : 0);
