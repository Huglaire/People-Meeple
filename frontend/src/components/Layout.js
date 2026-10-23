// Crée la structure générale de l'application

import { createHeader } from './Header.js';
import { createFooter } from './Footer.js';

export function createLayout(content) {
    const fragment = document.createDocumentFragment();

    const header = createHeader();

    const main = document.createElement('main');
    main.classList.add('site-main');

    main.append(content);

    const footer = createFooter();

    fragment.append(header, main, footer);

    return fragment;
}