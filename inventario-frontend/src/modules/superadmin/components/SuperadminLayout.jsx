// ============================================
// LAYOUT: SuperadminLayout
// Wrapper de ModuleLayout para módulo superadmin
// ============================================

import ModuleLayout from '@shared/layouts/ModuleLayout'
import SuperadminSidebar from './SuperadminSidebar'

const SuperadminLayout = () => (
    <ModuleLayout sidebar={SuperadminSidebar} />
)

export default SuperadminLayout
