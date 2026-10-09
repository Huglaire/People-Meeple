// Crée la page profil de l'utilisateur connecté

import { getCurrentUser, updateCurrentUser } from '../api/authApi.js';
import { getMyGames } from '../api/userGamesApi.js';
import { getToken } from '../services/authService.js';
import { navigateTo } from '../router/router.js';
import ludothequeImage from '../assets/images/backgrounds/ludotheque.jpg';
import '../css/profile.css';


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
            createProfileInformation(user),
            createProfileActions(user)
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

    const title = document.createElement('h2');
    title.textContent = 'Mes informations';

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
        user.department || 'Non renseigné'
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
        title,
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

    const grid = document.createElement('div');
    grid.classList.add('profile-library-grid');

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
    const card = document.createElement('article');
    card.classList.add('profile-library-card');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('profile-library-card-image');

    const image = document.createElement('img');

    const game = userGame.game || userGame;

    image.src = getGameImage(game);
    image.alt = game.name || 'Jeu de société';

    imageContainer.append(image);

    const content = document.createElement('div');
    content.classList.add('profile-library-card-content');

    const title = document.createElement('h3');
    title.textContent = game.name || 'Jeu';

    const status = document.createElement('p');
    status.classList.add('profile-library-card-status');

    const ownership = userGame.owns
        ? 'Je possède ce jeu'
        : 'Je connais ce jeu';

    const rules = userGame.knowsRules
        ? 'Règles maîtrisées'
        : 'Règles à apprendre';

    status.textContent = `${ownership} • ${rules}`;

    content.append(title, status);
    card.append(imageContainer, content);

    return card;
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


/* ========================================
   Actions du profil
   ======================================== */

function createProfileActions(user) {
    const section = document.createElement('section');
    section.classList.add('profile-actions');

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('profile-edit-button');
    button.textContent = 'Modifier mon profil';

    button.addEventListener('click', () => {
        openProfileEditForm(user);
    });

    section.append(button);

    return section;
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
    departmentLabel.setAttribute(
        'for',
        'profile-department'
    );
    departmentLabel.textContent = 'Département';

    const departmentSelect = document.createElement('select');
    departmentSelect.id = 'profile-department';
    departmentSelect.name = 'department';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Sélectionnez votre département';

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
    visibilityLabel.setAttribute(
        'for',
        'city-visible'
    );
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


    /* ---------- Actions ---------- */

    const actions = document.createElement('div');
    actions.classList.add('profile-form-actions');

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('profile-cancel-button');
    cancelButton.textContent = 'Annuler';

    cancelButton.addEventListener('click', () => {
        loadProfile(profileContent);
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.classList.add('profile-save-button');
    saveButton.textContent = 'Enregistrer';

    actions.append(
        cancelButton,
        saveButton
    );


    /* ---------- Envoi du formulaire ---------- */

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        formError.hidden = true;
        formError.textContent = '';

        const department = departmentSelect.value;

        if (department === '') {
            formError.textContent =
                'Veuillez sélectionner votre département.';

            formError.hidden = false;

            return;
        }

        const token = getToken();

        if (!token) {
            navigateTo('/connexion');

            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = 'Enregistrement...';

        const data = {
            email: emailInput.value.trim(),
            pseudo: pseudoInput.value.trim(),
            dateOfBirth: dateOfBirthInput.value,
            department,
            city: cityInput.value.trim() || null,
            cityVisible: visibilityInput.checked
        };

        try {
            await updateCurrentUser(token, data);

            // Recharge les données depuis l'API après modification
            const [updatedUser, updatedGames] = await Promise.all([
                getCurrentUser(token),
                getMyGames(token)
            ]);

            profileContent.replaceChildren(
                createLibraryPreview(updatedGames),
                createProfileInformation(updatedUser),
                createProfileActions(updatedUser)
            );
        } catch (error) {
            console.error(error);

            formError.textContent =
                error.message ||
                'Impossible de modifier votre profil.';

            formError.hidden = false;

            saveButton.disabled = false;
            saveButton.textContent = 'Enregistrer';
        }
    });


    form.append(
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