// Point d'entrée principal de l'application People Meeple

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './style.css';

import { router } from './router/router.js';
import { createMobileNavigation } from './components/MobileNavigation.js';

// Lance le routeur au chargement de l'application
router();

// Ajoute la navigation principale mobile
const mobileNavigation = createMobileNavigation();
document.body.append(mobileNavigation);