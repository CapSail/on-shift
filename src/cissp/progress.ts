// XP, standing and tenure (the streak) for the Ghost CISO. The rules live in the engine; these are the words.
// Tenure is earned by FINISHING a case, a daily case, a board exam or a drill (not by opening the app).
import { createProgress } from '../engine/progress';
import { RANKS, store } from './state';

export const { addXP, earnStreak, setRunActive } = createProgress(store, RANKS, {
  rankUp: (title) => '⬆ PROMOTED → ' + title,
  freezeUsed: '🧊 A board member covered for you (missed day forgiven)',
  freezeEarned: '🧊 Board goodwill earned (covers 1 missed day)',
});
