// ============================================
// PÁGINA: DASHBOARD DE MÓDULOS
// Página principal para navegar entre módulos del sistema
// ============================================

import { useNavigate } from 'react-router-dom'
import {
  Package,
  Tent,
  Calendar,
  ArrowRight,
  Settings,
  Truck,
  LogOut
} from 'lucide-react'
import { useGetConfiguracionCompleta } from '../hooks/useConfiguracion'
import { useAuth } from '../hooks/auth/useAuth'

// URL base del backend (sin /api)
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')

export default function ModulosDashboard() {
  const navigate = useNavigate()
  const { data: config, isLoading } = useGetConfiguracionCompleta()
  const { usuario, logout } = useAuth()

  const empresaNombre = config?.empresa_nombre || 'Sistema de Gestión'
  const empresaLogo = config?.empresa_logo || ''

  const modulos = [
    {
      id: 'inventario',
      nombre: 'Inventario',
      descripcion: 'Elementos físicos del inventario: carpas, mesas, sillas, accesorios.',
      icon: Package,
      color: 'blue',
      ruta: '/inventario',
      estado: 'activo',
      tags: ['Categorías', 'Series', 'Lotes']
    },
    {
      id: 'productos',
      nombre: 'Productos',
      descripcion: 'Plantillas de productos combinando elementos para cotizar.',
      icon: Tent,
      color: 'emerald',
      ruta: '/productos/alquiler',
      estado: 'activo',
      tags: ['Plantillas', 'Combos']
    },
    {
      id: 'alquileres',
      nombre: 'Alquileres',
      descripcion: 'Cotizaciones, contratos y gestión de alquileres.',
      icon: Calendar,
      color: 'purple',
      ruta: '/alquileres',
      estado: 'activo',
      tags: ['Cotizaciones', 'Clientes']
    },
    {
      id: 'operaciones',
      nombre: 'Operaciones',
      descripcion: 'Montajes, desmontajes, órdenes de trabajo y equipos.',
      icon: Truck,
      color: 'orange',
      ruta: '/operaciones',
      estado: 'activo',
      tags: ['Órdenes', 'Calendario']
    },
    {
      id: 'configuracion',
      nombre: 'Configuración',
      descripcion: 'Datos maestros: ubicaciones, tarifas, empresa y empleados.',
      icon: Settings,
      color: 'slate',
      ruta: '/configuracion',
      estado: 'activo',
      tags: ['Ubicaciones', 'Empresa']
    }
  ]

  const colorConfig = {
    blue: {
      card: 'border-blue-200/60 hover:border-blue-400 hover:shadow-blue-100/50',
      iconBg: 'bg-blue-500',
      tag: 'bg-blue-50 text-blue-700',
      arrow: 'text-blue-500 group-hover:translate-x-1'
    },
    emerald: {
      card: 'border-emerald-200/60 hover:border-emerald-400 hover:shadow-emerald-100/50',
      iconBg: 'bg-emerald-500',
      tag: 'bg-emerald-50 text-emerald-700',
      arrow: 'text-emerald-500 group-hover:translate-x-1'
    },
    purple: {
      card: 'border-purple-200/60 hover:border-purple-400 hover:shadow-purple-100/50',
      iconBg: 'bg-purple-500',
      tag: 'bg-purple-50 text-purple-700',
      arrow: 'text-purple-500 group-hover:translate-x-1'
    },
    orange: {
      card: 'border-orange-200/60 hover:border-orange-400 hover:shadow-orange-100/50',
      iconBg: 'bg-orange-500',
      tag: 'bg-orange-50 text-orange-700',
      arrow: 'text-orange-500 group-hover:translate-x-1'
    },
    slate: {
      card: 'border-slate-200/60 hover:border-slate-400 hover:shadow-slate-100/50',
      iconBg: 'bg-slate-500',
      tag: 'bg-slate-100 text-slate-700',
      arrow: 'text-slate-500 group-hover:translate-x-1'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ============================================
          HEADER CON LOGO DE EMPRESA
          ============================================ */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {isLoading ? (
              <div className="w-11 h-11 rounded-xl bg-slate-100 animate-pulse" />
            ) : empresaLogo ? (
              <img
                src={`${BACKEND_URL}${empresaLogo}`}
                alt={empresaNombre}
                className="w-11 h-11 rounded-xl object-contain border border-slate-200 bg-white p-0.5"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            {/* Fallback si no hay logo o falla la carga */}
            {!empresaLogo && !isLoading && (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-sm">
                <Tent className="w-6 h-6 text-white" />
              </div>
            )}
            {empresaLogo && (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 items-center justify-center shadow-sm hidden">
                <Tent className="w-6 h-6 text-white" />
              </div>
            )}

            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {isLoading ? <span className="inline-block w-32 h-5 bg-slate-100 rounded animate-pulse" /> : empresaNombre}
              </h1>
              <p className="text-xs text-slate-500">
                Sistema de Gestión
              </p>
            </div>
          </div>

          {/* Usuario y logout */}
          {usuario && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 hidden sm:inline">
                {usuario.nombre || usuario.email}
              </span>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Módulos
          </h2>
          <p className="text-slate-500">
            Selecciona un módulo para comenzar a trabajar
          </p>
        </div>

        {/* ============================================
            GRID DE MÓDULOS
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modulos.map((modulo) => {
            const Icon = modulo.icon
            const colors = colorConfig[modulo.color] || colorConfig.blue

            return (
              <div
                key={modulo.id}
                onClick={() => navigate(modulo.ruta)}
                className={`
                  group relative bg-white rounded-2xl border p-6
                  cursor-pointer transition-all duration-200
                  hover:shadow-lg ${colors.card}
                `}
              >
                {/* Icono */}
                <div className={`
                  w-12 h-12 rounded-xl ${colors.iconBg}
                  flex items-center justify-center mb-4 shadow-sm
                `}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Contenido */}
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                  {modulo.nombre}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {modulo.descripcion}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {modulo.tags.map(tag => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow indicator */}
                <div className="flex items-center gap-1.5">
                  <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${colors.arrow}`} />
                  <span className={`text-sm font-medium ${colors.arrow.split(' ')[0]}`}>
                    Abrir
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 pb-8 pt-4">
        <p className="text-center text-xs text-slate-400">
          Sistema de gestión integral de alquiler de carpas y eventos
        </p>
      </footer>
    </div>
  )
}
