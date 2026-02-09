// ============================================
// COMPONENTE: ModalRetornoElementos
// Modal mejorado para registrar retorno de elementos
// con agrupación por productos y resumen visual
// ============================================

import { useState, useMemo, useEffect } from 'react'
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    Hash,
    Layers,
    DollarSign,
    Save,
    CheckCheck,
    ArrowLeft
} from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'

// ============================================
// COMPONENTE: Elemento de Retorno Individual (Series - cantidad 1)
// ============================================
const ElementoRetornoItem = ({ elemento, retorno, onChange }) => {
    const estados = [
        { value: 'bueno', label: 'Bueno', icon: CheckCircle, bgSelected: 'bg-green-100 border-green-500 text-green-700', iconColor: 'text-green-600' },
        { value: 'dañado', label: 'Dañado', icon: AlertTriangle, bgSelected: 'bg-amber-100 border-amber-500 text-amber-700', iconColor: 'text-amber-600' },
        { value: 'perdido', label: 'Perdido', icon: XCircle, bgSelected: 'bg-red-100 border-red-500 text-red-700', iconColor: 'text-red-600' }
    ]

    const handleEstadoChange = (estado) => {
        onChange({
            ...retorno,
            estado_retorno: estado,
            costo_dano: estado === 'bueno' ? 0 : retorno.costo_dano
        })
    }

    return (
        <div className={`border rounded-lg p-3 transition-colors ${
            retorno.estado_retorno === 'bueno'
                ? 'border-green-200 bg-green-50/50'
                : retorno.estado_retorno === 'dañado'
                    ? 'border-amber-200 bg-amber-50/50'
                    : retorno.estado_retorno === 'perdido'
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
                        {elemento.serie_codigo || elemento.serie_numero ? (
                            <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {elemento.serie_codigo || elemento.serie_numero}
                            </span>
                        ) : elemento.lote_codigo ? (
                            <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {elemento.lote_codigo} (x{elemento.cantidad_lote || elemento.cantidad || 1})
                            </span>
                        ) : (
                            <span>Cantidad: {elemento.cantidad || 1}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Botones de estado */}
            <div className="flex gap-2 mb-3">
                {estados.map(({ value, label, icon: Icon, bgSelected, iconColor }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => handleEstadoChange(value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                            retorno.estado_retorno === value
                                ? bgSelected
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <Icon className={`w-3.5 h-3.5 ${retorno.estado_retorno === value ? iconColor : ''}`} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Campos adicionales para dañado/perdido */}
            {retorno.estado_retorno !== 'bueno' && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Costo del daño
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={retorno.costo_dano || ''}
                                onChange={(e) => onChange({ ...retorno, costo_dano: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Descripción del daño
                        </label>
                        <input
                            type="text"
                            value={retorno.notas || ''}
                            onChange={(e) => onChange({ ...retorno, notas: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            placeholder="Describir el daño o pérdida..."
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE: Elemento de Retorno para Lotes (cantidad > 1)
// Permite dividir la cantidad entre bueno/dañado/perdido
// ============================================
const ElementoLoteRetornoItem = ({ elemento, retorno, onChange }) => {
    // Soportar diferentes nombres de campos según el origen de datos
    const cantidadTotal = elemento.cantidad_lote || elemento.cantidad || 1
    const loteCodigo = elemento.lote_codigo || elemento.lote_numero || `Lote #${elemento.lote_id}`

    // Obtener cantidades actuales del retorno
    const cantidadBueno = retorno.cantidad_bueno ?? cantidadTotal
    const cantidadDanado = retorno.cantidad_danado ?? 0
    const cantidadPerdido = retorno.cantidad_perdido ?? 0

    // Validar si la suma es correcta
    const sumaActual = cantidadBueno + cantidadDanado + cantidadPerdido
    const esValido = sumaActual === cantidadTotal

    // Handler para cambiar cantidades
    // Al cambiar dañados/perdidos, ajusta automáticamente los buenos
    const handleCantidadChange = (campo, valor) => {
        const nuevaCantidad = Math.max(0, Math.min(cantidadTotal, parseInt(valor) || 0))

        let nuevosValores = {
            cantidad_bueno: cantidadBueno,
            cantidad_danado: cantidadDanado,
            cantidad_perdido: cantidadPerdido
        }

        // Actualizar el campo editado
        nuevosValores[campo] = nuevaCantidad

        // Auto-ajustar buenos cuando se cambian dañados o perdidos
        if (campo === 'cantidad_danado' || campo === 'cantidad_perdido') {
            // Buenos = Total - Dañados - Perdidos (no puede ser negativo)
            const buenosCalculados = cantidadTotal - nuevosValores.cantidad_danado - nuevosValores.cantidad_perdido
            nuevosValores.cantidad_bueno = Math.max(0, buenosCalculados)
        } else if (campo === 'cantidad_bueno') {
            // Si se editan buenos directamente, ajustar dañados proporcionalmente
            const diferencia = cantidadTotal - nuevaCantidad - nuevosValores.cantidad_perdido
            nuevosValores.cantidad_danado = Math.max(0, diferencia)
        }

        // Determinar el estado_retorno basado en las cantidades
        let estado_retorno = 'bueno'
        if (nuevosValores.cantidad_perdido > 0) {
            estado_retorno = 'perdido'
        } else if (nuevosValores.cantidad_danado > 0) {
            estado_retorno = 'dañado'
        }

        onChange({
            ...retorno,
            ...nuevosValores,
            estado_retorno,
            cantidad_total: cantidadTotal,
            costo_dano: (nuevosValores.cantidad_danado === 0 && nuevosValores.cantidad_perdido === 0)
                ? 0
                : retorno.costo_dano
        })
    }

    // Marcar todos como buenos
    const handleTodosBuenos = () => {
        onChange({
            ...retorno,
            cantidad_bueno: cantidadTotal,
            cantidad_danado: 0,
            cantidad_perdido: 0,
            cantidad_total: cantidadTotal,
            estado_retorno: 'bueno',
            costo_dano: 0
        })
    }

    // Determinar color del borde basado en el estado
    const getBorderColor = () => {
        if (!esValido) return 'border-red-300 bg-red-50/50'
        if (cantidadPerdido > 0) return 'border-red-200 bg-red-50/50'
        if (cantidadDanado > 0) return 'border-amber-200 bg-amber-50/50'
        return 'border-green-200 bg-green-50/50'
    }

    const hayDanosOPerdidos = cantidadDanado > 0 || cantidadPerdido > 0

    return (
        <div className={`border rounded-lg p-3 transition-colors ${getBorderColor()}`}>
            {/* Info del elemento */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                        {elemento.elemento_nombre || elemento.nombre}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {loteCodigo}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                            {cantidadTotal} unidades
                        </span>
                    </div>
                </div>
                {/* Botón rápido todos buenos */}
                {(cantidadDanado > 0 || cantidadPerdido > 0) && (
                    <button
                        type="button"
                        onClick={handleTodosBuenos}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100 rounded transition-colors"
                    >
                        <CheckCheck className="w-3 h-3" />
                        Todos OK
                    </button>
                )}
            </div>

            {/* Inputs para dividir cantidades */}
            <div className="grid grid-cols-3 gap-2 mb-2">
                {/* Bueno */}
                <div className="flex flex-col">
                    <label className="flex items-center gap-1 text-xs font-medium text-green-700 mb-1">
                        <CheckCircle className="w-3 h-3" />
                        Buenos
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={cantidadTotal}
                        value={cantidadBueno}
                        onChange={(e) => handleCantidadChange('cantidad_bueno', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm text-center border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                    />
                </div>

                {/* Dañado */}
                <div className="flex flex-col">
                    <label className="flex items-center gap-1 text-xs font-medium text-amber-700 mb-1">
                        <AlertTriangle className="w-3 h-3" />
                        Dañados
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={cantidadTotal}
                        value={cantidadDanado}
                        onChange={(e) => handleCantidadChange('cantidad_danado', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm text-center border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    />
                </div>

                {/* Perdido */}
                <div className="flex flex-col">
                    <label className="flex items-center gap-1 text-xs font-medium text-red-700 mb-1">
                        <XCircle className="w-3 h-3" />
                        Perdidos
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={cantidadTotal}
                        value={cantidadPerdido}
                        onChange={(e) => handleCantidadChange('cantidad_perdido', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm text-center border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                    />
                </div>
            </div>

            {/* Advertencia si la suma no cuadra */}
            {!esValido && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-red-100 text-red-700 rounded text-xs mb-2">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    La suma ({sumaActual}) no coincide con el total ({cantidadTotal})
                </div>
            )}

            {/* Campos adicionales para dañado/perdido */}
            {hayDanosOPerdidos && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Costo total de daños/pérdidas
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={retorno.costo_dano || ''}
                                onChange={(e) => onChange({ ...retorno, costo_dano: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Descripción del daño
                        </label>
                        <input
                            type="text"
                            value={retorno.notas || ''}
                            onChange={(e) => onChange({ ...retorno, notas: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            placeholder="Describir el daño o pérdida..."
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE: Grupo de Producto
// ============================================
const ProductoGroup = ({ producto, elementos, retornos, onRetornoChange, onMarcarTodosBuenos }) => {
    const [expanded, setExpanded] = useState(true)

    // Calcular resumen del grupo
    const resumen = useMemo(() => {
        const elementosGrupo = elementos.filter(e => e.compuesto_id === producto.compuesto_id)
        return {
            total: elementosGrupo.length,
            buenos: elementosGrupo.filter(e => {
                const r = retornos.find(r => r.alquiler_elemento_id === e.id)
                return r?.estado_retorno === 'bueno'
            }).length,
            danados: elementosGrupo.filter(e => {
                const r = retornos.find(r => r.alquiler_elemento_id === e.id)
                return r?.estado_retorno === 'dañado'
            }).length,
            perdidos: elementosGrupo.filter(e => {
                const r = retornos.find(r => r.alquiler_elemento_id === e.id)
                return r?.estado_retorno === 'perdido'
            }).length
        }
    }, [elementos, retornos, producto.compuesto_id])

    const elementosProducto = elementos.filter(e => e.compuesto_id === producto.compuesto_id)

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Header del producto */}
            <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-3 flex-1 text-left"
                >
                    <span className="text-lg">{producto.categoria_emoji || '📦'}</span>
                    <div>
                        <p className="font-medium text-slate-900">
                            {producto.cantidad}x {producto.producto_nombre}
                        </p>
                        <p className="text-xs text-slate-500">{producto.categoria_nombre}</p>
                    </div>
                </button>

                <div className="flex items-center gap-3">
                    {/* Mini resumen */}
                    <div className="flex items-center gap-2 text-xs">
                        {resumen.buenos > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                {resumen.buenos}
                            </span>
                        )}
                        {resumen.danados > 0 && (
                            <span className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="w-3 h-3" />
                                {resumen.danados}
                            </span>
                        )}
                        {resumen.perdidos > 0 && (
                            <span className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-3 h-3" />
                                {resumen.perdidos}
                            </span>
                        )}
                    </div>

                    {/* Botón marcar todos buenos */}
                    {resumen.buenos < resumen.total && (
                        <button
                            type="button"
                            onClick={() => onMarcarTodosBuenos(producto.compuesto_id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        >
                            <CheckCheck className="w-3 h-3" />
                            Todos OK
                        </button>
                    )}
                </div>
            </div>

            {/* Lista de elementos */}
            {expanded && (
                <div className="p-3 space-y-2 bg-white">
                    {elementosProducto.map(elemento => {
                        const retorno = retornos.find(r => r.alquiler_elemento_id === elemento.id)
                        if (!retorno) return null

                        // Usar componente de lote si tiene cantidad > 1 y es lote
                        // Soportar diferentes nombres de campos según el origen de datos
                        const cantidadElemento = elemento.cantidad_lote || elemento.cantidad || 1
                        const esLote = elemento.lote_codigo || elemento.lote_numero || elemento.lote_id
                        const esLoteMultiple = esLote && cantidadElemento > 1

                        return esLoteMultiple ? (
                            <ElementoLoteRetornoItem
                                key={elemento.id}
                                elemento={elemento}
                                retorno={retorno}
                                onChange={(newRetorno) => onRetornoChange(elemento.id, newRetorno)}
                            />
                        ) : (
                            <ElementoRetornoItem
                                key={elemento.id}
                                elemento={elemento}
                                retorno={retorno}
                                onChange={(newRetorno) => onRetornoChange(elemento.id, newRetorno)}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE PRINCIPAL: ModalRetornoElementos
// ============================================
const ModalRetornoElementos = ({
    isOpen,
    onClose,
    orden,
    elementos,
    productos,
    deposito = 0,
    onSave
}) => {
    const [retornos, setRetornos] = useState([])
    const [saving, setSaving] = useState(false)

    // Inicializar retornos cuando se abre el modal o cambian los elementos
    useEffect(() => {
        if (isOpen && elementos?.length > 0) {
            setRetornos(
                elementos.map(elem => {
                    // Soportar diferentes nombres de campos según el origen de datos
                    const cantidadTotal = elem.cantidad_lote || elem.cantidad || 1
                    const esLote = elem.lote_codigo || elem.lote_numero || elem.lote_id
                    const esLoteMultiple = esLote && cantidadTotal > 1

                    return {
                        alquiler_elemento_id: elem.id,
                        estado_retorno: 'bueno',
                        costo_dano: 0,
                        notas: '',
                        // Campos adicionales para lotes con cantidad > 1
                        ...(esLoteMultiple && {
                            cantidad_total: cantidadTotal,
                            cantidad_bueno: cantidadTotal,
                            cantidad_danado: 0,
                            cantidad_perdido: 0
                        })
                    }
                })
            )
        }
    }, [isOpen, elementos])

    // ============================================
    // CÁLCULO: Estadísticas y progreso de retorno
    // Considera cantidades de lotes para conteo correcto
    // ============================================
    const estadisticas = useMemo(() => {
        let buenos = 0
        let danados = 0
        let perdidos = 0
        let totalUnidades = 0
        let unidadesMarcadas = 0

        retornos.forEach(r => {
            // Si tiene campos de cantidad (es un lote), usar esos valores
            if (r.cantidad_total !== undefined) {
                totalUnidades += r.cantidad_total
                buenos += r.cantidad_bueno || 0
                danados += r.cantidad_danado || 0
                perdidos += r.cantidad_perdido || 0
                // Marcado si la suma de cantidades es igual al total
                const suma = (r.cantidad_bueno || 0) + (r.cantidad_danado || 0) + (r.cantidad_perdido || 0)
                if (suma === r.cantidad_total) {
                    unidadesMarcadas += r.cantidad_total
                }
            } else {
                // Elemento individual (serie o cantidad = 1)
                totalUnidades += 1
                if (r.estado_retorno === 'bueno') buenos += 1
                else if (r.estado_retorno === 'dañado') danados += 1
                else if (r.estado_retorno === 'perdido') perdidos += 1

                if (r.estado_retorno) {
                    unidadesMarcadas += 1
                }
            }
        })

        const totalDanos = retornos.reduce((sum, r) => sum + (r.costo_dano || 0), 0)
        const saldo = deposito - totalDanos
        const porcentaje = totalUnidades > 0 ? Math.round((unidadesMarcadas / totalUnidades) * 100) : 0

        return {
            buenos,
            danados,
            perdidos,
            totalDanos,
            saldo,
            total: totalUnidades,
            marcados: unidadesMarcadas,
            porcentaje
        }
    }, [retornos, deposito])

    // Handlers
    const handleRetornoChange = (elementoId, newRetorno) => {
        setRetornos(prev =>
            prev.map(r =>
                r.alquiler_elemento_id === elementoId ? newRetorno : r
            )
        )
    }

    const handleMarcarTodosBuenos = (compuestoId) => {
        const elementosProducto = elementos.filter(e => e.compuesto_id === compuestoId)
        setRetornos(prev =>
            prev.map(r => {
                const elemento = elementosProducto.find(e => e.id === r.alquiler_elemento_id)
                if (elemento) {
                    // Si es un lote con cantidad, resetear también las cantidades
                    if (r.cantidad_total !== undefined) {
                        return {
                            ...r,
                            estado_retorno: 'bueno',
                            costo_dano: 0,
                            notas: '',
                            cantidad_bueno: r.cantidad_total,
                            cantidad_danado: 0,
                            cantidad_perdido: 0
                        }
                    }
                    return { ...r, estado_retorno: 'bueno', costo_dano: 0, notas: '' }
                }
                return r
            })
        )
    }

    const handleMarcarTodosGlobalBuenos = () => {
        setRetornos(prev =>
            prev.map(r => {
                // Si es un lote con cantidad, resetear también las cantidades
                if (r.cantidad_total !== undefined) {
                    return {
                        ...r,
                        estado_retorno: 'bueno',
                        costo_dano: 0,
                        notas: '',
                        cantidad_bueno: r.cantidad_total,
                        cantidad_danado: 0,
                        cantidad_perdido: 0
                    }
                }
                return { ...r, estado_retorno: 'bueno', costo_dano: 0, notas: '' }
            })
        )
    }

    // ============================================
    // HANDLER: Guardar con validación
    // Advierte si hay elementos sin estado marcado
    // ============================================
    const handleGuardar = async () => {
        const sinMarcar = retornos.filter(r => !r.estado_retorno).length
        if (sinMarcar > 0) {
            const confirmar = window.confirm(
                `Hay ${sinMarcar} elemento(s) sin estado marcado.\n\n¿Deseas continuar de todas formas?`
            )
            if (!confirmar) return
        }

        setSaving(true)
        try {
            await onSave(retornos.map(r => ({
                alquiler_elemento_id: r.alquiler_elemento_id,
                estado_retorno: r.estado_retorno || 'bueno', // Default a bueno si no marcado
                costo_dano: r.costo_dano,
                notas: r.notas
            })))
            onClose()
        } catch (error) {
            console.error('Error al registrar retorno:', error)
        } finally {
            setSaving(false)
        }
    }

    // Agrupar elementos por producto
    const productosConElementos = useMemo(() => {
        if (!productos || !elementos) return []
        return productos.filter(p =>
            elementos.some(e => e.compuesto_id === p.compuesto_id)
        )
    }, [productos, elementos])

    // Elementos sin producto asignado
    const elementosSinProducto = useMemo(() => {
        if (!elementos) return []
        if (!productos || productos.length === 0) return elementos
        const compuestoIds = productos.map(p => p.compuesto_id)
        return elementos.filter(e => !compuestoIds.includes(e.compuesto_id))
    }, [elementos, productos])

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Registrar Retorno</h3>
                        <p className="text-sm text-slate-500">
                            Orden #{orden?.id} - {orden?.cliente_nombre}
                        </p>
                    </div>
                </div>
            }
            size="lg"
        >
            <div className="space-y-4">
                {/* Indicador de progreso */}
                <div className="bg-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700">
                            {estadisticas.marcados} de {estadisticas.total} elementos marcados
                        </span>
                        <span className={`font-bold ${
                            estadisticas.porcentaje === 100 ? 'text-green-600' : 'text-slate-500'
                        }`}>
                            {estadisticas.porcentaje}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                estadisticas.porcentaje === 100 ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${estadisticas.porcentaje}%` }}
                        />
                    </div>
                </div>

                {/* Resumen global */}
                <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{estadisticas.buenos}</p>
                                    <p className="text-xs text-slate-500">Buenos</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{estadisticas.danados}</p>
                                    <p className="text-xs text-slate-500">Dañados</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{estadisticas.perdidos}</p>
                                    <p className="text-xs text-slate-500">Perdidos</p>
                                </div>
                            </div>
                        </div>

                        {estadisticas.buenos < estadisticas.total && (
                            <button
                                type="button"
                                onClick={handleMarcarTodosGlobalBuenos}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Marcar todos como buenos
                            </button>
                        )}
                    </div>
                </div>

                {/* Lista de productos con elementos */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {productosConElementos.map(producto => (
                        <ProductoGroup
                            key={producto.id}
                            producto={producto}
                            elementos={elementos}
                            retornos={retornos}
                            onRetornoChange={handleRetornoChange}
                            onMarcarTodosBuenos={handleMarcarTodosBuenos}
                        />
                    ))}

                    {/* Elementos sin producto */}
                    {elementosSinProducto.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50">
                                <p className="font-medium text-slate-900">Otros elementos</p>
                            </div>
                            <div className="p-3 space-y-2 bg-white">
                                {elementosSinProducto.map(elemento => {
                                    const retorno = retornos.find(r => r.alquiler_elemento_id === elemento.id)
                                    if (!retorno) return null

                                    // Usar componente de lote si tiene cantidad > 1 y es lote
                                    // Soportar diferentes nombres de campos según el origen de datos
                                    const cantidadElemento = elemento.cantidad_lote || elemento.cantidad || 1
                                    const esLote = elemento.lote_codigo || elemento.lote_numero || elemento.lote_id
                                    const esLoteMultiple = esLote && cantidadElemento > 1

                                    return esLoteMultiple ? (
                                        <ElementoLoteRetornoItem
                                            key={elemento.id}
                                            elemento={elemento}
                                            retorno={retorno}
                                            onChange={(newRetorno) => handleRetornoChange(elemento.id, newRetorno)}
                                        />
                                    ) : (
                                        <ElementoRetornoItem
                                            key={elemento.id}
                                            elemento={elemento}
                                            retorno={retorno}
                                            onChange={(newRetorno) => handleRetornoChange(elemento.id, newRetorno)}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Resumen financiero */}
                <div className={`rounded-lg p-4 ${
                    estadisticas.totalDanos > 0
                        ? estadisticas.saldo >= 0
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className={`w-5 h-5 ${
                            estadisticas.totalDanos > 0
                                ? estadisticas.saldo >= 0 ? 'text-amber-600' : 'text-red-600'
                                : 'text-green-600'
                        }`} />
                        <span className="font-medium text-slate-900">Resumen Financiero</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Depósito</p>
                            <p className="font-semibold text-slate-900">
                                ${deposito.toLocaleString('es-CO')}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Total daños</p>
                            <p className={`font-semibold ${estadisticas.totalDanos > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                ${estadisticas.totalDanos.toLocaleString('es-CO')}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">
                                {estadisticas.saldo >= 0 ? 'A devolver' : 'Pendiente cobro'}
                            </p>
                            <p className={`font-semibold ${
                                estadisticas.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                ${Math.abs(estadisticas.saldo).toLocaleString('es-CO')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        color="orange"
                        icon={Save}
                        onClick={handleGuardar}
                        disabled={saving || retornos.length === 0}
                    >
                        {saving ? 'Guardando...' : 'Confirmar Retorno'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default ModalRetornoElementos
