/**
 * Phase 1 acceptance: installable, fully offline, report link, credits, no claude.ai links,
 * and a daily shift that is the same in every time zone.
 */
import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { currentAlert, playRun, seed } from './helpers';

const errors: string[] = [];
test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
});
test.afterEach(() => { expect(errors, 'no page or console errors').toEqual([]); });

test('manifest and icons make it installable', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await request.get(new URL(href!, page.url()).href);
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('ON SHIFT');
  expect(m.short_name).toBe('ON SHIFT');
  expect(m.display).toBe('standalone');
  expect(m.orientation).toBe('portrait');
  expect(m.theme_color).toBe('#06080c');
  expect(m.background_color).toBe('#06080c');
  const purposes = m.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes}/${i.purpose}`);
  expect(purposes).toEqual(expect.arrayContaining(['192x192/any', '512x512/any', '512x512/maskable']));
  for (const icon of m.icons) {
    const r = await request.get(new URL(icon.src, new URL(href!, page.url())).href);
    expect(r.ok(), icon.src).toBe(true);
    expect(r.headers()['content-type']).toContain('image/png');
  }
});

test('the service worker precaches the whole app and every entry is fetchable', async ({ page, request }) => {
  await page.goto('/');
  const sw = await (await request.get(new URL('sw.js', page.url()).href)).text();
  const files = JSON.parse(/const FILES = (\[.*\]);/.exec(sw)![1]) as string[];
  expect(files).toEqual(expect.arrayContaining(['./', './index.html', './manifest.webmanifest', './icons/icon-192.png']));
  expect(files.some((f) => /assets\/index-.*\.js$/.test(f)), 'app bundle').toBe(true);
  expect(files.some((f) => /assets\/.*\.css$/.test(f)), 'stylesheet').toBe(true);
  expect(files.filter((f) => f.endsWith('.woff2')).length, 'all four fonts').toBe(4);
  for (const f of files) expect((await request.get(new URL(f, page.url()).href)).ok(), f).toBe(true);
});

test('a full shift plays in airplane mode after the first visit', async ({ page, context }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await expect(page.locator('#go')).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller); // the worker has taken control
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith('onshift-')));

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#go'), 'the app loads with no network').toBeVisible();
  await page.locator('#go').click();
  await playRun(page);
  await expect(page.getByText('SHIFT REPORT')).toBeVisible();
  await expect(page.locator('.grade')).toHaveText('S');
  await context.setOffline(false);
});

test('every answer has a report link that opens a prefilled issue', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  const a = await currentAlert(page);
  await page.locator('#sure').click();
  await page.locator(`.acts button[data-c="${a.v ? 1 : 0}"]`).click();
  await page.locator('.pickable').waitFor();
  await page.locator(`.pickable [data-k="${a.k[0]}"]`).click();
  const link = page.locator('.rep a.rlink');
  await expect(link).toHaveText(/Report this answer/);
  const href = (await link.getAttribute('href'))!;
  const u = new URL(href);
  expect(u.origin + u.pathname).toBe('https://github.com/CapSail/on-shift/issues/new');
  expect(u.searchParams.get('template')).toBe('report.md');
  expect(u.searchParams.get('title')).toBe('[report] ' + a.id);
  const body = u.searchParams.get('body')!;
  expect(body).toContain(a.id);
  expect(body).toContain(a.v ? 'true positive' : 'benign');
  expect(body).toContain('My call: ' + (a.v ? 'escalate' : 'close') + ' (sure)');
  expect(body).toMatch(/App \S+ \| content v2/);
  const mail = page.locator('.rep a[href^="mailto:"]');
  await expect(mail, 'e-mail fallback for people without GitHub').toHaveAttribute('href', /^mailto:jrsjordans@gmail\.com\?subject=/);
  await expect(page.locator('.rep')).toContainText('jrsjordans@gmail.com');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});

test('the about screen carries the MITRE credit, the fictional disclaimer and font licences', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#about').click();
  const text = (await page.locator('.scr').innerText()).replace(/\s+/g, ' ');
  expect(text).toContain('© The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation.');
  expect(text).toContain('MITRE ATT&CK® is a registered trademark of The MITRE Corporation');
  expect(text).toContain('Nothing here is affiliated with, derived from, or based on any employer or client');
  expect(text).toContain('SIL Open Font License');
  expect(text).toMatch(/content v2/);
  await expect(page.locator('a[href="https://attack.mitre.org/"]')).toHaveCount(1);
  await page.screenshot({ path: 'tests/shots/20_about.png', fullPage: true });
  await page.locator('#q').click();
  await expect(page.locator('#go')).toBeVisible();
});

test('no claude.ai links anywhere in the shipped app or its source', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? (f === 'node_modules' || f === '.cache' || f === 'generated' ? [] : walk(p)) : [p];
  });
  const hits = [...walk('dist'), ...walk('src'), 'index.html', 'public/manifest.webmanifest']
    .filter((f) => /\.(js|css|html|ts|json|webmanifest)$/.test(f))
    .filter((f) => /claude\.ai/i.test(readFileSync(f, 'utf8')));
  expect(hits).toEqual([]);
});

test('the daily shift is the same in every time zone', async ({ browser }) => {
  // 03:00 UTC on 12 Nov is still the 11th in Chicago but already the 12th (17:00) in Kiritimati
  const seen: string[] = [];
  for (const timezoneId of ['America/Chicago', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Europe/London']) {
    const ctx = await browser.newContext({ timezoneId, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.clock.install({ time: new Date('2026-11-12T03:00:00Z') });
    await seed(page, { onb: true, shifts: 1 });
    await page.goto('/');
    const label = await page.locator('#daily .px').textContent();
    await page.locator('#daily').click();
    const first = await currentAlert(page);
    seen.push(`${label} ${first.id}`);
    await ctx.close();
  }
  expect(new Set(seen).size, seen.join('\n')).toBe(1);
});

test('a new deploy shows "tap to reload", and tapping it swaps in the new version', async ({ page }) => {
  const swPath = 'dist/sw.js';
  const original = readFileSync(swPath, 'utf8');
  try {
    await seed(page, { onb: true, shifts: 1 });
    await page.goto('/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await expect(page.locator('#upd')).toHaveCount(0);

    // "deploy" a new build: the worker file changes and carries a new build id (so a new cache name)
    writeFileSync(swPath, original.replace(/const BUILD = '[^']+'/, "const BUILD = 'next-deploy'"));
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect(page.locator('#upd')).toBeVisible();
    await expect(page.locator('#upd')).toContainText('New version ready');
    expect(await page.evaluate(async () => (await caches.keys()).sort())).toHaveLength(2); // old and new caches coexist until the swap

    await Promise.all([page.waitForEvent('load'), page.locator('#upd button').click()]);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await expect(page.locator('#go')).toBeVisible();
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).sort())).toEqual(['onshift-next-deploy']);
  } finally {
    writeFileSync(swPath, original); // never leave the build modified
  }
});
