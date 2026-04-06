// ============================================
// PAGINA: REGISTRO / SOLICITAR ACCESO
// Auto-registro con verificacion de email y aprobacion del admin
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, UserPlus, AlertCircle, Loader2, Tent, CheckCircle, ArrowLeft, Mail, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import authAPI from '../api/apiAuth'
import LanguageSwitcher from '@shared/components/LanguageSwitcher'

const RegistroPage = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    // Flujo: 'formulario' -> 'verificacion' -> 'exito'
    const [paso, setPaso] = useState('formulario')
    const [emailRegistro, setEmailRegistro] = useState('')
    const [roles, setRoles] = useState([])

    // Estado verificación
    const [codigoDigitos, setCodigoDigitos] = useState(['', '', '', '', '', ''])
    const [verificando, setVerificando] = useState(false)
    const [verificacionError, setVerificacionError] = useState(null)
    const [countdown, setCountdown] = useState(0)
    const inputRefs = useRef([])

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
        if (paso === 'formulario') setFocus('nombre')
    }, [setFocus, paso])

    // Countdown para reenvío
    useEffect(() => {
        if (countdown <= 0) return
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    // Enfocar primer input de código al entrar en verificación
    useEffect(() => {
        if (paso === 'verificacion') {
            setTimeout(() => inputRefs.current[0]?.focus(), 100)
        }
    }, [paso])

    // Paso 1: Enviar formulario de registro → recibir código
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
            setEmailRegistro(data.email.trim().toLowerCase())
            setCountdown(60)
            setPaso('verificacion')
        } catch (error) {
            setSubmitError(
                error.response?.data?.message || 'Error al enviar la solicitud. Intenta de nuevo.'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    // Manejar input de código (6 dígitos individuales)
    const handleCodigoChange = useCallback((index, value) => {
        if (!/^\d*$/.test(value)) return

        const nuevosDigitos = [...codigoDigitos]
        nuevosDigitos[index] = value.slice(-1)
        setCodigoDigitos(nuevosDigitos)
        setVerificacionError(null)

        // Auto-avanzar al siguiente input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }, [codigoDigitos])

    const handleCodigoKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace' && !codigoDigitos[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }, [codigoDigitos])

    // Manejar pegado de código completo
    const handlePaste = useCallback((e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length === 0) return

        const nuevosDigitos = [...codigoDigitos]
        for (let i = 0; i < 6; i++) {
            nuevosDigitos[i] = pasted[i] || ''
        }
        setCodigoDigitos(nuevosDigitos)

        const focusIndex = Math.min(pasted.length, 5)
        inputRefs.current[focusIndex]?.focus()
    }, [codigoDigitos])

    // Paso 2: Verificar código
    const handleVerificar = async () => {
        const codigo = codigoDigitos.join('')
        if (codigo.length !== 6) {
            setVerificacionError('Ingresa los 6 dígitos del código.')
            return
        }

        setVerificando(true)
        setVerificacionError(null)

        try {
            await authAPI.verificarEmail(emailRegistro, codigo)
            setPaso('exito')
        } catch (error) {
            setVerificacionError(
                error.response?.data?.message || 'Error al verificar. Intenta de nuevo.'
            )
        } finally {
            setVerificando(false)
        }
    }

    // Auto-submit cuando se completan los 6 dígitos
    useEffect(() => {
        const codigo = codigoDigitos.join('')
        if (codigo.length === 6 && paso === 'verificacion') {
            handleVerificar()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codigoDigitos])

    // Reenviar código
    const handleReenviar = async () => {
        if (countdown > 0) return

        try {
            await authAPI.reenviarCodigo(emailRegistro)
            setCountdown(60)
            setCodigoDigitos(['', '', '', '', '', ''])
            setVerificacionError(null)
            inputRefs.current[0]?.focus()
        } catch (error) {
            setVerificacionError(
                error.response?.data?.message || 'Error al reenviar código.'
            )
        }
    }

    // ==========================================
    // PANTALLA DE ÉXITO (paso 3)
    // ==========================================
    if (paso === 'exito') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                        {t('auth.register.successTitle')}
                    </h2>
                    <p className="text-slate-600 mb-8">
                        {t('auth.register.successMessage')}
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {t('auth.register.backToLogin')}
                    </Link>
                </div>
            </div>
        )
    }

    // ==========================================
    // PANTALLA DE VERIFICACIÓN DE CÓDIGO (paso 2)
    // ==========================================
    if (paso === 'verificacion') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Verifica tu correo
                        </h2>
                        <p className="text-slate-500">
                            Enviamos un código de 6 dígitos a
                        </p>
                        <p className="font-semibold text-slate-700 mt-1">{emailRegistro}</p>
                    </div>

                    {/* Error */}
                    {verificacionError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 mb-6">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{verificacionError}</p>
                        </div>
                    )}

                    {/* Inputs de código */}
                    <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                        {codigoDigitos.map((digito, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digito}
                                onChange={e => handleCodigoChange(index, e.target.value)}
                                onKeyDown={e => handleCodigoKeyDown(index, e)}
                                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                    verificacionError
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-slate-200 focus:border-blue-500'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Botón verificar */}
                    <button
                        onClick={handleVerificar}
                        disabled={verificando || codigoDigitos.join('').length !== 6}
                        className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 ${
                            verificando || codigoDigitos.join('').length !== 6
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-lg shadow-slate-900/20'
                        }`}
                    >
                        {verificando ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Verificar código
                            </>
                        )}
                    </button>

                    {/* Reenviar código */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-slate-500 mb-2">
                            ¿No recibiste el código?
                        </p>
                        <button
                            onClick={handleReenviar}
                            disabled={countdown > 0}
                            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
                                countdown > 0
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:text-blue-700'
                            }`}
                        >
                            <RefreshCw className="w-4 h-4" />
                            {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                        </button>
                    </div>

                    {/* Volver */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => {
                                setPaso('formulario')
                                setCodigoDigitos(['', '', '', '', '', ''])
                                setVerificacionError(null)
                            }}
                            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 inline mr-1" />
                            Volver al formulario
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================
    // FORMULARIO DE REGISTRO (paso 1)
    // ==========================================
    return (
        <div className="min-h-screen flex">
            <div className="absolute top-4 right-4 z-20">
                <LanguageSwitcher compact />
            </div>
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
                                {t('auth.systemTitle')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                                {t('auth.register.title')}
                                <br />
                                <span className="text-amber-400">{t('auth.register.titleAccess')}</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                                {t('auth.register.description')}
                            </p>
                        </div>

                        <div className="space-y-3 max-w-md">
                            {[
                                t('auth.register.steps.fillForm'),
                                'Verifica tu correo electrónico',
                                t('auth.register.steps.adminApproval'),
                                t('auth.register.steps.receiveAccess')
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
                        {t('auth.comprehensiveManagement')}
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
                            {t('auth.tentAndEventManagement')}
                        </h1>
                    </div>

                    {/* Titulo */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">
                            {t('auth.register.submit')}
                        </h2>
                        <p className="text-slate-500 mt-1">
                            {t('auth.register.shortDescription')}
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
                                    {t('auth.register.firstName')} *
                                </label>
                                <input
                                    id="nombre"
                                    type="text"
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.nombre ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                    placeholder={t('auth.register.firstNamePlaceholder')}
                                    {...register('nombre', { required: t('auth.register.firstNameRequired') })}
                                />
                                {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="apellido" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    {t('auth.register.lastName')} *
                                </label>
                                <input
                                    id="apellido"
                                    type="text"
                                    className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.apellido ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                    placeholder={t('auth.register.lastNamePlaceholder')}
                                    {...register('apellido', { required: t('auth.register.lastNameRequired') })}
                                />
                                {errors.apellido && <p className="mt-1 text-sm text-red-600">{errors.apellido.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                {t('auth.register.emailLabel')} *
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                placeholder="tu@email.com"
                                {...register('email', {
                                    required: t('validation.emailRequired'),
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: t('validation.emailInvalidFormat')
                                    }
                                })}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                        </div>

                        {/* Telefono */}
                        <div>
                            <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1.5">
                                {t('auth.register.phoneLabel')}
                            </label>
                            <input
                                id="telefono"
                                type="tel"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900"
                                placeholder={t('auth.register.phonePlaceholder')}
                                {...register('telefono')}
                            />
                        </div>

                        {/* Rol solicitado */}
                        <div>
                            <label htmlFor="rol_solicitado_id" className="block text-sm font-medium text-slate-700 mb-1.5">
                                {t('auth.register.desiredRole')}
                            </label>
                            <select
                                id="rol_solicitado_id"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900"
                                {...register('rol_solicitado_id')}
                            >
                                <option value="">{t('auth.register.selectRole')}</option>
                                {roles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)} - {rol.descripcion}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-400">
                                {t('auth.register.roleNote')}
                            </p>
                        </div>

                        {/* Contrasena */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    {t('auth.register.password')} *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                        placeholder={t('auth.register.passwordPlaceholder')}
                                        {...register('password', {
                                            required: t('validation.passwordRequired'),
                                            minLength: { value: 8, message: t('auth.register.passwordMinLength') }
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
                                    {t('auth.register.confirmPassword')} *
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmarPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errors.confirmarPassword ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-slate-900'}`}
                                        placeholder={t('auth.register.confirmPasswordPlaceholder')}
                                        {...register('confirmarPassword', {
                                            required: t('auth.register.confirmPasswordRequired'),
                                            validate: value => value === password || t('validation.passwordsNoMatch')
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
                                    {t('auth.register.submitting')}
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    {t('auth.register.submit')}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link a login */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        {t('auth.register.hasAccount')}{' '}
                        <Link to="/login" className="font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                            {t('auth.register.goToLogin')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegistroPage
