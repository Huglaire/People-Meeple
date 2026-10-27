/**
 * Crée les pages d'information provisoires de People Meeple.
 */

// Crée une page d'information simple.
function createInformationPage(titleText, messageText) {
    const page = document.createElement('section');
    page.classList.add('container', 'py-5');

    const title = document.createElement('h1');
    title.classList.add('mb-4');
    title.textContent = titleText;

    const message = document.createElement('p');
    message.textContent = messageText;

    page.append(title, message);

    return page;
}

// Crée la page Contact.
export function createContactPage() {
    return createInformationPage(
        'Contact',
        'La page contact sera bientôt en ligne.'
    );
}

// Crée la page Mentions légales.
export function createLegalNoticePage() {
    return createInformationPage(
        'Mentions légales',
        'La page des mentions légales sera bientôt en ligne.'
    );
}