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

/**
 * Vérifie si l'utilisateur connecté possède le rôle administrateur.
 */
export function isAdmin() {
    const user = getStoredUser();

    if (!user) {
        return false;
    }

    // Récupère les rôles, quel que soit le format fourni par l'API.
    const roles = [];

    if (Array.isArray(user.roles)) {
        roles.push(...user.roles);
    }

    if (Array.isArray(user.role)) {
        roles.push(...user.role);
    } else if (typeof user.role === 'string') {
        roles.push(user.role);
    }

    // Accepte ADMIN et ROLE_ADMIN, sans tenir compte de la casse.
    return roles.some((role) => {
        const normalizedRole = String(role)
            .trim()
            .toUpperCase();

        return (
            normalizedRole === 'ADMIN'
            || normalizedRole === 'ROLE_ADMIN'
        );
    });
}