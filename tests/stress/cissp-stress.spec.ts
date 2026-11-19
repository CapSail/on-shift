/**
 * Stress tests for the Ghost CISO (CISSP) shift: hostile tapping, quitting and coming back, browser back from every
 * screen, shift switches and reloads mid-run, a full 125-scene board exam, offline, broken saves, blocked storage,
 * the other shifts' saves, extreme dates, long spaced-repetition gaps and keyboard-only play. No console errors.
 */
import { test, expect, type Page } from '@playwright/test';
import { KEY, SCENES, answer, byId, content, playThrough, seed } from '../cissp/helpers';

const errors: string[] = [];
test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(() => expect(errors).toEqual([]));

const save = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), KEY);
const today = () => { const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5); };
const home = (page: Page) => expect(page.locator('#go')).toBeVisible();
/** Home with nothing left over from a run: no dock, no run screen, no modal. */
async function cleanHome(page: Page): Promise<void> {
  await home(page);
  await page.waitForTimeout(500); // longer than any runner timer (the exam waits 260 ms)
  await expect(page.locator('#go')).toBeVisible();
  await expect(page.locator('.dock')).toHaveCount(0);
  await expect(page.locator('.scr.run')).toHaveCount(0);
  await expect(page.locator('.modal')).toHaveCount(0);
}
const caseOf = (pred: (k: (typeof content.cases)[number]) => boolean) => content.cases.find(pred)!;
async function openCase(page: Page, id: string): Promise<void> {
  await page.locator('#board').click();
  await page.locator(`[data-k="${id}"]`).click();
}

test('rapid double and triple taps: options, lock-in, Next; each scene is answered and paid once', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  // a case whose first scene is a 4-option scene and whose second is a rank or sort (has a lock-in)
  const k = caseOf((x) => ['first', 'best', 'calc'].includes(x.scenes[0].kind) && x.scenes.some((s) => s.kind === 'rank' || s.kind === 'sort'));
  await openCase(page, k.id);
  // triple tap on "Take the case": exactly one scene, still unanswered
  const take = await page.locator('.dock button').boundingBox();
  for (let j = 0; j < 3; j++) await page.mouse.click(take!.x + take!.width / 2, take!.y + take!.height / 2);
  await expect(page.locator('.scene')).toHaveCount(1);
  await page.waitForTimeout(200);
  expect((await save(page)).log?.length ?? 0).toBe(0);
  await expect(page.locator('.scene .cid')).toHaveText(k.scenes[0].id);
  // three different options tapped in the same frame: only the first counts
  const s0 = k.scenes[0], wrong = ((s0.a as number) + 1) % 4;
  await page.evaluate(([w, a]) => { for (const i of [w, a, w]) (document.querySelector(`.opt[data-i="${i}"]`) as HTMLElement).click(); }, [wrong, s0.a as number]);
  await page.locator(`.opt[data-i="${s0.a}"]`).dblclick({ force: true });
  let sv = await save(page);
  expect(sv.log.length).toBe(1);
  expect(sv.log[0].ok).toBe(false);
  expect(sv.xp).toBe(0);
  await expect(page.locator('.verdict')).toHaveCount(1);
  // triple tap on Next: lands on scene 2, does not answer it by tapping through
  const nb = await page.locator('.dock button').boundingBox();
  for (let j = 0; j < 3; j++) await page.mouse.click(nb!.x + nb!.width / 2, nb!.y + nb!.height / 2);
  await page.waitForTimeout(300);
  sv = await save(page);
  expect(sv.log.length).toBe(1);
  // play on to the first lock-in scene, then hammer Lock in
  for (let guard = 0; guard < 10; guard++) {
    const id = (await page.locator('.scene .cid').textContent())!.trim();
    const s = byId.get(id)!;
    if (s.kind === 'rank' || s.kind === 'sort') {
      if (s.kind === 'rank') for (let j = 0; j < s.items!.length; j++) await page.locator(`.st[data-i="${j}"]`).click();
      else for (let i = 0; i < s.pairs!.length; i++) await page.locator(`.srow[data-i="${i}"] .bin[data-b="${s.pairs![i][1]}"]`).click();
      const before = (await save(page)).log.length;
      await page.evaluate(() => { const l = document.querySelector('#lock') as HTMLElement; l.click(); l.click(); l.click(); });
      await page.locator('#lock').dblclick({ force: true });
      expect((await save(page)).log.length).toBe(before + 1);
      await expect(page.locator('.verdict')).toHaveCount(1);
      await expect(page.locator('.right-order')).toHaveCount(0);
      await page.locator('.dock button').click();
      break;
    }
    await answer(page, true);
    await page.locator('.dock button').click();
  }
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
  sv = await save(page);
  expect(sv.log.length).toBe(k.scenes.length);
  expect(sv.cases).toBe(1);
});

test('the board-confidence counter is on screen during a case (not swept away with the confetti)', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await page.locator('.dock button').click();
  const conf = page.locator('.bar [title="Board confidence"]');
  await expect(conf).toHaveText(/100/);
  await expect(conf).toBeInViewport();
  const pos = await conf.evaluate((e) => getComputedStyle(e).position);
  expect(pos).not.toBe('fixed');
});

test('quit mid-case with ✕ and with browser back, then start again: no ghost run, XP counted once', async ({ page }) => {
  page.on('dialog', (d) => void d.accept()); // "Leave the case?" once an answer is in
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await page.locator('.dock button').click();
  await answer(page, true); // lean + right = +8
  let sv = await save(page);
  expect(sv.xp).toBe(8);
  await page.locator('#quit').click();
  await cleanHome(page);
  expect((await save(page)).xp).toBe(8);
  // again, this time leave from the interlude and then from an answered scene with browser back
  await page.locator('#go').click();
  await expect(page.locator('.interlude')).toBeVisible();
  await page.goBack();
  await cleanHome(page);
  await page.locator('#go').click();
  await page.locator('.dock button').click();
  await answer(page, true);
  sv = await save(page);
  expect(sv.xp).toBe(16); // a new run: no combo carried over
  await page.goBack();
  await cleanHome(page);
  // and a whole case still plays cleanly afterwards
  await page.locator('#go').click();
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
  sv = await save(page);
  expect(sv.cases).toBe(1);
});

test('quitting the board exam right after an answer leaves no exam running over home', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#exam').click();
  await page.locator('#e25').click();
  await answer(page, true);
  await page.locator('#quit').click(); // within the exam's 260 ms pause
  await cleanHome(page);
  await page.waitForTimeout(400);
  await expect(page.locator('.scene')).toHaveCount(0);
  expect((await save(page)).exams).toEqual([]);
});

test('browser back from every CISSP screen lands on a clean home', async ({ page }) => {
  await seed(page, { onb: true, xp: 30 });
  await page.goto('./');
  await home(page);
  for (const id of ['#board', '#book', '#about', '#exam', '#daily']) {
    await page.locator(id).click();
    await expect(page.locator('#go')).toHaveCount(0);
    await page.goBack();
    await cleanHome(page);
  }
  // a lesson card open in the briefing book
  await page.locator('#book').click();
  await page.locator('details.dombook').first().locator('summary').click();
  await page.locator('[data-c]').first().click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.goBack();
  await cleanHome(page);
  // the case, from its interlude, a scene, its feedback and its end screen
  await page.locator('#go').click();
  await page.goBack(); await cleanHome(page);
  await page.locator('#go').click(); await page.locator('.dock button').click();
  await page.goBack(); await cleanHome(page);
  await page.locator('#go').click(); await page.locator('.dock button').click(); await answer(page);
  await page.goBack(); await cleanHome(page);
  await page.locator('#go').click(); await playThrough(page);
  await page.goBack(); await cleanHome(page);
  // the exam picker, a running exam and its end screen
  await page.locator('#exam').click(); await page.locator('#e25').click();
  await page.goBack(); await cleanHome(page);
  await page.locator('#exam').click(); await page.locator('#e25').click(); await playThrough(page);
  await expect(page.locator('.endscr')).toBeVisible();
  await page.goBack(); await cleanHome(page);
  // a drill from the weak-spot tile
  await page.locator('#weak').click(); await expect(page.locator('.scene')).toBeVisible();
  await page.goBack(); await cleanHome(page);
});

test('switching shifts mid-run (deep link, then the switch) leaves no CISSP dock or run behind', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('onshift.v2') === null) localStorage.setItem('onshift.v2', JSON.stringify({ onb: true, shifts: 1, xp: 40 }));
  });
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await page.locator('.dock button').click();
  await answer(page);
  await expect(page.locator('.dock')).toBeVisible();
  await page.evaluate(() => { location.hash = '#soc'; });
  await expect(page.getByText('NEW ROUND')).toBeVisible();
  await page.waitForTimeout(400);
  await expect(page.locator('.dock')).toHaveCount(0);
  await expect(page.locator('body')).toHaveAttribute('data-shift', 'soc');
  // back to the CISO with the switch: a clean home, and a new case plays
  await page.locator('.shsw [data-shift="cissp"]').click();
  await cleanHome(page);
  await page.locator('#go').click();
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
});

test('a #scene= link followed mid-run shows the scene alone: the run\'s Next button does not follow', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await page.locator('.dock button').click();
  await answer(page);
  await expect(page.locator('.dock')).toBeVisible();
  const other = SCENES.find((s) => s.kind === 'best')!;
  await page.evaluate((id) => { location.hash = '#scene=' + id; }, other.id);
  await expect(page.locator('.scene .cid')).toHaveText(other.id);
  await page.waitForTimeout(400);
  await expect(page.locator('.dock')).toHaveCount(0);
  await page.locator('a.x').click(); // ✕ back to the CISO home
  await cleanHome(page);
});

test('reload mid-case: home comes back, answers already given are kept once', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await page.locator('.dock button').click();
  await answer(page); await page.locator('.dock button').click(); await answer(page);
  const before = await save(page);
  await page.reload();
  await cleanHome(page);
  const after = await save(page);
  expect(after.log.length).toBe(2);
  expect(after.xp).toBe(before.xp);
  expect(after.cases).toBe(0);
  await page.locator('#go').click();
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
});

test('a full 125-scene board exam completes: no duplicates, a sane score, the domain mix of the outline', async ({ page }) => {
  test.setTimeout(400_000);
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#exam').click();
  await page.locator('#e125').click();
  const ids: string[] = [];
  for (let guard = 0; guard < 5000 && !(await page.locator('.endscr').count()); guard++) {
    const cid = page.locator('.scene:not(.answered) .cid');
    if (!(await cid.count())) { await page.waitForTimeout(60); continue; }
    await expect(page.locator('.benchq')).toHaveText(`Q${ids.length + 1}/125`);
    ids.push(await answer(page, ids.length % 4 !== 3));
  }
  await expect(page.locator('.endscr')).toBeVisible();
  expect(ids.length).toBe(125);
  expect(new Set(ids).size).toBe(125);
  expect(ids.filter((id) => !id.startsWith('x')), 'a full exam is drawn only from the exam-only pool').toEqual([]);
  const score = Number(await page.locator('.endscr .grade').textContent());
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(1000);
  const sv = await save(page);
  expect(sv.exams.length).toBe(1);
  expect(sv.exams[0]).toMatchObject({ n: 125, score });
  // the domain mix follows the 2027 weights (largest remainder)
  const per = content.domains.map((d) => ids.filter((id) => byId.get(id)!.d === d.n).length);
  content.domains.forEach((d, j) => expect(Math.abs(per[j] - (125 * d.w) / 100)).toBeLessThanOrEqual(1));
  await expect(page.locator('.miss')).toHaveCount(ids.filter((_, j) => j % 4 === 3).length);
});

test('offline after the first load: the CISO shift opens and a case plays with the network gone', async ({ page, context }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await home(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith('onshift-')));
  await context.setOffline(true);
  await page.reload();
  await home(page);
  await page.locator('#go').click();
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('#book').click();
  await expect(page.getByText('Readiness')).toBeVisible();
  await context.setOffline(false);
});

test('a corrupt cissp.v1 (not JSON) starts fresh instead of a white screen', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('cissp.v1', '{"xp": 12, "cs": {'); sessionStorage.setItem('seeded', '1'); } });
  await page.goto('./');
  await expect(page.getByText('OPEN CASE 1')).toBeVisible();
  await page.getByText('OPEN CASE 1').click();
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
});

for (const [name, st] of [
  ['missing fields', { onb: true, xp: 50 }],
  ['null fields', { onb: true, xp: 50, cs: null, log: null, done: null, daily: null, exams: null, hatsSeen: null, wk: null, examDay: 'soon', cases: null }],
  ['wrong types', { onb: true, xp: '50', cs: [], log: {}, done: 3, daily: 'x', exams: {}, hatsSeen: 'tophat', examDay: 1e12 }],
  ['half-written concept states', { onb: true, cs: { [content.concepts[0].id]: {}, [content.concepts[1].id]: { box: 9, due: null } } }],
] as const) {
  test(`a save with ${name} recovers: home, briefing book, a case and an exam all work`, async ({ page }) => {
    await page.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('cissp.v1', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); } }, st as Record<string, unknown>);
    await page.goto('./');
    await home(page);
    await page.locator('#book').click();
    await expect(page.getByText('Readiness')).toBeVisible();
    await page.goBack();
    await home(page);
    await page.locator('#go').click();
    await playThrough(page);
    await expect(page.getByText('CASE CLOSED')).toBeVisible();
    await page.getByRole('button', { name: 'Home' }).click();
    await page.locator('#exam').click();
    await page.locator('#e25').click();
    await playThrough(page);
    await expect(page.locator('.endscr .grade')).toHaveText(/^\d+$/);
    const sv = await save(page);
    expect(Array.isArray(sv.log)).toBe(true);
    expect(sv.exams.length).toBe(1);
  });
}

test('localStorage full mid-case (setItem throws): the case still finishes, nothing crashes', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await page.locator('.dock button').click();
  await answer(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () { throw new DOMException('quota', 'QuotaExceededError'); };
  });
  await page.locator('.dock button').click();
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();
  await home(page);
});

test('localStorage blocked from the start (every call throws): the app still opens and plays', async ({ page }) => {
  await page.addInitScript(() => {
    const no = () => { throw new DOMException('blocked', 'SecurityError'); };
    Storage.prototype.setItem = no; Storage.prototype.getItem = no; Storage.prototype.removeItem = no;
  });
  await page.goto('./#cissp');
  await expect(page.getByText('OPEN CASE 1')).toBeVisible();
  await page.getByText('OPEN CASE 1').click();
  await playThrough(page);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
});

test('playing the CISO leaves the SHIFTY-1 and SOC saves byte-identical', async ({ page }) => {
  const shifty = JSON.stringify({ ver: 1, onb: true, xp: 1234, streak: 9, cs: { 'bedrock-basics': { box: 3, due: 1, lapses: 0 } }, log: [{ day: 1 }] });
  const keys = { 'shifty1.v1': shifty, 'shifty1.decks': '{"home0":[1,2,3]}', 'shifty1.v1.bak-merge': shifty, 'onshift.v2': JSON.stringify({ onb: true, shifts: 3, xp: 777 }) };
  await page.addInitScript((k) => { if (!sessionStorage.getItem('seeded')) { for (const [a, b] of Object.entries(k)) localStorage.setItem(a, b); sessionStorage.setItem('seeded', '1'); } }, keys);
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await playThrough(page, { right: (i) => i % 2 === 0, sure: true });
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('#exam').click(); await page.locator('#e25').click(); await playThrough(page);
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('#book').click(); await page.locator('#exd').fill('2027-06-01'); await page.locator('#exs').click();
  await page.goBack();
  await page.locator('[data-hat="tophat"]').click();
  const now = await page.evaluate((ks) => Object.fromEntries(ks.map((k) => [k, localStorage.getItem(k)])), Object.keys(keys));
  expect(now).toEqual(keys);
});

test('exam dates: in the past, today, far future, and junk years', async ({ page }) => {
  const t = today();
  await seed(page, { onb: true, examDay: t - 400 });
  await page.goto('./');
  await expect(page.locator('#book')).toContainText('exam date passed');
  await page.locator('#book').click();
  await expect(page.getByText('That date has passed.')).toBeVisible();
  const iso = (d: number) => new Date(d * 864e5).toISOString().slice(0, 10);
  await expect(page.locator('#exd')).toHaveValue(iso(t - 400));
  await page.locator('#exd').fill(iso(t));
  await page.locator('#exs').click();
  await expect(page.getByText('0 days to go.')).toBeVisible();
  await page.locator('#exd').fill('9999-12-31');
  await page.locator('#exs').click();
  await expect(page.getByText(/\d{6,} days to go\./)).toBeVisible();
  await expect(page.locator('#exd')).toHaveValue('9999-12-31');
  await page.locator('#exd').fill('1900-01-01');
  await page.locator('#exs').click();
  await expect(page.getByText('That date has passed.')).toBeVisible();
  await page.locator('#exd').fill('');
  await page.locator('#exs').click();
  await expect(page.getByText('Set it to see the countdown.')).toBeVisible();
  expect((await save(page)).examDay).toBeNull();
  await page.goBack();
  await expect(page.locator('#book')).toContainText('readiness');
});

test('spaced repetition across long gaps (90+ days): promotions, a lapse and a step back all land right', async ({ page }) => {
  const t = today();
  // three concepts, each with scenes in at least two cases; each due long ago
  const multi = content.concepts.filter((c) => new Set(SCENES.filter((s) => s.c === c.id).map((s) => s.case)).size >= 2);
  const target = content.cases.find((k) => multi.filter((c) => !k.scenes.some((s) => s.c === c.id)).length >= 3)!;
  const [a, b, c] = multi.filter((x) => !target.scenes.some((s) => s.c === x.id)).slice(0, 3);
  await seed(page, { onb: true, cs: {
    [a.id]: { box: 5, due: t - 100, lapses: 0, last: t - 190, seen: [], n: 6, ok: 6 },   // right -> stays at 90 days
    [b.id]: { box: 3, due: t - 120, lapses: 1, last: t - 136, seen: [], n: 4, ok: 3 },   // sure-wrong -> lapse, box 0
    [c.id]: { box: 2, due: t - 200, lapses: 0, last: t - 207, seen: [], n: 3, ok: 3 },   // lean-wrong -> box 1
  } });
  await page.goto('./');
  await expect(page.locator('#go')).toContainText('3 flashbacks first');
  await page.locator('#book').click();
  await expect(page.getByText('Readiness')).toBeVisible(); // heavily overdue strengths clamp at 0, no NaN
  await expect(page.getByText('Too early for a number')).toBeVisible(); // 3 concepts met is too few for a readiness number
  await page.goBack();
  await openCase(page, target.id);
  await expect(page.getByText('FLASHBACKS')).toBeVisible();
  await page.locator('.dock button').click();
  for (let j = 0; j < 3; j++) {
    const id = (await page.locator('.scene .cid').textContent())!.trim();
    const cid = byId.get(id)!.c;
    if (cid === b.id) await page.locator('#sure').click();
    await answer(page, cid === a.id);
    await page.locator('.dock button').click();
  }
  const sv = await save(page);
  expect(sv.cs[a.id]).toMatchObject({ box: 5, due: t + 90, last: t, n: 7, ok: 7 });
  expect(sv.cs[b.id]).toMatchObject({ box: 0, due: t + 1, lapses: 2 });
  expect(sv.cs[c.id]).toMatchObject({ box: 1, due: t + 3 });
  const gaps = sv.log.filter((e: { mode: string }) => e.mode === 'flash').map((e: { gap: number }) => e.gap).sort((x: number, y: number) => x - y);
  expect(gaps).toEqual([136, 190, 207]);
});

test('a concept first met in the board exam still gets its full briefing the first time a case teaches it', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#exam').click(); await page.locator('#e25').click();
  await playThrough(page);
  const sv = await save(page);
  const met = Object.entries(sv.cs as Record<string, { n: number }>).find(([, v]) => v.n === 0)![0];
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('#book').click();
  await page.locator(`details.dombook:has([data-c="${met}"]) summary`).click();
  await page.locator(`[data-c="${met}"]`).click();
  await page.locator('#md').click(); // drill this concept
  await answer(page, true);
  await expect(page.locator('.brief li')).toHaveCount(3);
});

test('every scene kind can be played with the keyboard alone', async ({ page }) => {
  await seed(page, { onb: true });
  for (const kind of ['first', 'best', 'calc', 'rank', 'sort', 'spot'] as const) {
    const s = SCENES.find((x) => x.kind === kind)!;
    await page.goto(`./#scene=${s.id}`);
    await expect(page.locator('.scene .cid')).toHaveText(s.id);
    const press = async (sel: string, key = 'Enter') => { await page.locator(sel).focus(); await page.keyboard.press(key); };
    await press('#sure', 'Space');
    await expect(page.locator('#sure')).toHaveAttribute('aria-pressed', 'true');
    if (kind === 'rank') { for (let j = 0; j < s.items!.length; j++) await press(`.st[data-i="${j}"]`); await press('#lock'); }
    else if (kind === 'sort') { for (let i = 0; i < s.pairs!.length; i++) await press(`.srow[data-i="${i}"] .bin[data-b="${s.pairs![i][1]}"]`, 'Space'); await press('#lock'); }
    else if (kind === 'spot') await press(`.node[data-n="${s.a}"]`);
    else await press(`.opt[data-i="${s.a}"]`);
    await expect(page.locator('.verdict')).toContainText('Right call');
  }
});
