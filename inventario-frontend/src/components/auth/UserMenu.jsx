// ============================================
// COMPONENTE: UserMenu
// Menú de usuario con info y logout
// ============================================

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Settings, ChevronDown, Shield } from 'lucide-react'
import useAuthStore from '../../stores/authStore'

/**
 * UserMenu - Dropdown con información del usuario y opciones
 *
 * Muestra:
 * - Avatar con iniciales
 * - Nombre y rol del usuario
 * - Opciones: Configuración, Cerrar sesión
 */
const UserMenu = () => {
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)

    const { usuario, logout, isAuthenticated } = useAuthStore()

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Si no está autenticado, no mostrar nada
    if (!isAuthenticated || !usuario) {
        return null
    }

    // Obtener iniciales
    const iniciales = `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()

    // Color del badge según rol
    const rolColors = {
        admin: 'bg-purple-100 text-purple-700',
        gerente: 'bg-blue-100 text-blue-700',
        ventas: 'bg-green-100 text-green-700',
        operaciones: 'bg-amber-100 text-amber-700',
        bodega: 'bg-slate-100 text-slate-700'
    }

    const rolColor = rolColors[usuario.rol] || rolColors.bodega

    /**
     * Cerrar sesión
     */
    const handleLogout = async () => {
        setIsOpen(false)
        await logout()
        navigate('/login')
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Botón del menú */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl
                    transition-all duration-200
                    ${isOpen
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    }
                `}
            >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {iniciales}
                </div>

                {/* Info (oculto en móvil) */}
                <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900 leading-tight">
                        {usuario.nombre} {usuario.apellido}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                        {usuario.rol}
                    </p>
                </div>

                {/* Chevron */}
                <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    {/* Header del dropdown */}
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {iniciales}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 truncate">
                                    {usuario.nombre} {usuario.apellido}
                                </p>
                                <p className="text-sm text-slate-500 truncate">
                                    {usuario.email}
                                </p>
                            </div>
                        </div>
                        {/* Badge de rol */}
                        <div className="mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${rolColor}`}>
                                <Shield className="w-3.5 h-3.5" />
                                {usuario.rol?.charAt(0).toUpperCase() + usuario.rol?.slice(1)}
                            </span>
                        </div>
                    </div>

                    {/* Opciones */}
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                navigate('/configuracion/perfil')
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                            <User className="w-4 h-4 text-slate-400" />
                            Mi perfil
                        </button>

                        <button
                            onClick={() => {
                                setIsOpen(false)
                                navigate('/configuracion')
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                            <Settings className="w-4 h-4 text-slate-400" />
                            Configuración
                        </button>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-slate-100 my-1" />

                    {/* Cerrar sesión */}
                    <div className="py-1">
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserMenu
