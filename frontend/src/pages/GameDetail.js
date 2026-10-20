// Crée la page de détail d'un jeu

import { getGameBySlug } from '../api/gamesApi.js';
import { addGameToLibrary } from '../api/userGamesApi.js';
import { navigateTo } from '../router/router.js';
import { getToken, isAuthenticated } from '../services/authService.js';

import '../css/game-detail.css';

export function createGameDetailPage(slug) {
    const page = document.createElement('main');
    page.classList.add('game-detail-page');

    const container = document.createElement('div');
    container.classList.add('game-detail-container');

    const backLink = document.createElement('a');
    backLink.href = '/jeux';
    backLink.classList.add('game-detail-back');
    backLink.textContent = 'Retour aux jeux';

    backLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/jeux');
    });

    const loading = document.createElement('p');
    loading.textContent = 'Chargement du jeu...';

    container.append(backLink, loading);
    page.append(container);

    loadGame(container, loading, slug);

    return page;
}

// Récupère le jeu depuis l'API
async function loadGame(container, loading, slug) {
    try {
        const game = await getGameBySlug(slug);

        loading.remove();

        const card = createGameCard(game);
        const descriptionSection = createDescriptionSection(game);

        container.append(card, descriptionSection);
    } catch (error) {
        loading.remove();

        const errorPage = createGameNotFoundContent();

        container.append(errorPage);

        console.error(error);
    }
}

// Crée la carte principale du jeu
function createGameCard(game) {
    const card = document.createElement('article');
    card.classList.add('game-detail-card');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('game-detail-image');

    const image = document.createElement('img');
    image.src = game.image;
    image.alt = `Boîte du jeu ${game.name}`;

    imageContainer.append(image);

    const information = document.createElement('div');
    information.classList.add('game-detail-information');

    const title = document.createElement('h1');
    title.textContent = game.name;

    const publisher = document.createElement('p');
    publisher.classList.add('game-detail-publisher');

    const publisherLabel = document.createElement('span');
    publisherLabel.textContent = 'Éditeur :';

    const publisherValue = document.createElement('strong');
    publisherValue.textContent = game.publisher || 'Non renseigné';

    publisher.append(publisherLabel, publisherValue);

    const informationBlock = createInformationBlock(game);

    information.append(title, publisher, informationBlock);

    // Seuls les membres connectés peuvent modifier leur ludothèque.
    if (isAuthenticated()) {
        information.append(createLibraryMenu(game));
    }

    card.append(imageContainer, information);

    return card;
}

// Crée le bloc regroupant les informations principales du jeu
function createInformationBlock(game) {
    const block = document.createElement('div');
    block.classList.add('game-detail-info-block');

    const title = document.createElement('h2');
    title.textContent = 'Informations du jeu';

    const list = document.createElement('div');
    list.classList.add('game-detail-info-list');

    list.append(
        createGameInformation('bi-people', 'Joueurs', game.players),
        createGameInformation('bi-clock', 'Durée', game.duration),
        createGameInformation('bi-person', 'Âge minimum', game.minimumAge),
        createGameInformation('bi-building', 'Éditeur', game.publisher)
    );

    block.append(title, list);

    return block;
}

// Crée une ligne d'information du jeu
function createGameInformation(iconName, labelText, valueText) {
    const information = document.createElement('div');
    information.classList.add('game-detail-info');

    const icon = document.createElement('i');
    icon.classList.add('bi', iconName);
    icon.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');

    const label = document.createElement('span');
    label.textContent = labelText;

    const value = document.createElement('strong');
    value.textContent = valueText ?? 'Non renseigné';

    content.append(label, value);
    information.append(icon, content);

    return information;
}

// Crée le menu permettant de choisir le statut du jeu
function createLibraryMenu(game) {
    const container = document.createElement('div');
    container.classList.add('game-detail-library-menu');

    const actions = document.createElement('div');
    actions.classList.add('game-detail-library-actions');

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('game-detail-library-button');
    button.setAttribute('aria-expanded', 'false');

    const buttonText = document.createElement('span');
    buttonText.textContent = 'Choisir une action';

    const buttonArrow = document.createElement('i');
    buttonArrow.classList.add('bi', 'bi-chevron-down');
    buttonArrow.setAttribute('aria-hidden', 'true');

    button.append(buttonText, buttonArrow);

    const validateButton = document.createElement('button');
    validateButton.type = 'button';
    validateButton.classList.add('game-detail-library-validate');
    validateButton.textContent = 'Valider';
    validateButton.disabled = true;

    const menu = document.createElement('div');
    menu.classList.add('game-detail-library-options');
    menu.hidden = true;

    const feedback = document.createElement('p');
    feedback.classList.add('game-detail-library-success');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.hidden = true;

    const feedbackIcon = document.createElement('i');
    feedbackIcon.setAttribute('aria-hidden', 'true');

    const feedbackText = document.createElement('span');

    feedback.append(feedbackIcon, feedbackText);

    const options = [
        {
            label: 'Je possède ce jeu',
            owns: true,
            knowsRules: false
        },
        {
            label: 'Je connais les règles du jeu',
            owns: false,
            knowsRules: true
        },
        {
            label: 'Je possède ce jeu + je connais les règles',
            owns: true,
            knowsRules: true
        }
    ];

    let selectedOption = null;
    let isSubmitting = false;

    options.forEach((optionData) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.classList.add('game-detail-library-option');
        option.textContent = optionData.label;

        option.addEventListener('click', () => {
            selectedOption = optionData;
            buttonText.textContent = optionData.label;
            validateButton.disabled = false;

            feedback.hidden = true;
            feedback.classList.remove('is-error', 'is-success');

            closeLibraryMenu();
        });

        menu.append(option);
    });

    button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
            closeLibraryMenu();
            return;
        }

        menu.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        container.classList.add('is-open');
    });

    validateButton.addEventListener('click', async () => {
        if (!selectedOption || isSubmitting) {
            return;
        }

        const token = getToken();

        if (!token) {
            navigateTo('/connexion');
            return;
        }

        isSubmitting = true;
        validateButton.disabled = true;
        button.disabled = true;

        feedback.hidden = true;
        feedback.classList.remove('is-error', 'is-success');
        validateButton.textContent = 'Enregistrement...';

        try {
            await addGameToLibrary(
                token,
                game.id,
                selectedOption.owns,
                selectedOption.knowsRules
            );

            feedbackIcon.className = 'bi bi-check-circle';
            feedbackText.textContent =
                'Le jeu a bien été ajouté à votre ludothèque.';
            feedback.classList.add('is-success');
            feedback.hidden = false;

            // Empêche une seconde tentative d'ajout depuis cette fiche.
            buttonText.textContent = 'Jeu ajouté à la ludothèque';
            selectedOption = null;
        } catch (error) {
            console.error(
                'Impossible d’ajouter le jeu à la ludothèque.',
                error
            );

            feedbackIcon.className = 'bi bi-exclamation-circle';
            feedbackText.textContent =
                error.message ||
                'Impossible d’ajouter ce jeu à votre ludothèque.';
            feedback.classList.add('is-error');
            feedback.hidden = false;

            // Autorise une nouvelle tentative après un échec.
            validateButton.disabled = false;
        } finally {
            isSubmitting = false;
            button.disabled = false;
            validateButton.textContent = 'Valider';

            // Ne réactive la validation que si un choix reste disponible.
            if (selectedOption) {
                validateButton.disabled = false;
            }
        }
    });

    function closeLibraryMenu() {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        container.classList.remove('is-open');
    }

    actions.append(button, validateButton);
    container.append(actions, menu, feedback);

    return container;
}

// Crée la description du jeu
function createDescriptionSection(game) {
    const section = document.createElement('section');
    section.classList.add('game-detail-description');

    const title = document.createElement('h2');
    title.textContent = 'Description';

    const description = document.createElement('p');
    description.textContent =
        game.description || 'Aucune description disponible.';

    section.append(title, description);

    return section;
}

// Crée le contenu affiché lorsqu'un jeu n'existe pas
function createGameNotFoundContent() {
    const container = document.createElement('div');

    const title = document.createElement('h1');
    title.textContent = 'Jeu introuvable';

    const link = document.createElement('a');
    link.href = '/jeux';
    link.classList.add('game-detail-back');
    link.textContent = 'Retour aux jeux';

    link.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/jeux');
    });

    container.append(title, link);

    return container;
    }