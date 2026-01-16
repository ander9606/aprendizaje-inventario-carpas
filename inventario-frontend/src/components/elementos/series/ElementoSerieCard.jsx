// ============================================
// COMPONENTE: ELEMENTO SERIE CARD (MEJORADO)
// Card para elementos gestionados por serie
// Ahora carga sus propias series usando useGetSeries
// ============================================

import { useState } from 'react'
import Card from '../../common/Card'
import StatCard from '../../common/StatCard'
import SerieItem from './SerieItem'
import EmptyState from '../../common/EmptyState'
import AlertaBanner from '../../common/AlertaBanner'
import Button from '../../common/Button'
import Spinner from '../../common/Spinner'
import { Plus, Package } from 'lucide-react'

// Hook para cargar series
import { useGetSeries } from '../../../hooks/Useseries'

// Componente de disponibilidad por fecha
import DisponibilidadFechaSelector from '../DisponibilidadFechaSelector'

/**
 * Componente ElementoSerieCard - Card para elemento con gestión por series
 *
 * MEJORA: Ahora carga automáticamente las series del elemento
 * usando el hook useGetSeries, en lugar de esperar que vengan
 * desde el componente padre.
 *
 * @param {object} elemento - Datos básicos del elemento
 * @param {number} elemento.id - ID del elemento (REQUERIDO para cargar series)
 * @param {string} elemento.nombre - Nombre del elemento
 * @param {string} elemento.icono - Emoji del elemento
 * @param {function} onEdit - Callback para editar elemento
 * @param {function} onDelete - Callback para eliminar elemento
 * @param {function} onAddSerie - Callback para agregar nueva serie
 * @param {function} onDevolverBodega - Callback para devolver serie a bodega principal
 * @param {function} onEditSerie - Callback para editar una serie
 * @param {function} onDeleteSerie - Callback para eliminar una serie
 * @param {function} onMoveSerie - Callback para mover serie de ubicación
 */
export const ElementoSerieCard = ({
  elemento,
  onEdit,
  onDelete,
  onAddSerie,
  onDevolverBodega,
  onEditSerie,
  onDeleteSerie,
  onMoveSerie,
  disabled = false,
  className = '',
  ...props
}) => {
  const [showAllSeries, setShowAllSeries] = useState(false)

  // Extraer datos básicos del elemento
  const {
    id: elementoId,
    nombre,
    icono = '📦',
    alertas = []
  } = elemento

  // ============================================
  // CARGAR SERIES DEL ELEMENTO
  // ============================================
  const {
    series,
    estadisticas,
    total,
    disponibles,
    isLoading: isLoadingSeries,
    error: errorSeries
  } = useGetSeries(elementoId, {
    enabled: !!elementoId  // Solo cargar si hay ID
  })

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
  // SERIES A MOSTRAR (con paginación simple)
  // ============================================
  const ITEMS_PER_PAGE = 5
  const seriesToShow = showAllSeries ? series : series.slice(0, ITEMS_PER_PAGE)
  const hasMoreSeries = series.length > ITEMS_PER_PAGE

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <Card
      title={nombre}
      subtitle={isLoadingSeries ? 'Cargando...' : `${total} ${total === 1 ? 'serie' : 'series'}`}
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
            ERROR AL CARGAR SERIES
            ============================================ */}
        {errorSeries && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error al cargar series: {errorSeries.message}
          </div>
        )}

        {/* ============================================
            ESTADÍSTICAS
            ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total"
            value={isLoadingSeries ? '-' : total}
            color="gray"
            size="sm"
          />
          <StatCard
            label="Disponible"
            value={isLoadingSeries ? '-' : disponibles}
            color="green"
            size="sm"
          />
          <StatCard
            label="Alquilado"
            value={isLoadingSeries ? '-' : (estadisticas.alquilado || 0)}
            color="blue"
            size="sm"
          />
          <StatCard
            label="Mantenimiento"
            value={isLoadingSeries ? '-' : (estadisticas.mantenimiento || 0)}
            color="yellow"
            size="sm"
          />
        </div>

        {/* ============================================
            SELECTOR DE DISPONIBILIDAD POR FECHA
            ============================================ */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <DisponibilidadFechaSelector
            elementoId={elementoId}
            requiereSeries={true}
            stockTotal={total}
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
        {isLoadingSeries ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : series.length === 0 ? (
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
                  onDevolverBodega={(serie) => onDevolverBodega && onDevolverBodega(serie, elemento)}
                  onEdit={(serie) => onEditSerie && onEditSerie(serie, elemento)}
                  onDelete={onDeleteSerie}
                  onMove={(serie) => onMoveSerie && onMoveSerie(serie, elemento)}
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