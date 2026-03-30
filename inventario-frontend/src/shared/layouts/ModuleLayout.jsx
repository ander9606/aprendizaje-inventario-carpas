// ============================================
// LAYOUT: ModuleLayout
// Layout con sidebar colapsable - responsive tablet-first
// En desktop (lg+): sidebar visible con toggle
// En tablet/mobile (<lg): sidebar como overlay con hamburger
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowLeft } from 'lucide-react'

const ModuleLayout = ({ sidebar: SidebarComponent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const location = useLocation()

  // ============================================
  // Detectar cambio de breakpoint (lg = 1024px)
  // ============================================
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => {
      setIsDesktop(e.matches)
      if (e.matches) setSidebarOpen(false) // Cerrar overlay al pasar a desktop
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // ============================================
  // Cerrar sidebar al navegar (solo en mobile/tablet)
  // ============================================
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isDesktop])

  // ============================================
  // Bloquear scroll del body cuando sidebar overlay está abierta
  // ============================================
  useEffect(() => {
    if (!isDesktop && sidebarOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [sidebarOpen, isDesktop])

  const navigate = useNavigate()
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="h-dvh bg-slate-50 flex overflow-hidden">
      {/* ============================================
          DESKTOP: Sidebar estática colapsable
          ============================================ */}
      {isDesktop && (
        <div
          className={`
            relative transition-all duration-300 ease-in-out flex-shrink-0
            ${sidebarOpen ? 'w-0' : 'w-64'}
          `}
        >
          <div
            className={`
              absolute inset-y-0 left-0 w-64 transition-transform duration-300 ease-in-out
              ${sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
            `}
          >
            <SidebarComponent />
          </div>
        </div>
      )}

      {/* ============================================
          MOBILE/TABLET: Sidebar como overlay
          ============================================ */}
      {!isDesktop && (
        <>
          {/* Backdrop */}
          <div
            className={`
              fixed inset-0 z-40 transition-opacity duration-300
              ${sidebarOpen
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
              }
            `}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={closeSidebar}
          />

          {/* Drawer */}
          <div
            className={`
              fixed inset-y-0 left-0 z-50 w-72
              transform transition-transform duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            {/* Botón cerrar dentro del drawer */}
            <button
              onClick={closeSidebar}
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center
                         rounded-full bg-slate-200/80 text-slate-600 active:bg-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarComponent />
          </div>
        </>
      )}

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar con hamburger (mobile/tablet) o toggle (desktop) */}
        <div className={`
          sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200/60
          flex items-center h-14 px-4 gap-1
          ${isDesktop ? '' : ''}
        `}>
          {/* Botón volver a módulos (solo mobile/tablet) */}
          {!isDesktop && (
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center rounded-xl
                         text-slate-600 hover:bg-slate-100 active:bg-slate-200
                         transition-colors"
              title="Volver a Módulos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-xl
                       text-slate-600 hover:bg-slate-100 active:bg-slate-200
                       transition-colors"
            title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-auto touch-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ModuleLayout
