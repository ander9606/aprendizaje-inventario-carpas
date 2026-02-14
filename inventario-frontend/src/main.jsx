// ============================================
// PUNTO DE ENTRADA: main.jsx
// Aquí React se conecta con el DOM
// ============================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App.jsx'
import './index.css'

// Importar configuración de auth
import useAuthStore from './stores/authStore'
import { configureAuthInterceptor } from './api/Axios.config'

/**
 * ¿QUÉ HACE ESTE ARCHIVO?
 *
 * Este es el PRIMER archivo que se ejecuta cuando la app inicia.
 *
 * FLUJO:
 * 1. index.html tiene un <div id="root"></div>
 * 2. Este archivo busca ese div
 * 3. Configura la autenticación en Axios
 * 4. Monta el componente <App /> dentro del div con todos los providers
 * 5. React toma el control y maneja todo el DOM
 */

// ============================================
// CONFIGURACIÓN DE AXIOS CON AUTH
// ============================================

// Configurar Axios para usar el store de autenticación
configureAuthInterceptor(
    // Función para obtener el estado
    () => useAuthStore.getState(),
    // Función para actualizar el estado
    (newState) => useAuthStore.setState(newState)
)

// ============================================
// CONFIGURACIÓN DE REACT QUERY
// ============================================

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

// ============================================
// RENDERIZAR APLICACIÓN
// ============================================

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
                <App />
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{
                        duration: 3000,
                        style: { fontSize: '14px' }
                    }}
                />
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
 *           └─ App (Rutas)
 *               └─ ProtectedRoute (Auth check)
 *                   └─ Pages (Dashboard, etc.)
 *
 * FLUJO DE AUTENTICACIÓN:
 *
 * 1. Al cargar la app, Zustand recupera el estado de localStorage
 * 2. Axios intercepta cada petición y añade el token JWT
 * 3. Si el token expira (401), se intenta renovar automáticamente
 * 4. Si no se puede renovar, se redirige a /login
 */
