// The Friends screen: set your name, join the group with the invite code, and see everyone's stats.
import { D } from './content';
import { RANKS, S } from './state';
import { week } from './time';
import { app, toast } from './ui';
import { $, $$, esc } from './util';
import { shiftySvg } from './shifty';
import { joinGroup, lbConfigured, lbJoined, loadRoster, renameMe, statsPayload, syncNow, type Member } from './leaderboard';

type Board = 'daily' | 'week' | 'xp' | 'streak' | 'dex' | 'acc' | 'boss';
const BOARDS: [Board, string][] = [['daily', 'Daily'], ['week', 'Week XP'], ['xp', 'All-time'], ['streak', 'Streak'], ['dex', 'Dex'], ['acc', 'Accuracy'], ['boss', 'Boss']];
let board: Board = 'xp';

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
const accOf = (m: Member) => (pct(m.tp_caught, m.tp_total) + pct(m.fp_closed, m.fp_total)) / 2;
const idle = (m: Member) => m.calls === 0 && m.xp === 0;

interface Row { m: Member; value: string; sub: string; dim?: boolean }

function rowsFor(b: Board, list: Member[]): Row[] {
  const wk = week();
  const byDesc = (f: (m: Member) => number) => [...list].sort((x, y) => f(y) - f(x) || x.name.localeCompare(y.name));
  const quiet = (m: Member): Row => ({ m, value: '—', sub: "hasn't clocked in", dim: true });
  switch (b) {
    case 'daily': {
      const played = byDesc((m) => (m.daily_score ?? -1)).filter((m) => m.daily_score !== null);
      const rest = list.filter((m) => m.daily_score === null).map((m): Row => ({ m, value: '—', sub: 'no daily yet', dim: true }));
      return [...played.map((m): Row => ({ m, value: `${m.daily_score}/${m.daily_n}`, sub: m.daily_grid ?? '' })), ...rest];
    }
    case 'week': return byDesc((m) => (m.week_id === wk ? m.xp_week : 0)).map((m) => (idle(m) ? quiet(m) : { m, value: `${m.week_id === wk ? m.xp_week : 0} XP`, sub: RANKS[m.rank_idx]?.[1] ?? '' }));
    case 'streak': return byDesc((m) => m.streak).map((m) => (idle(m) ? quiet(m) : { m, value: `🔥 ${m.streak}`, sub: `best ${m.best_streak}` }));
    case 'dex': return byDesc((m) => m.dex).map((m) => (idle(m) ? quiet(m) : { m, value: `${m.dex}/${D.crews.length}`, sub: 'crews captured' }));
    case 'boss': return byDesc((m) => m.boss_wins).map((m) => (idle(m) ? quiet(m) : { m, value: String(m.boss_wins), sub: 'bosses beaten' }));
    case 'acc': {
      const ok = byDesc(accOf).filter((m) => m.calls >= 50);
      const rest = list.filter((m) => m.calls < 50).map((m): Row => ({ m, value: '—', sub: idle(m) ? "hasn't clocked in" : `needs 50 calls (${m.calls})`, dim: true }));
      return [...ok.map((m): Row => ({ m, value: `${Math.round(accOf(m))}%`, sub: `catch ${pct(m.tp_caught, m.tp_total)}% · clean close ${pct(m.fp_closed, m.fp_total)}%` })), ...rest];
    }
    default: return byDesc((m) => m.xp).map((m) => (idle(m) ? quiet(m) : { m, value: `${m.xp} XP`, sub: RANKS[m.rank_idx]?.[1] ?? '' }));
  }
}

function boardHtml(rows: Row[]): string {
  return rows.map((r, i) => `<div class="lbrow${r.m.me ? ' me' : ''}${r.dim ? ' dim' : ''}"><span class="lbn">${r.dim ? '·' : i + 1}</span><div class="lbname"><b>${esc(r.m.name)}${r.m.me ? ' (you)' : ''}</b><small>${esc(r.sub)}</small></div><span class="lbv">${esc(r.value)}</span></div>`).join('')
    || '<p class="note">Nobody here yet.</p>';
}

const ago = (t: number) => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : Math.round(s / 3600) + ' h ago'; };

export function friends(): void {
  const configured = lbConfigured(), joined = lbJoined();
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q" aria-label="Back">✕</button><b style="font-size:18px">Friends</b></div>
 <div class="sk"><h3>Your name</h3>
  <div class="row2"><input id="nm" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="Pick a name" value="${esc(S.name)}"><button class="next" id="nmsave" style="margin:0;width:auto;padding:12px 16px">Save</button></div>
  <p class="note" id="nmmsg">${joined ? 'Everyone in the group sees this name.' : 'Shown on the home screen' + (configured ? ' and to your friends once you join.' : '.')}</p></div>
 ${!configured ? `<div class="sk center"><div class="mascot big">${shiftySvg('sleepy', 64)}</div><p class="note">The leaderboard is not switched on yet. Your name is saved on this phone and you will be on the board the day it opens.</p></div>${mineHtml()}` : ''}
 ${configured && !joined ? `<div class="sk"><h3>Join your friends</h3><p class="note">Ask Jordan for the group code.</p>
  <input id="code" autocomplete="off" autocapitalize="characters" placeholder="Group code"><button class="next" id="join">Join the group</button><p class="note" id="joinmsg"></p></div>` : ''}
 ${joined ? `<div class="filters" id="tabs">${BOARDS.map(([k, n]) => `<button data-b="${k}" class="${k === board ? 'on' : ''}">${n}</button>`).join('')}</div>
  <div id="lb"><p class="note">Loading your friends…</p></div>
  <p class="tiny" id="lbfoot"></p><button class="next ghost" id="refresh">Refresh</button>` : ''}
 </div>`;
  $('#q').onclick = () => history.back();
  $('#nmsave').onclick = async () => {
    const v = ($('#nm') as HTMLInputElement).value.trim(), msg = $('#nmmsg');
    if (v.length < 2) { msg.textContent = 'Names are 2-20 characters.'; return; }
    try { await renameMe(v); msg.textContent = 'Saved.'; toast('Name saved: ' + v); } catch (e) { msg.textContent = (e as Error).message === 'name taken' ? 'Someone already has that name. Try another.' : (e as Error).message; }
  };
  const join = document.getElementById('join');
  if (join) join.onclick = async () => {
    const v = ($('#nm') as HTMLInputElement).value.trim(), code = ($('#code') as HTMLInputElement).value, msg = $('#joinmsg');
    if (v.length < 2) { msg.textContent = 'Pick a name first (2-20 characters).'; return; }
    if (!code.trim()) { msg.textContent = 'Enter the group code.'; return; }
    msg.textContent = 'Joining…';
    try { await joinGroup(code, v); toast('You are on the board'); friends(); } catch (e) {
      const m = (e as Error).message;
      msg.textContent = m === 'wrong invite code' ? 'That code is not right.' : m === 'name taken' ? 'Someone already has that name. Try another.' : navigator.onLine ? m : 'You are offline. Try again with a signal.';
    }
  };
  if (!joined) return;
  $$('#tabs [data-b]').forEach((b) => (b.onclick = () => { board = b.dataset.b as Board; $$('#tabs [data-b]').forEach((x) => x.classList.toggle('on', x === b)); paint(); }));
  $('#refresh').onclick = () => void fetchRoster();
  let members: Member[] | null = null;
  const paint = () => { if (members) $('#lb').innerHTML = boardHtml(rowsFor(board, members)); };
  async function fetchRoster() {
    $('#refresh').textContent = 'Refreshing…';
    try {
      const r = await loadRoster();
      members = r.members;
      paint();
      $('#lbfoot').textContent = (r.stale ? 'Offline: showing the last roster · ' : '') + 'updated ' + ago(r.fetchedAt) + ` · ${r.members.length} on the roster`;
    } catch (e) {
      $('#lb').innerHTML = `<p class="note">Could not load the board (${esc((e as Error).message)}). Your progress is safe and will sync when you are back online.</p>`;
    }
    $('#refresh').textContent = 'Refresh';
  }
  void syncNow();
  void fetchRoster();
}

/** My own numbers, for when the leaderboard is not on yet. */
function mineHtml(): string {
  const p = statsPayload();
  return `<div class="sk"><h3>Your stats</h3><div class="weak"><div>Rank</div><span>${RANKS[p.rank_idx][1]}</span></div><div class="weak"><div>XP</div><span>${p.xp}</span></div><div class="weak"><div>Streak</div><span>🔥 ${p.streak}</span></div><div class="weak"><div>Crew dex</div><span>${p.dex}/${D.crews.length}</span></div><div class="weak"><div>Accuracy</div><span>catch ${pct(p.tp_caught, p.tp_total)}% · clean ${pct(p.fp_closed, p.fp_total)}%</span></div></div>`;
}
