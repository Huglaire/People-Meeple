// Crée le header principal de People Meeple

import logoPath from '../assets/logos/logo.svg';

export function createHeader() {
    const header = document.createElement('header');
    header.classList.add('site-header');

    const container = document.createElement('div');
    container.classList.add('header-container');

    // Logo
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.classList.add('header-logo');

    const logo = document.createElement('img');
    logo.src = logoPath;
    logo.alt = 'People Meeple';

    logoLink.append(logo);

    // Navigation principale
    const navigation = document.createElement('nav');
    navigation.classList.add('header-navigation');
    navigation.setAttribute('aria-label', 'Navigation principale');

    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.textContent = 'Accueil';

    const searchLink = document.createElement('a');
    searchLink.href = '/recherche';
    searchLink.textContent = 'Rechercher';

    const discussionsLink = document.createElement('a');
    discussionsLink.href = '/discussions';
    discussionsLink.textContent = 'Discussions';

    navigation.append(homeLink, searchLink, discussionsLink);

    // Actions utilisateur
    const userActions = document.createElement('div');
    userActions.classList.add('header-actions');

    const loginLink = document.createElement('a');
    loginLink.href = '/connexion';
    loginLink.textContent = 'Connexion';

    const registerLink = document.createElement('a');
    registerLink.href = '/inscription';
    registerLink.textContent = 'Inscription';

    userActions.append(loginLink, registerLink);

    container.append(logoLink, navigation, userActions);
    header.append(container);

    return header;
}