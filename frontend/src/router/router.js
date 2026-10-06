// Routeur principal de l'application People Meeple

const routes = {
    '/': createHomePage,
    '/connexion': createLoginPage,
    '/inscription': createRegisterPage
};

// Crée une page d'accueil temporaire
function createHomePage() {
    const page = document.createElement('main');
    page.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Accueil';

    page.append(title);

    return page;
}

// Crée une page de connexion temporaire
function createLoginPage() {
    const page = document.createElement('main');
    page.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Connexion';

    page.append(title);

    return page;
}

// Crée une page d'inscription temporaire
function createRegisterPage() {
    const page = document.createElement('main');
    page.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Inscription';

    page.append(title);

    return page;
}

// Affiche la page correspondant à l'URL actuelle
export function router() {
    const path = window.location.pathname;
    const app = document.querySelector('#app');

    const page = routes[path];

    // Vide le conteneur sans utiliser innerHTML
    app.replaceChildren();

    if (page) {
        app.append(page());
        return;
    }

    // Crée la page 404
    const errorPage = document.createElement('main');
    errorPage.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Page introuvable';

    errorPage.append(title);
    app.append(errorPage);
}

// Change l'URL sans recharger la page
export function navigateTo(path) {
    window.history.pushState({}, '', path);
    router();
}

// Réagit aux boutons précédent/suivant du navigateur
window.addEventListener('popstate', router);