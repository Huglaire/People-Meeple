// Crée le footer principal de People Meeple

import logoPath from '../assets/logos/logo.svg';
import lettragePath from '../assets/logos/lettrage.svg';

export function createFooter() {
    const footer = document.createElement('footer');
    footer.classList.add('site-footer');

    const container = document.createElement('div');
    container.classList.add('footer-container');

    // Logo complet
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.classList.add('footer-logo');
    logoLink.setAttribute('aria-label', 'Retour à l’accueil');

    const logo = document.createElement('img');
    logo.src = logoPath;
    logo.alt = '';

    const lettrage = document.createElement('img');
    lettrage.src = lettragePath;
    lettrage.alt = 'People Meeple';
    lettrage.classList.add('footer-lettering');

    logoLink.append(logo, lettrage);

    // Liens secondaires
    const navigation = document.createElement('nav');
    navigation.classList.add('footer-navigation');
    navigation.setAttribute('aria-label', 'Navigation secondaire');

    const contactLink = document.createElement('a');
    contactLink.href = '/contact';
    contactLink.textContent = 'Contact';
    contactLink.classList.add('footer-link');

    const legalLink = document.createElement('a');
    legalLink.href = '/mentions-legales';
    legalLink.textContent = 'Mentions légales';
    legalLink.classList.add('footer-link');

    navigation.append(contactLink, legalLink);

    container.append(logoLink, navigation);
    footer.append(container);

    return footer;
}