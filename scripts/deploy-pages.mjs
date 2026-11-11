/**
 * Publish dist/ to the gh-pages branch (GitHub Pages "deploy from a branch"). Use when GitHub Actions is
 * unavailable. Run through npm so the app is validated, tested-typed and built first:   npm run deploy
 * The branch holds only the built site and is force-pushed each time; never edit it by hand.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

if (!existsSync('dist/index.html') || !existsSync('dist/sw.js')) throw new Error('dist/ is missing: run `npm run build` first');
const out = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8' }).trim();
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

const remote = out('git', ['remote', 'get-url', 'origin']);
const sha = out('git', ['rev-parse', '--short', 'HEAD']);
const dirty = out('git', ['status', '--porcelain']);
if (dirty) console.warn('warning: the working tree has uncommitted changes; the site is built from them, not from ' + sha);

const tmp = mkdtempSync(join(tmpdir(), 'onshift-pages-'));
try {
  cpSync('dist', tmp, { recursive: true });
  writeFileSync(join(tmp, '.nojekyll'), '');
  const git = (...args) => run('git', ['-c', 'user.name=ON SHIFT deploy', '-c', 'user.email=deploy@users.noreply.github.com', ...args], tmp);
  git('init', '-q', '-b', 'gh-pages');
  git('add', '-A');
  git('commit', '-q', '-m', `Deploy ${sha}`);
  git('push', '-f', remote, 'gh-pages');
  console.log(`\npublished ${sha} to the gh-pages branch of ${remote}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
