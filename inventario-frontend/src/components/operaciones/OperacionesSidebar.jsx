// ============================================
// COMPONENTE: OperacionesSidebar
// Barra lateral de navegación para módulo de operaciones
// ============================================

import { NavLink, useNavigate } from 'react-router-dom'
import {
  Truck,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react'

const OperacionesSidebar = () => {
  const navigate = useNavigate()

  const navItems = [
    {
      to: '/operaciones',
      icon: LayoutDashboard,
      label: 'Dashboard',
      end: true
    },
    {
      to: '/operaciones/ordenes',
      icon: ClipboardList,
      label: 'Órdenes de Trabajo'
    },
    {
      to: '/operaciones/calendario',
      icon: Calendar,
      label: 'Calendario'
    },
    {
      to: '/operaciones/alertas',
      icon: AlertTriangle,
      label: 'Alertas'
    }
  ]

  const getLinkClass = (isActive) => `
    flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
    ${isActive
      ? 'bg-orange-100 text-orange-700 font-medium'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }
  `

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex-shrink-0">
      <div className="p-4">
        {/* Volver a Módulos */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm mb-4 px-2 py-1.5 rounded-lg hover:bg-slate-100 w-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Módulos</span>
        </button>

        {/* Título del módulo */}
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Truck className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">
            Operaciones
          </h2>
        </div>

        {/* Navegación principal */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => getLinkClass(isActive)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default OperacionesSidebar
