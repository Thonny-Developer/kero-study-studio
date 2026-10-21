import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // В dev API и публичные страницы проектов проксируются на backend (см. ../backend)
  const target = env.BACKEND_URL || 'http://localhost:8787'
  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api': { target },
        '/p/': { target },
      },
    },
    preview: { host: true },
  }
})
