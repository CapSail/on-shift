/** Shared helpers for the end-to-end tests: play the game from the generated content. */
import { type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Alert, Content } from '../src/types';

export const content = JSON.parse(readFileSync('src/generated/content.json', 'utf8')) as Content;
export const ALL: Alert[] = [...content.alerts, ...content.inc.flatMap((i) => i.a)];

// ---------------------------------------------------------------- helpers

export const seed = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript((s) => { if (!localStorage.getItem('onshift.v2')) localStorage.setItem('onshift.v2', JSON.stringify(s)); }, state);

/** Twins can share title and host line (t03/t04), so every log line is part of the key. */
export const key = (t: string, h: string, l: string[]) => [t, h, ...l].join('||');
const KEYED = new Map(ALL.map((a) => [key(a.t, a.h, a.l), a]));

export async function currentAlert(page: Page): Promise<Alert> {
  const t = (await page.locator('.card h2').textContent())!;
  const h = (await page.locator('.card .h').first().textContent())!;
  const l = await page.locator('.card .ln').allTextContents();
  const a = KEYED.get(key(t, h, l));
  if (!a) throw new Error(`alert not found in content: "${t}" / "${h}" / ${l.length} lines`);
  return a;
}

export const nextBtn = (page: Page) => page.locator('.dock button');

/** Answer the alert on screen. `right` = answer correctly. Picks the deciding line after a correct call. */
export async function playAlert(page: Page, opts: { right?: boolean; sure?: boolean } = {}): Promise<Alert> {
  const { right = true, sure = true } = opts;
  const a = await currentAlert(page);
  const escalate = right ? !!a.v : !a.v;
  if (sure) await page.locator('#sure').click();
  await page.locator(`.acts button[data-c="${escalate ? 1 : 0}"]`).click();
  await page.locator('.pickable, .verdict').first().waitFor(); // the card flies off, then the verdict (or the evidence pick) appears
  if (right && (await page.locator('.pickable').count())) {
    const k = a.k[0];
    await page.locator(`.pickable [data-k="${k}"]`).click();
  }
  return a;
}

/** Play every alert on screen until the run's end screen appears. */
export async function playRun(page: Page, opts: { right?: boolean; sure?: boolean; contain?: boolean } = {}): Promise<void> {
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

