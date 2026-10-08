// Gère la session de l'utilisateur côté frontend

/**
 * Récupère le token JWT enregistré.
 */
export function getToken() {
    return localStorage.getItem('token');
}

/**
 * Récupère l'utilisateur enregistré.
 */
export function getStoredUser() {
    const user = localStorage.getItem('user');

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error(
            'Impossible de lire les informations de l’utilisateur.',
            error
        );

        localStorage.removeItem('user');

        return null;
    }
}

/**
 * Vérifie si un utilisateur est connecté.
 */
export function isAuthenticated() {
    return Boolean(getToken() && getStoredUser());
}

/**
 * Déconnecte l'utilisateur.
 */
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}