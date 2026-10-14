
// Crée la page complète de la ludothèque d'un joueur.

import { navigateTo } from '../router/router.js';

import '../css/player-library.css';

const API_URL = 'http://127.0.0.1:8000';

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

// Intercepte les liens et boutons de ludothèque des profils.
document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    const trigger = target.closest(
        '.player-profile-library-heading a, .player-profile-library'
    );

    if (!trigger) {
        return;
    }

    const profile = trigger.closest('.player-profile');
    const slug = profile?.dataset.playerSlug;

    if (!slug) {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    navigateTo(`/joueurs/${slug}/ludotheque`);
}, true);

/**
 * Construit la page dédiée à la ludothèque d'un joueur.
 */
export function createPlayerLibraryPage(slug) {
    const page = document.createElement('main');
    page.classList.add('player-library-page');

    const container = document.createElement('div');
    container.classList.add('player-library-container');

    const backLink = document.createElement('a');
    backLink.classList.add('player-library-back');
    backLink.href = `/joueurs/${slug}`;
    backLink.textContent = 'Retour au profil';

    backLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(`/joueurs/${slug}`);
    });

    const heading = document.createElement('header');
    heading.classList.add('player-library-header');

    const eyebrow = document.createElement('p');
    eyebrow.classList.add('player-library-eyebrow');
    eyebrow.textContent = 'PEOPLE MEEPLE';

    const title = document.createElement('h1');
    title.textContent = 'La ludothèque de ce joueur';

    const introduction = document.createElement('p');
    introduction.classList.add('player-library-introduction');
    introduction.textContent =
        'Découvre les jeux que ce joueur possède ou dont il connaît les règles.';

    const count = document.createElement('p');
    count.classList.add('player-library-count');
    count.textContent = 'Chargement des jeux…';

    const searchContainer = document.createElement('label');
    searchContainer.classList.add('player-library-search');

    const searchIcon = document.createElement('i');
    searchIcon.classList.add('bi', 'bi-search');
    searchIcon.setAttribute('aria-hidden', 'true');

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Rechercher dans cette ludothèque…';
    searchInput.setAttribute(
        'aria-label',
        'Rechercher un jeu dans cette ludothèque'
    );

    searchContainer.append(searchIcon, searchInput);
    heading.append(eyebrow, title, introduction, count, searchContainer);

    const status = document.createElement('p');
    status.classList.add('player-library-status');
    status.textContent = 'Chargement des jeux…';

    const grid = document.createElement('div');
    grid.classList.add('player-library-grid');
    grid.setAttribute('aria-live', 'polite');

    container.append(backLink, heading, status, grid);
    page.append(container);

    loadLibrary(slug, title, count, status, grid, searchInput);

    return page;
}

/**
 * Récupère les ludothèques et affiche les jeux du joueur demandé.
 */
async function loadLibrary(
    slug,
    title,
    count,
    status,
    grid,
    searchInput
) {
    const token = localStorage.getItem('token');

    if (!token) {
        status.textContent =
            'Connecte-toi pour consulter les ludothèques des joueurs.';
        count.textContent = '';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/players/libraries`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur API : ${response.status}`);
        }

        const payload = await response.json();

        // Accepte une liste directe ou une réponse contenant la clé players.
        const apiPlayers = Array.isArray(payload)
            ? payload
            : (
                Array.isArray(payload.players)
                    ? payload.players
                    : []
            );

        // Recherche le joueur à partir de son pseudo et de son identifiant.
        const player = apiPlayers.find((item) => {
            return createPlayerSlug(item.pseudo, item.id) === slug;
        });

        if (!player) {
            title.textContent = 'Ludothèque introuvable';
            count.textContent = '';
            status.textContent =
                'La ludothèque de ce joueur est introuvable.';
            return;
        }

        // Affiche le pseudo réel du joueur.
        title.textContent = `La ludothèque de ${player.pseudo || 'ce joueur'}`;

        const games = Array.isArray(player.library)
            ? player.library
            : [];

        count.textContent =
            `${games.length} jeu${games.length > 1 ? 'x' : ''}`;

        status.textContent = games.length
            ? ''
            : 'Cette ludothèque ne contient pas encore de jeu.';

        renderGames(games, grid, searchInput.value);

        // Actualise les jeux selon le texte saisi.
        searchInput.addEventListener('input', () => {
            renderGames(games, grid, searchInput.value);
        });
    } catch (error) {
        console.error(
            'Impossible de charger cette ludothèque.',
            error
        );

        count.textContent = '';
        status.textContent =
            'Impossible de charger cette ludothèque pour le moment. Vérifie que le serveur est démarré puis réessaie.';
    }
}

/**
 * Affiche les cartes de jeux dans l'ordre alphabétique
 * et applique le filtre de recherche.
 */
function renderGames(games, grid, search) {
    grid.replaceChildren();

    // Ignore la casse et les accents lors de la recherche.
    const normalizeText = (value) => {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('fr')
            .trim();
    };

    const normalizedSearch = normalizeText(search);

    // Trie les jeux par ordre alphabétique.
    const sortedGames = [...games].sort((gameA, gameB) => {
        return String(gameA.name || '').localeCompare(
            String(gameB.name || ''),
            'fr',
            { sensitivity: 'base' }
        );
    });

    // Filtre les jeux après le tri alphabétique.
    const filteredGames = sortedGames.filter((game) => {
        return normalizeText(game.name).includes(normalizedSearch);
    });

    if (filteredGames.length === 0) {
        const empty = document.createElement('div');
        empty.classList.add('player-library-empty');

        const title = document.createElement('h2');
        title.textContent = games.length
            ? 'Aucun jeu trouvé'
            : 'Ludothèque vide';

        const message = document.createElement('p');
        message.textContent = games.length
            ? 'Essaie avec un autre nom de jeu.'
            : 'Les jeux ajoutés par ce joueur apparaîtront ici.';

        empty.append(title, message);
        grid.append(empty);
        return;
    }

    filteredGames.forEach((game) => {
        grid.append(createGameCard(game));
    });
}

/**
 * Crée une carte de jeu avec ses caractéristiques et son statut.
 */
function createGameCard(game) {
    const card = document.createElement('article');
    card.classList.add('player-library-game-card');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('player-library-game-image');

    const image = document.createElement('img');
    image.src = getGameImage(game.image);
    image.alt = `Boîte du jeu ${game.name || ''}`;
    image.loading = 'lazy';

    // Masque l'image si elle ne peut pas être chargée.
    image.addEventListener('error', () => {
        image.removeAttribute('src');
        image.alt = 'Image du jeu indisponible';
    }, { once: true });

    imageContainer.append(image);

    const content = document.createElement('div');
    content.classList.add('player-library-game-content');

    const title = document.createElement('h2');
    title.textContent = game.name || 'Jeu de société';

    const details = document.createElement('div');
    details.classList.add('player-library-game-details');

    // Affiche le nombre de joueurs prévu pour le jeu.
    if (game.minPlayers != null && game.maxPlayers != null) {
        const players = document.createElement('span');

        const icon = document.createElement('i');
        icon.classList.add('bi', 'bi-people');
        icon.setAttribute('aria-hidden', 'true');

        const text = document.createElement('span');
        text.textContent = game.minPlayers === game.maxPlayers
            ? `${game.minPlayers} joueur${game.minPlayers > 1 ? 's' : ''}`
            : `${game.minPlayers}–${game.maxPlayers} joueurs`;

        players.append(icon, text);
        details.append(players);
    }

    // Affiche la durée moyenne d'une partie.
    if (game.duration) {
        const duration = document.createElement('span');

        const icon = document.createElement('i');
        icon.classList.add('bi', 'bi-clock');
        icon.setAttribute('aria-hidden', 'true');

        const text = document.createElement('span');
        text.textContent = `${game.duration} min`;

        duration.append(icon, text);
        details.append(duration);
    }

    // Affiche un statut synthétique selon les informations de la ludothèque.
    const status = document.createElement('p');
    status.classList.add('player-library-game-status');

    const statusIcon = document.createElement('i');
    statusIcon.setAttribute('aria-hidden', 'true');

    const owns = game.owns === true;
    const knowsRules = game.knowsRules === true;

    if (owns && knowsRules) {
        status.classList.add('is-owned-and-known');
        statusIcon.classList.add('bi', 'bi-check-circle-fill');

        status.append(
            statusIcon,
            document.createTextNode(
                'Possède le jeu et connaît les règles'
            )
        );
    } else if (owns) {
        status.classList.add('is-owned');
        statusIcon.classList.add('bi', 'bi-box-seam');

        status.append(
            statusIcon,
            document.createTextNode('Possède le jeu')
        );
    } else if (knowsRules) {
        status.classList.add('knows-rules');
        statusIcon.classList.add('bi', 'bi-book');

        status.append(
            statusIcon,
            document.createTextNode('Connaît les règles')
        );
    } else {
        // Signale que le statut n'est pas renseigné.
        status.classList.add('status-unknown');
        statusIcon.classList.add('bi', 'bi-question-circle');

        status.append(
            statusIcon,
            document.createTextNode('Statut non renseigné')
        );
    }

    content.append(title, details, status);
    card.append(imageContainer, content);

    return card;
}

/**
 * Accepte les URL complètes et les chemins d'images fournis par l'API.
 */
function getGameImage(image) {
    if (!image) {
        return '';
    }

    // Conserve les URL complètes.
    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    // Ajoute l'adresse du serveur aux chemins relatifs.
    return `${API_URL}${image.startsWith('/') ? '' : '/'}${image}`;
}
