// ============================================
// COMPONENTE PRINCIPAL: APP
// Configuración de rutas con React Router
// ============================================

import { Routes, Route } from 'react-router-dom'

// Importar páginas
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import Subcategorias from './pages/Subcategorias'
import ElementosPage from './pages/ElementosPage'
import ElementoDetallePage from './pages/ElementoDetallePage'
import UbicacionesPage from './pages/UbicacionesPage'
import ElementosCompuestosPage from './pages/ElementosCompuestosPage'

/**
 * COMPONENTE: App
 *
 * Este componente define las rutas de la aplicación.
 *
 * RUTAS PRINCIPALES:
 * /                                        → HomePage (Menú principal de navegación)
 *
 * MÓDULO INVENTARIO INDIVIDUAL:
 * /inventario                              → Dashboard (Categorías padre)
 * /categorias/:categoriaId                 → Subcategorías
 * /categorias/.../elementos                → Elementos
 * /categorias/.../elementos/:elementoId    → Detalle de Elemento
 *
 * MÓDULO PRODUCTOS (ELEMENTOS COMPUESTOS):
 * /productos/elementos-compuestos          → Gestión de plantillas de productos
 *
 * OTROS:
 * /ubicaciones                             → Gestión de ubicaciones/bodegas
 * /alquileres                              → Gestión de alquileres (próximamente)
 */
function App() {
  return (
    <Routes>
      {/* ============================================
          PÁGINA PRINCIPAL: Menú de navegación
          Ruta: /
          ============================================ */}
      <Route
        path="/"
        element={<HomePage />}
      />

      {/* ============================================
          MÓDULO: INVENTARIO INDIVIDUAL
          ============================================ */}

      {/* Dashboard de Inventario (Categorías Padre) */}
      <Route
        path="/inventario"
        element={<Dashboard />}
      />

      {/* Subcategorías de una categoría */}
      <Route
        path="/categorias/:categoriaId"
        element={<Subcategorias />}
      />

      {/* Elementos de una subcategoría */}
      <Route
        path="/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos"
        element={<ElementosPage />}
      />

      {/* Detalle de un elemento */}
      <Route
        path="/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId"
        element={<ElementoDetallePage />}
      />

      {/* ============================================
          MÓDULO: PRODUCTOS (ELEMENTOS COMPUESTOS)
          ============================================ */}
      <Route
        path="/productos/elementos-compuestos"
        element={<ElementosCompuestosPage />}
      />

      {/* ============================================
          MÓDULO: ALQUILERES (placeholder)
          ============================================ */}
      <Route
        path="/alquileres"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Módulo de Alquileres
              </h1>
              <p className="text-slate-600 mb-6">
                Gestión de clientes, cotizaciones y alquileres
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        }
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