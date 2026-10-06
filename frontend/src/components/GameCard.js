// Crée une carte présentant un jeu

export function createGameCard(game) {
    const card = document.createElement('article');
    card.classList.add('game-card');

    // Image du jeu
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('game-card-image');

    const image = document.createElement('img');
    image.src = game.image;
    image.alt = `Boîte du jeu ${game.name}`;

    imageContainer.append(image);

    // Informations du jeu
    const content = document.createElement('div');
    content.classList.add('game-card-content');

    const name = document.createElement('h3');
    name.textContent = game.name;

    const information = document.createElement('div');
    information.classList.add('game-card-information');

    // Nombre de joueurs
    const players = document.createElement('span');

    const playersIcon = document.createElement('i');
    playersIcon.classList.add('bi', 'bi-people');
    playersIcon.setAttribute('aria-hidden', 'true');

    const playersText = document.createElement('span');
    playersText.textContent = game.players;

    players.append(playersIcon, playersText);

    // Durée
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