import { defineConfig } from 'vite';

// Configuration Vite pour le développement local et Docker.
export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true
            },
            '/images': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true
            }
        }
    }
});