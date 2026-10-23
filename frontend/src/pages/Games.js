// Crée la page de présentation des jeux

import { createGameCard } from '../components/GameCard.js';
import { getGames } from '../api/gamesApi.js';
import { createGameRequest } from '../api/gameRequestsApi.js';

import { getToken } from '../services/authService.js';
import { navigateTo } from '../router/router.js';

import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

import '../css/games.css';

export function createGamesPage() {
    const page = document.createElement('main');
    page.classList.add('games-page');

    const hero = createGamesHero();
    const proposalSection = createGameProposalSection();
    const gamesSection = createGamesSection();

    page.append(hero, proposalSection, gamesSection);

    // Charge les jeux et relie la recherche au catalogue.
    loadGames(gamesSection, hero.searchInput, hero.searchForm);

    return page;
}


// Crée le hero de la page des jeux

function createGamesHero() {
    const section = document.createElement('section');
    section.classList.add('games-hero');

    const content = document.createElement('div');
    content.classList.add('games-hero-content');

    const title = document.createElement('h1');

    const firstLine = document.createElement('span');
    firstLine.textContent = 'Découvre';

    const secondLine = document.createElement('span');
    secondLine.classList.add('heading-highlight');
    secondLine.textContent = 'les jeux';

    title.append(firstLine, secondLine);

    const description = document.createElement('p');
    description.textContent =
        'Découvre les jeux disponibles sur People Meeple et trouve ceux auxquels tu aimerais jouer.';

    const searchForm = document.createElement('form');
    searchForm.classList.add('games-search');

    const searchContainer = document.createElement('div');
    searchContainer.classList.add('games-search-input');

    const searchIcon = document.createElement('i');
    searchIcon.classList.add('bi', 'bi-search');
    searchIcon.setAttribute('aria-hidden', 'true');

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Rechercher un jeu...';
    searchInput.setAttribute('aria-label', 'Rechercher un jeu');

    searchContainer.append(searchIcon, searchInput);

    const searchButton = document.createElement('button');
    searchButton.type = 'submit';
    searchButton.textContent = 'Rechercher';

    searchForm.append(searchContainer, searchButton);

    // Rend la recherche accessible depuis la page principale.
    section.searchInput = searchInput;
    section.searchForm = searchForm;

    content.append(title, description, searchForm);

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('games-hero-image');

    const image = document.createElement('img');
    image.src = ludothequeImage;
    image.alt = 'Ludothèque contenant des jeux de société';

    imageContainer.append(image);

    section.append(content, imageContainer);

    return section;
}


// Crée la section de proposition d'un jeu

function createGameProposalSection() {
    const section = document.createElement('section');
    section.classList.add('game-proposal-section');

    const container = document.createElement('div');
    container.classList.add('game-proposal-container');

    const introduction = document.createElement('div');
    introduction.classList.add('game-proposal-introduction');

    const title = document.createElement('h2');
    title.textContent = 'Tu ne trouves pas un jeu ?';

    const description = document.createElement('p');
    description.textContent =
        'Envoie une demande à notre équipe pour ajouter ton jeu';

    introduction.append(title, description);

    const proposalButton = document.createElement('button');
    proposalButton.type = 'button';
    proposalButton.classList.add('game-proposal-button');
    proposalButton.textContent = 'Proposer un jeu';
    proposalButton.setAttribute('aria-expanded', 'false');

    const formContainer = document.createElement('div');
    formContainer.classList.add('game-proposal-form-container');
    formContainer.hidden = true;

    const formTitle = document.createElement('h3');
    formTitle.textContent = 'Proposer un nouveau jeu';

    const form = document.createElement('form');
    form.classList.add('game-proposal-form');

    // Champ : nom du jeu.
    const nameGroup = document.createElement('div');
    nameGroup.classList.add('game-proposal-field');

    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'game-proposal-name';
    nameLabel.textContent = 'Nom du jeu';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'game-proposal-name';
    nameInput.name = 'name';
    nameInput.maxLength = 255;
    nameInput.required = true;
    nameInput.placeholder = 'Ex. : Cascadia';

    nameGroup.append(nameLabel, nameInput);

    // Champ : éditeur.
    const publisherGroup = document.createElement('div');
    publisherGroup.classList.add('game-proposal-field');

    const publisherLabel = document.createElement('label');
    publisherLabel.htmlFor = 'game-proposal-publisher';
    publisherLabel.textContent = 'Éditeur';

    const publisherInput = document.createElement('input');
    publisherInput.type = 'text';
    publisherInput.id = 'game-proposal-publisher';
    publisherInput.name = 'publisher';
    publisherInput.maxLength = 255;
    publisherInput.required = true;
    publisherInput.placeholder = 'Ex. : Lucky Duck Games';

    publisherGroup.append(publisherLabel, publisherInput);

    // Champ : description.
    const descriptionGroup = document.createElement('div');
    descriptionGroup.classList.add('game-proposal-field');

    const descriptionLabel = document.createElement('label');
    descriptionLabel.htmlFor = 'game-proposal-description';
    descriptionLabel.textContent = 'Description du jeu';

    const descriptionInput = document.createElement('textarea');
    descriptionInput.id = 'game-proposal-description';
    descriptionInput.name = 'description';
    descriptionInput.rows = 5;
    descriptionInput.required = true;
    descriptionInput.maxLength = 5000;
    descriptionInput.placeholder =
        'Présente brièvement le jeu et son principe.';

    descriptionGroup.append(descriptionLabel, descriptionInput);

    // Zone de retour : succès ou erreur.
    const feedback = document.createElement('p');
    feedback.classList.add('game-proposal-feedback');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.hidden = true;

    // Boutons d'action.
    const actions = document.createElement('div');
    actions.classList.add('game-proposal-actions');

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('game-proposal-cancel');
    cancelButton.textContent = 'Annuler';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('game-proposal-submit');
    submitButton.textContent = 'Envoyer la proposition';

    actions.append(cancelButton, submitButton);

    form.append(
        nameGroup,
        publisherGroup,
        descriptionGroup,
        feedback,
        actions
    );

    formContainer.append(formTitle, form);

    // Ouvre ou ferme le formulaire.
    proposalButton.addEventListener('click', () => {
        const token = getToken();

        // La création d'une demande nécessite un compte connecté.
        if (!token) {
            navigateTo('/connexion');
            return;
        }

        const isOpening = formContainer.hidden;

        formContainer.hidden = !isOpening;
        proposalButton.setAttribute(
            'aria-expanded',
            String(isOpening)
        );

        proposalButton.textContent = isOpening
            ? 'Fermer le formulaire'
            : 'Proposer un jeu';

        if (isOpening) {
            nameInput.focus();
        }
    });

    // Ferme le formulaire sans envoyer la demande.
    cancelButton.addEventListener('click', () => {
        form.reset();
        feedback.hidden = true;
        feedback.textContent = '';

        formContainer.hidden = true;
        proposalButton.textContent = 'Proposer un jeu';
        proposalButton.setAttribute('aria-expanded', 'false');
    });

    // Envoie la demande à l'API Symfony.
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        feedback.hidden = true;
        feedback.textContent = '';
        feedback.classList.remove('is-success', 'is-error');

        const token = getToken();

        if (!token) {
            navigateTo('/connexion');
            return;
        }

        const gameData = {
            name: nameInput.value.trim(),
            publisher: publisherInput.value.trim(),
            description: descriptionInput.value.trim()
        };

        if (
            !gameData.name ||
            !gameData.publisher ||
            !gameData.description
        ) {
            feedback.textContent =
                'Merci de remplir tous les champs.';
            feedback.classList.add('is-error');
            feedback.hidden = false;
            return;
        }

        submitButton.disabled = true;
        cancelButton.disabled = true;
        proposalButton.disabled = true;
        submitButton.textContent = 'Envoi en cours...';

        try {
            await createGameRequest(token, gameData);

            form.reset();

            feedback.textContent =
                'Ta proposition a bien été envoyée. Elle sera examinée par un administrateur.';
            feedback.classList.add('is-success');
            feedback.hidden = false;

            // Ferme le formulaire après un envoi réussi.
            formContainer.hidden = true;
            proposalButton.textContent = 'Proposer un jeu';
            proposalButton.setAttribute('aria-expanded', 'false');
        } catch (error) {
            console.error(
                'Impossible d’envoyer la proposition de jeu.',
                error
            );

            feedback.textContent =
                error.message ||
                'Une erreur est survenue pendant l’envoi de la proposition.';
            feedback.classList.add('is-error');
            feedback.hidden = false;
        } finally {
            submitButton.disabled = false;
            cancelButton.disabled = false;
            proposalButton.disabled = false;
            submitButton.textContent = 'Envoyer la proposition';
        }
    });

    container.append(
        introduction,
        proposalButton,
        formContainer
    );

    section.append(container);

    return section;
}


// Crée la section contenant la liste des jeux

function createGamesSection() {
    const section = document.createElement('section');
    section.classList.add('games-section');

    const container = document.createElement('div');
    container.classList.add('games-section-container');

    const heading = document.createElement('div');
    heading.classList.add('games-section-heading');

    const title = document.createElement('h2');
    title.textContent = 'Tous les jeux';

    const count = document.createElement('span');
    count.classList.add('games-count');

    title.append(document.createTextNode(' '), count);
    heading.append(title);

    const gamesGrid = document.createElement('div');
    gamesGrid.classList.add('games-grid');

    const loading = document.createElement('p');
    loading.classList.add('games-loading');
    loading.textContent = 'Chargement des jeux...';

    gamesGrid.append(loading);

    container.append(heading, gamesGrid);
    section.append(container);

    section.gamesGrid = gamesGrid;
    section.gamesCount = count;

    return section;
}


// Récupère les jeux depuis l'API et configure la recherche

async function loadGames(section, searchInput, searchForm) {
    try {
        const games = await getGames();

        // Trie tous les jeux par ordre alphabétique.
        const sortedGames = [...games].sort((gameA, gameB) =>
            String(gameA.name || '').localeCompare(
                String(gameB.name || ''),
                'fr',
                { sensitivity: 'base' }
            )
        );

        // Affiche les jeux correspondant à la recherche.
        function updateGames() {
            const search = normalizeGameName(searchInput.value.trim());

            const filteredGames = sortedGames.filter((game) => {
                const gameName = normalizeGameName(game.name || '');

                return gameName.startsWith(search);
            });

            renderGames(section, filteredGames, sortedGames.length);
        }

        // Actualise les résultats à chaque modification de la saisie.
        searchInput.addEventListener('input', updateGames);

        // Le bouton déclenche également la recherche.
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            updateGames();
        });

        // Affiche initialement tous les jeux triés.
        updateGames();
    } catch (error) {
        section.gamesGrid.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.textContent =
            'Impossible de charger les jeux pour le moment.';

        section.gamesGrid.append(errorMessage);

        console.error(error);
    }
}


// Normalise les noms pour ignorer les accents et la casse

function normalizeGameName(name) {
    return String(name)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr');
}


// Affiche les résultats de la recherche

function renderGames(section, games, totalGames) {
    section.gamesGrid.replaceChildren();

    section.gamesCount.textContent =
        `(${games.length} ${games.length > 1 ? 'jeux' : 'jeu'})`;

    if (totalGames === 0) {
        const message = document.createElement('p');
        message.textContent = 'Aucun jeu disponible pour le moment.';

        section.gamesGrid.append(message);

        return;
    }

    if (games.length === 0) {
        const message = document.createElement('p');
        message.textContent =
            'Aucun jeu ne commence par ces lettres.';

        section.gamesGrid.append(message);

        return;
    }

    // Construit les cartes avec les jeux filtrés et triés.
    games.forEach((game) => {
        section.gamesGrid.append(createGameCard(game));
    });
}