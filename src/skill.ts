// Skill report: catch rate, clean-close rate, calibration, retention, per-domain accuracy, weakest rules, drill.
import type { LogEvent } from './types';
import { CON, conceptAlerts } from './content';
import { S } from './state';
import { app, go } from './ui';
import { DOM } from './runner';
import { startDrill } from './shift';
import { $, esc, shuffle } from './util';

export function catchStats() {
  const L = S.log.filter((e) => e.id);
  const tp = L.filter((e) => e.v), fp = L.filter((e) => !e.v);
  const cr = tp.length ? tp.filter((e) => e.ok).length / tp.length : 0;
  const cc = fp.length ? fp.filter((e) => e.ok).length / fp.length : 0;
  return { L, tp, fp, cr, cc, line: `${Math.round(100 * (L.filter((e) => e.ok).length / Math.max(1, L.length)))}% · ${L.length} calls` };
}

const rate = (list: LogEvent[]) => (list.length ? list.filter((e) => e.ok).length / list.length : 0);

export function skill(): void {
  const { L, tp, fp, cr, cc } = catchStats();
  // calibration compares deliberate sure vs lean calls: ride (audio, no toggle) and training are excluded
  const C = L.filter((e) => e.mode !== 'ride' && e.mode !== 'tut');
  const sure = C.filter((e) => e.conf), lean = C.filter((e) => !e.conf);
  const sa = rate(sure), la = rate(lean);
  const ev = L.filter((e) => e.ok && e.eye !== undefined && e.eye !== null);
  const eyeR = ev.length ? ev.filter((e) => e.eye).length / ev.length : 0;
  const rv = L.filter((e) => e.rv && (e.gap ?? 0) >= 7);
  const ret = rv.length ? rate(rv) : null;
  const pct = (x: number) => Math.round(100 * x) + '%';
  const bar = (n: string, x: number | null, c: string) => `<div class="meter"><div class="row"><span>${n}</span><b>${x === null ? '—' : pct(x)}</b></div><div class="bb"><i style="width:${x === null ? 0 : 100 * x}%;background:${c}"></i></div></div>`;
  let bias = '';
  if (tp.length >= 5 && fp.length >= 5) {
    if (cc < cr - 0.15) bias = `You over-escalate: ${pct(1 - cc)} of benign alerts went to IR. Look for the boring explanation first.`;
    else if (cr < cc - 0.15) bias = `You under-escalate: ${pct(1 - cr)} of real attacks got closed. That's the expensive mistake.`;
    else bias = "Balanced. You're not leaning one way.";
  }
  let cal = '';
  if (sure.length >= 20 && lean.length < 5) cal = 'You go SURE on nearly everything. Calibration needs honest leans: lean when you cannot point at the line.';
  else if (sure.length >= 5 && lean.length >= 5) {
    cal = sa - la < 0.1 ? 'Your "sure" isn\'t more accurate than your "lean" yet. Only go sure when you can point at the line.' : sa < 0.85 ? 'Sure calls under 85%. Overconfident: the SURE toggle costs you.' : "Well calibrated. When you're sure, you're right.";
  }
  const doms: Record<string, [number, number]> = {};
  L.forEach((e) => { const d = (doms[e.d!] = doms[e.d!] || [0, 0]); d[0]++; if (e.ok) d[1]++; });
  const con: Record<string, [number, number]> = {};
  L.forEach((e) => { const c = (con[e.c!] = con[e.c!] || [0, 0]); c[0]++; if (e.ok) c[1]++; });
  const weak = Object.entries(con).filter(([, [n]]) => n >= 1).map(([c, [n, k]]) => [c, k / n, n] as [string, number, number]).filter((x) => x[1] < 1).sort((a, b) => a[1] - b[1] || b[2] - a[2]).slice(0, 5);
  const boxes = Object.values(S.cs);
  const mastered = boxes.filter((r) => r.b >= 3).length, learning = boxes.filter((r) => r.b > 0 && r.b < 3).length, lapsed = boxes.filter((r) => r.b === 0).length;
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q">✕</button><b style="font-size:18px">Skill report</b></div>
 ${L.length < 10 ? '<p class="tiny">Play a couple of shifts and this fills in.</p>' : ''}
 <div class="sk"><h3>Triage accuracy</h3>${bar('Catch rate (attacks escalated)', tp.length ? cr : null, 'var(--red)')}${bar('Clean-close rate (benign closed)', fp.length ? cc : null, 'var(--grn)')}${bias ? `<p class="note">${esc(bias)}</p>` : ''}</div>
 <div class="sk"><h3>Calibration</h3>${bar('Accuracy when SURE (' + sure.length + ')', sure.length ? sa : null, 'var(--yl)')}${bar('Accuracy when LEANING (' + lean.length + ')', lean.length ? la : null, 'var(--dim)')}${cal ? `<p class="note">${esc(cal)}</p>` : ''}</div>
 <div class="sk"><h3>Reading, not guessing</h3>${bar('Sharp eye (right call + right line)', ev.length ? eyeR : null, 'var(--cy)')}${bar('Retention (callbacks after 7+ days)', ret, 'var(--pu)')}</div>
 <div class="sk"><h3>By domain</h3>${Object.entries(doms).map(([d, [n, k]]) => bar((DOM[d] || [d])[0] + ' · ' + n, n >= 3 ? k / n : null, (DOM[d] || ['', 'var(--cy)'])[1])).join('') || '<p class="note">No data yet.</p>'}</div>
 <div class="sk"><h3>Rules · ${mastered} mastered · ${learning} learning · ${lapsed} lapsed</h3>
 ${weak.length ? weak.map(([c, a, n]) => `<div class="weak"><div>${esc(CON[c]?.rule || c)}</div><span>${pct(a)} · ${n}×</span></div>`).join('') : '<p class="note">No weak spots yet.</p>'}
 ${weak.length ? '<button class="next" id="drill">Drill my weak spots</button>' : ''}</div></div>`;
  $('#q').onclick = () => history.back();
  const drill = document.getElementById('drill');
  if (drill) {
    drill.onclick = () => {
      const q = weak.flatMap(([c]) => shuffle(conceptAlerts[c] || []).slice(0, 2).map((a) => ({ ...a, review: true })));
      go(() => startDrill(shuffle(q).slice(0, 8)));
    };
  }
}
