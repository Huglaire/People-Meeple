// Page d'accueil de l'administration de People Meeple

import { navigateTo } from '../router/router.js';
import { isAdmin } from '../services/authService.js';

import '../css/admin-dashboard.css';

// Crée une carte du tableau de bord.
function createDashboardCard({
    title,
    description,
    icon,
    path,
    available = false
}) {
    const card = document.createElement('article');
    card.classList.add('admin-dashboard-card');

    if (available) {
        card.classList.add('admin-dashboard-card-available');
    } else {
        card.classList.add('admin-dashboard-card-disabled');
    }

    const iconContainer = document.createElement('div');
    iconContainer.classList.add('admin-dashboard-card-icon');

    const iconElement = document.createElement('i');
    iconElement.classList.add('bi', icon);
    iconElement.setAttribute('aria-hidden', 'true');

    iconContainer.append(iconElement);

    const content = document.createElement('div');
    content.classList.add('admin-dashboard-card-content');

    const heading = document.createElement('h2');
    heading.classList.add('admin-dashboard-card-title');
    heading.textContent = title;

    const text = document.createElement('p');
    text.classList.add('admin-dashboard-card-description');
    text.textContent = description;

    content.append(heading, text);

    if (available) {
        const link = document.createElement('a');
        link.classList.add('admin-dashboard-card-link');
        link.href = path;
        link.textContent = 'Accéder à la page';

        link.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo(path);
        });

        content.append(link);
    } else {
        const status = document.createElement('span');
        status.classList.add('admin-dashboard-card-status');
        status.textContent = 'Bientôt disponible';

        content.append(status);
    }

    card.append(iconContainer, content);

    return card;
}

// Crée le tableau de bord d'administration.
export function createAdminDashboardPage() {
    const page = document.createElement('main');
    page.classList.add('admin-dashboard-page');

    // Vérifie le rôle avant d'afficher le tableau de bord.
    if (!isAdmin()) {
        const message = document.createElement('p');
        message.classList.add('admin-dashboard-error');
        message.textContent =
            'Vous devez être administrateur pour accéder à cette page.';

        page.append(message);

        return page;
    }

    const container = document.createElement('div');
    container.classList.add('admin-dashboard-container');

    const header = document.createElement('header');
    header.classList.add('admin-dashboard-header');

    const eyebrow = document.createElement('p');
    eyebrow.classList.add('admin-dashboard-eyebrow');
    eyebrow.textContent = 'PEOPLE MEEPLE';

    const title = document.createElement('h1');
    title.textContent = 'Administration';

    const introduction = document.createElement('p');
    introduction.classList.add('admin-dashboard-introduction');
    introduction.textContent =
        'Gérez les jeux et les fonctionnalités de la plateforme depuis cet espace.';

    header.append(eyebrow, title, introduction);

    const section = document.createElement('section');
    section.classList.add('admin-dashboard-section');
    section.setAttribute('aria-label', 'Fonctionnalités administratives');

    const sectionTitle = document.createElement('h2');
    sectionTitle.classList.add('admin-dashboard-section-title');
    sectionTitle.textContent = 'Gestion de la plateforme';

    const cards = document.createElement('div');
    cards.classList.add('admin-dashboard-grid');

    const cardDefinitions = [
        {
            title: 'Gestion des jeux',
            description:
                'Consultez et gérez le catalogue des jeux de société.',
            icon: 'bi-dice-5',
            path: '/admin/jeux',
            available: true
        },
        {
            title: 'Demandes de jeux',
            description:
                'Consultez les propositions des membres et acceptez ou refusez leurs demandes.',
            icon: 'bi-clipboard-check',
            path: '/admin/demandes-jeux',
            available: true
        },
        {
            title: 'Gestion des membres',
            description:
                'Consultez les comptes des membres et gérez leur accès à la plateforme.',
            icon: 'bi-people',
            path: '/admin/membres',
            available: false
        },
        {
            title: 'Statistiques',
            description:
                'Retrouvez les principales données d’activité de People Meeple.',
            icon: 'bi-bar-chart-line',
            path: '/admin/statistiques',
            available: false
        },
        {
            title: 'Paramètres',
            description:
                'Retrouvez ici les futurs paramètres de l’administration.',
            icon: 'bi-gear',
            path: '/admin/parametres',
            available: false
        }
    ];

    cardDefinitions.forEach((definition) => {
        cards.append(createDashboardCard(definition));
    });

    section.append(sectionTitle, cards);
    container.append(header, section);
    page.append(container);

    return page;
}