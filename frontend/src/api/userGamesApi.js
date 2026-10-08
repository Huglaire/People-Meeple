// Gère les appels à l'API liés à la ludothèque de l'utilisateur

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Récupère la ludothèque de l'utilisateur connecté.
 */
export async function getMyGames(token) {
    const response = await fetch(`${API_URL}/me/games`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Impossible de récupérer votre ludothèque.'
        );
    }

    return data;
}

/**
 * Ajoute un jeu à la ludothèque de l'utilisateur.
 */
export async function addGameToLibrary(
    token,
    gameId,
    owns,
    knowsRules
) {
    const response = await fetch(`${API_URL}/me/games`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            gameId,
            owns,
            knowsRules
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Impossible d’ajouter ce jeu à votre ludothèque.'
        );
    }

    return data;
}

/**
 * Modifie les informations d'un jeu dans la ludothèque.
 */
export async function updateLibraryGame(
    token,
    gameId,
    userGameData
) {
    const response = await fetch(`${API_URL}/me/games/${gameId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userGameData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Impossible de modifier ce jeu dans votre ludothèque.'
        );
    }

    return data;
}

/**
 * Supprime un jeu de la ludothèque.
 */
export async function removeGameFromLibrary(token, gameId) {
    const response = await fetch(`${API_URL}/me/games/${gameId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Impossible de supprimer ce jeu de votre ludothèque.'
        );
    }

    return data;
}