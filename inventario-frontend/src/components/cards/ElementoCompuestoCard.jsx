// ============================================
// COMPONENTE: ElementoCompuestoCard
// Tarjeta para mostrar plantillas de productos compuestos
// ============================================

import { Package, DollarSign, Eye, Edit, Trash2 } from 'lucide-react'

/**
 * ElementoCompuestoCard
 *
 * Tarjeta que muestra información resumida de una plantilla de producto compuesto.
 * Se usa en el nivel 3 de navegación (dentro de una subcategoría).
 *
 * @param {Object} elemento - Datos del elemento compuesto
 * @param {Function} onVer - Callback para ver detalle
 * @param {Function} onEditar - Callback para editar
 * @param {Function} onEliminar - Callback para eliminar
 * @param {Function} formatPrecio - Función para formatear precios
 */
function ElementoCompuestoCard({
  elemento,
  onVer,
  onEditar,
  onEliminar,
  formatPrecio,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-slate-900">{elemento.nombre}</h3>
          {elemento.codigo && (
            <span className="text-sm text-slate-500">
              Código: {elemento.codigo}
            </span>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            elemento.activo !== false
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {elemento.activo !== false ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4" />
          <span>{elemento.total_componentes || 0} componentes</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <DollarSign className="w-4 h-4" />
          <span>Base: {formatPrecio(elemento.precio_base)}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={onVer}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Ver detalle"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onEditar}
          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onEliminar}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ElementoCompuestoCard
