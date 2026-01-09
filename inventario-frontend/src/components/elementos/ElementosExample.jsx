// ============================================
// EJEMPLO: Integración de Hooks con Componentes UI
// Uso de ElementoSerieCard con hooks reales
// ============================================

import { useState } from 'react'
import ElementoSerieCard from '../elementos/series/ElementoSerieCard'
import { useGetSeries } from '../../hooks/Useseries'
import Spinner from '../common/Spinner'

/**
 * Componente de ejemplo que muestra cómo integrar:
 * - Hook useGetSeries (hook real existente)
 * - ElementoSerieCard (componente UI recién creado)
 *
 * @example
 * <ElementoSerieCardExample elementoId={1} />
 */
export const ElementoSerieCardExample = ({ elementoId }) => {
  // ============================================
  // 1. USAR EL HOOK PARA OBTENER DATOS
  // ============================================
  const {
    series,
    elemento,
    estadisticas,
    total,
    isLoading,
    error
  } = useGetSeries(elementoId)

  // ============================================
  // 2. ESTADOS LOCALES (si necesitas)
  // ============================================
  const [alertas] = useState([])

  // ============================================
  // 3. HANDLERS PARA LAS ACCIONES
  // ============================================
  const handleAddSerie = (elemento) => {
    console.log('Agregar nueva serie a:', elemento)
    // Aquí abrirías un modal o navegarías a un formulario
    // Por ejemplo: setShowModal(true)
  }

  const handleEditSerie = (serie) => {
    console.log('Editar serie:', serie)
    // Aquí abrirías el modal de edición
  }

  const handleDeleteSerie = (serie) => {
    console.log('Eliminar serie:', serie)
    // Aquí mostrarías confirmación y llamarías a la mutation
  }

  const handleMoveSerie = (serie) => {
    console.log('Mover serie a otra ubicación:', serie)
    // Aquí abrirías modal para cambiar ubicación
  }

  const handleEditElemento = (elemento) => {
    console.log('Editar elemento:', elemento)
  }

  const handleDeleteElemento = (elemento) => {
    console.log('Eliminar elemento:', elemento)
  }

  // ============================================
  // 4. ESTADOS DE CARGA Y ERROR
  // ============================================
  if (isLoading) {
    return <Spinner />
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error al cargar las series</p>
      </div>
    )
  }

  // ============================================
  // 5. TRANSFORMAR DATOS PARA EL COMPONENTE UI
  // ============================================
  // El hook useGetSeries ya devuelve los datos en el formato correcto,
  // pero podemos transformarlos si es necesario

  const elementoData = {
    nombre: elemento?.nombre || 'Sin nombre',
    icono: elemento?.icono || '📦',
    series: series || [],
    estadisticas: {
      total: total || 0,
      disponible: estadisticas?.disponible || 0,
      alquilado: estadisticas?.alquilado || 0,
      mantenimiento: estadisticas?.mantenimiento || 0,
      nuevo: estadisticas?.nuevo || 0,
      danado: estadisticas?.danado || 0
    },
    alertas: alertas
  }

  // ============================================
  // 6. RENDERIZAR COMPONENTE UI
  // ============================================
  return (
    <ElementoSerieCard
      elemento={elementoData}
      onEdit={handleEditElemento}
      onDelete={handleDeleteElemento}
      onAddSerie={handleAddSerie}
      onEditSerie={handleEditSerie}
      onDeleteSerie={handleDeleteSerie}
      onMoveSerie={handleMoveSerie}
    />
  )
}

// ============================================
// EJEMPLO 2: Integración con ElementoLoteCard
// ============================================

import ElementoLoteCard from '../elementos/lotes/ElementoLoteCard'
import { useGetLotes } from '../../hooks/Uselotes'

export const ElementoLoteCardExample = ({ elementoId }) => {
  // 1. USAR EL HOOK
  const {
    elemento,
    estadisticas,
    lotes_por_ubicacion,
    cantidad_total,
    isLoading,
    error
  } = useGetLotes(elementoId)

  // 2. HANDLERS
  const handleAddLote = (elemento) => {
    console.log('Agregar nuevo lote a:', elemento)
  }

  const handleEditLote = (lote, ubicacion) => {
    console.log('Editar lote:', lote, 'en ubicación:', ubicacion)
  }

  const handleMoveLote = (lote, ubicacion) => {
    console.log('Mover cantidad del lote:', lote, 'desde:', ubicacion)
  }

  const handleDeleteLote = (lote, ubicacion) => {
    console.log('Eliminar lote:', lote, 'de ubicación:', ubicacion)
  }

  // 3. ESTADOS DE CARGA
  if (isLoading) return <Spinner />
  if (error) return <div>Error al cargar lotes</div>

  // 4. TRANSFORMAR DATOS
  // El hook useGetLotes ya agrupa por ubicación en lotes_por_ubicacion
  // que tiene la estructura perfecta para nuestro componente

  const elementoData = {
    nombre: elemento?.nombre || 'Sin nombre',
    icono: elemento?.icono || '📦',
    ubicaciones: lotes_por_ubicacion || [],
    estadisticas: {
      total: cantidad_total || 0,
      nuevo: estadisticas?.nuevo || 0,
      bueno: estadisticas?.bueno || 0,
      mantenimiento: estadisticas?.mantenimiento || 0,
      danado: estadisticas?.danado || 0,
      alquilado: estadisticas?.alquilado || 0
    },
    alertas: []
  }

  // 5. RENDERIZAR
  return (
    <ElementoLoteCard
      elemento={elementoData}
      onEdit={(elemento) => console.log('Editar elemento:', elemento)}
      onDelete={(elemento) => console.log('Eliminar elemento:', elemento)}
      onAddLote={handleAddLote}
      onEditLote={handleEditLote}
      onMoveLote={handleMoveLote}
      onDeleteLote={handleDeleteLote}
    />
  )
}

// ============================================
// 🎓 NOTAS IMPORTANTES
// ============================================
/**
 * 1. FLUJO DE DATOS:
 * ─────────────────
 * Hook (useGetSeries/useGetLotes)
 *   ↓
 * Datos transformados
 *   ↓
 * Componente UI (ElementoSerieCard/ElementoLoteCard)
 *
 *
 * 2. TRANSFORMACIÓN DE DATOS:
 * ──────────────────────────
 * Los hooks ya devuelven los datos en un formato muy cercano
 * al que necesitan los componentes UI. Solo necesitas mapear
 * algunos campos si los nombres no coinciden exactamente.
 *
 *
 * 3. HANDLERS:
 * ───────────
 * Los handlers son funciones que se pasan a los componentes UI
 * para manejar las acciones del usuario (agregar, editar, eliminar).
 * Aquí es donde integrarías modales, confirmaciones, y mutations.
 *
 *
 * 4. PRÓXIMOS PASOS:
 * ─────────────────
 * - Implementar los modales para agregar/editar series/lotes
 * - Agregar confirmaciones para eliminar
 * - Integrar mutations (useCreateSerie, useDeleteSerie, etc.)
 * - Agregar manejo de errores más robusto
 */

export default {
  ElementoSerieCardExample,
  ElementoLoteCardExample
}
