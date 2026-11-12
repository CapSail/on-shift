/**
 * Renders the app icons (Shifty, the 16-bit night-shift ghost, on near-black) into public/icons/
 * using Playwright's Chromium.   npm run icons
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { shiftySvg } from '../src/shifty.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');
mkdirSync(OUT, { recursive: true });
mkdirSync(join(ROOT, '.cache'), { recursive: true });

// scale < 1 keeps Shifty inside the 80% safe zone that maskable icons are cropped to
const html = (size: number, scale: number) => `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;background:#06080c;display:grid;place-items:center;overflow:hidden}
.glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 54%,#22d3ee33,#06080c00 62%)}
svg{position:relative;filter:drop-shadow(0 0 ${size * 0.04}px #22d3ee88)}
</style><div class="glow"></div>${shiftySvg('dead', Math.round(size * 0.66 * scale))}`;

const icons: [string, number, number][] = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.82],
  ['apple-touch-icon.png', 180, 1],
  ['favicon-32.png', 32, 1.25],
];

const browser = await chromium.launch();
for (const [name, size, scale] of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const file = join(ROOT, '.cache', 'icon.html');
  writeFileSync(file, html(size, scale));
  await page.goto(pathToFileURL(file).href);
  await page.screenshot({ path: join(OUT, name) });
  await page.close();
  console.log('wrote public/icons/' + name);
}
await browser.close();
