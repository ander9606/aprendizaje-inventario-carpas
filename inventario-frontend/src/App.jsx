// ============================================
// COMPONENTE PRINCIPAL: APP
// Configuración de rutas con React Router
// ============================================

import { Routes, Route } from 'react-router-dom'

// Importar páginas - Dashboard principal
import ModulosDashboard from './pages/ModulosDashboard'

// Importar páginas - Inventario Individual
import Dashboard from './pages/Dashboard'
import Subcategorias from './pages/Subcategorias'
import ElementosPage from './pages/ElementosPage'
import ElementoDetallePage from './pages/ElementoDetallePage'
import UbicacionesPage from './pages/UbicacionesPage'

// Importar páginas - Productos de Alquiler
import ProductosPage from './pages/ProductosPage'
import ElementosCompuestosPage from './pages/ElementosCompuestosPage'

// Importar páginas - Alquileres
import ClientesPage from './pages/ClientesPage'
import CotizacionesPage from './pages/CotizacionesPage'

/**
 * COMPONENTE: App
 *
 * Este componente define las rutas de la aplicación.
 *
 * RUTAS PRINCIPALES:
 * /                                                                                  → Dashboard de Módulos
 *
 * RUTAS INVENTARIO INDIVIDUAL:
 * /inventario                                                                        → Dashboard Inventario (Categorías padre)
 * /inventario/categorias/:categoriaId                                                → Subcategorias (Nivel 2)
 * /inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos        → Elementos (Nivel 3)
 * /inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:id    → Detalle de Elemento (Nivel 4)
 * /inventario/ubicaciones                                                            → Gestión de ubicaciones
 *
 * RUTAS PRODUCTOS DE ALQUILER:
 * /productos                                                                         → Navegación entre módulos
 * /productos/alquiler                                                                → Elementos Compuestos
 *
 * RUTAS ALQUILERES (futuro):
 * /alquileres                                                                        → Dashboard de Alquileres
 */
function App() {
  return (
    <Routes>
      {/* ============================================
          DASHBOARD DE MÓDULOS
          Ruta: /
          ============================================ */}
      <Route
        path="/"
        element={<ModulosDashboard />}
      />

      {/* ============================================
          INVENTARIO INDIVIDUAL
          ============================================ */}

      {/* Dashboard de Inventario (Categorías Padre) */}
      <Route
        path="/inventario"
        element={<Dashboard />}
      />

      {/* Subcategorías */}
      <Route
        path="/inventario/categorias/:categoriaId"
        element={<Subcategorias />}
      />

      {/* Elementos */}
      <Route
        path="/inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos"
        element={<ElementosPage />}
      />

      {/* Detalle de Elemento */}
      <Route
        path="/inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId"
        element={<ElementoDetallePage />}
      />

      {/* Ubicaciones */}
      <Route
        path="/inventario/ubicaciones"
        element={<UbicacionesPage />}
      />

      {/* Rutas antiguas - Redirección temporal para compatibilidad */}
      <Route
        path="/categorias/:categoriaId"
        element={<Subcategorias />}
      />
      <Route
        path="/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos"
        element={<ElementosPage />}
      />
      <Route
        path="/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId"
        element={<ElementoDetallePage />}
      />
      <Route
        path="/ubicaciones"
        element={<UbicacionesPage />}
      />

      {/* ============================================
          PRODUCTOS DE ALQUILER
          ============================================ */}

      {/* Navegación entre módulos de productos */}
      <Route
        path="/productos"
        element={<ProductosPage />}
      />

      {/* Elementos Compuestos (Plantillas de alquiler) */}
      <Route
        path="/productos/alquiler"
        element={<ElementosCompuestosPage />}
      />

      {/* ============================================
          ALQUILERES
          ============================================ */}

      {/* Dashboard de Alquileres - Cotizaciones */}
      <Route
        path="/alquileres"
        element={<CotizacionesPage />}
      />

      {/* Cotizaciones */}
      <Route
        path="/alquileres/cotizaciones"
        element={<CotizacionesPage />}
      />

      {/* Clientes */}
      <Route
        path="/alquileres/clientes"
        element={<ClientesPage />}
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
