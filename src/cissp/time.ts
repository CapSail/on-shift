// The shared day arithmetic, plus this shift's daily counter.
import { today } from '../engine/time';
export * from '../engine/time';

/** Sequential number shown as "Daily case #n" (#1 = 2026-11-19, the CISO's first day). */
export const dailyNumber = (): number => today() - 20775;
