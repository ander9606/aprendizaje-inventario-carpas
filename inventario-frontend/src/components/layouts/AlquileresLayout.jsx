// ============================================
// LAYOUT: AlquileresLayout
// Wrapper de ModuleLayout para módulo de alquileres
// ============================================

import ModuleLayout from './ModuleLayout'
import { AlquileresSidebar } from '../alquileres'

const AlquileresLayout = () => (
  <ModuleLayout sidebar={AlquileresSidebar} />
)

export default AlquileresLayout
