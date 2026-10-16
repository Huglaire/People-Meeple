// Gère les appels à l'API d'administration des utilisateurs

import { getToken } from '../services/authService.js';

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Effectue une requête authentifiée vers l'API d'administration.
 */
async function adminUsersRequest(path, options = {}) {
    const token = getToken();

    if (!token) {
        throw new Error(
            'Votre session a expiré. Veuillez vous reconnecter.'
        );
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    // Récupère le message d'erreur éventuel renvoyé par Symfony.
    const responseText = await response.text();
    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(
                'Le serveur a renvoyé une réponse invalide.'
            );
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                'Votre session a expiré. Veuillez vous reconnecter.'
            );
        }

        if (response.status === 403) {
            throw new Error(
                'Accès refusé : cette action est réservée aux administrateurs.'
            );
        }

        throw new Error(
            data.message || 'Une erreur est survenue lors de la requête.'
        );
    }

    return data;
}

/**
 * Récupère la liste des utilisateurs avec recherche et filtre par statut.
 *
 * @param {Object} filters
 * @param {string} filters.search
 * @param {string} filters.status
 * @returns {Promise<Object>}
 */
export async function getAdminUsers({
    search = '',
    status = 'all'
} = {}) {
    const params = new URLSearchParams();

    if (search.trim() !== '') {
        params.set('search', search.trim());
    }

    params.set('status', status);

    const queryString = params.toString();

    return adminUsersRequest(
        `/admin/users?${queryString}`
    );
}

/**
 * Récupère les informations détaillées d'un utilisateur.
 *
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function getAdminUserById(id) {
    return adminUsersRequest(
        `/admin/users/${encodeURIComponent(id)}`
    );
}

/**
 * Active ou désactive un compte utilisateur.
 *
 * @param {number|string} id
 * @param {boolean} active
 * @returns {Promise<Object>}
 */
export async function updateAdminUserStatus(id, active) {
    if (typeof active !== 'boolean') {
        throw new Error(
            'Le statut du compte doit être un booléen.'
        );
    }

    return adminUsersRequest(
        `/admin/users/${encodeURIComponent(id)}/status`,
        {
            method: 'PATCH',
            body: JSON.stringify({ active })
        }
    );
}