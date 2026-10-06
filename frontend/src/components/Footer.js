// Crée le footer principal de People Meeple

export function createFooter() {
    const footer = document.createElement('footer');
    footer.classList.add('site-footer');

    const container = document.createElement('div');
    container.classList.add('footer-container');

    const copyright = document.createElement('p');
    copyright.textContent = '© People Meeple';

    container.append(copyright);
    footer.append(container);

    return footer;
}