// Gère les appels à l'API d'administration des statistiques.

import { getToken } from '../services/authService.js';

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Récupère les statistiques de la plateforme.
 *
 * L'API Symfony vérifie le rôle administrateur et lit les données dans MongoDB.
 */
export async function getStatistics() {
    const token = getToken();

    if (!token) {
        throw new Error(
            'Votre session a expiré. Veuillez vous reconnecter.'
        );
    }

    const response = await fetch(`${API_URL}/admin/statistics`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error(
            'Accès refusé. Connectez-vous avec un compte administrateur.'
        );
    }

    if (!response.ok) {
        throw new Error(
            'Impossible de récupérer les statistiques. Réessayez plus tard.'
        );
    }

    return response.json();
}