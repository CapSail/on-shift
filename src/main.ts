import './style.css';
import { home } from './home';
import { startShift } from './shift';
import { initNavigation, routes } from './ui';

routes.home = home;
routes.startShift = startShift;
initNavigation();
home();
