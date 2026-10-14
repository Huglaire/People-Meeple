
// Routeur principal de l'application People Meeple

import { createHomePage } from '../pages/Home.js';
import { createLoginPage } from '../pages/Login.js';
import { createRegisterPage } from '../pages/Register.js';

import {
    createPlayersPage,
    createPlayerProfilePage
} from '../pages/Players.js';

import { createGamesPage } from '../pages/Games.js';
import { createGameDetailPage } from '../pages/GameDetail.js';
import { createProfilePage } from '../pages/Profile.js';
import { createLayout } from '../components/Layout.js';
import { createLudothequePage } from '../pages/Ludotheque.js';
import { createPlayerLibraryPage } from '../pages/PlayerLibrary.js';

import { isAuthenticated } from '../services/authService.js';
import { createMobileNavigation } from '../components/MobileNavigation.js';

// Définit les pages accessibles directement.
const routes = {
    '/': createHomePage,
    '/connexion': createLoginPage,
    '/inscription': createRegisterPage,
    '/ludotheque': createLudothequePage,
    '/joueurs': createPlayersPage,
    '/jeux': createGamesPage,
    '/profil': createProfilePage
};

// Définit les chemins accessibles sans connexion.
function isPublicRoute(path) {
    return (
        path === '/'
        || path === '/connexion'
        || path === '/inscription'
        || path === '/jeux'
        || path.startsWith('/jeux/')
    );
}

export function router() {
    let path = window.location.pathname;

    const app = document.querySelector('#app');

    if (!app) {
        return;
    }

    // Redirige les visiteurs qui tentent d'ouvrir une page privée.
    if (!isPublicRoute(path) && !isAuthenticated()) {
        window.history.replaceState({}, '', '/connexion');
        path = '/connexion';
    }

    app.replaceChildren();

    let page;

    // Charge une route connue.
    if (routes[path]) {
        page = routes[path]();
    } else if (/^\/joueurs\/[a-z0-9-]+\/ludotheque$/.test(path)) {
        // Charge la ludothèque d'un joueur.
        const slug = path.split('/')[2];
        page = createPlayerLibraryPage(slug);
    } else if (/^\/joueurs\/[a-z0-9-]+$/.test(path)) {
        // Charge le profil du joueur correspondant au slug de l'URL.
        const slug = path.split('/')[2];
        page = createPlayerProfilePage(slug);
    } else if (path.startsWith('/jeux/')) {
        // Charge le détail d'un jeu.
        const slug = path.split('/')[2];
        page = createGameDetailPage(slug);
    }

    if (page) {
        app.append(createLayout(page));
    } else {
        // Affiche une page d'erreur pour les routes inconnues.
        const errorPage = document.createElement('main');
        errorPage.classList.add('container', 'py-5');

        const title = document.createElement('h1');
        title.textContent = 'Page introuvable';

        errorPage.append(title);
        app.append(createLayout(errorPage));
    }

    // Actualise la navigation mobile après chaque changement de page.
    const currentMobileNavigation = document.querySelector(
        '.mobile-navigation'
    );

    const newMobileNavigation = createMobileNavigation();

    if (currentMobileNavigation) {
        currentMobileNavigation.replaceWith(newMobileNavigation);
    } else {
        document.body.append(newMobileNavigation);
    }
}

// Gère les changements de page internes.
export function navigateTo(path) {
    window.history.pushState({}, '', path);
    router();
}

// Gère les retours et avances dans l'historique.
window.addEventListener('popstate', router);
