// ============================================
// LAYOUT: OperacionesLayout
// Wrapper de ModuleLayout para módulo de operaciones
// ============================================

import ModuleLayout from './ModuleLayout'
import { OperacionesSidebar } from '../operaciones'

const OperacionesLayout = () => (
  <ModuleLayout sidebar={OperacionesSidebar} />
)

export default OperacionesLayout
