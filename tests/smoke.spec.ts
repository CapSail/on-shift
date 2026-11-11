/**
 * End-to-end smoke tests at 390x844 (phone). They play the game for real: every alert is answered from the
 * generated content (looked up by title + host line), so a "perfect" run must end in a perfect result.
 * Screenshots land in tests/shots/ (gitignored) for eyeballing layout.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import type { Alert, Content, Crew } from '../src/types';

const content = JSON.parse(readFileSync('src/generated/content.json', 'utf8')) as Content;
const ALL: Alert[] = [...content.alerts, ...content.inc.flatMap((i) => i.a)];
const SHOTS = 'tests/shots/';
mkdirSync(SHOTS, { recursive: true });

const errors: string[] = [];
test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
});
test.afterEach(() => { expect(errors, 'no page or console errors').toEqual([]); });

test('content lookup keys (title + host + all log lines) are unique', () => {
  const seen = new Map<string, string>();
  for (const a of ALL) {
    const k = key(a.t, a.h, a.l);
    expect(seen.has(k), `duplicate alert text: ${a.id} vs ${seen.get(k)}`).toBe(false);
    seen.set(k, a.id);
  }
});

// ---------------------------------------------------------------- helpers

const seed = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript((s) => { if (!localStorage.getItem('onshift.v2')) localStorage.setItem('onshift.v2', JSON.stringify(s)); }, state);

/** Twins can share title and host line (t03/t04), so every log line is part of the key. */
const key = (t: string, h: string, l: string[]) => [t, h, ...l].join('||');
const KEYED = new Map(ALL.map((a) => [key(a.t, a.h, a.l), a]));

async function currentAlert(page: Page): Promise<Alert> {
  const t = (await page.locator('.card h2').textContent())!;
  const h = (await page.locator('.card .h').first().textContent())!;
  const l = await page.locator('.card .ln').allTextContents();
  const a = KEYED.get(key(t, h, l));
  if (!a) throw new Error(`alert not found in content: "${t}" / "${h}" / ${l.length} lines`);
  return a;
}

const nextBtn = (page: Page) => page.locator('.dock button');

/** Answer the alert on screen. `right` = answer correctly. Picks the deciding line after a correct call. */
async function playAlert(page: Page, opts: { right?: boolean; sure?: boolean } = {}): Promise<Alert> {
  const { right = true, sure = true } = opts;
  const a = await currentAlert(page);
  const escalate = right ? !!a.v : !a.v;
  await page.locator(`.acts button[data-c="${escalate ? 1 : 0}"][data-f="${sure ? 1 : 0}"]`).click();
  if (right && (await page.locator('.pickable').count())) {
    const k = a.k[0];
    await page.locator(`.pickable [data-k="${k}"]`).click();
  }
  return a;
}

/** Play every alert on screen until the run's end screen appears. */
async function playRun(page: Page, opts: { right?: boolean; sure?: boolean; contain?: boolean } = {}): Promise<void> {
  for (let guard = 0; guard < 40; guard++) {
    if (await page.locator('.acts').count()) {
      await playAlert(page, opts);
    } else if (opts.contain !== false && (await page.getByText('CONTAINMENT DECISION').count())) {
      const ask = (await page.locator('.intro p').first().textContent())!;
      const incident = content.inc.find((i) => i.contain?.ask === ask)!;
      const right = incident.contain!.o[incident.contain!.a];
      await page.locator('.fq [data-o]', { hasText: right }).first().click();
    } else break;
    // a follow-up question may be on screen: answer it (any option) before moving on
    const q = page.locator('.fq [data-o]');
    if ((await q.count()) && !(await page.locator('.fq[data-done]').count())) await q.first().click();
    const dock = nextBtn(page);
    if (!(await dock.count())) break;
    await dock.click();
  }
}

// ---------------------------------------------------------------- tests

test('training, a perfect shift, drop, persistence, and the three UI-nit fixes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#t')).toBeVisible();
  await page.screenshot({ path: SHOTS + '00_training_intro.png' });

  // 3-card training
  await page.locator('#t').click();
  await playRun(page);
  await expect(page.getByText('TRAINING COMPLETE')).toBeVisible();
  await page.locator('#h').click();
  await expect(page.locator('#go')).toBeVisible();
  await page.screenshot({ path: SHOTS + '01_home.png' });

  // a shift: first alert checks the UI nits, then play the rest perfectly
  await page.locator('#go').click();
  const first = await currentAlert(page);
  const stampSide = first.v ? '#se' : '#sc';
  await page.locator(`.acts button[data-c="${first.v ? 1 : 0}"][data-f="1"]`).click();
  // stamp must sit above the card's source line, not on it
  const stamp = (await page.locator(stampSide).boundingBox())!;
  const dom = (await page.locator('.card .dom').boundingBox())!;
  expect(stamp.y + stamp.height, 'stamp clear of the source line').toBeLessThanOrEqual(dom.y + 6);
  await page.screenshot({ path: SHOTS + '02_pick.png' });
  await page.locator(`.pickable [data-k="${first.k[0]}"]`).click();
  await expect(page.locator('.verdict .vt small.xp-pop'), '+XP pulses in place instead of floating over the log').toHaveCount(1);
  await expect(page.locator('.xpf'), 'no stray floating XP over the card').toHaveCount(0);
  await expect(page.locator('.tq .tag.tech')).toHaveCount(1);
  expect(await page.locator('.tq .tag.tac').count(), 'tactics render as separate chips').toBeGreaterThanOrEqual(1);
  await page.screenshot({ path: SHOTS + '03_feedback.png', fullPage: true });
  await nextBtn(page).click();
  await playRun(page);

  await expect(page.getByText('SHIFT REPORT')).toBeVisible();
  await expect(page.locator('.grade')).toHaveText('S');
  await expect(page.getByText('10/10 correct')).toBeVisible();
  await page.locator('[data-p="1"]').click({ force: true }); // packs bob forever, so they are never "stable"
  await expect(page.locator('.crew')).toBeVisible();
  await page.screenshot({ path: SHOTS + '04_shift_end.png', fullPage: true });

  // progress persists across a reload
  await page.reload();
  await expect(page.locator('#go')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('onshift.v2')!));
  expect(saved.onb).toBe(true);
  expect(saved.shifts).toBe(1);
  expect(saved.xp).toBeGreaterThan(150);
  expect(Object.keys(saved.dex).length).toBeGreaterThanOrEqual(2); // training card + shift drop
});

test('a sure miss injects a retry; swipe gestures work; wrong calls show the twin', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  await expect(page.locator('.hint')).toContainText('1/10');

  // swipe far in the WRONG direction (= sure + wrong)
  const a = await currentAlert(page);
  const box = (await page.locator('#card').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + 60;
  const dx = a.v ? -230 : 230; // escalate-sure for a benign, close-sure for a true positive
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx / 2, cy, { steps: 6 });
  await page.mouse.move(cx + dx, cy, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.verdict.no')).toBeVisible();
  await expect(page.locator('.verdict .sub')).toContainText('Big miss');
  await page.screenshot({ path: SHOTS + '05_sure_miss.png', fullPage: true });
  await nextBtn(page).click();
  // retry (+1) and, when the alert has a twin, the twin (+1): 10 -> 11 or 12
  await expect(page.locator('.hint'), 'a sure miss queues a RETRY (and a TWIN) so the shift grows').toContainText(/2\/1[12]/);
});

test('incident: correct play contains the incident, with a containment decision', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('[data-inc]').first().click();
  await page.locator('#s').click();
  await playRun(page);
  await expect(page.getByText('INCIDENT CONTAINED')).toBeVisible();
  await expect(page.locator('.grade')).toHaveText('W');
  await page.screenshot({ path: SHOTS + '06_incident_end.png', fullPage: true });
});

test('weekly boss: correct play defeats the boss through the intel round', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#boss').click();
  await page.screenshot({ path: SHOTS + '07_boss_intro.png', fullPage: true });
  await page.locator('#s').click();
  for (let g = 0; g < 12 && (await page.locator('.acts').count()); g++) {
    await playAlert(page);
    await nextBtn(page).click();
  }
  await expect(page.getByText('PHASE 2')).toBeVisible();
  const name = (await page.locator('.boss .bn span').first().textContent())!.replace(' · PHASE 2', '');
  const crew = content.crews.find((c: Crew) => c.n.toUpperCase() === name)!;
  for (let k = 0; k < 3; k++) {
    const options = await page.locator('.fq [data-o] .qid').allTextContents();
    const idx = options.findIndex((t) => crew.t.includes(t));
    await page.locator('.fq [data-o]').nth(idx).click();
    await nextBtn(page).click();
  }
  await expect(page.getByText('BOSS DEFEATED')).toBeVisible();
  await expect(page.locator('.grade')).toHaveText('KO');
});

test('daily shift is recorded and shareable; skill report, dex and ride mode render', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#daily').click();
  await playRun(page);
  await expect(page.getByText(/DAILY SHIFT #\d+/)).toBeVisible();
  await expect(page.locator('.share').first()).toContainText('🟩');
  await expect(page.locator('#cp')).toBeVisible();
  await page.locator('#h').click();
  await expect(page.locator('#daily')).toContainText('Done: 10/10');

  await page.locator('#skill').click();
  await expect(page.getByText('Skill report')).toBeVisible();
  await expect(page.getByText('Triage accuracy')).toBeVisible();
  await page.screenshot({ path: SHOTS + '08_skill.png', fullPage: true });
  await page.locator('#q').click();

  await page.locator('#dexb').click();
  await expect(page.getByText('Crew dex')).toBeVisible();
  await page.screenshot({ path: SHOTS + '09_dex.png' });
  await page.locator('#q').click();

  await page.locator('#ride').click();
  await expect(page.locator('.ride')).toBeVisible();
  await page.locator('#he').click(); // starts ride mode (speech may be unavailable in headless; it must not throw)
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + '10_ride.png' });
  await page.locator('#q').click();
  await expect(page.locator('#go')).toBeVisible();
});
