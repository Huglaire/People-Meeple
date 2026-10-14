import { getConversations } from '../api/messagingApi.js';
import { getStoredUser } from '../services/authService.js';
import { navigateTo } from '../router/router.js';

/**
 * Crée la page des discussions.
 */
export function createDiscussionsPage() {
    const page = document.createElement('main');
    page.classList.add('discussions-page');

    const container = document.createElement('div');
    container.classList.add('discussions-container');

    const heading = document.createElement('header');
    heading.classList.add('discussions-heading');

    const title = document.createElement('h1');
    title.textContent = 'Discussions';

    const description = document.createElement('p');
    description.textContent =
        'Retrouve ici toutes tes conversations avec les autres joueurs.';

    heading.append(title, description);

    const toolbar = document.createElement('div');
    toolbar.classList.add('discussions-toolbar');

    const searchLabel = document.createElement('label');
    searchLabel.classList.add('visually-hidden');
    searchLabel.htmlFor = 'discussions-search';
    searchLabel.textContent = 'Rechercher une conversation';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.id = 'discussions-search';
    searchInput.classList.add('discussions-search');
    searchInput.placeholder = 'Rechercher une conversation...';
    searchInput.autocomplete = 'off';

    const newMessageButton = document.createElement('button');
    newMessageButton.type = 'button';
    newMessageButton.classList.add('discussions-new-message');
    newMessageButton.textContent = 'Nouveau message';

    // Le bouton sera relié à la création de conversation dans une étape ultérieure.
    newMessageButton.disabled = true;
    newMessageButton.title =
        'Pour commencer une conversation, ouvre le profil du joueur concerné.';

    toolbar.append(
        searchLabel,
        searchInput,
        newMessageButton
    );

    const status = document.createElement('p');
    status.classList.add('discussions-status');
    status.setAttribute('role', 'status');
    status.textContent = 'Chargement des conversations...';

    const list = document.createElement('section');
    list.classList.add('discussions-list');
    list.setAttribute('aria-label', 'Liste des conversations');

    container.append(
        heading,
        toolbar,
        status,
        list
    );

    page.append(container);

    let conversations = [];

    // Identifie l'utilisateur connecté pour déterminer le correspondant.
    const currentUser = getStoredUser();
    const currentUserId = currentUser?.id ?? currentUser?.userId ?? null;

    /**
     * Détermine l'autre participant de la conversation.
     */
    function getOtherParticipant(conversation) {
        const user = conversation.user;
        const user1 = conversation.user1;

        if (currentUserId !== null) {
            if (Number(user?.id) === Number(currentUserId)) {
                return user1;
            }

            if (Number(user1?.id) === Number(currentUserId)) {
                return user;
            }
        }

        // Secours si le format du compte enregistré diffère.
        const currentPseudo = currentUser?.pseudo;

        if (currentPseudo && user?.pseudo === currentPseudo) {
            return user1;
        }

        if (currentPseudo && user1?.pseudo === currentPseudo) {
            return user;
        }

        return user1 || user || null;
    }

    /**
     * Crée un avatar avec l'initiale du correspondant.
     */
    function createAvatar(pseudo) {
        const avatar = document.createElement('div');
        avatar.classList.add('discussion-avatar');
        avatar.setAttribute('aria-hidden', 'true');

        const initial = document.createElement('span');
        initial.textContent =
            (pseudo || '?').trim().charAt(0).toUpperCase() || '?';

        avatar.append(initial);

        return avatar;
    }

    /**
     * Affiche la date de dernière activité connue.
     */
    function formatConversationDate(conversation) {
        const dateValue =
            conversation.updatedAt || conversation.createdAt;

        if (!dateValue) {
            return '';
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const now = new Date();

        const isSameDay =
            date.getDate() === now.getDate()
            && date.getMonth() === now.getMonth()
            && date.getFullYear() === now.getFullYear();

        if (isSameDay) {
            return new Intl.DateTimeFormat('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        }

        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: date.getFullYear() === now.getFullYear()
                ? undefined
                : 'numeric'
        }).format(date);
    }

    /**
     * Crée une ligne de conversation cliquable.
     */
    function createConversationItem(conversation) {
        const participant = getOtherParticipant(conversation);
        const pseudo = participant?.pseudo || 'Joueur';

        const item = document.createElement('article');
        item.classList.add('discussion-item');
        item.dataset.conversationId = String(conversation.id);

        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('discussion-item-button');
        button.setAttribute(
            'aria-label',
            `Ouvrir la conversation avec ${pseudo}`
        );

        // Ouvre la page de cette conversation.
        button.addEventListener('click', () => {
            const conversationId = Number(conversation.id);

            if (!Number.isInteger(conversationId) || conversationId <= 0) {
                console.error(
                    'Identifiant de conversation invalide.',
                    conversation.id
                );
                return;
            }

            navigateTo(`/discussions/${conversationId}`);
        });

        const avatar = createAvatar(pseudo);

        const information = document.createElement('div');
        information.classList.add('discussion-item-information');

        const name = document.createElement('h2');
        name.classList.add('discussion-item-name');
        name.textContent = pseudo;

        const preview = document.createElement('p');
        preview.classList.add('discussion-item-preview');
        preview.textContent = 'Conversation';

        information.append(name, preview);

        const metadata = document.createElement('div');
        metadata.classList.add('discussion-item-metadata');

        const date = document.createElement('time');
        date.classList.add('discussion-item-date');

        const dateValue =
            conversation.updatedAt || conversation.createdAt;

        if (dateValue) {
            date.dateTime = dateValue;
        }

        date.textContent = formatConversationDate(conversation);

        const arrow = document.createElement('span');
        arrow.classList.add('discussion-item-arrow');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '›';

        metadata.append(date, arrow);
        button.append(avatar, information, metadata);
        item.append(button);

        return item;
    }

    /**
     * Affiche la liste en fonction du texte recherché.
     */
    function renderConversations() {
        const search = searchInput.value
            .trim()
            .toLocaleLowerCase('fr-FR');

        const filteredConversations = conversations.filter(
            (conversation) => {
                const participant = getOtherParticipant(conversation);
                const pseudo = participant?.pseudo || 'Joueur';

                return pseudo
                    .toLocaleLowerCase('fr-FR')
                    .includes(search);
            }
        );

        list.replaceChildren();

        if (filteredConversations.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.classList.add('discussions-empty');

            emptyMessage.textContent = search
                ? 'Aucune conversation ne correspond à ta recherche.'
                : 'Tu n’as pas encore de conversation.';

            list.append(emptyMessage);

            status.textContent = search
                ? 'Aucun résultat.'
                : 'Aucune conversation.';

            return;
        }

        const fragment = document.createDocumentFragment();

        filteredConversations.forEach((conversation) => {
            fragment.append(createConversationItem(conversation));
        });

        list.append(fragment);

        status.textContent =
            `${filteredConversations.length} conversation`
            + (filteredConversations.length > 1 ? 's' : '');
    }

    /**
     * Charge les conversations depuis l'API Symfony.
     */
    async function loadConversations() {
        status.textContent = 'Chargement des conversations...';
        list.replaceChildren();

        try {
            conversations = await getConversations();

            // Affiche les discussions de la plus récente à la plus ancienne.
            conversations.sort((first, second) => {
                const firstDate = new Date(
                    first.updatedAt || first.createdAt || 0
                ).getTime();

                const secondDate = new Date(
                    second.updatedAt || second.createdAt || 0
                ).getTime();

                return secondDate - firstDate;
            });

            renderConversations();
        } catch (error) {
            console.error(
                'Impossible de charger les conversations.',
                error
            );

            status.textContent = '';

            const errorMessage = document.createElement('p');
            errorMessage.classList.add('discussions-error');
            errorMessage.setAttribute('role', 'alert');
            errorMessage.textContent = error.message
                || 'Impossible de charger les discussions.';

            const retryButton = document.createElement('button');
            retryButton.type = 'button';
            retryButton.classList.add('discussions-retry');
            retryButton.textContent = 'Réessayer';
            retryButton.addEventListener('click', loadConversations);

            list.replaceChildren(errorMessage, retryButton);
        }
    }

    searchInput.addEventListener('input', renderConversations);

    loadConversations();

    return page;
}
