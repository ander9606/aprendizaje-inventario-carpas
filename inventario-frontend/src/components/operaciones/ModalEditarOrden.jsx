// ============================================
// COMPONENTE: Modal de Editar Orden
// ============================================

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import Button from '../common/Button'

export default function ModalEditarOrden({ orden, onClose, onSave }) {
    const [formData, setFormData] = useState({
        fecha_programada: orden.fecha_programada?.split('T')[0] || '',
        hora_programada: orden.fecha_programada?.split('T')[1]?.substring(0, 5) || '08:00',
        notas: orden.notas || '',
        prioridad: orden.prioridad || 'normal'
    })
    const [saving, setSaving] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleGuardar = async () => {
        setSaving(true)
        try {
            const fechaCompleta = `${formData.fecha_programada}T${formData.hora_programada}:00`
            await onSave({
                fecha_programada: fechaCompleta,
                notas: formData.notas,
                prioridad: formData.prioridad
            })
            onClose()
        } catch (error) {
            console.error('Error al actualizar orden:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Editar Orden #{orden.id}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* Fecha */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Fecha Programada
                        </label>
                        <input
                            type="date"
                            name="fecha_programada"
                            value={formData.fecha_programada}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Hora */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Hora
                        </label>
                        <input
                            type="time"
                            name="hora_programada"
                            value={formData.hora_programada}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Prioridad */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Prioridad
                        </label>
                        <select
                            name="prioridad"
                            value={formData.prioridad}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        >
                            <option value="baja">Baja</option>
                            <option value="normal">Normal</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notas
                        </label>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                            placeholder="Notas adicionales..."
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="orange"
                        icon={Save}
                        onClick={handleGuardar}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
