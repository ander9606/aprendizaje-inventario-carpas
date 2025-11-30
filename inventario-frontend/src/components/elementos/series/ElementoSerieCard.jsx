// ============================================
// COMPONENTE: ELEMENTO SERIE CARD
// Card principal para elementos gestionados por serie
// ============================================

import Card from '../../common/Card'
import StatCard from '../../common/StatCard'
import SerieItem from './SerieItem'
import EmptyState from '../../common/EmptyState'
import AlertaBanner from '../../common/AlertaBanner'
import Button from '../../common/Button'
import Spinner from '../../common/Spinner'
import { Plus, Package } from 'lucide-react'
import { useState } from 'react'
import { useGetSeries } from '../../../hooks/Useseries'

/**
 * Componente ElementoSerieCard - Card para elemento con gestión por series
 *
 * @param {object} elemento - Datos del elemento
 * @param {string} elemento.nombre - Nombre del elemento
 * @param {string} elemento.icono - Emoji del elemento
 * @param {array} elemento.series - Array de series (números de serie)
 * @param {object} elemento.estadisticas - Estadísticas del elemento
 * @param {array} elemento.alertas - Alertas del elemento (opcional)
 * @param {function} onEdit - Callback para editar elemento
 * @param {function} onDelete - Callback para eliminar elemento
 * @param {function} onAddSerie - Callback para agregar nueva serie
 * @param {function} onEditSerie - Callback para editar una serie
 * @param {function} onDeleteSerie - Callback para eliminar una serie
 * @param {function} onMoveSerie - Callback para mover serie de ubicación
 *
 * @example
 * <ElementoSerieCard
 *   elemento={{
 *     nombre: "Carpa Doite 4P",
 *     icono: "🏕️",
 *     series: [...],
 *     estadisticas: { total: 10, disponibles: 5, alquilados: 3, mantenimiento: 2 }
 *   }}
 *   onAddSerie={handleAddSerie}
 *   onEditSerie={handleEditSerie}
 * />
 */
export const ElementoSerieCard = ({
  elemento,
  onEdit,
  onDelete,
  onAddSerie,
  onEditSerie,
  onDeleteSerie,
  onMoveSerie,
  disabled = false,
  className = '',
  ...props
}) => {
  const [showAllSeries, setShowAllSeries] = useState(false)

  // ============================================
  // CARGAR SERIES USANDO EL HOOK
  // ============================================
  const {
    series,
    estadisticas,
    total,
    isLoading,
    error
  } = useGetSeries(elemento?.id)

  const {
    nombre,
    icono = '📦',
    alertas = []
  } = elemento

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

  // ============================================
  // SERIES A MOSTRAR (con paginación simple)
  // ============================================
  const ITEMS_PER_PAGE = 5
  const seriesToShow = showAllSeries ? series : series.slice(0, ITEMS_PER_PAGE)
  const hasMoreSeries = series.length > ITEMS_PER_PAGE

  // ============================================
  // RENDERIZADO - Loading
  // ============================================
  if (isLoading) {
    return (
      <Card
        title={nombre}
        subtitle="Cargando..."
        icon={icono}
        variant="outlined"
        className={className}
      >
        <Card.Content>
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </Card.Content>
      </Card>
    )
  }

  // ============================================
  // RENDERIZADO - Error
  // ============================================
  if (error) {
    return (
      <Card
        title={nombre}
        subtitle="Error al cargar"
        icon={icono}
        menuOptions={menuOptions}
        variant="outlined"
        className={className}
      >
        <Card.Content>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 text-sm">
              {error?.message || 'Error desconocido'}
            </p>
          </div>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card
      title={nombre}
      subtitle={`${series.length} ${series.length === 1 ? 'serie' : 'series'}`}
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
            ESTADÍSTICAS
            ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total"
            value={total || 0}
            color="gray"
            size="sm"
          />
          <StatCard
            label="Disponible"
            value={estadisticas.disponible || 0}
            color="green"
            size="sm"
          />
          <StatCard
            label="Alquilado"
            value={estadisticas.alquilado || 0}
            color="blue"
            size="sm"
          />
          <StatCard
            label="Mantenimiento"
            value={estadisticas.mantenimiento || 0}
            color="yellow"
            size="sm"
          />
        </div>

        {/* ============================================
            HEADER: Título de sección + Botón agregar
            ============================================ */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Números de serie
          </h4>

          {onAddSerie && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => onAddSerie(elemento)}
              disabled={disabled}
            >
              Agregar serie
            </Button>
          )}
        </div>

        {/* ============================================
            LISTA DE SERIES
            ============================================ */}
        {series.length === 0 ? (
          <EmptyState
            type="no-data"
            title="Sin series registradas"
            description="Agrega el primer número de serie"
            icon={Package}
            action={onAddSerie && {
              label: 'Agregar serie',
              onClick: () => onAddSerie(elemento),
              icon: <Plus />
            }}
          />
        ) : (
          <>
            <div className="space-y-2">
              {seriesToShow.map((serie) => (
                <SerieItem
                  key={serie.id || serie.numero_serie}
                  serie={serie}
                  onEdit={onEditSerie}
                  onDelete={onDeleteSerie}
                  onMove={onMoveSerie}
                  compact
                />
              ))}
            </div>

            {/* Botón "Ver más" / "Ver menos" */}
            {hasMoreSeries && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllSeries(!showAllSeries)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAllSeries
                    ? 'Ver menos'
                    : `Ver todas (${series.length} series)`
                  }
                </button>
              </div>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  )
}

export default ElementoSerieCard