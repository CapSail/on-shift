/**
 * Makes tests/fixtures/shifty1-standalone-save.json: a real save written by the STANDALONE SHIFTY-1 app (the one that
 * lived at capsail.github.io/shifty-1/ before it moved into ON SHIFT), by playing its production build in a browser.
 * tests/shell/carryover.spec.ts then proves the merged app reads that save unchanged.
 *
 *   node ./node_modules/tsx/dist/cli.mjs tests/fixtures/make-shifty1-save.ts "<path to shifty_1/dist>"
 *
 * It only reads that folder. Re-run it only if the standalone app's save format ever needs re-checking.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { answer, playThrough } from '../ai/helpers';

const dist = process.argv[2] ? resolve(process.argv[2]) : '';
if (!dist || !existsSync(join(dist, 'index.html'))) { console.error('usage: make-shifty1-save.ts <path to shifty_1/dist>'); process.exit(1); }

const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const rel = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^([/\\])+/, '');
  let file = join(dist, rel);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise<void>((r) => server.listen(4181, '127.0.0.1', r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, baseURL: 'http://127.0.0.1:4181' });
const home = async () => { await page.getByRole('button', { name: 'Home' }).click(); await page.getByText('START TRAINING RUN').waitFor(); };

// first launch: onboarding, then the first training run (pretests, epochs, graded cards), all right and sure
await page.goto('/');
await page.getByText('START EPOCH 1').click();
await playThrough(page, { right: true, sure: true });
await home();

// a second run with some misses (lean and sure), so there are lapses, retries and negative XP in the save
await page.getByText('START TRAINING RUN').click();
for (let i = 0, graded = 0; i < 80; i++) {
  if (await page.locator('.endscr').count()) break;
  if (await page.locator('.epoch').count()) { await page.locator('.dock button').click(); continue; }
  if (await page.locator('.card .cid').count()) {
    if (graded % 3 === 1 && (await page.locator('#sure').count())) await page.locator('#sure').click();
    await answer(page, graded % 3 !== 1 && graded % 4 !== 3);
    graded++;
    await page.locator('.dock button').click();
    continue;
  }
  await page.waitForTimeout(150);
}
await home();

// the daily eval, a 20-question benchmark, a red-team fight
await page.locator('#daily').click();
await playThrough(page);
await home();
await page.locator('#bench').click();
await page.locator('#b20').click();
await playThrough(page, { right: true });
await home();
await page.locator('#boss').click();
await page.locator('#fight').click();
await playThrough(page, { right: true });
await home();

// settings a player would have touched: exam date, spicy temperature, a hat, a few lines dealt from the saved decks
await page.locator('#card').click();
await page.locator('#exd').fill('2027-01-15');
await page.locator('#exs').click();
await page.locator('#quit').click();
await page.locator('.tb[data-t="1"]').click();
await page.locator('[data-hat="beanie"]').click();
for (let i = 0; i < 5; i++) await page.locator('#poke').click();

const dump = await page.evaluate(() => ({ save: localStorage.getItem('shifty1.v1'), decks: localStorage.getItem('shifty1.decks'), version: document.body.innerText.match(/content [\d.]+/)?.[0] ?? '' }));
await browser.close();
server.close();
if (!dump.save) throw new Error('the standalone app wrote no save');
const s = JSON.parse(dump.save);
writeFileSync(new URL('./shifty1-standalone-save.json', import.meta.url), JSON.stringify({
  about: 'A save written by the standalone SHIFTY-1 production build (see make-shifty1-save.ts). `save` and `decks` are the raw localStorage strings.',
  made: new Date().toISOString().slice(0, 10), standalone: dump.version, save: dump.save, decks: dump.decks,
}, null, 1) + '\n');
console.log(`wrote shifty1-standalone-save.json: ${s.xp} XP, ${Object.keys(s.cs).length} concepts, ${s.log.length} log events, ${s.bench.length} benchmark(s), streak ${s.streak}, hat "${s.hat}"`);
