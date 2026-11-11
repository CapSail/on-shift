import './style.css';
import { home } from './home';
import { startShift } from './shift';
import { initNavigation, routes } from './ui';
import { initPwa } from './pwa';

routes.home = home;
routes.startShift = startShift;
initNavigation();
initPwa();
home();
