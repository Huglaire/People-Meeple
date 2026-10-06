// Crée la page d'inscription

export function createRegisterPage() {
    const page = document.createElement('main');
    page.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.textContent = 'Inscription';

    page.append(title);

    return page;
}