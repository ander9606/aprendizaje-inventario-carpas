// ============================================
// APP.JSX - Componente Principal
// Configuración de providers y rutas
// ============================================

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { QUERY_CONFIG } from './utils/constants'

// Páginas
import Dashboard from './pages/Dashboard'
// Próximas páginas (se crearán después):
// import Subcategorias from './pages/Subcategorias'
// import Elementos from './pages/Elementos'
// import ElementoDetalle from './pages/ElementoDetalle'

// ============================================
// CONFIGURACIÓN DE REACT QUERY
// ============================================
/**
 * QueryClient es el cliente de React Query que maneja:
 * - Cache de datos
 * - Revalidación automática
 * - Estados de carga
 * - Manejo de errores
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.staleTime,         // Tiempo antes de considerar datos obsoletos
      cacheTime: QUERY_CONFIG.cacheTime,         // Tiempo de cache
      refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,  // No recargar al volver a la ventana
      retry: QUERY_CONFIG.retry,                 // Reintentar 1 vez si falla
    },
  },
})

/**
 * Componente principal de la aplicación
 * 
 * ESTRUCTURA:
 * 1. QueryClientProvider - Proveedor de React Query para manejo de datos
 * 2. BrowserRouter - Proveedor de rutas de React Router
 * 3. Routes - Definición de rutas de la aplicación
 * 
 * NIVELES DE NAVEGACIÓN:
 * - Nivel 1: Dashboard (/) - Categorías padre
 * - Nivel 2: Subcategorías (/categorias/:id) - Subcategorías de una categoría
 * - Nivel 3: Elementos (/elementos/:id) - Elementos de una subcategoría
 * - Detalle: Elemento (/elemento/:id) - Vista detallada de un elemento
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          <Routes>
            {/* ============================================
                NIVEL 1: DASHBOARD DE CATEGORÍAS PADRE
                Muestra todas las categorías principales
                ============================================ */}
            <Route 
              path="/" 
              element={<Dashboard />} 
            />
            
            {/* Las siguientes rutas se descomentarán cuando creemos las páginas */}
            
            {/* ============================================
                NIVEL 2: SUBCATEGORÍAS
                Muestra subcategorías de una categoría padre
                ============================================ */}
            {/* <Route 
              path="/categorias/:categoriaId" 
              element={<Subcategorias />} 
            /> */}
            
            {/* ============================================
                NIVEL 3: ELEMENTOS
                Muestra elementos de una subcategoría
                ============================================ */}
            {/* <Route 
              path="/elementos/:subcategoriaId" 
              element={<Elementos />} 
            /> */}
            
            {/* ============================================
                VISTA DETALLADA DE ELEMENTO
                Muestra información completa de un elemento
                ============================================ */}
            {/* <Route 
              path="/elemento/:elementoId" 
              element={<ElementoDetalle />} 
            /> */}
            
            {/* ============================================
                RUTA 404 - NO ENCONTRADA
                ============================================ */}
            <Route 
              path="*" 
              element={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-slate-900 mb-4">
                      404
                    </h1>
                    <p className="text-xl text-slate-600">
                      Página no encontrada
                    </p>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App