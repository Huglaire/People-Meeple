// Crée la page d'administration des demandes d'ajout de jeux

import {
    getAdminGameRequests,
    acceptGameRequest,
    rejectGameRequest
} from '../api/adminGameRequestsApi.js';

import { getStoredUser } from '../services/authService.js';
import { navigateTo } from '../router/router.js';

import '../css/admin-game-requests.css';

const DEFAULT_GAME_VALUES = {
    name: '',
    publisher: '',
    description: '',
    minPlayers: 1,
    maxPlayers: 4,
    minimumAge: 8,
    duration: 30
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
];

const FILTERS = [
    { value: 'all', label: 'Toutes les demandes' },
    { value: 'pending', label: 'En attente' },
    { value: 'processed', label: 'Traitées' }
];

/**
 * Crée la page principale des demandes de jeux.
 */
export function createAdminGameRequestsPage() {
    const page = document.createElement('main');
    page.classList.add('admin-game-requests-page');

    const container = document.createElement('div');
    container.classList.add('admin-game-requests-container');

    const heading = document.createElement('header');
    heading.classList.add('admin-game-requests-heading');

    const title = document.createElement('h1');
    title.textContent = 'Demandes d’ajout de jeux';

    const introduction = document.createElement('p');
    introduction.textContent =
        'Consultez les propositions des joueurs et gérez les ajouts au catalogue.';

    heading.append(title, introduction);

    // Initialise l'état avant de créer la barre de filtres qui l'utilise.
    let requests = [];
    let selectedRequestId = null;
    let activeFilter = 'pending';
    let isProcessing = false;

    const toolbar = createToolbar();

    const feedback = document.createElement('p');
    feedback.classList.add('admin-game-requests-feedback');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.hidden = true;

    const content = document.createElement('div');
    content.classList.add('admin-game-requests-content');

    const listPanel = document.createElement('section');
    listPanel.classList.add('admin-game-requests-list-panel');
    listPanel.setAttribute('aria-label', 'Liste des demandes');

    const listHeading = document.createElement('h2');
    listHeading.textContent = 'Demandes reçues';

    const listCount = document.createElement('span');
    listCount.classList.add('admin-game-requests-count');
    listCount.textContent = '0';

    listHeading.append(' ', listCount);

    const requestList = document.createElement('div');
    requestList.classList.add('admin-game-requests-list');

    listPanel.append(listHeading, requestList);

    const detailPanel = document.createElement('section');
    detailPanel.classList.add('admin-game-requests-detail-panel');
    detailPanel.setAttribute('aria-label', 'Détail de la demande');

    content.append(listPanel, detailPanel);

    container.append(
        heading,
        toolbar,
        feedback,
        content
    );

    page.append(container);

    const currentUser = getStoredUser();

    // L'accès reste protégé côté backend par ROLE_ADMIN.
    if (!currentUser) {
        navigateTo('/connexion');
        return page;
    }

    // Charge les demandes depuis l'API.
    loadRequests();

    /**
     * Crée les filtres de la liste.
     */
    function createToolbar() {
        const toolbarElement = document.createElement('div');
        toolbarElement.classList.add('admin-game-requests-toolbar');

        const filterLabel = document.createElement('label');
        filterLabel.htmlFor = 'admin-game-requests-filter';
        filterLabel.textContent = 'Afficher :';

        const filterSelect = document.createElement('select');
        filterSelect.id = 'admin-game-requests-filter';
        filterSelect.classList.add('admin-game-requests-filter');

        FILTERS.forEach((filter) => {
            const option = document.createElement('option');
            option.value = filter.value;
            option.textContent = filter.label;

            filterSelect.append(option);
        });

        filterSelect.value = activeFilter;

        filterSelect.addEventListener('change', () => {
            activeFilter = filterSelect.value;
            renderRequestList();
        });

        const refreshButton = document.createElement('button');
        refreshButton.type = 'button';
        refreshButton.classList.add('admin-game-requests-refresh');
        refreshButton.textContent = 'Actualiser';

        refreshButton.addEventListener('click', () => {
            loadRequests();
        });

        toolbarElement.append(
            filterLabel,
            filterSelect,
            refreshButton
        );

        return toolbarElement;
    }

    /**
     * Récupère les demandes auprès du backend.
     */
    async function loadRequests() {
        setFeedback('Chargement des demandes...', 'info');
        requestList.replaceChildren();
        detailPanel.replaceChildren();

        const loadingMessage = document.createElement('p');
        loadingMessage.classList.add('admin-game-requests-empty');
        loadingMessage.textContent = 'Chargement en cours...';

        requestList.append(loadingMessage);

        try {
            requests = await getAdminGameRequests();

            if (!Array.isArray(requests)) {
                throw new Error(
                    'Le format des demandes reçu depuis l’API est invalide.'
                );
            }

            // Conserve la sélection si la demande existe toujours.
            const selectedRequest = requests.find(
                (request) => request.id === selectedRequestId
            );

            if (!selectedRequest) {
                selectedRequestId = null;
            }

            setFeedback('', 'info');
            renderRequestList();

        } catch (error) {
            console.error(
                'Erreur lors du chargement des demandes :',
                error
            );

            requests = [];
            listCount.textContent = '0';

            requestList.replaceChildren();

            const errorMessage = document.createElement('p');
            errorMessage.classList.add('admin-game-requests-error');
            errorMessage.textContent =
                error.message || 'Impossible de charger les demandes.';

            requestList.append(errorMessage);

            detailPanel.replaceChildren();

            setFeedback(
                'Le chargement des demandes a échoué.',
                'error'
            );
        }
    }

    /**
     * Retourne les demandes correspondant au filtre actif.
     */
    function getFilteredRequests() {
        let filteredRequests = [...requests];

        if (activeFilter === 'pending') {
            filteredRequests = filteredRequests.filter(
                (request) => request.status === 'pending'
            );
        } else if (activeFilter === 'processed') {
            filteredRequests = filteredRequests.filter(
                (request) => request.status !== 'pending'
            );
        }

        // Les demandes en attente les plus anciennes apparaissent d'abord.
        return filteredRequests.sort((first, second) => {
            const firstPending = first.status === 'pending';
            const secondPending = second.status === 'pending';

            if (firstPending && !secondPending) {
                return -1;
            }

            if (!firstPending && secondPending) {
                return 1;
            }

            const firstDate = new Date(first.createdAt || 0).getTime();
            const secondDate = new Date(second.createdAt || 0).getTime();

            if (firstPending) {
                return firstDate - secondDate;
            }

            return secondDate - firstDate;
        });
    }

    /**
     * Affiche la liste des demandes.
     */
    function renderRequestList() {
        requestList.replaceChildren();

        const filteredRequests = getFilteredRequests();
        listCount.textContent = String(filteredRequests.length);

        if (filteredRequests.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.classList.add('admin-game-requests-empty');

            emptyMessage.textContent = activeFilter === 'pending'
                ? 'Aucune demande en attente.'
                : activeFilter === 'processed'
                    ? 'Aucune demande traitée.'
                    : 'Aucune demande pour le moment.';

            requestList.append(emptyMessage);

            renderEmptyDetail();

            return;
        }

        filteredRequests.forEach((request) => {
            const requestButton = document.createElement('button');
            requestButton.type = 'button';
            requestButton.classList.add('admin-game-request-item');

            if (request.id === selectedRequestId) {
                requestButton.classList.add('is-selected');
                requestButton.setAttribute('aria-current', 'true');
            }

            requestButton.setAttribute(
                'aria-label',
                `Afficher la demande ${request.name}`
            );

            const requestName = document.createElement('span');
            requestName.classList.add('admin-game-request-item-name');
            requestName.textContent = request.name || 'Jeu sans nom';

            const requestPublisher = document.createElement('span');
            requestPublisher.classList.add(
                'admin-game-request-item-publisher'
            );
            requestPublisher.textContent =
                request.publisher || 'Éditeur non renseigné';

            const requestMeta = document.createElement('span');
            requestMeta.classList.add('admin-game-request-item-meta');

            const requester = document.createElement('span');
            requester.textContent =
                request.requester?.pseudo || 'Utilisateur inconnu';

            const statusBadge = createStatusBadge(request.status);

            requestMeta.append(requester, statusBadge);

            const requestDate = document.createElement('span');
            requestDate.classList.add('admin-game-request-item-date');
            requestDate.textContent = formatDate(request.createdAt);

            requestButton.append(
                requestName,
                requestPublisher,
                requestMeta,
                requestDate
            );

            requestButton.addEventListener('click', () => {
                selectedRequestId = request.id;
                renderRequestList();
            });

            requestList.append(requestButton);
        });

        const selectedRequest = filteredRequests.find(
            (request) => request.id === selectedRequestId
        );

        if (selectedRequest) {
            renderRequestDetail(selectedRequest);
        } else {
            selectedRequestId = filteredRequests[0].id;
            renderRequestList();
        }
    }

    /**
     * Affiche un message lorsqu'aucune demande ne peut être sélectionnée.
     */
    function renderEmptyDetail() {
        detailPanel.replaceChildren();

        const emptyState = document.createElement('div');
        emptyState.classList.add('admin-game-requests-detail-empty');

        const titleElement = document.createElement('h2');
        titleElement.textContent = 'Aucune demande à afficher';

        const description = document.createElement('p');
        description.textContent =
            'Les demandes correspondant au filtre choisi apparaîtront ici.';

        emptyState.append(titleElement, description);
        detailPanel.append(emptyState);
    }

    /**
     * Affiche les détails d'une demande et son formulaire.
     */
    function renderRequestDetail(request) {
        detailPanel.replaceChildren();

        const detailHeader = document.createElement('header');
        detailHeader.classList.add('admin-game-requests-detail-header');

        const detailTitle = document.createElement('h2');
        detailTitle.textContent = request.name || 'Jeu sans nom';

        const statusBadge = createStatusBadge(request.status);

        detailHeader.append(detailTitle, statusBadge);

        const metadata = document.createElement('div');
        metadata.classList.add('admin-game-requests-metadata');

        appendMetadata(
            metadata,
            'Proposé par',
            request.requester?.pseudo || 'Utilisateur inconnu'
        );

        appendMetadata(
            metadata,
            'Date de proposition',
            formatDate(request.createdAt)
        );

        if (request.processedAt) {
            appendMetadata(
                metadata,
                'Date de traitement',
                formatDate(request.processedAt)
            );
        }

        if (request.processor?.pseudo) {
            appendMetadata(
                metadata,
                'Traité par',
                request.processor.pseudo
            );
        }

        const separator = document.createElement('hr');

        const formTitle = document.createElement('h3');
        formTitle.textContent = request.status === 'pending'
            ? 'Informations du jeu'
            : 'Informations proposées';

        const form = document.createElement('form');
        form.classList.add('admin-game-requests-form');

        const fields = [
            {
                name: 'name',
                label: 'Nom du jeu',
                type: 'text',
                required: true,
                value: request.name
            },
            {
                name: 'publisher',
                label: 'Éditeur',
                type: 'text',
                required: true,
                value: request.publisher
            },
            {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                required: true,
                value: request.description
            },
            {
                name: 'minPlayers',
                label: 'Nombre minimum de joueurs',
                type: 'number',
                required: true,
                min: 1,
                value: DEFAULT_GAME_VALUES.minPlayers
            },
            {
                name: 'maxPlayers',
                label: 'Nombre maximum de joueurs',
                type: 'number',
                required: true,
                min: 1,
                value: DEFAULT_GAME_VALUES.maxPlayers
            },
            {
                name: 'minimumAge',
                label: 'Âge minimum',
                type: 'number',
                required: true,
                min: 0,
                value: DEFAULT_GAME_VALUES.minimumAge
            },
            {
                name: 'duration',
                label: 'Durée moyenne (minutes)',
                type: 'number',
                required: true,
                min: 1,
                value: DEFAULT_GAME_VALUES.duration
            }
        ];

        fields.forEach((field) => {
            const fieldElement = createFormField(field, request);
            form.append(fieldElement);
        });

        // Le choix d'une image se fait depuis l'ordinateur de l'administrateur.
        const imageField = createImageField(request.status !== 'pending');
        form.append(imageField.wrapper);

        const actions = document.createElement('div');
        actions.classList.add('admin-game-requests-actions');

        if (request.status === 'pending') {
            const acceptButton = document.createElement('button');
            acceptButton.type = 'submit';
            acceptButton.classList.add(
                'admin-game-requests-button',
                'admin-game-requests-button-accept'
            );
            acceptButton.textContent = 'Accepter et ajouter le jeu';

            const rejectButton = document.createElement('button');
            rejectButton.type = 'button';
            rejectButton.classList.add(
                'admin-game-requests-button',
                'admin-game-requests-button-reject'
            );
            rejectButton.textContent = 'Rejeter la demande';

            rejectButton.addEventListener('click', () => {
                processRejection(request);
            });

            actions.append(acceptButton, rejectButton);

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                processAcceptance(
                    request,
                    form,
                    acceptButton,
                    rejectButton
                );
            });
        } else {
            // Les demandes déjà traitées ne sont plus modifiables.
            form.querySelectorAll('input, textarea').forEach((field) => {
                field.disabled = true;
            });

            const processedMessage = document.createElement('p');
            processedMessage.classList.add(
                'admin-game-requests-processed-message'
            );
            processedMessage.textContent =
                'Cette demande a déjà été traitée.';

            actions.append(processedMessage);
        }

        form.append(actions);

        detailPanel.append(
            detailHeader,
            metadata,
            separator,
            formTitle,
            form
        );

        /**
         * Crée le champ de sélection et l'aperçu de l'image.
         */
        function createImageField(isProcessed) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('admin-game-requests-field');

            const label = document.createElement('label');
            const inputId = 'admin-game-request-image';

            label.htmlFor = inputId;
            label.textContent = 'Image du jeu';

            const input = document.createElement('input');
            input.id = inputId;
            input.name = 'imageFile';
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp,image/gif';
            input.disabled = isProcessed;
            input.setAttribute(
                'aria-describedby',
                'admin-game-request-image-help admin-game-request-image-error'
            );

            const help = document.createElement('small');
            help.id = 'admin-game-request-image-help';
            help.textContent =
                'Formats acceptés : JPG, PNG, WEBP ou GIF. Taille maximale : 5 Mo.';

            const previewContainer = document.createElement('div');
            previewContainer.classList.add(
                'admin-game-requests-image-preview'
            );

            const preview = document.createElement('img');
            preview.alt = 'Aperçu de l’image sélectionnée';
            preview.hidden = true;

            const emptyPreview = document.createElement('p');
            emptyPreview.textContent = isProcessed
                ? 'Demande déjà traitée.'
                : 'Aucune image sélectionnée.';

            previewContainer.append(preview, emptyPreview);

            const error = document.createElement('p');
            error.id = 'admin-game-request-image-error';
            error.classList.add('admin-game-requests-image-error');
            error.setAttribute('role', 'alert');
            error.hidden = true;

            let previewUrl = null;
            let isValid = true;

            input.addEventListener('change', () => {
                error.textContent = '';
                error.hidden = true;
                isValid = true;

                const file = input.files?.[0];

                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    previewUrl = null;
                }

                preview.removeAttribute('src');
                preview.hidden = true;
                emptyPreview.hidden = false;
                emptyPreview.textContent = file
                    ? ''
                    : 'Aucune image sélectionnée.';

                if (!file) {
                    return;
                }

                if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                    showImageError(
                        'Le fichier doit être une image JPG, PNG, WEBP ou GIF.'
                    );
                    input.value = '';
                    return;
                }

                if (file.size > MAX_IMAGE_SIZE) {
                    showImageError(
                        'L’image ne doit pas dépasser 5 Mo.'
                    );
                    input.value = '';
                    return;
                }

                previewUrl = URL.createObjectURL(file);
                preview.src = previewUrl;
                preview.hidden = false;
                emptyPreview.hidden = true;
            });

            function showImageError(message) {
                isValid = false;
                error.textContent = message;
                error.hidden = false;
                preview.hidden = true;
                emptyPreview.hidden = false;
                emptyPreview.textContent = 'Aucune image valide sélectionnée.';
            }

            wrapper.append(
                label,
                input,
                help,
                previewContainer,
                error
            );

            return {
                wrapper,
                input,
                isValid: () => isValid
            };
        }
    }

    /**
     * Crée un champ du formulaire.
     */
    function createFormField(field, request) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('admin-game-requests-field');

        if (
            field.name === 'minPlayers'
            || field.name === 'maxPlayers'
            || field.name === 'minimumAge'
            || field.name === 'duration'
        ) {
            wrapper.classList.add('admin-game-requests-field-number');
        }

        const label = document.createElement('label');
        const inputId = `admin-game-request-${field.name}`;

        label.htmlFor = inputId;
        label.textContent = field.label;

        let input;

        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 4;
        } else {
            input = document.createElement('input');
            input.type = field.type;
        }

        input.id = inputId;
        input.name = field.name;
        input.required = field.required;

        if (field.min !== undefined) {
            input.min = String(field.min);
        }

        if (field.type === 'number') {
            input.step = '1';
        }

        // Les informations de la demande préremplissent les champs concernés.
        const value = field.name === 'name'
            ? request.name
            : field.name === 'publisher'
                ? request.publisher
                : field.name === 'description'
                    ? request.description
                    : field.value;

        input.value = value === null || value === undefined
            ? ''
            : String(value);

        wrapper.append(label, input);

        return wrapper;
    }

    /**
     * Accepte la demande et crée le jeu dans le catalogue.
     */
    async function processAcceptance(
        request,
        form,
        acceptButton,
        rejectButton
    ) {
        if (isProcessing) {
            return;
        }

        if (!form.reportValidity()) {
            return;
        }

        const formData = new FormData(form);

        const gameData = {
            name: String(formData.get('name')).trim(),
            publisher: String(formData.get('publisher')).trim(),
            description: String(formData.get('description')).trim(),
            imageFile: formData.get('imageFile'),
            minPlayers: Number(formData.get('minPlayers')),
            maxPlayers: Number(formData.get('maxPlayers')),
            minimumAge: Number(formData.get('minimumAge')),
            duration: Number(formData.get('duration'))
        };

        if (
            gameData.minPlayers < 1
            || gameData.maxPlayers < gameData.minPlayers
            || gameData.minimumAge < 0
            || gameData.duration < 1
        ) {
            setFeedback(
                'Vérifiez les nombres de joueurs, l’âge minimum et la durée.',
                'error'
            );
            return;
        }

        if (
            gameData.imageFile instanceof File
            && gameData.imageFile.size > 0
            && !ALLOWED_IMAGE_TYPES.includes(gameData.imageFile.type)
        ) {
            setFeedback(
                'Le fichier doit être une image JPG, PNG, WEBP ou GIF.',
                'error'
            );
            return;
        }

        if (
            gameData.imageFile instanceof File
            && gameData.imageFile.size > MAX_IMAGE_SIZE
        ) {
            setFeedback(
                'L’image ne doit pas dépasser 5 Mo.',
                'error'
            );
            return;
        }

        const confirmed = window.confirm(
            `Confirmer l’ajout de « ${gameData.name} » au catalogue ?`
        );

        if (!confirmed) {
            return;
        }

        setProcessing(true, acceptButton, rejectButton);

        try {
            await acceptGameRequest(request.id, gameData);

            setFeedback(
                `La demande « ${gameData.name} » a été acceptée et le jeu a été ajouté.`,
                'success'
            );

            selectedRequestId = null;
            await loadRequests();

        } catch (error) {
            console.error(
                'Erreur lors de l’acceptation de la demande :',
                error
            );

            setFeedback(
                error.message || 'Impossible d’accepter cette demande.',
                'error'
            );

            setProcessing(false, acceptButton, rejectButton);
        }
    }

    /**
     * Rejette une demande en attente.
     */
    async function processRejection(request) {
        if (isProcessing) {
            return;
        }

        const confirmed = window.confirm(
            `Confirmer le rejet de la demande « ${request.name} » ?`
        );

        if (!confirmed) {
            return;
        }

        isProcessing = true;

        try {
            await rejectGameRequest(request.id);

            setFeedback(
                `La demande « ${request.name} » a été rejetée.`,
                'success'
            );

            selectedRequestId = null;
            await loadRequests();

        } catch (error) {
            console.error(
                'Erreur lors du rejet de la demande :',
                error
            );

            setFeedback(
                error.message || 'Impossible de rejeter cette demande.',
                'error'
            );

        } finally {
            isProcessing = false;
        }
    }

    /**
     * Affiche les métadonnées sous forme de libellé et de valeur.
     */
    function appendMetadata(parent, labelText, valueText) {
        const item = document.createElement('div');
        item.classList.add('admin-game-requests-metadata-item');

        const label = document.createElement('span');
        label.classList.add('admin-game-requests-metadata-label');
        label.textContent = labelText;

        const value = document.createElement('span');
        value.classList.add('admin-game-requests-metadata-value');
        value.textContent = valueText;

        item.append(label, value);
        parent.append(item);
    }

    /**
     * Crée un badge d'état.
     */
    function createStatusBadge(status) {
        const badge = document.createElement('span');
        badge.classList.add('admin-game-request-status');

        const labels = {
            pending: 'En attente',
            accepted: 'Acceptée',
            rejected: 'Rejetée'
        };

        badge.textContent = labels[status] || 'État inconnu';
        badge.classList.add(`status-${status || 'unknown'}`);

        return badge;
    }

    /**
     * Formate une date sans planter si elle est absente ou invalide.
     */
    function formatDate(value) {
        if (!value) {
            return 'Date inconnue';
        }

        const date = new Date(value.replace(' ', 'T'));

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('fr-FR', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    }

    /**
     * Affiche un message de statut.
     */
    function setFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = 'admin-game-requests-feedback';
        feedback.classList.add(`feedback-${type}`);
        feedback.hidden = !message;
    }

    /**
     * Désactive les boutons pendant une opération.
     */
    function setProcessing(processing, acceptButton, rejectButton) {
        isProcessing = processing;
        acceptButton.disabled = processing;
        rejectButton.disabled = processing;

        acceptButton.textContent = processing
            ? 'Traitement en cours...'
            : 'Accepter et ajouter le jeu';
    }

    return page;
}