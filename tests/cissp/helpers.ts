/** Shared helpers for the Ghost CISO tests: answer any scene on screen from the generated content. */
import { type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Content, Scene } from '../../src/cissp/types';

export const content = JSON.parse(readFileSync('src/generated/cissp.json', 'utf8')) as Content;
export const SCENES: Scene[] = content.cases.flatMap((k) => k.scenes);
/** Board-exam-only items (content/cissp/exam): never served outside the board exam. */
export const POOL: Scene[] = content.pool ?? [];
export const byId = new Map([...SCENES, ...POOL].map((s) => [s.id, s]));

export const KEY = 'cissp.v1';
export const seed = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript(([k, s]) => { if (!localStorage.getItem(k as string)) localStorage.setItem(k as string, JSON.stringify(s)); }, [KEY, state] as const);

/** Answer the scene on screen. right=false answers wrongly (and, where there is one, picks the engineer answer). */
export async function answer(page: Page, right = true): Promise<string> {
  const id = (await page.locator('.scene .cid').last().textContent())!.trim();
  const s = byId.get(id)!;
  const card = page.locator('.scene').last();
  switch (s.kind) {
    case 'first': case 'best': case 'calc': {
      const a = s.a as number;
      const i = right ? a : s.trap !== undefined ? s.trap : (a + 1) % 4;
      await card.locator(`.opt[data-i="${i}"]`).click();
      break;
    }
    case 'rank': {
      const n = s.items!.length;
      const seq = right ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
      for (const j of seq) await card.locator(`.st[data-i="${j}"]`).click();
      await card.locator('#lock').click();
      break;
    }
    case 'sort': {
      for (let i = 0; i < s.pairs!.length; i++) {
        const want = s.pairs![i][1];
        const bin = right ? want : (want + 1) % s.bins!.length;
        await card.locator(`.srow[data-i="${i}"] .bin[data-b="${bin}"]`).click();
      }
      await card.locator('#lock').click();
      break;
    }
    case 'spot': {
      const other = s.map!.nodes.find((n) => n.id !== s.a)!.id;
      await card.locator(`.node[data-n="${right ? s.a : other}"]`).click();
      break;
    }
  }
  return id;
}

/** Play whatever is on screen (interludes, scenes) until the end screen. */
export async function playThrough(page: Page, opts: { right?: boolean | ((i: number) => boolean); sure?: boolean } = {}): Promise<number> {
  let n = 0;
  for (let guard = 0; guard < 300; guard++) {
    if (await page.locator('.endscr').count()) return n;
    if (await page.locator('.interlude').count()) { await page.locator('.dock button').click(); continue; }
    if (await page.locator('.scene .cid').count() && !(await page.locator('.scene.answered').count())) {
      if (opts.sure && (await page.locator('#sure').count())) await page.locator('#sure').click();
      const r = typeof opts.right === 'function' ? opts.right(n) : opts.right ?? true;
      await answer(page, r);
      n++;
      const dock = page.locator('.dock button');
      // the board exam moves on by itself; everything else waits for Next
      if (await dock.count()) await dock.click();
      else await page.waitForTimeout(350);
      continue;
    }
    await page.waitForTimeout(120);
  }
  throw new Error('never reached the end screen');
}
