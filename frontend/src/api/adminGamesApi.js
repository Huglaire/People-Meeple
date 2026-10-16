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
 *
 * @param {Object} gameData Données du jeu, avec éventuellement imageFile.
 */
export async function createAdminGame(gameData) {
    const formData = createGameFormData(gameData);

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(
            getErrorMessage(data, 'Impossible d’ajouter le jeu.')
        );
    }

    return data;
}

/**
 * Modifie un jeu existant.
 *
 * L'envoi utilise POST pour permettre à PHP de recevoir correctement
 * les fichiers multipart/form-data. Le backend devra accepter POST
 * sur la route /api/admin/games/{id}, en complément de PATCH.
 *
 * @param {number|string} id Identifiant du jeu.
 * @param {Object} gameData Données à modifier, avec éventuellement imageFile.
 */
export async function updateAdminGame(id, gameData) {
    const formData = createGameFormData(gameData);

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(
            getErrorMessage(data, 'Impossible de modifier le jeu.')
        );
    }

    return data;
}

/**
 * Désactive un jeu sans le supprimer de la base de données.
 *
 * @param {number|string} id Identifiant du jeu.
 */
export async function deactivateAdminGame(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(
            getErrorMessage(data, 'Impossible de désactiver le jeu.')
        );
    }

    return data;
}

/**
 * Réactive un jeu désactivé.
 *
 * @param {number|string} id Identifiant du jeu.
 */
export async function reactivateAdminGame(id) {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new Error(
            getErrorMessage(data, 'Impossible de réactiver le jeu.')
        );
    }

    return data;
}

/**
 * Prépare les données du jeu pour un envoi multipart/form-data.
 *
 * @param {Object} gameData Données du jeu.
 * @returns {FormData}
 */
function createGameFormData(gameData) {
    const formData = new FormData();

    const fields = [
        'name',
        'description',
        'publisher',
        'minPlayers',
        'maxPlayers',
        'minimumAge',
        'duration',
        'isActive'
    ];

    for (const field of fields) {
        if (
            Object.prototype.hasOwnProperty.call(gameData, field)
            && gameData[field] !== undefined
            && gameData[field] !== null
        ) {
            formData.append(field, String(gameData[field]));
        }
    }

    // Ajoute la photo uniquement si un nouveau fichier a été sélectionné.
    if (gameData.imageFile instanceof File) {
        formData.append('imageFile', gameData.imageFile);
    } else if (
        typeof gameData.image === 'string'
        && gameData.image.trim() !== ''
    ) {
        // Conserve le chemin existant lorsqu'aucune nouvelle photo n'est choisie.
        formData.append('image', gameData.image.trim());
    }

    return formData;
}

/**
 * Prépare les en-têtes d'authentification.
 *
 * Ne pas définir Content-Type ici : le navigateur doit générer
 * automatiquement la frontière multipart/form-data.
 *
 * @returns {Object}
 */
function getAuthHeaders() {
    const token = getToken();

    if (!token) {
        throw new Error(
            'Votre session a expiré. Veuillez vous reconnecter.'
        );
    }

    return {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
    };
}

/**
 * Lit la réponse de l'API sans échouer si le corps est vide ou invalide.
 *
 * @param {Response} response Réponse HTTP.
 * @returns {Promise<Object|Array>}
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

/**
 * Extrait un message d'erreur exploitable depuis la réponse API.
 *
 * @param {Object} data Données reçues.
 * @param {string} fallback Message par défaut.
 * @returns {string}
 */
function getErrorMessage(data, fallback) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.join(' ');
    }

    return data.message || fallback;
}