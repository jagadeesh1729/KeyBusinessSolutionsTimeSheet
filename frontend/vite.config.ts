import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:3000' || 'http://backend:3000'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://backend:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
