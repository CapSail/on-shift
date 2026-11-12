/**
 * End-to-end smoke tests at 390x844 (phone). They play the game for real: every alert is answered from the
 * generated content (looked up by title + host line), so a "perfect" run must end in a perfect result.
 * Screenshots land in tests/shots/ (gitignored) for eyeballing layout.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import type { Crew } from '../src/types';
import { ALL, content, currentAlert, key, nextBtn, playAlert, playRun, seed } from './helpers';
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
  await page.locator('#sure').click();
  await page.locator(`.acts button[data-c="${first.v ? 1 : 0}"]`).click();
  await page.locator('.pickable').waitFor();
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

  await expect(page.getByText('ROUND REPORT')).toBeVisible();
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

/** Drag the card with the mouse. Returns after release. */
async function drag(page: Page, dx: number, dy = 0, steps = 8) {
  const box = (await page.locator('#card').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + 60;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx / 2, cy + dy / 2, { steps });
  await page.mouse.move(cx + dx, cy + dy, { steps });
  return async () => { await page.mouse.up(); };
}

test('swipe feels like a dating app: follows the finger, tints, springs back, flies off', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  const card = page.locator('#card');

  // 1) mid-drag: the card moves and tilts with the finger and the stamp fades in
  const release = await drag(page, 60);
  const mid = await card.evaluate((el) => ({ t: (el as HTMLElement).style.transform, o: getComputedStyle(document.querySelector('#se')!).opacity }));
  expect(mid.t).toContain('translate(');
  expect(mid.t).toContain('rotate(');
  expect(Number(mid.o), 'stamp fades in with the drag').toBeGreaterThan(0.2);
  const sb = (await page.locator('#se').boundingBox())!;
  expect(sb.x >= 0 && sb.x + sb.width <= 390, 'the stamp stays on screen while you drag (trailing side)').toBe(true);
  await page.screenshot({ path: SHOTS + '11_drag_mid.png' });

  // 2) released short of the threshold: springs back, nothing is decided
  await release();
  await expect(card).toHaveJSProperty('style.transform', '');
  await page.waitForTimeout(450); // longer than the 230 ms flight, so a wrongly committed swipe would show by now
  await expect(page.locator('.acts')).toHaveCount(1);
  await expect(page.locator('.verdict')).toHaveCount(0);

  // 3) a vertical gesture never answers the card (it is a scroll)
  const releaseV = await drag(page, 10, 120);
  await releaseV();
  await page.waitForTimeout(450);
  await expect(page.locator('.acts')).toHaveCount(1);
  await expect(page.locator('.verdict')).toHaveCount(0);

  // 4) SURE is a toggle: armed ring, aria-pressed, independent of swipe distance
  await expect(page.locator('#sure')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#sure').click();
  await expect(page.locator('#sure')).toHaveAttribute('aria-pressed', 'true');
  await expect(card).toHaveClass(/armed/);
  await page.locator('#sure').click();
  await expect(page.locator('#sure')).toHaveAttribute('aria-pressed', 'false');

  // 5) a plain (not sure) swipe past the threshold decides as a LEAN call
  const a = await currentAlert(page);
  const wrongDir = a.v ? -1 : 1; // wrong on purpose
  const rel2 = await drag(page, wrongDir * 220);
  await rel2();
  await expect(page.locator('.verdict.no')).toBeVisible();
  await expect(page.locator('.verdict .sub'), 'lean miss is not the big sure miss').toHaveCount(0);
  await nextBtn(page).click();
  await expect(page.locator('#sure'), 'SURE resets on every new card').toHaveAttribute('aria-pressed', 'false');
});

test('a SURE miss injects a retry, and SURE is armed by the toggle not the swipe', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  await expect(page.locator('.hint')).toContainText('1/10');

  await page.locator('#sure').click(); // arm SURE
  const a = await currentAlert(page);
  const rel = await drag(page, a.v ? -230 : 230); // swipe the wrong way
  await rel();
  await expect(page.locator('.verdict.no')).toBeVisible();
  await expect(page.locator('.verdict .sub')).toContainText('Big miss');
  await page.screenshot({ path: SHOTS + '05_sure_miss.png', fullPage: true });
  await nextBtn(page).click();
  // retry (+1) and, when the alert has a twin, the twin (+1): 10 -> 11 or 12
  await expect(page.locator('.hint'), 'a sure miss queues a RETRY (and a TWIN) so the shift grows').toContainText(/2\/1[12]/);
});

test('keyboard: arrows answer, S toggles SURE', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  await page.keyboard.press('s');
  await expect(page.locator('#sure')).toHaveAttribute('aria-pressed', 'true');
  const a = await currentAlert(page);
  const wrong = a.v ? 'ArrowRight' : 'ArrowLeft';
  await page.keyboard.press(wrong === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight'); // right after the card appears: a too-fast key is ignored
  await page.waitForTimeout(320); // longer than the 230 ms flight, so a wrongly accepted key would show
  await expect(page.locator('.verdict')).toHaveCount(0);
  await expect(page.locator('.pickable')).toHaveCount(0);
  await page.keyboard.press(wrong);
  await page.locator('.pickable, .verdict').first().waitFor();
  await expect(page.locator('.ask')).toContainText('Sure call');
});

test('the stakes are visible before you commit, and SURE is announced', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  await expect(page.locator('#stake')).toContainText('+8 right, no penalty');
  await page.locator('#sure').click();
  await expect(page.locator('#stake')).toContainText('+15 right, −10 wrong');
  await expect(page.locator('#sure')).toHaveAttribute('aria-label', /plus 15.*minus 10/);
  await expect(page.locator('#fb'), 'the verdict is a live region').toHaveAttribute('role', 'status');
});

test('swipe works from empty space below the card, and Ctrl+S / key repeat do not arm or answer', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Control+s');
  await expect(page.locator('#sure'), 'browser shortcuts are left alone').toHaveAttribute('aria-pressed', 'false');
  // start the swipe well below the card (the thumb zone), not on it
  await page.mouse.move(195, 560);
  await page.mouse.down();
  await page.mouse.move(195 + 110, 560, { steps: 6 });
  await page.mouse.move(195 + 220, 560, { steps: 6 });
  await page.mouse.up();
  await page.locator('.pickable, .verdict').first().waitFor();
});

test('a held-still finger is not a flick', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  const box = (await page.locator('#card').boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 100 + 30, box.y + 60);
  await page.mouse.move(box.x + 100 + 60, box.y + 60); // fast, short
  await page.waitForTimeout(350); // then hold still
  await page.mouse.up();
  await page.waitForTimeout(450);
  await expect(page.locator('.verdict'), 'releasing after a pause must not throw the card').toHaveCount(0);
  await expect(page.locator('.acts')).toHaveCount(1);
});

test('reduced motion: a swipe still ends with the card back in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  const rel = await drag(page, 220);
  await rel();
  await page.locator('.pickable, .verdict').first().waitFor();
  const st = await page.locator('#card').evaluate((el) => ({ t: (el as HTMLElement).style.transform, c: el.className, x: el.getBoundingClientRect().x }));
  expect(st.t, 'no leftover drag transform').toBe('');
  expect(st.c).not.toContain('drag');
  expect(st.x, 'card is on screen').toBeGreaterThanOrEqual(0);
});

test('quitting while the card is flying leaves no ghost verdict on the next screen', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#go').click();
  await page.evaluate(() => {
    (document.querySelector('.b-esc') as HTMLElement).click();
    (document.querySelector('#quit') as HTMLElement).click();
  });
  await expect(page.locator('#go')).toBeVisible();
  await page.waitForTimeout(500); // past the 230 ms timer; afterEach asserts there were no page errors
  await page.locator('#go').click();
  await expect(page.locator('.acts'), 'the fresh run keeps its own answer buttons').toHaveCount(1);
  await expect(page.locator('.verdict')).toHaveCount(0);
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('a second finger does not steal or commit the swipe', async ({ page }) => {
    await seed(page, { onb: true, shifts: 1 });
    await page.goto('/');
    await page.locator('#go').click();
    await page.waitForTimeout(400);
    const c = await page.context().newCDPSession(page);
    const box = (await page.locator('#card').boundingBox())!;
    const x0 = box.x + 150, y0 = box.y + 60;
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', pts: { x: number; y: number; id: number }[]) => c.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await touch('touchStart', [{ x: x0, y: y0, id: 1 }]);
    for (const dx of [10, 25, 40, 55, 70]) await touch('touchMove', [{ x: x0 + dx, y: y0, id: 1 }]);
    await touch('touchStart', [{ x: x0 + 70, y: y0, id: 1 }, { x: 40, y: y0 + 200, id: 2 }]);
    for (const dx of [20, 80, 160, 240]) await touch('touchMove', [{ x: x0 + 70, y: y0, id: 1 }, { x: 40 + dx, y: y0 + 200, id: 2 }]);
    const tx = await page.locator('#card').evaluate((el) => Number(/translate\(([-\d.]+)px/.exec((el as HTMLElement).style.transform)?.[1] ?? 0));
    expect(Math.abs(tx - 70), 'the card still follows the first finger only').toBeLessThan(12);
    await touch('touchEnd', [{ x: 40 + 240, y: y0 + 200, id: 2 }]); // lift the second finger
    await page.waitForTimeout(450);
    await expect(page.locator('.verdict'), 'lifting the second finger must not commit').toHaveCount(0);
    await touch('touchEnd', []);
  });
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
  await expect(page.getByText(/DAILY HAUNT #\d+/)).toBeVisible();
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
