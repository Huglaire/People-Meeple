
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

    // Affiche l'image par défaut si la photo ne peut pas être chargée
    image.addEventListener('error', () => {
        if (!player.fallbackImage) {
            return;
        }

        const fallbackUrl = new URL(
            player.fallbackImage,
            document.baseURI
        ).href;

        // Évite une boucle si l'image par défaut est elle-même introuvable
        if (image.src !== fallbackUrl) {
            image.src = fallbackUrl;
        } else {
            image.removeAttribute('src');
            image.alt = 'Photo de profil indisponible';
        }
    });

    imageContainer.append(image);

    // Informations du joueur
    const content = document.createElement('div');
    content.classList.add('player-card-content');

    const name = document.createElement('h3');
    name.textContent = player.name;

    // Âge
    const age = createPlayerInformation(
        'bi-person',
        player.age === null || player.age === undefined
            ? 'Âge non renseigné'
            : `${player.age} ans`
    );

    // Ville
    const city = createPlayerInformation(
        'bi-geo-alt',
        player.city || 'Ville non renseignée'
    );

    // Nombre de jeux
    const games = createPlayerInformation(
        'bi-collection',
        `${player.games} jeux`
    );

    // Lien vers le profil du joueur
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

    // Icône Bootstrap
    const icon = document.createElement('i');
    icon.classList.add('bi', iconName);
    icon.setAttribute('aria-hidden', 'true');

    // Texte de l'information
    const label = document.createElement('span');
    label.textContent = text;

    information.append(icon, label);

    return information;
}
