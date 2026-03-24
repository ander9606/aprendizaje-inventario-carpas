// ============================================
// COMPONENTE: AlquileresSidebar
// Barra lateral de navegación para módulo de alquileres
// Optimizada para touch/tablet con targets de 44px+
// ============================================

import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  Package,
  Users,
  Truck,
  Tag,
  Settings,
  Percent,
  Calendar,
  ChevronDown,
  ChevronRight,
  BarChart3,
  ArrowLeft,
  Archive
} from 'lucide-react'
import { useState } from 'react'

const ACTIVE_CLASS = 'bg-purple-50 text-purple-700 font-medium'

const AlquileresSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [configOpen, setConfigOpen] = useState(
    location.pathname.includes('/alquileres/configuracion') ||
    location.pathname.includes('/alquileres/descuentos')
  )

  const navItems = [
    {
      to: '/alquileres/cotizaciones',
      icon: FileText,
      label: 'Cotizaciones'
    },
    {
      to: '/alquileres/gestion',
      icon: Package,
      label: 'Alquileres'
    },
    {
      to: '/alquileres/clientes',
      icon: Users,
      label: 'Clientes'
    },
    {
      to: '/alquileres/transporte',
      icon: Truck,
      label: 'Transporte'
    },
    {
      to: '/alquileres/calendario',
      icon: Calendar,
      label: 'Calendario'
    },
    {
      to: '/alquileres/reportes',
      icon: BarChart3,
      label: 'Reportes'
    },
    {
      to: '/alquileres/historial',
      icon: Archive,
      label: 'Historial Alquileres'
    },
    {
      to: '/alquileres/historial-eventos',
      icon: Calendar,
      label: 'Historial Eventos'
    }
  ]

  const configItems = [
    {
      to: '/alquileres/descuentos',
      icon: Tag,
      label: 'Descuentos'
    },
    {
      to: '/alquileres/configuracion/impuestos',
      icon: Percent,
      label: 'Impuestos (IVA)'
    },
    {
      to: '/alquileres/configuracion/dias-extra',
      icon: Calendar,
      label: 'Días Extra'
    }
  ]

  const getLinkClass = (isActive) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
    min-h-[44px]
    ${isActive
      ? ACTIVE_CLASS
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
    }
  `

  return (
    <aside className="w-full h-full bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto touch-scroll">
      <div className="p-4 pt-5">
        {/* Volver a Módulos */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 active:text-slate-900
                     transition-colors text-sm mb-4 px-3 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200
                     w-full min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Módulos</span>
        </button>

        <div className="flex items-center gap-3 px-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            Alquileres
          </h2>
        </div>

        {/* Navegación principal */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => getLinkClass(isActive)}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Separador */}
        <hr className="my-4 border-slate-200" />

        {/* Sección de configuración (colapsable) */}
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-slate-600
                     hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors
                     min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Configuración</span>
          </div>
          {configOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Subitems de configuración */}
        {configOpen && (
          <nav className="mt-1 ml-4 space-y-1 border-l border-slate-200 pl-3">
            {configItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </aside>
  )
}

export default AlquileresSidebar
