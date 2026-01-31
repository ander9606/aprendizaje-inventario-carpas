// ============================================
// LAYOUT: AlquileresLayout
// Layout con sidebar para módulo de alquileres
// ============================================

import { Outlet } from 'react-router-dom'
import { AlquileresSidebar } from '../alquileres'

const AlquileresLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AlquileresSidebar />

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AlquileresLayout
