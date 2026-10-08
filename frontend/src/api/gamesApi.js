// Gère les appels à l'API publique des jeux

const API_URL = 'http://127.0.0.1:8000/api';
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Récupère la liste des jeux actifs.
 */
export async function getGames() {
    const response = await fetch(`${API_URL}/games`);

    if (!response.ok) {
        throw new Error('Impossible de récupérer les jeux.');
    }

    const games = await response.json();

    return games.map(normalizeGame);
}

/**
 * Récupère un jeu à partir de son identifiant.
 */
export async function getGameById(id) {
    const response = await fetch(`${API_URL}/games/${id}`);

    if (!response.ok) {
        throw new Error('Jeu introuvable.');
    }

    const game = await response.json();

    return normalizeGame(game);
}

/**
 * Récupère un jeu à partir de son slug.
 *
 * L'API utilise l'identifiant numérique.
 * Le frontend conserve les URLs lisibles avec un slug.
 */
export async function getGameBySlug(slug) {
    const games = await getGames();

    const game = games.find((item) => item.slug === slug);

    if (!game) {
        throw new Error('Jeu introuvable.');
    }

    return getGameById(game.id);
}

/**
 * Prépare les données API pour le frontend.
 */
function normalizeGame(game) {
    return {
        ...game,
        slug: createSlug(game.name),
        players: `${game.minPlayers} à ${game.maxPlayers} joueurs`,
        duration: `${game.duration} min`,
        minimumAge: `${game.minimumAge} ans`,
        image: createImageUrl(game.image)
    };
}

/**
 * Crée un slug utilisable dans l'URL.
 */
function createSlug(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Transforme le chemin d'image retourné par l'API en URL complète.
 */
function createImageUrl(image) {
    if (!image) {
        return '';
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }

    return new URL(image, API_BASE_URL).href;
}