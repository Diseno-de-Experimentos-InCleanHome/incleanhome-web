import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_API_TARGET = 'http://localhost:5000';

export default defineConfig(({ mode }) => {
  // Destino del proxy de desarrollo. Se define en .env.local, que no se versiona.
  const apiTarget = loadEnv(mode, root, 'VITE_').VITE_DEV_PROXY_TARGET || DEFAULT_API_TARGET;

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/**/*.spec.js'],
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
