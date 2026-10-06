// Crée la navigation principale affichée sur mobile

export function createMobileNavigation() {
    const navigation = document.createElement('nav');
    navigation.classList.add('mobile-navigation');
    navigation.setAttribute('aria-label', 'Navigation principale mobile');

    const links = [
        {
            label: 'Accueil',
            path: '/',
            icon: 'bi-house'
        },
        {
            label: 'Jeux',
            path: '/jeux',
            icon: 'bi-dice-5'
        },
        {
            label: 'Joueurs',
            path: '/joueurs',
            icon: 'bi-people'
        },
        {
            label: 'Messages',
            path: '/discussions',
            icon: 'bi-chat-dots'
        },
        {
            label: 'Profil',
            path: '/profil',
            icon: 'bi-person'
        }
    ];

    const currentPath = window.location.pathname;

    links.forEach((item) => {
        const link = document.createElement('a');
        link.href = item.path;
        link.classList.add('mobile-navigation-link');

        // Identifie la page actuellement affichée
        if (currentPath === item.path) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
        }

        const icon = document.createElement('i');
        icon.classList.add('bi', item.icon, 'mobile-navigation-icon');
        icon.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.textContent = item.label;

        link.append(icon, label);
        navigation.append(link);
    });

    return navigation;
}