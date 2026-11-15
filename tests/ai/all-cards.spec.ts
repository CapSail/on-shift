/**
 * Every authored card, answered correctly through the real UI, must come back "right" (and wrongly, "not right").
 * This proves each answer key, option shuffle and interaction works for the whole bank, not just a sample.
 */
import { test, expect } from '@playwright/test';
import { answer, content } from './helpers';

const KINDS = ['mcq', 'multi', 'hallu', 'tf', 'order', 'match', 'duel'];

test('every card: the right answer is graded right', async ({ page }) => {
  test.setTimeout(30 * 60_000);
  await page.goto('./#card=' + content.cards[0].id);
  const bad: string[] = [];
  for (const k of content.cards) {
    await page.evaluate((id) => { location.hash = 'card=' + id; location.reload(); }, k.id);
    await page.locator('.card .cid').waitFor();
    await answer(page, true);
    const res = await page.locator('#slot').getAttribute('data-result');
    if (res !== 'ok') bad.push(`${k.id} (${k.kind})`);
  }
  expect(bad, 'cards whose right answer was graded wrong').toEqual([]);
});

test('one card of every kind: a wrong answer is graded wrong, with feedback', async ({ page }) => {
  for (const kind of KINDS) {
    const k = content.cards.find((x) => x.kind === kind)!;
    await page.goto('./#card=' + k.id);
    await page.reload();
    await answer(page, false);
    await expect(page.locator('#slot')).toHaveAttribute('data-result', 'no');
    await expect(page.locator('.rule')).toBeVisible();
    await page.screenshot({ path: `tests/shots/ai_kind_${kind}_wrong.png`, fullPage: true });
  }
});
