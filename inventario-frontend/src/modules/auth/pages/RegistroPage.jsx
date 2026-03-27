// ============================================
// PAGINA: REGISTRO / SOLICITAR ACCESO
// Auto-registro con aprobacion del admin
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, UserPlus, AlertCircle, Loader2, Tent, CheckCircle, ArrowLeft } from 'lucide-react'
import authAPI from '../api/apiAuth'

const RegistroPage = () => {
    const navigate = useNavigate()

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [roles, setRoles] = useState([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setFocus
    } = useForm({
        defaultValues: {
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            password: '',
            confirmarPassword: '',
            rol_solicitado_id: ''
        }
    })

    const password = watch('password')

    // Cargar roles disponibles al montar
    useEffect(() => {
        const cargarRoles = async () => {
            try {
                const response = await authAPI.getRolesRegistro()
                setRoles(response.data || [])
            } catch (error) {
                console.error('Error al cargar roles:', error)
            }
        }
        cargarRoles()
    }, [])

    // Enfocar nombre al cargar
    useEffect(() => {
        setFocus('nombre')
    }, [setFocus])

    const onSubmit = async (data) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await authAPI.registro({
                nombre: data.nombre.trim(),
                apellido: data.apellido.trim(),
                email: data.email.trim(),
                telefono: data.telefono?.trim() || null,
                password: data.password,
                rol_solicitado_id: data.rol_solicitado_id ? parseInt(data.rol_solicitado_id) : null
            })
            setSubmitSuccess(true)
        } catch (error) {
            setSubmitError(
                error.response?.data?.message || 'Error al enviar la solicitud. Intenta de nuevo.'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    // Pantalla de exito
    if (submitSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                        Solicitud enviada
                    </h2>
                    <p className="text-slate-600 mb-8">
                        Tu solicitud de acceso ha sido enviada correctamente. Un administrador la revisara y te asignara los permisos correspondientes.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver al login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* PANEL IZQUIERDO - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="tent-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                                <polygon points="60,10 110,110 10,110" fill="none" stroke="currentColor" strokeWidth="1" className="text-amber-400" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#tent-pattern)" />
                    </svg>
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-amber-500/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <Tent className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-amber-400/80 font-medium text-sm tracking-widest uppercase">
                                Sistema de Gestion
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                                Solicitar
                                <br />
                                <span className="text-amber-400">acceso</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                                Completa tus datos para solicitar acceso al sistema. Un administrador revisara tu solicitud.
                            </p>
                        </div>

                        <div className="space-y-3 max-w-md">
                            {[
                                'Completa el formulario con tus datos',
                                'Selecciona el rol que necesitas',
                                'Un administrador aprobara tu solicitud',
                                'Recibiras acceso al sistema'
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm text-slate-300">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-slate-600 text-xs">
                        Gestion integral de alquiler de carpas y eventos
                    </p>
                </div>
            </div>

            {/* PANEL DERECHO - Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6 sm:p-8 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Header mobile */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-4">
                            <Tent className="w-7 h-7 text-amber-400" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Gestion de Carpas y Eventos
                        </h1>
                    </div>

                    {/* Titulo */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Solicitar acceso
                        </h2>
                        <p className="text-slate-500 mt-1">
                            Completa tus datos para solicitar acceso al sistema
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Error global */}
                        {submitError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600">{submitError}</p>
                            </div>
                        )}

                        {/* Nombre y Apellido */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Nombre *
                                </label>
                                <input
                                    id="nombre"
                                    type="text"
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.nombre ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                    placeholder="Tu nombre"
                                    {...register('nombre', { required: 'El nombre es requerido' })}
                                />
                                {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="apellido" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Apellido *
                                </label>
                                <input
                                    id="apellido"
                                    type="text"
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.apellido ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                    placeholder="Tu apellido"
                                    {...register('apellido', { required: 'El apellido es requerido' })}
                                />
                                {errors.apellido && <p className="mt-1 text-sm text-red-600">{errors.apellido.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Correo electronico *
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                placeholder="tu@email.com"
                                {...register('email', {
                                    required: 'El correo es requerido',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Correo electronico invalido'
                                    }
                                })}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                        </div>

                        {/* Telefono */}
                        <div>
                            <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Telefono
                            </label>
                            <input
                                id="telefono"
                                type="tel"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900"
                                placeholder="300 123 4567"
                                {...register('telefono')}
                            />
                        </div>

                        {/* Rol solicitado */}
                        <div>
                            <label htmlFor="rol_solicitado_id" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Rol deseado
                            </label>
                            <select
                                id="rol_solicitado_id"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900"
                                {...register('rol_solicitado_id')}
                            >
                                <option value="">Selecciona un rol</option>
                                {roles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)} - {rol.descripcion}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-400">
                                El administrador podra asignar un rol diferente al aprobar tu solicitud
                            </p>
                        </div>

                        {/* Contrasena */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Contrasena *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                        placeholder="Min. 8 caracteres"
                                        {...register('password', {
                                            required: 'La contrasena es requerida',
                                            minLength: { value: 8, message: 'Minimo 8 caracteres' }
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="confirmarPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Confirmar *
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmarPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.confirmarPassword ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                        placeholder="Repetir contrasena"
                                        {...register('confirmarPassword', {
                                            required: 'Confirma tu contrasena',
                                            validate: value => value === password || 'Las contrasenas no coinciden'
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmarPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmarPassword.message}</p>}
                            </div>
                        </div>

                        {/* Boton enviar */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enviando solicitud...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Solicitar acceso
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link a login */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Ya tienes cuenta?{' '}
                        <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                            Iniciar sesion
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegistroPage
