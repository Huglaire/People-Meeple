// Crée la page d'inscription

import { register } from '../api/authApi.js';
import { navigateTo } from '../router/router.js';

import '../css/auth.css';

export function createRegisterPage() {
    const page = document.createElement('main');
    page.classList.add('auth-page');

    const container = document.createElement('div');
    container.classList.add('auth-container');

    const title = document.createElement('h1');
    title.textContent = 'Inscription';

    const introduction = document.createElement('p');
    introduction.classList.add('auth-introduction');
    introduction.textContent =
        'Créez votre compte pour rejoindre la communauté People Meeple.';

    const form = document.createElement('form');
    form.classList.add('auth-form');

    const errorMessage = document.createElement('p');
    errorMessage.classList.add('auth-message', 'auth-message-error');
    errorMessage.hidden = true;

    // Informations du compte
    const pseudoGroup = createField(
        'pseudo',
        'Pseudo',
        'text',
        'Votre pseudo'
    );

    const emailGroup = createField(
        'email',
        'Adresse e-mail',
        'email',
        'Votre adresse e-mail'
    );

    const passwordGroup = createField(
        'password',
        'Mot de passe',
        'password',
        'Votre mot de passe'
    );

    const confirmPasswordGroup = createField(
        'confirm-password',
        'Confirmation du mot de passe',
        'password',
        'Confirmez votre mot de passe'
    );

    // Informations personnelles
    const dateOfBirthGroup = createField(
        'date-of-birth',
        'Date de naissance',
        'date',
        ''
    );

    const departmentGroup = createField(
        'department',
        'Département',
        'text',
        'Ex. 75'
    );

    departmentGroup.input.maxLength = 3;

    const cityGroup = createField(
        'city',
        'Ville',
        'text',
        'Votre ville'
    );

    const cityVisibilityGroup = document.createElement('div');
    cityVisibilityGroup.classList.add('auth-checkbox');

    const cityVisibilityInput = document.createElement('input');
    cityVisibilityInput.id = 'city-visible';
    cityVisibilityInput.name = 'cityVisible';
    cityVisibilityInput.type = 'checkbox';
    cityVisibilityInput.checked = true;

    const cityVisibilityLabel = document.createElement('label');
    cityVisibilityLabel.setAttribute('for', 'city-visible');
    cityVisibilityLabel.textContent =
        'Afficher ma ville sur mon profil';

    cityVisibilityGroup.append(
        cityVisibilityInput,
        cityVisibilityLabel
    );

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('auth-submit');
    submitButton.textContent = 'Créer mon compte';

    const loginText = document.createElement('p');
    loginText.classList.add('auth-switch');

    const loginLink = document.createElement('a');
    loginLink.href = '/connexion';
    loginLink.textContent = 'Se connecter';

    loginLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/connexion');
    });

    loginText.append(
        document.createTextNode('Déjà inscrit ? '),
        loginLink
    );

    form.append(
        pseudoGroup,
        emailGroup,
        passwordGroup,
        confirmPasswordGroup,
        dateOfBirthGroup,
        departmentGroup,
        cityGroup,
        cityVisibilityGroup,
        errorMessage,
        submitButton,
        loginText
    );

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        errorMessage.hidden = true;

        const password = passwordGroup.input.value;
        const confirmPassword = confirmPasswordGroup.input.value;

        if (password !== confirmPassword) {
            errorMessage.textContent =
                'Les deux mots de passe ne correspondent pas.';
            errorMessage.hidden = false;
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Création du compte...';

        const userData = {
            email: emailGroup.input.value.trim(),
            password,
            pseudo: pseudoGroup.input.value.trim(),
            dateOfBirth: dateOfBirthGroup.input.value,
            department: departmentGroup.input.value.trim(),
            city: cityGroup.input.value.trim(),
            cityVisible: cityVisibilityInput.checked
        };

        try {
            await register(userData);

            navigateTo('/connexion');
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.hidden = false;

            submitButton.disabled = false;
            submitButton.textContent = 'Créer mon compte';
        }
    });

    container.append(
        title,
        introduction,
        form
    );

    page.append(container);

    return page;
}

/**
 * Crée un groupe de champ de formulaire.
 */
function createField(name, labelText, type, placeholder) {
    const group = document.createElement('div');
    group.classList.add('auth-field');

    const label = document.createElement('label');
    label.setAttribute('for', `register-${name}`);
    label.textContent = labelText;

    const input = document.createElement('input');
    input.id = `register-${name}`;
    input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    input.required = true;

    if (type === 'email') {
        input.autocomplete = 'email';
    }

    if (type === 'password') {
        input.autocomplete = 'new-password';
    }

    group.append(label, input);

    group.input = input;

    return group;
}