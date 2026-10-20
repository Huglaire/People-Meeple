/* ========================================
   API de la messagerie People Meeple
   ======================================== */

import { getToken } from '../services/authService.js';

const API_URL = '/api';

/**
 * Effectue une requête authentifiée vers l'API de messagerie.
 */
async function requestMessagingApi(path, options = {}) {
    const token = getToken();

    if (!token) {
        throw new Error(
            'Tu dois être connecté pour accéder à la messagerie.'
        );
    }

    const headers = new Headers(options.headers || {});

    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');

    if (options.body !== undefined) {
        headers.set('Content-Type', 'application/json');
    }

    let response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers
        });
    } catch (error) {
        throw new Error(
            'Impossible de contacter le serveur. Vérifie que Symfony est démarré.'
        );
    }

    const responseText = await response.text();
    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            throw new Error(
                'Le serveur a retourné une réponse JSON invalide.'
            );
        }
    }

    if (!response.ok) {
        const errorMessage =
            data?.message
            || `Une erreur est survenue (HTTP ${response.status}).`;

        const apiError = new Error(errorMessage);

        apiError.status = response.status;
        apiError.data = data;

        throw apiError;
    }

    return data;
}

/**
 * Récupère toutes les conversations de l'utilisateur connecté.
 */
export async function getConversations() {
    const conversations = await requestMessagingApi('/conversations');

    if (!Array.isArray(conversations)) {
        throw new Error(
            'Le serveur a retourné une liste de conversations invalide.'
        );
    }

    return conversations;
}

/**
 * Crée une conversation avec un autre utilisateur.
 *
 * Si une conversation existe déjà, l'erreur HTTP 409 est conservée
 * afin que l'interface puisse récupérer son identifiant.
 */
export async function createConversation(userId) {
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error(
            'L’identifiant du destinataire est invalide.'
        );
    }

    return requestMessagingApi('/conversations', {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
}

/**
 * Récupère les informations d'une conversation.
 */
export async function getConversation(conversationId) {
    validateConversationId(conversationId);

    return requestMessagingApi(
        `/conversations/${conversationId}`
    );
}

/**
 * Récupère les messages d'une conversation.
 */
export async function getMessages(conversationId) {
    validateConversationId(conversationId);

    const messages = await requestMessagingApi(
        `/conversations/${conversationId}/messages`
    );

    if (!Array.isArray(messages)) {
        throw new Error(
            'Le serveur a retourné une liste de messages invalide.'
        );
    }

    return messages;
}

/**
 * Envoie un message dans une conversation.
 */
export async function sendMessage(conversationId, content) {
    validateConversationId(conversationId);

    if (typeof content !== 'string' || content.trim() === '') {
        throw new Error(
            'Le message ne peut pas être vide.'
        );
    }

    return requestMessagingApi(
        `/conversations/${conversationId}/messages`,
        {
            method: 'POST',
            body: JSON.stringify({
                content: content.trim()
            })
        }
    );
}

/**
 * Vérifie qu'un identifiant de conversation est valide.
 */
function validateConversationId(conversationId) {
    if (
        !Number.isInteger(conversationId)
        || conversationId <= 0
    ) {
        throw new Error(
            'L’identifiant de la conversation est invalide.'
        );
    }
}
