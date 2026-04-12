// ============================================
// COMPONENTE: SuperadminSidebar
// Navegación del módulo super admin
// ============================================

import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Layers,
    ArrowLeft,
    Shield
} from 'lucide-react'

const ACTIVE_CLASS = 'bg-indigo-50 text-indigo-700 font-medium'

const SuperadminSidebar = () => {
    const navigate = useNavigate()

    const navItems = [
        { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/superadmin/tenants', icon: Building2, label: 'Tenants' },
        { to: '/superadmin/planes', icon: Layers, label: 'Planes' },
        { to: '/superadmin/pagos', icon: CreditCard, label: 'Pagos' }
    ]

    const getLinkClass = (isActive) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
        min-h-[44px]
        ${isActive
            ? ACTIVE_CLASS
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
        }
    `

    return (
        <aside className="w-full h-full bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto touch-scroll">
            <div className="p-4 pt-5">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 active:text-slate-900
                               transition-colors text-sm mb-4 px-3 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200
                               w-full min-h-[44px]"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a Modulos</span>
                </button>

                <div className="flex items-center gap-3 px-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Super Admin
                    </h2>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => getLinkClass(isActive)}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    )
}

export default SuperadminSidebar
