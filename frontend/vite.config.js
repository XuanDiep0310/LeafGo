import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://localhost:7206',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'https://localhost:7206',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})