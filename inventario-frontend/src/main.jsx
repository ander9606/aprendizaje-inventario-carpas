// ============================================
// PUNTO DE ENTRADA: main.jsx
// Aquí React se conecta con el DOM
// ============================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { DialogProvider } from './context/DialogContext'
import App from './App.jsx'
import './index.css'

/**
 * ¿QUÉ HACE ESTE ARCHIVO?
 * 
 * Este es el PRIMER archivo que se ejecuta cuando la app inicia.
 * 
 * FLUJO:
 * 1. index.html tiene un <div id="root"></div>
 * 2. Este archivo busca ese div
 * 3. Monta el componente <App /> dentro del div con todos los providers
 * 4. React toma el control y maneja todo el DOM
 */

/**
 * CONFIGURACIÓN DE REACT QUERY
 * 
 * QueryClient es el "cerebro" de React Query.
 * Configuramos cómo queremos que funcione el cache y las peticiones.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ¿Cuánto tiempo mantener datos en cache? (5 minutos)
      staleTime: 5 * 60 * 1000,
      
      // ¿Cuánto tiempo mantener datos en cache sin usar? (10 minutos)
      cacheTime: 10 * 60 * 1000,
      
      // ¿Reintentar si falla una petición? (1 vez)
      retry: 1,
      
      // ¿Recargar datos cuando la ventana vuelve a tener foco?
      refetchOnWindowFocus: false,
      
      // ¿Recargar datos cuando se reconecta a internet?
      refetchOnReconnect: true,
    },
  },
})

// Buscar el div con id="root" en index.html
const rootElement = document.getElementById('root')

// Crear una "raíz" de React en ese div
const root = createRoot(rootElement)

// Renderizar la aplicación
root.render(
  <StrictMode>
    {/* ============================================
        PROVIDER: React Query
        Hace que React Query esté disponible en toda la app
        ============================================ */}
    <QueryClientProvider client={queryClient}>

      {/* ============================================
          PROVIDER: BrowserRouter
          Habilita la navegación por URL
          ============================================ */}
      <BrowserRouter>
        {/* ============================================
            PROVIDER: DialogProvider
            Sistema de diálogos de confirmación
            ============================================ */}
        <DialogProvider>
          <App />

          {/* ============================================
              TOASTER: Notificaciones toast (sonner)
              ============================================ */}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </DialogProvider>
      </BrowserRouter>

    </QueryClientProvider>
  </StrictMode>
)

/**
 * ARQUITECTURA DE PROVIDERS:
 *
 * StrictMode
 *   └─ QueryClientProvider (React Query)
 *       └─ BrowserRouter (React Router)
 *           └─ DialogProvider (Diálogos de confirmación)
 *               └─ App (Rutas)
 *               └─ Toaster (Notificaciones toast)
 *                   └─ Pages (Dashboard, Subcategorias, etc.)
 *
 * Cada provider "envuelve" a sus hijos y les proporciona funcionalidad.
 */