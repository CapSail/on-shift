/**
 * Install gate, Shifty, name, and the leaderboard (against a mock Supabase: no real backend needed).
 */
import { expect, test, type Page } from '@playwright/test';
import { playRun, seed } from './helpers';

const errors: string[] = [];
test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
});
test.afterEach(() => { expect(errors, 'no page or console errors').toEqual([]); });

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

test('on an Android phone the first thing you see is how to make it an app', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: ANDROID, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await expect(page.locator('.gate')).toBeVisible();
  const text = (await page.locator('.gate').innerText()).replace(/\s+/g, ' ');
  expect(text).toContain('MAKE IT AN APP');
  expect(text).toContain('Open in Chrome');
  expect(text).toContain('Install app');
  expect(text).toContain('Copy the link');
  await expect(page.locator('.gate svg.shifty')).toBeVisible();
  await expect(page.locator('#t, #go'), 'nothing else is reachable behind the gate').toHaveCount(0);
  await page.screenshot({ path: 'tests/shots/30_gate_android.png', fullPage: true });
  await page.locator('#skip').click();
  await expect(page.locator('#t')).toBeVisible();
  await page.reload();
  await expect(page.locator('.gate'), 'skipping lasts for the session').toHaveCount(0);
  await ctx.close();
});

test('on an iPhone the gate explains Safari and Add to Home Screen', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: IPHONE, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  const text = (await page.locator('.gate').innerText()).replace(/\s+/g, ' ');
  expect(text).toContain('Safari');
  expect(text).toContain('Share');
  expect(text).toContain('Add to Home Screen');
  await ctx.close();
});

test('on an iPhone in Chrome or an in-app browser the gate says to open Safari first', async ({ browser }) => {
  const CHROME_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1';
  const ctx = await browser.newContext({ userAgent: CHROME_IOS, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  const text = (await page.locator('.gate').innerText()).replace(/\s+/g, ' ');
  expect(text).toContain('You are not in Safari');
  expect(text).toContain('Edit Actions');
  expect(text).toContain('Copy the link');
  await ctx.close();
});

test('Shifty is on the home screen and says something when poked', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await expect(page.locator('#shifty svg.shifty')).toBeVisible();
  const before = await page.locator('#shline').textContent();
  expect(before!.length).toBeGreaterThan(5);
  await expect.poll(async () => { await page.locator('#shifty').click(); return page.locator('#shline').textContent(); }).not.toBe(before);
  await page.screenshot({ path: 'tests/shots/31_home_shifty.png' });
});

test('you can set a name even before the leaderboard is on, and it sticks', async ({ page }) => {
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await expect(page.locator('#namechip')).toHaveText('set your name');
  await page.locator('#friends').click();
  await expect(page.getByText('not switched on yet')).toBeVisible();
  await page.locator('#nm').fill('Jordan');
  await page.locator('#nmsave').click();
  await expect(page.locator('#nmmsg')).toHaveText('Saved.');
  await page.reload();
  await expect(page.locator('#namechip')).toContainText('Jordan');
});

// ---------------------------------------------------------------- leaderboard against a mock Supabase

const BASE = 'https://mock.supabase.test';
interface Calls { join: unknown[]; stats: { body: Record<string, unknown>; auth: string }[]; daily: unknown[]; rename: unknown[] }

async function mockSupabase(page: Page, opts: { takenName?: string } = {}): Promise<Calls> {
  const calls: Calls = { join: [], stats: [], daily: [], rename: [] };
  const friends = [
    { name: 'Dee', me: false, xp: 0, xp_week: 0, week_id: 0, streak: 0, best_streak: 0, dex: 0, calls: 0, tp_caught: 0, tp_total: 0, fp_closed: 0, fp_total: 0, boss_wins: 0, rank_idx: 0, updated_at: null, daily_score: null, daily_n: null, daily_grid: null },
    { name: 'Raven', me: false, xp: 2600, xp_week: 410, week_id: 0, streak: 6, best_streak: 9, dex: 31, calls: 220, tp_caught: 90, tp_total: 100, fp_closed: 100, fp_total: 120, boss_wins: 2, rank_idx: 5, updated_at: '2026-11-11T12:00:00Z', daily_score: 9, daily_n: 10, daily_grid: '🟩🟩🟨🟩🟩🟩🟩🟥🟩🟩' },
  ];
  let me = { name: '', xp: 0 } as Record<string, unknown>;
  await page.route(BASE + '/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.pathname.endsWith('/auth/v1/signup')) return json(200, { access_token: 'tok', refresh_token: 'ref', expires_in: 3600, user: { id: 'u-me' } });
    const fn = url.pathname.split('/rpc/')[1];
    const body = req.postDataJSON();
    if (fn === 'join_group') {
      calls.join.push(body);
      if (body.p_code !== 'GHOST') return json(400, { message: 'wrong invite code' });
      if (opts.takenName && body.p_name === opts.takenName) return json(400, { message: 'name taken' });
      me = { ...me, name: body.p_name };
      return json(200, { ok: true });
    }
    if (fn === 'set_name') { calls.rename.push(body); return json(200, { ok: true }); }
    if (fn === 'submit_stats') { calls.stats.push({ body: body.p, auth: req.headers()['authorization'] }); me = { ...me, ...body.p }; return json(200, { ok: true }); }
    if (fn === 'submit_daily') { calls.daily.push(body); return json(200, { ok: true }); }
    if (fn === 'roster') return json(200, [...friends, { ...friends[0], name: String(me.name), me: true, xp: Number(me.xp ?? 0), calls: Number(me.calls ?? 0), rank_idx: 0 }]);
    return json(404, { message: 'unknown ' + url.pathname });
  });
  await page.addInitScript((b) => localStorage.setItem('onshift.sb', JSON.stringify({ url: b, key: 'anon-key' })), BASE);
  return calls;
}

test('join with the group code, see everyone including friends who have not played, and sync stats', async ({ page }) => {
  const calls = await mockSupabase(page, { takenName: 'Taken' });
  await seed(page, { onb: true, shifts: 1 });
  await page.goto('/');
  await page.locator('#friends').click();
  await expect(page.locator('#join')).toBeVisible();

  // wrong code and taken name are explained
  await page.locator('#nm').fill('Jordan');
  await page.locator('#code').fill('NOPE');
  await page.locator('#join').click();
  await expect(page.locator('#joinmsg')).toContainText('code is not right');
  await page.locator('#nm').fill('Taken');
  await page.locator('#code').fill('GHOST');
  await page.locator('#join').click();
  await expect(page.locator('#joinmsg')).toContainText('already has that name');

  // success
  await page.locator('#nm').fill('Jordan');
  await page.locator('#join').click();
  await expect(page.locator('#tabs')).toBeVisible();
  expect(calls.join.at(-1)).toEqual({ p_code: 'GHOST', p_name: 'Jordan' });

  // the full roster is visible, including a friend with 0 XP, and I am marked
  await expect(page.locator('.lbrow')).toHaveCount(3);
  await expect(page.locator('.lbrow', { hasText: 'Dee' })).toContainText("hasn't clocked in");
  await expect(page.locator('.lbrow.me')).toContainText('Jordan (you)');
  await expect(page.locator('.lbrow').first()).toContainText('Raven'); // sorted by XP
  await page.locator('#tabs [data-b="daily"]').click();
  await expect(page.locator('.lbrow').first()).toContainText('9/10');
  await page.locator('#tabs [data-b="acc"]').click();
  await expect(page.locator('.lbrow').first()).toContainText('Raven');
  await expect(page.locator('.lbrow', { hasText: 'Dee' })).toContainText("hasn't clocked in");
  await page.screenshot({ path: 'tests/shots/32_friends.png', fullPage: true });

  // finishing a shift pushes my stats (and nothing private: just the numbers)
  await page.locator('#q').click();
  await expect(page.locator('#namechip')).toContainText('Jordan');
  await page.locator('#go').click();
  await playRun(page);
  await expect.poll(() => calls.stats.some((s) => s.body.calls === 10), { timeout: 8000 }).toBe(true);
  const last = calls.stats.find((s) => s.body.calls === 10)!;
  expect(last.auth).toBe('Bearer tok');
  expect(Number(last.body.xp)).toBeGreaterThan(100);
  expect(Number(last.body.calls)).toBe(10);
  expect(Number(last.body.tp_caught)).toBeLessThanOrEqual(Number(last.body.tp_total));
  expect(Object.keys(last.body).sort()).toEqual(['best_streak', 'boss_wins', 'calls', 'dex', 'fp_closed', 'fp_total', 'rank_idx', 'streak', 'tp_caught', 'tp_total', 'week_id', 'xp', 'xp_week']);

  // renaming goes to the server too
  await page.locator('#h').click(); // back to the SOC from the shift report
  await page.locator('#friends').click();
  await page.locator('#nm').fill('Jordo');
  await page.locator('#nmsave').click();
  await expect(page.locator('#nmmsg')).toHaveText('Saved.');
  expect(calls.rename.at(-1)).toEqual({ p_name: 'Jordo' });
  // the two deliberate 400s (wrong code, taken name) show up as console noise: nothing else may
  errors.splice(0, errors.length, ...errors.filter((e) => !/status of 400/.test(e)));
});

test('offline, the friends screen shows the last roster instead of breaking', async ({ page, context }) => {
  await mockSupabase(page);
  await seed(page, { onb: true, shifts: 1, name: 'Jordan', lb: { joined: true, dailySent: [] } });
  await page.goto('/');
  await page.locator('#friends').click();
  await expect(page.locator('.lbrow')).toHaveCount(3); // online: loads and caches the roster
  await page.locator('#q').click();
  await context.setOffline(true);
  await page.route(BASE + '/**', (r) => r.abort('internetdisconnected')); // route handlers run before the network, so cut the mock too
  await page.locator('#friends').click();
  await expect(page.locator('.lbrow'), 'cached roster still shows').toHaveCount(3);
  await expect(page.locator('#lbfoot')).toContainText('Offline');
  await context.setOffline(false);
  errors.splice(0, errors.length, ...errors.filter((e) => !/ERR_INTERNET_DISCONNECTED|ERR_FAILED/.test(e))); // the deliberately cut requests
});
