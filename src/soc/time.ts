// The shared day arithmetic, plus this shift's daily counter.
import { today } from '../engine/time';
export * from '../engine/time';

/** Sequential number shown as "DAILY HAUNT #n". */
export const dailyNumber = (): number => today() - 20400;
