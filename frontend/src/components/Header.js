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

    // Bouton du menu mobile
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

    // Navigation principale
    const navigation = document.createElement('nav');
    navigation.id = 'main-navigation';
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

    // Ouvre et ferme le menu mobile
    menuButton.addEventListener('click', () => {
        const menuIsOpen = menuButton.getAttribute('aria-expanded') === 'true';

        menuButton.setAttribute('aria-expanded', String(!menuIsOpen));
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