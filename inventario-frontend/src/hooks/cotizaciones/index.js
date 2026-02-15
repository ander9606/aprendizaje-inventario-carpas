// ============================================
// HOOKS DE COTIZACIONES
// Re-exporta todos los hooks para uso externo
// ============================================

// Queries de listado
export {
  useGetCotizaciones,
  useGetCotizacionesPorEstado,
  useGetCotizacion
} from './useGetCotizaciones'

// Query completa (para vista PDF/detalle)
export {
  useGetCotizacionCompleta,
  useVerificarDisponibilidad
} from './useGetCotizacionCompleta'

// Mutations (crear, actualizar, eliminar, etc.)
export {
  useCreateCotizacion,
  useUpdateCotizacion,
  useAprobarCotizacion,
  useCambiarEstadoCotizacion,
  useConfirmarFechasCotizacion,
  useDuplicarCotizacion,
  useDeleteCotizacion,
  useRegistrarSeguimiento
} from './useCotizacionMutations'
