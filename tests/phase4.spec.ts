/**
 * Round 4: an animated Shifty, the closet, ghost language, softer XP, After Hours and the Puzzles hub.
 */
import { expect, test, type Page } from '@playwright/test';
import { currentAlert, playAlert, playRun, seed } from './helpers';
import { SHIFTY_LINES } from '../src/shifty-lines';

const errors: string[] = [];
test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
});
test.afterEach(() => { expect(errors, 'no page or console errors').toEqual([]); });

const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('onshift.v2') ?? '{}'));

test('Shifty is alive on the home screen: his frames change over time and poking him cheers', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  const live = page.locator('.corner .shifty-live');
  await expect(live).toHaveAttribute('data-live', '1');
  const seen = new Set<string>();
  for (let k = 0; k < 8; k++) { seen.add(await live.innerHTML()); await page.waitForTimeout(160); }
  expect(seen.size, 'more than one animation frame drawn').toBeGreaterThan(1);
  const before = await live.innerHTML();
  await live.click();
  await expect.poll(() => live.innerHTML()).not.toBe(before);
  await expect(page.locator('.corner .bubble')).not.toBeEmpty();
});

test('ghost language replaces the job language', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  const text = (await page.locator('.scr').innerText()).replace(/\s+/g, ' ');
  expect(text).toContain('Fresh Spook');
  expect(text).toContain('NEW ROUND');
  expect(text).toContain('DAILY HAUNT #');
  for (const old of ['CLOCK IN', 'Intern', 'Tier 1 Analyst', 'Back to the SOC', 'SHIFT REPORT']) expect(text).not.toContain(old);
});

test('a wrong lean call costs nothing; the stake text says so', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1, xp: 100 });
  await page.goto('/');
  await page.locator('#go').click();
  await expect(page.locator('#stake')).toContainText('no penalty');
  await playAlert(page, { right: false, sure: false });
  await expect.poll(async () => (await saved(page)).xp).toBe(100);
});

test('the closet unlocks hats from milestones and remembers what you wear', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1, xp: 900 });
  await page.goto('/');
  await page.locator('#closetchip').click();
  await expect(page.locator('.item[data-h="beanie"]')).not.toHaveClass(/locked/);
  await expect(page.locator('.item[data-h="halo"]')).not.toHaveClass(/locked/);
  await expect(page.locator('.item[data-h="crown"]')).toHaveClass(/locked/);
  await page.locator('.item[data-h="crown"]').click({ force: true }); // locked: nothing happens
  expect((await saved(page)).hat).toBe('');
  await page.locator('.item[data-h="halo"]').click();
  await expect(page.locator('.item[data-h="halo"]')).toHaveClass(/on/);
  expect((await saved(page)).hat).toBe('halo');
  await page.reload();
  await expect(page.locator('.corner .shifty-live svg.shifty')).toBeVisible();
  expect((await saved(page)).hat).toBe('halo');
});

test('After Hours is a separate deck: real-life alerts, no crew drop, never in work rounds', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#afterh').click();
  await expect(page.locator('.acts')).toBeVisible();
  for (let k = 0; k < 8; k++) {
    const a = await currentAlert(page);
    expect(a.deck, a.id).toBe('afterhours');
    await playAlert(page, { right: true, sure: false });
    const dock = page.locator('.dock button');
    await dock.click();
    if (!(await page.locator('.acts').count())) break;
  }
  await expect(page.getByText('AFTER HOURS').first()).toBeVisible();
  await expect(page.locator('.pack')).toHaveCount(0);
  await page.locator('#h').click();
  // a work round never contains an after-hours alert
  await page.locator('#go').click();
  for (let k = 0; k < 10; k++) {
    if (!(await page.locator('.acts').count())) break;
    const a = await currentAlert(page);
    expect(a.deck, a.id).toBeUndefined();
    await playAlert(page, { right: true, sure: false });
    await page.locator('.dock button').click();
  }
});

test('Puzzles: twin spotter, name that technique and the speed round all finish and save a best', async ({ page }) => {
  await page.clock.install();
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#puz').click();
  await expect(page.getByText('Puzzles').first()).toBeVisible();

  await page.locator('[data-k="twin"]').click();
  for (let k = 0; k < 6; k++) {
    await page.locator('.twin').first().click();
    await expect(page.locator('#out .fq')).toBeVisible();
    await page.locator('#n').click();
  }
  await expect(page.locator('.grade')).toContainText('/6');
  const afterTwin = await saved(page);
  expect(afterTwin.puz.twin).toBeGreaterThanOrEqual(0);
  await page.locator('#hub').click();

  await page.locator('[data-k="name"]').click();
  for (let k = 0; k < 5; k++) {
    await expect(page.locator('#opts button')).toHaveCount(4);
    await page.locator('#opts button').first().click();
    await expect(page.locator('#out .fq')).toBeVisible();
    await page.locator('#n').click();
  }
  await expect(page.locator('.grade')).toContainText('/5');
  await page.locator('#hub').click();

  await page.locator('[data-k="speed"]').click();
  for (let k = 0; k < 6; k++) await page.locator('.pzacts button').first().click();
  await page.clock.fastForward(61_000);
  await expect(page.getByText('SPEED ROUND')).toBeVisible();
  await expect(page.locator('.grade')).toBeVisible();
  const st = await saved(page);
  expect(typeof st.puz.speed).toBe('number');
  expect(st.xp).toBeGreaterThan(0);
});

test('playing a whole work round still works end to end with the animated Shifty on every screen', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  await expect(page.locator('.bar .shifty-live')).toHaveCount(1);
  await playRun(page, { right: true, sure: true });
  await expect(page.getByText('ROUND REPORT')).toBeVisible();
  await expect(page.locator('.shifty-live svg.shifty').first()).toBeVisible();
});

test('Shifty has 200+ distinct, bubble-sized lines', () => {
  expect(SHIFTY_LINES.length).toBeGreaterThanOrEqual(200);
  expect(new Set(SHIFTY_LINES).size).toBe(SHIFTY_LINES.length);
  for (const l of SHIFTY_LINES) { expect(l.length, l).toBeLessThanOrEqual(120); expect(l.length, l).toBeGreaterThan(15); }
});
