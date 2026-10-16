// Page d'administration du catalogue des jeux

import {
    getAdminGames,
    createAdminGame,
    updateAdminGame,
    deactivateAdminGame,
    reactivateAdminGame
} from '../api/adminGamesApi.js';

import { navigateTo } from '../router/router.js';
import { isAdmin } from '../services/authService.js';

import '../css/admin-games.css';

const GAME_FIELDS = [
    {
        name: 'name',
        label: 'Nom du jeu',
        type: 'text',
        required: true,
        maxLength: 150
    },
    {
        name: 'publisher',
        label: 'Éditeur',
        type: 'text',
        required: true,
        maxLength: 100
    },
    {
        name: 'image',
        label: 'URL ou chemin de l’image',
        type: 'text',
        required: true,
        maxLength: 255
    },
    {
        name: 'minPlayers',
        label: 'Nombre minimum de joueurs',
        type: 'number',
        required: true,
        min: 1,
        max: 100
    },
    {
        name: 'maxPlayers',
        label: 'Nombre maximum de joueurs',
        type: 'number',
        required: true,
        min: 1,
        max: 100
    },
    {
        name: 'minimumAge',
        label: 'Âge minimum conseillé',
        type: 'number',
        required: true,
        min: 0,
        max: 120
    },
    {
        name: 'duration',
        label: 'Durée moyenne (minutes)',
        type: 'number',
        required: true,
        min: 1,
        max: 1000
    }
];

export function createAdminGamesPage() {
    const page = document.createElement('main');
    page.classList.add('admin-games-page');

    if (!isAdmin()) {
        const message = document.createElement('p');
        message.classList.add('admin-games-message');
        message.textContent =
            'Vous devez être administrateur pour accéder à cette page.';

        page.append(message);
        return page;
    }

    const container = document.createElement('div');
    container.classList.add('admin-games-container');

    const backLink = document.createElement('a');
    backLink.classList.add('admin-games-back');
    backLink.href = '/admin';
    backLink.textContent = '← Retour au tableau de bord';

    backLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/admin');
    });

    const header = document.createElement('header');
    header.classList.add('admin-games-header');

    const eyebrow = document.createElement('p');
    eyebrow.classList.add('admin-games-eyebrow');
    eyebrow.textContent = 'ADMINISTRATION';

    const title = document.createElement('h1');
    title.textContent = 'Gestion des jeux';

    const introduction = document.createElement('p');
    introduction.textContent =
        'Consultez le catalogue, ajoutez des jeux et gérez leur disponibilité.';

    header.append(eyebrow, title, introduction);

    const toolbar = document.createElement('div');
    toolbar.classList.add('admin-games-toolbar');

    const searchLabel = document.createElement('label');
    searchLabel.classList.add('admin-games-search');

    const searchText = document.createElement('span');
    searchText.textContent = 'Rechercher un jeu';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Nom du jeu ou éditeur…';
    searchInput.setAttribute(
        'aria-label',
        'Rechercher par nom de jeu ou éditeur'
    );

    searchLabel.append(searchText, searchInput);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.classList.add('admin-games-primary-button');
    addButton.textContent = '+ Ajouter un jeu';

    toolbar.append(searchLabel, addButton);

    // Filtres pour les jeux actifs et désactivés.
    const filters = document.createElement('div');
    filters.classList.add('admin-games-filters');
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', 'Filtrer les jeux par état');

    const activeFilter = createFilterButton('Actifs', true);
    const inactiveFilter = createFilterButton('Désactivés', false);

    filters.append(activeFilter, inactiveFilter);

    const feedback = document.createElement('p');
    feedback.classList.add('admin-games-feedback');
    feedback.setAttribute('role', 'status');
    feedback.hidden = true;

    const content = document.createElement('section');
    content.classList.add('admin-games-content');
    content.setAttribute('aria-label', 'Catalogue des jeux');

    const count = document.createElement('p');
    count.classList.add('admin-games-count');
    count.textContent = 'Chargement du catalogue…';

    const grid = document.createElement('div');
    grid.classList.add('admin-games-grid');
    grid.setAttribute('aria-live', 'polite');

    content.append(count, grid);
    container.append(backLink, header, toolbar, filters, feedback, content);
    page.append(container);

    let games = [];
    let showActive = true;

    // Crée un bouton de filtre.
    function createFilterButton(label, active) {
        const button = document.createElement('button');

        button.type = 'button';
        button.classList.add('admin-games-filter');
        button.textContent = label;
        button.setAttribute('aria-pressed', String(active));

        button.addEventListener('click', () => {
            showActive = active;

            activeFilter.classList.toggle('is-selected', showActive);
            inactiveFilter.classList.toggle('is-selected', !showActive);

            activeFilter.setAttribute(
                'aria-pressed',
                String(showActive)
            );

            inactiveFilter.setAttribute(
                'aria-pressed',
                String(!showActive)
            );

            renderGames();
        });

        button.classList.toggle('is-selected', active);

        return button;
    }

    function showFeedback(message, isError = false) {
        feedback.textContent = message;
        feedback.hidden = false;
        feedback.classList.toggle('is-error', isError);
        feedback.classList.toggle('is-success', !isError);
    }

    function clearFeedback() {
        feedback.textContent = '';
        feedback.hidden = true;
        feedback.classList.remove('is-error', 'is-success');
    }

    // Filtre les jeux selon leur état et la recherche.
    function renderGames() {
        grid.replaceChildren();

        const query = normalizeText(searchInput.value);

        const filteredGames = games
            .filter((game) => Boolean(game.isActive) === showActive)
            .filter((game) => {
                return (
                    normalizeText(game.name).includes(query)
                    || normalizeText(game.publisher).includes(query)
                );
            })
            .sort((a, b) => {
                return String(a.name || '').localeCompare(
                    String(b.name || ''),
                    'fr',
                    { sensitivity: 'base' }
                );
            });

        const stateLabel = showActive ? 'actif' : 'désactivé';

        count.textContent =
            `${filteredGames.length} jeu${filteredGames.length > 1 ? 'x' : ''} ${stateLabel}${filteredGames.length > 1 ? 's' : ''}`;

        if (filteredGames.length === 0) {
            const empty = document.createElement('div');
            empty.classList.add('admin-games-empty');

            const emptyTitle = document.createElement('h2');
            emptyTitle.textContent = query
                ? 'Aucun résultat'
                : showActive
                    ? 'Aucun jeu actif'
                    : 'Aucun jeu désactivé';

            const emptyText = document.createElement('p');
            emptyText.textContent = query
                ? 'Essaie avec un autre nom de jeu ou d’éditeur.'
                : showActive
                    ? 'Tu peux ajouter un jeu au catalogue.'
                    : 'Les jeux désactivés apparaîtront ici.';

            empty.append(emptyTitle, emptyText);
            grid.append(empty);
            return;
        }

        filteredGames.forEach((game) => {
            grid.append(createGameCard(game));
        });
    }

    // Crée une carte de jeu.
    function createGameCard(game) {
        const card = document.createElement('article');
        card.classList.add('admin-game-card');

        if (!game.isActive) {
            card.classList.add('admin-game-card-inactive');
        }

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('admin-game-card-image');

        if (game.image) {
            const image = document.createElement('img');
            image.src = getImageUrl(game.image);
            image.alt = `Boîte du jeu ${game.name || ''}`;
            image.loading = 'lazy';

            image.addEventListener('error', () => {
                image.remove();
                imageContainer.classList.add('image-unavailable');

                const placeholder = document.createElement('span');
                placeholder.textContent = 'Image indisponible';
                imageContainer.append(placeholder);
            }, { once: true });

            imageContainer.append(image);
        } else {
            imageContainer.classList.add('image-unavailable');

            const placeholder = document.createElement('span');
            placeholder.textContent = 'Aucune image';
            imageContainer.append(placeholder);
        }

        const body = document.createElement('div');
        body.classList.add('admin-game-card-body');

        const gameTitle = document.createElement('h2');
        gameTitle.textContent = game.name || 'Jeu sans nom';

        const status = document.createElement('span');
        status.classList.add('admin-game-status');
        status.classList.add(
            game.isActive ? 'is-active' : 'is-inactive'
        );
        status.textContent = game.isActive ? 'Actif' : 'Désactivé';

        const publisher = document.createElement('p');
        publisher.classList.add('admin-game-card-publisher');
        publisher.textContent = game.publisher || 'Éditeur non renseigné';

        const details = document.createElement('ul');
        details.classList.add('admin-game-card-details');

        const playerDetail = document.createElement('li');
        playerDetail.textContent =
            `${game.minPlayers} à ${game.maxPlayers} joueurs`;

        const ageDetail = document.createElement('li');
        ageDetail.textContent = `À partir de ${game.minimumAge} ans`;

        const durationDetail = document.createElement('li');
        durationDetail.textContent = `${game.duration} minutes`;

        details.append(playerDetail, ageDetail, durationDetail);

        const actions = document.createElement('div');
        actions.classList.add('admin-game-card-actions');

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.classList.add('admin-games-secondary-button');
        editButton.textContent = 'Modifier';

        editButton.addEventListener('click', () => {
            openGameForm(game);
        });

        const stateButton = document.createElement('button');
        stateButton.type = 'button';

        if (game.isActive) {
            stateButton.classList.add('admin-games-danger-button');
            stateButton.textContent = 'Désactiver';

            stateButton.addEventListener('click', async () => {
                const confirmed = window.confirm(
                    `Veux-tu vraiment désactiver le jeu « ${game.name} » ?`
                );

                if (!confirmed) {
                    return;
                }

                stateButton.disabled = true;
                clearFeedback();

                try {
                    await deactivateAdminGame(game.id);
                    await loadGames();

                    showFeedback(
                        `Le jeu « ${game.name} » a été désactivé.`
                    );
                } catch (error) {
                    showFeedback(
                        error.message || 'Impossible de désactiver ce jeu.',
                        true
                    );

                    stateButton.disabled = false;
                }
            });
        } else {
            stateButton.classList.add('admin-games-reactivate-button');
            stateButton.textContent = 'Réactiver';

            stateButton.addEventListener('click', async () => {
                const confirmed = window.confirm(
                    `Veux-tu réactiver le jeu « ${game.name} » ? Il redeviendra disponible dans le catalogue public.`
                );

                if (!confirmed) {
                    return;
                }

                stateButton.disabled = true;
                clearFeedback();

                try {
                    await reactivateAdminGame(game.id);
                    await loadGames();

                    showFeedback(
                        `Le jeu « ${game.name} » a été réactivé.`
                    );
                } catch (error) {
                    showFeedback(
                        error.message || 'Impossible de réactiver ce jeu.',
                        true
                    );

                    stateButton.disabled = false;
                }
            });
        }

        actions.append(editButton, stateButton);
        body.append(gameTitle, status, publisher, details, actions);
        card.append(imageContainer, body);

        return card;
    }

    // Ouvre le formulaire d'ajout ou de modification.
    function openGameForm(game = null) {
        clearFeedback();

        const isEditing = Boolean(game);

        const dialog = document.createElement('dialog');
        dialog.classList.add('admin-games-dialog');

        const form = document.createElement('form');
        form.classList.add('admin-games-form');

        const formHeader = document.createElement('div');
        formHeader.classList.add('admin-games-form-header');

        const formTitle = document.createElement('h2');
        formTitle.textContent = isEditing
            ? 'Modifier un jeu'
            : 'Ajouter un jeu';

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.classList.add('admin-games-close-button');
        closeButton.textContent = '×';
        closeButton.setAttribute('aria-label', 'Fermer le formulaire');

        closeButton.addEventListener('click', () => {
            dialog.close();
        });

        formHeader.append(formTitle, closeButton);

        const fields = document.createElement('div');
        fields.classList.add('admin-games-form-grid');

        GAME_FIELDS.forEach((definition) => {
            const field = document.createElement('div');
            field.classList.add('admin-games-field');

            const label = document.createElement('label');
            label.htmlFor = `admin-game-${definition.name}`;
            label.textContent = definition.label;

            const input = document.createElement('input');
            input.id = label.htmlFor;
            input.name = definition.name;
            input.type = definition.type;
            input.required = definition.required;

            if (definition.maxLength) {
                input.maxLength = definition.maxLength;
            }

            if (definition.min !== undefined) {
                input.min = String(definition.min);
            }

            if (definition.max !== undefined) {
                input.max = String(definition.max);
            }

            if (definition.type === 'number') {
                input.step = '1';
            }

            input.value = game?.[definition.name] ?? '';

            field.append(label, input);
            fields.append(field);
        });

        const descriptionField = document.createElement('div');
        descriptionField.classList.add(
            'admin-games-field',
            'admin-games-field-full'
        );

        const descriptionLabel = document.createElement('label');
        descriptionLabel.htmlFor = 'admin-game-description';
        descriptionLabel.textContent = 'Description';

        const descriptionInput = document.createElement('textarea');
        descriptionInput.id = 'admin-game-description';
        descriptionInput.name = 'description';
        descriptionInput.required = true;
        descriptionInput.rows = 4;
        descriptionInput.maxLength = 10000;
        descriptionInput.value = game?.description ?? '';

        descriptionField.append(descriptionLabel, descriptionInput);
        fields.append(descriptionField);

        const formFeedback = document.createElement('p');
        formFeedback.classList.add('admin-games-form-feedback');
        formFeedback.setAttribute('role', 'alert');
        formFeedback.hidden = true;

        const formActions = document.createElement('div');
        formActions.classList.add('admin-games-form-actions');

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.classList.add('admin-games-secondary-button');
        cancelButton.textContent = 'Annuler';

        cancelButton.addEventListener('click', () => {
            dialog.close();
        });

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.classList.add('admin-games-primary-button');
        submitButton.textContent = isEditing
            ? 'Enregistrer les modifications'
            : 'Ajouter au catalogue';

        formActions.append(cancelButton, submitButton);
        form.append(formHeader, fields, formFeedback, formActions);
        dialog.append(form);

        dialog.addEventListener('close', () => {
            dialog.remove();
            addButton.focus();
        }, { once: true });

        document.body.append(dialog);
        dialog.showModal();

        form.querySelector('input')?.focus();

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!form.reportValidity()) {
                return;
            }

            const formData = new FormData(form);
            const gameData = {};

            GAME_FIELDS.forEach((definition) => {
                const value = formData.get(definition.name);

                gameData[definition.name] =
                    definition.type === 'number'
                        ? Number(value)
                        : String(value).trim();
            });

            gameData.description = String(
                formData.get('description') || ''
            ).trim();

            if (
                gameData.minPlayers > gameData.maxPlayers
                || gameData.minPlayers < 1
                || gameData.maxPlayers < 1
                || gameData.minimumAge < 0
                || gameData.duration < 1
            ) {
                formFeedback.textContent =
                    'Vérifie les nombres de joueurs, l’âge minimum et la durée.';
                formFeedback.hidden = false;
                return;
            }

            submitButton.disabled = true;
            cancelButton.disabled = true;
            closeButton.disabled = true;

            submitButton.textContent = isEditing
                ? 'Enregistrement…'
                : 'Ajout…';

            formFeedback.hidden = true;

            try {
                if (isEditing) {
                    await updateAdminGame(game.id, gameData);
                } else {
                    await createAdminGame(gameData);
                }

                dialog.close();
                await loadGames();

                showFeedback(
                    isEditing
                        ? 'Le jeu a été modifié.'
                        : 'Le jeu a été ajouté au catalogue.'
                );
            } catch (error) {
                formFeedback.textContent =
                    error.message || 'Une erreur est survenue.';
                formFeedback.hidden = false;

                submitButton.disabled = false;
                cancelButton.disabled = false;
                closeButton.disabled = false;

                submitButton.textContent = isEditing
                    ? 'Enregistrer les modifications'
                    : 'Ajouter au catalogue';
            }
        });
    }

    // Recharge tous les jeux, quel que soit leur état.
    async function loadGames() {
        grid.replaceChildren();

        const loading = document.createElement('p');
        loading.classList.add('admin-games-loading');
        loading.textContent = 'Chargement du catalogue…';

        grid.append(loading);
        count.textContent = '';

        try {
            games = await getAdminGames();
            renderGames();
        } catch (error) {
            console.error('Erreur de chargement du catalogue :', error);

            grid.replaceChildren();

            const errorMessage = document.createElement('p');
            errorMessage.classList.add('admin-games-error');
            errorMessage.textContent =
                error.message || 'Impossible de charger le catalogue.';

            const retryButton = document.createElement('button');
            retryButton.type = 'button';
            retryButton.classList.add('admin-games-secondary-button');
            retryButton.textContent = 'Réessayer';

            retryButton.addEventListener('click', loadGames);

            grid.append(errorMessage, retryButton);
            count.textContent = 'Catalogue indisponible';
        }
    }

    searchInput.addEventListener('input', renderGames);

    addButton.addEventListener('click', () => {
        openGameForm();
    });

    loadGames();

    return page;
}

/**
 * Normalise un texte pour la recherche, sans tenir compte des accents.
 */
function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .trim();
}

/**
 * Construit l'URL d'une image de jeu.
 */
function getImageUrl(image) {
    if (!image) {
        return '';
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    return new URL(
        image.startsWith('/') ? image : `/${image}`,
        'http://127.0.0.1:8000'
    ).href;
}