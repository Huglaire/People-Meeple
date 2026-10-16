// Gère les appels à l'API d'administration des demandes d'ajout de jeux

import { getToken } from '../services/authService.js';

const API_URL = 'http://127.0.0.1:8000/api/admin/game-requests';

/**
 * Récupère la liste des demandes d'ajout de jeux.
 */
export async function getAdminGameRequests() {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Impossible de récupérer les demandes de jeux.'
        );
    }

    return data;
}

/**
 * Accepte une demande et crée le jeu correspondant.
 *
 * @param {number} id Identifiant de la demande.
 * @param {Object} gameData Données du jeu à créer.
 */
export async function acceptGameRequest(id, gameData) {
    const response = await fetch(`${API_URL}/${id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(gameData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Impossible d’accepter cette demande.'
        );
    }

    return data;
}

/**
 * Rejette une demande d'ajout de jeu.
 *
 * @param {number} id Identifiant de la demande.
 */
export async function rejectGameRequest(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            status: 'rejected'
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Impossible de rejeter cette demande.'
        );
    }

    return data;
}

/**
 * Prépare les en-têtes nécessaires aux appels protégés par JWT.
 */
function getAuthHeaders() {
    const token = getToken();

    if (!token) {
        throw new Error(
            'Vous devez être connecté pour accéder à cette fonctionnalité.'
        );
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}