// Gère les appels à l'API d'administration du catalogue des jeux

import { getToken } from '../services/authService.js';

const API_URL = 'http://127.0.0.1:8000/api/admin/games';

/**
 * Récupère tous les jeux, actifs et désactivés.
 */
export async function getAdminGames() {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(
            data.message || 'Impossible de récupérer le catalogue des jeux.'
        );
    }

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.games)) {
        return data.games;
    }

    return [];
}

/**
 * Ajoute un jeu au catalogue.
 */
export async function createAdminGame(gameData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(gameData)
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(data.message || 'Impossible d’ajouter ce jeu.');
    }

    return data;
}

/**
 * Modifie les informations d'un jeu existant.
 */
export async function updateAdminGame(id, gameData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(gameData)
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(data.message || 'Impossible de modifier ce jeu.');
    }

    return data;
}

/**
 * Désactive un jeu sans le supprimer de la base de données.
 */
export async function deactivateAdminGame(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(data.message || 'Impossible de désactiver ce jeu.');
    }

    return data;
}

/**
 * Réactive un jeu précédemment désactivé.
 */
export async function reactivateAdminGame(id) {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(data.message || 'Impossible de réactiver ce jeu.');
    }

    return data;
}

/**
 * Prépare les en-têtes des requêtes authentifiées.
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
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
    };
}

/**
 * Lit la réponse JSON, y compris si elle est vide ou non JSON.
 */
async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        return {};
    }

    try {
        return await response.json();
    } catch {
        return {};
    }
}