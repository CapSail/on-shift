// Friends-only leaderboard client (Supabase REST, no SDK). Anonymous sign-in + invite code + display name.
// The game stays fully playable offline: stats are a snapshot that is pushed whenever we are online and joined,
// and the last roster is cached so the screen still opens in a tunnel.
import { SUPABASE_KEY, SUPABASE_URL } from './config';
import { S, liveStreak, rankOf, save } from './state';
import { today, week } from './time';

export const lbConfigured = (): boolean => !!SUPABASE_URL && !!SUPABASE_KEY;
export const lbJoined = (): boolean => lbConfigured() && S.lb.joined;

// ---------------------------------------------------------------- session (anonymous auth)

interface Session { access: string; refresh: string; expires: number; uid: string }
const AUTH_KEY = 'onshift.auth';

const loadSession = (): Session | null => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null'); } catch { return null; } };
const storeSession = (s: Session | null) => { try { s ? localStorage.setItem(AUTH_KEY, JSON.stringify(s)) : localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ } };

interface AuthReply { access_token: string; refresh_token: string; expires_in: number; user: { id: string } }
const toSession = (r: AuthReply): Session => ({ access: r.access_token, refresh: r.refresh_token, expires: Date.now() + r.expires_in * 1000, uid: r.user.id });

async function authCall(path: string, body: unknown): Promise<Session> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('sign-in failed (' + res.status + ')');
  return toSession((await res.json()) as AuthReply);
}

async function ensureSession(): Promise<Session> {
  let s = loadSession();
  if (s && s.expires - Date.now() > 60_000) return s;
  if (s) {
    try { s = await authCall('token?grant_type=refresh_token', { refresh_token: s.refresh }); storeSession(s); return s; } catch { storeSession(null); }
  }
  s = await authCall('signup', { data: {}, gotrue_meta_security: {} }); // anonymous sign-in
  storeSession(s);
  return s;
}

async function rpc<T>(fn: string, body: unknown, retry = true): Promise<T> {
  const s = await ensureSession();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + s.access, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401 && retry) { storeSession(null); return rpc<T>(fn, body, false); }
  if (!res.ok) {
    let msg = 'request failed (' + res.status + ')';
    try { const j = (await res.json()) as { message?: string }; if (j.message) msg = j.message; } catch { /* keep default */ }
    throw new Error(msg);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// ---------------------------------------------------------------- what we send

export function statsPayload() {
  const L = S.log.filter((e) => e.id);
  const tp = L.filter((e) => e.v), fp = L.filter((e) => !e.v);
  return {
    xp: S.xp,
    xp_week: S.wk.id === week() ? S.wk.xp : 0,
    week_id: week(),
    streak: liveStreak(),
    best_streak: Math.max(S.best, liveStreak()),
    dex: Object.keys(S.dex).length,
    calls: L.length,
    tp_caught: tp.filter((e) => e.ok).length,
    tp_total: tp.length,
    fp_closed: fp.filter((e) => e.ok).length,
    fp_total: fp.length,
    boss_wins: Object.values(S.boss).filter((b) => b.won).length,
    rank_idx: rankOf(S.xp),
  };
}

// ---------------------------------------------------------------- join / name / sync

export async function joinGroup(code: string, name: string): Promise<void> {
  await rpc('join_group', { p_code: code.trim(), p_name: name.trim() });
  S.name = name.trim();
  S.lb.joined = true;
  save();
  void syncNow();
}

export async function renameMe(name: string): Promise<void> {
  const nm = name.trim();
  if (lbJoined()) await rpc('set_name', { p_name: nm });
  S.name = nm;
  save();
}

let timer: number | undefined;
let busy = false;
export let lastSyncError = '';

/** Push my stats and any daily results the server has not seen. Safe to call any time; it never throws. */
export async function syncNow(): Promise<boolean> {
  if (!lbJoined() || busy || !navigator.onLine) return false;
  busy = true;
  try {
    await rpc('submit_stats', { p: statsPayload() });
    for (const day of Object.keys(S.daily).map(Number).filter((d) => d >= today() - 14 && !S.lb.dailySent.includes(d))) {
      const r = S.daily[day];
      await rpc('submit_daily', { p_day: day, p_score: r.score, p_n: r.n, p_grid: r.grid });
      S.lb.dailySent.push(day);
    }
    save();
    lastSyncError = '';
    return true;
  } catch (e) {
    lastSyncError = (e as Error).message;
    return false;
  } finally {
    busy = false;
  }
}

/** Debounced: call after anything that changes your stats. */
export function syncSoon(): void {
  if (!lbJoined()) return;
  clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(), 1500);
}

export function initLeaderboard(): void {
  addEventListener('online', () => void syncNow());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncSoon(); });
  syncSoon();
}

// ---------------------------------------------------------------- roster

export interface Member {
  name: string; me: boolean; xp: number; xp_week: number; week_id: number; streak: number; best_streak: number; dex: number;
  calls: number; tp_caught: number; tp_total: number; fp_closed: number; fp_total: number; boss_wins: number; rank_idx: number;
  updated_at: string | null; daily_score: number | null; daily_n: number | null; daily_grid: string | null;
}
export interface Roster { members: Member[]; fetchedAt: number; stale: boolean }

const ROSTER_KEY = 'onshift.roster';

export async function loadRoster(): Promise<Roster> {
  try {
    await syncNow(); // make sure my own numbers are fresh before reading everyone's
    const members = await rpc<Member[]>('roster', { p_day: today() });
    const r: Roster = { members, fetchedAt: Date.now(), stale: false };
    try { localStorage.setItem(ROSTER_KEY, JSON.stringify(r)); } catch { /* ignore */ }
    return r;
  } catch (e) {
    const cached = (() => { try { return JSON.parse(localStorage.getItem(ROSTER_KEY) ?? 'null') as Roster | null; } catch { return null; } })();
    if (cached) return { ...cached, stale: true };
    throw e;
  }
}
