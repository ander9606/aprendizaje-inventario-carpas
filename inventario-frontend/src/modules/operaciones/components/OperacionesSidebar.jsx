// ============================================
// COMPONENTE: OperacionesSidebar
// Barra lateral de navegación para módulo de operaciones
// Optimizada para touch/tablet con targets de 44px+
// ============================================

import { NavLink, useNavigate } from 'react-router-dom'
import {
  Truck,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  LayoutDashboard,
  Archive
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
    },
    {
      to: '/operaciones/historial',
      icon: Archive,
      label: 'Historial'
    }
  ]

  const getLinkClass = (isActive) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
    min-h-[44px]
    ${isActive
      ? 'bg-orange-100 text-orange-700 font-medium'
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

        {/* Título del módulo */}
        <div className="flex items-center gap-3 px-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
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
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default OperacionesSidebar
