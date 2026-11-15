/**
 * The hard rule of the SHIFTY-1 merge: progress made in the standalone SHIFTY-1 app carries over intact.
 *
 * The fixture is a save written by the real standalone production build (tests/fixtures/make-shifty1-save.ts).
 * Both apps live on the same origin, so the merged app must read that save as it is: no conversion, nothing lost,
 * nothing reshaped (the standalone app has to keep reading it until the old link is forwarded).
 */
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { playThrough } from '../ai/helpers';

const fx = JSON.parse(readFileSync('tests/fixtures/shifty1-standalone-save.json', 'utf8')) as { save: string; decks: string };
const OLD = JSON.parse(fx.save);
const RANKS: [number, string][] = [[0, 'Random Weights'], [150, 'Tokenizer'], [450, 'Base Model'], [900, 'Instruction-Tuned'], [1600, "RLHF'd"], [2600, 'Grounded'], [4000, 'Tool User'], [6000, 'Agentic'], [8500, 'Frontier Model'], [12000, 'AGI (Allegedly)']];
const tier = (xp: number) => RANKS.filter((r) => xp >= r[0]).pop()![1];

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  // exactly what the standalone app left in this browser: its save and its line decks, and no shift ever picked
  await page.addInitScript(([save, decks]) => {
    if (localStorage.getItem('shifty1.v1') === null) { localStorage.setItem('shifty1.v1', save); localStorage.setItem('shifty1.decks', decks); }
  }, [fx.save, fx.decks] as const);
});
test.afterEach(() => expect(errors).toEqual([]));

const ls = (page: Page, k: string) => page.evaluate((key) => localStorage.getItem(key), k);

test('the fixture really is a played standalone save', () => {
  expect(OLD.ver).toBe(1);
  expect(OLD.xp).toBeGreaterThan(300);
  expect(Object.keys(OLD.cs).length).toBeGreaterThanOrEqual(4);
  expect(OLD.log.length).toBeGreaterThan(40);
  expect(OLD.bench.length).toBe(1);
  expect(Object.keys(OLD.daily).length).toBe(1);
  expect(OLD.examDay).not.toBeNull();
  expect(OLD.temp).toBe(1);
  expect(OLD.hat).toBe('beanie');
});

test('a browser that only has a SHIFTY-1 save opens straight into SHIFTY-1, with every number as it was', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('START TRAINING RUN')).toBeVisible();
  // the same things the standalone home screen showed
  await expect(page.locator('.hdr')).toContainText(`${OLD.xp} XP`);
  await expect(page.locator('.rank .n')).toContainText(tier(OLD.xp));
  await expect(page.locator('#syl')).toContainText(`${Object.keys(OLD.cs).length}/`);
  await expect(page.locator('#bench')).toContainText(`last ${OLD.bench[0].score}/1000`);
  await expect(page.locator('.tb.hot')).toHaveClass(/on/); // temperature 1.0 was on
  await expect(page.locator('[data-hat="beanie"]')).toHaveClass(/on/); // still wearing the beanie
  await expect(page.locator('#card')).toContainText(/Exam in \d+ day|Exam date passed/);
  await page.screenshot({ path: 'tests/shots/shell_carryover_home.png', fullPage: true });

  // opening the app changed nothing in the save, and left a one-time backup of it exactly as the old app wrote it
  expect(JSON.parse((await ls(page, 'shifty1.v1'))!)).toEqual(OLD);
  expect(await ls(page, 'shifty1.v1.bak-merge')).toBe(fx.save);
  // the line decks carried over too (they only ever get shorter, or are re-dealt, as lines are heard)
  expect(Object.keys(JSON.parse((await ls(page, 'shifty1.decks'))!))).toEqual(expect.arrayContaining(Object.keys(JSON.parse(fx.decks))));
});

test('when the merged app writes the save, the format is still the standalone format', async ({ page }) => {
  await page.goto('./');
  await page.locator('#snd').click(); // sound off: a real write
  await page.locator('#snd').click(); // and back on
  await expect(page.locator('#snd')).toContainText('sound on');
  const now = JSON.parse((await ls(page, 'shifty1.v1'))!);
  expect(now).toEqual(OLD);
  expect(Object.keys(now).sort()).toEqual(Object.keys(OLD).sort());
});

test('playing on adds to the old progress and loses none of it', async ({ page }) => {
  await page.goto('./');
  await page.getByText('START TRAINING RUN').click();
  await playThrough(page, { right: true });
  await expect(page.getByText('TRAINING RUN COMPLETE')).toBeVisible();
  const now = JSON.parse((await ls(page, 'shifty1.v1'))!);
  expect(now.xp).toBeGreaterThan(OLD.xp);
  expect(now.runs).toBe(OLD.runs + 1);
  expect(now.log.slice(0, OLD.log.length)).toEqual(OLD.log); // every old answer still in the history, in order
  expect(now.log.length).toBeGreaterThan(OLD.log.length);
  for (const c of Object.keys(OLD.cs)) expect(now.cs[c], `concept ${c} kept`).toBeTruthy();
  expect(now.bench).toEqual(OLD.bench);
  expect(now.daily).toEqual(OLD.daily);
  expect(now.boss).toEqual(OLD.boss);
  expect(now.examDay).toBe(OLD.examDay);
  expect(now.ver).toBe(1);
  // the backup is written once and never again
  expect(await ls(page, 'shifty1.v1.bak-merge')).toBe(fx.save);
});

test('the SOC shift never touches the SHIFTY-1 save', async ({ page }) => {
  await page.goto('./');
  await page.locator('.shsw [data-shift="soc"]').click();
  await expect(page.getByText('Start training (3 alerts)')).toBeVisible(); // the SOC game's own first run
  expect(await ls(page, 'shifty1.v1')).toBe(fx.save);
  await page.reload();
  await expect(page.getByText('Start training (3 alerts)')).toBeVisible(); // the choice stuck
  expect(await ls(page, 'shifty1.v1')).toBe(fx.save);
});

test('move my progress: a copied code restores the whole save on an empty install', async ({ page, context }) => {
  await page.goto('./');
  await page.locator('#about').click();
  await page.locator('#move').click();
  await page.locator('#mcopy').click();
  await expect(page.locator('#mcode')).toHaveValue(/^S1z?:[A-Za-z0-9+/=]+$/);
  const code = await page.locator('#mcode').inputValue();
  errors.length = 0; // (a headless browser may refuse the clipboard; the code is in the box either way)

  // "another install": a new page in a clean context, no save at all
  const other = await (await context.browser()!.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await other.goto('./#shifty-1');
  await expect(other.getByText('TRAIN SHIFTY-1')).toBeVisible();
  await other.evaluate(() => { localStorage.setItem('shifty1.v1', JSON.stringify({ onb: true })); });
  await other.reload();
  await other.locator('#about').click();
  await other.locator('#move').click();
  // a damaged code is refused and changes nothing
  await other.locator('#mcode').fill(code.slice(0, 40));
  await other.locator('#mload').click();
  await expect(other.locator('#toast')).toContainText(/damaged|not a SHIFTY-1/);
  await other.locator('#mcode').fill(code);
  other.once('dialog', (d) => { expect(d.message()).toContain(`${OLD.xp} XP`); void d.accept(); });
  await other.locator('#mload').click();
  await expect(other.locator('.hdr')).toContainText(`${OLD.xp} XP`);
  expect(JSON.parse((await ls(other, 'shifty1.v1'))!)).toEqual(OLD);
  // the line decks came along too (the home screen has already dealt one line from them)
  expect(Object.keys(JSON.parse((await ls(other, 'shifty1.decks'))!)).sort()).toEqual(Object.keys(JSON.parse((await ls(page, 'shifty1.decks'))!)).sort());
  await other.context().close();
});
