// Crée une carte présentant un joueur

export function createPlayerCard(player) {
    const card = document.createElement('article');
    card.classList.add('player-card');

    // Photo du joueur
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('player-card-image');

    const image = document.createElement('img');
    image.src = player.image;
    image.alt = `Photo de profil de ${player.name}`;

    imageContainer.append(image);

    // Informations du joueur
    const content = document.createElement('div');
    content.classList.add('player-card-content');

    const name = document.createElement('h3');
    name.textContent = player.name;

    // Âge
    const age = createPlayerInformation(
        'bi-person',
        `${player.age} ans`
    );

    // Ville
    const city = createPlayerInformation(
        'bi-geo-alt',
        player.city
    );

    // Nombre de jeux
    const games = createPlayerInformation(
        'bi-collection',
        `${player.games} jeux`
    );

    const profileLink = document.createElement('a');
    profileLink.href = player.path;
    profileLink.textContent = 'Voir le profil';
    profileLink.classList.add('player-card-button');

    content.append(
        name,
        age,
        city,
        games,
        profileLink
    );

    card.append(imageContainer, content);

    return card;
}

// Crée une ligne d'information du profil
function createPlayerInformation(iconName, text) {
    const information = document.createElement('p');
    information.classList.add('player-card-information');

    const icon = document.createElement('i');
    icon.classList.add('bi', iconName);
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = text;

    information.append(icon, label);

    return information;
}