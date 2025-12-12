// ============================================
// COMPONENTE: ELEMENTO LOTE CARD (MEJORADO)
// Card para elementos gestionados por lotes
// Ahora carga sus propios lotes usando useGetLotes
// ============================================

import { useState } from 'react'
import Card from '../../common/Card'
import StatCard from '../../common/StatCard'
import LoteUbicacionGroup from './LoteUbicacionGroup'
import EmptyState from '../../common/EmptyState'
import AlertaBanner from '../../common/AlertaBanner'
import Button from '../../common/Button'
import Spinner from '../../common/Spinner'
import Modal from '../../common/Modal'
import { EstadoBadge } from '../../common/Badge'
import UbicacionBadge from '../../common/UbicacionBadge'
import { Plus, Package, MapPin, ArrowRightLeft, ArrowRight } from 'lucide-react'

// Hook para cargar lotes
import { useGetLotes } from '../../../hooks/Uselotes'

/**
 * Componente ElementoLoteCard - Card para elemento con gestión por lotes
 *
 * MEJORA: Ahora carga automáticamente los lotes del elemento
 * usando el hook useGetLotes, en lugar de esperar que vengan
 * desde el componente padre.
 *
 * @param {object} elemento - Datos básicos del elemento
 * @param {number} elemento.id - ID del elemento (REQUERIDO para cargar lotes)
 * @param {string} elemento.nombre - Nombre del elemento
 * @param {string} elemento.icono - Emoji del elemento
 * @param {function} onEdit - Callback para editar elemento
 * @param {function} onDelete - Callback para eliminar elemento
 * @param {function} onAddLote - Callback para agregar nuevo lote
 * @param {function} onDevolverBodega - Callback para devolver lote a bodega principal
 * @param {function} onMoveLote - Callback para mover lote
 * @param {function} onDeleteLote - Callback para eliminar un lote
 */
export const ElementoLoteCard = ({
  elemento,
  onEdit,
  onDelete,
  onAddLote,
  onDevolverBodega,
  onMoveLote,
  onDeleteLote,
  className = '',
  disabled = false,
  ...props
}) => {
  // Extraer datos básicos del elemento
  const {
    id: elementoId,
    nombre,
    icono = '📦',
    alertas = []
  } = elemento

  // ============================================
  // ESTADO LOCAL
  // ============================================
  const [mostrarSelectorLotes, setMostrarSelectorLotes] = useState(false)

  // ============================================
  // CARGAR LOTES DEL ELEMENTO
  // ============================================
  const {
    lotes,
    estadisticas,
    //lotes_por_ubicacion,
    cantidad_total,
    cantidad_disponible,
    isLoading: isLoadingLotes,
    error: errorLotes
  } = useGetLotes(elementoId)

  // ============================================
  // TRANSFORMAR LOTES A FORMATO DE UBICACIONES
  // ============================================
  // Las cards esperan un array de ubicaciones con sus lotes agrupados
  const ubicaciones = transformarLotesAUbicaciones(lotes)

  // ============================================
  // OPCIONES DEL MENÚ DEL CARD
  // ============================================
  const menuOptions = [
    {
      label: 'Editar elemento',
      onClick: () => onEdit && onEdit(elemento),
      disabled: disabled
    },
    {
      label: 'Eliminar elemento',
      onClick: () => onDelete && onDelete(elemento),
      danger: true,
      disabled: disabled
    }
  ].filter(option => option.onClick)

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <Card
      title={nombre}
      subtitle={
        isLoadingLotes 
          ? 'Cargando...' 
          : `${cantidad_total} unidades en ${ubicaciones.length} ${ubicaciones.length === 1 ? 'ubicación' : 'ubicaciones'}`
      }
      icon={icono}
      menuOptions={menuOptions}
      variant="outlined"
      className={className}
      {...props}
    >
      <Card.Content>
        {/* ============================================
            ALERTAS (si existen)
            ============================================ */}
        {alertas.length > 0 && (
          <div className="space-y-2 mb-4">
            {alertas.map((alerta, idx) => (
              <AlertaBanner
                key={idx}
                tipo={alerta.tipo}
                mensaje={alerta.mensaje}
                detalles={alerta.detalles}
                dismissible
              />
            ))}
          </div>
        )}

        {/* ============================================
            ERROR AL CARGAR LOTES
            ============================================ */}
        {errorLotes && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error al cargar lotes: {errorLotes.message}
          </div>
        )}

        {/* ============================================
            ESTADÍSTICAS POR ESTADO
            ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <StatCard
            label="Total"
            value={isLoadingLotes ? '-' : cantidad_total}
            color="gray"
            size="sm"
          />
          <StatCard
            label="Nuevo"
            value={isLoadingLotes ? '-' : (estadisticas.nuevo || 0)}
            color="purple"
            size="sm"
          />
          <StatCard
            label="Bueno"
            value={isLoadingLotes ? '-' : (estadisticas.bueno || 0)}
            color="green"
            size="sm"
          />
          <StatCard
            label="Alquilado"
            value={isLoadingLotes ? '-' : (estadisticas.alquilado || 0)}
            color="blue"
            size="sm"
          />
          <StatCard
            label="Mantenimiento"
            value={isLoadingLotes ? '-' : (estadisticas.mantenimiento || 0)}
            color="yellow"
            size="sm"
          />
          <StatCard
            label="Dañado"
            value={isLoadingLotes ? '-' : (estadisticas.malo || estadisticas.dañado || estadisticas.danado || 0)}
            color="red"
            size="sm"
          />
        </div>

        {/* ============================================
            HEADER: Título de sección + Botones de acción
            ============================================ */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Por ubicación
          </h4>

          <div className="flex items-center gap-2">
            {/* Botón: Mover entre lotes */}
            {onMoveLote && lotes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowRightLeft className="w-4 h-4" />}
                onClick={() => setMostrarSelectorLotes(true)}
                disabled={disabled}
                title="Mover cantidad entre ubicaciones/estados"
              >
                Mover lotes
              </Button>
            )}

            {/* Botón: Agregar inventario nuevo */}
            {onAddLote && (
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => onAddLote(elemento)}
                disabled={disabled}
                title="Agregar inventario nuevo (compras, donaciones)"
              >
                Agregar inventario
              </Button>
            )}
          </div>
        </div>

        {/* ============================================
            GRUPOS POR UBICACIÓN
            ============================================ */}
        {isLoadingLotes ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : ubicaciones.length === 0 ? (
          <EmptyState
            type="no-data"
            title="Sin lotes registrados"
            description="Agrega inventario nuevo mediante compras, donaciones o stock inicial"
            icon={Package}
            action={onAddLote && {
              label: 'Agregar inventario',
              onClick: () => onAddLote(elemento),
              icon: <Plus />
            }}
          />
        ) : (
          <div className="space-y-3">
            {ubicaciones.map((ubicacion, idx) => (
              <LoteUbicacionGroup
                key={ubicacion.nombre || idx}
                ubicacion={ubicacion}
                onDevolverBodega={(lote, ubicacion) => onDevolverBodega && onDevolverBodega(lote, ubicacion, elemento)}
                onMoveLote={(lote, ubicacion) => onMoveLote && onMoveLote(lote, ubicacion, elemento)}
                onDeleteLote={onDeleteLote}
              />
            ))}

            {/* Ayuda: Cómo mover entre lotes */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>
                  <strong>Dos formas de mover:</strong> Usa el botón "Mover lotes" arriba para acceso rápido, o expande una ubicación y usa el menú ⋮ de cada lote
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ============================================
            INFORMACIÓN ADICIONAL
            ============================================ */}
        {!isLoadingLotes && ubicaciones.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Total de ubicaciones:</span>
              <span className="font-semibold text-slate-900">
                {ubicaciones.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 mt-1">
              <span>Cantidad total:</span>
              <span className="font-semibold text-slate-900">
                {cantidad_total} {cantidad_total === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 mt-1">
              <span>Disponible para alquilar:</span>
              <span className="font-semibold text-green-600">
                {cantidad_disponible} {cantidad_disponible === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>
          </div>
        )}
      </Card.Content>

      {/* ============================================
          MODAL: SELECTOR DE LOTES PARA MOVER
          ============================================ */}
      {mostrarSelectorLotes && (
        <Modal
          isOpen={mostrarSelectorLotes}
          onClose={() => setMostrarSelectorLotes(false)}
          title="Selecciona el lote que deseas mover"
          size="md"
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {lotes.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No hay lotes disponibles para mover
              </p>
            ) : (
              lotes.map((lote) => (
                <button
                  key={lote.id}
                  onClick={() => {
                    onMoveLote(lote, lote.ubicacion)
                    setMostrarSelectorLotes(false)
                  }}
                  className="w-full p-4 bg-white border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Ubicación y Estado */}
                    <div className="flex items-center gap-3 flex-1">
                      <UbicacionBadge ubicacion={lote.ubicacion || 'Sin ubicación'} />
                      <EstadoBadge estado={lote.estado} />
                    </div>

                    {/* Cantidad */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                          {lote.cantidad}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lote.cantidad === 1 ? 'unidad' : 'unidades'}
                        </div>
                      </div>

                      {/* Icono */}
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>

                  {/* Número de lote */}
                  {lote.lote_numero && (
                    <div className="mt-2 text-xs text-slate-500">
                      Lote: {lote.lote_numero}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={() => setMostrarSelectorLotes(false)}
            >
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Card>
  )
}

/**
 * Función auxiliar: Transformar array de lotes a array de ubicaciones
 * 
 * ENTRADA (lotes del backend):
 * [
 *   { id: 1, cantidad: 50, estado: "nuevo", ubicacion: "Bodega A" },
 *   { id: 2, cantidad: 30, estado: "bueno", ubicacion: "Bodega A" },
 *   { id: 3, cantidad: 20, estado: "bueno", ubicacion: "Bodega B" }
 * ]
 * 
 * SALIDA (formato para LoteUbicacionGroup):
 * [
 *   {
 *     nombre: "Bodega A",
 *     cantidad_total: 80,
 *     lotes: [
 *       { id: 1, cantidad: 50, estado: "nuevo" },
 *       { id: 2, cantidad: 30, estado: "bueno" }
 *     ]
 *   },
 *   {
 *     nombre: "Bodega B",
 *     cantidad_total: 20,
 *     lotes: [
 *       { id: 3, cantidad: 20, estado: "bueno" }
 *     ]
 *   }
 * ]
 */
function transformarLotesAUbicaciones(lotes) {
  if (!Array.isArray(lotes) || lotes.length === 0) {
    return []
  }

  // Agrupar lotes por ubicación
  const ubicacionesMap = lotes.reduce((acc, lote) => {
    const nombreUbicacion = lote.ubicacion || 'Sin ubicación'
    
    if (!acc[nombreUbicacion]) {
      acc[nombreUbicacion] = {
        nombre: nombreUbicacion,
        cantidad_total: 0,
        lotes: []
      }
    }
    
    acc[nombreUbicacion].cantidad_total += (lote.cantidad || 0)
    acc[nombreUbicacion].lotes.push(lote)
    
    return acc
  }, {})

  // Convertir a array y ordenar por nombre
  return Object.values(ubicacionesMap).sort((a, b) => {
    // "Sin ubicación" siempre al final
    if (a.nombre === 'Sin ubicación') return 1
    if (b.nombre === 'Sin ubicación') return -1
    return a.nombre.localeCompare(b.nombre)
  })
}

export default ElementoLoteCard