// Crée les pages de recherche et de profil des joueurs

import { createPlayerResult } from '../components/PlayerResult.js';
import { navigateTo } from '../router/router.js';

import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

import profilFemmeImage from '../assets/images/profiles/Profil femme.jpg';
import profilFemme2Image from '../assets/images/profiles/profil femme 2.jpg';
import profilFemme3Image from '../assets/images/profiles/profil femme 3.jpg';
import profilHommeImage from '../assets/images/profiles/profil homme.jpg';
import profilHomme2Image from '../assets/images/profiles/profil homme 2.jpg';
import profilHomme3Image from '../assets/images/profiles/profil homme 3.jpg';

import '../css/players.css';

// Adresse de l'API Symfony
const API_URL = 'http://127.0.0.1:8000';

// Données de présentation des joueurs
const players = [
    {
        slug: 'marion',
        name: 'Marion',
        age: 28,
        city: 'Chaville (92)',
        department: 'Hauts-de-Seine',
        games: 11,
        image: profilFemmeImage,
        memberSince: 'juin 2025',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        library: []
    },
    {
        slug: 'aurel',
        name: 'Aurel',
        age: 31,
        city: 'Sceaux (92)',
        department: 'Hauts-de-Seine',
        games: 36,
        image: profilHommeImage,
        memberSince: 'mai 2025',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        library: []
    },
    {
        slug: 'jean',
        name: 'Jean',
        age: 38,
        city: 'Antony (92)',
        department: 'Hauts-de-Seine',
        games: 20,
        image: profilHomme2Image,
        memberSince: 'avril 2025',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        library: []
    },
    {
        slug: 'charlotte',
        name: 'Charlotte',
        age: 27,
        city: 'Saint-Cloud (92)',
        department: 'Hauts-de-Seine',
        games: 6,
        image: profilFemme2Image,
        memberSince: 'mars 2025',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        library: []
    },
    {
        slug: 'caroline',
        name: 'Caroline',
        age: 34,
        city: 'Issy-Les-Moulineaux (92)',
        department: 'Hauts-de-Seine',
        games: 14,
        image: profilFemme3Image,
        memberSince: 'février 2025',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        library: []
    },
    {
        slug: 'mickael',
        name: 'Mickaël',
        age: 33,
        city: 'Clamart (92)',
        department: 'Hauts-de-Seine',
        games: 38,
        image: profilHomme3Image,
        memberSince: 'janvier 2025',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        library: []
    }
];


/* ========================================
   API des ludothèques
   ======================================== */

/**
 * Récupère les ludothèques depuis l'API Symfony.
 */
async function fetchPlayerLibraries() {
    // Récupère le JWT enregistré lors de la connexion
    const token = localStorage.getItem('token');

    const response = await fetch(
        `${API_URL}/api/players/libraries`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `Erreur API : ${response.status}`
        );
    }

    return response.json();
}

/**
 * Récupère les ludothèques et les associe
 * aux joueurs correspondants.
 */
async function loadPlayerLibraries(page) {
    try {
        const playersLibraries =
            await fetchPlayerLibraries();

        playersLibraries.forEach((apiPlayer) => {
            const player = players.find(
                (item) =>
                    item.name.toLowerCase() ===
                    apiPlayer.pseudo.toLowerCase()
            );

            if (!player) {
                return;
            }

            // Remplace la ludothèque fictive par les données API
            player.library = Array.isArray(
                apiPlayer.library
            )
                ? apiPlayer.library
                : [];

            // Utilise le nombre réel de jeux récupérés
            player.games = player.library.length;
        });

        /*
         * Si nous sommes sur la page de recherche,
         * on rafraîchit les résultats et le profil affiché.
         */
        const resultsContainer =
            page.querySelector('.players-results');

        if (resultsContainer) {
            refreshPlayersPage(resultsContainer);
            return;
        }

        /*
         * Si nous sommes sur une page de profil individuelle,
         * on reconstruit simplement le profil.
         */
        const profile =
            page.querySelector('.player-profile');

        if (!profile) {
            return;
        }

        const slug =
            profile.dataset.playerSlug;

        const player = players.find(
            (item) => item.slug === slug
        );

        if (!player) {
            return;
        }

        const newProfile =
            createPlayerProfile(player);

        profile.replaceWith(newProfile);

    } catch (error) {
        console.error(
            'Impossible de récupérer les ludothèques des joueurs.',
            error
        );
    }
}


/* ========================================
   Pages
   ======================================== */

/**
 * Crée la page de recherche des joueurs.
 */
export function createPlayersPage() {
    const page = document.createElement('main');
    page.classList.add('players-page');

    const hero = createPlayersHero();
    const content = createPlayersContent();

    page.append(
        hero,
        content
    );

    // Charge les vraies ludothèques depuis Symfony
    loadPlayerLibraries(page);

    return page;
}

/**
 * Crée la page de profil d'un joueur.
 */
export function createPlayerProfilePage(slug) {
    const player = players.find(
        (item) => item.slug === slug
    );

    if (!player) {
        return createPlayerNotFoundPage();
    }

    const page = document.createElement('main');
    page.classList.add('player-profile-page');

    const backLink = document.createElement('a');

    backLink.href = '/joueurs';
    backLink.classList.add(
        'player-profile-back'
    );
    backLink.textContent =
        'Retour aux résultats';

    backLink.addEventListener(
        'click',
        (event) => {
            event.preventDefault();
            navigateTo('/joueurs');
        }
    );

    const profile =
        createPlayerProfile(player);

    page.append(
        backLink,
        profile
    );

    // Charge la vraie ludothèque depuis Symfony
    loadPlayerLibraries(page);

    return page;
}


/* ========================================
   Hero
   ======================================== */

function createPlayersHero() {
    const section =
        document.createElement('section');

    section.classList.add(
        'players-hero'
    );

    const content =
        document.createElement('div');

    content.classList.add(
        'players-hero-content'
    );

    const title =
        document.createElement('h1');

    const firstLine =
        document.createElement('span');

    firstLine.textContent =
        'Rechercher des';

    const secondLine =
        document.createElement('span');

    secondLine.classList.add(
        'heading-highlight'
    );

    secondLine.textContent =
        'joueurs';

    title.append(
        firstLine,
        secondLine
    );

    const description =
        document.createElement('p');

    description.textContent =
        'Trouve des joueurs qui possèdent ou connaissent les règles du jeu que tu aimes';

    content.append(
        title,
        description
    );

    const imageContainer =
        document.createElement('div');

    imageContainer.classList.add(
        'players-hero-image'
    );

    const image =
        document.createElement('img');

    image.src = ludothequeImage;
    image.alt =
        'Ludothèque contenant des jeux de société';

    imageContainer.append(image);

    section.append(
        content,
        imageContainer
    );

    return section;
}


/* ========================================
   Contenu
   ======================================== */

function createPlayersContent() {
    const section =
        document.createElement('section');

    section.classList.add(
        'players-content'
    );

    const searchPanel =
        createSearchPanel();

    const resultsPanel =
        createResultsPanel();

    section.append(
        searchPanel,
        resultsPanel
    );

    return section;
}


/* ========================================
   Recherche
   ======================================== */

function createSearchPanel() {
    const panel =
        document.createElement('div');

    panel.classList.add(
        'players-search-panel'
    );

    const gameField =
        document.createElement('div');

    gameField.classList.add(
        'players-search-field'
    );

    const gameLabel =
        document.createElement('label');

    gameLabel.textContent =
        'Jeu';

    const gameInputContainer =
        document.createElement('div');

    gameInputContainer.classList.add(
        'players-search-input'
    );

    const icon =
        document.createElement('i');

    icon.classList.add(
        'bi',
        'bi-search'
    );

    icon.setAttribute(
        'aria-hidden',
        'true'
    );

    const input =
        document.createElement('input');

    input.type = 'search';
    input.placeholder =
        'Rechercher un jeu...';

    input.setAttribute(
        'aria-label',
        'Rechercher un jeu'
    );

    gameInputContainer.append(
        icon,
        input
    );

    gameField.append(
        gameLabel,
        gameInputContainer
    );

    const departmentField =
        document.createElement('div');

    departmentField.classList.add(
        'players-search-field'
    );

    const departmentLabel =
        document.createElement('label');

    departmentLabel.textContent =
        'Département';

    const select =
        document.createElement('select');

    select.setAttribute(
        'aria-label',
        'Choisir un département'
    );

    const defaultOption =
        document.createElement('option');

    defaultOption.value = '';
    defaultOption.textContent =
        'Choisir un département';

    const departmentOption =
        document.createElement('option');

    departmentOption.value =
        'Hauts-de-Seine';

    departmentOption.textContent =
        'Hauts-de-Seine';

    select.append(
        defaultOption,
        departmentOption
    );

    departmentField.append(
        departmentLabel,
        select
    );

    const button =
        document.createElement('button');

    button.type = 'button';

    button.classList.add(
        'players-search-button'
    );

    button.textContent =
        'Rechercher';

    button.addEventListener(
        'click',
        () => {
            filterPlayers(
                input.value.trim(),
                select.value
            );
        }
    );

    panel.append(
        gameField,
        departmentField,
        button
    );

    return panel;
}


/* ========================================
   Résultats
   ======================================== */

function createResultsPanel() {
    const container =
        document.createElement('div');

    container.classList.add(
        'players-results'
    );

    const heading =
        document.createElement('h2');

    const title =
        document.createElement('span');

    title.textContent =
        'Résultats';

    const count =
        document.createElement('span');

    count.classList.add(
        'players-results-count'
    );

    count.textContent =
        `(${players.length} joueurs)`;

    heading.append(
        title,
        count
    );

    const list =
        document.createElement('div');

    list.classList.add(
        'players-results-list'
    );

    list.dataset.resultsList =
        'true';

    players.forEach(
        (player, index) => {
            list.append(
                createPlayerResult(
                    player,
                    index === 0,
                    (selectedPlayer) => {
                        selectPlayer(
                            selectedPlayer,
                            container
                        );
                    }
                )
            );
        }
    );

    const selectedPlayer =
        players[0];

    const profile =
        createPlayerProfile(
            selectedPlayer
        );

    profile.classList.add(
        'players-desktop-profile'
    );

    container.append(
        heading,
        list,
        profile
    );

    return container;
}


/**
 * Rafraîchit la liste des joueurs après
 * le chargement des ludothèques depuis l'API.
 */
function refreshPlayersPage(container) {
    const list =
        container.querySelector(
            '[data-results-list]'
        );

    if (!list) {
        return;
    }

    /*
     * Conserve le joueur actuellement affiché.
     */
    const currentProfile =
        container.querySelector(
            '.players-desktop-profile'
        );

    const selectedSlug =
        currentProfile?.dataset.playerSlug ||
        players[0]?.slug;

    /*
     * Reconstruit la liste des joueurs.
     */
    list.replaceChildren();

    players.forEach((player) => {
        list.append(
            createPlayerResult(
                player,
                player.slug === selectedSlug,
                (selectedPlayer) => {
                    selectPlayer(
                        selectedPlayer,
                        container
                    );
                }
            )
        );
    });

    /*
     * Reconstruit le profil sélectionné.
     */
    const selectedPlayer =
        players.find(
            (player) =>
                player.slug === selectedSlug
        ) || players[0];

    if (!selectedPlayer || !currentProfile) {
        return;
    }

    const newProfile =
        createPlayerProfile(
            selectedPlayer
        );

    newProfile.classList.add(
        'players-desktop-profile'
    );

    currentProfile.replaceWith(
        newProfile
    );
}


/* ========================================
   Sélection d'un joueur
   ======================================== */

function selectPlayer(
    player,
    container
) {
    const results =
        container.querySelectorAll(
            '.player-result'
        );

    results.forEach((result) => {
        result.classList.remove(
            'is-selected'
        );
    });

    const selectedResult =
        Array.from(results).find(
            (result) =>
                result.getAttribute(
                    'href'
                ) ===
                `/joueurs/${player.slug}`
        );

    if (selectedResult) {
        selectedResult.classList.add(
            'is-selected'
        );
    }

    const currentProfile =
        container.querySelector(
            '.players-desktop-profile'
        );

    if (!currentProfile) {
        return;
    }

    const newProfile =
        createPlayerProfile(player);

    newProfile.classList.add(
        'players-desktop-profile'
    );

    currentProfile.replaceWith(
        newProfile
    );
}


/* ========================================
   Profil joueur
   ======================================== */

function createPlayerProfile(player) {
    const profile =
        document.createElement('article');

    profile.classList.add(
        'player-profile'
    );

    // Conserve l'identifiant du joueur affiché
    profile.dataset.playerSlug =
        player.slug;

    const header =
        document.createElement('div');

    header.classList.add(
        'player-profile-header'
    );

    const imageContainer =
        document.createElement('div');

    imageContainer.classList.add(
        'player-profile-image'
    );

    const image =
        document.createElement('img');

    image.src = player.image;

    image.alt =
        `Photo de profil de ${player.name}`;

    imageContainer.append(image);

    const information =
        document.createElement('div');

    information.classList.add(
        'player-profile-information'
    );

    const name =
        document.createElement('h1');

    name.textContent =
        player.name;

    const age =
        createProfileInformation(
            'bi-person',
            `${player.age} ans`
        );

    const city =
        createProfileInformation(
            'bi-geo-alt',
            player.city
        );

    information.append(
        name,
        age,
        city
    );

    const actions =
        document.createElement('div');

    actions.classList.add(
        'player-profile-actions'
    );

    const messageButton =
        document.createElement('button');

    messageButton.type = 'button';

    messageButton.classList.add(
        'player-profile-message'
    );

    messageButton.textContent =
        'Envoyer un message';

    const libraryButton =
        document.createElement('button');

    libraryButton.type = 'button';

    libraryButton.classList.add(
        'player-profile-library'
    );

    libraryButton.textContent =
        'Voir la ludothèque';

    actions.append(
        messageButton,
        libraryButton
    );

    header.append(
        imageContainer,
        information,
        actions
    );

    const body =
        document.createElement('div');

    body.classList.add(
        'player-profile-body'
    );

    const about =
        createAboutSection(player);

    const library =
        createLibrarySection(player);

    body.append(
        about,
        library
    );

    profile.append(
        header,
        body
    );

    return profile;
}


/* ========================================
   À propos
   ======================================== */

function createAboutSection(player) {
    const section =
        document.createElement('section');

    section.classList.add(
        'player-profile-about'
    );

    const title =
        document.createElement('h2');

    title.textContent =
        'A propos';

    const description =
        document.createElement('p');

    description.textContent =
        player.description;

    const statistics =
        createProfileStatistics(
            player
        );

    section.append(
        title,
        description,
        statistics
    );

    return section;
}


/* ========================================
   Ludothèque
   ======================================== */

function createLibrarySection(player) {
    const section =
        document.createElement('section');

    section.classList.add(
        'player-profile-library-section'
    );

    const heading =
        document.createElement('div');

    heading.classList.add(
        'player-profile-library-heading'
    );

    const title =
        document.createElement('h2');

    title.textContent =
        'Sa ludothèque';

    const link =
        document.createElement('a');

    link.href = '#';

    link.textContent =
        'Voir toute sa ludothèque';

    link.addEventListener(
        'click',
        (event) => {
            event.preventDefault();
        }
    );

    const arrow =
        document.createElement('i');

    arrow.classList.add(
        'bi',
        'bi-arrow-right'
    );

    arrow.setAttribute(
        'aria-hidden',
        'true'
    );

    link.append(arrow);

    heading.append(
        title,
        link
    );

    const games =
        document.createElement('div');

    games.classList.add(
        'player-profile-games'
    );

    /*
     * Affiche au maximum six jeux dans le profil.
     */
    player.library
        .slice(0, 6)
        .forEach((game) => {
            const card =
                document.createElement('article');

            card.classList.add(
                'player-profile-game'
            );

            const imageContainer =
                document.createElement('div');

            imageContainer.classList.add(
                'player-profile-game-image'
            );

            const image =
                document.createElement('img');

            // Les images sont servies par Symfony
            image.src =
                `${API_URL}${game.image}`;

            image.alt =
                `Boîte du jeu ${game.name}`;

            imageContainer.append(image);

            const name =
                document.createElement('span');

            name.textContent =
                game.name;

            card.append(
                imageContainer,
                name
            );

            games.append(card);
        });

    section.append(
        heading,
        games
    );

    return section;
}


/* ========================================
   Statistiques
   ======================================== */

function createProfileStatistics(player) {
    const statistics =
        document.createElement('div');

    statistics.classList.add(
        'player-profile-statistics'
    );

    const games =
        createStatistic(
            'bi-dice-5',
            `${player.games} jeux dans sa ludothèque`
        );

    const memberSince =
        createStatistic(
            'bi-calendar3',
            `Membre depuis ${player.memberSince}`
        );

    statistics.append(
        games,
        memberSince
    );

    return statistics;
}


/* ========================================
   Éléments d'information
   ======================================== */

function createStatistic(
    iconName,
    text
) {
    const statistic =
        document.createElement('p');

    const icon =
        document.createElement('i');

    icon.classList.add(
        'bi',
        iconName
    );

    icon.setAttribute(
        'aria-hidden',
        'true'
    );

    const label =
        document.createElement('span');

    label.textContent =
        text;

    statistic.append(
        icon,
        label
    );

    return statistic;
}

function createProfileInformation(
    iconName,
    text
) {
    const information =
        document.createElement('p');

    const icon =
        document.createElement('i');

    icon.classList.add(
        'bi',
        iconName
    );

    icon.setAttribute(
        'aria-hidden',
        'true'
    );

    const label =
        document.createElement('span');

    label.textContent =
        text;

    information.append(
        icon,
        label
    );

    return information;
}


/* ========================================
   Filtre
   ======================================== */

function filterPlayers(
    gameSearch,
    department
) {
    const list =
        document.querySelector(
            '[data-results-list]'
        );

    if (!list) {
        return;
    }

    list.replaceChildren();

    const filteredPlayers =
        players.filter((player) => {
            const matchesDepartment =
                department === '' ||
                player.department === department;

            const matchesGame =
                gameSearch === '' ||
                player.library.some(
                    (game) =>
                        game.name
                            .toLowerCase()
                            .includes(
                                gameSearch.toLowerCase()
                            )
                );

            return (
                matchesDepartment &&
                matchesGame
            );
        });

    filteredPlayers.forEach((player) => {
        list.append(
            createPlayerResult(
                player,
                false,
                (selectedPlayer) => {
                    const container =
                        document.querySelector(
                            '.players-results'
                        );

                    if (container) {
                        selectPlayer(
                            selectedPlayer,
                            container
                        );
                    }
                }
            )
        );
    });

    const count =
        document.querySelector(
            '.players-results-count'
        );

    if (count) {
        count.textContent =
            `(${filteredPlayers.length} joueurs)`;
    }
}


/* ========================================
   Joueur introuvable
   ======================================== */

function createPlayerNotFoundPage() {
    const page =
        document.createElement('main');

    page.classList.add(
        'player-not-found'
    );

    const title =
        document.createElement('h1');

    title.textContent =
        'Joueur introuvable';

    const link =
        document.createElement('a');

    link.href = '/joueurs';

    link.textContent =
        'Retour aux joueurs';

    link.addEventListener(
        'click',
        (event) => {
            event.preventDefault();

            navigateTo('/joueurs');
        }
    );

    page.append(
        title,
        link
    );

    return page;
}