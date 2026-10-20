// Gère les appels à l'API d'administration des demandes d'ajout de jeux

import { getToken } from '../services/authService.js';

const API_URL = '/api/admin/game-requests';

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
 * Les données du jeu et l'image éventuelle sont envoyées avec FormData.
 *
 * @param {number} id Identifiant de la demande.
 * @param {Object} gameData Données du jeu à créer.
 */
export async function acceptGameRequest(id, gameData) {
    const formData = new FormData();

    // Ajoute les informations textuelles du jeu.
    formData.append('name', String(gameData.name ?? ''));
    formData.append('publisher', String(gameData.publisher ?? ''));
    formData.append('description', String(gameData.description ?? ''));
    formData.append('minPlayers', String(gameData.minPlayers ?? ''));
    formData.append('maxPlayers', String(gameData.maxPlayers ?? ''));
    formData.append('minimumAge', String(gameData.minimumAge ?? ''));
    formData.append('duration', String(gameData.duration ?? ''));

    // Ajoute la photo uniquement si un fichier a été sélectionné.
    if (gameData.imageFile instanceof File && gameData.imageFile.size > 0) {
        formData.append('imageFile', gameData.imageFile);
    }

    const response = await fetch(`${API_URL}/${id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData
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
 *
 * @param {boolean} json Indique si le corps de la requête est au format JSON.
 */
function getAuthHeaders(json = true) {
    const token = getToken();

    if (!token) {
        throw new Error(
            'Vous devez être connecté pour accéder à cette fonctionnalité.'
        );
    }

    const headers = {
        'Authorization': `Bearer ${token}`
    };

    // Ne pas définir Content-Type pour FormData :
    // le navigateur ajoute automatiquement la boundary multipart.
    if (json) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}