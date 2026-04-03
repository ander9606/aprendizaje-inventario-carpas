// ============================================
// LAYOUT: AlquileresLayout
// Wrapper de ModuleLayout para módulo de alquileres
// ============================================

import ModuleLayout from '@shared/layouts/ModuleLayout'
import AlquileresSidebar from './alquileres/AlquileresSidebar'

const AlquileresLayout = () => (
  <ModuleLayout sidebar={AlquileresSidebar} />
)

export default AlquileresLayout
