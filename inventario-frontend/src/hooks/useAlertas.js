// ============================================
// CUSTOM HOOK: useAlertas
// Maneja operaciones con alertas del sistema
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import operacionesAPI from '../api/apiOperaciones'

const { alertas: alertasAPI } = operacionesAPI

// ============================================
// HOOK: useGetAlertas
// Obtiene alertas con paginación y filtros
// ============================================

export const useGetAlertas = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['alertas', params],
        queryFn: () => alertasAPI.obtenerTodas(params)
    })

    return {
        alertas: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetAlertasPendientes
// Obtiene alertas pendientes (no resueltas)
// ============================================

export const useGetAlertasPendientes = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['alertas', 'pendientes', params],
        queryFn: () => alertasAPI.obtenerPendientes(params),
        refetchInterval: 60000 // Refrescar cada minuto
    })

    return {
        alertas: data?.data || [],
        total: data?.total || 0,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetResumenAlertas
// Obtiene resumen de alertas (conteos)
// ============================================

export const useGetResumenAlertas = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['alertas', 'resumen'],
        queryFn: alertasAPI.obtenerResumen,
        refetchInterval: 60000 // Refrescar cada minuto
    })

    return {
        resumen: data?.data || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useResolverAlerta
// Resuelve una alerta
// ============================================

export const useResolverAlerta = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => alertasAPI.resolver(id, data),
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertas'] })
        }
    })
}

// ============================================
// HOOK: useMarcarAlertaLeida
// Marca una alerta como leída
// ============================================

export const useMarcarAlertaLeida = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (id) => alertasAPI.marcarLeida(id),
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertas'] })
        }
    })

    return {
        marcarLeida: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error
    }
}

// ============================================
// HOOK: useMarcarAlertaResuelta
// Marca una alerta como resuelta
// ============================================

export const useMarcarAlertaResuelta = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (id) => alertasAPI.resolver(id, {}),
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertas'] })
        }
    })

    return {
        marcarResuelta: mutation.mutateAsync,
        isLoading: mutation.isPending,
        error: mutation.error
    }
}

// ============================================
// HOOK: useAlertasCount
// Hook simple para obtener el conteo de alertas pendientes
// Útil para badges en navegación
// ============================================

export const useAlertasCount = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['alertas', 'pendientes', 'count'],
        queryFn: async () => {
            const response = await alertasAPI.obtenerPendientes({})
            return response.total || response.data?.length || 0
        },
        refetchInterval: 60000, // Refrescar cada minuto
        staleTime: 30000 // Considerar datos frescos por 30 segundos
    })

    return {
        count: data || 0,
        isLoading
    }
}

// ============================================
// HOOK: useAlertasCriticas
// Obtiene solo alertas críticas pendientes
// ============================================

export const useAlertasCriticas = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['alertas', 'pendientes', { severidad: 'critica' }],
        queryFn: () => alertasAPI.obtenerPendientes({ severidad: 'critica' }),
        refetchInterval: 30000 // Refrescar cada 30 segundos para críticas
    })

    return {
        alertas: data?.data || [],
        isLoading,
        error,
        refetch
    }
}
