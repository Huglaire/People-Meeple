// Adresse de l'API Symfony
const API_URL = 'http://127.0.0.1:8000';

/**
 * Récupère la liste complète des départements.
 */
export async function getDepartments() {
    const response = await fetch(`${API_URL}/api/departments`);

    if (!response.ok) {
        throw new Error(
            `Impossible de récupérer les départements : ${response.status}`
        );
    }

    const departments = await response.json();

    if (!Array.isArray(departments)) {
        throw new Error(
            'Le format de la liste des départements est invalide.'
        );
    }

    return departments;
}
