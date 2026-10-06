// Crée la page de connexion

export function createLoginPage() {
    const page = document.createElement('main');
    page.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Connexion';

    page.append(title);

    return page;
}