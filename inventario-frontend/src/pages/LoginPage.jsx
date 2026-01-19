// ============================================
// PÁGINA: LOGIN
// Inicio de sesión con autenticación JWT
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Tent } from 'lucide-react'
import { useAuth } from '../hooks/auth/useAuth'

/**
 * Página de Login
 *
 * Características:
 * - Formulario con validación
 * - Mostrar/ocultar contraseña
 * - Manejo de errores (cuenta bloqueada, credenciales inválidas)
 * - Redirección automática si ya está autenticado
 */
const LoginPage = () => {
    const navigate = useNavigate()
    const { login, isAuthenticated, isLoading, error, clearError } = useAuth()

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

    /**
     * Manejar envío del formulario
     */
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md">
                {/* Card principal */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                            <Tent className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            Inventario Carpas
                        </h1>
                        <p className="text-blue-100 mt-2">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                        {/* Mensaje de error global */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">
                                        Error al iniciar sesión
                                    </p>
                                    <p className="text-sm text-red-600 mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Campo Email */}
                        <div className="mb-5">
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className={`
                                    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                                    ${errors.email
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-slate-200 focus:border-blue-500'
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
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Campo Contraseña */}
                        <div className="mb-6">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 mb-2"
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
                                        focus:outline-none focus:ring-2 focus:ring-blue-500/20
                                        ${errors.password
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-slate-200 focus:border-blue-500'
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
                                <p className="mt-2 text-sm text-red-600">
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
                                transition-all duration-200
                                ${isSubmitting
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
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
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Sistema de Gestión de Inventario
                </p>
            </div>
        </div>
    )
}

export default LoginPage
