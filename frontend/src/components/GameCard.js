// Crée une carte présentant un jeu

import { navigateTo } from '../router/router.js';

export function createGameCard(game) {
    const card = document.createElement('a');
    card.href = `/jeux/${game.slug}`;
    card.classList.add('game-card');

    card.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(`/jeux/${game.slug}`);
    });

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('game-card-image');

    const image = document.createElement('img');
    image.src = game.image;
    image.alt = `Boîte du jeu ${game.name}`;

    imageContainer.append(image);

    const content = document.createElement('div');
    content.classList.add('game-card-content');

    const name = document.createElement('h3');
    name.textContent = game.name;

    const information = document.createElement('div');
    information.classList.add('game-card-information');

    const players = document.createElement('span');

    const playersIcon = document.createElement('i');
    playersIcon.classList.add('bi', 'bi-people');
    playersIcon.setAttribute('aria-hidden', 'true');

    const playersText = document.createElement('span');
    playersText.textContent = game.players;

    players.append(playersIcon, playersText);

    const duration = document.createElement('span');

    const durationIcon = document.createElement('i');
    durationIcon.classList.add('bi', 'bi-clock');
    durationIcon.setAttribute('aria-hidden', 'true');

    const durationText = document.createElement('span');
    durationText.textContent = game.duration;

    duration.append(durationIcon, durationText);

    information.append(players, duration);
    content.append(name, information);
    card.append(imageContainer, content);

    return card;
}