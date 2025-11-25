// ============================================
// COMPONENTE: ELEMENTO LOTE CARD
// Card principal para elementos gestionados por lotes
// ============================================

import Card from '../../common/Card'
import StatCard from '../../common/StatCard'
import LoteUbicacionGroup from './LoteUbicacionGroup'
import EmptyState from '../../common/EmptyState'
import AlertaBanner from '../../common/AlertaBanner'
import Button from '../../common/Button'
import { Plus, Package, MapPin } from 'lucide-react'

/**
 * Componente ElementoLoteCard - Card para elemento con gestión por lotes
 *
 * @param {object} elemento - Datos del elemento
 * @param {string} elemento.nombre - Nombre del elemento
 * @param {string} elemento.icono - Emoji del elemento
 * @param {array} elemento.ubicaciones - Array de ubicaciones con sus lotes
 * @param {object} elemento.estadisticas - Estadísticas del elemento
 * @param {array} elemento.alertas - Alertas del elemento (opcional)
 * @param {function} onEdit - Callback para editar elemento
 * @param {function} onDelete - Callback para eliminar elemento
 * @param {function} onAddLote - Callback para agregar nuevo lote
 * @param {function} onEditLote - Callback para editar un lote
 * @param {function} onMoveLote - Callback para mover lote
 * @param {function} onDeleteLote - Callback para eliminar un lote
 *
 * @example
 * <ElementoLoteCard
 *   elemento={{
 *     nombre: "Estaca 20cm",
 *     icono: "📌",
 *     ubicaciones: [
 *       {
 *         nombre: "Bodega A",
 *         cantidad_total: 50,
 *         lotes: [
 *           { estado: "nuevo", cantidad: 20 },
 *           { estado: "bueno", cantidad: 30 }
 *         ]
 *       }
 *     ],
 *     estadisticas: { total: 150, nuevo: 50, bueno: 80, danado: 20 }
 *   }}
 *   onAddLote={handleAddLote}
 *   onEditLote={handleEditLote}
 * />
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
  ...props
}) => {
  const {
    nombre,
    icono = '📦',
    ubicaciones = [],
    estadisticas = {},
    alertas = []
  } = elemento

  // ============================================
  // CALCULAR CANTIDAD TOTAL DE UBICACIONES
  // ============================================
  const totalUbicaciones = ubicaciones.length
  const cantidadTotal = ubicaciones.reduce(
    (sum, ub) => sum + (ub.cantidad_total || 0),
    0
  )

  // ============================================
  // OPCIONES DEL MENÚ DEL CARD
  // ============================================
  const menuOptions = [
    {
      label: 'Editar elemento',
      onClick: () => onEdit && onEdit(elemento)
    },
    {
      label: 'Eliminar elemento',
      onClick: () => onDelete && onDelete(elemento),
      danger: true
    }
  ].filter(option => option.onClick)

  return (
    <Card
      title={nombre}
      subtitle={`${cantidadTotal} unidades en ${totalUbicaciones} ${totalUbicaciones === 1 ? 'ubicación' : 'ubicaciones'}`}
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
            ESTADÍSTICAS POR ESTADO
            ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <StatCard
            label="Total"
            value={estadisticas.total || 0}
            color="gray"
            size="sm"
          />
          <StatCard
            label="Nuevo"
            value={estadisticas.nuevo || 0}
            color="purple"
            size="sm"
          />
          <StatCard
            label="Bueno"
            value={estadisticas.bueno || 0}
            color="green"
            size="sm"
          />
          <StatCard
            label="Mantenimiento"
            value={estadisticas.mantenimiento || 0}
            color="yellow"
            size="sm"
          />
          <StatCard
            label="Dañado"
            value={estadisticas.danado || 0}
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
            >
              Agregar lote
            </Button>
          )}
        </div>

        {/* ============================================
            GRUPOS POR UBICACIÓN
            ============================================ */}
        {ubicaciones.length === 0 ? (
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
                key={ubicacion.id || idx}
                ubicacion={ubicacion}
                onEditLote={onEditLote}
                onMoveLote={onMoveLote}
                onDeleteLote={onDeleteLote}
              />
            ))}
          </div>
        )}

        {/* ============================================
            INFORMACIÓN ADICIONAL (opcional)
            ============================================ */}
        {ubicaciones.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Total de ubicaciones:</span>
              <span className="font-semibold text-slate-900">
                {totalUbicaciones}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 mt-1">
              <span>Cantidad total:</span>
              <span className="font-semibold text-slate-900">
                {cantidadTotal} {cantidadTotal === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  )
}

export default ElementoLoteCard
