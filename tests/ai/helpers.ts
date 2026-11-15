/** Shared helpers for the end-to-end tests: answer any card on screen from the generated content. */
import { type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Card, Content } from '../../src/ai/types';

export const content = JSON.parse(readFileSync('src/generated/ai.json', 'utf8')) as Content;
export const byId = new Map(content.cards.map((k) => [k.id, k]));

export const KEY = 'shifty1.v1';
export const seed = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript(([k, s]) => { if (!localStorage.getItem(k as string)) localStorage.setItem(k as string, JSON.stringify(s)); }, [KEY, state] as const);

/** Read the card id printed on the card; generated fact cards (g:...) are answered from their DOM. */
export async function cardOnScreen(page: Page): Promise<{ id: string; k?: Card }> {
  const id = (await page.locator('.card .cid').last().textContent())!.trim();
  return { id, k: byId.get(id) };
}

/** Answer the card on screen. right=false answers wrongly where possible. Returns the card id. */
export async function answer(page: Page, right = true, root = 'body'): Promise<string> {
  const { id, k } = await cardOnScreen(page);
  const r = page.locator(root);
  if (!k) { // generated card: no key available in the test, pick the first option
    await r.locator('.card .opt').first().click();
    if (await r.locator('#lock').count()) {
      for (const b of await r.locator('.mo:not(.used)').all()) if (await b.isVisible()) await b.click().catch(() => {});
      await r.locator('#lock').click();
    }
    return id;
  }
  switch (k.kind) {
    case 'mcq': case 'duel': {
      const i = right ? (k.a as number) : ((k.a as number) + 1) % (k.kind === 'duel' ? 2 : 4);
      await r.locator(`.card .opt[data-i="${i}"]`).click();
      break;
    }
    case 'multi': {
      const a = k.a as number[];
      const pick = right ? a : [...Array(k.o!.length).keys()].filter((x) => !a.includes(x)).slice(0, a.length);
      for (const i of pick) await r.locator(`.card .opt[data-i="${i}"]`).click();
      await r.locator('#lock').click();
      break;
    }
    case 'tf':
      await r.locator(`.card .opt[data-v="${(right ? k.v : !k.v) ? 1 : 0}"]`).click();
      break;
    case 'hallu':
      await r.locator(`.hl[data-l="${right ? k.bad : (k.bad! + 1) % (k.s as string[]).length}"]`).click();
      if (right) await r.locator(`#fix .opt[data-i="${k.a}"]`).click();
      break;
    case 'order': {
      const n = k.steps!.length;
      const seq = right ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
      for (const j of seq) await r.locator(`.st[data-i="${j}"]`).click();
      await r.locator('#lock').click();
      break;
    }
    case 'match': {
      const n = k.pairs!.length;
      const seq = right ? [...Array(n).keys()] : [...Array(n).keys()].map((x) => (x + 1) % n);
      for (const j of seq) await r.locator(`.mo[data-i="${j}"]`).click();
      await r.locator('#lock').click();
      break;
    }
  }
  return id;
}

/** Play whatever is on screen (epochs, cards) until the end screen. */
export async function playThrough(page: Page, opts: { right?: boolean; sure?: boolean } = {}): Promise<number> {
  let n = 0;
  for (let guard = 0; guard < 80; guard++) {
    if (await page.locator('.endscr').count()) return n;
    if (await page.locator('.epoch').count()) { await page.locator('.dock button').click(); continue; }
    if (await page.locator('.card .cid').count()) {
      if (opts.sure && (await page.locator('#sure').count())) await page.locator('#sure').click();
      await answer(page, opts.right ?? true);
      n++;
      const dock = page.locator('.dock button');
      // benchmark auto-advances; everything else waits for Next
      if (await dock.count().then((c) => c > 0).catch(() => false)) await dock.click();
      else await page.waitForTimeout(400);
      continue;
    }
    await page.waitForTimeout(150);
  }
  throw new Error('run never ended');
}
