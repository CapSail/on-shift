// The Ghost CISO shift (CISSP), as the shell loads it.
import { routes, setSoundSource } from '../engine/ui';
import { setEquipped, type HatId } from '../engine/shifty';
import { S } from './state';
import { startCase } from './play';

export { home } from './home';

export function activate(): void {
  setEquipped(S.hat as HatId);
  setSoundSource(() => S.sound);
  routes.startShift = () => startCase();
}
