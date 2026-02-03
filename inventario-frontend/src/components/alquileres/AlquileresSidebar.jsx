// ============================================
// COMPONENTE: AlquileresSidebar
// Barra lateral de navegación para módulo de alquileres
// ============================================

import { NavLink, useLocation } from 'react-router-dom'
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
  Building,
  BarChart3
} from 'lucide-react'
import { useState } from 'react'

const AlquileresSidebar = () => {
  const location = useLocation()
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
    },
    {
      to: '/alquileres/configuracion/empresa',
      icon: Building,
      label: 'Datos Empresa'
    }
  ]

  const getLinkClass = (isActive) => `
    flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
    ${isActive
      ? 'bg-blue-100 text-blue-700 font-medium'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }
  `

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex-shrink-0">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Módulo de Alquileres
        </h2>

        {/* Navegación principal */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => getLinkClass(isActive)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Separador */}
        <hr className="my-4 border-slate-200" />

        {/* Sección de configuración (colapsable) */}
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configuración</span>
          </div>
          {configOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Subitems de configuración */}
        {configOpen && (
          <nav className="mt-1 ml-4 space-y-1 border-l border-slate-200 pl-4">
            {configItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => getLinkClass(isActive)}
              >
                <item.icon className="w-4 h-4" />
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
