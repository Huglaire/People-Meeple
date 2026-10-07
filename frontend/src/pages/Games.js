// Crée la page de présentation des jeux

import { createGameCard } from '../components/GameCard.js';

import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

import azulImage from '../assets/images/games/Azul.jpg';
import challengersImage from '../assets/images/games/challengers.jpg';
import fiveTribesImage from '../assets/images/games/five tribes.jpg';
import rootImage from '../assets/images/games/root.jpeg';
import orichalqueImage from '../assets/images/games/orichalque.png';
import orleansImage from '../assets/images/games/orleans.webp';
import sagradaImage from '../assets/images/games/Sagrada.jpeg';

import '../css/games.css';

export function createGamesPage() {
    const page = document.createElement('main');
    page.classList.add('games-page');

    const hero = createGamesHero();
    const gamesSection = createGamesSection();

    page.append(hero, gamesSection);

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
    count.textContent = '(7 jeux)';
    count.classList.add('games-count');

    title.append(document.createTextNode(' '), count);
    heading.append(title);

    const gamesGrid = document.createElement('div');
    gamesGrid.classList.add('games-grid');

    const games = [
        {
            name: 'Azul',
            image: azulImage,
            players: '2-4 joueurs',
            duration: '45 min'
        },
        {
            name: 'Challengers!',
            image: challengersImage,
            players: '1-8 joueurs',
            duration: '45 min'
        },
        {
            name: 'Five Tribes',
            image: fiveTribesImage,
            players: '2-4 joueurs',
            duration: '60 min'
        },
        {
            name: 'Root',
            image: rootImage,
            players: '1-4 joueurs',
            duration: '80 min'
        },
        {
            name: 'Orichalque',
            image: orichalqueImage,
            players: '2-4 joueurs',
            duration: '60 min'
        },
        {
            name: 'Orléans',
            image: orleansImage,
            players: '2-4 joueurs',
            duration: '90 min'
        },
        {
            name: 'Sagrada',
            image: sagradaImage,
            players: '1-4 joueurs',
            duration: '45 min'
        }
    ];

    games.forEach((game) => {
        gamesGrid.append(createGameCard(game));
    });

    container.append(heading, gamesGrid);
    section.append(container);

    return section;
}