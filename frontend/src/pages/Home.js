// Crée la page d'accueil

export function createHomePage() {
    const page = document.createElement('main');
    page.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Accueil';

    page.append(title);

    return page;
}