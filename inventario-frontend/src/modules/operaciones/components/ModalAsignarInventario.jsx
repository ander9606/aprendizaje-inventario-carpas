// ============================================
// COMPONENTE: Modal de Asignación de Inventario
// Permite al operador asignar series/lotes reales
// a elementos que no tienen inventario asignado
// ============================================

import { useState } from 'react'
import {
    Box,
    Package,
    Hash,
    CheckCircle,
    AlertTriangle,
    Zap
} from 'lucide-react'
import { useGetElementosDisponibles, useCrearAlertaOperaciones } from '../hooks/useOrdenesTrabajo'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function ModalAsignarInventario({ ordenId, elementosPendientes, onClose, onSave }) {
  const { t } = useTranslation()
    const { productos, isLoading } = useGetElementosDisponibles(ordenId)
    const crearAlerta = useCrearAlertaOperaciones()
    const [seleccion, setSeleccion] = useState({}) // { elemento_id: { serie_id?, lote_id?, cantidad? } }
    const [saving, setSaving] = useState(false)
    const [alertaEnviada, setAlertaEnviada] = useState(false)

    // Mapear disponibles por elemento_id para acceso rápido
    const disponiblesPorElemento = {}
    if (productos?.length > 0) {
        for (const producto of productos) {
            for (const comp of (producto.componentes || [])) {
                disponiblesPorElemento[comp.elemento_id] = comp
            }
        }
    }

    // ============================================
    // HELPER: Ordenar disponibles por prioridad
    // Prioridad: mayor cantidad disponible primero
    // ============================================
    const ordenarPorPrioridad = (disponibles) => {
        return [...disponibles].sort((a, b) => {
            // Para lotes: priorizar el que tenga mayor cantidad
            if (a.tipo === 'lote' && b.tipo === 'lote') {
                return b.cantidad - a.cantidad
            }
            return 0
        })
    }

    // ============================================
    // HANDLER: Auto-asignar todos los disponibles
    // Recorre elementos pendientes y asigna el mejor disponible
    // ============================================
    const handleAutoAsignar = () => {
        const nuevaSeleccion = {}
        let asignados = 0
        let sinStock = 0

        for (const elem of elementosPendientes) {
            const info = disponiblesPorElemento[elem.elemento_id]
            const disponibles = ordenarPorPrioridad(info?.disponibles || [])

            if (disponibles.length > 0) {
                const mejor = disponibles[0]
                nuevaSeleccion[elem.elemento_id] = mejor.tipo === 'serie'
                    ? { serie_id: mejor.id, lote_id: null, cantidad: 1 }
                    : { serie_id: null, lote_id: mejor.id, cantidad: Math.min(mejor.cantidad, elem.cantidad || 1) }
                asignados++
            } else {
                sinStock++
            }
        }

        setSeleccion(nuevaSeleccion)
        if (asignados > 0) {
            toast.success(sinStock > 0 ? t('operations.assignInventoryModal.elementsAssignedWithNoStock', { assigned: asignados, noStock: sinStock }) : t('operations.assignInventoryModal.elementsAssigned', { count: asignados }))
        } else {
            toast.warning(t('operations.assignInventoryModal.noInventoryToAssign'))
        }
    }

    // ============================================
    // HANDLER: Limpiar toda la selección
    // ============================================
    const handleLimpiarSeleccion = () => {
        setSeleccion({})
    }

    const handleSeleccionarSerie = (elementoId, serieId) => {
        setSeleccion(prev => ({
            ...prev,
            [elementoId]: serieId
                ? { serie_id: serieId, lote_id: null, cantidad: 1 }
                : undefined
        }))
    }

    const handleSeleccionarLote = (elementoId, loteId, cantidadMax) => {
        setSeleccion(prev => {
            const actual = prev[elementoId]
            if (actual?.lote_id === loteId) {
                // Deseleccionar
                return { ...prev, [elementoId]: undefined }
            }
            return {
                ...prev,
                [elementoId]: { serie_id: null, lote_id: loteId, cantidad: Math.min(cantidadMax, elementosPendientes.find(e => e.elemento_id === elementoId)?.cantidad || 1) }
            }
        })
    }

    const handleCantidadLote = (elementoId, cantidad) => {
        setSeleccion(prev => ({
            ...prev,
            [elementoId]: { ...prev[elementoId], cantidad: Math.max(1, cantidad) }
        }))
    }

    const todosAsignados = elementosPendientes.every(ep => seleccion[ep.elemento_id])

    // Elementos que NO tienen inventario disponible en absoluto
    const elementosSinStock = elementosPendientes.filter(ep => {
        const info = disponiblesPorElemento[ep.elemento_id]
        return !info || (info.disponibles || []).length === 0
    })

    const handleReportarInsuficiencia = async () => {
        const nombres = elementosSinStock.map(e => e.elemento_nombre || e.nombre).join(', ')
        try {
            await crearAlerta.mutateAsync({
                orden_id: ordenId,
                tipo: 'conflicto_disponibilidad',
                severidad: elementosSinStock.length > 2 ? 'critica' : 'alta',
                titulo: t('operations.assignInventoryModal.insufficiencyTitle', { count: elementosSinStock.length }),
                mensaje: t('operations.assignInventoryModal.insufficiencyMessage', { orderId: ordenId, names: nombres })
            })
            setAlertaEnviada(true)
            toast.success(t('operations.assignInventoryModal.insufficiencyAlertCreated'))
        } catch (error) {
            toast.error(t('operations.assignInventoryModal.insufficiencyAlertError'))
        }
    }

    const handleGuardar = async () => {
        const elementos = Object.entries(seleccion)
            .filter(([, val]) => val)
            .map(([elementoId, val]) => ({
                elemento_id: parseInt(elementoId),
                serie_id: val.serie_id || null,
                lote_id: val.lote_id || null,
                cantidad: val.cantidad || 1
            }))

        if (!elementos.length) {
            toast.error(t('operations.assignInventoryModal.selectAtLeastOne'))
            return
        }

        setSaving(true)
        try {
            await onSave(elementos)
        } catch (error) {
            toast.error(error?.response?.data?.message || t('operations.assignInventoryModal.assignError'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={true} onClose={onClose} title={t('operations.assignInventory')} size="lg">
            {/* Subtítulo */}
            <p className="text-sm text-slate-500 -mt-2 mb-4">
                {t('operations.assignInventoryModal.elementsWithoutInventory', { count: elementosPendientes.length })}
            </p>

            {/* Barra de acciones rápidas */}
            {!isLoading && elementosPendientes.length > 0 && (
                <div className="-mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3 mb-4">
                    <Button
                        size="sm"
                        color="amber"
                        icon={Zap}
                        onClick={handleAutoAsignar}
                    >
                        {t('operations.assignInventoryModal.autoAssign')}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLimpiarSeleccion}
                        disabled={Object.keys(seleccion).length === 0}
                    >
                        {t('operations.assignInventoryModal.clearSelection')}
                    </Button>
                    <span className="ml-auto text-xs text-slate-500">
                        {t('operations.assignInventoryModal.priorityHint')}
                    </span>
                </div>
            )}

            {/* Body */}
            {isLoading ? (
                <div className="py-8 text-center">
                    <Spinner size="md" text={t('operations.assignInventoryModal.searchingInventory')} />
                </div>
            ) : (
                <div className="space-y-6">
                    {elementosPendientes.map((elem) => {
                        const info = disponiblesPorElemento[elem.elemento_id]
                        const disponiblesItems = info?.disponibles || []
                        const series = disponiblesItems.filter(d => d.tipo === 'serie')
                        const lotes = disponiblesItems.filter(d => d.tipo === 'lote')
                        const selActual = seleccion[elem.elemento_id]

                        return (
                            <div key={elem.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                {/* Elemento header */}
                                <div className={`px-4 py-3 flex items-center justify-between ${
                                    selActual ? 'bg-green-50 border-b border-green-200' : 'bg-slate-50 border-b border-slate-200'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-slate-500" />
                                        <span className="font-medium text-slate-900">
                                            {elem.elemento_nombre || elem.nombre}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            (cant: {elem.cantidad || 1})
                                        </span>
                                    </div>
                                    {selActual && (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                </div>

                                {/* Opciones disponibles */}
                                <div className="p-3">
                                    {disponiblesItems.length === 0 ? (
                                        <div className="py-2 space-y-2">
                                            <p className="text-sm text-red-600 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                {t('operations.assignInventoryModal.noInventoryAvailable')}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {t('operations.assignInventoryModal.noSeriesOrLots')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Series disponibles */}
                                            {series.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1.5">
                                                        {t('operations.assignInventoryModal.availableSeries')}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {series.map(serie => (
                                                            <label
                                                                key={serie.id}
                                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                                    selActual?.serie_id === serie.id
                                                                        ? 'bg-green-50 border border-green-200'
                                                                        : 'hover:bg-slate-50 border border-transparent'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`elem-${elem.elemento_id}`}
                                                                    checked={selActual?.serie_id === serie.id}
                                                                    onChange={() => handleSeleccionarSerie(elem.elemento_id, serie.id)}
                                                                    className="text-green-600"
                                                                />
                                                                <Hash className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="text-sm font-medium text-slate-800">
                                                                    {serie.identificador}
                                                                </span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {serie.estado}
                                                                </span>
                                                                {serie.ubicacion && (
                                                                    <span className="text-xs text-slate-400 ml-auto">
                                                                        {serie.ubicacion}
                                                                    </span>
                                                                )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Lotes disponibles */}
                                            {lotes.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1.5">
                                                        {t('operations.assignInventoryModal.availableLots')}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {lotes.map(lote => (
                                                            <label
                                                                key={lote.id}
                                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                                    selActual?.lote_id === lote.id
                                                                        ? 'bg-green-50 border border-green-200'
                                                                        : 'hover:bg-slate-50 border border-transparent'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`elem-${elem.elemento_id}`}
                                                                    checked={selActual?.lote_id === lote.id}
                                                                    onChange={() => handleSeleccionarLote(elem.elemento_id, lote.id, lote.cantidad)}
                                                                    className="text-green-600"
                                                                />
                                                                <Box className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="text-sm font-medium text-slate-800">
                                                                    {lote.identificador}
                                                                </span>
                                                                <span className="text-xs text-slate-500">
                                                                    {t('operations.assignInventoryModal.available', { count: lote.cantidad })}
                                                                </span>
                                                                {selActual?.lote_id === lote.id && (
                                                                    <div className="flex items-center gap-1 ml-auto">
                                                                        <span className="text-xs text-slate-500">{t('operations.assignInventoryModal.qtyLabel')}</span>
                                                                        <input
                                                                            type="number"
                                                                            min={1}
                                                                            max={lote.cantidad}
                                                                            value={selActual.cantidad}
                                                                            onChange={(e) => handleCantidadLote(elem.elemento_id, parseInt(e.target.value) || 1)}
                                                                            className="w-16 px-2 py-0.5 border border-slate-300 rounded text-sm text-center"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {lote.ubicacion && !selActual?.lote_id === lote.id && (
                                                                    <span className="text-xs text-slate-400 ml-auto">
                                                                        {lote.ubicacion}
                                                                    </span>
                                                                )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Alerta de insuficiencia */}
            {!isLoading && elementosSinStock.length > 0 && (
                <div className="-mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-red-50 border-t border-red-200 mt-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-sm text-red-700">
                                {t('operations.assignInventoryModal.elementsNoStock', { count: elementosSinStock.length })}
                            </p>
                        </div>
                        {alertaEnviada ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {t('operations.assignInventoryModal.alertSent')}
                            </span>
                        ) : (
                            <Button
                                color="red"
                                variant="outline"
                                size="sm"
                                icon={AlertTriangle}
                                onClick={handleReportarInsuficiencia}
                                disabled={crearAlerta.isPending}
                            >
                                {crearAlerta.isPending ? t('operations.assignInventoryModal.sending') : t('operations.assignInventoryModal.reportInsufficiency')}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <Modal.Footer className="justify-between">
                <p className="text-sm text-slate-500">
                    {t('operations.assignInventoryModal.assignedOf', { assigned: Object.values(seleccion).filter(Boolean).length, total: elementosPendientes.length })}
                </p>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        color="green"
                        icon={CheckCircle}
                        onClick={handleGuardar}
                        disabled={saving || !todosAsignados}
                    >
                        {saving ? t('operations.assignInventoryModal.assigning') : t('operations.assignInventoryModal.confirmAssignment')}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    )
}
