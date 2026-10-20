// Gère les appels à l'API publique des jeux

const API_URL = '/api';

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

    // Retire le suffixe numérique final présent dans certaines URL.
    const normalizedSlug = slug.replace(/-\d+$/, '');

    const game = games.find(
        (item) => item.slug === normalizedSlug
    );

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
 * Normalise le chemin d'image retourné par l'API.
 */
function createImageUrl(image) {
    if (!image) {
        return '';
    }

    // Conserve les URL absolues déjà fournies par l'API.
    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }

    // Les chemins relatifs à la racine fonctionnent en développement
    // comme dans Docker, puisque le frontend et l'API partagent l'origine.
    return image.startsWith('/') ? image : `/${image}`;
}