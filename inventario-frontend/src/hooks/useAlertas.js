// ============================================
// HOOK: useAlertas
// Gestión de alertas de alquileres
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAlertas,
  getAlertasCriticas,
  getResumenAlertas,
  ignorarAlerta
} from '../api/apiAlertas'

// Query keys
const ALERTAS_KEY = 'alertas-alquileres'
const ALERTAS_CRITICAS_KEY = 'alertas-criticas'
const ALERTAS_RESUMEN_KEY = 'alertas-resumen'

/**
 * Hook para obtener todas las alertas
 * @param {Object} opciones - Opciones de la query
 * @param {boolean} opciones.solo_criticas - Si true, solo retorna críticas
 * @param {boolean} opciones.enabled - Si false, no hace la petición
 * @param {number} opciones.refetchInterval - Intervalo de refresco en ms (default: 60000)
 */
export const useAlertas = (opciones = {}) => {
  const { solo_criticas = false, enabled = true, refetchInterval = 60000 } = opciones

  return useQuery({
    queryKey: [ALERTAS_KEY, { solo_criticas }],
    queryFn: () => getAlertas({ solo_criticas }),
    enabled,
    refetchInterval, // Refrescar cada minuto por defecto
    staleTime: 30000, // Considerar stale después de 30 segundos
    select: (data) => data.data || []
  })
}

// Alias para compatibilidad con imports existentes
export const useGetAlertas = useAlertas

/**
 * Hook para obtener alertas pendientes con límite
 * @param {Object} opciones - Opciones de la query
 * @param {number} opciones.limit - Cantidad máxima de alertas
 */
export const useGetAlertasPendientes = (opciones = {}) => {
  const { limit, enabled = true, refetchInterval = 60000 } = opciones

  const query = useQuery({
    queryKey: [ALERTAS_KEY, 'pendientes', { limit }],
    queryFn: () => getAlertas({ limit }),
    enabled,
    refetchInterval,
    staleTime: 30000,
    select: (data) => {
      const alertas = data.data || []
      return limit ? alertas.slice(0, limit) : alertas
    }
  })

  return {
    alertas: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  }
}

/**
 * Hook para obtener solo alertas críticas
 */
export const useAlertasCriticas = (opciones = {}) => {
  const { enabled = true, refetchInterval = 60000 } = opciones

  return useQuery({
    queryKey: [ALERTAS_CRITICAS_KEY],
    queryFn: getAlertasCriticas,
    enabled,
    refetchInterval,
    staleTime: 30000,
    select: (data) => data.data || []
  })
}

/**
 * Hook para obtener el resumen de alertas (conteos)
 */
export const useResumenAlertas = (opciones = {}) => {
  const { enabled = true, refetchInterval = 60000 } = opciones

  return useQuery({
    queryKey: [ALERTAS_RESUMEN_KEY],
    queryFn: getResumenAlertas,
    enabled,
    refetchInterval,
    staleTime: 30000,
    select: (data) => data.data || { total: 0, criticas: 0, advertencias: 0, por_tipo: {} }
  })
}

/**
 * Hook para obtener el resumen de alertas (alias para compatibilidad)
 */
export const useGetResumenAlertas = (opciones = {}) => {
  const query = useResumenAlertas(opciones)

  return {
    resumen: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  }
}

/**
 * Hook para obtener conteo de alertas
 */
export const useAlertasCount = (opciones = {}) => {
  const query = useResumenAlertas(opciones)

  return {
    count: query.data?.total || 0,
    criticas: query.data?.criticas || 0,
    advertencias: query.data?.advertencias || 0,
    isLoading: query.isLoading,
    refetch: query.refetch
  }
}

/**
 * Hook para ignorar una alerta
 */
export const useIgnorarAlerta = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tipo, referencia_id, dias }) => ignorarAlerta(tipo, referencia_id, dias),
    onSuccess: () => {
      // Invalidar todas las queries de alertas
      queryClient.invalidateQueries({ queryKey: [ALERTAS_KEY] })
      queryClient.invalidateQueries({ queryKey: [ALERTAS_CRITICAS_KEY] })
      queryClient.invalidateQueries({ queryKey: [ALERTAS_RESUMEN_KEY] })
    }
  })
}

// Alias para compatibilidad (resolver = ignorar)
export const useResolverAlerta = useIgnorarAlerta

/**
 * Hook combinado que retorna alertas y métodos útiles
 */
export const useAlertasManager = (opciones = {}) => {
  const alertasQuery = useAlertas(opciones)
  const resumenQuery = useResumenAlertas(opciones)
  const ignorarMutation = useIgnorarAlerta()

  // Separar alertas por severidad
  const alertas = alertasQuery.data || []
  const criticas = alertas.filter(a => a.severidad === 'critico')
  const advertencias = alertas.filter(a => a.severidad === 'advertencia')

  return {
    // Datos
    alertas,
    criticas,
    advertencias,
    resumen: resumenQuery.data,

    // Estados
    isLoading: alertasQuery.isLoading || resumenQuery.isLoading,
    isError: alertasQuery.isError || resumenQuery.isError,
    error: alertasQuery.error || resumenQuery.error,

    // Métodos
    refetch: () => {
      alertasQuery.refetch()
      resumenQuery.refetch()
    },
    ignorar: ignorarMutation.mutate,
    ignorarAsync: ignorarMutation.mutateAsync,
    isIgnorando: ignorarMutation.isPending
  }
}

export default {
  useAlertas,
  useGetAlertas,
  useGetAlertasPendientes,
  useAlertasCriticas,
  useResumenAlertas,
  useGetResumenAlertas,
  useAlertasCount,
  useIgnorarAlerta,
  useResolverAlerta,
  useAlertasManager
}
