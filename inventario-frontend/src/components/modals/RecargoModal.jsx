// ============================================
// COMPONENTE: RecargoModal
// Modal para agregar/editar recargos por adelanto o extensión
// ============================================

import { useState, useMemo, useEffect } from 'react'
import { X, Calendar, Percent, Clock, ArrowLeft, ArrowRight, DollarSign } from 'lucide-react'
import Button from '../common/Button'

/**
 * Modal para agregar recargos de adelanto o extensión
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar
 * @param {Function} props.onSave - Función para guardar (recibe objeto recargo)
 * @param {Object} props.producto - Producto al que se agrega el recargo
 * @param {Object} props.fechasCotizacion - { fecha_montaje, fecha_desmontaje }
 * @param {Object} props.recargoEditar - Recargo existente para editar (opcional)
 */
const RecargoModal = ({
    isOpen,
    onClose,
    onSave,
    producto,
    fechasCotizacion,
    recargoEditar = null
}) => {
    const [formData, setFormData] = useState({
        tipo: 'adelanto',
        dias: 1,
        porcentaje: 20,
        fecha_original: '',
        fecha_modificada: '',
        notas: ''
    })
    const [saving, setSaving] = useState(false)

    // Opciones de porcentaje predefinidas
    const opcionesPorcentaje = [10, 15, 20, 25, 30, 40, 50]

    // Inicializar con datos del recargo si se está editando
    useEffect(() => {
        if (recargoEditar) {
            setFormData({
                tipo: recargoEditar.tipo,
                dias: recargoEditar.dias,
                porcentaje: recargoEditar.porcentaje,
                fecha_original: recargoEditar.fecha_original || '',
                fecha_modificada: recargoEditar.fecha_modificada || '',
                notas: recargoEditar.notas || ''
            })
        } else {
            // Resetear al abrir para nuevo recargo
            setFormData({
                tipo: 'adelanto',
                dias: 1,
                porcentaje: 20,
                fecha_original: fechasCotizacion?.fecha_montaje || '',
                fecha_modificada: '',
                notas: ''
            })
        }
    }, [recargoEditar, fechasCotizacion, isOpen])

    // Actualizar fecha original cuando cambia el tipo
    useEffect(() => {
        if (!recargoEditar) {
            const fechaOriginal = formData.tipo === 'adelanto'
                ? fechasCotizacion?.fecha_montaje
                : fechasCotizacion?.fecha_desmontaje
            setFormData(prev => ({
                ...prev,
                fecha_original: fechaOriginal || ''
            }))
        }
    }, [formData.tipo, fechasCotizacion, recargoEditar])

    // Calcular monto de recargo en tiempo real
    const montoRecargo = useMemo(() => {
        if (!producto?.precio_base) return 0
        const precioBase = parseFloat(producto.precio_base)
        return Math.round((precioBase * (formData.porcentaje / 100) * formData.dias) * 100) / 100
    }, [producto?.precio_base, formData.porcentaje, formData.dias])

    // Formatear moneda
    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor)
    }

    // Manejar cambios
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'dias' ? parseInt(value) || 1 : value
        }))
    }

    // Manejar guardar
    const handleGuardar = async () => {
        if (formData.dias < 1) {
            return
        }

        setSaving(true)
        try {
            await onSave({
                tipo: formData.tipo,
                dias: formData.dias,
                porcentaje: parseFloat(formData.porcentaje),
                fecha_original: formData.fecha_original || null,
                fecha_modificada: formData.fecha_modificada || null,
                notas: formData.notas || null
            })
            onClose()
        } catch (error) {
            console.error('Error al guardar recargo:', error)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {recargoEditar ? 'Editar Recargo' : 'Agregar Recargo'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {producto && (
                        <p className="text-sm text-slate-500 mt-1">
                            Producto: <span className="font-medium text-slate-700">{producto.producto_nombre || producto.nombre}</span>
                        </p>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
                    {/* Tipo de recargo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Tipo de Recargo
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, tipo: 'adelanto' }))}
                                className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
                                    formData.tipo === 'adelanto'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-medium">Adelanto</div>
                                    <div className="text-xs opacity-75">Montaje antes</div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, tipo: 'extension' }))}
                                className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
                                    formData.tipo === 'extension'
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <ArrowRight className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-medium">Extensión</div>
                                    <div className="text-xs opacity-75">Desmontaje después</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Cantidad de días */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Cantidad de Días
                        </label>
                        <input
                            type="number"
                            name="dias"
                            value={formData.dias}
                            onChange={handleChange}
                            min="1"
                            max="30"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Porcentaje de recargo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Percent className="w-4 h-4 inline mr-1" />
                            Porcentaje de Recargo
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {opcionesPorcentaje.map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, porcentaje: p }))}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        formData.porcentaje === p
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {p}%
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            name="porcentaje"
                            value={formData.porcentaje}
                            onChange={handleChange}
                            min="1"
                            max="100"
                            step="0.5"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Nueva fecha (opcional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Nueva Fecha de {formData.tipo === 'adelanto' ? 'Montaje' : 'Desmontaje'} (opcional)
                        </label>
                        <input
                            type="date"
                            name="fecha_modificada"
                            value={formData.fecha_modificada}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formData.fecha_original && (
                            <p className="text-xs text-slate-500 mt-1">
                                Fecha original: {new Date(formData.fecha_original + 'T00:00:00').toLocaleDateString('es-CO')}
                            </p>
                        )}
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Notas (opcional)
                        </label>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Razón del recargo..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Preview del cálculo */}
                    <div className={`p-4 rounded-lg ${formData.tipo === 'adelanto' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                        <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Cálculo del Recargo
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Precio base:</span>
                                <span className="font-medium">{formatearMoneda(producto?.precio_base || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Porcentaje:</span>
                                <span className="font-medium">{formData.porcentaje}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Días:</span>
                                <span className="font-medium">{formData.dias}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-900">Monto recargo:</span>
                                    <span className={`text-lg font-bold ${formData.tipo === 'adelanto' ? 'text-blue-600' : 'text-orange-600'}`}>
                                        +{formatearMoneda(montoRecargo)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color={formData.tipo === 'adelanto' ? 'blue' : 'orange'}
                        onClick={handleGuardar}
                        disabled={saving || formData.dias < 1}
                    >
                        {saving ? 'Guardando...' : recargoEditar ? 'Actualizar Recargo' : 'Agregar Recargo'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default RecargoModal
