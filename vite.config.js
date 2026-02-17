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
