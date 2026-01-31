// ============================================
// COMPONENTE: DisponibilidadModal
// Modal para verificar disponibilidad de productos
// ============================================

import { X, Package, Calendar } from 'lucide-react'
import VerificacionDisponibilidad from './VerificacionDisponibilidad'
import Button from '../common/Button'

const DisponibilidadModal = ({
  isOpen,
  onClose,
  productos = [],
  fechaMontaje,
  fechaDesmontaje,
  productosInfo = []
}) => {
  if (!isOpen) return null

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const fechaStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha
    const fechaObj = new Date(fechaStr + 'T12:00:00')
    if (isNaN(fechaObj.getTime())) return '-'
    return fechaObj.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  // Obtener nombres de productos para mostrar
  const productosConNombre = productos.map(p => {
    const info = productosInfo.find(pi => pi.id === parseInt(p.compuesto_id))
    return {
      ...p,
      nombre: info?.nombre || `Producto #${p.compuesto_id}`
    }
  }).filter(p => p.compuesto_id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Verificar Disponibilidad
              </h2>
              <p className="text-sm text-slate-500">
                Comprueba si hay stock suficiente para la cotización
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Resumen de fechas */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Período de alquiler</span>
            </div>
            <p className="text-slate-800">
              {formatFecha(fechaMontaje)} → {formatFecha(fechaDesmontaje || fechaMontaje)}
            </p>
          </div>

          {/* Lista de productos a verificar */}
          {productosConNombre.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Productos a verificar ({productosConNombre.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {productosConNombre.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-700"
                  >
                    {p.nombre} <span className="text-slate-400">x{p.cantidad}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Componente de verificación */}
          <VerificacionDisponibilidad
            productos={productos}
            fechaMontaje={fechaMontaje}
            fechaDesmontaje={fechaDesmontaje}
            mostrar={true}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DisponibilidadModal
