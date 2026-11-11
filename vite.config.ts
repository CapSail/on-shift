import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const gitSha = () => { try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'dev'; } };
const sha = (process.env.GITHUB_SHA ?? gitSha()).slice(0, 7);

/**
 * After the bundle is written, generate dist/sw.js from scripts/sw-template.js: it precaches every built file
 * (app shell, content, fonts, icons) so the game works fully offline, and the cache name changes whenever
 * any file changes, which is what triggers the "update available" toast.
 */
function swPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'on-shift-sw',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    writeBundle() {
      const walk = (d: string): string[] => readdirSync(d).flatMap((f) => {
        const p = join(d, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
      const files = walk(outDir).map((p) => relative(outDir, p).split('\\').join('/')).filter((f) => f !== 'sw.js').sort();
      const h = createHash('sha1');
      for (const f of files) h.update(f).update(readFileSync(join(outDir, f)));
      const id = h.digest('hex').slice(0, 10);
      const urls = ['./', ...files.map((f) => './' + f)];
      const tpl = readFileSync('scripts/sw-template.js', 'utf8').replace('__BUILD__', id).replace('__PRECACHE__', JSON.stringify(urls));
      writeFileSync(join(outDir, 'sw.js'), tpl);
    },
  };
}

// './' keeps the build relocatable (GitHub Pages serves it under /on-shift/, a local preview at /).
export default defineConfig({
  base: process.env.BASE_PATH || './',
  define: { __APP_VERSION__: JSON.stringify(`${pkg.version}+${sha}`) },
  build: { target: 'es2022', sourcemap: false },
  plugins: [swPlugin()],
});
