// Crée la navigation principale affichée sur mobile

import { isAuthenticated } from '../services/authService.js';

export function createMobileNavigation() {
    const navigation = document.createElement('nav');
    navigation.classList.add('mobile-navigation');
    navigation.setAttribute(
        'aria-label',
        'Navigation principale mobile'
    );

    // Définit les liens publics
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
        }
    ];

    // Ajoute les liens privés si l'utilisateur est connecté
    if (isAuthenticated()) {
        links.push(
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
        );
    }

    const currentPath = window.location.pathname;

    links.forEach((item) => {
        const link = document.createElement('a');

        link.href = item.path;
        link.classList.add('mobile-navigation-link');

        // Signale la page actuellement affichée
        if (
            currentPath === item.path ||
            (
                item.path === '/jeux' &&
                currentPath.startsWith('/jeux/')
            )
        ) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
        }

        // Crée l'icône du lien
        const icon = document.createElement('i');
        icon.classList.add(
            'bi',
            item.icon,
            'mobile-navigation-icon'
        );
        icon.setAttribute('aria-hidden', 'true');

        // Crée le texte du lien
        const label = document.createElement('span');
        label.textContent = item.label;

        link.append(icon, label);

        // Utilise le routeur interne
        link.addEventListener('click', (event) => {
            event.preventDefault();

            // Évite une nouvelle entrée d'historique inutile
            if (window.location.pathname === item.path) {
                return;
            }

            import('../router/router.js').then(({ navigateTo }) => {
                navigateTo(item.path);
            });
        });

        navigation.append(link);
    });

    return navigation;
}