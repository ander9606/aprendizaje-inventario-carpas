// ============================================
// COMPONENTE: ELEMENTO LOTE CARD (MEJORADO)
// Card para elementos gestionados por lotes
// Ahora carga sus propios lotes usando useGetLotes
// ============================================

import Card from '../../common/Card'
import StatCard from '../../common/StatCard'
import LoteUbicacionGroup from './LoteUbicacionGroup'
import EmptyState from '../../common/EmptyState'
import AlertaBanner from '../../common/AlertaBanner'
import Button from '../../common/Button'
import Spinner from '../../common/Spinner'
import { Plus, Package, MapPin } from 'lucide-react'

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
 * @param {function} onEditLote - Callback para editar un lote
 * @param {function} onMoveLote - Callback para mover lote
 * @param {function} onDeleteLote - Callback para eliminar un lote
 */
export const ElementoLoteCard = ({
  elemento,
  onEdit,
  onDelete,
  onAddLote,
  onEditLote,
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
            label="Mantenimiento"
            value={isLoadingLotes ? '-' : (estadisticas.mantenimiento || 0)}
            color="yellow"
            size="sm"
          />
          <StatCard
            label="Dañado"
            value={isLoadingLotes ? '-' : (estadisticas.malo || estadisticas.dañado || 0)}
            color="red"
            size="sm"
          />
        </div>

        {/* ============================================
            HEADER: Título de sección + Botón agregar
            ============================================ */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Por ubicación
          </h4>

          {onAddLote && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => onAddLote(elemento)}
              disabled={disabled}
            >
              Agregar lote
            </Button>
          )}
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
            description="Agrega el primer lote en una ubicación"
            icon={Package}
            action={onAddLote && {
              label: 'Agregar lote',
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
                onEditLote={onEditLote}
                onMoveLote={onMoveLote}
                onDeleteLote={onDeleteLote}
              />
            ))}
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