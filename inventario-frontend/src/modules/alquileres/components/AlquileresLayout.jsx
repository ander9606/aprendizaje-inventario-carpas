// ============================================
// LAYOUT: AlquileresLayout
// Wrapper de ModuleLayout para módulo de alquileres
// ============================================

import ModuleLayout from '@shared/layouts/ModuleLayout'
import AlquileresSidebar from './alquileres/AlquileresSidebar'
import { useTranslation } from 'react-i18next'

const AlquileresLayout = () => (
  <ModuleLayout sidebar={AlquileresSidebar} />
  const { t } = useTranslation()
)

export default AlquileresLayout
