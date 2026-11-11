// The daily shift's share text and result screen (the shift itself is started from shift.ts).
import { RANKS, S, liveStreak, rankOf } from './state';
import { dailyNumber, today } from './time';
import { app, toast } from './ui';
import { $ } from './util';

function shareText(): string {
  const d = S.daily[today()];
  return `ON SHIFT daily #${dailyNumber()} · ${d.score}/${d.n}\n${d.grid}\n🔥 ${liveStreak()} · ${RANKS[rankOf(S.xp)][1]}`;
}

export async function copyShare(): Promise<void> {
  try {
    await navigator.clipboard.writeText(shareText());
    toast('Copied. Go flex on the SOC group chat.');
  } catch {
    toast('Copy blocked here. Screenshot it instead.');
  }
}

export function dailyResult(): void {
  const d = S.daily[today()];
  app.innerHTML = `<div class="scr center"><div class="bar"><button class="x" id="q">✕</button></div><div class="sec">DAILY SHIFT #${dailyNumber()}</div><div class="grade">${d.score}/${d.n}</div><div class="share">${shareText()}</div>
 <button class="next" id="cp">Copy result</button><p class="tiny">New daily shift tomorrow.</p></div>`;
  $('#q').onclick = () => history.back();
  $('#cp').onclick = copyShare;
}
