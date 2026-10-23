// Crée la page profil de l'utilisateur connecté

import {
    getCurrentUser,
    updateCurrentUser,
    updateProfilePicture
} from '../api/authApi.js';

import { getMyGames } from '../api/userGamesApi.js';
import { getToken } from '../services/authService.js';
import { navigateTo } from '../router/router.js';
import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';

import '../css/profile.css';
import '../css/games.css';
import '../css/ludotheque.css';

// Adresse du serveur backend pour les photos de profil
const PROFILE_PICTURE_BASE_URL = '/images/';

// Photo affichée lorsqu'aucune photo personnalisée n'est disponible
const DEFAULT_PROFILE_PICTURE =
    `${PROFILE_PICTURE_BASE_URL}meeple-default.png`;

// Formats d'image acceptés
const ALLOWED_PICTURE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
];

// Taille maximale autorisée : 10 Mo
const MAX_PICTURE_SIZE = 10 * 1024 * 1024;

/* ========================================
   Départements français
   ======================================== */

const DEPARTMENTS = [
    { code: '01', name: 'Ain' },
    { code: '02', name: 'Aisne' },
    { code: '03', name: 'Allier' },
    { code: '04', name: 'Alpes-de-Haute-Provence' },
    { code: '05', name: 'Hautes-Alpes' },
    { code: '06', name: 'Alpes-Maritimes' },
    { code: '07', name: 'Ardèche' },
    { code: '08', name: 'Ardennes' },
    { code: '09', name: 'Ariège' },
    { code: '10', name: 'Aube' },
    { code: '11', name: 'Aude' },
    { code: '12', name: 'Aveyron' },
    { code: '13', name: 'Bouches-du-Rhône' },
    { code: '14', name: 'Calvados' },
    { code: '15', name: 'Cantal' },
    { code: '16', name: 'Charente' },
    { code: '17', name: 'Charente-Maritime' },
    { code: '18', name: 'Cher' },
    { code: '19', name: 'Corrèze' },
    { code: '2A', name: 'Corse-du-Sud' },
    { code: '2B', name: 'Haute-Corse' },
    { code: '21', name: "Côte-d'Or" },
    { code: '22', name: "Côtes-d'Armor" },
    { code: '23', name: 'Creuse' },
    { code: '24', name: 'Dordogne' },
    { code: '25', name: 'Doubs' },
    { code: '26', name: 'Drôme' },
    { code: '27', name: 'Eure' },
    { code: '28', name: 'Eure-et-Loir' },
    { code: '29', name: 'Finistère' },
    { code: '30', name: 'Gard' },
    { code: '31', name: 'Haute-Garonne' },
    { code: '32', name: 'Gers' },
    { code: '33', name: 'Gironde' },
    { code: '34', name: 'Hérault' },
    { code: '35', name: 'Ille-et-Vilaine' },
    { code: '36', name: 'Indre' },
    { code: '37', name: 'Indre-et-Loire' },
    { code: '38', name: 'Isère' },
    { code: '39', name: 'Jura' },
    { code: '40', name: 'Landes' },
    { code: '41', name: 'Loir-et-Cher' },
    { code: '42', name: 'Loire' },
    { code: '43', name: 'Haute-Loire' },
    { code: '44', name: 'Loire-Atlantique' },
    { code: '45', name: 'Loiret' },
    { code: '46', name: 'Lot' },
    { code: '47', name: 'Lot-et-Garonne' },
    { code: '48', name: 'Lozère' },
    { code: '49', name: 'Maine-et-Loire' },
    { code: '50', name: 'Manche' },
    { code: '51', name: 'Marne' },
    { code: '52', name: 'Haute-Marne' },
    { code: '53', name: 'Mayenne' },
    { code: '54', name: 'Meurthe-et-Moselle' },
    { code: '55', name: 'Meuse' },
    { code: '56', name: 'Morbihan' },
    { code: '57', name: 'Moselle' },
    { code: '58', name: 'Nièvre' },
    { code: '59', name: 'Nord' },
    { code: '60', name: 'Oise' },
    { code: '61', name: 'Orne' },
    { code: '62', name: 'Pas-de-Calais' },
    { code: '63', name: 'Puy-de-Dôme' },
    { code: '64', name: 'Pyrénées-Atlantiques' },
    { code: '65', name: 'Hautes-Pyrénées' },
    { code: '66', name: 'Pyrénées-Orientales' },
    { code: '67', name: 'Bas-Rhin' },
    { code: '68', name: 'Haut-Rhin' },
    { code: '69', name: 'Rhône' },
    { code: '70', name: 'Haute-Saône' },
    { code: '71', name: 'Saône-et-Loire' },
    { code: '72', name: 'Sarthe' },
    { code: '73', name: 'Savoie' },
    { code: '74', name: 'Haute-Savoie' },
    { code: '75', name: 'Paris' },
    { code: '76', name: 'Seine-Maritime' },
    { code: '77', name: 'Seine-et-Marne' },
    { code: '78', name: 'Yvelines' },
    { code: '79', name: 'Deux-Sèvres' },
    { code: '80', name: 'Somme' },
    { code: '81', name: 'Tarn' },
    { code: '82', name: 'Tarn-et-Garonne' },
    { code: '83', name: 'Var' },
    { code: '84', name: 'Vaucluse' },
    { code: '85', name: 'Vendée' },
    { code: '86', name: 'Vienne' },
    { code: '87', name: 'Haute-Vienne' },
    { code: '88', name: 'Vosges' },
    { code: '89', name: 'Yonne' },
    { code: '90', name: 'Territoire de Belfort' },
    { code: '91', name: 'Essonne' },
    { code: '92', name: 'Hauts-de-Seine' },
    { code: '93', name: 'Seine-Saint-Denis' },
    { code: '94', name: 'Val-de-Marne' },
    { code: '95', name: "Val-d'Oise" },
    { code: '971', name: 'Guadeloupe' },
    { code: '972', name: 'Martinique' },
    { code: '973', name: 'Guyane' },
    { code: '974', name: 'La Réunion' },
    { code: '976', name: 'Mayotte' }
];

/* ========================================
   Adresse d'une photo de profil
   ======================================== */

function getProfilePictureUrl(profilePicture) {
    if (!profilePicture || typeof profilePicture !== 'string') {
        return DEFAULT_PROFILE_PICTURE;
    }

    const picturePath = profilePicture.trim();

    if (!picturePath) {
        return DEFAULT_PROFILE_PICTURE;
    }

    // Conserve les URL complètes renvoyées par l'API.
    if (/^https?:\/\//i.test(picturePath)) {
        return picturePath;
    }

    // Prend en charge les chemins publics commençant par un slash.
    if (picturePath.startsWith('/')) {
        return picturePath;
    }

    if (picturePath.includes('/')) {
        return `/${picturePath}`;
    }

    // Si l'API renvoie uniquement un nom de fichier, utilise /images/.
    return `${PROFILE_PICTURE_BASE_URL}${encodeURIComponent(picturePath)}`;
}

/* ========================================
   Création de la page
   ======================================== */

export function createProfilePage() {
    const page = document.createElement('main');
    page.classList.add('profile-page');

    const hero = createProfileHero();

    const container = document.createElement('div');
    container.classList.add('profile-container');

    const content = document.createElement('div');
    content.classList.add('profile-content');

    const loading = document.createElement('p');
    loading.classList.add('profile-loading');
    loading.textContent = 'Chargement de votre profil...';

    content.append(loading);
    container.append(content);
    page.append(hero, container);

    loadProfile(content);

    return page;
}

/* ========================================
   Hero
   ======================================== */

function createProfileHero() {
    const section = document.createElement('section');
    section.classList.add('home-hero');

    const content = document.createElement('div');
    content.classList.add('home-hero-content');

    const title = document.createElement('h1');

    const firstWord = document.createElement('span');
    firstWord.textContent = 'Mon';

    const secondWord = document.createElement('span');
    secondWord.classList.add('heading-highlight');
    secondWord.textContent = 'profil';

    title.append(firstWord, secondWord);
    content.append(title);

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('home-hero-image');

    const image = document.createElement('img');
    image.src = ludothequeImage;
    image.alt = 'Ludothèque contenant des jeux de société';

    imageContainer.append(image);
    section.append(content, imageContainer);

    return section;
}

/* ========================================
   Chargement du profil
   ======================================== */

async function loadProfile(content) {
    const token = getToken();

    if (!token) {
        navigateTo('/connexion');
        return;
    }

    try {
        const [user, games] = await Promise.all([
            getCurrentUser(token),
            getMyGames(token)
        ]);

        content.replaceChildren(
            createLibraryPreview(games),
            createProfileInformation(user)
        );
    } catch (error) {
        console.error(error);
        content.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.classList.add('profile-error');
        errorMessage.textContent =
            'Impossible de charger votre profil pour le moment.';

        content.append(errorMessage);
    }
}

/* ========================================
   Mes informations
   ======================================== */

function createProfileInformation(user) {
    const section = document.createElement('section');
    section.classList.add('profile-section');

    // En-tête de la carte avec le bouton de modification.
    const header = document.createElement('div');
    header.classList.add('profile-section-header');

    const title = document.createElement('h2');
    title.textContent = 'Mes informations';

    // Réutilise le style du bouton rouge de la carte Ma ludothèque.
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.classList.add('profile-library-button');
    editButton.textContent = 'Modifier mon profil';

    editButton.addEventListener('click', () => {
        openProfileEditForm(user);
    });

    header.append(title, editButton);

    // Affiche la photo de profil actuelle.
    const pictureField = document.createElement('div');
    pictureField.classList.add('profile-field');

    const pictureLabel = document.createElement('span');
    pictureLabel.classList.add('profile-field-label');
    pictureLabel.textContent = 'Photo de profil';

    const picture = document.createElement('img');
    picture.classList.add('profile-picture-preview');
    picture.src = getProfilePictureUrl(user.profilePicture);
    picture.alt = 'Photo de profil';

    // Utilise la photo par défaut si l'image est inaccessible.
    picture.addEventListener('error', () => {
        picture.src = DEFAULT_PROFILE_PICTURE;
    }, { once: true });

    pictureField.append(pictureLabel, picture);

    const pseudoField = createProfileField(
        'Pseudo',
        user.pseudo || 'Non renseigné'
    );

    const emailField = createProfileField(
        'Email',
        user.email || 'Non renseigné'
    );

    const dateField = createProfileField(
        'Date de naissance',
        formatDate(user.dateOfBirth)
    );

    const departmentField = createProfileField(
        'Département',
        getDepartmentName(user.department)
    );

    const cityField = createProfileField(
        'Ville',
        user.city || 'Non renseignée'
    );

    const visibilityField = createProfileField(
        'Ville visible',
        user.cityVisible === true ? 'Oui' : 'Non'
    );

    section.append(
        header,
        pictureField,
        pseudoField,
        emailField,
        dateField,
        departmentField,
        cityField,
        visibilityField
    );

    return section;
}

/* ========================================
   Champ d'information
   ======================================== */

function createProfileField(labelText, valueText) {
    const field = document.createElement('div');
    field.classList.add('profile-field');

    const label = document.createElement('span');
    label.classList.add('profile-field-label');
    label.textContent = labelText;

    const value = document.createElement('span');
    value.classList.add('profile-field-value');
    value.textContent = valueText;

    field.append(label, value);

    return field;
}

/* ========================================
   Nom du département
   ======================================== */

function getDepartmentName(departmentCode) {
    if (!departmentCode) {
        return 'Non renseigné';
    }

    const department = DEPARTMENTS.find(
        (item) => item.code === departmentCode
    );

    return department
        ? `${department.code} — ${department.name}`
        : departmentCode;
}

/* ========================================
   Aperçu de la ludothèque
   ======================================== */

function createLibraryPreview(games) {
    const section = document.createElement('section');
    section.classList.add('profile-section');

    const header = document.createElement('div');
    header.classList.add('profile-section-header');

    const titleContainer = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = 'Ma ludothèque';

    const count = document.createElement('span');
    count.classList.add('profile-library-count');
    count.textContent =
        `${games.length} jeu${games.length > 1 ? 'x' : ''}`;

    titleContainer.append(title, count);

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('profile-library-button');
    button.textContent = 'Gérer ma ludothèque';

    button.addEventListener('click', () => {
        navigateTo('/ludotheque');
    });

    header.append(titleContainer, button);

    // Réutilise les classes des cartes de /ludotheque.
    const grid = document.createElement('div');
    grid.classList.add(
        'games-grid',
        'ludotheque-grid',
        'profile-library-grid'
    );

    if (games.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.classList.add('profile-empty-message');
        emptyMessage.textContent =
            'Votre ludothèque est actuellement vide.';

        grid.append(emptyMessage);
    } else {
        games.slice(0, 6).forEach((userGame) => {
            grid.append(createLibraryGameCard(userGame));
        });
    }

    section.append(header, grid);

    if (games.length > 6) {
        const more = document.createElement('p');
        more.classList.add('profile-library-more');
        more.textContent =
            `Et ${games.length - 6} autre${games.length - 6 > 1 ? 's' : ''} jeu${games.length - 6 > 1 ? 'x' : ''}...`;

        section.append(more);
    }

    return section;
}

/* ========================================
   Carte d'un jeu de la ludothèque
   ======================================== */

function createLibraryGameCard(userGame) {
    // Selon la réponse de l'API, les données peuvent être imbriquées.
    const game = userGame.game || userGame;

    const gameData = {
        ...userGame,
        ...game,
        owns: userGame.owns ?? game.owns ?? false,
        knowsRules: userGame.knowsRules ?? game.knowsRules ?? false
    };

    const card = document.createElement('article');
    card.classList.add('game-card', 'ludotheque-card');

    const gameSlug = gameData.slug || createGameSlug(gameData.name);

    // Rend la carte accessible à la souris et au clavier.
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.setAttribute(
        'aria-label',
        `Voir la description de ${gameData.name || 'ce jeu'}`
    );

    card.addEventListener('click', () => {
        navigateTo(`/jeux/${gameSlug}`);
    });

    card.addEventListener('keydown', (event) => {
        if (
            event.target !== card ||
            (event.key !== 'Enter' && event.key !== ' ')
        ) {
            return;
        }

        event.preventDefault();
        navigateTo(`/jeux/${gameSlug}`);
    });

    const imageContainer = document.createElement('div');
    imageContainer.classList.add(
        'game-card-image',
        'ludotheque-card-image'
    );

    const image = document.createElement('img');
    image.src = getGameImage(gameData);
    image.alt = gameData.name || 'Jeu de société';

    imageContainer.append(image);

    const content = document.createElement('div');
    content.classList.add(
        'game-card-content',
        'ludotheque-card-content'
    );

    const title = document.createElement('h3');
    title.textContent = gameData.name || 'Jeu';

    const information = document.createElement('div');
    information.classList.add(
        'game-card-information',
        'ludotheque-card-information'
    );

    // Nombre de joueurs.
    if (gameData.minPlayers != null && gameData.maxPlayers != null) {
        const players = document.createElement('span');

        const playersIcon = document.createElement('i');
        playersIcon.classList.add('bi', 'bi-people');
        playersIcon.setAttribute('aria-hidden', 'true');

        const playersText = document.createElement('span');
        playersText.textContent =
            gameData.minPlayers === gameData.maxPlayers
                ? `${gameData.minPlayers} joueur${gameData.minPlayers > 1 ? 's' : ''}`
                : `${gameData.minPlayers}–${gameData.maxPlayers} joueurs`;

        players.append(playersIcon, playersText);
        information.append(players);
    }

    // Durée d'une partie.
    if (gameData.duration) {
        const duration = document.createElement('span');

        const durationIcon = document.createElement('i');
        durationIcon.classList.add('bi', 'bi-clock');
        durationIcon.setAttribute('aria-hidden', 'true');

        const durationText = document.createElement('span');
        durationText.textContent = `${gameData.duration} min`;

        duration.append(durationIcon, durationText);
        information.append(duration);
    }

    content.append(title, information);

    // Affiche les statuts sans modifier la ludothèque depuis le profil.
    const statusContainer = document.createElement('div');
    statusContainer.classList.add('ludotheque-card-status');

    const ownership = document.createElement('span');
    ownership.classList.add('ludotheque-checkbox');
    ownership.textContent = gameData.owns
        ? 'Je possède ce jeu'
        : 'Je ne possède pas ce jeu';

    const rules = document.createElement('span');
    rules.classList.add('ludotheque-checkbox');
    rules.textContent = gameData.knowsRules
        ? 'Je connais les règles'
        : 'Je ne connais pas encore les règles';

    statusContainer.append(ownership, rules);
    content.append(statusContainer);

    card.append(imageContainer, content);

    return card;
}

/* ========================================
   Slug d'un jeu
   ======================================== */

function createGameSlug(name) {
    return String(name || 'jeu')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/* ========================================
   Image d'un jeu
   ======================================== */

function getGameImage(game) {
    if (game.image) {
        if (game.image.startsWith('http')) {
            return game.image;
        }

        return `${game.image.startsWith('/') ? '' : '/'}${game.image}`;
    }

    return '';
}

/* ========================================
   Formulaire de modification
   ======================================== */

function openProfileEditForm(user) {
    const profileContent = document.querySelector('.profile-content');

    if (!profileContent) {
        return;
    }

    const section = document.createElement('section');
    section.classList.add('profile-section');

    const title = document.createElement('h2');
    title.textContent = 'Modifier mon profil';

    const form = document.createElement('form');
    form.classList.add('profile-form');

    /* ---------- Photo de profil ---------- */

    const pictureGroup = document.createElement('div');
    pictureGroup.classList.add('profile-form-group');

    const pictureLabel = document.createElement('label');
    pictureLabel.setAttribute('for', 'profile-picture');
    pictureLabel.textContent = 'Photo de profil';

    const picturePreview = document.createElement('img');
    picturePreview.classList.add('profile-picture-preview');
    picturePreview.src = getProfilePictureUrl(user.profilePicture);
    picturePreview.alt = 'Aperçu de votre photo de profil';

    picturePreview.addEventListener('error', () => {
        picturePreview.src = DEFAULT_PROFILE_PICTURE;
    }, { once: true });

    const pictureInput = document.createElement('input');
    pictureInput.type = 'file';
    pictureInput.id = 'profile-picture';
    pictureInput.name = 'profilePicture';
    pictureInput.accept = ALLOWED_PICTURE_TYPES.join(',');

    const pictureHelp = document.createElement('p');
    pictureHelp.classList.add('profile-form-help');
    pictureHelp.textContent =
        'JPEG, PNG, WebP ou GIF. Taille maximale : 10 Mo.';

    let temporaryPictureUrl = null;

    function releaseTemporaryPictureUrl() {
        if (temporaryPictureUrl) {
            URL.revokeObjectURL(temporaryPictureUrl);
            temporaryPictureUrl = null;
        }
    }

    /* ---------- Email ---------- */

    const emailGroup = document.createElement('div');
    emailGroup.classList.add('profile-form-group');

    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'profile-email');
    emailLabel.textContent = 'Email';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'profile-email';
    emailInput.name = 'email';
    emailInput.value = user.email || '';
    emailInput.readOnly = true;

    emailGroup.append(emailLabel, emailInput);

    /* ---------- Pseudo ---------- */

    const pseudoGroup = document.createElement('div');
    pseudoGroup.classList.add('profile-form-group');

    const pseudoLabel = document.createElement('label');
    pseudoLabel.setAttribute('for', 'profile-pseudo');
    pseudoLabel.textContent = 'Pseudo';

    const pseudoInput = document.createElement('input');
    pseudoInput.type = 'text';
    pseudoInput.id = 'profile-pseudo';
    pseudoInput.name = 'pseudo';
    pseudoInput.value = user.pseudo || '';
    pseudoInput.readOnly = true;

    pseudoGroup.append(pseudoLabel, pseudoInput);

    /* ---------- Date de naissance ---------- */

    const dateOfBirthGroup = document.createElement('div');
    dateOfBirthGroup.classList.add('profile-form-group');

    const dateOfBirthLabel = document.createElement('label');
    dateOfBirthLabel.setAttribute(
        'for',
        'profile-date-of-birth'
    );
    dateOfBirthLabel.textContent = 'Date de naissance';

    const dateOfBirthInput = document.createElement('input');
    dateOfBirthInput.type = 'date';
    dateOfBirthInput.id = 'profile-date-of-birth';
    dateOfBirthInput.name = 'dateOfBirth';
    dateOfBirthInput.value = user.dateOfBirth || '';

    dateOfBirthGroup.append(
        dateOfBirthLabel,
        dateOfBirthInput
    );

    /* ---------- Département ---------- */

    const departmentGroup = document.createElement('div');
    departmentGroup.classList.add('profile-form-group');

    const departmentLabel = document.createElement('label');
    departmentLabel.setAttribute('for', 'profile-department');
    departmentLabel.textContent = 'Département';

    const departmentSelect = document.createElement('select');
    departmentSelect.id = 'profile-department';
    departmentSelect.name = 'department';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent =
        'Sélectionnez votre département';

    departmentSelect.append(defaultOption);

    DEPARTMENTS.forEach((department) => {
        const option = document.createElement('option');

        option.value = department.code;
        option.textContent =
            `${department.code} — ${department.name}`;

        if (department.code === user.department) {
            option.selected = true;
        }

        departmentSelect.append(option);
    });

    departmentGroup.append(
        departmentLabel,
        departmentSelect
    );

    /* ---------- Ville ---------- */

    const cityGroup = document.createElement('div');
    cityGroup.classList.add('profile-form-group');

    const cityLabel = document.createElement('label');
    cityLabel.setAttribute('for', 'profile-city');
    cityLabel.textContent = 'Ville';

    const cityInput = document.createElement('input');
    cityInput.type = 'text';
    cityInput.id = 'profile-city';
    cityInput.name = 'city';
    cityInput.value = user.city || '';
    cityInput.placeholder = 'Votre ville';

    cityGroup.append(cityLabel, cityInput);

    /* ---------- Visibilité de la ville ---------- */

    const visibilityGroup = document.createElement('div');
    visibilityGroup.classList.add('profile-form-checkbox');

    const visibilityInput = document.createElement('input');
    visibilityInput.type = 'checkbox';
    visibilityInput.id = 'city-visible';
    visibilityInput.name = 'cityVisible';
    visibilityInput.checked = user.cityVisible === true;

    const visibilityLabel = document.createElement('label');
    visibilityLabel.setAttribute('for', 'city-visible');
    visibilityLabel.textContent =
        'Afficher ma ville aux autres utilisateurs';

    visibilityGroup.append(
        visibilityInput,
        visibilityLabel
    );

    /* ---------- Message d'erreur ---------- */

    const formError = document.createElement('p');
    formError.classList.add('profile-form-error');
    formError.hidden = true;

    /* ---------- Sélection de la photo ---------- */

    pictureInput.addEventListener('change', () => {
        formError.hidden = true;
        formError.textContent = '';

        const file = pictureInput.files[0];

        if (!file) {
            releaseTemporaryPictureUrl();
            picturePreview.src =
                getProfilePictureUrl(user.profilePicture);
            return;
        }

        if (!ALLOWED_PICTURE_TYPES.includes(file.type)) {
            pictureInput.value = '';
            formError.textContent =
                'Format non autorisé. Utilisez JPEG, PNG, WebP ou GIF.';
            formError.hidden = false;
            return;
        }

        if (file.size > MAX_PICTURE_SIZE) {
            pictureInput.value = '';
            formError.textContent =
                'L’image ne doit pas dépasser 10 Mo.';
            formError.hidden = false;
            return;
        }

        releaseTemporaryPictureUrl();

        temporaryPictureUrl = URL.createObjectURL(file);
        picturePreview.src = temporaryPictureUrl;
    });

    pictureGroup.append(
        pictureLabel,
        picturePreview,
        pictureInput,
        pictureHelp
    );

    /* ---------- Actions ---------- */

    const actions = document.createElement('div');
    actions.classList.add('profile-form-actions');

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('profile-cancel-button');
    cancelButton.textContent = 'Annuler';

    cancelButton.addEventListener('click', () => {
        releaseTemporaryPictureUrl();
        loadProfile(profileContent);
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.classList.add('profile-save-button');
    saveButton.textContent = 'Enregistrer';

    actions.append(cancelButton, saveButton);

    /* ---------- Envoi du formulaire ---------- */

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        formError.hidden = true;
        formError.textContent = '';

        const department = departmentSelect.value;
        const selectedPicture = pictureInput.files[0];

        if (department === '') {
            formError.textContent =
                'Veuillez sélectionner votre département.';
            formError.hidden = false;
            return;
        }

        if (selectedPicture) {
            if (!ALLOWED_PICTURE_TYPES.includes(selectedPicture.type)) {
                formError.textContent =
                    'Le format de l’image sélectionnée n’est pas autorisé.';
                formError.hidden = false;
                return;
            }

            if (selectedPicture.size > MAX_PICTURE_SIZE) {
                formError.textContent =
                    'L’image ne doit pas dépasser 10 Mo.';
                formError.hidden = false;
                return;
            }
        }

        const token = getToken();

        if (!token) {
            navigateTo('/connexion');
            return;
        }

        saveButton.disabled = true;
        cancelButton.disabled = true;
        saveButton.textContent = 'Enregistrement...';

        const data = {
            email: user.email,
            pseudo: user.pseudo,
            dateOfBirth: dateOfBirthInput.value,
            department,
            city: cityInput.value.trim() || null,
            cityVisible: visibilityInput.checked
        };

        try {
            // Envoie la photo uniquement si une nouvelle image est sélectionnée.
            if (selectedPicture) {
                await updateProfilePicture(token, selectedPicture);
            }

            await updateCurrentUser(token, data);

            releaseTemporaryPictureUrl();

            // Recharge les données depuis l'API après modification.
            const [updatedUser, updatedGames] = await Promise.all([
                getCurrentUser(token),
                getMyGames(token)
            ]);

            profileContent.replaceChildren(
                createLibraryPreview(updatedGames),
                createProfileInformation(updatedUser)
            );
        } catch (error) {
            console.error(error);

            formError.textContent =
                error.message ||
                'Impossible de modifier votre profil.';

            formError.hidden = false;

            saveButton.disabled = false;
            cancelButton.disabled = false;
            saveButton.textContent = 'Enregistrer';
        }
    });

    form.append(
        pictureGroup,
        emailGroup,
        pseudoGroup,
        dateOfBirthGroup,
        departmentGroup,
        cityGroup,
        visibilityGroup,
        formError,
        actions
    );

    section.append(title, form);
    profileContent.replaceChildren(section);
}

/* ========================================
   Formatage de la date
   ======================================== */

function formatDate(date) {
    if (!date) {
        return 'Non renseignée';
    }

    const parts = date.split('-');

    if (parts.length !== 3) {
        return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}