// Crée le header principal de People Meeple

import logoPath from '../assets/logos/logo.svg';
import lettragePath from '../assets/logos/lettrage.svg';

import {
    isAuthenticated,
    isAdmin,
    logout
} from '../services/authService.js';

import { navigateTo } from '../router/router.js';

// Crée un lien de navigation.
function createNavigationLink(label, path) {
    const link = document.createElement('a');

    link.href = path;
    link.textContent = label;
    link.classList.add('header-navigation-link');

    link.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(path);
    });

    return link;
}

// Crée un bouton de déconnexion.
function createLogoutButton() {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = 'Déconnexion';
    button.classList.add('header-register');
    button.setAttribute('aria-label', 'Se déconnecter');

    button.addEventListener('click', () => {
        logout();
        window.history.replaceState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

    return button;
}

export function createHeader() {
    const header = document.createElement('header');
    header.classList.add('site-header');

    const container = document.createElement('div');
    container.classList.add('header-container');

    // Crée le logo complet.
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.classList.add('header-logo');
    logoLink.setAttribute('aria-label', 'Retour à l’accueil');

    const logo = document.createElement('img');
    logo.src = logoPath;
    logo.alt = '';

    const lettrage = document.createElement('img');
    lettrage.src = lettragePath;
    lettrage.alt = 'People Meeple';
    lettrage.classList.add('header-lettering');

    logoLink.append(logo, lettrage);

    // Crée le bouton du menu mobile.
    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.classList.add('mobile-menu-button');
    menuButton.setAttribute('aria-label', 'Ouvrir le menu');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-controls', 'main-navigation');

    const menuIcon = document.createElement('span');
    menuIcon.classList.add('mobile-menu-icon');
    menuIcon.setAttribute('aria-hidden', 'true');
    menuIcon.textContent = '☰';

    menuButton.append(menuIcon);

    // Crée la navigation principale.
    const navigation = document.createElement('nav');
    navigation.id = 'main-navigation';
    navigation.classList.add('header-navigation');
    navigation.setAttribute('aria-label', 'Navigation principale');

    // Les liens publics sont visibles pour tous.
    const navigationItems = [
        { label: 'Accueil', path: '/' },
        { label: 'Jeux', path: '/jeux' }
    ];

    // Les liens communautaires sont réservés aux membres.
    if (isAuthenticated()) {
        navigationItems.push(
            { label: 'Joueurs', path: '/joueurs' },
            { label: 'Ma ludothèque', path: '/ludotheque' },
            { label: 'Messages', path: '/discussions' },
            { label: 'Profil', path: '/profil' }
        );
    }

    // L'administration mène au dashboard, pas à une page spécifique.
    if (isAuthenticated() && isAdmin()) {
        navigationItems.push({
            label: 'Administration',
            path: '/admin'
        });
    }

    navigationItems.forEach((item) => {
        navigation.append(
            createNavigationLink(item.label, item.path)
        );
    });

    // Prépare les actions de compte pour ordinateur.
    const userActions = document.createElement('div');
    userActions.classList.add('header-actions');

    if (isAuthenticated()) {
        userActions.append(createLogoutButton());
    } else {
        // Lien vers la connexion.
        const loginLink = document.createElement('a');
        loginLink.href = '/connexion';
        loginLink.textContent = 'Connexion';
        loginLink.classList.add('header-login');

        loginLink.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('/connexion');
        });

        // Lien vers l'inscription.
        const registerLink = document.createElement('a');
        registerLink.href = '/inscription';
        registerLink.textContent = 'Inscription';
        registerLink.classList.add('header-register');

        registerLink.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo('/inscription');
        });

        userActions.append(loginLink, registerLink);
    }

    // Ajoute les actions au menu déroulant mobile.
    const mobileActions = document.createElement('div');
    mobileActions.classList.add('mobile-menu-actions');

    if (isAuthenticated()) {
        mobileActions.append(createLogoutButton());
    } else {
        const loginLink = createNavigationLink(
            'Connexion',
            '/connexion'
        );

        const registerLink = createNavigationLink(
            'Inscription',
            '/inscription'
        );

        mobileActions.append(loginLink, registerLink);
    }

    navigation.append(mobileActions);

    // Ouvre et ferme le menu mobile.
    menuButton.addEventListener('click', () => {
        const menuIsOpen =
            menuButton.getAttribute('aria-expanded') === 'true';

        menuButton.setAttribute(
            'aria-expanded',
            String(!menuIsOpen)
        );

        menuButton.setAttribute(
            'aria-label',
            menuIsOpen ? 'Ouvrir le menu' : 'Fermer le menu'
        );

        navigation.classList.toggle('is-open', !menuIsOpen);
    });

    container.append(
        logoLink,
        navigation,
        menuButton,
        userActions
    );

    header.append(container);

    return header;
}