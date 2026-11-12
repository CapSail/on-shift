// XP, ranks and streaks: state changes that also need UI feedback.
import { RANKS, S, rankOf, save } from './state';
import { today, week } from './time';
import { confetti, sfx, toast, xpFloat } from './ui';

export function addXP(n: number, anchor?: HTMLElement | null, pulse = false): void {
  const before = rankOf(S.xp);
  S.xp = Math.max(0, S.xp + n);
  if (S.wk.id !== week()) S.wk = { id: week(), xp: 0 };
  S.wk.xp = Math.max(0, S.wk.xp + n);
  save();
  xpFloat(n, anchor, pulse);
  const after = rankOf(S.xp);
  if (after > before) {
    setTimeout(() => {
      toast('⬆ RANK UP → ' + RANKS[after][1]);
      sfx('rank');
      confetti(40);
    }, 500);
  }
}

/** Streaks are earned by FINISHING a shift, incident, boss or ride shift (not by opening the app). */
export function earnStreak(): boolean {
  const t = today();
  if (S.lastPlay === t) return false;
  if (S.lastPlay === t - 1) S.streak++;
  else if (S.lastPlay === t - 2 && S.freeze > 0) { S.freeze--; S.streak++; toast('🧊 Streak freeze used'); }
  else S.streak = 1;
  S.lastPlay = t;
  S.best = Math.max(S.best, S.streak);
  if (S.streak % 7 === 0) {
    S.freeze = Math.min(S.freeze + 1, 2);
    setTimeout(() => toast('🧊 Streak freeze earned'), 1500);
  }
  save();
  return true;
}
