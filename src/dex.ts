// Crew dex: all ATT&CK groups; captured ones show their card and the techniques you've caught.
import { D, crewById, tUrl } from './content';
import { S } from './state';
import { RAR, crewCard, mono } from './crews';
import { app } from './ui';
import { $, $$, esc } from './util';

export function dex(f = -1): void {
  const list = D.crews.filter((c) => f < 0 || c.r === f), got = Object.keys(S.dex).length;
  const filters: [number, string][] = [[-1, 'All'], ...RAR.map((r, i): [number, string] => [i, r[0]])];
  app.innerHTML = `<div class="scr"><div class="bar"><button class="x" id="q">✕</button><b style="font-size:18px">Crew dex</b><span class="chip" style="margin-left:auto">${got}/${D.crews.length}</span></div>
 <p class="hint" style="text-align:left;margin:0 0 6px">Catch a real attack → intel on a crew that uses that technique. 3 intel = captured. 10 = foil.</p>
 <div class="filters">${filters.map(([k, n]) => `<button data-f="${k}" class="${k === f ? 'on' : ''}">${n}${k < 0 ? '' : ' · ' + D.crews.filter((c) => c.r === k && S.dex[c.id]).length + '/' + D.crews.filter((c) => c.r === k).length}</button>`).join('')}</div>
 <div class="dex">${list.map((c) => {
    const h = S.dex[c.id], rc = RAR[c.r][1], iv = S.intel[c.id] || 0;
    return h
      ? `<button class="dx" data-c="${c.id}" style="--rc:${rc}"><div class="in"><div class="mg">${esc(mono(c.n))}</div><b>${esc(c.n)}</b><span class="iv">intel ${iv}${iv >= 10 ? ' ✦' : ''}</span></div></button>`
      : iv
        ? `<div class="dx half" style="--rc:${rc}"><div class="in"><div class="mg" style="color:${rc}">?</div><b>${esc(c.n)}</b><span class="iv">intel ${iv}/3</span></div></div>`
        : `<div class="dx lock"><div class="in"><div class="mg" style="color:${rc}">?</div><b>???</b></div></div>`;
  }).join('')}</div></div>`;
  $('#q').onclick = () => history.back();
  $$('[data-f]').forEach((b) => (b.onclick = () => dex(+b.dataset.f!)));
  $$('[data-c]').forEach((b) => (b.onclick = () => {
    const c = crewById[b.dataset.c!], m = document.createElement('div');
    m.className = 'modal';
    const caught = [...new Set(S.log.filter((e) => e.ok && e.v && c.t.some((t) => t === e.x || t.split('.')[0] === e.x)).map((e) => e.x!))];
    m.innerHTML = `<div class="box">${crewCard(c, S.dex[c.id].via)}<p style="font-size:14px;line-height:1.55;margin-top:14px">${esc(c.b)}</p>
  ${caught.length ? `<div class="sec">Their techniques you've caught</div><div class="tq">${caught.map((t) => `<a class="tag" href="${tUrl(t)}" target="_blank" rel="noopener">${esc(t)} ${esc((D.tech[t] || [''])[0])}</a>`).join('')}</div>` : ''}
  <div class="tq"><a class="tag" href="${c.u}" target="_blank" rel="noopener">${esc(c.id)} on ATT&CK ↗</a></div><button class="next" id="mc">Close</button></div>`;
    document.body.appendChild(m);
    m.onclick = (e) => { if (e.target === m || (e.target as HTMLElement).id === 'mc') m.remove(); };
  }));
}
