// Crée la page de connexion

import { login, getCurrentUser } from '../api/authApi.js';
import { navigateTo } from '../router/router.js';

import '../css/auth.css';

export function createLoginPage() {
    const page = document.createElement('main');
    page.classList.add('auth-page');

    const container = document.createElement('div');
    container.classList.add('auth-container');

    const title = document.createElement('h1');
    title.textContent = 'Connexion';

    const introduction = document.createElement('p');
    introduction.classList.add('auth-introduction');
    introduction.textContent =
        'Connectez-vous pour retrouver vos joueurs et votre ludothèque.';

    const form = document.createElement('form');
    form.classList.add('auth-form');

    const errorMessage = document.createElement('p');
    errorMessage.classList.add('auth-message', 'auth-message-error');
    errorMessage.hidden = true;

    // Champ e-mail
    const emailGroup = createField(
        'email',
        'Adresse e-mail',
        'email',
        'Votre adresse e-mail'
    );

    // Champ mot de passe
    const passwordGroup = createField(
        'password',
        'Mot de passe',
        'password',
        'Votre mot de passe'
    );

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('auth-submit');
    submitButton.textContent = 'Se connecter';

    const registerText = document.createElement('p');
    registerText.classList.add('auth-switch');

    const registerLink = document.createElement('a');
    registerLink.href = '/inscription';
    registerLink.textContent = 'Créer un compte';

    registerLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/inscription');
    });

    registerText.append(
        document.createTextNode('Pas encore de compte ? '),
        registerLink
    );

    form.append(
        emailGroup,
        passwordGroup,
        errorMessage,
        submitButton,
        registerText
    );

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        errorMessage.hidden = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Connexion...';

        const email = emailGroup.input.value.trim();
        const password = passwordGroup.input.value;

        try {
            const data = await login(email, password);

            localStorage.setItem('token', data.token);

            // Récupère immédiatement l'utilisateur connecté
            const user = await getCurrentUser(data.token);

            localStorage.setItem('user', JSON.stringify(user));

            navigateTo('/');
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.hidden = false;

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            submitButton.disabled = false;
            submitButton.textContent = 'Se connecter';
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
    label.setAttribute('for', `login-${name}`);
    label.textContent = labelText;

    const input = document.createElement('input');
    input.id = `login-${name}`;
    input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    input.required = true;
    input.autocomplete =
        type === 'password' ? 'current-password' : 'email';

    group.append(label, input);

    group.input = input;

    return group;
}