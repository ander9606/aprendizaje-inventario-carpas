// ============================================
// COMPONENTE: EmpleadoFormModal
// Modal para crear/editar empleados
// ============================================

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Shield } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useCreateEmpleado, useUpdateEmpleado } from '../../hooks/useEmpleados'

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
        activo: true
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
                activo: empleado.activo !== undefined ? empleado.activo : true
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
                activo: true
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
            newErrors.nombre = 'El nombre es obligatorio'
        }

        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es obligatorio'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es obligatorio'
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Email no válido'
            }
        }

        if (!formData.rol_id) {
            newErrors.rol_id = 'Debe seleccionar un rol'
        }

        // Validar contraseña solo en modo crear o si se quiere cambiar
        if (mode === 'crear') {
            if (!formData.password) {
                newErrors.password = 'La contraseña es obligatoria'
            } else if (formData.password.length < 8) {
                newErrors.password = 'Mínimo 8 caracteres'
            }

            if (formData.password !== formData.confirmarPassword) {
                newErrors.confirmarPassword = 'Las contraseñas no coinciden'
            }
        } else if (formData.password) {
            // En modo editar, validar solo si se ingresó contraseña
            if (formData.password.length < 8) {
                newErrors.password = 'Mínimo 8 caracteres'
            }
            if (formData.password !== formData.confirmarPassword) {
                newErrors.confirmarPassword = 'Las contraseñas no coinciden'
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
            activo: formData.activo
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
                (mode === 'crear' ? 'Error al crear el empleado' : 'Error al actualizar el empleado')
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
            title={mode === 'crear' ? 'Nuevo Empleado' : 'Editar Empleado'}
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
                    <h3 className="font-semibold text-slate-900">Información Personal</h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Nombre"
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
                                Apellido *
                            </label>
                            <input
                                type="text"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                placeholder="Apellido"
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
                                Teléfono
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
                        Rol y Permisos
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Rol del empleado *
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
                            <option value="">Selecciona un rol</option>
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
                        {mode === 'crear' ? 'Contraseña' : 'Cambiar Contraseña'}
                        {mode === 'editar' && (
                            <span className="text-sm font-normal text-slate-500 ml-2">
                                (dejar vacío para mantener la actual)
                            </span>
                        )}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Contraseña {mode === 'crear' && '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={mode === 'crear' ? 'Mínimo 6 caracteres' : 'Nueva contraseña'}
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
                                Confirmar {mode === 'crear' && '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmarPassword"
                                    value={formData.confirmarPassword}
                                    onChange={handleChange}
                                    placeholder="Confirmar contraseña"
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
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="activo"
                            id="activo"
                            checked={formData.activo}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <label htmlFor="activo" className="text-sm font-medium text-slate-700">
                            Empleado activo
                        </label>
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
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                        disabled={isLoading}
                        fullWidth
                    >
                        {mode === 'crear' ? 'Crear Empleado' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default EmpleadoFormModal
