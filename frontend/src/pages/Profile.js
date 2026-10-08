// Crée la page du profil de l'utilisateur connecté

import {
    getCurrentUser,
    updateCurrentUser
} from '../api/authApi.js';

import {
    getToken,
    getStoredUser
} from '../services/authService.js';

import { navigateTo } from '../router/router.js';

import '../css/profile.css';

export function createProfilePage() {
    const page = document.createElement('main');
    page.classList.add('profile-page');

    const container = document.createElement('div');
    container.classList.add('profile-container');

    const title = document.createElement('h1');
    title.textContent = 'Mon profil';

    const introduction = document.createElement('p');
    introduction.classList.add('profile-introduction');
    introduction.textContent =
        'Retrouvez ici les informations de votre compte.';

    const content = document.createElement('div');
    content.classList.add('profile-content');

    const loadingMessage = document.createElement('p');
    loadingMessage.classList.add('profile-message');
    loadingMessage.textContent = 'Chargement de votre profil...';

    content.append(loadingMessage);

    container.append(
        title,
        introduction,
        content
    );

    page.append(container);

    loadProfile(content);

    return page;
}

/**
 * Récupère les informations du profil depuis l'API.
 */
async function loadProfile(content) {
    const token = getToken();

    if (!token) {
        navigateTo('/connexion');
        return;
    }

    try {
        const user = await getCurrentUser(token);

        // Met à jour les informations stockées localement
        localStorage.setItem('user', JSON.stringify(user));

        displayProfile(content, user);
    } catch (error) {
        console.error(error);

        content.replaceChildren();

        const errorMessage = document.createElement('p');
        errorMessage.classList.add(
            'profile-message',
            'profile-message-error'
        );
        errorMessage.textContent =
            'Impossible de récupérer les informations de votre profil.';

        content.append(errorMessage);

        // Si la session locale existe, elle est supprimée
        if (getStoredUser()) {
            localStorage.removeItem('user');
        }

        if (error.message) {
            localStorage.removeItem('token');
        }
    }
}

/**
 * Affiche les informations du profil.
 */
function displayProfile(content, user) {
    content.replaceChildren(
        createProfileInformation(user)
    );
}

/**
 * Crée le contenu présentant les informations du profil.
 */
function createProfileInformation(user) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('profile-information-wrapper');

    const information = document.createElement('div');
    information.classList.add('profile-information');

    const accountSection = document.createElement('section');
    accountSection.classList.add('profile-section');

    const accountTitle = document.createElement('h2');
    accountTitle.textContent = 'Informations du compte';

    const accountList = document.createElement('dl');
    accountList.classList.add('profile-list');

    accountList.append(
        createProfileRow('Pseudo', user.pseudo),
        createProfileRow('Adresse e-mail', user.email),
        createProfileRow('Membre depuis', formatDate(user.createdAt))
    );

    accountSection.append(
        accountTitle,
        accountList
    );

    const personalSection = document.createElement('section');
    personalSection.classList.add('profile-section');

    const personalTitle = document.createElement('h2');
    personalTitle.textContent = 'Informations personnelles';

    const personalList = document.createElement('dl');
    personalList.classList.add('profile-list');

    personalList.append(
        createProfileRow(
            'Date de naissance',
            formatDate(user.dateOfBirth)
        ),
        createProfileRow('Département', user.department),
        createProfileRow(
            'Ville',
            user.cityVisible ? user.city : 'Ville masquée'
        )
    );

    personalSection.append(
        personalTitle,
        personalList
    );

    information.append(
        accountSection,
        personalSection
    );

    // Bouton permettant d'ouvrir le formulaire de modification
    const actions = document.createElement('div');
    actions.classList.add('profile-actions');

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.classList.add('profile-button');
    editButton.textContent = 'Modifier mes informations';

    editButton.addEventListener('click', () => {
        const content = wrapper.parentElement;

        if (content) {
            content.replaceChildren(
                createProfileForm(user)
            );
        }
    });

    actions.append(editButton);

    wrapper.append(
        information,
        actions
    );

    return wrapper;
}

/**
 * Crée le formulaire de modification du profil.
 */
function createProfileForm(user) {
    const form = document.createElement('form');
    form.classList.add('profile-form');

    const title = document.createElement('h2');
    title.textContent = 'Modifier mes informations';

    const fields = document.createElement('div');
    fields.classList.add('profile-form-fields');

    const pseudoGroup = createFormField(
        'Pseudo',
        'pseudo',
        'text',
        user.pseudo,
        true
    );

    const emailGroup = createFormField(
        'Adresse e-mail',
        'email',
        'email',
        user.email,
        true
    );

    const dateGroup = createFormField(
        'Date de naissance',
        'dateOfBirth',
        'date',
        user.dateOfBirth,
        true
    );

    const departmentGroup = createFormField(
        'Département',
        'department',
        'text',
        user.department,
        true
    );

    const cityGroup = createFormField(
        'Ville',
        'city',
        'text',
        user.city || '',
        false
    );

    const visibilityGroup = document.createElement('div');
    visibilityGroup.classList.add('profile-form-checkbox');

    const visibilityInput = document.createElement('input');
    visibilityInput.type = 'checkbox';
    visibilityInput.id = 'cityVisible';
    visibilityInput.name = 'cityVisible';
    visibilityInput.checked = user.cityVisible;

    const visibilityLabel = document.createElement('label');
    visibilityLabel.setAttribute('for', 'cityVisible');
    visibilityLabel.textContent = 'Afficher ma ville aux autres joueurs';

    visibilityGroup.append(
        visibilityInput,
        visibilityLabel
    );

    fields.append(
        pseudoGroup,
        emailGroup,
        dateGroup,
        departmentGroup,
        cityGroup,
        visibilityGroup
    );

    const message = document.createElement('p');
    message.classList.add('profile-form-message');

    const actions = document.createElement('div');
    actions.classList.add('profile-form-actions');

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add(
        'profile-button',
        'profile-button-secondary'
    );
    cancelButton.textContent = 'Annuler';

    cancelButton.addEventListener('click', () => {
        const content = form.parentElement;

        if (content) {
            content.replaceChildren(
                createProfileInformation(user)
            );
        }
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('profile-button');
    submitButton.textContent = 'Enregistrer les modifications';

    actions.append(
        cancelButton,
        submitButton
    );

    form.append(
        title,
        fields,
        message,
        actions
    );

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            navigateTo('/connexion');
            return;
        }

        message.textContent = '';
        message.classList.remove(
            'profile-form-message-error',
            'profile-form-message-success'
        );

        submitButton.disabled = true;
        submitButton.textContent = 'Enregistrement...';

        const userData = {
            pseudo: pseudoGroup.input.value.trim(),
            email: emailGroup.input.value.trim(),
            dateOfBirth: dateGroup.input.value,
            department: departmentGroup.input.value.trim(),
            city: cityGroup.input.value.trim() || null,
            cityVisible: visibilityInput.checked
        };

        try {
            await updateCurrentUser(token, userData);

            // Récupère les données actualisées depuis l'API
            const updatedUser = await getCurrentUser(token);

            // Met à jour les informations locales
            localStorage.setItem(
                'user',
                JSON.stringify(updatedUser)
            );

            message.textContent =
                'Vos informations ont bien été modifiées.';
            message.classList.add(
                'profile-form-message-success'
            );

            // Affiche le profil actualisé
            const content = form.parentElement;

            if (content) {
                content.replaceChildren(
                    createProfileInformation(updatedUser)
                );
            }
        } catch (error) {
            console.error(error);

            message.textContent =
                error.message ||
                'Impossible de modifier votre profil.';
            message.classList.add(
                'profile-form-message-error'
            );

            submitButton.disabled = false;
            submitButton.textContent =
                'Enregistrer les modifications';
        }
    });

    return form;
}

/**
 * Crée un champ du formulaire.
 */
function createFormField(
    labelText,
    name,
    type,
    value,
    required
) {
    const group = document.createElement('div');
    group.classList.add('profile-form-group');

    const label = document.createElement('label');
    label.setAttribute('for', name);
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = type;
    input.id = name;
    input.name = name;
    input.value = value || '';
    input.required = required;

    group.append(
        label,
        input
    );

    group.input = input;

    return group;
}

/**
 * Crée une ligne d'information du profil.
 */
function createProfileRow(labelText, value) {
    const row = document.createElement('div');
    row.classList.add('profile-row');

    const label = document.createElement('dt');
    label.textContent = labelText;

    const information = document.createElement('dd');
    information.textContent = value || 'Non renseigné';

    row.append(
        label,
        information
    );

    return row;
}

/**
 * Formate une date reçue depuis l'API.
 */
function formatDate(date) {
    if (!date) {
        return 'Non renseignée';
    }

    const formattedDate = new Date(date);

    if (Number.isNaN(formattedDate.getTime())) {
        return date;
    }

    return formattedDate.toLocaleDateString('fr-FR');
}