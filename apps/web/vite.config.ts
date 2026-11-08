import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const envDir = '../..'
  const env = loadEnv(mode, envDir, '')
  const apiPort = env.PORT || '3001'
  const webPort = Number(env.WEB_PORT || '5173')

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    server: {
      port: webPort,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
