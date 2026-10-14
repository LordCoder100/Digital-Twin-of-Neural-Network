import { defineConfig } from 'vite'

// In dev, Vite serves the frontend and proxies API/WebSocket calls to local FastAPI.
// In production, FastAPI serves the built frontend itself, so everything is same-origin.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/ws': { target: 'ws://127.0.0.1:8000', ws: true },
    },
  },
})
