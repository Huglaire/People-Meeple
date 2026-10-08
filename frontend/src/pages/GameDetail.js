// Crée la page de détail d'un jeu

import { getGameBySlug } from '../api/gamesApi.js';
import { navigateTo } from '../router/router.js';

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
    publisherValue.textContent = game.publisher;

    publisher.append(publisherLabel, publisherValue);

    const informationBlock = createInformationBlock(game);
    const libraryMenu = createLibraryMenu();

    information.append(
        title,
        publisher,
        informationBlock,
        libraryMenu
    );

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
    value.textContent = valueText;

    content.append(label, value);
    information.append(icon, content);

    return information;
}

// Crée le menu permettant de choisir le statut du jeu
function createLibraryMenu() {
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

    const successMessage = document.createElement('p');
    successMessage.classList.add('game-detail-library-success');
    successMessage.hidden = true;

    const successIcon = document.createElement('i');
    successIcon.classList.add('bi', 'bi-check-circle');
    successIcon.setAttribute('aria-hidden', 'true');

    const successText = document.createElement('span');

    successMessage.append(successIcon, successText);

    const options = [
        'Ajouter à ma ludothèque',
        'Je connais les règles du jeu',
        'Ajouter à ma ludothèque + je connais les règles'
    ];

    let selectedOption = null;

    options.forEach((optionText) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.classList.add('game-detail-library-option');
        option.textContent = optionText;

        option.addEventListener('click', () => {
            selectedOption = optionText;
            buttonText.textContent = optionText;
            validateButton.disabled = false;

            successMessage.hidden = true;

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

    validateButton.addEventListener('click', () => {
        if (!selectedOption) {
            return;
        }

        successText.textContent = createSuccessMessage(selectedOption);
        successMessage.hidden = false;
    });

    function closeLibraryMenu() {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        container.classList.remove('is-open');
    }

    actions.append(button, validateButton);
    container.append(actions, menu, successMessage);

    return container;
}

// Crée le message affiché après validation
function createSuccessMessage(selectedOption) {
    if (selectedOption === 'Ajouter à ma ludothèque') {
        return 'Le jeu a bien été ajouté à votre ludothèque.';
    }

    if (selectedOption === 'Je connais les règles du jeu') {
        return 'Vous connaissez maintenant les règles de ce jeu.';
    }

    return 'Le jeu a été ajouté à votre ludothèque et vous connaissez les règles.';
}

// Crée la description du jeu
function createDescriptionSection(game) {
    const section = document.createElement('section');
    section.classList.add('game-detail-description');

    const title = document.createElement('h2');
    title.textContent = 'Description';

    const description = document.createElement('p');
    description.textContent = game.description;

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