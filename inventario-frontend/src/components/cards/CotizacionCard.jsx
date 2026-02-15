// ============================================
// COMPONENTE: CotizacionCard
// Muestra una tarjeta de cotización
// ============================================

import { useState, useRef, useEffect } from 'react'
import { Calendar, User, MapPin, Package, Eye, CheckCircle, MoreVertical, Edit, XCircle, Trash2 } from 'lucide-react'
import Card from '../common/Card'
import Button from '../common/Button'

/**
 * CotizacionCard
 *
 * Tarjeta que muestra una cotización con:
 * - Estado (pendiente, aprobada, rechazada, vencida)
 * - Cliente
 * - Fechas del evento
 * - Total
 * - Acciones: Ver, Aprobar (pendiente), Menu kebab
 */
const CotizacionCard = ({
  cotizacion,
  onVerDetalle,
  onEditar,
  onAprobar,
  onRechazar,
  onEliminar,
  isAprobando = false
}) => {

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Cerrar menu al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ============================================
  // HELPERS
  // ============================================

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  const getEstadoStyle = (estado) => {
    const estilos = {
      borrador: 'bg-amber-100 text-amber-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
      vencida: 'bg-gray-100 text-gray-800'
    }
    return estilos[estado] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoNombre = (estado) => {
    const nombres = {
      borrador: 'Borrador',
      pendiente: 'Pendiente',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
      vencida: 'Vencida'
    }
    return nombres[estado] || estado
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleVerDetalle = (e) => {
    e.stopPropagation()
    if (onVerDetalle) onVerDetalle(cotizacion)
  }

  const handleAprobar = (e) => {
    e.stopPropagation()
    if (onAprobar) onAprobar(cotizacion)
  }

  const handleEditar = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (onEditar) onEditar(cotizacion)
  }

  const handleRechazar = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (confirm('¿Rechazar esta cotización?')) {
      if (onRechazar) onRechazar(cotizacion)
    }
  }

  const handleEliminar = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) {
      if (onEliminar) onEliminar(cotizacion)
    }
  }

  const toggleMenu = (e) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  // Determinar si mostrar menu kebab
  // Mostrar menú para pendiente, rechazada y aprobada (solo para pruebas)
  const mostrarMenu = ['borrador', 'pendiente', 'rechazada', 'aprobada'].includes(cotizacion.estado)

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card
      variant="outlined"
      className="hover:shadow-lg transition-all duration-200"
    >
      {/* HEADER */}
      <Card.Header>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* ID y Estado */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-slate-500">
                #{cotizacion.id}
              </span>
              <span className={`
                inline-block px-2 py-1 text-xs font-medium rounded-full
                ${getEstadoStyle(cotizacion.estado)}
              `}>
                {getEstadoNombre(cotizacion.estado)}
              </span>
            </div>

            {/* Evento */}
            <Card.Title className="truncate">
              {cotizacion.evento_nombre || 'Sin nombre'}
            </Card.Title>
          </div>

          {/* Total y Menu */}
          <div className="flex items-start gap-2">
            <div className="text-right">
              <p className="text-xs text-slate-500">
                {cotizacion.estado === 'borrador' ? 'Estimado' : 'Total'}
              </p>
              <p className="text-lg font-bold text-slate-900">
                {formatearMoneda(cotizacion.total)}
              </p>
            </div>

            {/* Menu Kebab */}
            {mostrarMenu && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={toggleMenu}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-slate-500" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                    {['pendiente', 'borrador'].includes(cotizacion.estado) && (
                      <>
                        <button
                          onClick={handleEditar}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        {cotizacion.estado === 'pendiente' && (
                          <button
                            onClick={handleRechazar}
                            className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        )}
                        <div className="border-t border-slate-100 my-1" />
                      </>
                    )}
                    <button
                      onClick={handleEliminar}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card.Header>

      {/* CONTENT */}
      <Card.Content>
        <div className="space-y-2 text-sm text-slate-600">
          {/* Cliente */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{cotizacion.cliente_nombre || 'Sin cliente'}</span>
          </div>

          {/* Fechas */}
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {cotizacion.fecha_evento ? (
              <div className="text-xs space-y-0.5">
                {cotizacion.fecha_montaje && (
                  <p><span className="text-slate-500">Montaje:</span> {formatearFecha(cotizacion.fecha_montaje)}</p>
                )}
                <p><span className="text-slate-500">Evento:</span> {formatearFecha(cotizacion.fecha_evento)}</p>
                {cotizacion.fecha_desmontaje && (
                  <p><span className="text-slate-500">Desmontaje:</span> {formatearFecha(cotizacion.fecha_desmontaje)}</p>
                )}
              </div>
            ) : (
              <span className="text-xs text-amber-600 italic">Fecha por confirmar</span>
            )}
          </div>

          {/* Ciudad */}
          {cotizacion.evento_ciudad && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{cotizacion.evento_ciudad}</span>
            </div>
          )}

          {/* Productos */}
          {cotizacion.total_productos > 0 && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 flex-shrink-0" />
              <span>{cotizacion.total_productos} producto{cotizacion.total_productos !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </Card.Content>

      {/* FOOTER */}
      <Card.Footer>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<Eye className="w-4 h-4" />}
            onClick={handleVerDetalle}
          >
            Ver
          </Button>
          {cotizacion.estado === 'pendiente' && (
            <Button
              variant="success"
              size="sm"
              className="flex-1"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={handleAprobar}
              loading={isAprobando}
              disabled={isAprobando}
            >
              Aprobar
            </Button>
          )}
        </div>
      </Card.Footer>
    </Card>
  )
}

export default CotizacionCard
