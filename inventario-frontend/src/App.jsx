// ============================================
// COMPONENTE PRINCIPAL: APP
// Configuración de rutas con React Router
// Incluye autenticación y rutas protegidas
// ============================================

import { Routes, Route } from 'react-router-dom'

// Importar componentes de autenticación
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'

// Importar páginas - Dashboard principal
import ModulosDashboard from './pages/ModulosDashboard'

// Importar páginas - Inventario Individual
import Dashboard from './pages/Dashboard'
import Subcategorias from './pages/Subcategorias'
import ElementosPage from './pages/ElementosPage'
import ElementoDetallePage from './pages/ElementoDetallePage'
import UbicacionesPage from './pages/UbicacionesPage'
import InventarioDashboard from './pages/InventarioDashboard'

// Importar páginas - Productos de Alquiler
import ProductosPage from './pages/ProductosPage'
import ElementosCompuestosPage from './pages/ElementosCompuestosPage'

// Importar páginas - Alquileres
import ClientesPage from './pages/ClientesPage'
import CotizacionesPage from './pages/CotizacionesPage'
import CalendarioPage from './pages/CalendarioPage'
import DescuentosPage from './pages/DescuentosPage'
import ConfiguracionAlquileresPage from './pages/ConfiguracionAlquileresPage'
import AlquileresPage from './pages/AlquileresPage'
import AlquilerDetallePage from './pages/AlquilerDetallePage'
import AlquileresLayout from './components/layouts/AlquileresLayout'
import OperacionesLayout from './components/layouts/OperacionesLayout'
import ReportesAlquileresPage from './pages/ReportesAlquileresPage'
import TransportePage from './pages/TransportePage'

// Importar páginas - Configuración
import ConfiguracionPage from './pages/ConfiguracionPage'
import CiudadesPage from './pages/CiudadesPage'
import EmpleadosPage from './pages/EmpleadosPage'

// Importar páginas - Operaciones
import OperacionesDashboard from './pages/OperacionesDashboard'
import OrdenesTrabajoPage from './pages/OrdenesTrabajoPage'
import OrdenDetallePage from './pages/OrdenDetallePage'
import CalendarioOperaciones from './pages/CalendarioOperaciones'
import AlertasPage from './pages/AlertasPage'
import HistorialOrdenesPage from './pages/HistorialOrdenesPage'
import HistorialAlquileresPage from './pages/HistorialAlquileresPage'
import HistorialEventosPage from './pages/HistorialEventosPage'

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
