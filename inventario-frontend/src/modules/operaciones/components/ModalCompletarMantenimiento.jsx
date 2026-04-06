// ============================================
// COMPONENTE: ModalCompletarMantenimiento
// Modal para completar una orden de mantenimiento
// marcando cada elemento como reparado o no reparable
// ============================================

import { useState, useMemo } from 'react'
import {
    CheckCircle,
    XCircle,
    Hash,
    Layers,
    Wrench,
    AlertTriangle,
    Save
} from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import { useTranslation } from 'react-i18next'

// ============================================
// COMPONENTE: Fila de elemento individual
// ============================================
const ElementoMantenimientoItem = ({ elemento, resultado, onChange }) => {
  const { t } = useTranslation()
    const estados = [
        { value: true, label: t('operations.maintenanceModal.repaired'), icon: CheckCircle, bgSelected: 'bg-green-100 border-green-500 text-green-700', iconColor: 'text-green-600' },
        { value: false, label: t('operations.maintenanceModal.notRepairable'), icon: XCircle, bgSelected: 'bg-red-100 border-red-500 text-red-700', iconColor: 'text-red-600' }
    ]

    return (
        <div className={`border rounded-lg p-3 transition-colors ${
            resultado === true
                ? 'border-green-200 bg-green-50/50'
                : resultado === false
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-slate-200'
        }`}>
            {/* Info del elemento */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                        {elemento.elemento_nombre || elemento.nombre}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {elemento.serie_codigo || elemento.numero_serie ? (
                            <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {elemento.serie_codigo || elemento.numero_serie}
                            </span>
                        ) : elemento.lote_codigo || elemento.lote_numero ? (
                            <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {elemento.lote_codigo || elemento.lote_numero} (x{elemento.cantidad || 1})
                            </span>
                        ) : (
                            <span>Cantidad: {elemento.cantidad || 1}</span>
                        )}
                    </div>
                    {/* Descripción del daño */}
                    {elemento.notas && (
                        <div className="flex items-start gap-1 mt-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-600 italic">{elemento.notas}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Botones de estado */}
            <div className="flex gap-2">
                {estados.map(({ value, label, icon: Icon, bgSelected, iconColor }) => (
                    <button
                        key={String(value)}
                        type="button"
                        onClick={() => onChange(value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                            resultado === value
                                ? bgSelected
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <Icon className={`w-3.5 h-3.5 ${resultado === value ? iconColor : ''}`} />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL: ModalCompletarMantenimiento
// ============================================
const ModalCompletarMantenimiento = ({ isOpen, onClose, elementos, onConfirm, loading }) => {
    const { t } = useTranslation()
    // Inicializar resultados: todos como null (sin decidir)
    const [resultados, setResultados] = useState(() => {
        const initial = {}
        elementos.forEach(elem => {
            initial[elem.id] = null
        })
        return initial
    })

    const handleChange = (elementoId, reparado) => {
        setResultados(prev => ({ ...prev, [elementoId]: reparado }))
    }

    const todosDecididos = useMemo(
        () => elementos.every(elem => resultados[elem.id] !== null && resultados[elem.id] !== undefined),
        [elementos, resultados]
    )

    const resumen = useMemo(() => {
        const reparados = Object.values(resultados).filter(v => v === true).length
        const noReparables = Object.values(resultados).filter(v => v === false).length
        return { reparados, noReparables }
    }, [resultados])

    const handleConfirmar = () => {
        const data = elementos.map(elem => ({
            elemento_orden_id: elem.id,
            reparado: resultados[elem.id]
        }))
        onConfirm(data)
    }

    // Marcar todos como reparados
    const handleTodosReparados = () => {
        const nuevo = {}
        elementos.forEach(elem => { nuevo[elem.id] = true })
        setResultados(nuevo)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                        <Wrench className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">{t('operations.maintenanceModal.completeMaintenanceTitle')}</h3>
                        <p className="text-sm text-slate-500">
                            {t('operations.maintenanceModal.markResult')}
                        </p>
                    </div>
                </div>
            }
            size="lg"
        >
            <div className="space-y-4">
                {/* Instrucciones */}
                <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 text-sm text-orange-700">
                    {t('operations.maintenanceModal.instructions')}
                </div>

                {/* Botón marcar todos */}
                <div className="flex justify-end">
                    <button
                        onClick={handleTodosReparados}
                        className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                    >
                        {t('operations.maintenanceModal.markAllRepaired')}
                    </button>
                </div>

                {/* Lista de elementos */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {elementos.map(elem => (
                        <ElementoMantenimientoItem
                            key={elem.id}
                            elemento={elem}
                            resultado={resultados[elem.id]}
                            onChange={(reparado) => handleChange(elem.id, reparado)}
                        />
                    ))}
                </div>

                {/* Resumen */}
                {todosDecididos && (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                        <span className="font-medium text-slate-700">{t('operations.maintenanceModal.summary')}</span>
                        <span className="flex items-center gap-1 text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            {t('operations.maintenanceModal.repairedCount', { count: resumen.reparados })}
                        </span>
                        {resumen.noReparables > 0 && (
                            <span className="flex items-center gap-1 text-red-700">
                                <XCircle className="w-4 h-4" />
                                {t('operations.maintenanceModal.notRepairableCount', { count: resumen.noReparables })}
                            </span>
                        )}
                    </div>
                )}

                {/* Botones */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="secondary" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        color="green"
                        icon={Save}
                        onClick={handleConfirmar}
                        disabled={!todosDecididos || loading}
                    >
                        {loading ? t('operations.maintenanceModal.completing') : t('operations.maintenanceModal.completeMaintenanceTitle')}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default ModalCompletarMantenimiento
