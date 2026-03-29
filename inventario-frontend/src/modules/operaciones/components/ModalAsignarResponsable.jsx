// ============================================
// COMPONENTE: Modal de Asignación de Responsables
// Permite seleccionar múltiples responsables
// ============================================

import { useState } from 'react'
import { Users, X, Save, Check } from 'lucide-react'
import { useGetEmpleadosCampo } from '../hooks/useEmpleados'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'

export default function ModalAsignarResponsable({ orden, onClose, onSave }) {
    // Inicializar con responsables actuales
    const actuales = (orden.equipo || []).map(e => (e.empleado_id || e.id).toString())
    const [seleccionados, setSeleccionados] = useState(new Set(actuales))
    const [saving, setSaving] = useState(false)

    // Obtener empleados disponibles desde API
    const fechaOrden = orden.fecha_programada?.split('T')[0] || null
    const { empleados: empleadosDisponibles, isLoading: loadingEmpleados } = useGetEmpleadosCampo(fechaOrden)

    const toggleEmpleado = (id) => {
        const idStr = id.toString()
        setSeleccionados(prev => {
            const next = new Set(prev)
            if (next.has(idStr)) {
                next.delete(idStr)
            } else {
                next.add(idStr)
            }
            return next
        })
    }

    const handleGuardar = async () => {
        if (seleccionados.size === 0) return
        setSaving(true)
        try {
            await onSave({
                empleados: Array.from(seleccionados).map(id => ({
                    empleado_id: parseInt(id),
                    rol_en_orden: 'responsable'
                }))
            })
            onClose()
        } catch (error) {
            console.error('Error al asignar responsables:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Asignar Responsables
                            </h3>
                            <p className="text-sm text-slate-500">
                                Selecciona los encargados de esta orden
                                {seleccionados.size > 0 && (
                                    <span className="ml-1 font-medium text-orange-600">
                                        ({seleccionados.size} seleccionados)
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loadingEmpleados ? (
                        <div className="py-8 text-center">
                            <Spinner size="sm" text="Cargando empleados..." />
                        </div>
                    ) : empleadosDisponibles?.length > 0 ? (
                        <div className="space-y-2">
                            {empleadosDisponibles.map(emp => {
                                const isSelected = seleccionados.has(emp.id.toString())
                                return (
                                    <label
                                        key={emp.id}
                                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'border-slate-300'
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isSelected}
                                            onChange={() => toggleEmpleado(emp.id)}
                                        />
                                        <div className="p-2 bg-slate-100 rounded-full">
                                            <Users className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">
                                                {emp.nombre} {emp.apellido || ''}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {emp.rol_nombre || emp.cargo || 'Empleado'}
                                                {emp.telefono ? ` - ${emp.telefono}` : ''}
                                            </p>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500">
                            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p>No hay empleados disponibles</p>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="orange"
                        icon={Save}
                        onClick={handleGuardar}
                        disabled={saving || seleccionados.size === 0}
                    >
                        {saving ? 'Guardando...' : `Guardar (${seleccionados.size})`}
                    </Button>
                </div>
            </div>
        </div>
    )
}
