// ============================================
// COMPONENTE: ChecklistCargueDescargue
// Checklist interactivo paso a paso para verificar
// cargue (subir al camión), recogida (recoger en sitio)
// y bodega (descargar del camión en bodega)
// ============================================

import { useState, useMemo } from 'react'
import {
    Truck,
    Package,
    Box,
    Hash,
    CheckCircle,
    Circle,
    ChevronDown,
    ChevronRight,
    Printer,
    AlertTriangle,
    ClipboardCheck,
    MapPin,
    Calendar,
    User,
    MessageSquare,
    X,
    Home,
    Wrench
} from 'lucide-react'
import Modal from '@shared/components/Modal'
import Spinner from '@shared/components/Spinner'
import Button from '@shared/components/Button'
import { useGetChecklist, useVerificarElementoCargue, useVerificarElementoRecogida, useVerificarElementoBodega, useMarcarDanoElemento, useGenerarOrdenMantenimiento } from '../hooks/useOrdenesTrabajo'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

// ============================================
// COMPONENTE: Fila de Elemento con Checkbox
// ============================================
const ElementoCheckItem = ({ elemento, modo, onToggle, onMarcarDano, isPending, isDanoPending, t }) => {
    const [showNotas, setShowNotas] = useState(false)
    const [notas, setNotas] = useState(elemento.notas || '')
    const [showDanoForm, setShowDanoForm] = useState(false)
    const [descripcionDano, setDescripcionDano] = useState(elemento.descripcion_dano || '')
    const [cantidadDanada, setCantidadDanada] = useState(elemento.cantidad_danada || elemento.cantidad || 1)

    const esLote = !!elemento.lote_codigo && elemento.cantidad > 1

    const verificado = modo === 'cargue'
        ? elemento.verificado_salida
        : modo === 'bodega'
        ? elemento.verificado_bodega
        : elemento.verificado_retorno

    const esModoConDano = modo === 'recogida' || modo === 'bodega'
    const tieneDano = !!elemento.marcado_dano

    const handleToggle = () => {
        onToggle(elemento.id, !verificado, notas || null)
    }

    const handleNotasBlur = () => {
        if (notas !== (elemento.notas || '')) {
            onToggle(elemento.id, verificado, notas || null)
        }
    }

    const handleToggleDano = () => {
        if (tieneDano) {
            // Desmarcar daño
            onMarcarDano(elemento.id, false, null, null)
            setShowDanoForm(false)
            setDescripcionDano('')
            setCantidadDanada(elemento.cantidad || 1)
        } else {
            // Mostrar formulario para describir el daño
            setShowDanoForm(true)
        }
    }

    const handleGuardarDano = () => {
        if (!descripcionDano.trim()) {
            toast.error(t('operations.checklist.mustDescribeDamage'))
            return
        }
        if (esLote && (!cantidadDanada || cantidadDanada < 1)) {
            toast.error(t('operations.checklist.mustIndicateQuantity'))
            return
        }
        onMarcarDano(elemento.id, true, descripcionDano.trim(), esLote ? cantidadDanada : null)
        setShowDanoForm(false)
    }

    return (
        <div className={`px-4 py-3 transition-colors ${
            tieneDano ? 'bg-amber-50/60 border-l-4 border-l-amber-400' :
            verificado ? 'bg-green-50/60' : 'hover:bg-slate-50'
        }`}>
            <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`shrink-0 transition-all ${isPending ? 'opacity-50' : ''}`}
                >
                    {verificado ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                        <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                    )}
                </button>

                {/* Info del elemento */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${verificado ? 'text-green-800 line-through' : 'text-slate-900'}`}>
                            {elemento.elemento_nombre}
                        </span>
                        {elemento.cantidad > 1 && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                x{elemento.cantidad}
                            </span>
                        )}
                        {tieneDano && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {t('operations.damage')}
                            </span>
                        )}
                    </div>
                    {(elemento.serie_codigo || elemento.lote_codigo) && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Hash className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                                {elemento.serie_codigo || elemento.lote_codigo}
                            </span>
                        </div>
                    )}
                    {/* Notas inline preview */}
                    {elemento.notas && !showNotas && (
                        <p className="text-xs text-slate-400 mt-0.5 italic truncate">
                            {elemento.notas}
                        </p>
                    )}
                    {/* Descripción del daño preview */}
                    {tieneDano && elemento.descripcion_dano && !showDanoForm && (
                        <p className="text-xs text-amber-600 mt-0.5 italic truncate">
                            {t('operations.damage')}{esLote && elemento.cantidad_danada ? ` (${elemento.cantidad_danada} ${t('common.of')} ${elemento.cantidad})` : ''}: {elemento.descripcion_dano}
                        </p>
                    )}
                </div>

                {/* Botón marcar daño (solo recogida/bodega) */}
                {esModoConDano && (
                    <button
                        onClick={handleToggleDano}
                        disabled={isDanoPending}
                        className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                            tieneDano
                                ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        } ${isDanoPending ? 'opacity-50' : ''}`}
                        title={tieneDano ? t('operations.checklist.removeDamage') : t('operations.checklist.reportDamage')}
                    >
                        <AlertTriangle className="w-4 h-4" />
                    </button>
                )}

                {/* Botón notas */}
                <button
                    onClick={() => setShowNotas(!showNotas)}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                        showNotas || elemento.notas
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    title={t('operations.checklist.addObservation')}
                >
                    <MessageSquare className="w-4 h-4" />
                </button>
            </div>

            {/* Formulario de daño expandido */}
            {showDanoForm && !tieneDano && (
                <div className="mt-2 ml-9 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-amber-700">{t('operations.checklist.reportDamage')}</span>
                        <button onClick={() => setShowDanoForm(false)} className="text-amber-400 hover:text-amber-600 p-0.5">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {esLote && (
                        <div className="mb-2">
                            <label className="block text-xs font-medium text-amber-600 mb-1">
                                {t('operations.checklist.damagedQuantity', { total: elemento.cantidad })}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={elemento.cantidad}
                                value={cantidadDanada}
                                onChange={(e) => setCantidadDanada(Math.min(elemento.cantidad, Math.max(1, parseInt(e.target.value) || 1)))}
                                className="w-24 text-sm border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white"
                            />
                        </div>
                    )}
                    <textarea
                        value={descripcionDano}
                        onChange={(e) => setDescripcionDano(e.target.value)}
                        className="w-full text-sm border border-amber-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white"
                        rows={2}
                        placeholder={t('operations.checklist.describeDamage')}
                        autoFocus={!esLote}
                    />
                    <button
                        onClick={handleGuardarDano}
                        disabled={isDanoPending || !descripcionDano.trim()}
                        className="mt-2 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('operations.checklist.confirmDamage')}
                    </button>
                </div>
            )}

            {/* Notas expandidas inline (debajo del elemento, no como popover) */}
            {showNotas && (
                <div className="mt-2 ml-9 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600">{t('operations.checklist.observation')}</span>
                        <button onClick={() => setShowNotas(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        onBlur={handleNotasBlur}
                        onKeyDown={(e) => { if (e.key === 'Escape') setShowNotas(false) }}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        rows={2}
                        placeholder={t('operations.checklist.observationPlaceholder')}
                        autoFocus
                    />
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE: Grupo de Producto
// ============================================
const ProductoGroup = ({ compuestoId, nombre, elementos, modo, onToggle, onMarcarDano, isPending, isDanoPending, t }) => {
    const [expanded, setExpanded] = useState(true)

    const verificados = elementos.filter(e =>
        modo === 'cargue' ? e.verificado_salida : modo === 'bodega' ? e.verificado_bodega : e.verificado_retorno
    ).length
    const total = elementos.length
    const todosVerificados = verificados === total

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                    todosVerificados ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100'
                }`}
            >
                <div className="flex items-center gap-3">
                    {todosVerificados ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={`font-medium text-sm ${todosVerificados ? 'text-green-800' : 'text-slate-900'}`}>
                        {nombre || t('common.elements')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        todosVerificados
                            ? 'bg-green-100 text-green-700'
                            : verificados > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}>
                        {verificados}/{total}
                    </span>
                    {expanded
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                    }
                </div>
            </button>

            {expanded && (
                <div className="divide-y divide-slate-100 relative">
                    {elementos.map(elem => (
                        <ElementoCheckItem
                            key={elem.id}
                            elemento={elem}
                            modo={modo}
                            onToggle={onToggle}
                            onMarcarDano={onMarcarDano}
                            isPending={isPending}
                            isDanoPending={isDanoPending}
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================
// CONFIG: Textos y estilos por modo
// ============================================
const MODO_CONFIG = {
    cargue: {
        tituloKey: 'operations.checklist.loadingTitle',
        tituloImpresionKey: 'operations.checklist.loadingPrintTitle',
        icon: Truck,
        color: 'blue',
        bgIcon: 'bg-blue-100',
        textIcon: 'text-blue-600',
        bgInstruccion: 'bg-blue-50 border-blue-200 text-blue-700',
        instruccionKey: 'operations.checklist.loadingInstruction',
        columnaVerificadoKey: 'operations.checklist.loadingColumn',
        mensajeTodosVerificadosKey: 'operations.checklist.loadingAllVerified',
        firmaAKey: 'operations.checklist.loadingSignA',
        firmaCKey: 'operations.checklist.loadingSignC',
        botonCompletoKey: 'operations.checklist.loadingComplete'
    },
    recogida: {
        tituloKey: 'operations.checklist.pickupTitle',
        tituloImpresionKey: 'operations.checklist.pickupPrintTitle',
        icon: MapPin,
        color: 'orange',
        bgIcon: 'bg-orange-100',
        textIcon: 'text-orange-600',
        bgInstruccion: 'bg-orange-50 border-orange-200 text-orange-700',
        instruccionKey: 'operations.checklist.pickupInstruction',
        columnaVerificadoKey: 'operations.checklist.pickupColumn',
        mensajeTodosVerificadosKey: 'operations.checklist.pickupAllVerified',
        firmaAKey: 'operations.checklist.pickupSignA',
        firmaCKey: 'operations.checklist.pickupSignC',
        botonCompletoKey: 'operations.checklist.pickupComplete'
    },
    bodega: {
        tituloKey: 'operations.checklist.warehouseTitle',
        tituloImpresionKey: 'operations.checklist.warehousePrintTitle',
        icon: Home,
        color: 'purple',
        bgIcon: 'bg-purple-100',
        textIcon: 'text-purple-600',
        bgInstruccion: 'bg-purple-50 border-purple-200 text-purple-700',
        instruccionKey: 'operations.checklist.warehouseInstruction',
        columnaVerificadoKey: 'operations.checklist.warehouseColumn',
        mensajeTodosVerificadosKey: 'operations.checklist.warehouseAllVerified',
        firmaAKey: 'operations.checklist.warehouseSignA',
        firmaCKey: 'operations.checklist.warehouseSignC',
        botonCompletoKey: 'operations.checklist.warehouseComplete'
    }
}

// ============================================
// HELPER: Generar HTML imprimible para checklist
// ============================================
const generarChecklistPrint = ({ ordenId, ordenInfo, grupos, modo, verificados, total, t }) => {
    const config = MODO_CONFIG[modo] || MODO_CONFIG.cargue
    const titulo = t(config.tituloImpresionKey)
    const fecha = ordenInfo?.fecha_programada
        ? new Date(ordenInfo.fecha_programada).toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
        : '-'

    const seccionesHTML = grupos.map(grupo => {
        const filas = grupo.elementos.map(elem => {
            const check = modo === 'cargue' ? elem.verificado_salida : modo === 'bodega' ? elem.verificado_bodega : elem.verificado_retorno
            return `<tr>
                <td style="padding-left:24px">${elem.elemento_nombre}</td>
                <td>${elem.serie_codigo || elem.lote_codigo || '-'}</td>
                <td class="center">${elem.cantidad || 1}</td>
                <td class="center">${check ? '&#9745;' : '<span class="check-box"></span>'}</td>
                <td>${elem.notas || ''}</td>
            </tr>`
        }).join('')

        return `<tr class="grupo-header"><td colspan="5">${grupo.nombre} <span class="count">${grupo.elementos.length} elem.</span></td></tr>${filas}`
    }).join('')

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo} — Orden #${ordenId}</title>
<style>
    @page { margin: 15mm; size: letter; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    .header h1 { font-size: 18px; }
    .header .sub { font-size: 12px; color: #555; margin-top: 2px; }
    .info { display:flex; gap:20px; flex-wrap:wrap; margin-bottom:14px; padding:8px 12px; background:#f5f5f5; border-radius:4px; }
    .info-item { display:flex; align-items:center; gap:4px; }
    .info-label { font-weight:bold; font-size:10px; text-transform:uppercase; color:#666; }
    .info-value { font-size:11px; }
    .progress { margin-bottom:14px; padding:8px 12px; border:2px solid #333; border-radius:4px; text-align:center; font-size:14px; font-weight:bold; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    th { background:#333; color:#fff; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; padding:7px 8px; text-align:left; }
    th.center { text-align:center; }
    td { padding:5px 8px; border-bottom:1px solid #ddd; font-size:11px; vertical-align:middle; }
    td.center { text-align:center; }
    .grupo-header td { background:#e8e8e8; font-weight:bold; font-size:12px; border-bottom:2px solid #999; padding:8px; }
    .count { font-weight:normal; font-size:10px; color:#888; float:right; }
    .check-box { width:16px; height:16px; border:2px solid #333; display:inline-block; vertical-align:middle; border-radius:2px; }
    .footer { margin-top:24px; padding-top:12px; border-top:1px solid #ccc; }
    .firma-grid { display:flex; gap:40px; margin-top:30px; }
    .firma-item { flex:1; text-align:center; }
    .firma-linea { border-bottom:1px solid #333; margin-bottom:4px; height:30px; }
    .firma-label { font-size:10px; color:#666; text-transform:uppercase; }
    .notas { margin-top:16px; }
    .notas-box { border:1px solid #ccc; border-radius:4px; min-height:50px; padding:6px; }
    .notas-label { font-size:10px; font-weight:bold; text-transform:uppercase; color:#666; margin-bottom:4px; }
    .print-date { font-size:9px; color:#999; text-align:right; margin-top:8px; }
</style>
</head>
<body>
    <div class="header">
        <h1>${titulo} — Orden #${ordenId}</h1>
        <div class="sub">${ordenInfo?.tipo === 'montaje' ? t('operations.assembly') : t('operations.disassembly')} — ${ordenInfo?.evento_nombre || ''}</div>
    </div>
    <div class="info">
        <div class="info-item"><span class="info-label">${t('operations.client')}:</span><span class="info-value">${ordenInfo?.cliente_nombre || '-'}</span></div>
        <div class="info-item"><span class="info-label">${t('operations.dateLabel')}:</span><span class="info-value">${fecha}</span></div>
        <div class="info-item"><span class="info-label">${t('operations.location')}:</span><span class="info-value">${ordenInfo?.ciudad_evento || ''} ${ordenInfo?.direccion_evento ? '- ' + ordenInfo.direccion_evento : ''}</span></div>
    </div>
    <div class="progress">${t('operations.checklist.verifiedCount', { verified: verificados, total })}</div>
    <table>
        <thead>
            <tr>
                <th style="width:30%">${t('operations.element')}</th>
                <th style="width:18%">${t('operations.checklist.seriesLot')}</th>
                <th class="center" style="width:10%">${t('operations.checklist.qty')}</th>
                <th class="center" style="width:12%">${t(config.columnaVerificadoKey)}</th>
                <th style="width:30%">${t('operations.checklist.observations')}</th>
            </tr>
        </thead>
        <tbody>${seccionesHTML}</tbody>
    </table>
    <div class="notas">
        <div class="notas-label">${t('operations.checklist.generalObservations')}</div>
        <div class="notas-box"></div>
    </div>
    <div class="footer">
        <div class="firma-grid">
            <div class="firma-item"><div class="firma-linea"></div><div class="firma-label">${t(config.firmaAKey)}</div></div>
            <div class="firma-item"><div class="firma-linea"></div><div class="firma-label">${t('operations.checklist.verified')}</div></div>
            <div class="firma-item"><div class="firma-linea"></div><div class="firma-label">${t(config.firmaCKey)}</div></div>
        </div>
    </div>
    <div class="print-date">${t('operations.checklist.printed')}: ${new Date().toLocaleString()}</div>
</body>
</html>`
}

// ============================================
// COMPONENTE PRINCIPAL: ChecklistCargueDescargue
// Props:
//   - isOpen: boolean
//   - onClose: function
//   - ordenId: number
//   - ordenInfo: object (tipo, cliente, fecha, etc.)
//   - modo: 'cargue' | 'recogida' | 'bodega'
//   - onCompleto: callback cuando todos verificados
// ============================================
const ChecklistCargueDescargue = ({ isOpen, onClose, ordenId, ordenInfo, modo = 'cargue', onCompleto }) => {
    const { t } = useTranslation()
    const { elementos, totalElementos, verificadosCargue, verificadosRecogida, verificadosBodega, elementosConDano, isLoading, refetch } = useGetChecklist(
        isOpen ? ordenId : null
    )

    const verificarCargue = useVerificarElementoCargue()
    const verificarRecogida = useVerificarElementoRecogida()
    const verificarBodega = useVerificarElementoBodega()
    const marcarDano = useMarcarDanoElemento()
    const generarMantenimiento = useGenerarOrdenMantenimiento()

    const mutacion = modo === 'cargue' ? verificarCargue : modo === 'bodega' ? verificarBodega : verificarRecogida
    const verificados = modo === 'cargue' ? verificadosCargue : modo === 'bodega' ? verificadosBodega : verificadosRecogida
    const todosVerificados = totalElementos > 0 && verificados === totalElementos
    const progreso = totalElementos > 0 ? Math.round((verificados / totalElementos) * 100) : 0
    const esModoConDano = modo === 'recogida' || modo === 'bodega'

    const config = MODO_CONFIG[modo] || MODO_CONFIG.cargue
    const IconoModo = config.icon

    // Agrupar elementos por compuesto_id
    const grupos = useMemo(() => {
        if (!elementos.length) return []

        const mapa = {}
        elementos.forEach(elem => {
            const key = elem.compuesto_id || 'sin_grupo'
            if (!mapa[key]) {
                mapa[key] = {
                    compuestoId: key,
                    nombre: key === 'sin_grupo' ? t('operations.checklist.otherElements') : null,
                    elementos: []
                }
            }
            mapa[key].elementos.push(elem)
        })

        // Nombrar grupos usando el primer elemento
        Object.values(mapa).forEach(grupo => {
            if (!grupo.nombre && grupo.elementos.length > 0) {
                grupo.nombre = grupo.elementos[0].elemento_nombre?.split(' - ')[0] || 'Grupo'
            }
        })

        return Object.values(mapa)
    }, [elementos])

    const handleToggle = async (elementoId, verificado, notas) => {
        try {
            await mutacion.mutateAsync({
                ordenId,
                elementoId,
                verificado,
                notas
            })
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al verificar elemento')
        }
    }

    const handleMarcarDano = async (elementoId, marcado_dano, descripcion_dano, cantidad_danada = null) => {
        try {
            await marcarDano.mutateAsync({
                ordenId,
                elementoId,
                marcado_dano,
                descripcion_dano,
                cantidad_danada
            })
            toast.success(marcado_dano ? 'Elemento marcado con daño' : 'Marca de daño removida')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al marcar daño')
        }
    }

    const handleGenerarMantenimiento = async () => {
        try {
            const result = await generarMantenimiento.mutateAsync({ ordenId })
            toast.success(result.message || 'Orden de mantenimiento generada')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al generar orden de mantenimiento')
        }
    }

    const handleImprimir = () => {
        const html = generarChecklistPrint({
            ordenId,
            ordenInfo,
            grupos,
            modo,
            verificados,
            total: totalElementos
        })
        const ventana = window.open('', '_blank', 'width=800,height=600')
        if (ventana) {
            ventana.document.write(html)
            ventana.document.close()
            ventana.focus()
            setTimeout(() => ventana.print(), 300)
        }
    }

    const handleConfirmar = () => {
        onCompleto?.()
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgIcon}`}>
                        <IconoModo className={`w-5 h-5 ${config.textIcon}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">{config.titulo}</h3>
                        <p className="text-sm text-slate-500">
                            {ordenInfo?.tipo === 'montaje' ? 'Montaje' : 'Desmontaje'} #{ordenId}
                        </p>
                    </div>
                </div>
            }
            size="lg"
        >
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <Spinner size="lg" text="Cargando checklist..." />
                </div>
            ) : (
                <div className="space-y-5">

                    {/* Info de la orden */}
                    {ordenInfo && (
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">{ordenInfo.cliente_nombre || 'Cliente'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600">
                                        {ordenInfo.fecha_programada
                                            ? new Date(ordenInfo.fecha_programada).toLocaleDateString('es-CO')
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600 truncate">
                                        {ordenInfo.ciudad_evento || ordenInfo.direccion_evento || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Barra de progreso */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className={`w-4 h-4 ${todosVerificados ? 'text-green-600' : 'text-slate-400'}`} />
                                <span className="text-sm font-medium text-slate-700">
                                    Progreso: {verificados} de {totalElementos}
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${
                                todosVerificados ? 'text-green-600' : progreso > 50 ? 'text-blue-600' : 'text-slate-500'
                            }`}>
                                {progreso}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    todosVerificados ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progreso}%` }}
                            />
                        </div>
                        {todosVerificados && (
                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium text-green-700">
                                    {config.mensajeTodosVerificados}
                                </span>
                            </div>
                        )}
                        {esModoConDano && elementosConDano > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-700">
                                    {elementosConDano} elemento{elementosConDano > 1 ? 's' : ''} marcado{elementosConDano > 1 ? 's' : ''} con daño
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Instrucciones */}
                    <div className={`p-3 rounded-lg border text-sm ${config.bgInstruccion}`}>
                        {config.instruccion}
                    </div>

                    {/* Lista de elementos agrupados */}
                    <div className="space-y-3">
                        {grupos.length > 0 ? (
                            grupos.map(grupo => (
                                <ProductoGroup
                                    key={grupo.compuestoId}
                                    compuestoId={grupo.compuestoId}
                                    nombre={grupo.nombre}
                                    elementos={grupo.elementos}
                                    modo={modo}
                                    onToggle={handleToggle}
                                    onMarcarDano={handleMarcarDano}
                                    isPending={mutacion.isPending}
                                    isDanoPending={marcarDano.isPending}
                                />
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">
                                    No hay elementos asignados a esta orden
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                        {/* Botón generar orden de mantenimiento */}
                        {esModoConDano && todosVerificados && elementosConDano > 0 && (
                            <button
                                onClick={handleGenerarMantenimiento}
                                disabled={generarMantenimiento.isPending}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 border-2 border-amber-300 text-amber-700 font-medium rounded-lg hover:bg-amber-100 hover:border-amber-400 transition-colors disabled:opacity-50"
                            >
                                <Wrench className="w-5 h-5" />
                                {generarMantenimiento.isPending
                                    ? 'Generando orden...'
                                    : `Generar Orden de Mantenimiento (${elementosConDano} elemento${elementosConDano > 1 ? 's' : ''})`
                                }
                            </button>
                        )}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleImprimir}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Imprimir Checklist
                            </button>
                            <div className="flex items-center gap-3">
                                <Button variant="secondary" onClick={onClose}>
                                    Cerrar
                                </Button>
                                {todosVerificados && (
                                    <Button
                                        color="green"
                                        icon={CheckCircle}
                                        onClick={handleConfirmar}
                                    >
                                        {config.botonCompleto}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default ChecklistCargueDescargue
