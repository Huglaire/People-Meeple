// Gère les appels à l'API des demandes de jeux

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Envoie une demande d'ajout de jeu.
 */
export async function createGameRequest(token, gameData) {
    const response = await fetch(`${API_URL}/game-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        },
        body: JSON.stringify({
            name: gameData.name.trim(),
            publisher: gameData.publisher.trim(),
            description: gameData.description.trim()
        })
    });

    // Lit la réponse JSON, y compris en cas d'erreur.
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || 'Impossible d’envoyer la demande.'
        );
    }

    return data;
}