/**
 * Configuration centralisée de l'API People Meeple.
 *
 * En développement local, Vite utilise le proxy configuré dans vite.config.js.
 * En production, Nginx transmet les requêtes /api au backend Symfony.
 */

export const API_BASE_URL = '';
export const API_URL = '/api';

/**
 * Construit l'URL d'une ressource servie par le backend.
 *
 * Exemple : /images/meeple-default.png
 */
export function getBackendUrl(path) {
    if (!path) {
        return '';
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return path.startsWith('/') ? path : `/${path}`;
}