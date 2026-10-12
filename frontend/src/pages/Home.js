// Crée la page d'accueil de People Meeple

import { createGameCard } from '../components/GameCard.js';
import { createPlayerCard } from '../components/PlayerCard.js';
import { getGames } from '../api/gamesApi.js';
import { isAuthenticated } from '../services/authService.js';
import { navigateTo } from '../router/router.js';

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

    page.append(hero, gamesSection);

    // Les suggestions de joueurs sont réservées aux membres connectés
    if (isAuthenticated()) {
        page.append(createPlayersSection());
    }

    return page;
}


/* ========================================
   Hero et recherche de jeux
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

    description.textContent = isAuthenticated()
        ? 'Trouve des joueurs près de chez toi pour faire une partie avec eux.'
        : 'Découvre des jeux de société et rejoins une communauté de joueurs pour partager tes prochaines parties.';

    const searchForm = document.createElement('form');
    searchForm.classList.add('home-search');

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('home-search-input');

    // Icône de recherche
    const searchIcon = document.createElement('i');
    searchIcon.classList.add('bi', 'bi-search');
    searchIcon.setAttribute('aria-hidden', 'true');

    // Champ de recherche
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Rechercher un jeu...';
    searchInput.setAttribute('aria-label', 'Rechercher un jeu');
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.setAttribute('aria-autocomplete', 'list');
    searchInput.setAttribute('aria-expanded', 'false');

    // Menu des suggestions
    const suggestionsMenu = document.createElement('div');
    suggestionsMenu.classList.add('home-search-suggestions');
    suggestionsMenu.hidden = true;
    suggestionsMenu.setAttribute('role', 'listbox');
    suggestionsMenu.setAttribute(
        'aria-label',
        'Suggestions de jeux'
    );

    searchContainer.append(
        searchIcon,
        searchInput,
        suggestionsMenu
    );

    const searchButton = document.createElement('button');
    searchButton.type = 'submit';
    searchButton.textContent = 'Rechercher';

    searchForm.append(searchContainer, searchButton);

    // Conserve les jeux chargés pour filtrer sans rappeler l'API
    let availableGames = [];
    let gamesLoaded = false;
    let loadingGames = false;
    let latestSearch = '';

    // Normalise les textes pour ignorer la casse et les accents
    function normalizeText(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('fr')
            .trim();
    }

    // Ferme la liste des suggestions
    function closeSuggestions() {
        suggestionsMenu.hidden = true;
        suggestionsMenu.replaceChildren();
        searchInput.setAttribute('aria-expanded', 'false');
    }

    // Affiche les jeux correspondant au début du nom saisi
    function displaySuggestions(search) {
        suggestionsMenu.replaceChildren();

        const normalizedSearch = normalizeText(search);

        if (normalizedSearch === '') {
            closeSuggestions();
            return;
        }

        const matchingGames = availableGames
            .filter((game) => {
                return normalizeText(game.name || '')
                    .startsWith(normalizedSearch);
            })
            .sort((first, second) => {
                return first.name.localeCompare(
                    second.name,
                    'fr',
                    { sensitivity: 'base' }
                );
            });

        if (matchingGames.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.classList.add('home-search-no-results');
            emptyMessage.textContent = 'Aucun jeu trouvé.';

            suggestionsMenu.append(emptyMessage);
            suggestionsMenu.hidden = false;
            searchInput.setAttribute('aria-expanded', 'true');

            return;
        }

        matchingGames.forEach((game) => {
            const suggestion = document.createElement('button');

            suggestion.type = 'button';
            suggestion.classList.add('home-search-suggestion');
            suggestion.setAttribute('role', 'option');
            suggestion.textContent = game.name;

            // Ouvre la page de détail du jeu sélectionné
            suggestion.addEventListener('click', () => {
                if (!game.slug) {
                    console.error(
                        'Le jeu ne possède pas de slug :',
                        game
                    );

                    return;
                }

                closeSuggestions();
                navigateTo(`/jeux/${game.slug}`);
            });

            suggestionsMenu.append(suggestion);
        });

        suggestionsMenu.hidden = false;
        searchInput.setAttribute('aria-expanded', 'true');
    }

    // Charge le catalogue au premier besoin
    async function loadSearchGames() {
        if (gamesLoaded || loadingGames) {
            return;
        }

        loadingGames = true;

        try {
            availableGames = await getGames();
            gamesLoaded = true;

            // Affiche les résultats correspondant à la saisie actuelle
            if (searchInput.value.trim() !== '') {
                displaySuggestions(searchInput.value);
            }
        } catch (error) {
            console.error(
                'Impossible de charger les suggestions de jeux.',
                error
            );

            if (searchInput.value.trim() !== '') {
                suggestionsMenu.replaceChildren();

                const errorMessage = document.createElement('p');
                errorMessage.classList.add('home-search-no-results');
                errorMessage.textContent =
                    'Impossible de charger les jeux pour le moment.';

                suggestionsMenu.append(errorMessage);
                suggestionsMenu.hidden = false;
                searchInput.setAttribute('aria-expanded', 'true');
            }
        } finally {
            loadingGames = false;
        }
    }

    // Filtre les résultats à chaque frappe
    searchInput.addEventListener('input', () => {
        latestSearch = searchInput.value.trim();

        if (latestSearch === '') {
            closeSuggestions();
            return;
        }

        if (gamesLoaded) {
            displaySuggestions(latestSearch);
        } else {
            loadSearchGames();
        }
    });

    // Ouvre les suggestions si le champ contient déjà une recherche
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() === '') {
            return;
        }

        if (gamesLoaded) {
            displaySuggestions(searchInput.value);
        } else {
            loadSearchGames();
        }
    });

    // Ferme les suggestions avec la touche Échap
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSuggestions();
        }

        // Sélectionne le premier résultat avec la touche Entrée
        if (event.key === 'Enter' && !suggestionsMenu.hidden) {
            const firstSuggestion = suggestionsMenu.querySelector(
                '.home-search-suggestion'
            );

            if (firstSuggestion) {
                event.preventDefault();
                firstSuggestion.click();
            }
        }
    });

    // Empêche le formulaire de recharger la page
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const search = searchInput.value.trim();

        if (search === '') {
            return;
        }

        if (!gamesLoaded) {
            loadSearchGames();
            return;
        }

        const normalizedSearch = normalizeText(search);

        const exactMatch = availableGames.find((game) => {
            return normalizeText(game.name || '') === normalizedSearch;
        });

        const firstMatch = availableGames
            .filter((game) => {
                return normalizeText(game.name || '')
                    .startsWith(normalizedSearch);
            })
            .sort((first, second) => {
                return first.name.localeCompare(
                    second.name,
                    'fr',
                    { sensitivity: 'base' }
                );
            })[0];

        const selectedGame = exactMatch || firstMatch;

        if (selectedGame?.slug) {
            closeSuggestions();
            navigateTo(`/jeux/${selectedGame.slug}`);
        } else {
            displaySuggestions(search);
        }
    });

    // Ferme le menu quand l'utilisateur clique ailleurs
    document.addEventListener('click', (event) => {
        if (!searchContainer.contains(event.target)) {
            closeSuggestions();
        }
    });

    content.append(title, description, searchForm);

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

    container.append(heading, location, playersGrid);
    section.append(container);

    return section;
}


/* ========================================
   Titre de section
   ======================================== */

function createSectionHeading(
    firstPart,
    secondPart,
    linkLabel,
    linkPath
) {
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