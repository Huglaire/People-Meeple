// Crée les pages de recherche et de profil des joueurs

import { createPlayerResult } from '../components/PlayerResult.js';
import { createGameCard } from '../components/GameCard.js';
import { navigateTo } from '../router/router.js';
import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';
import { createConversation } from '../api/messagingApi.js';

// Photos de profil utilisées par les anciennes fixtures
import profilHommeImage from '../assets/images/profiles/profil homme.jpg';
import profilHomme2Image from '../assets/images/profiles/profil homme 2.jpg';
import profilHomme3Image from '../assets/images/profiles/profil homme 3.jpg';
import profilFemmeImage from '../assets/images/profiles/Profil femme.jpg';
import profilFemme2Image from '../assets/images/profiles/profil femme 2.jpg';
import profilFemme3Image from '../assets/images/profiles/profil femme 3.jpg';

import '../css/players.css';

// Adresse de l'API Symfony
const API_URL = 'http://127.0.0.1:8000';

// Les profils sont chargés depuis la base de données.
let players = [];

// Indique si une recherche a été lancée.
let hasSearched = false;

// Convertit un pseudo en identifiant d'URL lisible.
function createPlayerSlug(pseudo, id) {
    const normalizedPseudo = String(pseudo || 'joueur')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `${normalizedPseudo || 'joueur'}-${id}`;
}

// Calcule l'âge à partir de la date de naissance.
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

    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
        monthDifference < 0
        || (
            monthDifference === 0
            && today.getDate() < birthDate.getDate()
        )
    ) {
        age -= 1;
    }

    return age;
}

// Formate la date d'inscription pour l'affichage.
function formatMemberSince(createdAt) {
    if (!createdAt) {
        return 'date inconnue';
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return 'date inconnue';
    }

    return new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric'
    }).format(date);
}

// Construit l'URL d'une image de profil ou de jeu.
function getApiImageUrl(imagePath) {
    // Utilise la photo Meeple par défaut si aucune image n'est renseignée.
    if (!imagePath || imagePath === 'meeple-default.png') {
        return `${API_URL}/images/meeple-default.png`;
    }

    // Conserve les URL complètes.
    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }

    // Conserve les chemins absolus fournis par l'API.
    if (imagePath.startsWith('/')) {
        return `${API_URL}${imagePath}`;
    }

    // Les avatars numérotés sont stockés dans le dossier avatars.
    if (/^\d{3}\.jpg$/i.test(imagePath)) {
        return `${API_URL}/images/avatars/${encodeURIComponent(imagePath)}`;
    }

    // Compatibilité avec les anciennes photos locales du frontend.
    const profileImages = {
        'profil homme.jpg': profilHommeImage,
        'profil homme 2.jpg': profilHomme2Image,
        'profil homme 3.jpg': profilHomme3Image,
        'Profil femme.jpg': profilFemmeImage,
        'profil femme 2.jpg': profilFemme2Image,
        'profil femme 3.jpg': profilFemme3Image
    };

    if (profileImages[imagePath]) {
        return profileImages[imagePath];
    }

    // Les autres fichiers sont recherchés dans le dossier images de Symfony.
    return `${API_URL}/images/${encodeURIComponent(imagePath)}`;
}

// Transforme les données de l'API en données attendues par l'interface.
function mapApiPlayer(apiPlayer) {
    const library = Array.isArray(apiPlayer.library)
        ? apiPlayer.library
        : [];

    const department = apiPlayer.department
        ? String(apiPlayer.department)
        : '';

    // Respecte la visibilité de la ville définie par le joueur.
    const city = apiPlayer.city
        ? `${apiPlayer.city}${department ? ` (${department})` : ''}`
        : (
            apiPlayer.cityVisible
                ? 'Ville non renseignée'
                : 'Ville masquée'
        );

    return {
        id: apiPlayer.id,
        slug: createPlayerSlug(apiPlayer.pseudo, apiPlayer.id),
        name: apiPlayer.pseudo || 'Joueur',
        age: calculateAge(apiPlayer.dateOfBirth),
        city,
        department,
        games: library.length,
        image: getApiImageUrl(apiPlayer.profilePicture),
        memberSince: formatMemberSince(apiPlayer.createdAt),
        description: 'Joueur de jeux de société sur People Meeple.',
        library
    };
}

/* ========================================
   API des ludothèques
   ======================================== */

/**
 * Récupère les profils et ludothèques depuis l'API Symfony.
 */
async function fetchPlayerLibraries() {
    // Récupère le JWT enregistré lors de la connexion.
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error(
            'Aucun jeton de connexion trouvé. Connecte-toi pour rechercher des joueurs.'
        );
    }

    const response = await fetch(`${API_URL}/api/players/libraries`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Erreur API : ${response.status}`);
    }

    const payload = await response.json();

    // Accepte une liste directe ou une réponse contenant la clé "players".
    const apiPlayers = Array.isArray(payload)
        ? payload
        : (
            Array.isArray(payload.players)
                ? payload.players
                : []
        );

    return apiPlayers.map(mapApiPlayer);
}

/**
 * Charge les profils et ludothèques depuis la base de données.
 */
async function loadPlayerLibraries(page, requestedSlug = null) {
    try {
        players = await fetchPlayerLibraries();

        // Sur la page de recherche, affiche l'invitation à rechercher.
        const resultsContainer = page.querySelector('.players-results');

        if (resultsContainer) {
            hasSearched = false;
            refreshPlayersPage(resultsContainer);
            return;
        }

        // Sur une page de profil, recherche le joueur demandé.
        const profileContainer = page.querySelector(
            '[data-profile-container]'
        );

        if (!profileContainer) {
            return;
        }

        const player = players.find(
            (item) => item.slug === requestedSlug
        );

        profileContainer.replaceChildren();

        if (!player) {
            profileContainer.append(createPlayerNotFoundPage());
            return;
        }

        profileContainer.append(createPlayerProfile(player));
    } catch (error) {
        console.error(
            'Impossible de récupérer les profils des joueurs.',
            error
        );

        const resultsContainer = page.querySelector('.players-results');

        if (resultsContainer) {
            showPlayersLoadError(resultsContainer);
            return;
        }

        const profileContainer = page.querySelector(
            '[data-profile-container]'
        );

        if (profileContainer) {
            profileContainer.replaceChildren(
                createPlayerNotFoundPage()
            );
        }
    }
}

/**
 * Affiche un message si l'API ne peut pas fournir les profils.
 */
function showPlayersLoadError(container) {
    const list = container.querySelector('[data-results-list]');
    const count = container.querySelector('.players-results-count');

    if (count) {
        count.textContent = '(indisponible)';
    }

    if (list) {
        const message = document.createElement('p');
        message.classList.add('players-load-error');
        message.textContent =
            'Impossible de charger les joueurs. Vérifie ta connexion puis réessaie.';

        list.replaceChildren(message);
    }

    container.querySelector('.players-desktop-profile')?.remove();
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

    // Charge les profils et ludothèques depuis Symfony.
    loadPlayerLibraries(page);

    return page;
}

/**
 * Crée la page de profil d'un joueur.
 */
export function createPlayerProfilePage(slug) {
    const page = document.createElement('main');
    page.classList.add('player-profile-page');

    const backLink = document.createElement('a');
    backLink.href = '/joueurs';
    backLink.classList.add('player-profile-back');
    backLink.textContent = 'Retour aux résultats';

    backLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/joueurs');
    });

    const profileContainer = document.createElement('div');
    profileContainer.dataset.profileContainer = 'true';

    const loadingMessage = document.createElement('p');
    loadingMessage.textContent = 'Chargement du profil...';

    profileContainer.append(loadingMessage);

    page.append(
        backLink,
        profileContainer
    );

    // Le profil est recherché à partir des données de l'API.
    loadPlayerLibraries(page, slug);

    return page;
}

/* ========================================
   Hero
   ======================================== */

function createPlayersHero() {
    const section = document.createElement('section');
    section.classList.add('players-hero');

    const content = document.createElement('div');
    content.classList.add('players-hero-content');

    const title = document.createElement('h1');

    const firstLine = document.createElement('span');
    firstLine.textContent = 'Rechercher des';

    const secondLine = document.createElement('span');
    secondLine.classList.add('heading-highlight');
    secondLine.textContent = 'joueurs';

    title.append(
        firstLine,
        secondLine
    );

    const description = document.createElement('p');
    description.textContent =
        'Trouve des joueurs qui possèdent ou connaissent les règles du jeu que tu aimes';

    content.append(
        title,
        description
    );

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('players-hero-image');

    const image = document.createElement('img');
    image.src = ludothequeImage;
    image.alt = 'Ludothèque contenant des jeux de société';

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
    const section = document.createElement('section');
    section.classList.add('players-content');

    const searchPanel = createSearchPanel();
    const resultsPanel = createResultsPanel();

    section.append(
        searchPanel,
        resultsPanel
    );

    return section;
}

/* ========================================
   Utilitaires du menu déroulant des jeux
   ======================================== */

/**
 * Retire les accents et met en minuscules.
 */
function normalizeText(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/**
 * Retourne la liste totale des jeux sans doublons,
 * construite à partir des ludothèques des joueurs.
 */
function getAllGames() {
    const names = new Set();

    players.forEach((player) => {
        player.library.forEach((game) => {
            names.add(game.name);
        });
    });

    return Array.from(names).sort((a, b) =>
        a.localeCompare(b, 'fr')
    );
}

/* ========================================
   Recherche
   ======================================== */

function createSearchPanel() {
    const panel = document.createElement('div');
    panel.classList.add('players-search-panel');

    /* -------------------------------------
       Recherche par jeu
       ------------------------------------- */

    const gameField = document.createElement('div');
    gameField.classList.add('players-search-field');

    const gameLabel = document.createElement('label');
    gameLabel.textContent = 'Jeu';

    const gameInputContainer = document.createElement('div');
    gameInputContainer.classList.add('players-search-input');

    const icon = document.createElement('i');
    icon.classList.add(
        'bi',
        'bi-search'
    );
    icon.setAttribute('aria-hidden', 'true');

    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Rechercher un jeu...';
    input.setAttribute(
        'aria-label',
        'Rechercher un jeu'
    );
    input.setAttribute(
        'autocomplete',
        'off'
    );

    gameInputContainer.append(
        icon,
        input
    );

    // Liste déroulante des suggestions de jeux.
    const suggestions = document.createElement('ul');
    suggestions.classList.add('players-search-suggestions');
    suggestions.setAttribute('role', 'listbox');
    suggestions.hidden = true;

    gameField.append(
        gameLabel,
        gameInputContainer,
        suggestions
    );

    /* -------------------------------------
       Recherche par département
       ------------------------------------- */

    const departmentField = document.createElement('div');
    departmentField.classList.add('players-search-field');

    const departmentLabel = document.createElement('label');
    departmentLabel.textContent = 'Département';

    const select = document.createElement('select');
    select.setAttribute(
        'aria-label',
        'Choisir un département'
    );

    // Liste des départements français.
    const departments = [
        ['01', 'Ain'],
        ['02', 'Aisne'],
        ['03', 'Allier'],
        ['04', 'Alpes-de-Haute-Provence'],
        ['05', 'Hautes-Alpes'],
        ['06', 'Alpes-Maritimes'],
        ['07', 'Ardèche'],
        ['08', 'Ardennes'],
        ['09', 'Ariège'],
        ['10', 'Aube'],
        ['11', 'Aude'],
        ['12', 'Aveyron'],
        ['13', 'Bouches-du-Rhône'],
        ['14', 'Calvados'],
        ['15', 'Cantal'],
        ['16', 'Charente'],
        ['17', 'Charente-Maritime'],
        ['18', 'Cher'],
        ['19', 'Corrèze'],
        ['2A', 'Corse-du-Sud'],
        ['2B', 'Haute-Corse'],
        ['21', "Côte-d'Or"],
        ['22', "Côtes-d'Armor"],
        ['23', 'Creuse'],
        ['24', 'Dordogne'],
        ['25', 'Doubs'],
        ['26', 'Drôme'],
        ['27', 'Eure'],
        ['28', 'Eure-et-Loir'],
        ['29', 'Finistère'],
        ['30', 'Gard'],
        ['31', 'Haute-Garonne'],
        ['32', 'Gers'],
        ['33', 'Gironde'],
        ['34', 'Hérault'],
        ['35', 'Ille-et-Vilaine'],
        ['36', 'Indre'],
        ['37', 'Indre-et-Loire'],
        ['38', 'Isère'],
        ['39', 'Jura'],
        ['40', 'Landes'],
        ['41', 'Loir-et-Cher'],
        ['42', 'Loire'],
        ['43', 'Haute-Loire'],
        ['44', 'Loire-Atlantique'],
        ['45', 'Loiret'],
        ['46', 'Lot'],
        ['47', 'Lot-et-Garonne'],
        ['48', 'Lozère'],
        ['49', 'Maine-et-Loire'],
        ['50', 'Manche'],
        ['51', 'Marne'],
        ['52', 'Haute-Marne'],
        ['53', 'Mayenne'],
        ['54', 'Meurthe-et-Moselle'],
        ['55', 'Meuse'],
        ['56', 'Morbihan'],
        ['57', 'Moselle'],
        ['58', 'Nièvre'],
        ['59', 'Nord'],
        ['60', 'Oise'],
        ['61', 'Orne'],
        ['62', 'Pas-de-Calais'],
        ['63', 'Puy-de-Dôme'],
        ['64', 'Pyrénées-Atlantiques'],
        ['65', 'Hautes-Pyrénées'],
        ['66', 'Pyrénées-Orientales'],
        ['67', 'Bas-Rhin'],
        ['68', 'Haut-Rhin'],
        ['69', 'Rhône'],
        ['70', 'Haute-Saône'],
        ['71', 'Saône-et-Loire'],
        ['72', 'Sarthe'],
        ['73', 'Savoie'],
        ['74', 'Haute-Savoie'],
        ['75', 'Paris'],
        ['76', 'Seine-Maritime'],
        ['77', 'Seine-et-Marne'],
        ['78', 'Yvelines'],
        ['79', 'Deux-Sèvres'],
        ['80', 'Somme'],
        ['81', 'Tarn'],
        ['82', 'Tarn-et-Garonne'],
        ['83', 'Var'],
        ['84', 'Vaucluse'],
        ['85', 'Vendée'],
        ['86', 'Vienne'],
        ['87', 'Haute-Vienne'],
        ['88', 'Vosges'],
        ['89', 'Yonne'],
        ['90', 'Territoire de Belfort'],
        ['91', 'Essonne'],
        ['92', 'Hauts-de-Seine'],
        ['93', 'Seine-Saint-Denis'],
        ['94', 'Val-de-Marne'],
        ['95', "Val-d'Oise"],
        ['971', 'Guadeloupe'],
        ['972', 'Martinique'],
        ['973', 'Guyane'],
        ['974', 'La Réunion'],
        ['976', 'Mayotte']
    ];

    // Ajoute l'option de recherche par défaut.
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choisir un département';

    select.append(defaultOption);

    // Ajoute chaque département au menu déroulant.
    departments.forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${code} - ${name}`;

        select.append(option);
    });

    departmentField.append(
        departmentLabel,
        select
    );

    /* -------------------------------------
       Menu déroulant des jeux
       ------------------------------------- */

    let activeIndex = -1;

    function closeSuggestions() {
        suggestions.hidden = true;
        suggestions.replaceChildren();
        activeIndex = -1;
    }

    function setActiveSuggestion(index) {
        Array.from(suggestions.children).forEach(
            (item, i) => {
                item.classList.toggle(
                    'is-active',
                    i === index
                );
            }
        );

        activeIndex = index;
    }

    function selectSuggestion(gameName) {
        input.value = gameName;
        closeSuggestions();
    }

    function updateSuggestions() {
        const query = normalizeText(input.value);

        if (query === '') {
            closeSuggestions();
            return;
        }

        const matches = getAllGames().filter(
            (name) => normalizeText(name).startsWith(query)
        );

        suggestions.replaceChildren();
        activeIndex = -1;

        if (matches.length === 0) {
            suggestions.hidden = true;
            return;
        }

        matches.forEach((name) => {
            const item = document.createElement('li');
            item.setAttribute('role', 'option');
            item.textContent = name;

            // mousedown intervient avant le blur de l'input.
            item.addEventListener('mousedown', (event) => {
                event.preventDefault();
                selectSuggestion(name);
            });

            suggestions.append(item);
        });

        suggestions.hidden = false;
    }

    input.addEventListener('input', updateSuggestions);
    input.addEventListener('focus', updateSuggestions);
    input.addEventListener('blur', closeSuggestions);

    input.addEventListener('keydown', (event) => {
        const items = suggestions.children;

        if (
            suggestions.hidden
            || items.length === 0
        ) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();

            setActiveSuggestion(
                (activeIndex + 1) % items.length
            );
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();

            setActiveSuggestion(
                (activeIndex - 1 + items.length) % items.length
            );
        } else if (
            event.key === 'Enter'
            && activeIndex >= 0
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            selectSuggestion(
                items[activeIndex].textContent
            );
        } else if (event.key === 'Escape') {
            closeSuggestions();
        }
    });

    /* -------------------------------------
       Bouton de recherche
       ------------------------------------- */

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('players-search-button');
    button.textContent = 'Rechercher';

    button.addEventListener('click', () => {
        closeSuggestions();

        filterPlayers(
            input.value.trim(),
            select.value
        );
    });

    // Permet également de lancer la recherche avec la touche Entrée.
    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        closeSuggestions();

        filterPlayers(
            input.value.trim(),
            select.value
        );
    });

    select.addEventListener('change', () => {
        // N'effectue une recherche que si les deux critères sont renseignés.
        if (input.value.trim() && select.value) {
            filterPlayers(
                input.value.trim(),
                select.value
            );
        }
    });

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
    const container = document.createElement('div');
    container.classList.add('players-results');

    const heading = document.createElement('h2');

    const title = document.createElement('span');
    title.textContent = 'Résultats';

    const count = document.createElement('span');
    count.classList.add('players-results-count');
    count.textContent = '';

    heading.append(
        title,
        count
    );

    const list = document.createElement('div');
    list.classList.add('players-results-list');
    list.dataset.resultsList = 'true';

    const loadingMessage = document.createElement('p');
    loadingMessage.textContent =
        'Chargement des jeux disponibles...';

    list.append(loadingMessage);

    container.append(
        heading,
        list
    );

    return container;
}

/**
 * Actualise les résultats après le chargement des données de l'API
 * ou après une recherche.
 */
function refreshPlayersPage(container) {
    const list = container.querySelector('[data-results-list]');
    const count = container.querySelector('.players-results-count');

    if (!list || !count) {
        return;
    }

    // Efface les résultats précédents.
    list.replaceChildren();

    // Aucun profil n'est affiché avant une recherche valide.
    if (!hasSearched) {
        count.textContent = '';

        const message = document.createElement('p');
        message.textContent =
            'Choisis un jeu et un département pour rechercher des joueurs.';

        list.append(message);

        container.querySelector('.players-desktop-profile')?.remove();

        return;
    }

    // Met à jour le nombre de joueurs trouvés.
    count.textContent =
        `(${filteredPlayers.length} joueurs disponibles)`;

    // Affiche un message si aucun joueur ne correspond.
    if (filteredPlayers.length === 0) {
        list.append(createEmptyResults());

        container.querySelector('.players-desktop-profile')?.remove();

        return;
    }

    // Affiche uniquement les joueurs correspondant aux critères.
    filteredPlayers.forEach((player, index) => {
        list.append(
            createPlayerResult(
                player,
                index === 0,
                (selectedPlayer) => selectPlayer(selectedPlayer, container)
            )
        );
    });

    // Affiche le profil du premier résultat par défaut.
    const currentProfile = container.querySelector(
        '.players-desktop-profile'
    );

    const newProfile = createPlayerProfile(filteredPlayers[0]);
    newProfile.classList.add('players-desktop-profile');

    if (currentProfile) {
        currentProfile.replaceWith(newProfile);
    } else {
        container.append(newProfile);
    }
}

/* ========================================
   Sélection d'un joueur
   ======================================== */

function selectPlayer(player, container) {
    const results = container.querySelectorAll('.player-result');

    results.forEach((result) => {
        result.classList.remove('is-selected');
    });

    const selectedResult = Array.from(results).find(
        (result) =>
            result.getAttribute('href') === `/joueurs/${player.slug}`
    );

    if (selectedResult) {
        selectedResult.classList.add('is-selected');
    }

    const currentProfile = container.querySelector(
        '.players-desktop-profile'
    );

    if (!currentProfile) {
        return;
    }

    const newProfile = createPlayerProfile(player);
    newProfile.classList.add('players-desktop-profile');

    currentProfile.replaceWith(newProfile);
}

/* ========================================
   Profil joueur
   ======================================== */

function createPlayerProfile(player) {
    const profile = document.createElement('article');
    profile.classList.add('player-profile');
    profile.dataset.playerSlug = player.slug;

    const header = document.createElement('div');
    header.classList.add('player-profile-header');

    /* -------------------------------------
       Photo
       ------------------------------------- */

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('player-profile-image');

    const image = document.createElement('img');
    image.src = player.image || `${API_URL}/images/meeple-default.png`;
    image.alt = `Photo de profil de ${player.name}`;

    // Utilise la photo par défaut si l'image demandée est introuvable.
    image.addEventListener('error', () => {
        if (!image.src.endsWith('/images/meeple-default.png')) {
            image.src = `${API_URL}/images/meeple-default.png`;
        }
    }, { once: true });

    imageContainer.append(image);

    /* -------------------------------------
       Informations
       ------------------------------------- */

    const information = document.createElement('div');
    information.classList.add('player-profile-information');

    const name = document.createElement('h1');
    name.textContent = player.name;

    const age = createProfileInformation(
        'bi-person',
        player.age === null
            ? 'Âge non renseigné'
            : `${player.age} ans`
    );

    const city = createProfileInformation(
        'bi-geo-alt',
        player.city
    );

    information.append(
        name,
        age,
        city
    );

    /* -------------------------------------
       Actions
       ------------------------------------- */

    const actions = document.createElement('div');
    actions.classList.add('player-profile-actions');

    const messageButton = document.createElement('button');
    messageButton.type = 'button';
    messageButton.classList.add('player-profile-message');
    messageButton.textContent = 'Envoyer un message';

    const libraryButton = document.createElement('button');
    libraryButton.type = 'button';
    libraryButton.classList.add('player-profile-library');
    libraryButton.textContent = 'Voir la ludothèque';

    // Les actions sont reliées aux pages correspondantes.
    // Crée une conversation avec ce joueur ou ouvre celle qui existe déjà.
    messageButton.addEventListener('click', async () => {
        const playerId = Number(player.id);

        if (!Number.isInteger(playerId) || playerId <= 0) {
            showMessagingError('Impossible d’identifier ce joueur.');
            return;
        }

        messageButton.disabled = true;
        messageButton.textContent = 'Ouverture...';

        try {
            let conversation;

            try {
                conversation = await createConversation(playerId);
            } catch (error) {
                // Une conversation existante est signalée par l'API avec HTTP 409.
                if (error.status === 409 && error.data?.conversationId) {
                    conversation = { id: error.data.conversationId };
                } else {
                    throw error;
                }
            }

            const conversationId = Number(
                conversation?.id ?? conversation?.conversationId
            );

            if (!Number.isInteger(conversationId) || conversationId <= 0) {
                throw new Error(
                    'Le serveur n’a pas retourné un identifiant de conversation valide.'
                );
            }

            navigateTo(`/discussions/${conversationId}`);
        } catch (error) {
            console.error(
                'Impossible d’ouvrir une conversation avec ce joueur.',
                error
            );

            showMessagingError(
                error.message || 'Impossible d’ouvrir cette conversation. Réessaie.'
            );
        } finally {
            messageButton.disabled = false;
            messageButton.textContent = 'Envoyer un message';
        }
    });

    libraryButton.addEventListener('click', () => {
        navigateTo(`/joueurs/${player.slug}/ludotheque`);
    });

    actions.append(
        messageButton,
        libraryButton
    );

    header.append(
        imageContainer,
        information,
        actions
    );

    /* -------------------------------------
       Corps du profil
       ------------------------------------- */

    const body = document.createElement('div');
    body.classList.add('player-profile-body');

    const about = createAboutSection(player);
    const library = createLibrarySection(player);

    // Place les statistiques juste sous la description du joueur.
    const statistics = createProfileStatistics(player);
    statistics.style.marginTop = '12px';
    about.append(statistics);

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
    const section = document.createElement('section');
    section.classList.add('player-profile-about');

    const title = document.createElement('h2');
    title.textContent = 'À propos';

    const description = document.createElement('p');
    description.textContent = player.description;

    section.append(
        title,
        description
    );

    return section;
}

// Construit un slug de secours si l'API ne fournit pas celui du jeu.
function createGameSlug(name, id) {
    const normalizedName = String(name || 'jeu')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return id != null
        ? `${normalizedName || 'jeu'}-${id}`
        : (normalizedName || 'jeu');
}

/* ========================================
   Ludothèque
   ======================================== */

function createLibrarySection(player) {
    const section = document.createElement('section');
    section.classList.add('player-profile-library-section');

    const heading = document.createElement('div');
    heading.classList.add('player-profile-library-heading');

    const title = document.createElement('h2');
    title.textContent = 'Sa ludothèque';

    const link = document.createElement('a');
    link.href = `/joueurs/${player.slug}/ludotheque`;
    link.textContent = 'Voir toute sa ludothèque';

    link.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(`/joueurs/${player.slug}/ludotheque`);
    });

    const arrow = document.createElement('i');
    arrow.classList.add(
        'bi',
        'bi-arrow-right'
    );
    arrow.setAttribute('aria-hidden', 'true');

    link.append(arrow);

    heading.append(
        title,
        link
    );

    /* -------------------------------------
       Jeux
       ------------------------------------- */

    const games = document.createElement('div');
    games.classList.add('player-profile-games');

    player.library
        .slice(0, 6)
        .forEach((game) => {
            // Adapte les données au format attendu par la carte commune.
            const playersCount = game.minPlayers != null && game.maxPlayers != null
                ? (
                    game.minPlayers === game.maxPlayers
                        ? `${game.minPlayers} joueur${game.minPlayers > 1 ? 's' : ''}`
                        : `${game.minPlayers}–${game.maxPlayers} joueurs`
                )
                : 'Nombre de joueurs non renseigné';

            const duration = game.duration
                ? `${game.duration} min`
                : 'Durée non renseignée';

            const gameSlug = game.slug || createGameSlug(game.name, game.id);

            const card = createGameCard({
                ...game,
                slug: gameSlug,
                image: getApiImageUrl(game.image),
                players: playersCount,
                duration
            });

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
    const statistics = document.createElement('div');
    statistics.classList.add('player-profile-statistics');

    const games = createStatistic(
        'bi-dice-5',
        `${player.games} jeux dans sa ludothèque`
    );

    const memberSince = createStatistic(
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

function createStatistic(iconName, text) {
    const statistic = document.createElement('p');

    const icon = document.createElement('i');
    icon.classList.add(
        'bi',
        iconName
    );
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = text;

    statistic.append(
        icon,
        label
    );

    return statistic;
}

function createProfileInformation(iconName, text) {
    const information = document.createElement('p');

    const icon = document.createElement('i');
    icon.classList.add(
        'bi',
        iconName
    );
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = text;

    information.append(
        icon,
        label
    );

    return information;
}

/* ========================================
   Filtre des joueurs
   ======================================== */

/**
 * Filtre les joueurs selon le jeu et le département sélectionnés.
 */
function filterPlayers(gameSearch, department) {
    const container = document.querySelector('.players-results');

    if (!container) {
        return;
    }

    const list = container.querySelector('[data-results-list]');

    if (!list) {
        return;
    }

    const normalizedGameSearch = normalizeText(gameSearch);

    // Une recherche nécessite obligatoirement un jeu et un département.
    if (!normalizedGameSearch || !department) {
        hasSearched = false;
        refreshPlayersPage(container);
        return;
    }

    // Indique qu'une recherche valide a été lancée.
    hasSearched = true;

    const departmentSelect = document.querySelector(
        '.players-search-panel select'
    );

    const selectedDepartmentText =
        departmentSelect?.selectedOptions[0]?.textContent || '';

    const selectedDepartmentCode =
        selectedDepartmentText.split(' - ')[0].trim();

    // Filtre les joueurs sur le jeu et le département sélectionnés.
    const filteredPlayers = players.filter((player) => {
        const playerDepartment = normalizeText(
            String(player.department || '')
        );

        const selectedDepartment = normalizeText(
            String(department)
        );

        // Vérifie le département du joueur.
        const matchesDepartment =
            playerDepartment === selectedDepartment
            || String(player.department) === selectedDepartmentCode;

        // Le joueur doit posséder le jeu ou en connaître les règles.
        const matchesGame = player.library.some((game) =>
            normalizeText(game.name).includes(normalizedGameSearch)
            && (game.owns || game.knowsRules)
        );

        return matchesDepartment && matchesGame;
    });

    // Met à jour les résultats et le profil affiché.
    updateFilteredPlayers(filteredPlayers, container);
}

/**
 * Met à jour la liste des joueurs après le filtrage.
 */
function updateFilteredPlayers(results, container) {
    const list = container.querySelector('[data-results-list]');
    const count = container.querySelector('.players-results-count');

    if (!list || !count) {
        return;
    }

    list.replaceChildren();

    count.textContent = `(${results.length} joueurs disponibles)`;

    if (results.length === 0) {
        list.append(createEmptyResults());

        container.querySelector('.players-desktop-profile')?.remove();

        return;
    }

    results.forEach((player, index) => {
        list.append(
            createPlayerResult(
                player,
                index === 0,
                (selectedPlayer) => selectPlayer(selectedPlayer, container)
            )
        );
    });

    const currentProfile = container.querySelector(
        '.players-desktop-profile'
    );

    const newProfile = createPlayerProfile(results[0]);
    newProfile.classList.add('players-desktop-profile');

    if (currentProfile) {
        currentProfile.replaceWith(newProfile);
    } else {
        container.append(newProfile);
    }
}

/**
 * Crée le message affiché lorsqu'aucun joueur ne correspond à la recherche.
 */
function createEmptyResults() {
    const empty = document.createElement('div');
    empty.classList.add('players-empty-results');

    const icon = document.createElement('i');
    icon.classList.add(
        'bi',
        'bi-search'
    );
    icon.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h3');
    title.textContent = 'Aucun joueur trouvé';

    const description = document.createElement('p');
    description.textContent =
        'Essaie avec un autre jeu ou un autre département.';

    empty.append(
        icon,
        title,
        description
    );

    return empty;
}

/* ========================================
   Joueur introuvable
   ======================================== */

function createPlayerNotFoundPage() {
    const page = document.createElement('main');
    page.classList.add('player-not-found');

    const title = document.createElement('h1');
    title.textContent = 'Joueur introuvable';

    const link = document.createElement('a');
    link.href = '/joueurs';
    link.textContent = 'Retour aux joueurs';

    link.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/joueurs');
    });

    page.append(
        title,
        link
    );

    return page;
}