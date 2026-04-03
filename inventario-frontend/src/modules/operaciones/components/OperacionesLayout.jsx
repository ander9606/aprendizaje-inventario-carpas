// ============================================
// LAYOUT: OperacionesLayout
// Wrapper de ModuleLayout para módulo de operaciones
// ============================================

import ModuleLayout from '@shared/layouts/ModuleLayout'
import OperacionesSidebar from './OperacionesSidebar'

const OperacionesLayout = () => (
  <ModuleLayout sidebar={OperacionesSidebar} />
)

export default OperacionesLayout
