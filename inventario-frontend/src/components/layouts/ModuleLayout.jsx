// ============================================
// LAYOUT: ModuleLayout
// Layout unificado con sidebar colapsable para cualquier módulo
// Reemplaza AlquileresLayout y OperacionesLayout
// ============================================

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ModuleLayout = ({ sidebar: SidebarComponent }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar con transición */}
      <div
        className={`
          relative transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-0' : 'w-64'}
        `}
      >
        <div
          className={`
            absolute inset-y-0 left-0 w-64 transition-transform duration-300 ease-in-out
            ${sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}
          `}
        >
          <SidebarComponent />
        </div>
      </div>

      {/* Botón toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`
          absolute z-20 top-1/2 -translate-y-1/2
          w-6 h-12 bg-white border border-slate-200
          rounded-r-lg shadow-md hover:bg-slate-50
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'left-0' : 'left-64'}
        `}
        title={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        )}
      </button>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default ModuleLayout
