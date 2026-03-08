import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'frontend',
  
  server: {
    port: 3000,
    open: '/proyectopages/index.html',
    host: true,
    fs: {
      allow: ['..']
    },
    // Proxy: redirige /api y /health al backend en puerto 5000
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.webp', '**/*.gif'],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend'),
      '@assets': resolve(__dirname, 'frontend/assets'),
      '@components': resolve(__dirname, 'frontend/components')
    }
  }
})
