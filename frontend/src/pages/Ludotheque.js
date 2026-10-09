// Crée et gère la page ludothèque de l'utilisateur connecté

import { getGames } from '../api/gamesApi.js';

import {
    getMyGames,
    addGameToLibrary,
    updateLibraryGame,
    removeGameFromLibrary
} from '../api/userGamesApi.js';

import { getToken } from '../services/authService.js';
import { navigateTo } from '../router/router.js';

import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

import '../css/games.css';
import '../css/ludotheque.css';


/* ========================================
   Création de la page
   ======================================== */

export function createLudothequePage() {
    const page = document.createElement('main');

    page.classList.add('ludotheque-page');


    /* ---------- Hero ---------- */

    const hero = document.createElement('section');

    hero.classList.add('home-hero');

    const heroContent = document.createElement('div');

    heroContent.classList.add('home-hero-content');

    const heroTitle = document.createElement('h1');

    const firstWord = document.createElement('span');

    firstWord.textContent = 'Ma';

    const secondWord = document.createElement('span');

    secondWord.classList.add('heading-highlight');

    secondWord.textContent = 'ludothèque';

    heroTitle.append(
        firstWord,
        secondWord
    );

    heroContent.append(heroTitle);


    /* ---------- Image du hero ---------- */

    const heroImageContainer = document.createElement('div');

    heroImageContainer.classList.add('home-hero-image');

    const heroImage = document.createElement('img');

    heroImage.src = ludothequeImage;

    heroImage.alt =
        'Ludothèque contenant des jeux de société';

    heroImageContainer.append(heroImage);

    hero.append(
        heroContent,
        heroImageContainer
    );


    /* ---------- Contenu de la page ---------- */

    const container = document.createElement('div');

    container.classList.add('ludotheque-container');

    const content = document.createElement('div');

    content.classList.add('ludotheque-content');

    const loading = document.createElement('p');

    loading.classList.add('ludotheque-loading');

    loading.textContent =
        'Chargement de votre ludothèque...';

    content.append(loading);

    container.append(content);

    page.append(
        hero,
        container
    );

    loadLudotheque(content);

    return page;
}


/* ========================================
   Chargement de la ludothèque
   ======================================== */

async function loadLudotheque(content) {
    const token = getToken();

    if (!token) {
        navigateTo('/connexion');

        return;
    }

    try {
        const [games, userGames] = await Promise.all([
            getGames(),
            getMyGames(token)
        ]);

        content.replaceChildren(
            createMyGamesSection(userGames, token),
            createAddGameSection(games, userGames, token)
        );
    } catch (error) {
        console.error(error);

        content.replaceChildren();

        const errorMessage = document.createElement('p');

        errorMessage.classList.add('ludotheque-error');

        errorMessage.textContent =
            'Impossible de charger votre ludothèque pour le moment.';

        content.append(errorMessage);
    }
}


/* ========================================
   Section ma ludothèque
   ======================================== */

function createMyGamesSection(userGames, token) {
    const section = document.createElement('section');

    section.classList.add('ludotheque-section');

    const header = document.createElement('div');

    header.classList.add('ludotheque-section-header');

    const titleContainer = document.createElement('div');

    const title = document.createElement('h2');

    title.textContent = 'Mes jeux';

    const count = document.createElement('span');

    count.classList.add('ludotheque-count');

    count.textContent =
        `${userGames.length} jeu${userGames.length > 1 ? 'x' : ''}`;

    titleContainer.append(
        title,
        count
    );

    header.append(titleContainer);

    section.append(header);

    if (userGames.length === 0) {
        const emptyMessage = document.createElement('p');

        emptyMessage.classList.add('ludotheque-empty');

        emptyMessage.textContent =
            'Votre ludothèque est actuellement vide.';

        section.append(emptyMessage);

        return section;
    }

    const grid = document.createElement('div');

    grid.classList.add(
        'games-grid',
        'ludotheque-grid'
    );

    userGames.forEach((userGame) => {
        grid.append(
            createUserGameCard(
                userGame,
                token,
                grid,
                section
            )
        );
    });

    section.append(grid);

    return section;
}


/* ========================================
   Carte d'un jeu de la ludothèque
   ======================================== */

function createUserGameCard(
    userGame,
    token,
    grid,
    section
) {
    const card = document.createElement('article');

    card.classList.add(
        'game-card',
        'ludotheque-card'
    );

    const imageContainer = document.createElement('div');

    imageContainer.classList.add(
        'game-card-image',
        'ludotheque-card-image'
    );

    const image = document.createElement('img');

    image.src = getGameImage(userGame);

    image.alt =
        userGame.name || 'Jeu de société';

    imageContainer.append(image);


    /* ---------- Contenu ---------- */

    const content = document.createElement('div');

    content.classList.add(
        'game-card-content',
        'ludotheque-card-content'
    );

    const title = document.createElement('h3');

    title.textContent =
        userGame.name || 'Jeu';

    content.append(title);


    /* ---------- Informations ---------- */

    const information = document.createElement('div');

    information.classList.add(
        'game-card-information',
        'ludotheque-card-information'
    );

    if (
        userGame.minPlayers !== null &&
        userGame.maxPlayers !== null
    ) {
        const players = document.createElement('span');

        const playersIcon = document.createElement('i');

        playersIcon.classList.add(
            'bi',
            'bi-people'
        );

        playersIcon.setAttribute(
            'aria-hidden',
            'true'
        );

        const playersText = document.createElement('span');

        playersText.textContent =
            userGame.minPlayers === userGame.maxPlayers
                ? `${userGame.minPlayers} joueur${userGame.minPlayers > 1 ? 's' : ''}`
                : `${userGame.minPlayers}–${userGame.maxPlayers} joueurs`;

        players.append(
            playersIcon,
            playersText
        );

        information.append(players);
    }

    if (userGame.duration) {
        const duration = document.createElement('span');

        const durationIcon = document.createElement('i');

        durationIcon.classList.add(
            'bi',
            'bi-clock'
        );

        durationIcon.setAttribute(
            'aria-hidden',
            'true'
        );

        const durationText = document.createElement('span');

        durationText.textContent =
            `${userGame.duration} min`;

        duration.append(
            durationIcon,
            durationText
        );

        information.append(duration);
    }

    content.append(information);


    /* ---------- Statuts ---------- */

    const statusContainer = document.createElement('div');

    statusContainer.classList.add(
        'ludotheque-card-status'
    );


    /* Possession */

    const ownsLabel = document.createElement('label');

    ownsLabel.classList.add(
        'ludotheque-checkbox'
    );

    const ownsInput = document.createElement('input');

    ownsInput.type = 'checkbox';

    ownsInput.checked = userGame.owns;

    // Mémorise l'état initial
    ownsInput.dataset.previousValue =
        String(userGame.owns);

    const ownsText = document.createElement('span');

    ownsText.textContent =
        'Je possède ce jeu';

    ownsLabel.append(
        ownsInput,
        ownsText
    );


    /* Règles */

    const rulesLabel = document.createElement('label');

    rulesLabel.classList.add(
        'ludotheque-checkbox'
    );

    const rulesInput = document.createElement('input');

    rulesInput.type = 'checkbox';

    rulesInput.checked = userGame.knowsRules;

    // Mémorise l'état initial
    rulesInput.dataset.previousValue =
        String(userGame.knowsRules);

    const rulesText = document.createElement('span');

    rulesText.textContent =
        'Je connais les règles';

    rulesLabel.append(
        rulesInput,
        rulesText
    );

    statusContainer.append(
        ownsLabel,
        rulesLabel
    );

    content.append(statusContainer);


    /* ---------- Message d'erreur ---------- */

    const errorMessage = document.createElement('p');

    errorMessage.classList.add(
        'ludotheque-card-error'
    );

    errorMessage.hidden = true;

    content.append(errorMessage);


    /* ---------- Suppression ---------- */

    const deleteButton = document.createElement('button');

    deleteButton.type = 'button';

    deleteButton.classList.add(
        'ludotheque-delete-button'
    );

    deleteButton.textContent =
        'Retirer de ma ludothèque';

    deleteButton.addEventListener(
        'click',
        async () => {
            const confirmed = window.confirm(
                `Retirer « ${userGame.name} » de votre ludothèque ?`
            );

            if (!confirmed) {
                return;
            }

            deleteButton.disabled = true;

            deleteButton.textContent =
                'Suppression...';

            try {
                await removeGameFromLibrary(
                    token,
                    userGame.id
                );

                card.remove();

                updateLibraryCount(section);
            } catch (error) {
                console.error(error);

                errorMessage.textContent =
                    error.message ||
                    'Impossible de retirer ce jeu.';

                errorMessage.hidden = false;

                deleteButton.disabled = false;

                deleteButton.textContent =
                    'Retirer de ma ludothèque';
            }
        }
    );

    content.append(deleteButton);

    card.append(
        imageContainer,
        content
    );


    /* ---------- Modification de la possession ---------- */

    ownsInput.addEventListener(
        'change',
        async () => {
            await updateUserGame(
                token,
                userGame,
                ownsInput,
                rulesInput,
                errorMessage
            );
        }
    );


    /* ---------- Modification des règles ---------- */

    rulesInput.addEventListener(
        'change',
        async () => {
            await updateUserGame(
                token,
                userGame,
                ownsInput,
                rulesInput,
                errorMessage
            );
        }
    );

    return card;
}


/* ========================================
   Modification d'un jeu
   ======================================== */

async function updateUserGame(
    token,
    userGame,
    ownsInput,
    rulesInput,
    errorMessage
) {
    const owns = ownsInput.checked;

    const knowsRules = rulesInput.checked;

    // Le backend refuse qu'un jeu n'ait aucun statut actif
    if (!owns && !knowsRules) {
        errorMessage.textContent =
            'Un jeu doit être possédé ou ses règles doivent être connues.';

        errorMessage.hidden = false;

        // Restaure l'état précédent
        ownsInput.checked =
            ownsInput.dataset.previousValue === 'true';

        rulesInput.checked =
            rulesInput.dataset.previousValue === 'true';

        return;
    }

    errorMessage.hidden = true;

    try {
        await updateLibraryGame(
            token,
            userGame.id,
            {
                owns,
                knowsRules
            }
        );

        // Mémorise le nouvel état après sauvegarde
        ownsInput.dataset.previousValue =
            String(owns);

        rulesInput.dataset.previousValue =
            String(knowsRules);

        userGame.owns = owns;

        userGame.knowsRules = knowsRules;
    } catch (error) {
        console.error(error);

        errorMessage.textContent =
            error.message ||
            'Impossible de modifier ce jeu.';

        errorMessage.hidden = false;

        // Restaure l'état précédent
        ownsInput.checked =
            userGame.owns === true;

        rulesInput.checked =
            userGame.knowsRules === true;
    }
}


/* ========================================
   Section ajouter un jeu
   ======================================== */

function createAddGameSection(
    games,
    userGames,
    token
) {
    const section = document.createElement('section');

    section.classList.add(
        'ludotheque-section',
        'ludotheque-add-section'
    );

    const title = document.createElement('h2');

    title.textContent =
        'Ajouter un jeu';

    const searchContainer = document.createElement('div');

    searchContainer.classList.add(
        'ludotheque-search'
    );

    const searchIcon = document.createElement('i');

    searchIcon.classList.add(
        'bi',
        'bi-search'
    );

    searchIcon.setAttribute(
        'aria-hidden',
        'true'
    );

    const searchInput = document.createElement('input');

    searchInput.type = 'search';

    searchInput.placeholder =
        'Rechercher un jeu...';

    searchInput.setAttribute(
        'aria-label',
        'Rechercher un jeu'
    );

    searchContainer.append(
        searchIcon,
        searchInput
    );

    const availableGames = getAvailableGames(
        games,
        userGames
    );

    const grid = document.createElement('div');

    grid.classList.add(
        'games-grid',
        'ludotheque-add-grid'
    );

    renderAvailableGames(
        grid,
        availableGames,
        token
    );

    searchInput.addEventListener(
        'input',
        () => {
            const search =
                searchInput.value
                    .trim()
                    .toLowerCase();

            const filteredGames =
                availableGames.filter((game) =>
                    game.name
                        .toLowerCase()
                        .includes(search)
                );

            renderAvailableGames(
                grid,
                filteredGames,
                token
            );
        }
    );

    section.append(
        title,
        searchContainer,
        grid
    );

    return section;
}


/* ========================================
   Jeux disponibles
   ======================================== */

function getAvailableGames(
    games,
    userGames
) {
    const userGameIds = new Set(
        userGames.map(
            (userGame) => userGame.id
        )
    );

    return games.filter(
        (game) => !userGameIds.has(game.id)
    );
}


/* ========================================
   Affichage des jeux disponibles
   ======================================== */

function renderAvailableGames(
    grid,
    games,
    token
) {
    grid.replaceChildren();

    if (games.length === 0) {
        const message = document.createElement('p');

        message.classList.add(
            'ludotheque-empty'
        );

        message.textContent =
            'Aucun jeu ne correspond à votre recherche.';

        grid.append(message);

        return;
    }

    games.forEach((game) => {
        grid.append(
            createAvailableGameCard(
                game,
                token
            )
        );
    });
}


/* ========================================
   Carte d'un jeu disponible
   ======================================== */

function createAvailableGameCard(
    game,
    token
) {
    const card = document.createElement('article');

    card.classList.add(
        'game-card',
        'ludotheque-add-card'
    );

    const imageContainer = document.createElement('div');

    imageContainer.classList.add(
        'game-card-image',
        'ludotheque-add-card-image'
    );

    const image = document.createElement('img');

    image.src = getGameImage(game);

    image.alt =
        game.name || 'Jeu de société';

    imageContainer.append(image);


    /* ---------- Contenu ---------- */

    const content = document.createElement('div');

    content.classList.add(
        'game-card-content',
        'ludotheque-add-card-content'
    );

    const title = document.createElement('h3');

    title.textContent =
        game.name || 'Jeu';

    content.append(title);


    /* ---------- Informations ---------- */

    const information = document.createElement('div');

    information.classList.add(
        'game-card-information',
        'ludotheque-add-card-information'
    );

    if (
        game.minPlayers !== null &&
        game.maxPlayers !== null
    ) {
        const players = document.createElement('span');

        const playersIcon = document.createElement('i');

        playersIcon.classList.add(
            'bi',
            'bi-people'
        );

        playersIcon.setAttribute(
            'aria-hidden',
            'true'
        );

        const playersText = document.createElement('span');

        playersText.textContent =
            game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} joueur${game.minPlayers > 1 ? 's' : ''}`
                : `${game.minPlayers}–${game.maxPlayers} joueurs`;

        players.append(
            playersIcon,
            playersText
        );

        information.append(players);
    }

    if (game.duration) {
        const duration = document.createElement('span');

        const durationIcon = document.createElement('i');

        durationIcon.classList.add(
            'bi',
            'bi-clock'
        );

        durationIcon.setAttribute(
            'aria-hidden',
            'true'
        );

        const durationText = document.createElement('span');

        durationText.textContent =
            `${game.duration} min`;

        duration.append(
            durationIcon,
            durationText
        );

        information.append(duration);
    }

    content.append(information);


    /* ---------- Conteneur du bouton déroulant ---------- */

    const dropdown = document.createElement('div');

    dropdown.classList.add(
        'ludotheque-add-dropdown'
    );


    /* ---------- Bouton principal ---------- */

    const addButton = document.createElement('button');

    addButton.type = 'button';

    addButton.classList.add(
        'ludotheque-add-button'
    );

    const buttonText = document.createElement('span');

    buttonText.textContent =
        'Choisir une action';

    const buttonIcon = document.createElement('i');

    buttonIcon.classList.add(
        'bi',
        'bi-chevron-down'
    );

    buttonIcon.setAttribute(
        'aria-hidden',
        'true'
    );

    addButton.append(
        buttonText,
        buttonIcon
    );


    /* ---------- Menu déroulant ---------- */

    const optionsMenu = document.createElement('div');

    optionsMenu.classList.add(
        'ludotheque-add-options'
    );

    optionsMenu.hidden = true;


    /* ---------- Option 1 ---------- */

    const ownsOption = createAddOption(
        'Je possède ce jeu',
        'owns'
    );


    /* ---------- Option 2 ---------- */

    const rulesOption = createAddOption(
        'Je connais les règles',
        'rules'
    );


    /* ---------- Option 3 ---------- */

    const ownsAndRulesOption = createAddOption(
        'Je possède ce jeu et je connais les règles',
        'owns-and-rules'
    );

    optionsMenu.append(
        ownsOption,
        rulesOption,
        ownsAndRulesOption
    );


    /* ---------- Ouverture du menu ---------- */

    addButton.addEventListener(
        'click',
        (event) => {
            event.stopPropagation();

            optionsMenu.hidden =
                !optionsMenu.hidden;

            dropdown.classList.toggle(
                'is-open',
                !optionsMenu.hidden
            );
        }
    );


    /* ---------- Sélection d'une option ---------- */

    optionsMenu.addEventListener(
        'click',
        async (event) => {
            const optionButton =
                event.target.closest(
                    '.ludotheque-add-option'
                );

            if (!optionButton) {
                return;
            }

            const selectedStatus =
                optionButton.dataset.status;

            optionsMenu.hidden = true;

            dropdown.classList.remove(
                'is-open'
            );

            addButton.disabled = true;

            buttonText.textContent =
                'Ajout...';

            let owns = false;

            let knowsRules = false;

            if (selectedStatus === 'owns') {
                owns = true;
            }

            if (selectedStatus === 'rules') {
                knowsRules = true;
            }

            if (
                selectedStatus ===
                'owns-and-rules'
            ) {
                owns = true;
                knowsRules = true;
            }

            try {
                await addGameToLibrary(
                    token,
                    game.id,
                    owns,
                    knowsRules
                );

                buttonText.textContent =
                    'Jeu ajouté';

                addButton.classList.add(
                    'is-added'
                );

                addButton.disabled = true;
            } catch (error) {
                console.error(error);

                addButton.disabled = false;

                buttonText.textContent =
                    'Choisir une action';
            }
        }
    );


    /* ---------- Ferme le menu en cliquant ailleurs ---------- */

    document.addEventListener(
        'click',
        (event) => {
            if (!dropdown.contains(event.target)) {
                optionsMenu.hidden = true;

                dropdown.classList.remove(
                    'is-open'
                );
            }
        }
    );

    dropdown.append(
        addButton,
        optionsMenu
    );

    content.append(dropdown);

    card.append(
        imageContainer,
        content
    );

    return card;
}


/* ========================================
   Création d'une option du menu
   ======================================== */

function createAddOption(
    label,
    status
) {
    const option = document.createElement('button');

    option.type = 'button';

    option.classList.add(
        'ludotheque-add-option'
    );

    option.dataset.status = status;

    option.textContent = label;

    return option;
}


/* ========================================
   Mise à jour du compteur
   ======================================== */

function updateLibraryCount(section) {
    const count = section.querySelector(
        '.ludotheque-count'
    );

    if (!count) {
        return;
    }

    const cards = section.querySelectorAll(
        '.ludotheque-card'
    );

    count.textContent =
        `${cards.length} jeu${cards.length > 1 ? 'x' : ''}`;
}


/* ========================================
   Image d'un jeu
   ======================================== */

function getGameImage(game) {
    if (game.image) {
        if (game.image.startsWith('http')) {
            return game.image;
        }

        return `http://127.0.0.1:8000${game.image}`;
    }

    return '';
}