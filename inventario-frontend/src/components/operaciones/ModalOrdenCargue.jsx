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
import { useGetOrdenCompleta } from '../../hooks/useOrdenesTrabajo'

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
                            <div className="col-span-3">Serie/Lote</div>
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
                                    ) : elem.lote_codigo ? (
                                        <span className="flex items-center gap-1 text-xs">
                                            <Layers className="w-3 h-3 text-slate-400" />
                                            {elem.lote_codigo}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">-</span>
                                    )}
                                </div>
                                <div className="col-span-2 text-center">
                                    {elem.cantidad_lote || 1}
                                </div>
                                <div className="col-span-2 text-center">
                                    <EstadoBadge estado={elem.estado_salida} />
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
        nuevo: { bg: 'bg-green-100', text: 'text-green-700', label: 'Nuevo' },
        bueno: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bueno' },
        mantenimiento: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Mtto' }
    }
    const c = config[estado] || { bg: 'bg-slate-100', text: 'text-slate-700', label: estado || '-' }
    return (
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    )
}

// ============================================
// COMPONENTE PRINCIPAL: ModalOrdenCargue
// ============================================
const ModalOrdenCargue = ({ isOpen, onClose, ordenId, ordenInfo }) => {
    const [expandedProducts, setExpandedProducts] = useState({})

    const { productos, alquilerElementos, resumenElementos, isLoading } = useGetOrdenCompleta(
        isOpen ? ordenId : null
    )

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
    const resumenPorTipo = alquilerElementos.reduce((acc, elem) => {
        const nombre = elem.elemento_nombre || 'Sin nombre'
        if (!acc[nombre]) {
            acc[nombre] = { cantidad: 0, series: [], lotes: [] }
        }
        acc[nombre].cantidad += elem.cantidad_lote || 1
        if (elem.serie_codigo) acc[nombre].series.push(elem.serie_codigo)
        if (elem.lote_codigo) acc[nombre].lotes.push(elem.lote_codigo)
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
                                {alquilerElementos.length} elementos
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
                                        elementos={alquilerElementos}
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
                                        <div className="col-span-4">Series/Lotes</div>
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
                                                {data.series.length > 0 && data.series.join(', ')}
                                                {data.lotes.length > 0 && data.lotes.join(', ')}
                                                {data.series.length === 0 && data.lotes.length === 0 && '-'}
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
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default ModalOrdenCargue
