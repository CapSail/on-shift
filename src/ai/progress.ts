// XP, tiers and uptime (the streak) for SHIFTY-1. The rules live in the engine; these are the words.
// Uptime is earned by FINISHING a run, eval, benchmark, red-team fight or earbud session (not by opening the app).
// While a run is on screen (setRunActive), tier-ups are celebrated on the end screen instead of a toast over the card.
import { createProgress } from '../engine/progress';
import { RANKS, store } from './state';

export const { addXP, earnStreak, setRunActive } = createProgress(store, RANKS, {
  rankUp: (title) => '⬆ MODEL UPGRADE → ' + title,
  freezeUsed: '🧊 Uptime saved by a backup generator',
  freezeEarned: '🧊 Backup generator earned (saves 1 missed day)',
});
