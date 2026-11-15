// The shared day arithmetic, plus this shift's daily counter.
import { today } from '../engine/time';
export * from '../engine/time';

/** Sequential number shown as "Daily Eval #n" (#1 = 2026-11-13, SHIFTY-1's launch day). */
export const dailyNumber = (): number => today() - 20769;
