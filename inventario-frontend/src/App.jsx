// ============================================
// COMPONENTE PRINCIPAL: APP
// Configuración de rutas con React Router
// Incluye autenticación y rutas protegidas
// ============================================

import { Routes, Route } from 'react-router-dom'

// Auth
import ProtectedRoute from './modules/auth/components/ProtectedRoute'
import LoginPage from './modules/auth/pages/LoginPage'
import RegistroPage from './modules/auth/pages/RegistroPage'

// Dashboard (top-level)
import ModulosDashboard from './pages/ModulosDashboard'
import Dashboard from './pages/Dashboard'

// Inventario
import Subcategorias from './modules/inventario/pages/Subcategorias'
import ElementosPage from './modules/inventario/pages/ElementosPage'
import ElementoDetallePage from './modules/inventario/pages/ElementoDetallePage'
import UbicacionesPage from './modules/inventario/pages/UbicacionesPage'
import InventarioDashboard from './modules/inventario/pages/InventarioDashboard'

// Productos
import ProductosPage from './modules/productos/pages/ProductosPage'
import ElementosCompuestosPage from './modules/productos/pages/ElementosCompuestosPage'

// Alquileres
import AlquileresLayout from './modules/alquileres/components/AlquileresLayout'
import AlquileresPage from './modules/alquileres/pages/AlquileresPage'
import AlquilerDetallePage from './modules/alquileres/pages/AlquilerDetallePage'
import CotizacionesPage from './modules/alquileres/pages/CotizacionesPage'
import DescuentosPage from './modules/alquileres/pages/DescuentosPage'
import ConfiguracionAlquileresPage from './modules/alquileres/pages/ConfiguracionAlquileresPage'
import ReportesAlquileresPage from './modules/alquileres/pages/ReportesAlquileresPage'
import TransportePage from './modules/alquileres/pages/TransportePage'
import HistorialAlquileresPage from './modules/alquileres/pages/HistorialAlquileresPage'
import HistorialEventosPage from './modules/alquileres/pages/HistorialEventosPage'

// Clientes
import ClientesPage from './modules/clientes/pages/ClientesPage'
import CiudadesPage from './modules/clientes/pages/CiudadesPage'

// Operaciones
import OperacionesLayout from './modules/operaciones/components/OperacionesLayout'
import OperacionesDashboard from './modules/operaciones/pages/OperacionesDashboard'
import OrdenesTrabajoPage from './modules/operaciones/pages/OrdenesTrabajoPage'
import OrdenDetallePage from './modules/operaciones/pages/OrdenDetallePage'
import HistorialOrdenesPage from './modules/operaciones/pages/HistorialOrdenesPage'
import EmpleadosPage from './modules/operaciones/pages/EmpleadosPage'

// Calendario
import CalendarioPage from './modules/calendario/pages/CalendarioPage'
import CalendarioOperaciones from './modules/calendario/pages/CalendarioOperaciones'

// Configuracion
import ConfiguracionPage from './modules/configuracion/pages/ConfiguracionPage'
import AlertasPage from './modules/configuracion/pages/AlertasPage'

/**
 * COMPONENTE: App
 *
 * Este componente define las rutas de la aplicación.
 *
 * RUTAS PÚBLICAS:
 * /login                                                                                → Página de login
 *
 * RUTAS PROTEGIDAS (requieren autenticación):
 * /                                                                                     → Dashboard de Módulos
 *
 * RUTAS INVENTARIO INDIVIDUAL:
 * /inventario                                                                           → Dashboard Inventario
 * /inventario/categorias/:categoriaId                                                   → Subcategorias
 * /inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos           → Elementos
 * /inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:id       → Detalle
 *
 * RUTAS PRODUCTOS DE ALQUILER:
 * /productos                                                                            → Navegación
 * /productos/alquiler                                                                   → Elementos Compuestos
 *
 * RUTAS ALQUILERES:
 * /alquileres                                                                           → Dashboard
 * /alquileres/cotizaciones                                                              → Cotizaciones
 * /alquileres/clientes                                                                  → Clientes
 * /alquileres/calendario                                                                → Calendario
 */
function App() {
    return (
        <Routes>
            {/* ============================================
                RUTAS PÚBLICAS (sin autenticación)
                ============================================ */}

            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroPage />} />

            {/* ============================================
                RUTAS PROTEGIDAS (requieren autenticación)
                ============================================ */}
            <Route element={<ProtectedRoute />}>

                {/* Dashboard de Módulos */}
                <Route path="/" element={<ModulosDashboard />} />

                {/* ============================================
                    INVENTARIO INDIVIDUAL
                    ============================================ */}

                <Route path="/inventario" element={<Dashboard />} />
                <Route path="/inventario/dashboard" element={<InventarioDashboard />} />

                <Route
                    path="/inventario/categorias/:categoriaId"
                    element={<Subcategorias />}
                />

                <Route
                    path="/inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos"
                    element={<ElementosPage />}
                />

                <Route
                    path="/inventario/categorias/:categoriaId/subcategorias/:subcategoriaId/elementos/:elementoId"
                    element={<ElementoDetallePage />}
                />

                {/* Rutas antiguas - Compatibilidad */}
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
                {/* ============================================
                    PRODUCTOS DE ALQUILER
                    ============================================ */}

                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/productos/alquiler" element={<ElementosCompuestosPage />} />

                {/* ============================================
                    ALQUILERES (con sidebar)
                    ============================================ */}

                <Route path="/alquileres" element={<AlquileresLayout />}>
                  <Route index element={<CotizacionesPage />} />
                  <Route path="cotizaciones" element={<CotizacionesPage />} />
                  <Route path="clientes" element={<ClientesPage />} />
                  <Route path="calendario" element={<CalendarioPage />} />
                  <Route path="descuentos" element={<DescuentosPage />} />
                  <Route path="gestion" element={<AlquileresPage />} />
                  <Route path="gestion/:id" element={<AlquilerDetallePage />} />
                  <Route path="historial" element={<HistorialAlquileresPage />} />
                  <Route path="historial-eventos" element={<HistorialEventosPage />} />
                  <Route path="transporte" element={<TransportePage />} />
                  <Route path="reportes" element={<ReportesAlquileresPage />} />
                  <Route path="configuracion" element={<ConfiguracionAlquileresPage />} />
                  <Route path="configuracion/impuestos" element={<ConfiguracionAlquileresPage />} />
                  <Route path="configuracion/dias-extra" element={<ConfiguracionAlquileresPage />} />
                  <Route path="configuracion/empresa" element={<ConfiguracionAlquileresPage />} />
                </Route>

                {/* ============================================
                    CONFIGURACIÓN
                    ============================================ */}

                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/configuracion/ciudades" element={<CiudadesPage />} />
                <Route path="/configuracion/ubicaciones" element={<UbicacionesPage />} />
                <Route path="/configuracion/empresa" element={<ConfiguracionAlquileresPage />} />

                {/* ============================================
                    OPERACIONES (con sidebar)
                    ============================================ */}

                <Route path="/operaciones" element={<OperacionesLayout />}>
                  <Route index element={<OperacionesDashboard />} />
                  <Route path="ordenes" element={<OrdenesTrabajoPage />} />
                  <Route path="ordenes/:id" element={<OrdenDetallePage />} />
                  <Route path="calendario" element={<CalendarioOperaciones />} />
                  <Route path="alertas" element={<AlertasPage />} />
                  <Route path="historial" element={<HistorialOrdenesPage />} />
                </Route>

            </Route>

            {/* ============================================
                RUTAS CON ROLES ESPECÍFICOS (admin/gerente)
                ============================================ */}
            <Route element={<ProtectedRoute roles={['admin', 'gerente']} />}>
                <Route path="/configuracion/empleados" element={<EmpleadosPage />} />
            </Route>

            {/* ============================================
                RUTA 404: Página no encontrada
                ============================================ */}
            <Route
                path="*"
                element={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
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
