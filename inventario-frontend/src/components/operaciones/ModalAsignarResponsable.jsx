// ============================================
// COMPONENTE: Modal de Asignación de Responsable
// ============================================

import { useState } from 'react'
import { User, X, Save } from 'lucide-react'
import { useGetEmpleadosCampo } from '../../hooks/useEmpleados'
import Button from '../common/Button'
import Spinner from '../common/Spinner'

export default function ModalAsignarResponsable({ orden, onClose, onSave }) {
    // Inicializar con responsable actual (primer miembro del equipo)
    const responsableActual = orden.equipo?.find(e => e.rol_en_orden === 'responsable' || e.es_responsable)
        || orden.equipo?.[0]
    const [responsableId, setResponsableId] = useState(
        responsableActual?.empleado_id?.toString() || responsableActual?.id?.toString() || ''
    )
    const [saving, setSaving] = useState(false)

    // Obtener empleados disponibles desde API
    const fechaOrden = orden.fecha_programada?.split('T')[0] || null
    const { empleados: empleadosDisponibles, isLoading: loadingEmpleados } = useGetEmpleadosCampo(fechaOrden)

    const handleGuardar = async () => {
        if (!responsableId) return
        setSaving(true)
        try {
            await onSave({
                empleados: [{ empleado_id: parseInt(responsableId), rol_en_orden: 'responsable' }]
            })
            onClose()
        } catch (error) {
            console.error('Error al asignar responsable:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Asignar Responsable
                            </h3>
                            <p className="text-sm text-slate-500">
                                Persona encargada de esta orden
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
                            {empleadosDisponibles.map(emp => (
                                <label
                                    key={emp.id}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                        responsableId === emp.id.toString()
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="responsable"
                                        value={emp.id}
                                        checked={responsableId === emp.id.toString()}
                                        onChange={(e) => setResponsableId(e.target.value)}
                                        className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                                    />
                                    <div className="p-2 bg-slate-100 rounded-full">
                                        <User className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">
                                            {emp.nombre} {emp.apellido || ''}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {emp.rol_empleado || emp.cargo || 'Empleado'}
                                            {emp.telefono ? ` - ${emp.telefono}` : ''}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-500">
                            <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
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
                        disabled={saving || !responsableId}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
