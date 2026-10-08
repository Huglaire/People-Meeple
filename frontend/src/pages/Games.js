// Crée la page de présentation des jeux

import { createGameCard } from '../components/GameCard.js';
import { getGames } from '../api/gamesApi.js';

import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

import '../css/games.css';

export function createGamesPage() {
    const page = document.createElement('main');
    page.classList.add('games-page');

    const hero = createGamesHero();
    const gamesSection = createGamesSection();

    page.append(hero, gamesSection);

    loadGames(gamesSection);

    return page;
}

// Crée le hero de la page des jeux
function createGamesHero() {
    const section = document.createElement('section');
    section.classList.add('games-hero');

    const content = document.createElement('div');
    content.classList.add('games-hero-content');

    const title = document.createElement('h1');

    const firstLine = document.createElement('span');
    firstLine.textContent = 'Découvre';

    const secondLine = document.createElement('span');
    secondLine.classList.add('heading-highlight');
    secondLine.textContent = 'les jeux';

    title.append(firstLine, secondLine);

    const description = document.createElement('p');
    description.textContent =
        'Découvre les jeux disponibles sur People Meeple et trouve ceux auxquels tu aimerais jouer.';

    const searchForm = document.createElement('form');
    searchForm.classList.add('games-search');

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('games-search-input');

    const searchIcon = document.createElement('i');
    searchIcon.classList.add('bi', 'bi-search');
    searchIcon.setAttribute('aria-hidden', 'true');

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Rechercher un jeu...';
    searchInput.setAttribute('aria-label', 'Rechercher un jeu');

    searchContainer.append(searchIcon, searchInput);

    const searchButton = document.createElement('button');
    searchButton.type = 'submit';
    searchButton.textContent = 'Rechercher';

    searchForm.append(searchContainer, searchButton);

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const search = searchInput.value.trim();

        if (search === '') {
            return;
        }

        console.log(`Recherche du jeu : ${search}`);
    });

    content.append(title, description, searchForm);

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('games-hero-image');

    const image = document.createElement('img');
    image.src = ludothequeImage;
    image.alt = 'Ludothèque contenant des jeux de société';

    imageContainer.append(image);

    section.append(content, imageContainer);

    return section;
}

// Crée la section contenant la liste des jeux
function createGamesSection() {
    const section = document.createElement('section');
    section.classList.add('games-section');

    const container = document.createElement('div');
    container.classList.add('games-section-container');

    const heading = document.createElement('div');
    heading.classList.add('games-section-heading');

    const title = document.createElement('h2');
    title.textContent = 'Tous les jeux';

    const count = document.createElement('span');
    count.classList.add('games-count');

    title.append(document.createTextNode(' '), count);
    heading.append(title);

    const gamesGrid = document.createElement('div');
    gamesGrid.classList.add('games-grid');

    const loading = document.createElement('p');
    loading.classList.add('games-loading');
    loading.textContent = 'Chargement des jeux...';

    gamesGrid.append(loading);

    container.append(heading, gamesGrid);
    section.append(container);

    section.gamesGrid = gamesGrid;
    section.gamesCount = count;

    return section;
}

// Récupère les jeux depuis l'API et les affiche
async function loadGames(section) {
    try {
        const games = await getGames();

        section.gamesGrid.replaceChildren();

        section.gamesCount.textContent = `(${games.length} jeux)`;

        if (games.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'Aucun jeu disponible pour le moment.';

            section.gamesGrid.append(message);

            return;
        }

        games.forEach((game) => {
            section.gamesGrid.append(createGameCard(game));
        });
    } catch (error) {
        section.gamesGrid.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.textContent =
            'Impossible de charger les jeux pour le moment.';

        section.gamesGrid.append(errorMessage);

        console.error(error);
    }
}