// XP, ranks and streaks for the SOC shift. The rules live in the engine; these are the words.
// Streaks are earned by FINISHING a round, incident, boss or ride round (not by opening the app).
import { createProgress } from '../engine/progress';
import { RANKS, store } from './state';

export const { addXP, earnStreak } = createProgress(store, RANKS, {
  rankUp: (title) => '⬆ RANK UP → ' + title,
  freezeUsed: '🧊 Streak freeze used',
  freezeEarned: '🧊 Streak freeze earned',
});
