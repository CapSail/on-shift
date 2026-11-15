// The SOC shift (the original ON SHIFT game), as the shell loads it.
import { routes, setSoundSource } from '../engine/ui';
import { setEquipped, type HatId } from '../engine/shifty';
import { S } from './state';
import { startShift } from './shift';
import { initLeaderboard } from './leaderboard';

export { home } from './home';

let started = false;

export function activate(): void {
  setEquipped(S.hat as HatId);
  setSoundSource(() => S.sound);
  routes.startShift = startShift;
  if (!started) { started = true; initLeaderboard(); }
}
