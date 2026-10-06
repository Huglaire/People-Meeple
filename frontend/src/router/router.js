// Routeur principal de l'application People Meeple

import { createHomePage } from '../pages/Home.js';
import { createLoginPage } from '../pages/Login.js';
import { createRegisterPage } from '../pages/Register.js';
import { createLayout } from '../components/Layout.js';

const routes = {
    '/': createHomePage,
    '/connexion': createLoginPage,
    '/inscription': createRegisterPage
};

// Affiche la page correspondant à l'URL actuelle
export function router() {
    const path = window.location.pathname;
    const app = document.querySelector('#app');

    // Vide le contenu actuel sans utiliser innerHTML
    app.replaceChildren();

    const page = routes[path];

    if (page) {
        app.append(createLayout(page()));
        return;
    }

    // Crée la page 404
    const errorPage = document.createElement('main');
    errorPage.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Page introuvable';

    errorPage.append(title);

    app.append(createLayout(errorPage));
}

// Change l'URL sans recharger la page
export function navigateTo(path) {
    window.history.pushState({}, '', path);
    router();
}

// Réagit aux boutons précédent/suivant du navigateur
window.addEventListener('popstate', router);