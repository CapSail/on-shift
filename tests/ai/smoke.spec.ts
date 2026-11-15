/** Smoke tests: every mode plays end to end on a 390x844 phone viewport, with no console errors. */
import { test, expect, type Page } from '@playwright/test';
import { KEY, playThrough, seed } from './helpers';

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(() => expect(errors).toEqual([]));

const shot = async (page: Page, name: string) => { await page.waitForTimeout(350); await page.screenshot({ path: `tests/shots/ai_${name}.png` }); };
const save = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), KEY);

test('first launch: onboarding, first training run with pretests and epochs, end screen', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('TRAIN SHIFTY-1')).toBeVisible();
  await shot(page, '01_onboarding');
  await page.getByText('START EPOCH 1').click();
  await expect(page.locator('.coachtxt')).toBeVisible(); // the first card is a pretest
  await shot(page, '02_pretest');
  const n = await playThrough(page, { right: true, sure: true });
  expect(n).toBeGreaterThanOrEqual(5);
  await expect(page.getByText('TRAINING RUN COMPLETE')).toBeVisible();
  await shot(page, '03_run_end');
  const s = await save(page);
  expect(Object.keys(s.cs).length).toBeGreaterThanOrEqual(2);
  expect(s.streak).toBe(1);
  expect(s.xp).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByText('START TRAINING RUN')).toBeVisible();
  await shot(page, '04_home');
});

test('a confident miss comes back as a retry card for the same concept', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.getByText('START TRAINING RUN').click();
  // answer everything wrong and sure: at most 2 retries get appended
  await playThrough(page, { right: false, sure: true });
  const s = await save(page);
  expect(s.log.filter((e: { mode: string }) => e.mode === 'run').length).toBeGreaterThan(0);
  expect(Object.values(s.cs).some((c) => (c as { lapses: number }).lapses > 0 || (c as { box: number }).box === 0)).toBe(true);
});

test('temperature 1.0 forces sure answers', async ({ page }) => {
  await seed(page, { onb: true, temp: 1 });
  await page.goto('./');
  await page.getByText('START TRAINING RUN').click();
  // skip the pretest and epoch to reach a graded card
  for (let i = 0; i < 6 && !(await page.locator('.surefix').count()); i++) {
    if (await page.locator('.epoch').count()) await page.locator('.dock button').click();
    else { await playOne(page); }
  }
  await expect(page.locator('.surefix')).toBeVisible();
  await shot(page, '05_spicy');
});

async function playOne(page: Page) {
  const { answer } = await import('./helpers');
  await answer(page, true);
  await page.locator('.dock button').click();
}

test('daily eval: 10 cards, share grid, then locked to the result', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#daily').click();
  const n = await playThrough(page);
  expect(n).toBe(10);
  await expect(page.locator('#sharetxt')).toContainText('SHIFTY-1 Daily Eval #');
  await shot(page, '06_daily_end');
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('#daily').click();
  await expect(page.locator('#share')).toBeVisible(); // no replay
});

test('benchmark: 20 exam-style questions, no hints, scaled score and miss review', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#bench').click();
  await page.locator('#b20').click();
  await expect(page.locator('.benchbar')).toBeVisible();
  await shot(page, '07_bench_q');
  const n = await playThrough(page, { right: true });
  expect(n).toBe(20);
  await expect(page.locator('.grade.pass')).toHaveText('1000');
  await shot(page, '08_bench_end');
});

test('red team: win by answering right; one try per day', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#boss').click();
  await shot(page, '09_boss_intro');
  await page.locator('#fight').click();
  await expect(page.locator('.taunt')).toBeVisible();
  await playThrough(page, { right: true });
  await expect(page.getByText('HELD', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.locator('#boss')).toHaveClass(/locked/);
});

test('red team: three wrong answers and Shifty is jailbroken', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#boss').click();
  await page.locator('#fight').click();
  await playThrough(page, { right: false });
  await expect(page.getByText('JAILBROKEN', { exact: true })).toBeVisible();
});

test('model card, exam date pacing, syllabus lesson, about', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#card').click();
  await expect(page.getByText('Known limitations')).toBeVisible();
  await page.locator('#exd').fill('2027-01-15');
  await page.locator('#exs').click();
  await expect(page.getByText(/days left/)).toBeVisible();
  await shot(page, '10_model_card');
  await page.locator('#quit').click();
  await page.locator('#syl').click();
  await page.locator('[data-c]').first().click();
  await expect(page.locator('.modal .learn li')).toHaveCount(3);
  await shot(page, '11_syllabus_modal');
  await page.locator('#mx').click();
  await page.locator('#quit').click();
  await page.locator('#about').click();
  await expect(page.getByText('Not affiliated with')).toBeVisible();
});

test('speed round: 60 seconds, generated fact cards, score screen', async ({ page }) => {
  await seed(page, { onb: true });
  await page.clock.install();
  await page.goto('./');
  await page.locator('#spd').click();
  await expect(page.locator('.card')).toBeVisible();
  await shot(page, '12_speed');
  await page.locator('.card .opt').first().click();
  await page.clock.runFor(62_000);
  await expect(page.getByText('SPEED ROUND')).toBeVisible();
});

test('earbud mode opens with controls (speech is not available headless)', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#ear').click();
  await expect(page.locator('#hy')).toBeVisible();
  await shot(page, '13_earbud');
});
