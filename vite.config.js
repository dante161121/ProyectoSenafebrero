import { defineConfig } from 'vite'
import { resolve } from 'path'

const htmlEntries = {
  home: resolve(__dirname, 'frontend/proyectopages/index.html'),
  login: resolve(__dirname, 'frontend/components/auth/login.html'),
  register: resolve(__dirname, 'frontend/components/auth/registro.html'),
  recovery: resolve(__dirname, 'frontend/components/auth/recuperar-password.html'),
  employeeDashboard: resolve(__dirname, 'frontend/components/empleado/dashboard-empleado.html'),
  adminDashboard: resolve(__dirname, 'frontend/components/admin/dashboard-admin.html')
}

export default defineConfig({
  root: 'frontend',
  appType: 'mpa',
  
  server: {
    port: 3000,
    strictPort: true,
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
    emptyOutDir: true,
    rollupOptions: {
      input: htmlEntries
    }
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
