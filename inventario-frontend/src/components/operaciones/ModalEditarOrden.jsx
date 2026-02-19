// ============================================
// COMPONENTE: Modal de Editar Orden
// Permite editar fecha/hora, prioridad y notas.
// La fecha usa el endpoint especializado con validación de conflictos.
// ============================================

import { useState } from 'react'
import { X, Save, Calendar, Clock, AlertTriangle, FileText, Flag } from 'lucide-react'
import Button from '../common/Button'

export default function ModalEditarOrden({ orden, onSaveFecha, onSaveGeneral, onClose, saving = false }) {
    const fechaOriginal = orden.fecha_programada?.split('T')[0] || ''
    const horaOriginal = orden.fecha_programada?.split('T')[1]?.substring(0, 5) || '09:00'

    const [formData, setFormData] = useState({
        fecha_programada: fechaOriginal,
        hora_programada: horaOriginal,
        notas: orden.notas || '',
        prioridad: orden.prioridad || 'normal',
        motivo: ''
    })
    const [guardando, setGuardando] = useState(false)
    const [conflicto, setConflicto] = useState(null)
    const [error, setError] = useState(null)

    const fechaCambio = formData.fecha_programada !== fechaOriginal || formData.hora_programada !== horaOriginal
    const generalCambio = formData.notas !== (orden.notas || '') || formData.prioridad !== (orden.prioridad || 'normal')
    const hayCambios = fechaCambio || generalCambio

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (error) setError(null)
        if (conflicto) setConflicto(null)
    }

    const handleGuardar = async (forzar = false) => {
        if (!hayCambios) return

        // Si la fecha cambió, el motivo es obligatorio
        if (fechaCambio && !formData.motivo.trim()) {
            setError('Debes indicar el motivo del cambio de fecha')
            return
        }

        setGuardando(true)
        setError(null)

        try {
            // 1. Guardar cambios generales (notas, prioridad) si cambiaron
            if (generalCambio) {
                await onSaveGeneral({
                    notas: formData.notas,
                    prioridad: formData.prioridad
                })
            }

            // 2. Guardar cambio de fecha si cambió (endpoint especializado con validación)
            if (fechaCambio) {
                const fechaCompleta = `${formData.fecha_programada}T${formData.hora_programada}:00`
                const resultado = await onSaveFecha({
                    fecha: fechaCompleta,
                    motivo: formData.motivo.trim(),
                    forzar
                })

                // El backend devuelve 409 cuando hay conflictos
                if (resultado?.data?.requiereAprobacion) {
                    setConflicto(resultado.data.validacion)
                    setGuardando(false)
                    return
                }
            }

            onClose()
        } catch (err) {
            // Manejar respuesta 409 de conflictos
            if (err?.response?.status === 409 && err?.response?.data?.data?.requiereAprobacion) {
                setConflicto(err.response.data.data.validacion)
            } else {
                setError(err?.response?.data?.message || err?.message || 'Error al guardar cambios')
            }
        } finally {
            setGuardando(false)
        }
    }

    const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-5 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Editar Orden #{orden.id}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-5 space-y-4">
                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Fecha
                            </label>
                            <input
                                type="date"
                                name="fecha_programada"
                                value={formData.fecha_programada}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Hora
                            </label>
                            <input
                                type="time"
                                name="hora_programada"
                                value={formData.hora_programada}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Motivo del cambio — solo visible si la fecha cambió */}
                    {fechaCambio && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                            <p className="text-xs text-amber-700 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                La fecha cambió. Indica el motivo (se registra en auditoría).
                            </p>
                            <textarea
                                name="motivo"
                                value={formData.motivo}
                                onChange={handleChange}
                                rows={2}
                                className={`${inputClass} bg-white`}
                                placeholder="Ej: El cliente solicitó cambio de fecha..."
                            />
                        </div>
                    )}

                    {/* Prioridad */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                            <Flag className="w-3.5 h-3.5" />
                            Prioridad
                        </label>
                        <select
                            name="prioridad"
                            value={formData.prioridad}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="baja">Baja</option>
                            <option value="normal">Normal</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Notas
                        </label>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            rows={3}
                            className={`${inputClass} resize-none`}
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Conflicto de fecha — con opción de forzar */}
                    {conflicto && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                            <p className="text-sm font-medium text-amber-800">
                                El cambio de fecha genera conflictos:
                            </p>
                            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                                {conflicto.conflictos?.map((c, i) => (
                                    <li key={i}>{c.mensaje || c.tipo}</li>
                                ))}
                            </ul>
                            <Button
                                color="orange"
                                size="sm"
                                onClick={() => handleGuardar(true)}
                                disabled={guardando}
                            >
                                {guardando ? 'Guardando...' : 'Forzar Cambio de Fecha'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="orange"
                        icon={Save}
                        onClick={() => handleGuardar(false)}
                        disabled={guardando || !hayCambios || saving}
                    >
                        {guardando ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
