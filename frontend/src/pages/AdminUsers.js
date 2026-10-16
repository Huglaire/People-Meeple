// Crée la page d'administration des utilisateurs de People Meeple

import {
    getAdminUsers,
    getAdminUserById,
    updateAdminUserStatus
} from '../api/adminUsersApi.js';

import {
    getStoredUser,
    isAdmin
} from '../services/authService.js';

import { navigateTo } from '../router/router.js';

import '../css/admin-users.css';

const STATUS_FILTERS = [
    { value: 'all', label: 'Tous les comptes' },
    { value: 'active', label: 'Comptes actifs' },
    { value: 'inactive', label: 'Comptes désactivés' }
];

/**
 * Crée la page principale de gestion des utilisateurs.
 */
export function createAdminUsersPage() {
    const page = document.createElement('main');
    page.classList.add('admin-users-page');

    const container = document.createElement('div');
    container.classList.add('admin-users-container');

    const heading = document.createElement('header');
    heading.classList.add('admin-users-heading');

    const eyebrow = document.createElement('p');
    eyebrow.classList.add('admin-users-eyebrow');
    eyebrow.textContent = 'PEOPLE MEEPLE · ADMINISTRATION';

    const title = document.createElement('h1');
    title.textContent = 'Gestion des utilisateurs';

    const introduction = document.createElement('p');
    introduction.classList.add('admin-users-introduction');
    introduction.textContent =
        'Consultez les comptes membres et gérez leur statut sans supprimer leur historique.';

    heading.append(eyebrow, title, introduction);

    // Initialise les variables avant de créer la barre d'outils.
    let users = [];
    let selectedUserId = null;
    let activeFilter = 'all';
    let searchTerm = '';
    let isLoading = false;
    let isProcessing = false;

    const toolbar = createToolbar();

    const feedback = document.createElement('p');
    feedback.classList.add('admin-users-feedback');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.hidden = true;

    const content = document.createElement('div');
    content.classList.add('admin-users-content');

    const listPanel = document.createElement('section');
    listPanel.classList.add('admin-users-list-panel');
    listPanel.setAttribute('aria-label', 'Liste des utilisateurs');

    const listHeading = document.createElement('div');
    listHeading.classList.add('admin-users-list-heading');

    const listTitle = document.createElement('h2');
    listTitle.textContent = 'Membres';

    const listCount = document.createElement('span');
    listCount.classList.add('admin-users-count');
    listCount.textContent = '0 compte';

    listHeading.append(listTitle, listCount);

    const userList = document.createElement('div');
    userList.classList.add('admin-users-list');

    listPanel.append(listHeading, userList);

    const detailPanel = document.createElement('section');
    detailPanel.classList.add('admin-users-detail-panel');
    detailPanel.setAttribute('aria-label', 'Détails du compte');

    content.append(listPanel, detailPanel);

    container.append(
        heading,
        toolbar,
        feedback,
        content
    );

    page.append(container);

    const currentUser = getStoredUser();

    // Vérifie la présence d'une session avant de charger la page.
    if (!currentUser) {
        navigateTo('/connexion');
        return page;
    }

    // Utilise la vérification centralisée des droits administrateur.
    if (!isAdmin()) {
        setFeedback(
            'Accès refusé : cette page est réservée aux administrateurs.',
            'error'
        );

        listPanel.replaceChildren();
        detailPanel.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.classList.add('admin-users-error');
        errorMessage.textContent =
            'Vous ne disposez pas des droits nécessaires pour accéder à cette page.';

        listPanel.append(errorMessage);

        return page;
    }

    // Charge la liste dès l'ouverture de la page.
    loadUsers();

    /**
     * Crée la barre de recherche et les filtres.
     */
    function createToolbar() {
        const toolbarElement = document.createElement('form');
        toolbarElement.classList.add('admin-users-toolbar');

        toolbarElement.addEventListener('submit', (event) => {
            event.preventDefault();
            loadUsers();
        });

        const searchLabel = document.createElement('label');
        searchLabel.classList.add('admin-users-search-label');
        searchLabel.htmlFor = 'admin-users-search';
        searchLabel.textContent = 'Rechercher un membre';

        const searchInput = document.createElement('input');
        searchInput.id = 'admin-users-search';
        searchInput.type = 'search';
        searchInput.classList.add('admin-users-search');
        searchInput.placeholder = 'Pseudo, adresse e-mail ou ville…';
        searchInput.autocomplete = 'off';

        searchInput.addEventListener('input', () => {
            searchTerm = searchInput.value.trim();
            renderUserList();
        });

        const filterLabel = document.createElement('label');
        filterLabel.classList.add('admin-users-filter-label');
        filterLabel.htmlFor = 'admin-users-status-filter';
        filterLabel.textContent = 'Statut du compte';

        const filterSelect = document.createElement('select');
        filterSelect.id = 'admin-users-status-filter';
        filterSelect.classList.add('admin-users-filter');

        STATUS_FILTERS.forEach((filter) => {
            const option = document.createElement('option');
            option.value = filter.value;
            option.textContent = filter.label;
            filterSelect.append(option);
        });

        filterSelect.value = activeFilter;

        filterSelect.addEventListener('change', () => {
            activeFilter = filterSelect.value;
            renderUserList();
        });

        const refreshButton = document.createElement('button');
        refreshButton.type = 'button';
        refreshButton.classList.add('admin-users-refresh');
        refreshButton.textContent = 'Actualiser';

        refreshButton.addEventListener('click', () => {
            loadUsers();
        });

        toolbarElement.append(
            createFieldGroup(searchLabel, searchInput),
            createFieldGroup(filterLabel, filterSelect),
            refreshButton
        );

        return toolbarElement;
    }

    /**
     * Regroupe un libellé et son champ de formulaire.
     */
    function createFieldGroup(label, field) {
        const group = document.createElement('div');
        group.classList.add('admin-users-field');

        group.append(label, field);

        return group;
    }

    /**
     * Récupère les utilisateurs auprès du backend.
     */
    async function loadUsers() {
        if (isLoading) {
            return;
        }

        isLoading = true;

        setFeedback('Chargement des utilisateurs…', 'info');

        userList.replaceChildren();
        detailPanel.replaceChildren();

        const loadingMessage = document.createElement('p');
        loadingMessage.classList.add('admin-users-empty');
        loadingMessage.textContent = 'Chargement en cours…';

        userList.append(loadingMessage);

        try {
            const payload = await getAdminUsers({
                search: '',
                status: activeFilter
            });

            users = normalizeUsers(payload);

            // Conserve la sélection si le compte existe toujours.
            const selectedUser = users.find(
                (user) => String(user.id) === String(selectedUserId)
            );

            if (!selectedUser) {
                selectedUserId = null;
            }

            setFeedback('', 'info');
            renderUserList();

        } catch (error) {
            console.error(
                'Erreur lors du chargement des utilisateurs :',
                error
            );

            users = [];
            selectedUserId = null;
            listCount.textContent = '0 compte';

            userList.replaceChildren();
            detailPanel.replaceChildren();

            const errorMessage = document.createElement('p');
            errorMessage.classList.add('admin-users-error');
            errorMessage.textContent =
                error.message || 'Impossible de charger les utilisateurs.';

            userList.append(errorMessage);

            setFeedback(
                'Le chargement des utilisateurs a échoué.',
                'error'
            );

        } finally {
            isLoading = false;
        }
    }

    /**
     * Accepte plusieurs formats de réponse courants de l'API.
     */
    function normalizeUsers(payload) {
        if (Array.isArray(payload)) {
            return payload.map(normalizeUser);
        }

        if (Array.isArray(payload?.users)) {
            return payload.users.map(normalizeUser);
        }

        if (Array.isArray(payload?.items)) {
            return payload.items.map(normalizeUser);
        }

        throw new Error(
            'Le format de la liste des utilisateurs est invalide.'
        );
    }

    /**
     * Normalise les propriétés utilisées dans l'interface.
     */
    function normalizeUser(user) {
        return {
            ...user,
            id: user.id ?? user.idUser,
            pseudo: user.pseudo || 'Pseudo non renseigné',
            email: user.email || 'Adresse e-mail non renseignée',
            city: user.city || '',
            role: user.role || (
                Array.isArray(user.roles)
                    && user.roles.includes('ROLE_ADMIN')
                    ? 'ROLE_ADMIN'
                    : 'ROLE_USER'
            ),
            isActive: user.isActive ?? user.active ?? false
        };
    }

    /**
     * Retourne les utilisateurs correspondant aux critères de recherche.
     */
    function getFilteredUsers() {
        const normalizedSearch = normalizeText(searchTerm);

        return users
            .filter((user) => {
                if (
                    activeFilter === 'active'
                    && !user.isActive
                ) {
                    return false;
                }

                if (
                    activeFilter === 'inactive'
                    && user.isActive
                ) {
                    return false;
                }

                if (!normalizedSearch) {
                    return true;
                }

                const searchableText = normalizeText([
                    user.pseudo,
                    user.email,
                    user.city,
                    user.department
                ].filter(Boolean).join(' '));

                return searchableText.includes(normalizedSearch);
            })
            .sort((first, second) => {
                return first.pseudo.localeCompare(
                    second.pseudo,
                    'fr',
                    { sensitivity: 'base' }
                );
            });
    }

    /**
     * Normalise le texte pour ignorer la casse et les accents.
     */
    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('fr')
            .trim();
    }

    /**
     * Affiche la liste des utilisateurs.
     */
    function renderUserList() {
        userList.replaceChildren();

        const filteredUsers = getFilteredUsers();

        listCount.textContent = filteredUsers.length === 1
            ? '1 compte'
            : `${filteredUsers.length} comptes`;

        if (filteredUsers.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.classList.add('admin-users-empty');
            emptyMessage.textContent = users.length === 0
                ? 'Aucun utilisateur à afficher.'
                : 'Aucun utilisateur ne correspond à ces critères.';

            userList.append(emptyMessage);

            renderEmptyDetail();

            return;
        }

        filteredUsers.forEach((user) => {
            const userButton = document.createElement('button');
            userButton.type = 'button';
            userButton.classList.add('admin-user-item');

            if (String(user.id) === String(selectedUserId)) {
                userButton.classList.add('is-selected');
                userButton.setAttribute('aria-current', 'true');
            }

            const userIdentity = document.createElement('span');
            userIdentity.classList.add('admin-user-identity');

            const userPseudo = document.createElement('span');
            userPseudo.classList.add('admin-user-pseudo');
            userPseudo.textContent = user.pseudo;

            const userEmail = document.createElement('span');
            userEmail.classList.add('admin-user-email');
            userEmail.textContent = user.email;

            userIdentity.append(userPseudo, userEmail);

            const userMeta = document.createElement('span');
            userMeta.classList.add('admin-user-meta');

            const statusBadge = createStatusBadge(user.isActive);

            const roleBadge = document.createElement('span');
            roleBadge.classList.add('admin-user-role');
            roleBadge.textContent = user.role === 'ROLE_ADMIN'
                ? 'Administrateur'
                : 'Membre';

            userMeta.append(statusBadge, roleBadge);

            userButton.append(userIdentity, userMeta);

            userButton.addEventListener('click', () => {
                selectedUserId = user.id;
                renderUserList();
            });

            userList.append(userButton);
        });

        const selectedUser = filteredUsers.find(
            (user) => String(user.id) === String(selectedUserId)
        );

        if (selectedUser) {
            renderUserDetails(selectedUser);
        } else {
            renderEmptyDetail();
        }
    }

    /**
     * Affiche les détails d'un compte.
     */
    async function renderUserDetails(user) {
        detailPanel.replaceChildren();

        const detailHeading = document.createElement('div');
        detailHeading.classList.add('admin-users-detail-heading');

        const eyebrow = document.createElement('p');
        eyebrow.classList.add('admin-users-eyebrow');
        eyebrow.textContent = 'FICHE MEMBRE';

        const title = document.createElement('h2');
        title.textContent = user.pseudo;

        detailHeading.append(eyebrow, title);

        const statusBadge = createStatusBadge(user.isActive);

        const metadata = document.createElement('dl');
        metadata.classList.add('admin-users-metadata');

        appendMetadata(metadata, 'Identifiant', String(user.id ?? 'Inconnu'));
        appendMetadata(metadata, 'Adresse e-mail', user.email);
        appendMetadata(metadata, 'Ville', user.city || 'Non renseignée');
        appendMetadata(
            metadata,
            'Département',
            user.department || 'Non renseigné'
        );
        appendMetadata(
            metadata,
            'Rôle',
            user.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Membre'
        );
        appendMetadata(
            metadata,
            'Inscription',
            formatDate(user.createdAt)
        );
        appendMetadata(
            metadata,
            'Dernière modification',
            formatDate(user.updatedAt)
        );

        const actions = document.createElement('div');
        actions.classList.add('admin-users-detail-actions');

        const statusButton = document.createElement('button');
        statusButton.type = 'button';
        statusButton.classList.add(
            user.isActive
                ? 'admin-users-deactivate'
                : 'admin-users-activate'
        );
        statusButton.textContent = user.isActive
            ? 'Désactiver ce compte'
            : 'Réactiver ce compte';

        // Empêche un administrateur de désactiver son propre compte.
        const isCurrentUser = currentUser.id !== undefined
            && String(currentUser.id) === String(user.id);

        if (isCurrentUser) {
            statusButton.disabled = true;
            statusButton.title =
                'Vous ne pouvez pas désactiver votre propre compte.';
        }

        statusButton.addEventListener('click', async () => {
            await changeUserStatus(user, !user.isActive);
        });

        actions.append(statusButton);

        detailPanel.append(
            detailHeading,
            statusBadge,
            metadata,
            actions
        );

        // Charge les détails complets si l'API le permet.
        try {
            const details = await getAdminUserById(user.id);

            if (
                String(selectedUserId) !== String(user.id)
                || !details
                || typeof details !== 'object'
            ) {
                return;
            }

            const detailedUser = normalizeUser(
                details.user && typeof details.user === 'object'
                    ? details.user
                    : details
            );

            metadata.replaceChildren();

            appendMetadata(
                metadata,
                'Identifiant',
                String(detailedUser.id ?? 'Inconnu')
            );
            appendMetadata(
                metadata,
                'Adresse e-mail',
                detailedUser.email
            );
            appendMetadata(
                metadata,
                'Ville',
                detailedUser.city || 'Non renseignée'
            );
            appendMetadata(
                metadata,
                'Département',
                detailedUser.department || 'Non renseigné'
            );
            appendMetadata(
                metadata,
                'Rôle',
                detailedUser.role === 'ROLE_ADMIN'
                    ? 'Administrateur'
                    : 'Membre'
            );
            appendMetadata(
                metadata,
                'Inscription',
                formatDate(detailedUser.createdAt)
            );
            appendMetadata(
                metadata,
                'Dernière modification',
                formatDate(detailedUser.updatedAt)
            );

        } catch (error) {
            // La fiche de base reste visible si le détail est indisponible.
            console.warn(
                'Impossible de charger le détail complet du compte :',
                error
            );
        }
    }

    /**
     * Active ou désactive un compte en conservant son historique.
     */
    async function changeUserStatus(user, active) {
        if (isProcessing) {
            return;
        }

        const action = active ? 'réactiver' : 'désactiver';

        const confirmation = window.confirm(
            `Voulez-vous vraiment ${action} le compte de ${user.pseudo} ?`
        );

        if (!confirmation) {
            return;
        }

        isProcessing = true;

        setFeedback(
            active
                ? 'Réactivation du compte en cours…'
                : 'Désactivation du compte en cours…',
            'info'
        );

        try {
            await updateAdminUserStatus(user.id, active);

            user.isActive = active;

            setFeedback(
                active
                    ? 'Le compte a été réactivé.'
                    : 'Le compte a été désactivé.',
                'success'
            );

            renderUserList();

        } catch (error) {
            console.error(
                'Erreur lors de la modification du compte :',
                error
            );

            setFeedback(
                error.message || 'Impossible de modifier ce compte.',
                'error'
            );

        } finally {
            isProcessing = false;
        }
    }

    /**
     * Affiche les détails d'un champ de la fiche.
     */
    function appendMetadata(parent, labelText, valueText) {
        const item = document.createElement('div');
        item.classList.add('admin-users-metadata-item');

        const label = document.createElement('dt');
        label.classList.add('admin-users-metadata-label');
        label.textContent = labelText;

        const value = document.createElement('dd');
        value.classList.add('admin-users-metadata-value');
        value.textContent = valueText || 'Non renseigné';

        item.append(label, value);
        parent.append(item);
    }

    /**
     * Crée un badge représentant le statut du compte.
     */
    function createStatusBadge(isActive) {
        const badge = document.createElement('span');
        badge.classList.add('admin-user-status');

        badge.classList.add(
            isActive ? 'status-active' : 'status-inactive'
        );

        badge.textContent = isActive ? 'Actif' : 'Désactivé';

        return badge;
    }

    /**
     * Affiche un message lorsque aucun utilisateur n'est sélectionné.
     */
    function renderEmptyDetail() {
        detailPanel.replaceChildren();

        const message = document.createElement('div');
        message.classList.add('admin-users-detail-empty');

        const title = document.createElement('h2');
        title.textContent = 'Détails du compte';

        const description = document.createElement('p');
        description.textContent =
            'Sélectionnez un utilisateur dans la liste pour consulter sa fiche et gérer son compte.';

        message.append(title, description);
        detailPanel.append(message);
    }

    /**
     * Formate une date sans planter si elle est absente ou invalide.
     */
    function formatDate(value) {
        if (!value) {
            return 'Non renseignée';
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return new Intl.DateTimeFormat('fr-FR', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    }

    /**
     * Affiche un message de retour accessible.
     */
    function setFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = 'admin-users-feedback';
        feedback.classList.add(`feedback-${type}`);
        feedback.hidden = !message;
    }

    return page;
}