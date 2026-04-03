// ============================================
// COMPONENTE: EmpleadoFormModal
// Modal para crear/editar empleados
// ============================================

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Shield } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { useCreateEmpleado, useUpdateEmpleado } from '../../hooks/useEmpleados'
import { useTranslation } from 'react-i18next'

/**
 * COMPONENTE: EmpleadoFormModal
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {'crear'|'editar'} mode - Modo del formulario
 * @param {Object|null} empleado - Datos del empleado (solo en modo editar)
 * @param {Array} roles - Lista de roles disponibles
 */
const EmpleadoFormModal = ({
    isOpen,
    onClose,
    mode = 'crear',
    empleado = null,
    roles = []
}) => {
  const { t } = useTranslation()
    // ============================================
    // ESTADO LOCAL DEL FORMULARIO
    // ============================================
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        password: '',
        confirmarPassword: '',
        rol_id: '',
        estado: 'activo'
    })

    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // ============================================
    // HOOKS DE API
    // ============================================
    const { mutateAsync: createEmpleado, isPending: isCreating } = useCreateEmpleado()
    const { mutateAsync: updateEmpleado, isPending: isUpdating } = useUpdateEmpleado()

    const isLoading = isCreating || isUpdating

    // ============================================
    // EFFECTS
    // ============================================
    useEffect(() => {
        if (mode === 'editar' && empleado) {
            setFormData({
                nombre: empleado.nombre || '',
                apellido: empleado.apellido || '',
                email: empleado.email || '',
                telefono: empleado.telefono || '',
                password: '',
                confirmarPassword: '',
                rol_id: empleado.rol_id || '',
                estado: empleado.estado || 'activo'
            })
        } else {
            setFormData({
                nombre: '',
                apellido: '',
                email: '',
                telefono: '',
                password: '',
                confirmarPassword: '',
                rol_id: roles[0]?.id || '',
                estado: 'activo'
            })
        }
        setErrors({})
        setShowPassword(false)
        setShowConfirmPassword(false)
    }, [mode, empleado, isOpen, roles])

    // ============================================
    // HANDLERS
    // ============================================
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.nombre.trim()) {
            newErrors.nombre = t('operations.employee.firstNameRequired')
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = t('operations.employee.lastNameRequired')
        }

        if (!formData.email.trim()) {
            newErrors.email = t('operations.employee.emailRequired')
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                newErrors.email = t('operations.employee.invalidEmail')
            }
        }

        if (!formData.rol_id) {
            newErrors.rol_id = t('operations.employee.roleRequired')
        }

        // Validar contraseña solo en modo crear o si se quiere cambiar
        if (mode === 'crear') {
            if (!formData.password) {
                newErrors.password = t('operations.employee.passwordRequired')
            } else if (formData.password.length < 8) {
                newErrors.password = t('operations.employee.minPassword')
            }

            if (formData.password !== formData.confirmarPassword) {
                newErrors.confirmarPassword = t('operations.employee.passwordsMismatch')
            }
        } else if (formData.password) {
            // En modo editar, validar solo si se ingresó contraseña
            if (formData.password.length < 8) {
                newErrors.password = t('operations.employee.minPassword')
            }
            if (formData.password !== formData.confirmarPassword) {
                newErrors.confirmarPassword = t('operations.employee.passwordsMismatch')
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) {
            return
        }

        const dataToSend = {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            email: formData.email.trim(),
            telefono: formData.telefono.trim() || null,
            rol_id: parseInt(formData.rol_id),
            estado: formData.estado
        }

        // Agregar contraseña solo si se proporcionó
        if (formData.password) {
            dataToSend.password = formData.password
        }

        try {
            if (mode === 'crear') {
                await createEmpleado(dataToSend)
            } else {
                await updateEmpleado({ id: empleado.id, data: dataToSend })
            }
            onClose()
        } catch (error) {
            console.error('Error al guardar empleado:', error)
            const mensajeError = error.response?.data?.message ||
                (mode === 'crear' ? t('operations.employee.createError') : t('operations.employee.updateError'))
            setErrors({ submit: mensajeError })
        }
    }

    const handleClose = () => {
        if (!isLoading) {
            onClose()
        }
    }

    // Helper para obtener descripción del rol
    const getRolDescripcion = (rolId) => {
        const rol = roles.find(r => r.id === parseInt(rolId))
        return rol?.descripcion || ''
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={mode === 'crear' ? t('operations.newEmployee') : t('operations.editEmployee')}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ERROR GENERAL */}
                {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <p className="text-sm font-medium">{errors.submit}</p>
                    </div>
                )}

                {/* INFORMACIÓN PERSONAL */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">{t('operations.employee.personalInfo')}</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('operations.employee.firstName')} *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder={t('operations.employee.firstName')}
                                disabled={isLoading}
                                className={`
                                    w-full px-4 py-2.5 border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-purple-500
                                    disabled:bg-slate-100 disabled:cursor-not-allowed
                                    ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                                `}
                            />
                            {errors.nombre && (
                                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                            )}
                        </div>

                        {/* Apellido */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('operations.employee.lastName')} *
                            </label>
                            <input
                                type="text"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                placeholder={t('operations.employee.lastName')}
                                disabled={isLoading}
                                className={`
                                    w-full px-4 py-2.5 border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-purple-500
                                    disabled:bg-slate-100 disabled:cursor-not-allowed
                                    ${errors.apellido ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                                `}
                            />
                            {errors.apellido && (
                                <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.com"
                                disabled={isLoading}
                                className={`
                                    w-full px-4 py-2.5 border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-purple-500
                                    disabled:bg-slate-100 disabled:cursor-not-allowed
                                    ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                                `}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('common.phone')}
                            </label>
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="300 123 4567"
                                disabled={isLoading}
                                className="
                                    w-full px-4 py-2.5 border border-slate-300 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-purple-500
                                    disabled:bg-slate-100 disabled:cursor-not-allowed
                                "
                            />
                        </div>
                    </div>
                </div>

                {/* ROL Y PERMISOS */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        {t('operations.employee.roleAndPermissions')}
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('operations.employee.employeeRole')} *
                        </label>
                        <select
                            name="rol_id"
                            value={formData.rol_id}
                            onChange={handleChange}
                            disabled={isLoading}
                            className={`
                                w-full px-4 py-2.5 border rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-purple-500
                                disabled:bg-slate-100 disabled:cursor-not-allowed
                                ${errors.rol_id ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                            `}
                        >
                            <option value="">{t('operations.employee.selectRole')}</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                                </option>
                            ))}
                        </select>
                        {errors.rol_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.rol_id}</p>
                        )}
                        {formData.rol_id && (
                            <p className="mt-2 text-sm text-slate-500">
                                {getRolDescripcion(formData.rol_id)}
                            </p>
                        )}
                    </div>
                </div>

                {/* CONTRASEÑA */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">
                        {mode === 'crear' ? t('operations.employee.password') : t('operations.employee.changePassword')}
                        {mode === 'editar' && (
                            <span className="text-sm font-normal text-slate-500 ml-2">
                                {t('operations.employee.keepCurrentPassword')}
                            </span>
                        )}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('operations.employee.password')} {mode === 'crear' && '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={mode === 'crear' ? t('operations.employee.minChars') : t('operations.employee.newPassword')}
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                    className={`
                                        w-full px-4 py-2.5 pr-12 border rounded-lg
                                        focus:outline-none focus:ring-2 focus:ring-purple-500
                                        disabled:bg-slate-100 disabled:cursor-not-allowed
                                        ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirmar contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('operations.employee.confirmPassword')} {mode === 'crear' && '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmarPassword"
                                    value={formData.confirmarPassword}
                                    onChange={handleChange}
                                    placeholder={t('operations.employee.confirmPasswordPlaceholder')}
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                    className={`
                                        w-full px-4 py-2.5 pr-12 border rounded-lg
                                        focus:outline-none focus:ring-2 focus:ring-purple-500
                                        disabled:bg-slate-100 disabled:cursor-not-allowed
                                        ${errors.confirmarPassword ? 'border-red-300 bg-red-50' : 'border-slate-300'}
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmarPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmarPassword}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ESTADO */}
                {mode === 'editar' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('operations.employee.employeeStatus')}
                        </label>
                        <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                            <option value="activo">{t('common.active')}</option>
                            <option value="inactivo">{t('common.inactive')}</option>
                        </select>
                    </div>
                )}

                {/* BOTONES */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={isLoading}
                        fullWidth
                    >
                        {t('common.cancel')}
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                        disabled={isLoading}
                        fullWidth
                    >
                        {mode === 'crear' ? t('operations.employee.createEmployee') : t('operations.employee.saveChanges')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default EmpleadoFormModal
