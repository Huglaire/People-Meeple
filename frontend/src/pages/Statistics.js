// Page d'administration des statistiques de People Meeple

import { isAdmin } from '../services/authService.js';
import { getStatistics } from '../api/statisticsApi.js';

import '../css/statistics.css';

// Crée un élément de texte avec une classe CSS.
function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.classList.add(className);
    element.textContent = text;

    return element;
}

// Affiche un message dans une zone de la page.
function setMessage(container, message, isError = false) {
    container.replaceChildren();

    const paragraph = document.createElement('p');
    paragraph.classList.add('statistics-message');

    if (isError) {
        paragraph.classList.add('statistics-message-error');
    }

    paragraph.textContent = message;
    container.append(paragraph);
}

// Construit la carte d'une statistique.
function createStatisticsCard(title, description, contentClass) {
    const card = document.createElement('section');
    card.classList.add('statistics-card');

    const header = document.createElement('header');
    header.classList.add('statistics-card-header');

    const heading = createTextElement(
        'h2',
        'statistics-card-title',
        title
    );

    const introduction = createTextElement(
        'p',
        'statistics-card-description',
        description
    );

    header.append(heading, introduction);

    const content = document.createElement('div');
    content.classList.add('statistics-card-content', contentClass);

    card.append(header, content);

    return { card, content };
}

// Construit le graphique des jeux les plus consultés.
function renderMostViewedGames(container, games) {
    container.replaceChildren();

    if (!Array.isArray(games) || games.length === 0) {
        setMessage(
            container,
            'Aucune consultation de jeu n’a encore été enregistrée.'
        );
        return;
    }

    const maximumViews = Math.max(
        ...games.map((game) => Number(game.views) || 0),
        1
    );

    const chart = document.createElement('div');
    chart.classList.add('statistics-bar-chart');
    chart.setAttribute('role', 'list');
    chart.setAttribute(
        'aria-label',
        'Nombre de consultations par jeu, classés du plus consulté au moins consulté'
    );

    games.forEach((game) => {
        const row = document.createElement('div');
        row.classList.add('statistics-bar-row');
        row.setAttribute('role', 'listitem');

        const label = createTextElement(
            'span',
            'statistics-bar-label',
            String(game.name ?? 'Jeu sans nom')
        );

        const track = document.createElement('div');
        track.classList.add('statistics-bar-track');

        const bar = document.createElement('div');
        bar.classList.add('statistics-bar', 'statistics-bar-games');

        const views = Math.max(0, Number(game.views) || 0);
        const width = views === 0
            ? 0
            : Math.max(3, (views / maximumViews) * 100);

        bar.style.width = `${width}%`;
        bar.setAttribute(
            'aria-label',
            `${views} consultation${views > 1 ? 's' : ''}`
        );

        track.append(bar);

        const value = createTextElement(
            'span',
            'statistics-bar-value',
            `${views} consultation${views > 1 ? 's' : ''}`
        );

        row.append(label, track, value);
        chart.append(row);
    });

    container.append(chart);
}

// Construit le graphique des inscriptions hebdomadaires.
function renderRegistrationsByWeek(container, weeks) {
    container.replaceChildren();

    if (!Array.isArray(weeks) || weeks.length === 0) {
        setMessage(
            container,
            'Aucune donnée hebdomadaire d’inscription n’est disponible.'
        );
        return;
    }

    const maximumRegistrations = Math.max(
        ...weeks.map(
            (week) => Number(week.registrations ?? week.count) || 0
        ),
        1
    );

    const chart = document.createElement('div');
    chart.classList.add('statistics-week-chart');
    chart.setAttribute('role', 'list');
    chart.setAttribute(
        'aria-label',
        'Nombre de nouvelles inscriptions pour chacune des douze semaines affichées'
    );

    weeks.forEach((week) => {
        const item = document.createElement('div');
        item.classList.add('statistics-week-column');
        item.setAttribute('role', 'listitem');

        const registrations = Math.max(
            0,
            Number(week.registrations ?? week.count) || 0
        );

        const value = createTextElement(
            'span',
            'statistics-week-value',
            String(registrations)
        );

        const track = document.createElement('div');
        track.classList.add('statistics-week-track');

        const bar = document.createElement('div');
        bar.classList.add('statistics-week-bar');

        const height = registrations === 0
            ? 0
            : Math.max(
                3,
                (registrations / maximumRegistrations) * 100
            );

        bar.style.height = `${height}%`;
        bar.setAttribute(
            'aria-label',
            `${registrations} nouvelle${registrations > 1 ? 's' : ''} inscription${registrations > 1 ? 's' : ''}`
        );

        track.append(bar);

        const label = createTextElement(
            'span',
            'statistics-week-label',
            String(week.week ?? '')
        );

        item.append(value, track, label);
        chart.append(item);
    });

    container.append(chart);
}

// Charge et affiche les données de l'API.
async function loadStatistics(
    gamesContainer,
    registrationsContainer,
    refreshButton
) {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Actualisation…';

    setMessage(gamesContainer, 'Chargement des consultations…');
    setMessage(registrationsContainer, 'Chargement des inscriptions…');

    try {
        const statistics = await getStatistics();

        renderMostViewedGames(
            gamesContainer,
            statistics.mostViewedGames
        );

        renderRegistrationsByWeek(
            registrationsContainer,
            statistics.registrationsByWeek
        );
    } catch (error) {
        console.error(
            'Erreur lors du chargement des statistiques :',
            error
        );

        setMessage(
            gamesContainer,
            error.message || 'Une erreur est survenue lors du chargement.',
            true
        );

        setMessage(
            registrationsContainer,
            'Les statistiques ne peuvent pas être affichées pour le moment.',
            true
        );
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = 'Actualiser les données';
    }
}

// Crée la page de statistiques réservée aux administrateurs.
export function createStatisticsPage() {
    const page = document.createElement('main');
    page.classList.add('statistics-page');

    if (!isAdmin()) {
        page.append(createTextElement(
            'p',
            'statistics-message',
            'Vous devez être administrateur pour accéder à cette page.'
        ));

        return page;
    }

    const container = document.createElement('div');
    container.classList.add('statistics-container');

    const header = document.createElement('header');
    header.classList.add('statistics-header');

    const eyebrow = createTextElement(
        'p',
        'statistics-eyebrow',
        'PEOPLE MEEPLE'
    );

    const title = document.createElement('h1');
    title.textContent = 'Statistiques';

    const introduction = createTextElement(
        'p',
        'statistics-introduction',
        'Suivez les jeux les plus consultés et l’évolution des inscriptions sur la plateforme.'
    );

    header.append(eyebrow, title, introduction);

    const actions = document.createElement('div');
    actions.classList.add('statistics-actions');

    const refreshButton = document.createElement('button');
    refreshButton.classList.add('statistics-refresh-button');
    refreshButton.type = 'button';
    refreshButton.textContent = 'Actualiser les données';

    actions.append(refreshButton);

    const cards = document.createElement('div');
    cards.classList.add('statistics-grid');

    const gamesStatistics = createStatisticsCard(
        'Jeux les plus consultés',
        'Les dix jeux ayant reçu le plus de consultations depuis l’activation du suivi.',
        'statistics-games-content'
    );

    const registrationsStatistics = createStatisticsCard(
        'Nouvelles inscriptions',
        'Nombre de comptes créés par semaine sur les douze dernières semaines.',
        'statistics-registrations-content'
    );

    cards.append(
        gamesStatistics.card,
        registrationsStatistics.card
    );

    container.append(header, actions, cards);
    page.append(container);

    refreshButton.addEventListener('click', () => {
        loadStatistics(
            gamesStatistics.content,
            registrationsStatistics.content,
            refreshButton
        );
    });

    loadStatistics(
        gamesStatistics.content,
        registrationsStatistics.content,
        refreshButton
    );

    return page;
}