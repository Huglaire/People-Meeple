// Crée une ligne de résultat pour un joueur

import { navigateTo } from '../router/router.js';

export function createPlayerResult(
    player,
    isSelected = false,
    onSelect = null
) {
    const link = document.createElement('a');
    link.href = `/joueurs/${player.slug}`;
    link.classList.add('player-result');

    if (isSelected) {
        link.classList.add('is-selected');
    }

    link.addEventListener('click', (event) => {
        event.preventDefault();

        // Utilise le comportement fourni par la page si nécessaire
        if (onSelect) {
            onSelect(player);
            return;
        }

        // Sinon, conserve la navigation vers le profil
        navigateTo(`/joueurs/${player.slug}`);
    });

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('player-result-image');

    const image = document.createElement('img');
    image.src = player.image;
    image.alt = `Photo de profil de ${player.name}`;

    imageContainer.append(image);

    const information = document.createElement('div');
    information.classList.add('player-result-information');

    const name = document.createElement('h3');
    name.textContent = player.name;

    const age = document.createElement('span');
    age.textContent = `${player.age} ans`;

    const city = document.createElement('span');
    city.textContent = player.city;

    information.append(name, age, city);

    const games = document.createElement('div');
    games.classList.add('player-result-games');

    // Icône représentant le nombre de jeux
    const gamesIcon = document.createElement('i');
    gamesIcon.classList.add('bi', 'bi-dice-5');
    gamesIcon.setAttribute('aria-hidden', 'true');

    const gamesCount = document.createElement('span');
    gamesCount.textContent = `${player.games} jeux`;

    games.append(gamesIcon, gamesCount);

    const arrow = document.createElement('i');
    arrow.classList.add(
        'bi',
        'bi-chevron-right',
        'player-result-arrow'
    );
    arrow.setAttribute('aria-hidden', 'true');

    link.append(
        imageContainer,
        information,
        games,
        arrow
    );

    return link;
}