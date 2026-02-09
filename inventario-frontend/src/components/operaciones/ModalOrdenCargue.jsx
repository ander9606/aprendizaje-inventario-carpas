// ============================================
// COMPONENTE: ModalOrdenCargue
// Muestra productos cotizados y elementos desglosados para cargue
// ============================================

import { useState } from 'react'
import {
    Package,
    Truck,
    X,
    ChevronDown,
    ChevronRight,
    Box,
    Hash,
    Layers,
    CheckCircle,
    AlertCircle,
    Printer,
    MapPin,
    Calendar,
    User
} from 'lucide-react'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'
import Button from '../common/Button'
import { useGetOrdenCompleta, useCambiarEstadoElementosMasivo } from '../../hooks/useOrdenesTrabajo'
import { toast } from 'sonner'

// ============================================
// COMPONENTE: Producto Expandible
// ============================================
const ProductoItem = ({ producto, elementos, expanded, onToggle }) => {
    // Filtrar elementos que pertenecen a este producto (por compuesto_id)
    const elementosProducto = elementos.filter(e =>
        e.compuesto_id === producto.compuesto_id
    )

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">{producto.categoria_emoji || '📦'}</span>
                    <div className="text-left">
                        <p className="font-medium text-slate-900">
                            {producto.cantidad}x {producto.producto_nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                            {producto.categoria_nombre}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {elementosProducto.length > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {elementosProducto.length} items
                        </span>
                    )}
                    {expanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                </div>
            </button>

            {expanded && elementosProducto.length > 0 && (
                <div className="border-t border-slate-200 bg-white">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-600">
                            <div className="col-span-5">Elemento</div>
                            <div className="col-span-3">Serie</div>
                            <div className="col-span-2 text-center">Cantidad</div>
                            <div className="col-span-2 text-center">Estado</div>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {elementosProducto.map((elem, idx) => (
                            <div key={idx} className="px-4 py-2 grid grid-cols-12 gap-2 items-center text-sm">
                                <div className="col-span-5 flex items-center gap-2">
                                    <Box className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{elem.elemento_nombre}</span>
                                </div>
                                <div className="col-span-3">
                                    {elem.serie_codigo ? (
                                        <span className="flex items-center gap-1 text-xs">
                                            <Hash className="w-3 h-3 text-slate-400" />
                                            {elem.serie_codigo}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">-</span>
                                    )}
                                </div>
                                <div className="col-span-2 text-center">
                                    {elem.cantidad_lote || elem.cantidad || 1}
                                </div>
                                <div className="col-span-2 text-center">
                                    <EstadoBadge estado={elem.estado_salida || elem.estado} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {expanded && elementosProducto.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-500 bg-white border-t border-slate-200">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                    Sin elementos asignados
                </div>
            )}
        </div>
    )
}

// ============================================
// COMPONENTE: Badge de Estado
// ============================================
const EstadoBadge = ({ estado }) => {
    const config = {
        // Estados de alquiler_elementos
        nuevo: { bg: 'bg-green-100', text: 'text-green-700', label: 'Nuevo' },
        bueno: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bueno' },
        mantenimiento: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Mtto' },
        // Estados de orden_trabajo_elementos
        pendiente: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente' },
        cargado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Cargado' },
        descargado: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Descargado' },
        instalado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Instalado' },
        verificado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Verificado' },
        con_problema: { bg: 'bg-red-100', text: 'text-red-700', label: 'Con problema' }
    }
    const c = config[estado] || { bg: 'bg-slate-100', text: 'text-slate-700', label: estado || '-' }
    return (
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    )
}

// ============================================
// HELPER: Generar HTML imprimible para checklist
// ============================================
const generarChecklistImprimible = ({ ordenId, ordenInfo, productos, elementosCargue }) => {
    const fecha = ordenInfo?.fecha_programada
        ? new Date(ordenInfo.fecha_programada).toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
        : '-'

    // Agrupar elementos por producto usando compuesto_id
    const productosConElementos = productos.map(p => ({
        ...p,
        elementos: elementosCargue.filter(e => e.compuesto_id === p.compuesto_id)
    }))

    // Elementos sin producto asignado (por si alguno no tiene compuesto_id)
    const elementosSinProducto = elementosCargue.filter(e =>
        !e.compuesto_id || !productos.some(p => p.compuesto_id === e.compuesto_id)
    )

    const totalElementos = elementosCargue.length

    // Generar secciones HTML por producto
    const seccionesProductos = productosConElementos.map((prod) => {
        const elemRows = prod.elementos.length > 0
            ? prod.elementos.map(elem => `
                <tr>
                    <td class="elem-indent">${elem.elemento_nombre}</td>
                    <td>${elem.serie_codigo || (elem.lote_codigo ? 'Lote: ' + elem.lote_codigo : '-')}</td>
                    <td class="center">${elem.cantidad_lote || elem.cantidad || 1}</td>
                    <td class="center"><span class="check-box"></span></td>
                    <td></td>
                </tr>`).join('')
            : `<tr><td class="elem-indent no-elem" colspan="4">Sin elementos asignados</td><td></td></tr>`

        return `
            <tr class="producto-header">
                <td colspan="5">${prod.cantidad}x ${prod.producto_nombre} <span class="cat-label">${prod.categoria_nombre || ''}</span> <span class="elem-count">${prod.elementos.length} elem.</span></td>
            </tr>
            ${elemRows}`
    }).join('')

    // Elementos sin producto
    const seccionSinProducto = elementosSinProducto.length > 0 ? `
        <tr class="producto-header">
            <td colspan="5">Otros elementos <span class="elem-count">${elementosSinProducto.length} elem.</span></td>
        </tr>
        ${elementosSinProducto.map(elem => `
            <tr>
                <td class="elem-indent">${elem.elemento_nombre}</td>
                <td>${elem.serie_codigo || (elem.lote_codigo ? 'Lote: ' + elem.lote_codigo : '-')}</td>
                <td class="center">${elem.cantidad_lote || elem.cantidad || 1}</td>
                <td class="center"><span class="check-box"></span></td>
                <td></td>
            </tr>`).join('')}` : ''

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Orden de Cargue #${ordenId}</title>
<style>
    @page { margin: 15mm; size: letter; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    .header h1 { font-size: 18px; font-weight: bold; }
    .header .subtitle { font-size: 12px; color: #555; margin-top: 2px; }
    .info-grid { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 14px; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; }
    .info-item { display: flex; align-items: center; gap: 4px; }
    .info-label { font-weight: bold; font-size: 10px; text-transform: uppercase; color: #666; }
    .info-value { font-size: 11px; }
    .resumen { display: flex; gap: 16px; margin-bottom: 14px; }
    .resumen-item { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; }
    .resumen-item strong { font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #333; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 8px; text-align: left; }
    th.center { text-align: center; }
    td { padding: 5px 8px; border-bottom: 1px solid #ddd; font-size: 11px; vertical-align: middle; }
    td.center { text-align: center; }
    tr.producto-header td { background: #e8e8e8; font-weight: bold; font-size: 12px; border-bottom: 2px solid #999; padding: 8px; }
    .cat-label { font-weight: normal; font-size: 10px; color: #666; }
    .elem-count { font-weight: normal; font-size: 10px; color: #888; float: right; }
    .elem-indent { padding-left: 24px; }
    .no-elem { color: #999; font-style: italic; }
    .check-box { width: 16px; height: 16px; border: 2px solid #333; display: inline-block; vertical-align: middle; border-radius: 2px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; }
    .firma-grid { display: flex; gap: 40px; margin-top: 30px; }
    .firma-item { flex: 1; text-align: center; }
    .firma-linea { border-bottom: 1px solid #333; margin-bottom: 4px; height: 30px; }
    .firma-label { font-size: 10px; color: #666; text-transform: uppercase; }
    .notas { margin-top: 16px; }
    .notas-box { border: 1px solid #ccc; border-radius: 4px; min-height: 50px; padding: 6px; }
    .notas-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 4px; }
    .print-date { font-size: 9px; color: #999; text-align: right; margin-top: 8px; }
</style>
</head>
<body>
    <div class="header">
        <h1>ORDEN DE CARGUE #${ordenId}</h1>
        <div class="subtitle">${ordenInfo?.tipo === 'montaje' ? 'Montaje' : 'Desmontaje'} — ${ordenInfo?.evento_nombre || ''}</div>
    </div>

    <div class="info-grid">
        <div class="info-item">
            <span class="info-label">Cliente:</span>
            <span class="info-value">${ordenInfo?.cliente_nombre || '-'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Fecha:</span>
            <span class="info-value">${fecha}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Ubicación:</span>
            <span class="info-value">${ordenInfo?.ciudad_evento || ''} ${ordenInfo?.direccion_evento ? '- ' + ordenInfo.direccion_evento : ''}</span>
        </div>
    </div>

    <div class="resumen">
        <div class="resumen-item"><strong>${productos.length}</strong> productos</div>
        <div class="resumen-item"><strong>${totalElementos}</strong> elementos</div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:35%">Elemento</th>
                <th style="width:22%">Serie / Lote</th>
                <th class="center" style="width:10%">Cant.</th>
                <th class="center" style="width:13%">Cargado</th>
                <th style="width:20%">Obs.</th>
            </tr>
        </thead>
        <tbody>
            ${seccionesProductos}
            ${seccionSinProducto}
        </tbody>
    </table>

    <div class="notas">
        <div class="notas-label">Observaciones generales</div>
        <div class="notas-box"></div>
    </div>

    <div class="footer">
        <div class="firma-grid">
            <div class="firma-item">
                <div class="firma-linea"></div>
                <div class="firma-label">Preparó</div>
            </div>
            <div class="firma-item">
                <div class="firma-linea"></div>
                <div class="firma-label">Verificó</div>
            </div>
            <div class="firma-item">
                <div class="firma-linea"></div>
                <div class="firma-label">Despachó</div>
            </div>
        </div>
    </div>

    <div class="print-date">Impreso: ${new Date().toLocaleString('es-CO')}</div>
</body>
</html>`
}

// ============================================
// COMPONENTE PRINCIPAL: ModalOrdenCargue
// Props:
//   - ordenId: ID de la orden
//   - ordenInfo: Info básica de la orden (tipo, cliente, fecha, etc.)
//   - elementos: Array de elementos de la orden (para obtener IDs)
//   - onConfirmado: Callback cuando se confirma el cargue
// ============================================
const ModalOrdenCargue = ({ isOpen, onClose, ordenId, ordenInfo, elementos, onConfirmado }) => {
    const [expandedProducts, setExpandedProducts] = useState({})
    const cambiarEstadoMasivo = useCambiarEstadoElementosMasivo()

    const { productos, elementosCargue, resumenElementos, isLoading } = useGetOrdenCompleta(
        isOpen ? ordenId : null
    )

    // Handler para confirmar cargue de todos los elementos
    const handleConfirmarCargue = async () => {
        if (!elementos || elementos.length === 0) {
            toast.error('No hay elementos para marcar como cargados')
            return
        }

        const elementoIds = elementos.map(e => e.id)

        try {
            await cambiarEstadoMasivo.mutateAsync({
                ordenId,
                elementoIds,
                estado: 'cargado'
            })
            toast.success(`${elementoIds.length} elemento(s) marcados como "cargado"`)
            onConfirmado?.()
            onClose()
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error al confirmar cargue')
        }
    }

    // Handler para imprimir checklist
    const handleImprimir = () => {
        const html = generarChecklistImprimible({
            ordenId,
            ordenInfo,
            productos,
            elementosCargue
        })
        const ventana = window.open('', '_blank', 'width=800,height=600')
        if (ventana) {
            ventana.document.write(html)
            ventana.document.close()
            ventana.focus()
            setTimeout(() => ventana.print(), 300)
        }
    }

    const toggleProduct = (productoId) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productoId]: !prev[productoId]
        }))
    }

    const expandAll = () => {
        const allExpanded = {}
        productos.forEach(p => { allExpanded[p.id] = true })
        setExpandedProducts(allExpanded)
    }

    const collapseAll = () => {
        setExpandedProducts({})
    }

    // Agrupar elementos por tipo para resumen
    const resumenPorTipo = elementosCargue.reduce((acc, elem) => {
        const nombre = elem.elemento_nombre || 'Sin nombre'
        if (!acc[nombre]) {
            acc[nombre] = { cantidad: 0, series: [] }
        }
        // Soportar ambos campos: cantidad_lote (alquiler_elementos) y cantidad (orden_trabajo_elementos)
        acc[nombre].cantidad += elem.cantidad_lote || elem.cantidad || 1
        // Solo mostrar números de serie, no de lote
        if (elem.serie_codigo) acc[nombre].series.push(elem.serie_codigo)
        return acc
    }, {})

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Orden de Cargue</h3>
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
                    <Spinner size="lg" text="Cargando orden..." />
                </div>
            ) : (
                <div className="space-y-6">
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

                    {/* Resumen rápido */}
                    <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">
                                {productos.length} productos
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                            <Box className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                                {elementosCargue.length} elementos
                            </span>
                        </div>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={expandAll}
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                Expandir todo
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                                onClick={collapseAll}
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                Colapsar todo
                            </button>
                        </div>
                    </div>

                    {/* Lista de productos con elementos */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-slate-900 flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            Productos Cotizados
                        </h4>
                        {productos.length > 0 ? (
                            <div className="space-y-2">
                                {productos.map((producto) => (
                                    <ProductoItem
                                        key={producto.id}
                                        producto={producto}
                                        elementos={elementosCargue}
                                        expanded={expandedProducts[producto.id]}
                                        onToggle={() => toggleProduct(producto.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-500">
                                No hay productos en esta orden
                            </div>
                        )}
                    </div>

                    {/* Resumen de elementos para cargue */}
                    {Object.keys(resumenPorTipo).length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            <h4 className="font-medium text-slate-900 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-slate-400" />
                                Resumen de Cargue
                            </h4>
                            <div className="bg-slate-50 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-600">
                                        <div className="col-span-6">Elemento</div>
                                        <div className="col-span-2 text-center">Cantidad</div>
                                        <div className="col-span-4">Series</div>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-200">
                                    {Object.entries(resumenPorTipo).map(([nombre, data]) => (
                                        <div key={nombre} className="px-4 py-2 grid grid-cols-12 gap-2 items-center text-sm">
                                            <div className="col-span-6 font-medium text-slate-900">{nombre}</div>
                                            <div className="col-span-2 text-center">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    {data.cantidad}
                                                </span>
                                            </div>
                                            <div className="col-span-4 text-xs text-slate-500 truncate">
                                                {data.series.length > 0 ? data.series.join(', ') : '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <button
                            onClick={handleImprimir}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir Checklist
                        </button>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                            >
                                Cerrar
                            </Button>
                            <Button
                                color="green"
                                icon={CheckCircle}
                                onClick={handleConfirmarCargue}
                                disabled={cambiarEstadoMasivo.isPending || !elementos?.length}
                            >
                                {cambiarEstadoMasivo.isPending ? 'Confirmando...' : 'Confirmar Cargue'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default ModalOrdenCargue
