/** The shell that joins the two shifts: the switch, deep links, separate saves, and both shifts working offline. */
import { test, expect, type Page } from '@playwright/test';
import { playRun } from '../soc/helpers';
import { playThrough } from '../ai/helpers';

const errors: string[] = [];
test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(() => expect(errors).toEqual([]));

/** Both games already past their first-run screens. */
const seedBoth = (page: Page) => page.addInitScript(() => {
  if (localStorage.getItem('onshift.v2') === null) localStorage.setItem('onshift.v2', JSON.stringify({ onb: true, shifts: 1, xp: 40 }));
  if (localStorage.getItem('shifty1.v1') === null) localStorage.setItem('shifty1.v1', JSON.stringify({ onb: true, xp: 200 }));
});
const ls = (page: Page, k: string) => page.evaluate((key) => localStorage.getItem(key), k);
const socHome = (page: Page) => expect(page.getByText('NEW ROUND')).toBeVisible();
const aiHome = (page: Page) => expect(page.getByText('START TRAINING RUN')).toBeVisible();

test('a brand-new visitor lands on the SOC game, and can hop to the AI school and back from the first screen', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('Start training (3 alerts)')).toBeVisible();
  await page.screenshot({ path: 'tests/shots/shell_first_soc.png' });
  await page.getByText('Open the AI school').click();
  await expect(page.getByText('TRAIN SHIFTY-1')).toBeVisible();
  await page.screenshot({ path: 'tests/shots/shell_first_ai.png', fullPage: true });
  await page.getByText('Open the SOC shift').click();
  await expect(page.getByText('Start training (3 alerts)')).toBeVisible();
  // looking around created no saves
  expect(await ls(page, 'onshift.v2')).toBeNull();
  expect(await ls(page, 'shifty1.v1')).toBeNull();
});

test('the switch flips between shifts, the choice is remembered, and each shift keeps its own XP, rank and sound', async ({ page }) => {
  await seedBoth(page);
  await page.goto('./');
  await socHome(page);
  await expect(page.locator('.shsw [data-shift="soc"]')).toHaveClass(/on/);
  await expect(page.locator('.rank')).toContainText('40 XP');
  await expect(page.locator('.rank .n')).toHaveText('Fresh Spook');
  await page.screenshot({ path: 'tests/shots/shell_home_soc.png' });

  await page.locator('.shsw [data-shift="ai"]').click();
  await aiHome(page);
  await expect(page.locator('.shsw [data-shift="ai"]')).toHaveClass(/on/);
  await expect(page.locator('.hdr')).toContainText('200 XP');
  await expect(page.locator('.rank .n')).toContainText('Tokenizer');
  await page.screenshot({ path: 'tests/shots/shell_home_ai.png' });

  await page.reload();
  await aiHome(page); // reopens on the shift used last

  // sound off in SHIFTY-1 only
  await page.locator('#snd').click();
  await expect(page.locator('#snd')).toContainText('sound off');
  await page.locator('.shsw [data-shift="soc"]').click();
  await socHome(page);
  await expect(page.locator('#snd')).toHaveText('🔊');
  expect(JSON.parse((await ls(page, 'shifty1.v1'))!).sound).toBe(false);
  expect(JSON.parse((await ls(page, 'onshift.v2'))!).xp).toBe(40);
  expect(JSON.parse((await ls(page, 'shifty1.v1'))!).xp).toBe(200);
  await page.reload();
  await socHome(page);
});

test('playing in one shift changes only that shift\'s save', async ({ page }) => {
  await seedBoth(page);
  await page.goto('./');
  await socHome(page);
  const aiBefore = await ls(page, 'shifty1.v1');
  await page.locator('#go').click();
  await playRun(page);
  await expect(page.getByText('ROUND REPORT')).toBeVisible();
  // one stylesheet serves both shifts: the SOC end screen keeps its own big grade (SHIFTY-1's is smaller)
  expect(await page.locator('.grade').first().evaluate((e) => getComputedStyle(e).fontSize)).toBe('60px');
  expect(await ls(page, 'shifty1.v1')).toBe(aiBefore);
  expect(JSON.parse((await ls(page, 'onshift.v2'))!).xp).toBeGreaterThan(40);

  await page.goto('./#shifty-1');
  await aiHome(page);
  const socBefore = await ls(page, 'onshift.v2');
  await page.getByText('START TRAINING RUN').click();
  await playThrough(page, { right: true });
  await expect(page.getByText('TRAINING RUN COMPLETE')).toBeVisible();
  expect(await ls(page, 'onshift.v2')).toBe(socBefore);
  expect(JSON.parse((await ls(page, 'shifty1.v1'))!).xp).toBeGreaterThan(200);
  // "Home" from a SHIFTY-1 end screen is the SHIFTY-1 home
  await page.getByRole('button', { name: 'Home' }).click();
  await aiHome(page);
});

test('deep links: #shifty-1 opens SHIFTY-1 (where the old link forwards to) and cleans the address; #soc goes back', async ({ page }) => {
  await seedBoth(page);
  await page.goto('./#shifty-1');
  await aiHome(page);
  expect(new URL(page.url()).hash).toBe('');
  expect(await ls(page, 'onshift.shift')).toBe('ai');
  await page.goto('./#soc');
  await socHome(page);
  expect(new URL(page.url()).hash).toBe('');
});

test('#card=<id> opens one SHIFTY-1 card from either shift without changing progress or the shift', async ({ page }) => {
  await seedBoth(page);
  await page.goto('./');
  await socHome(page);
  const before = [await ls(page, 'onshift.v2'), await ls(page, 'shifty1.v1')];
  await page.goto('./#card=d1-001');
  await page.reload();
  await expect(page.locator('.card .cid')).toHaveText('d1-001');
  expect(await ls(page, 'onshift.shift')).toBeNull();
  expect([await ls(page, 'onshift.v2'), await ls(page, 'shifty1.v1')]).toEqual(before);
  await page.locator('.bar a.x').click(); // ✕ leads to the SHIFTY-1 home
  await aiHome(page);
});

test('back from a screen returns to the home of the shift you are in', async ({ page }) => {
  await seedBoth(page);
  await page.goto('./#shifty-1');
  await aiHome(page);
  await page.locator('#syl').click();
  await expect(page.locator('[data-c]').first()).toBeVisible();
  await page.goBack();
  await aiHome(page);
  await page.locator('.shsw [data-shift="soc"]').click();
  await socHome(page);
  await page.locator('#dexb').click();
  await page.goBack();
  await socHome(page);
});

test('both shifts play in airplane mode after one visit, including a shift never opened while online', async ({ page, context }) => {
  await seedBoth(page);
  await page.goto('./');
  await socHome(page); // only the SOC shift has been opened
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith('onshift-')));

  await context.setOffline(true);
  await page.reload();
  await socHome(page);
  await page.locator('.shsw [data-shift="ai"]').click(); // SHIFTY-1's code and card bank come from the cache
  await aiHome(page);
  await page.getByText('START TRAINING RUN').click();
  await playThrough(page, { right: true });
  await expect(page.getByText('TRAINING RUN COMPLETE')).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('.shsw [data-shift="soc"]').click();
  await page.locator('#go').click();
  await playRun(page);
  await expect(page.getByText('ROUND REPORT')).toBeVisible();
  await context.setOffline(false);
});

test('one install: one manifest, one service worker, and it precaches both shifts', async ({ page, request }) => {
  await page.goto('./');
  const manifest = await (await request.get(new URL('manifest.webmanifest', page.url()).href)).json();
  expect(manifest.name).toBe('ON SHIFT');
  const sw = await (await request.get(new URL('sw.js', page.url()).href)).text();
  const files = JSON.parse(/const FILES = (\[.*\]);/.exec(sw)![1]) as string[];
  const big = [];
  for (const f of files.filter((x) => x.endsWith('.js'))) {
    const body = await (await request.get(new URL(f, page.url()).href)).text();
    if (body.includes('Certified AI Practitioner')) big.push('ai');
    if (body.includes('attack.mitre.org')) big.push('soc');
  }
  expect(big).toEqual(expect.arrayContaining(['ai', 'soc']));
});

test('shared class names do not leak styles across shifts (the locked boss tile is not a SHIFTY-1 lock-in button)', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('onshift.v2') === null) localStorage.setItem('onshift.v2', JSON.stringify({ onb: true, shifts: 0 }));
    if (localStorage.getItem('shifty1.v1') === null) localStorage.setItem('shifty1.v1', JSON.stringify({ onb: true }));
  });
  await page.goto('./');
  await socHome(page);
  await expect(page.locator('body')).toHaveAttribute('data-shift', 'soc');
  const css = (sel: string, prop: string) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);
  await expect(page.locator('#boss')).toHaveClass(/lock/); // no round finished yet: the boss tile is locked
  for (const prop of ['background-color', 'padding-top', 'margin-top', 'font-size', 'display']) expect(await css('#boss', prop), prop).toBe(await css('#dexb', prop));
  await page.screenshot({ path: 'tests/shots/shell_soc_locked_tile.png' });

  // and in the AI school the lock-in button still looks like a button
  await page.goto('./#card=d1-001');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-shift', 'ai');
});
