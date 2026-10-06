// Point d'entrée principal de l'application People Meeple

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './style.css';

const app = document.querySelector('#app');

// Affichage temporaire permettant de vérifier que l'application fonctionne
app.innerHTML = `
    <main class="container py-5">
        <h1 class="display-4">People Meeple</h1>
        <p class="lead">Application en cours de développement.</p>

        <button type="button" class="btn btn-primary">
            Bootstrap fonctionne
        </button>
    </main>
`;