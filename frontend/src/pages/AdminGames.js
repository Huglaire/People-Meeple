// Page d'administration du catalogue des jeux

import {
    getAdminGames,
    createAdminGame,
    updateAdminGame,
    deactivateAdminGame,
    reactivateAdminGame
} from '../api/adminGamesApi.js';

import { isAdmin } from '../services/authService.js';

import '../css/admin-games.css';

const API_BASE_URL = '';

const IMAGE_PLACEHOLDER = '/images/meeple-default.png';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
];

let games = [];
let searchTerm = '';
let statusFilter = 'all';
let currentEditingGame = null;
let selectedImageFile = null;
let previewObjectUrl = null;
let isSaving = false;

/**
 * Crée la page d'administration du catalogue.
 *
 * @returns {HTMLElement}
 */
export function createAdminGamesPage() {
    const page = document.createElement('main');
    page.classList.add('admin-games-page');

    if (!isAdmin()) {
        const message = document.createElement('p');
        message.classList.add('admin-games-message');
        message.textContent = 'Accès réservé aux administrateurs.';

        page.append(message);

        return page;
    }

    const header = createPageHeader();
    const toolbar = createToolbar();
    const message = document.createElement('div');

    message.classList.add('admin-games-feedback');
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');

    const list = document.createElement('section');
    list.classList.add('admin-games-list');
    list.setAttribute('aria-label', 'Catalogue des jeux');

    page.append(header, toolbar, message, list);

    loadGames(list, message);

    return page;
}

/**
 * Crée l'en-tête de la page.
 *
 * @returns {HTMLElement}
 */
function createPageHeader() {
    const header = document.createElement('header');
    header.classList.add('admin-games-header');

    const content = document.createElement('div');

    const title = document.createElement('h1');
    title.textContent = 'Gestion du catalogue';

    const description = document.createElement('p');
    description.textContent =
        'Ajoutez, modifiez, désactivez ou réactivez les jeux de People Meeple.';

    content.append(title, description);

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.classList.add('admin-games-back-button');
    backButton.textContent = 'Retour à l’administration';

    backButton.addEventListener('click', () => {
        window.history.pushState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

    header.append(content, backButton);

    return header;
}

/**
 * Crée la barre de recherche, les filtres et le bouton d'ajout.
 *
 * @returns {HTMLElement}
 */
function createToolbar() {
    const toolbar = document.createElement('section');
    toolbar.classList.add('admin-games-toolbar');

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('admin-games-search');

    const searchLabel = document.createElement('label');
    searchLabel.htmlFor = 'admin-games-search-input';
    searchLabel.textContent = 'Rechercher un jeu';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.id = 'admin-games-search-input';
    searchInput.placeholder = 'Nom du jeu ou éditeur';
    searchInput.autocomplete = 'off';

    searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value.trim().toLocaleLowerCase('fr');

        const list = document.querySelector('.admin-games-list');
        const feedback = document.querySelector('.admin-games-feedback');

        if (list && feedback) {
            renderGames(list, feedback);
        }
    });

    searchContainer.append(searchLabel, searchInput);

    const filters = document.createElement('div');
    filters.classList.add('admin-games-filters');

    const filterLabel = document.createElement('label');
    filterLabel.htmlFor = 'admin-games-status-filter';
    filterLabel.textContent = 'Statut';

    const filterSelect = document.createElement('select');
    filterSelect.id = 'admin-games-status-filter';

    const options = [
        { value: 'all', label: 'Tous les jeux' },
        { value: 'active', label: 'Actifs' },
        { value: 'inactive', label: 'Désactivés' }
    ];

    options.forEach((optionData) => {
        const option = document.createElement('option');
        option.value = optionData.value;
        option.textContent = optionData.label;

        filterSelect.append(option);
    });

    filterSelect.value = statusFilter;

    filterSelect.addEventListener('change', () => {
        statusFilter = filterSelect.value;

        const list = document.querySelector('.admin-games-list');
        const feedback = document.querySelector('.admin-games-feedback');

        if (list && feedback) {
            renderGames(list, feedback);
        }
    });

    filters.append(filterLabel, filterSelect);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.classList.add('admin-games-add-button');
    addButton.textContent = 'Ajouter un jeu';

    addButton.addEventListener('click', () => {
        openGameModal();
    });

    toolbar.append(searchContainer, filters, addButton);

    return toolbar;
}

/**
 * Charge le catalogue depuis l'API.
 *
 * @param {HTMLElement} list
 * @param {HTMLElement} feedback
 */
async function loadGames(list, feedback) {
    list.replaceChildren();

    const loading = document.createElement('p');
    loading.classList.add('admin-games-loading');
    loading.textContent = 'Chargement du catalogue…';

    list.append(loading);

    try {
        games = await getAdminGames();

        renderGames(list, feedback);
    } catch (error) {
        list.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.classList.add('admin-games-error');
        errorMessage.textContent =
            error.message || 'Impossible de charger le catalogue.';

        list.append(errorMessage);
    }
}

/**
 * Affiche les jeux correspondant à la recherche et au filtre.
 *
 * @param {HTMLElement} list
 * @param {HTMLElement} feedback
 */
function renderGames(list, feedback) {
    list.replaceChildren();

    const filteredGames = games.filter((game) => {
        const name = String(game.name || '').toLocaleLowerCase('fr');
        const publisher = String(game.publisher || '').toLocaleLowerCase('fr');

        const matchesSearch =
            name.includes(searchTerm) || publisher.includes(searchTerm);

        const isActive = game.isActive !== false;

        const matchesStatus =
            statusFilter === 'all'
            || (statusFilter === 'active' && isActive)
            || (statusFilter === 'inactive' && !isActive);

        return matchesSearch && matchesStatus;
    });

    if (filteredGames.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.classList.add('admin-games-empty');
        emptyMessage.textContent = 'Aucun jeu ne correspond à votre recherche.';

        list.append(emptyMessage);

        return;
    }

    const fragment = document.createDocumentFragment();

    filteredGames.forEach((game) => {
        fragment.append(createGameCard(game, feedback, list));
    });

    list.append(fragment);
}

/**
 * Crée une carte de jeu.
 *
 * @param {Object} game
 * @param {HTMLElement} feedback
 * @param {HTMLElement} list
 * @returns {HTMLElement}
 */
function createGameCard(game, feedback, list) {
    const card = document.createElement('article');
    card.classList.add('admin-game-card');

    const isActive = game.isActive !== false;

    if (!isActive) {
        card.classList.add('admin-game-card-inactive');
    }

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('admin-game-card-image');

    const image = document.createElement('img');
    image.src = getImageUrl(game.image);
    image.alt = `Boîte du jeu ${game.name || ''}`;
    image.loading = 'lazy';

    image.addEventListener('error', () => {
        image.src = IMAGE_PLACEHOLDER;
    }, { once: true });

    imageContainer.append(image);

    const content = document.createElement('div');
    content.classList.add('admin-game-card-content');

    const title = document.createElement('h2');
    title.textContent = game.name || 'Jeu sans nom';

    const publisher = document.createElement('p');
    publisher.classList.add('admin-game-publisher');
    publisher.textContent = game.publisher || 'Éditeur non renseigné';

    const details = document.createElement('p');
    details.classList.add('admin-game-details');
    details.textContent =
        `${game.minPlayers ?? '?'} à ${game.maxPlayers ?? '?'} joueurs`
        + ` • Dès ${game.minimumAge ?? '?'} ans`
        + ` • ${game.duration ?? '?'} min`;

    const status = document.createElement('span');
    status.classList.add('admin-game-status');
    status.classList.add(
        isActive ? 'admin-game-status-active' : 'admin-game-status-inactive'
    );
    status.textContent = isActive ? 'Actif' : 'Désactivé';

    const actions = document.createElement('div');
    actions.classList.add('admin-game-actions');

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.classList.add('admin-game-edit-button');
    editButton.textContent = 'Modifier';

    editButton.addEventListener('click', () => {
        openGameModal(game);
    });

    actions.append(editButton);

    if (isActive) {
        const deactivateButton = document.createElement('button');
        deactivateButton.type = 'button';
        deactivateButton.classList.add('admin-game-deactivate-button');
        deactivateButton.textContent = 'Désactiver';

        deactivateButton.addEventListener('click', async () => {
            await handleDeactivate(game, feedback, list);
        });

        actions.append(deactivateButton);
    } else {
        const reactivateButton = document.createElement('button');
        reactivateButton.type = 'button';
        reactivateButton.classList.add('admin-games-reactivate-button');
        reactivateButton.textContent = 'Réactiver';

        reactivateButton.addEventListener('click', async () => {
            await handleReactivate(game, feedback, list);
        });

        actions.append(reactivateButton);
    }

    content.append(title, publisher, details, status, actions);
    card.append(imageContainer, content);

    return card;
}

/**
 * Ouvre le formulaire de création ou de modification.
 *
 * @param {Object|null} game
 */
function openGameModal(game = null) {
    closeGameModal();

    currentEditingGame = game;
    selectedImageFile = null;

    const overlay = document.createElement('div');
    overlay.classList.add('admin-games-modal-overlay');
    overlay.id = 'admin-games-modal-overlay';

    const modal = document.createElement('section');
    modal.classList.add('admin-games-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute(
        'aria-labelledby',
        'admin-games-modal-title'
    );

    const header = document.createElement('header');
    header.classList.add('admin-games-modal-header');

    const title = document.createElement('h2');
    title.id = 'admin-games-modal-title';
    title.textContent = game ? 'Modifier un jeu' : 'Ajouter un jeu';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.classList.add('admin-games-modal-close');
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Fermer le formulaire');

    closeButton.addEventListener('click', closeGameModal);

    header.append(title, closeButton);

    const form = document.createElement('form');
    form.classList.add('admin-games-form');

    const feedback = document.createElement('p');
    feedback.classList.add('admin-games-form-feedback');
    feedback.setAttribute('role', 'alert');

    // Champs descriptifs du jeu.
    const nameInput = createTextField(
        'name',
        'Nom du jeu',
        game?.name || '',
        true
    );

    const publisherInput = createTextField(
        'publisher',
        'Éditeur',
        game?.publisher || '',
        true
    );

    const minPlayersInput = createNumberField(
        'minPlayers',
        'Nombre minimum de joueurs',
        game?.minPlayers ?? 1,
        1,
        100,
        true
    );

    const maxPlayersInput = createNumberField(
        'maxPlayers',
        'Nombre maximum de joueurs',
        game?.maxPlayers ?? 4,
        1,
        100,
        true
    );

    const minimumAgeInput = createNumberField(
        'minimumAge',
        'Âge minimum',
        game?.minimumAge ?? 8,
        0,
        100,
        true
    );

    const durationInput = createNumberField(
        'duration',
        'Durée en minutes',
        game?.duration ?? 30,
        1,
        1440,
        true
    );

    const descriptionInput = document.createElement('textarea');
    descriptionInput.id = 'admin-game-description';
    descriptionInput.name = 'description';
    descriptionInput.required = true;
    descriptionInput.rows = 5;
    descriptionInput.maxLength = 5000;
    descriptionInput.value = game?.description || '';

    const descriptionLabel = document.createElement('label');
    descriptionLabel.htmlFor = descriptionInput.id;
    descriptionLabel.textContent = 'Description';

    const descriptionGroup = document.createElement('div');
    descriptionGroup.classList.add('admin-games-form-group');
    descriptionGroup.append(descriptionLabel, descriptionInput);

    // Champ de sélection d'image et aperçu.
    const imageGroup = document.createElement('div');
    imageGroup.classList.add('admin-games-form-group');
    imageGroup.classList.add('admin-games-image-group');

    const imageLabel = document.createElement('label');
    imageLabel.htmlFor = 'admin-game-image-file';
    imageLabel.textContent = 'Photo du jeu';

    const imageHelp = document.createElement('p');
    imageHelp.classList.add('admin-games-image-help');
    imageHelp.textContent =
        'Formats acceptés : JPG, PNG, WEBP ou GIF. Taille maximale : 5 Mo.';

    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.id = 'admin-game-image-file';
    imageInput.name = 'imageFile';
    imageInput.accept = 'image/jpeg,image/png,image/webp,image/gif';

    const previewContainer = document.createElement('div');
    previewContainer.classList.add('admin-games-image-preview-container');

    const preview = document.createElement('img');
    preview.classList.add('admin-games-image-preview');
    preview.alt = 'Aperçu de la photo du jeu';
    preview.hidden = true;

    const previewMessage = document.createElement('p');
    previewMessage.classList.add('admin-games-image-preview-message');

    if (game?.image) {
        preview.src = getImageUrl(game.image);
        preview.hidden = false;
        previewMessage.textContent = 'Photo actuelle';

        preview.addEventListener('error', () => {
            preview.hidden = true;
            previewMessage.textContent =
                'La photo actuelle ne peut pas être affichée.';
        }, { once: true });
    } else {
        previewMessage.textContent = 'Aucune photo sélectionnée.';
    }

    previewContainer.append(preview, previewMessage);

    const removeImageButton = document.createElement('button');
    removeImageButton.type = 'button';
    removeImageButton.classList.add('admin-games-image-remove-button');
    removeImageButton.textContent = 'Annuler la nouvelle photo';
    removeImageButton.hidden = true;

    imageInput.addEventListener('change', () => {
        const file = imageInput.files?.[0];

        if (!file) {
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            imageInput.value = '';
            selectedImageFile = null;

            showFormFeedback(
                feedback,
                'Format non accepté. Choisissez une image JPG, PNG, WEBP ou GIF.'
            );

            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            imageInput.value = '';
            selectedImageFile = null;

            showFormFeedback(
                feedback,
                'La photo ne doit pas dépasser 5 Mo.'
            );

            return;
        }

        selectedImageFile = file;

        clearPreviewObjectUrl();

        previewObjectUrl = URL.createObjectURL(file);
        preview.src = previewObjectUrl;
        preview.hidden = false;

        previewMessage.textContent = file.name;
        removeImageButton.hidden = false;

        showFormFeedback(feedback, '');
    });

    removeImageButton.addEventListener('click', () => {
        imageInput.value = '';
        selectedImageFile = null;

        clearPreviewObjectUrl();

        if (game?.image) {
            preview.src = getImageUrl(game.image);
            preview.hidden = false;
            previewMessage.textContent = 'Photo actuelle';
        } else {
            preview.removeAttribute('src');
            preview.hidden = true;
            previewMessage.textContent = 'Aucune photo sélectionnée.';
        }

        removeImageButton.hidden = true;
    });

    imageGroup.append(
        imageLabel,
        imageHelp,
        imageInput,
        previewContainer,
        removeImageButton
    );

    const fieldsGrid = document.createElement('div');
    fieldsGrid.classList.add('admin-games-form-grid');

    fieldsGrid.append(
        nameInput,
        publisherInput,
        minPlayersInput,
        maxPlayersInput,
        minimumAgeInput,
        durationInput
    );

    const actions = document.createElement('div');
    actions.classList.add('admin-games-form-actions');

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('admin-games-form-cancel');
    cancelButton.textContent = 'Annuler';

    cancelButton.addEventListener('click', closeGameModal);

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('admin-games-form-submit');
    submitButton.textContent = game ? 'Enregistrer les modifications' : 'Ajouter le jeu';

    actions.append(cancelButton, submitButton);

    form.append(
        feedback,
        fieldsGrid,
        imageGroup,
        descriptionGroup,
        actions
    );

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        const minPlayers = Number(minPlayersInput.querySelector('input').value);
        const maxPlayers = Number(maxPlayersInput.querySelector('input').value);

        if (minPlayers > maxPlayers) {
            showFormFeedback(
                feedback,
                'Le nombre minimum de joueurs ne peut pas dépasser le nombre maximum.'
            );

            return;
        }

        const gameData = {
            name: nameInput.querySelector('input').value.trim(),
            publisher: publisherInput.querySelector('input').value.trim(),
            minPlayers,
            maxPlayers,
            minimumAge: Number(minimumAgeInput.querySelector('input').value),
            duration: Number(durationInput.querySelector('input').value),
            description: descriptionInput.value.trim()
        };

        if (selectedImageFile) {
            gameData.imageFile = selectedImageFile;
        }

        await handleSaveGame(
            gameData,
            feedback,
            submitButton
        );
    });

    modal.append(header, form);
    overlay.append(modal);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay && !isSaving) {
            closeGameModal();
        }
    });

    document.addEventListener('keydown', handleEscapeKey);

    document.body.append(overlay);

    nameInput.querySelector('input').focus();
}

/**
 * Crée un champ texte.
 *
 * @param {string} name
 * @param {string} labelText
 * @param {string} value
 * @param {boolean} required
 * @returns {HTMLElement}
 */
function createTextField(name, labelText, value, required) {
    const group = document.createElement('div');
    group.classList.add('admin-games-form-group');

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `admin-game-${name}`;
    input.name = name;
    input.value = value;
    input.required = required;
    input.maxLength = 255;

    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = labelText;

    group.append(label, input);

    return group;
}

/**
 * Crée un champ numérique.
 *
 * @param {string} name
 * @param {string} labelText
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {boolean} required
 * @returns {HTMLElement}
 */
function createNumberField(name, labelText, value, min, max, required) {
    const group = document.createElement('div');
    group.classList.add('admin-games-form-group');

    const input = document.createElement('input');
    input.type = 'number';
    input.id = `admin-game-${name}`;
    input.name = name;
    input.value = String(value);
    input.min = String(min);
    input.max = String(max);
    input.required = required;
    input.step = '1';

    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = labelText;

    group.append(label, input);

    return group;
}

/**
 * Enregistre un jeu, nouveau ou modifié.
 *
 * @param {Object} gameData
 * @param {HTMLElement} feedback
 * @param {HTMLButtonElement} submitButton
 */
async function handleSaveGame(gameData, feedback, submitButton) {
    isSaving = true;
    submitButton.disabled = true;

    const previousLabel = submitButton.textContent;
    submitButton.textContent = 'Enregistrement…';

    try {
        if (currentEditingGame) {
            await updateAdminGame(currentEditingGame.id, gameData);
        } else {
            if (!gameData.imageFile) {
                showFormFeedback(
                    feedback,
                    'Veuillez sélectionner une photo pour ce jeu.'
                );

                return;
            }

            await createAdminGame(gameData);
        }

        closeGameModal();

        const list = document.querySelector('.admin-games-list');
        const pageFeedback = document.querySelector('.admin-games-feedback');

        if (list && pageFeedback) {
            showPageFeedback(
                pageFeedback,
                currentEditingGame
                    ? 'Jeu modifié avec succès.'
                    : 'Jeu ajouté avec succès.',
                'success'
            );

            await loadGames(list, pageFeedback);
        }
    } catch (error) {
        showFormFeedback(
            feedback,
            error.message || 'Une erreur est survenue lors de l’enregistrement.'
        );
    } finally {
        isSaving = false;

        if (submitButton.isConnected) {
            submitButton.disabled = false;
            submitButton.textContent = previousLabel;
        }
    }
}

/**
 * Désactive un jeu après confirmation.
 *
 * @param {Object} game
 * @param {HTMLElement} feedback
 * @param {HTMLElement} list
 */
async function handleDeactivate(game, feedback, list) {
    const confirmed = window.confirm(
        `Voulez-vous vraiment désactiver le jeu « ${game.name} » ?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await deactivateAdminGame(game.id);

        showPageFeedback(feedback, 'Jeu désactivé avec succès.', 'success');

        await loadGames(list, feedback);
    } catch (error) {
        showPageFeedback(
            feedback,
            error.message || 'Impossible de désactiver ce jeu.',
            'error'
        );
    }
}

/**
 * Réactive un jeu après confirmation.
 *
 * @param {Object} game
 * @param {HTMLElement} feedback
 * @param {HTMLElement} list
 */
async function handleReactivate(game, feedback, list) {
    const confirmed = window.confirm(
        `Voulez-vous réactiver le jeu « ${game.name} » ?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await reactivateAdminGame(game.id);

        showPageFeedback(feedback, 'Jeu réactivé avec succès.', 'success');

        await loadGames(list, feedback);
    } catch (error) {
        showPageFeedback(
            feedback,
            error.message || 'Impossible de réactiver ce jeu.',
            'error'
        );
    }
}

/**
 * Ferme le formulaire modal et libère les ressources d'aperçu.
 */
function closeGameModal() {
    const overlay = document.getElementById('admin-games-modal-overlay');

    if (overlay) {
        overlay.remove();
    }

    document.removeEventListener('keydown', handleEscapeKey);

    clearPreviewObjectUrl();

    currentEditingGame = null;
    selectedImageFile = null;
    isSaving = false;
}

/**
 * Ferme le formulaire avec la touche Échap.
 *
 * @param {KeyboardEvent} event
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape' && !isSaving) {
        closeGameModal();
    }
}

/**
 * Libère l'URL temporaire créée pour l'aperçu.
 */
function clearPreviewObjectUrl() {
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }
}

/**
 * Convertit un chemin d'image en URL complète.
 *
 * @param {string|null|undefined} image
 * @returns {string}
 */
function getImageUrl(image) {
    if (!image) {
        return IMAGE_PLACEHOLDER;
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    return `${API_BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
}

/**
 * Affiche un message dans le formulaire.
 *
 * @param {HTMLElement} feedback
 * @param {string} message
 */
function showFormFeedback(feedback, message) {
    feedback.textContent = message;
    feedback.hidden = message === '';
}

/**
 * Affiche un message sur la page.
 *
 * @param {HTMLElement} feedback
 * @param {string} message
 * @param {'success'|'error'} type
 */
function showPageFeedback(feedback, message, type) {
    feedback.textContent = message;
    feedback.classList.remove(
        'admin-games-feedback-success',
        'admin-games-feedback-error'
    );

    feedback.classList.add(
        type === 'success'
            ? 'admin-games-feedback-success'
            : 'admin-games-feedback-error'
    );
}