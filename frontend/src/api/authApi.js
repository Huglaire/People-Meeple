
 // Gère les appels à l'API liés à l'authentification

const API_URL = '/api';

/**
 * Connecte un utilisateur et retourne le JWT.
 */
export async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Adresse e-mail ou mot de passe incorrect.'
        );
    }

    return data;
}

/**
 * Crée un nouveau compte utilisateur.
 */
export async function register(userData) {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
        const validationMessage = Array.isArray(data.errors)
            ? data.errors.join(' ')
            : null;

        throw new Error(
            validationMessage ||
            data.message ||
            'Impossible de créer le compte.'
        );
    }

    return data;
}

/**
 * Récupère les informations de l'utilisateur connecté.
 */
export async function getCurrentUser(token) {
    const response = await fetch(`${API_URL}/me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Impossible de récupérer les informations du compte.'
        );
    }

    return data;
}

/**
 * Modifie les informations de l'utilisateur connecté.
 */
export async function updateCurrentUser(token, userData) {
    const response = await fetch(`${API_URL}/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
        const validationMessage = Array.isArray(data.errors)
            ? data.errors.join(' ')
            : null;

        throw new Error(
            validationMessage ||
            data.message ||
            'Impossible de modifier votre profil.'
        );
    }

    return data;
}

/**
 * Envoie une nouvelle photo de profil à l'API.
 */
export async function updateProfilePicture(token, imageFile) {
    const formData = new FormData();

    // Utilise le nom de champ attendu par le contrôleur Symfony
    formData.append('profilePicture', imageFile);

    const response = await fetch(`${API_URL}/me/profile-picture`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Impossible de modifier votre photo de profil.'
        );
    }

    return data;
}
