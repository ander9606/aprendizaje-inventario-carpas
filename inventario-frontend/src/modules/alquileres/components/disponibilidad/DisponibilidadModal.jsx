// ============================================
// COMPONENTE: DisponibilidadModal
// Modal para verificar disponibilidad de productos
// ============================================

import { Package, Calendar } from 'lucide-react'
import VerificacionDisponibilidad from './VerificacionDisponibilidad'
import Button from '@shared/components/Button'
import Modal from '@shared/components/Modal'
import { useTranslation } from 'react-i18next'

const DisponibilidadModal = ({
  isOpen,
  onClose,
  productos = [],
  fechaMontaje,
  fechaDesmontaje,
  productosInfo = []
}) => {
  const { t } = useTranslation()
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
    <Modal isOpen={isOpen} onClose={onClose} title={t("rentals.checkAvailability")} size="lg">
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

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default DisponibilidadModal
