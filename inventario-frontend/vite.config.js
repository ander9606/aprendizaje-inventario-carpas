import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@auth': path.resolve(__dirname, 'src/modules/auth'),
      '@inventario': path.resolve(__dirname, 'src/modules/inventario'),
      '@productos': path.resolve(__dirname, 'src/modules/productos'),
      '@alquileres': path.resolve(__dirname, 'src/modules/alquileres'),
      '@clientes': path.resolve(__dirname, 'src/modules/clientes'),
      '@operaciones': path.resolve(__dirname, 'src/modules/operaciones'),
      '@calendario': path.resolve(__dirname, 'src/modules/calendario'),
      '@configuracion': path.resolve(__dirname, 'src/modules/configuracion'),
      '@superadmin': path.resolve(__dirname, 'src/modules/superadmin'),
    }
  },
  server: {
    port: 4173,
    strictPort: true
  }
})