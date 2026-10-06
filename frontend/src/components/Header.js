// Crée le header principal de People Meeple

import logoPath from '../assets/logos/logo.svg';
import lettragePath from '../assets/logos/lettrage.svg';

export function createHeader() {
    const header = document.createElement('header');
    header.classList.add('site-header');

    const container = document.createElement('div');
    container.classList.add('header-container');

    // Logo complet
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

    // Navigation principale
    const navigation = document.createElement('nav');
    navigation.classList.add('header-navigation');
    navigation.setAttribute('aria-label', 'Navigation principale');

    const navigationItems = [
        { label: 'Accueil', path: '/' },
        { label: 'Jeux', path: '/jeux' },
        { label: 'Joueurs', path: '/joueurs' },
        { label: 'Messages', path: '/discussions' },
        { label: 'Profil', path: '/profil' }
    ];

    navigationItems.forEach((item) => {
        const link = document.createElement('a');

        link.href = item.path;
        link.textContent = item.label;
        link.classList.add('header-navigation-link');

        navigation.append(link);
    });

    // Actions utilisateur
    const userActions = document.createElement('div');
    userActions.classList.add('header-actions');

    const loginLink = document.createElement('a');
    loginLink.href = '/connexion';
    loginLink.textContent = 'Connexion';
    loginLink.classList.add('header-login');

    const registerLink = document.createElement('a');
    registerLink.href = '/inscription';
    registerLink.textContent = 'Inscription';
    registerLink.classList.add('header-register');

    userActions.append(loginLink, registerLink);

    container.append(
        logoLink,
        navigation,
        userActions
    );

    header.append(container);

    return header;
}