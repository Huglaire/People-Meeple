// Crée la page d'accueil de People Meeple

import { createGameCard } from '../components/GameCard.js';
import { createPlayerCard } from '../components/PlayerCard.js';
import { getGames } from '../api/gamesApi.js';

import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

import profilFemmeImage from '../assets/images/profiles/Profil femme.jpg';
import profilHommeImage from '../assets/images/profiles/profil homme.jpg';
import profilHomme2Image from '../assets/images/profiles/profil homme 2.jpg';
import profilFemme2Image from '../assets/images/profiles/profil femme 2.jpg';

export function createHomePage() {
    const page = document.createElement('div');
    page.classList.add('home-page');

    const hero = createHeroSection();
    const gamesSection = createGamesSection();
    const playersSection = createPlayersSection();

    page.append(
        hero,
        gamesSection,
        playersSection
    );

    return page;
}


/* ========================================
   Hero
   ======================================== */

function createHeroSection() {
    const section = document.createElement('section');
    section.classList.add('home-hero');

    const content = document.createElement('div');
    content.classList.add('home-hero-content');

    const title = document.createElement('h1');

    const firstLine = document.createElement('span');
    firstLine.textContent = 'Tu veux jouer';

    const secondLine = document.createElement('span');
    secondLine.append(
        document.createTextNode('à quel '),
        createColoredWord('jeu?')
    );

    title.append(firstLine, secondLine);

    const description = document.createElement('p');
    description.textContent = 'Trouve des joueurs près de chez toi pour faire une partie avec eux.';

    const searchForm = document.createElement('form');
    searchForm.classList.add('home-search');

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('home-search-input');

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

    // Prépare la future recherche de jeux
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const search = searchInput.value.trim();

        if (search === '') {
            return;
        }

        console.log(`Recherche du jeu : ${search}`);
    });

    content.append(
        title,
        description,
        searchForm
    );

    // Image du hero desktop
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('home-hero-image');

    const image = document.createElement('img');
    image.src = ludothequeImage;
    image.alt = 'Ludothèque contenant des jeux de société';

    imageContainer.append(image);

    section.append(content, imageContainer);

    return section;
}


/* ========================================
   Section jeux
   ======================================== */

function createGamesSection() {
    const section = document.createElement('section');
    section.classList.add('home-section', 'home-games-section');

    const container = document.createElement('div');
    container.classList.add('home-section-container');

    const heading = createSectionHeading(
        'Jeux',
        'à découvrir',
        'Voir tous les jeux',
        '/jeux'
    );

    const gamesGrid = document.createElement('div');
    gamesGrid.classList.add('games-grid');

    const loading = document.createElement('p');
    loading.textContent = 'Chargement des jeux...';

    gamesGrid.append(loading);

    container.append(heading, gamesGrid);
    section.append(container);

    // Conserve la grille pour pouvoir la remplir après l'appel API
    section.gamesGrid = gamesGrid;

    loadHomeGames(section);

    return section;
}


/**
 * Récupère les jeux depuis l'API et affiche les quatre premiers.
 */
async function loadHomeGames(section) {
    try {
        const games = await getGames();

        section.gamesGrid.replaceChildren();

        games.slice(0, 4).forEach((game) => {
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


/* ========================================
   Section joueurs
   ======================================== */

function createPlayersSection() {
    const section = document.createElement('section');
    section.classList.add('home-section', 'home-players-section');

    const container = document.createElement('div');
    container.classList.add('home-section-container');

    const heading = createSectionHeading(
        'Joueurs',
        'proches de chez vous',
        'Voir tous les joueurs',
        '/joueurs'
    );

    // Localisation affichée dans le mockup
    const location = document.createElement('p');
    location.classList.add('home-location');

    const locationIcon = document.createElement('i');
    locationIcon.classList.add('bi', 'bi-geo-alt');
    locationIcon.setAttribute('aria-hidden', 'true');

    const locationText = document.createElement('span');
    locationText.textContent = 'Département : Hauts-de-Seine';

    location.append(locationIcon, locationText);

    const playersGrid = document.createElement('div');
    playersGrid.classList.add('players-grid');

    const players = [
        {
            name: 'Marion',
            age: 28,
            city: 'Chaville (92)',
            games: 11,
            image: profilFemmeImage,
            path: '/joueurs/marion'
        },
        {
            name: 'Aurel',
            age: 31,
            city: 'Sceaux (92)',
            games: 36,
            image: profilHommeImage,
            path: '/joueurs/aurel'
        },
        {
            name: 'Jean',
            age: 43,
            city: 'Antony (92)',
            games: 20,
            image: profilHomme2Image,
            path: '/joueurs/jean'
        },
        {
            name: 'Charlotte',
            age: 27,
            city: 'Saint-Cloud (92)',
            games: 6,
            image: profilFemme2Image,
            path: '/joueurs/charlotte'
        }
    ];

    players.forEach((player) => {
        playersGrid.append(createPlayerCard(player));
    });

    container.append(
        heading,
        location,
        playersGrid
    );

    section.append(container);

    return section;
}


/* ========================================
   Titre de section
   ======================================== */

function createSectionHeading(firstPart, secondPart, linkLabel, linkPath) {
    const headingContainer = document.createElement('div');
    headingContainer.classList.add('home-section-heading');

    const title = document.createElement('h2');

    const first = document.createElement('span');
    first.textContent = firstPart;

    const second = document.createElement('span');
    second.classList.add('heading-highlight');
    second.textContent = secondPart;

    title.append(first, document.createTextNode(' '), second);

    const link = document.createElement('a');
    link.href = linkPath;
    link.classList.add('home-section-link');
    link.textContent = linkLabel;

    const arrow = document.createElement('i');
    arrow.classList.add('bi', 'bi-arrow-right');
    arrow.setAttribute('aria-hidden', 'true');

    link.append(arrow);

    headingContainer.append(title, link);

    return headingContainer;
}


/* ========================================
   Élément de titre coloré
   ======================================== */

function createColoredWord(text) {
    const word = document.createElement('span');
    word.classList.add('heading-highlight');
    word.textContent = text;

    return word;
}