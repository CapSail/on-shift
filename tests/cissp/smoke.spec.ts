/** Ghost CISO smoke tests: every mode plays end to end on a 390x844 phone viewport, with no console errors. */
import { test, expect, type Page } from '@playwright/test';
import { KEY, SCENES, content, playThrough, seed } from './helpers';

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
});
test.afterEach(() => expect(errors).toEqual([]));

const shot = async (page: Page, name: string) => { await page.waitForTimeout(350); await page.screenshot({ path: `tests/shots/cissp_${name}.png` }); };
const save = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), KEY);
const today = () => { const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5); };

test('first visit: the ghost-CISO story, case 1 from opening to verdict, then home', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('GHOST CISO', { exact: true })).toBeVisible();
  await expect(page.getByText('nobody alive will take the CISO job')).toBeVisible();
  await shot(page, '01_onboarding');
  await page.getByText('OPEN CASE 1').click();
  await expect(page.locator('.casetitle')).toHaveText(content.cases[0].title);
  await shot(page, '02_case_open');
  await page.locator('.dock button').click();
  await expect(page.locator('.scene')).toBeVisible();
  await shot(page, '03_scene');
  const n = await playThrough(page, { right: true, sure: true });
  expect(n).toBe(content.cases[0].scenes.length);
  await expect(page.getByText('CASE CLOSED')).toBeVisible();
  await expect(page.locator('.endscr .grade')).toHaveText('A');
  await shot(page, '04_case_closed');
  const s = await save(page);
  expect(s.done[content.cases[0].id].grade).toBe('A');
  expect(s.streak).toBe(1);
  expect(Object.keys(s.cs).length).toBeGreaterThanOrEqual(3);
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByText('NEXT CASE')).toBeVisible();
  await shot(page, '05_home');
});

test('wrong answers: the story reacts, the engineer answer is flagged and counted, confidence drops', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#board').click();
  await page.locator(`[data-k="${content.cases[0].id}"]`).click();
  await page.locator('.dock button').click();
  const first = content.cases[0].scenes[0];
  await page.locator(`.scene .opt[data-i="${first.trap ?? (Number(first.a) + 1) % 4}"]`).click();
  await expect(page.locator('.story')).toContainText(first.r![first.trap ?? (Number(first.a) + 1) % 4]);
  if (first.trap !== undefined) await expect(page.locator('.enganswer')).toBeVisible();
  await expect(page.locator('.srcline')).toContainText(first.src);
  await expect(page.locator('.brief li')).toHaveCount(3);
  await expect(page.locator('.bconf')).toContainText('85');
  await shot(page, '06_wrong_feedback');
  await page.locator('.dock button').click();
  await playThrough(page, { right: false });
  await expect(page.locator('.endscr .grade')).toHaveText(/[DF]/);
  const s = await save(page);
  if (first.trap !== undefined) expect(s.log.some((e: { eng?: boolean }) => e.eng)).toBe(true);
});

test('flashbacks: due concepts come back first, as a scene from a different case', async ({ page }) => {
  const t = today();
  const c = content.concepts.find((x) => new Set(SCENES.filter((s) => s.c === x.id).map((s) => s.case)).size >= 2)!;
  const from = SCENES.find((s) => s.c === c.id)!;
  await seed(page, { onb: true, cs: { [c.id]: { box: 1, due: t - 1, lapses: 0, last: t - 4, seen: [from.id], n: 2, ok: 2 } } });
  await page.goto('./');
  const target = content.cases.find((k) => k.id !== from.case && !k.scenes.some((s) => s.c === c.id))!;
  await page.locator('#board').click();
  await page.locator(`[data-k="${target.id}"]`).click();
  await expect(page.getByText('FLASHBACKS')).toBeVisible();
  await shot(page, '07_flashback_intro');
  await page.locator('.dock button').click();
  await expect(page.locator('.flag', { hasText: 'FLASHBACK' })).toBeVisible();
  const id = (await page.locator('.scene .cid').textContent())!.trim();
  expect(SCENES.find((s) => s.id === id)!.c).toBe(c.id);
  expect(id).not.toBe(from.id);
  await shot(page, '08_flashback');
  await playThrough(page);
  const s = await save(page);
  expect(s.cs[c.id].due).toBeGreaterThan(t);
});

test('daily case: the same case for everyone, a share grid, then locked to the result', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#daily').click();
  await expect(page.locator('.casetitle')).toBeVisible();
  const n = await playThrough(page);
  expect(n).toBeGreaterThanOrEqual(4);
  await expect(page.locator('#sharetxt')).toContainText('Ghost CISO daily case #');
  await shot(page, '09_daily_end');
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('#daily').click();
  await expect(page.locator('#share')).toBeVisible();
});

test('board exam: 25 adaptive scenes, no feedback until the end, a score and a miss review', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#exam').click();
  await page.locator('#e25').click();
  await expect(page.locator('.benchq')).toHaveText('Q1/25');
  await shot(page, '10_exam_q');
  const n = await playThrough(page, { right: (i) => i % 3 !== 2 });
  expect(n).toBe(25);
  await expect(page.locator('.verdict')).toHaveCount(0);
  await expect(page.locator('.endscr .grade')).toHaveText(/^\d{1,4}$/);
  await expect(page.locator('.miss').first()).toBeVisible();
  await shot(page, '11_exam_end');
  const s = await save(page);
  expect(s.exams.length).toBe(1);
  expect(s.exams[0].n).toBe(25);
});

test('briefing book: readiness, exam date, every objective, a lesson and a drill', async ({ page }) => {
  await seed(page, { onb: true });
  await page.goto('./');
  await page.locator('#go').click();
  await playThrough(page);
  await page.getByRole('button', { name: 'Home' }).click();
  await page.locator('#book').click();
  await expect(page.getByText('Readiness')).toBeVisible();
  await page.locator('#exd').fill('2027-05-03');
  await page.locator('#exs').click();
  await expect(page.getByText(/days? to go/)).toBeVisible();
  await expect(page.locator('.objrow')).toHaveCount(Object.keys(content.objectives).length);
  await page.locator('details.dombook').first().locator('summary').click();
  await page.locator('[data-c]').first().click();
  await expect(page.locator('.modal .learn li')).toHaveCount(3);
  await shot(page, '12_briefing_lesson');
  await page.locator('#md').click();
  const n = await playThrough(page);
  expect(n).toBeGreaterThanOrEqual(1);
  await expect(page.getByText('DRILL COMPLETE')).toBeVisible();
});

test('case board lists every case; about names the sources and the ISC2 notice; the hat shows up', async ({ page }) => {
  await seed(page, { onb: true, cases: 1 });
  await page.goto('./');
  await expect(page.locator('[data-hat="tophat"]')).toBeEnabled();
  await page.locator('[data-hat="tophat"]').click();
  await page.locator('#board').click();
  await expect(page.locator('[data-k]')).toHaveCount(content.cases.length);
  await shot(page, '13_case_board');
  await page.locator('#quit').click();
  await page.locator('#about').click();
  await expect(page.getByText('Not affiliated with, endorsed by, or sponsored by ISC2')).toBeVisible();
  await expect(page.getByText('Where the content comes from')).toBeVisible();
});
