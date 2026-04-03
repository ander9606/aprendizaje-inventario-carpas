// ============================================
// LAYOUT: OperacionesLayout
// Wrapper de ModuleLayout para módulo de operaciones
// ============================================

import ModuleLayout from '@shared/layouts/ModuleLayout'
import OperacionesSidebar from './OperacionesSidebar'
import { useTranslation } from 'react-i18next'

const OperacionesLayout = () => (
  <ModuleLayout sidebar={OperacionesSidebar} />
  const { t } = useTranslation()
)

export default OperacionesLayout
