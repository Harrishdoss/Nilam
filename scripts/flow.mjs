/* End-to-end workflow test (government): preset -> save scenario -> plan pilot -> record readings -> conclude -> publish case -> brief.
   Usage: BASE=http://localhost:3000 node scripts/flow.mjs */
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:3000';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
let fails = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fails++; };

// login UI
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'admin@landintel.demo'); await page.fill('input[type=password]', 'demo123');
await page.click('button[type=submit]'); await page.waitForTimeout(500);
ok(/Government/i.test(await page.innerText('body')), 'login shows portal selection');
await page.locator('button.role-government').click(); await page.waitForTimeout(800);
ok(page.url().includes('/portal/government'), 'role select lands in government portal');

// simulate
await page.goto(`${BASE}/portal/government/simulator/SIM-024`, { waitUntil: 'networkidle' });
const preset = page.locator('.card button.btn.sm').filter({ hasText: /./ }).first();
const presetBtns = page.getByRole('button').filter({ hasText: /Option|Auto|trigger|SMS|Both|Combined/i });
if (await presetBtns.count()) await presetBtns.first().click();
await page.getByRole('button', { name: 'Save scenario' }).click(); await page.waitForTimeout(400);
ok(await page.getByRole('button', { name: 'Plan pilot' }).count() > 0, 'scenario saved and listed (Plan pilot visible)');
await page.getByRole('button', { name: 'Plan pilot' }).first().click(); await page.waitForTimeout(300);
await page.getByRole('dialog').getByRole('button').filter({ hasText: /Create|Plan|Start/i }).last().click(); await page.waitForTimeout(1200);
ok(/\/pilots\/PL-/.test(page.url()), 'pilot created and opened: ' + page.url());
const pilotUrl = page.url();

// record readings
await page.getByRole('button', { name: /Record readings/ }).click(); await page.waitForTimeout(300);
for (let m = 0; m < 2; m++) {
  const inputs = page.locator('input[type=number]');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) { const el = inputs.nth(i); const ph = await el.getAttribute('placeholder'); const v = Number(ph); if (!Number.isNaN(v)) await el.fill(String(v + 1 + m)); }
  await page.getByRole('button', { name: 'Save reading' }).click(); await page.waitForTimeout(300);
}
await page.getByRole('button', { name: /Conclude|evaluation/i }).first().click().catch(() => {}); await page.waitForTimeout(300);
const concl = page.getByRole('button', { name: /Conclude/ });
if (await concl.count()) await concl.first().click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Save evaluation' }).click(); await page.waitForTimeout(500);
ok(await page.getByRole('button', { name: 'Publish as case study' }).count() > 0, 'pilot concluded -> publish option');
await page.getByRole('button', { name: 'Publish as case study' }).click(); await page.waitForTimeout(1000);
ok(/\/cases\/CS-/.test(page.url()), 'case study published: ' + page.url());
await page.goto(pilotUrl + '#evaluation', { waitUntil: 'networkidle' });
const briefBtn = page.getByRole('button', { name: 'Generate evidence brief' });
if (await briefBtn.count()) { await briefBtn.click(); await page.waitForTimeout(800); ok(/\/reports\//.test(page.url()), 'evidence brief generated: ' + page.url()); } else ok(false, 'brief button missing');
ok(errs.length === 0, 'no page errors ' + errs.join('|'));
await browser.close(); console.log(fails ? `${fails} step(s) failed` : 'Flow OK'); process.exit(fails ? 1 : 0);
