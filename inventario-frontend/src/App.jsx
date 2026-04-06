// ============================================
// COMPONENTE PRINCIPAL: APP
// Configuración de rutas con React Router
// Incluye autenticación y rutas protegidas
// Lazy loading por módulo para mejor rendimiento
// ============================================

import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Auth (carga inmediata - se necesita al inicio)
import ProtectedRoute from './modules/auth/components/ProtectedRoute'
import LoginPage from './modules/auth/pages/LoginPage'
import RegistroPage from './modules/auth/pages/RegistroPage'

// Dashboard (carga inmediata - primera pantalla tras login)
import ModulosDashboard from './pages/ModulosDashboard'

// ============================================
// LAZY IMPORTS POR MÓDULO
// ============================================

// Dashboard inventario
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Inventario
const Subcategorias = lazy(() => import('./modules/inventario/pages/Subcategorias'))
const ElementosPage = lazy(() => import('./modules/inventario/pages/ElementosPage'))
const ElementoDetallePage = lazy(() => import('./modules/inventario/pages/ElementoDetallePage'))
const UbicacionesPage = lazy(() => import('./modules/inventario/pages/UbicacionesPage'))
const InventarioDashboard = lazy(() => import('./modules/inventario/pages/InventarioDashboard'))

// Productos
const ProductosPage = lazy(() => import('./modules/productos/pages/ProductosPage'))
const ElementosCompuestosPage = lazy(() => import('./modules/productos/pages/ElementosCompuestosPage'))

// Alquileres
const AlquileresLayout = lazy(() => import('./modules/alquileres/components/AlquileresLayout'))
const AlquileresPage = lazy(() => import('./modules/alquileres/pages/AlquileresPage'))
const AlquilerDetallePage = lazy(() => import('./modules/alquileres/pages/AlquilerDetallePage'))
const CotizacionesPage = lazy(() => import('./modules/alquileres/pages/CotizacionesPage'))
const DescuentosPage = lazy(() => import('./modules/alquileres/pages/DescuentosPage'))
const ConfiguracionAlquileresPage = lazy(() => import('./modules/alquileres/pages/ConfiguracionAlquileresPage'))
const ReportesAlquileresPage = lazy(() => import('./modules/alquileres/pages/ReportesAlquileresPage'))
const TransportePage = lazy(() => import('./modules/alquileres/pages/TransportePage'))
const HistorialAlquileresPage = lazy(() => import('./modules/alquileres/pages/HistorialAlquileresPage'))
const HistorialEventosPage = lazy(() => import('./modules/alquileres/pages/HistorialEventosPage'))

// Clientes
const ClientesPage = lazy(() => import('./modules/clientes/pages/ClientesPage'))
const CiudadesPage = lazy(() => import('./modules/clientes/pages/CiudadesPage'))

// Operaciones
const OperacionesLayout = lazy(() => import('./modules/operaciones/components/OperacionesLayout'))
const OperacionesDashboard = lazy(() => import('./modules/operaciones/pages/OperacionesDashboard'))
const OrdenesTrabajoPage = lazy(() => import('./modules/operaciones/pages/OrdenesTrabajoPage'))
const OrdenDetallePage = lazy(() => import('./modules/operaciones/pages/OrdenDetallePage'))
const HistorialOrdenesPage = lazy(() => import('./modules/operaciones/pages/HistorialOrdenesPage'))
const EmpleadosPage = lazy(() => import('./modules/operaciones/pages/EmpleadosPage'))

// Calendario
const CalendarioPage = lazy(() => import('./modules/calendario/pages/CalendarioPage'))
const CalendarioOperaciones = lazy(() => import('./modules/calendario/pages/CalendarioOperaciones'))

// Configuracion
const ConfiguracionPage = lazy(() => import('./modules/configuracion/pages/ConfiguracionPage'))
const AlertasPage = lazy(() => import('./modules/configuracion/pages/AlertasPage'))

// Perfil de usuario
const PerfilPage = lazy(() => import('./modules/auth/pages/PerfilPage'))

// ============================================
// LOADING FALLBACK
// ============================================

const LoadingFallback = () => {
    const { t } = useTranslation()
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-500">{t('common.loading')}</span>
            </div>
        </div>
    )
}

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
const NotFoundPage = () => {
    const { t } = useTranslation()
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {t('pageNotFound.title')}
                </h1>
                <p className="text-slate-600 mb-6">
                    {t('pageNotFound.description')}
                </p>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {t('pageNotFound.backHome')}
                </a>
            </div>
        </div>
    )
}

function App() {
    return (
        <Suspense fallback={<LoadingFallback />}>
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
                    <Route path="/configuracion/perfil" element={<PerfilPage />} />
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
                    element={<NotFoundPage />}
                />
            </Routes>
        </Suspense>
    )
}

export default App
