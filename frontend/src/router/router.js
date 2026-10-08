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

const routes = {
    '/': createHomePage,
    '/connexion': createLoginPage,
    '/inscription': createRegisterPage,

    '/joueurs': createPlayersPage,

    '/joueurs/marion': () => createPlayerProfilePage('marion'),
    '/joueurs/aurel': () => createPlayerProfilePage('aurel'),
    '/joueurs/jean': () => createPlayerProfilePage('jean'),
    '/joueurs/charlotte': () => createPlayerProfilePage('charlotte'),
    '/joueurs/caroline': () => createPlayerProfilePage('caroline'),
    '/joueurs/mickael': () => createPlayerProfilePage('mickael'),

    '/jeux': createGamesPage,
    '/profil': createProfilePage
};

export function router() {
    const path = window.location.pathname;
    const app = document.querySelector('#app');

    app.replaceChildren();

    let page;

    if (routes[path]) {
        page = routes[path]();
    } else if (path.startsWith('/jeux/')) {
        const slug = path.split('/')[2];
        page = createGameDetailPage(slug);
    }

    if (page) {
        app.append(createLayout(page));
        return;
    }

    const errorPage = document.createElement('main');
    errorPage.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Page introuvable';

    errorPage.append(title);

    app.append(createLayout(errorPage));
}

export function navigateTo(path) {
    window.history.pushState({}, '', path);
    router();
}

window.addEventListener('popstate', router);