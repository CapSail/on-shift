/**
 * The page that will replace the old SHIFTY-1 link (cutover/shifty-1/), tested before it ever goes near the
 * shifty-1 repo. The preview server plays capsail.github.io: /shifty-1/ serves the forwarding page and /on-shift/
 * serves this build, on one origin, exactly like the two GitHub Pages sites.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fx = JSON.parse(readFileSync('tests/fixtures/shifty1-standalone-save.json', 'utf8')) as { save: string; decks: string };
const OLD = JSON.parse(fx.save);
const FORWARD = readFileSync('cutover/shifty-1/index.html', 'utf8');

test.use({ serviceWorkers: 'block' }); // the routes below stand in for the two sites; workers would bypass them

async function twoSites(context: BrowserContext): Promise<void> {
  await context.route('**/shifty-1/**', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/shifty-1/' || p === '/shifty-1/index.html') return route.fulfill({ contentType: 'text/html', body: FORWARD });
    return route.fulfill({ status: 404, body: '' }); // manifest, icons, sw: not needed here
  });
  await context.route('**/on-shift/**', async (route) => {
    const u = new URL(route.request().url());
    u.pathname = u.pathname.replace(/^\/on-shift/, '');
    try { await route.fulfill({ response: await route.fetch({ url: u.href }) }); } catch { /* the page closed while a late request was in flight */ }
  });
}
const withOldSave = (page: Page) => page.addInitScript(([save, decks]) => {
  if (localStorage.getItem('shifty1.v1') === null) { localStorage.setItem('shifty1.v1', save); localStorage.setItem('shifty1.decks', decks); }
}, [fx.save, fx.decks] as const);

test('the old link in a browser tab forwards to SHIFTY-1 inside ON SHIFT, with the progress there', async ({ page, context }) => {
  await twoSites(context);
  await withOldSave(page);
  await page.goto('/shifty-1/');
  await expect(page.getByText('START TRAINING RUN')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/on-shift/');
  await expect(page.locator('.hdr')).toContainText(`${OLD.xp} XP`);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('shifty1.v1')))!)).toEqual(OLD);
  // forwarding replaced the history entry: Back does not bounce through the old address again
  await page.screenshot({ path: 'tests/shots/shell_forwarded.png' });
});

test('a new visitor on the old link gets SHIFTY-1 (not the SOC game) in ON SHIFT', async ({ page, context }) => {
  await twoSites(context);
  await page.goto('/shifty-1/');
  await expect(page.getByText('TRAIN SHIFTY-1')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/on-shift/');
});

test('from the old installed icon (Android) it explains the move and links to ON SHIFT', async ({ page, context }) => {
  await twoSites(context);
  await withOldSave(page);
  await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true }); });
  await page.goto('/shifty-1/');
  await expect(page.getByRole('heading', { name: 'SHIFTY-1 moved into ON SHIFT' })).toBeVisible();
  await expect(page.getByText('Your progress is already there')).toBeVisible();
  await expect(page.locator('#ios')).toBeHidden();
  await page.screenshot({ path: 'tests/shots/shell_moved_android.png', fullPage: true });
  await page.locator('#open').click();
  await expect(page.getByText('START TRAINING RUN')).toBeVisible();
  await expect(page.locator('.hdr')).toContainText(`${OLD.xp} XP`);
});

test('from the old installed icon on an iPhone it hands over a progress code the app accepts', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, serviceWorkers: 'block',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  await twoSites(context);
  const page = await context.newPage();
  await withOldSave(page);
  await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true }); });
  await page.goto('/shifty-1/');
  await expect(page.getByText('iPhone: bring your progress with you')).toBeVisible();
  await page.locator('#copy').click();
  await expect(page.locator('#code')).toHaveValue(/^S1:[A-Za-z0-9+/=]+$/);
  const code = await page.locator('#code').inputValue();
  await page.screenshot({ path: 'tests/shots/shell_moved_iphone.png', fullPage: true });
  await context.close();

  // the new install: its own empty storage; paste the code in AI school -> About -> Move my progress
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const app = await fresh.newPage();
  await app.addInitScript(() => { if (localStorage.getItem('shifty1.v1') === null) localStorage.setItem('shifty1.v1', JSON.stringify({ onb: true })); });
  await app.goto('./#shifty-1');
  await app.locator('#about').click();
  await app.locator('#move').click();
  await app.locator('#mcode').fill(code);
  app.once('dialog', (d) => void d.accept());
  await app.locator('#mload').click();
  await expect(app.locator('.hdr')).toContainText(`${OLD.xp} XP`);
  expect(JSON.parse((await app.evaluate(() => localStorage.getItem('shifty1.v1')))!)).toEqual(OLD);
  await fresh.close();
});

test('the forwarding service worker keeps the old worker\'s update contract', () => {
  const sw = readFileSync('cutover/shifty-1/sw.js', 'utf8');
  expect(sw).toContain("event.data === 'SKIP_WAITING'"); // the old app's "New version ready" tap still works
  expect(sw).toMatch(/k\.startsWith\('shifty1-'\) && k !== CACHE/); // and the old app's cache is cleared
  expect(sw).not.toMatch(/install[^]*?self\.skipWaiting\(\);[^]*?message/); // never swaps mid-run on its own
});
