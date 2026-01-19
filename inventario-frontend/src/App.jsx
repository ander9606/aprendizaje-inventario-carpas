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

// Importar páginas - Productos de Alquiler
import ProductosPage from './pages/ProductosPage'
import ElementosCompuestosPage from './pages/ElementosCompuestosPage'

// Importar páginas - Alquileres
import ClientesPage from './pages/ClientesPage'
import CotizacionesPage from './pages/CotizacionesPage'
import CalendarioPage from './pages/CalendarioPage'

// Importar páginas - Configuración
import ConfiguracionPage from './pages/ConfiguracionPage'
import CiudadesPage from './pages/CiudadesPage'
import EmpleadosPage from './pages/EmpleadosPage'

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
 * /inventario/ubicaciones                                                               → Ubicaciones
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

                <Route path="/inventario/ubicaciones" element={<UbicacionesPage />} />

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
                <Route path="/ubicaciones" element={<UbicacionesPage />} />

                {/* ============================================
                    PRODUCTOS DE ALQUILER
                    ============================================ */}

                <Route path="/productos" element={<ProductosPage />} />
                <Route path="/productos/alquiler" element={<ElementosCompuestosPage />} />

                {/* ============================================
                    ALQUILERES
                    ============================================ */}

                <Route path="/alquileres" element={<CotizacionesPage />} />
                <Route path="/alquileres/cotizaciones" element={<CotizacionesPage />} />
                <Route path="/alquileres/clientes" element={<ClientesPage />} />
                <Route path="/alquileres/calendario" element={<CalendarioPage />} />

                {/* ============================================
                    CONFIGURACIÓN
                    ============================================ */}

                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/configuracion/ciudades" element={<CiudadesPage />} />
                <Route path="/configuracion/ubicaciones" element={<UbicacionesPage />} />

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
