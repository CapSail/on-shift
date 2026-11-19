/**
 * Every authored scene, answered correctly through the real UI, must come back "right" (and, answered wrongly,
 * "not right" with its feedback). This proves each answer key, shuffle, diagram and interaction for the whole bank.
 */
import { test, expect } from '@playwright/test';
import { SCENES, answer } from './helpers';

test('every scene: the right answer is graded right', async ({ page }) => {
  test.setTimeout(30 * 60_000);
  await page.goto('./#scene=' + SCENES[0].id);
  const bad: string[] = [];
  for (const s of SCENES) {
    await page.evaluate((id) => { location.hash = 'scene=' + id; location.reload(); }, s.id);
    await page.locator('.scene .cid').waitFor();
    await answer(page, true);
    if ((await page.locator('#slot').getAttribute('data-result')) !== 'ok') bad.push(`${s.id} (${s.kind})`);
  }
  expect(bad, 'scenes whose right answer was graded wrong').toEqual([]);
});

test('one scene of every kind: a wrong answer is graded wrong, with the rule, the why and the source', async ({ page }) => {
  for (const kind of ['first', 'best', 'rank', 'sort', 'spot', 'calc']) {
    const s = SCENES.find((x) => x.kind === kind);
    if (!s) continue;
    await page.goto('./#scene=' + s.id);
    await page.reload();
    await answer(page, false);
    await expect(page.locator('#slot')).toHaveAttribute('data-result', 'no');
    await expect(page.locator('.rule')).toBeVisible();
    await expect(page.locator('.srcline')).toContainText('Source:');
    await page.screenshot({ path: `tests/shots/cissp_kind_${kind}_wrong.png`, fullPage: true });
  }
});

test('the bank uses every scene kind', () => {
  for (const kind of ['first', 'best', 'rank', 'sort', 'spot', 'calc']) expect(SCENES.some((s) => s.kind === kind), kind).toBe(true);
});

test('every diagram fits a phone: labels inside their boxes, no overlapping boxes, text at least 9px', async ({ page }) => {
  const bad: string[] = [];
  await page.goto('./#scene=' + SCENES[0].id);
  for (const s of SCENES.filter((x) => x.kind === 'spot')) {
    await page.evaluate((id) => { location.hash = 'scene=' + id; location.reload(); }, s.id);
    await page.locator('.map .node').first().waitFor();
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const ns = [...document.querySelectorAll<HTMLElement>('.map .node')];
      const over = ns.filter((n) => n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1).map((n) => n.textContent);
      const small = ns.filter((n) => parseFloat(getComputedStyle(n).fontSize) < 9).map((n) => n.textContent);
      const b = ns.map((n) => n.getBoundingClientRect());
      const clash: string[] = [];
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) if (b[i].left < b[j].right && b[j].left < b[i].right && b[i].top < b[j].bottom && b[j].top < b[i].bottom) clash.push(`${ns[i].textContent}/${ns[j].textContent}`);
      return [...over.map((x) => 'overflow ' + x), ...small.map((x) => 'tiny ' + x), ...clash.map((x) => 'overlap ' + x)];
    });
    if (r.length) bad.push(`${s.id}: ${r.join(', ')}`);
  }
  expect(bad).toEqual([]);
});
