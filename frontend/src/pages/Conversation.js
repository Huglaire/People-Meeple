/* ========================================
   Page d'une conversation People Meeple
   ======================================== */

import {
    getConversation,
    getMessages,
    sendMessage
} from '../api/messagingApi.js';

import { getStoredUser } from '../services/authService.js';
import { navigateTo } from '../router/router.js';

/**
 * Crée la page d'une conversation.
 */
export function createConversationPage(conversationId) {
    const page = document.createElement('main');
    page.classList.add('conversation-page');

    const container = document.createElement('div');
    container.classList.add('conversation-container');

    const header = document.createElement('header');
    header.classList.add('conversation-header');

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.classList.add('conversation-back-button');
    backButton.textContent = '← Discussions';
    backButton.addEventListener('click', () => {
        navigateTo('/discussions');
    });

    const heading = document.createElement('div');
    heading.classList.add('conversation-heading');

    const title = document.createElement('h1');
    title.classList.add('conversation-title');
    title.textContent = 'Conversation';

    const subtitle = document.createElement('p');
    subtitle.classList.add('conversation-subtitle');
    subtitle.textContent = 'Chargement des informations…';

    heading.append(title, subtitle);
    header.append(backButton, heading);

    const status = document.createElement('p');
    status.classList.add('conversation-status');
    status.setAttribute('role', 'status');
    status.textContent = 'Chargement des messages…';

    const messagesList = document.createElement('ol');
    messagesList.classList.add('conversation-messages');
    messagesList.setAttribute('aria-label', 'Historique des messages');

    const form = document.createElement('form');
    form.classList.add('conversation-form');

    const messageInput = document.createElement('textarea');
    messageInput.classList.add('conversation-input');
    messageInput.name = 'content';
    messageInput.rows = 2;
    messageInput.maxLength = 5000;
    messageInput.placeholder = 'Écris ton message…';
    messageInput.setAttribute('aria-label', 'Ton message');
    messageInput.required = true;

    const sendButton = document.createElement('button');
    sendButton.type = 'submit';
    sendButton.classList.add('conversation-send-button');
    sendButton.textContent = 'Envoyer';

    form.append(messageInput, sendButton);

    const formStatus = document.createElement('p');
    formStatus.classList.add('conversation-form-status');
    formStatus.setAttribute('role', 'status');

    container.append(
        header,
        status,
        messagesList,
        form,
        formStatus
    );

    page.append(container);

    const currentUser = getStoredUser();
    const currentUserId = Number(currentUser?.id);

    let isSending = false;

    /**
     * Affiche les messages dans l'ordre fourni par l'API.
     */
    function renderMessages(messages) {
        messagesList.replaceChildren();

        if (messages.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.classList.add('conversation-empty');
            emptyMessage.textContent =
                'Aucun message pour le moment. Lance la conversation !';

            messagesList.append(emptyMessage);
            return;
        }

        messages.forEach((message) => {
            const item = document.createElement('li');
            item.classList.add('conversation-message');

            const isOwnMessage =
                Number(message.user?.id) === currentUserId;

            item.classList.add(
                isOwnMessage
                    ? 'conversation-message-own'
                    : 'conversation-message-other'
            );

            const author = document.createElement('p');
            author.classList.add('conversation-message-author');
            author.textContent = isOwnMessage
                ? 'Moi'
                : (message.user?.pseudo || 'Joueur');

            const content = document.createElement('p');
            content.classList.add('conversation-message-content');
            content.textContent = message.content || '';

            const date = document.createElement('time');
            date.classList.add('conversation-message-date');

            if (message.createdAt) {
                const parsedDate = new Date(message.createdAt);

                if (!Number.isNaN(parsedDate.getTime())) {
                    date.dateTime = parsedDate.toISOString();
                    date.textContent = new Intl.DateTimeFormat(
                        'fr-FR',
                        {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }
                    ).format(parsedDate);
                }
            }

            item.append(author, content);

            if (date.textContent) {
                item.append(date);
            }

            messagesList.append(item);
        });
    }

    /**
     * Charge les informations de la conversation et son historique.
     */
    async function loadConversation() {
        status.textContent = 'Chargement des messages…';
        messagesList.replaceChildren();
        formStatus.textContent = '';
        sendButton.disabled = true;

        try {
            const [conversation, messages] = await Promise.all([
                getConversation(conversationId),
                getMessages(conversationId)
            ]);

            const participants = [
                conversation.user,
                conversation.user1
            ].filter(Boolean);

            const otherParticipant = participants.find(
                (participant) =>
                    Number(participant.id) !== currentUserId
            );

            title.textContent = otherParticipant?.pseudo
                || 'Conversation';

            subtitle.textContent = otherParticipant
                ? 'Échange avec ' + otherParticipant.pseudo
                : 'Tes messages';

            renderMessages(messages);
            status.textContent = messages.length === 0
                ? 'La conversation commence ici.'
                : `${messages.length} message(s)`;

            sendButton.disabled = false;
        } catch (error) {
            status.textContent =
                error.message || 'Impossible de charger la conversation.';

            const retryButton = document.createElement('button');
            retryButton.type = 'button';
            retryButton.classList.add('conversation-retry-button');
            retryButton.textContent = 'Réessayer';
            retryButton.addEventListener('click', loadConversation);

            messagesList.replaceChildren(retryButton);
        }
    }

    /**
     * Envoie le message puis actualise l'historique.
     */
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isSending) {
            return;
        }

        const content = messageInput.value.trim();

        if (!content) {
            formStatus.textContent = 'Saisis un message avant de l’envoyer.';
            messageInput.focus();
            return;
        }

        isSending = true;
        sendButton.disabled = true;
        formStatus.textContent = 'Envoi du message…';

        try {
            await sendMessage(conversationId, content);
            messageInput.value = '';
            formStatus.textContent = 'Message envoyé.';

            const messages = await getMessages(conversationId);
            renderMessages(messages);

            status.textContent = `${messages.length} message(s)`;
            messagesList.lastElementChild?.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        } catch (error) {
            formStatus.textContent =
                error.message || 'Impossible d’envoyer le message.';
        } finally {
            isSending = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    });

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
        status.textContent = 'Identifiant de conversation invalide.';
        form.hidden = true;
    } else if (!currentUserId) {
        status.textContent = 'Connecte-toi pour accéder à tes messages.';
        form.hidden = true;
    } else {
        loadConversation();
    }

    return page;
}
