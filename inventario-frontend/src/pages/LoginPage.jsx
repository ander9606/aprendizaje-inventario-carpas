// ============================================
// PÁGINA: LOGIN
// Inicio de sesión con autenticación JWT
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Tent, Star, Users, Calendar, Package } from 'lucide-react'
import { useAuth } from '../hooks/auth/useAuth'

const LoginPage = () => {
    const navigate = useNavigate()
    const { login, isAuthenticated, isLoading, error, clearError, checkAuth } = useAuth()

    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setFocus
    } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    })

    // Verificar auth al montar (resuelve isLoading)
    useEffect(() => {
        checkAuth()
    }, [])

    // Redirigir si ya está autenticado
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate('/')
        }
    }, [isAuthenticated, isLoading, navigate])

    // Enfocar el campo email al cargar
    useEffect(() => {
        setFocus('email')
    }, [setFocus])

    // Limpiar error al escribir
    useEffect(() => {
        if (error) {
            clearError()
        }
    }, [])

    const onSubmit = async (data) => {
        setIsSubmitting(true)
        clearError()

        try {
            const result = await login(data.email, data.password)

            if (result.success) {
                navigate('/')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Si está cargando el estado inicial, mostrar spinner
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* ============================================
                PANEL IZQUIERDO - Branding del negocio
                ============================================ */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                {/* Patrón de fondo decorativo */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                    {/* Formas geométricas decorativas (carpas abstractas) */}
                    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="tent-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                                <polygon points="60,10 110,110 10,110" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-400" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#tent-pattern)" />
                    </svg>
                    {/* Gradiente superior */}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-amber-500/10 to-transparent" />
                    {/* Acento inferior */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                </div>

                {/* Contenido del panel */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo y marca */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <Tent className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-amber-400/80 font-medium text-sm tracking-widest uppercase">
                                Sistema de Gestión
                            </span>
                        </div>
                    </div>

                    {/* Mensaje principal */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                                Alquiler de carpas
                                <br />
                                <span className="text-amber-400">y eventos</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                                Gestiona tu inventario, cotizaciones y operaciones desde un solo lugar.
                            </p>
                        </div>

                        {/* Feature highlights */}
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            {[
                                { icon: Package, label: 'Inventario', desc: 'Control total' },
                                { icon: Calendar, label: 'Alquileres', desc: 'Reservas y contratos' },
                                { icon: Users, label: 'Clientes', desc: 'Base centralizada' },
                                { icon: Star, label: 'Cotizaciones', desc: 'Rápidas y precisas' },
                            ].map(({ icon: Icon, label, desc }) => (
                                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <Icon className="w-4 h-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">{label}</p>
                                        <p className="text-xs text-slate-500">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer del panel */}
                    <p className="text-slate-600 text-xs">
                        Gestión integral de alquiler de carpas y eventos
                    </p>
                </div>
            </div>

            {/* ============================================
                PANEL DERECHO - Formulario de login
                ============================================ */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6 sm:p-8">
                <div className="w-full max-w-sm">
                    {/* Header mobile (visible solo en pantallas pequeñas) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-4">
                            <Tent className="w-7 h-7 text-amber-400" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Gestión de Carpas y Eventos
                        </h1>
                    </div>

                    {/* Título del formulario */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Iniciar sesión
                        </h2>
                        <p className="text-slate-500 mt-1">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Mensaje de error global */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">
                                        Error al iniciar sesión
                                    </p>
                                    <p className="text-sm text-red-600 mt-0.5">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Campo Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 mb-1.5"
                            >
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className={`
                                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                                    bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20
                                    ${errors.email
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-slate-200 focus:border-slate-900'
                                    }
                                `}
                                placeholder="tu@email.com"
                                {...register('email', {
                                    required: 'El correo es requerido',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Correo electrónico inválido'
                                    }
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Campo Contraseña */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 mb-1.5"
                            >
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={`
                                        w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200
                                        bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20
                                        ${errors.password
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-slate-200 focus:border-slate-900'
                                        }
                                    `}
                                    placeholder="Tu contraseña"
                                    {...register('password', {
                                        required: 'La contraseña es requerida',
                                        minLength: {
                                            value: 6,
                                            message: 'Mínimo 6 caracteres'
                                        }
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Botón de envío */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                                w-full py-3.5 px-4 rounded-xl font-semibold text-white
                                flex items-center justify-center gap-2
                                transition-all duration-200 mt-2
                                ${isSubmitting
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30'
                                }
                            `}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Iniciar sesión
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 mt-8">
                        Sistema de gestión integral de alquiler
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
