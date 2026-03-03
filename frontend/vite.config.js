/**
 * Vite configuration for LinguaAI frontend.
 * Proxies /api and /ws requests to the backend service.
 *
 * The proxy target defaults to localhost:3001 for local dev.
 * In Docker, set VITE_BACKEND_URL=http://backend:3001 so the
 * frontend container can reach the backend container by service name.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:3001';
const backendWs  = backendUrl.replace(/^http/, 'ws');

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/ws': {
        target: backendWs,
        ws: true,
      },
    },
  },
});
