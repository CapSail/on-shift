import './style.css';
import { home } from './home';
import { startShift } from './shift';
import { initNavigation, routes } from './ui';
import { initPwa } from './pwa';
import { initLeaderboard } from './leaderboard';
import { installGate, needsInstallGate } from './install';

/** Where every "go home" lands: the install gate for phone visitors who have not installed yet, else home. */
const entry = () => (needsInstallGate() ? installGate(home) : home());
routes.home = entry;
routes.startShift = startShift;
initNavigation();
initPwa();
initLeaderboard();
entry();
