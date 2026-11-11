/**
 * Renders the app icons (pixel-style "ON / SHIFT" mark, green on near-black) into public/icons/ using the
 * bundled Press Start 2P font and Playwright's Chromium.   npm run icons
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');
const FONT = pathToFileURL(join(ROOT, 'src', 'fonts', 'press-start-2p-latin-400-normal.woff2')).href;
mkdirSync(OUT, { recursive: true });
mkdirSync(join(ROOT, '.cache'), { recursive: true });

// scale < 1 keeps the mark inside the 80% safe zone that maskable icons are cropped to
const html = (scale: number) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:P;src:url("${FONT}") format("woff2")}
html,body{margin:0;width:100%;height:100%;background:#06080c;display:grid;place-items:center;overflow:hidden}
.m{font-family:P;color:#3ee68a;text-align:center;line-height:1;transform:scale(${scale})}
.on{font-size:36vmin;text-shadow:0 0 4vmin #3ee68a55}
.bar{width:14vmin;height:3.2vmin;background:#ff4d5e;margin:5vmin auto;box-shadow:0 0 3vmin #ff4d5e66}
.sh{font-size:15.5vmin}
</style><div class="m"><div class="on">ON</div><div class="bar"></div><div class="sh">SHIFT</div></div>`;

const icons: [string, number, number][] = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.72],
  ['apple-touch-icon.png', 180, 0.9],
  ['favicon-32.png', 32, 1.1],
];

const browser = await chromium.launch();
for (const [name, size, scale] of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const file = join(ROOT, '.cache', 'icon.html');
  writeFileSync(file, html(scale));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, name) });
  await page.close();
  console.log('wrote public/icons/' + name);
}
await browser.close();
