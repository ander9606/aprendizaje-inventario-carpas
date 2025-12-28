// ============================================
// COMPONENTE PRINCIPAL: APP
// Configuración de rutas con React Router
// ============================================

import { Routes, Route } from 'react-router-dom'

// Importar páginas
import Dashboard from './pages/Dashboard'
import Subcategorias from './pages/Subcategorias'
import ElementosPage from './pages/ElementosPage'
import ElementoDetallePage from './pages/ElementoDetallePage'
import UbicacionesPage from './pages/UbicacionesPage'

/**
 * COMPONENTE: App
 *
 * Este componente define las rutas de la aplicación.
 *
 * RUTAS:
 * /                                                                                  → Dashboard (Nivel 1: Categorías padre)
 * /categorias/:categoriaId                                                           → Subcategorias (Nivel 2: Subcategorías)
 * /categorias/:categoriaId/subcategorias/:subcategoriaId/elementos                   → Elementos (Nivel 3: Elementos)
 * /categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId       → Detalle de Elemento (Nivel 4)
 */
function App() {
  return (
    <Routes>
      {/* ============================================
          NIVEL 1: Dashboard (Categorías Padre)
          Ruta: /
          ============================================ */}
      <Route
        path="/"
        element={<Dashboard />}
      />

      {/* ============================================
          NIVEL 2: Subcategorías
          Ruta: /categorias/:categoriaId
          ============================================ */}
      <Route
        path="/categorias/:categoriaId"
        element={<Subcategorias />}
      />

      {/* ============================================
          NIVEL 3: Elementos
          Ruta: /categorias/:categoriaId/subcategorias/:subcategoriaId/elementos
          ============================================ */}
      <Route
        path="/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos"
        element={<ElementosPage />}
      />

      {/* ============================================
          NIVEL 4: Detalle de Elemento
          Ruta: /categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId
          ============================================ */}
      <Route
        path="/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId"
        element={<ElementoDetallePage />}
      />

      {/* ============================================
          UBICACIONES: Gestión de ubicaciones
          Ruta: /ubicaciones
          ============================================ */}
      <Route
        path="/ubicaciones"
        element={<UbicacionesPage />}
      />

      {/* ============================================
          RUTA 404: Página no encontrada
          ============================================ */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Página no encontrada
              </h1>
              <p className="text-slate-600 mb-6">
                La página que buscas no existe
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        } 
      />
    </Routes>
  )
}

export default App