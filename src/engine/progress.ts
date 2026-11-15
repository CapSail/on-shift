// XP, ranks and streaks: state changes that also need UI feedback. Same rules in every shift; each shift brings its words.
import type { BaseSave, Rank, Store } from './store';
import { today, week } from './time';
import { confetti, sfx, toast, xpFloat } from './ui';

export interface ProgressWords {
  /** toast when a rank is gained, e.g. (title) => '⬆ RANK UP → ' + title */
  rankUp: (title: string) => string;
  freezeUsed: string;
  freezeEarned: string;
}

export function createProgress<T extends BaseSave>(st: Store<T>, ranks: Rank[], words: ProgressWords) {
  const { S, save, rankOf } = st;
  /** While a run is on screen, a shift may celebrate rank-ups on its end screen instead of a toast over the card. */
  let runActive = false;
  const setRunActive = (on: boolean) => { runActive = on; };

  function addXP(n: number, anchor?: HTMLElement | null, pulse = false): void {
    const before = rankOf(S.xp);
    S.xp = Math.max(0, S.xp + n);
    if (S.wk.id !== week()) S.wk = { id: week(), xp: 0 };
    S.wk.xp = Math.max(0, S.wk.xp + n);
    save();
    xpFloat(n, anchor, pulse);
    const after = rankOf(S.xp);
    if (after > before && !runActive) {
      setTimeout(() => {
        toast(words.rankUp(ranks[after][1]));
        sfx('rank');
        confetti(40);
      }, 500);
    }
  }

  /** Streaks are earned by FINISHING something (a round, a run, a daily, a boss...), not by opening the app. */
  function earnStreak(): boolean {
    const t = today();
    if (S.lastPlay === t) return false;
    if (S.lastPlay === t - 1) S.streak++;
    else if (S.lastPlay === t - 2 && S.freeze > 0) { S.freeze--; S.streak++; toast(words.freezeUsed); }
    else S.streak = 1;
    S.lastPlay = t;
    S.best = Math.max(S.best, S.streak);
    if (S.streak % 7 === 0) {
      S.freeze = Math.min(S.freeze + 1, 2);
      setTimeout(() => toast(words.freezeEarned), 1500);
    }
    save();
    return true;
  }

  return { addXP, earnStreak, setRunActive };
}
