
 // Crée la page d'accueil de People Meeple

import { createGameCard } from '../components/GameCard.js';
import { createPlayerCard } from '../components/PlayerCard.js';
import { getGames } from '../api/gamesApi.js';
import { isAuthenticated } from '../services/authService.js';
import { navigateTo } from '../router/router.js';

import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

const API_URL = '';
const DEFAULT_PROFILE_PICTURE = `${API_URL}/images/meeple-default.png`;

export function createHomePage() {
    const page = document.createElement('div');
    page.classList.add('home-page');

    const hero = createHeroSection();
    const gamesSection = createGamesSection();

    page.append(hero, gamesSection);

    // Les suggestions de joueurs sont réservées aux membres connectés.
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

    // Icône de recherche.
    const searchIcon = document.createElement('i');
    searchIcon.classList.add('bi', 'bi-search');
    searchIcon.setAttribute('aria-hidden', 'true');

    // Champ de recherche.
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Rechercher un jeu...';
    searchInput.setAttribute('aria-label', 'Rechercher un jeu');
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.setAttribute('aria-autocomplete', 'list');
    searchInput.setAttribute('aria-expanded', 'false');

    // Menu des suggestions.
    const suggestionsMenu = document.createElement('div');
    suggestionsMenu.classList.add('home-search-suggestions');
    suggestionsMenu.hidden = true;
    suggestionsMenu.setAttribute('role', 'listbox');
    suggestionsMenu.setAttribute('aria-label', 'Suggestions de jeux');

    searchContainer.append(searchIcon, searchInput, suggestionsMenu);

    const searchButton = document.createElement('button');
    searchButton.type = 'submit';
    searchButton.textContent = 'Rechercher';

    searchForm.append(searchContainer, searchButton);

    // Conserve les jeux chargés pour filtrer sans rappeler l'API.
    let availableGames = [];
    let gamesLoaded = false;
    let loadingGames = false;

    // Normalise les textes pour ignorer la casse et les accents.
    function normalizeText(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('fr')
            .trim();
    }

    // Ferme la liste des suggestions.
    function closeSuggestions() {
        suggestionsMenu.hidden = true;
        suggestionsMenu.replaceChildren();
        searchInput.setAttribute('aria-expanded', 'false');
    }

    // Affiche les jeux correspondant au début du nom saisi.
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

            // Ouvre la page de détail du jeu sélectionné.
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

    // Charge le catalogue au premier besoin.
    async function loadSearchGames() {
        if (gamesLoaded || loadingGames) {
            return;
        }

        loadingGames = true;

        try {
            availableGames = await getGames();
            gamesLoaded = true;

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

    // Filtre les résultats à chaque frappe.
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '') {
            closeSuggestions();
            return;
        }

        if (gamesLoaded) {
            displaySuggestions(searchInput.value);
        } else {
            loadSearchGames();
        }
    });

    // Ouvre les suggestions si le champ contient déjà une recherche.
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

    // Ferme les suggestions avec la touche Échap.
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSuggestions();
        }

        // Sélectionne le premier résultat avec la touche Entrée.
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

    // Empêche le formulaire de recharger la page.
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

    // Ferme le menu quand l'utilisateur clique ailleurs.
    document.addEventListener('click', (event) => {
        if (!searchContainer.contains(event.target)) {
            closeSuggestions();
        }
    });

    content.append(title, description, searchForm);

    // Image du hero desktop.
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

    // Conserve la grille pour pouvoir la remplir après l'appel API.
    section.gamesGrid = gamesGrid;

    loadHomeGames(section);

    return section;
}

/**
 * Récupère les jeux depuis l'API et en sélectionne quatre au hasard.
 */
async function loadHomeGames(section) {
    try {
        const games = await getGames();

        // Vérifie que l'API a bien renvoyé une liste de jeux.
        if (!Array.isArray(games)) {
            throw new Error('La liste des jeux reçue est invalide.');
        }

        // Mélange tous les jeux avant d'en sélectionner quatre.
        const suggestedGames = shuffleArray(games).slice(0, 4);

        section.gamesGrid.replaceChildren();

        if (suggestedGames.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Aucun jeu à découvrir pour le moment.';

            section.gamesGrid.append(emptyMessage);
            return;
        }

        suggestedGames.forEach((game) => {
            section.gamesGrid.append(createGameCard(game));
        });
    } catch (error) {
        section.gamesGrid.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.textContent =
            'Impossible de charger les jeux pour le moment.';

        section.gamesGrid.append(errorMessage);

        console.error(
            'Impossible de charger les jeux de la page d’accueil.',
            error
        );
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
        'Recherche des joueurs',
        '/joueurs'
    );

    const playersGrid = document.createElement('div');
    playersGrid.classList.add('players-grid');

    const loading = document.createElement('p');
    loading.textContent = 'Chargement des joueurs...';

    playersGrid.append(loading);

    container.append(heading, playersGrid);
    section.append(container);

    // Charge les profils en fonction du département du membre connecté.
    loadHomePlayers(playersGrid);

    return section;
}

/**
 * Récupère le profil connecté et les joueurs, puis sélectionne quatre profils
 * aléatoires du même département.
 */
async function loadHomePlayers(playersGrid) {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Aucun jeton d’authentification disponible.');
        }

        // Récupère le profil du membre connecté.
        const currentUserResponse = await fetch(`${API_URL}/api/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        });

        if (!currentUserResponse.ok) {
            throw new Error(
                `Impossible de récupérer le profil connecté : ${currentUserResponse.status}`
            );
        }

        const currentUser = await currentUserResponse.json();

        // Récupère les joueurs et leurs ludothèques.
        const playersResponse = await fetch(
            `${API_URL}/api/players/libraries`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        if (!playersResponse.ok) {
            throw new Error(
                `Erreur API lors du chargement des joueurs : ${playersResponse.status}`
            );
        }

        const players = await playersResponse.json();

        playersGrid.replaceChildren();

        // Normalise les départements pour comparer les codes sans erreur.
        const normalizeDepartment = (department) => {
            return String(department || '').trim().toUpperCase();
        };

        const currentDepartment = normalizeDepartment(
            currentUser.department
        );

        if (!currentDepartment) {
            displayPlayersMessage(
                playersGrid,
                'Renseigne ton département dans ton profil pour découvrir des joueurs près de chez toi.'
            );
            return;
        }

        // Exclut le compte connecté, les comptes de test et l'administration.
        const eligiblePlayers = players.filter((player) => {
            const sameDepartment =
                normalizeDepartment(player.department) === currentDepartment;

            const isCurrentUser =
                String(player.id) === String(currentUser.id);

            const pseudo = String(player.pseudo || '')
                .trim()
                .toLowerCase();

            const isTestAccount = [
                'testmeeple',
                'testmeeple2',
                'adminmeeple'
            ].includes(pseudo);

            return sameDepartment && !isCurrentUser && !isTestAccount;
        });

        // Mélange les profils pour éviter de toujours afficher les mêmes.
        const shuffledPlayers = shuffleArray(eligiblePlayers);

        // Affiche quatre joueurs au maximum.
        const suggestedPlayers = shuffledPlayers.slice(0, 4);

        if (suggestedPlayers.length === 0) {
            displayPlayersMessage(
                playersGrid,
                'Aucun autre joueur de ton département à afficher pour le moment.'
            );
            return;
        }

        suggestedPlayers.forEach((apiPlayer) => {
            const player = mapApiPlayerToCard(apiPlayer);
            playersGrid.append(createPlayerCard(player));
        });
    } catch (error) {
        playersGrid.replaceChildren();

        displayPlayersMessage(
            playersGrid,
            'Impossible de charger les joueurs pour le moment.'
        );

        console.error(
            'Impossible de charger les joueurs de la page d’accueil.',
            error
        );
    }
}

/**
 * Mélange une copie du tableau sans modifier le tableau original.
 */
function shuffleArray(items) {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));

        [shuffled[index], shuffled[randomIndex]] = [
            shuffled[randomIndex],
            shuffled[index]
        ];
    }

    return shuffled;
}

/**
 * Affiche un message dans la grille des joueurs.
 */
function displayPlayersMessage(container, message) {
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    container.append(paragraph);
}

/**
 * Adapte les données de l'API au format attendu par PlayerCard.
 */
function mapApiPlayerToCard(apiPlayer) {
    const age = calculateAge(apiPlayer.dateOfBirth);
    const city = apiPlayer.city || 'Ville non renseignée';

    return {
        name: apiPlayer.pseudo || 'Joueur',
        age,
        city,
        games: Array.isArray(apiPlayer.library)
            ? apiPlayer.library.length
            : 0,
        image: getProfilePictureUrl(apiPlayer.profilePicture),
        fallbackImage: DEFAULT_PROFILE_PICTURE,
        // Chaque carte pointe vers le profil correspondant à son joueur.
        path: `/joueurs/${createPlayerSlug(apiPlayer.pseudo, apiPlayer.id)}`
    };
}

/**
 * Construit un slug identique à celui utilisé dans Players.js.
 */
function createPlayerSlug(pseudo, id) {
    const normalizedPseudo = String(pseudo || 'joueur')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `${normalizedPseudo || 'joueur'}-${id}`;
}

/**
 * Construit l'URL d'une photo de profil.
 */
function getProfilePictureUrl(profilePicture) {
    if (!profilePicture) {
        return DEFAULT_PROFILE_PICTURE;
    }

    // Conserve les URL complètes déjà fournies par l'API.
    if (/^https?:\/\//i.test(profilePicture)) {
        return profilePicture;
    }

    // Conserve les chemins absolus fournis par l'API.
    if (profilePicture.startsWith('/')) {
        return `${API_URL}${profilePicture}`;
    }

    // Les avatars numérotés des fixtures sont stockés dans le dossier avatars.
    if (/^\d{3}\.jpg$/i.test(profilePicture)) {
        return `${API_URL}/images/avatars/${encodeURIComponent(profilePicture)}`;
    }

    // Les autres fichiers restent recherchés dans le dossier images.
    return `${API_URL}/images/${encodeURIComponent(profilePicture)}`;
}

/**
 * Calcule l'âge à partir d'une date de naissance.
 */
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) {
        return null;
    }

    const birthDate = new Date(`${dateOfBirth}T00:00:00`);

    if (Number.isNaN(birthDate.getTime())) {
        return null;
    }

    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const birthdayNotPassed =
        today.getMonth() < birthDate.getMonth()
        || (
            today.getMonth() === birthDate.getMonth()
            && today.getDate() < birthDate.getDate()
        );

    if (birthdayNotPassed) {
        age--;
    }

    return age >= 0 ? age : null;
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
