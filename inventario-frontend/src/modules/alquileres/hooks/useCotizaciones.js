// ============================================
// CUSTOM HOOKS: useCotizaciones
// Maneja operaciones con cotizaciones y recargos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiCotizaciones from '../api/apiCotizaciones'

// ============================================
// HOOK: useGetCotizaciones
// Obtiene todas las cotizaciones
// ============================================

export const useGetCotizaciones = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['cotizaciones'],
        queryFn: apiCotizaciones.obtenerTodas
    })

    return {
        cotizaciones: data?.data || [],
        total: data?.total || 0,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetCotizacionesPorEstado
// ============================================

export const useGetCotizacionesPorEstado = (estado) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['cotizaciones', 'estado', estado],
        queryFn: () => apiCotizaciones.obtenerPorEstado(estado),
        enabled: !!estado
    })

    return {
        cotizaciones: data?.data || [],
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetCotizacion
// Obtiene una cotización por ID
// ============================================

export const useGetCotizacion = (id) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['cotizacion', id],
        queryFn: () => apiCotizaciones.obtenerPorId(id),
        enabled: !!id
    })

    return {
        cotizacion: data?.data || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetCotizacionCompleta
// Obtiene cotización con productos, transporte y recargos
// ============================================

export const useGetCotizacionCompleta = (id) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['cotizacion', id, 'completa'],
        queryFn: () => apiCotizaciones.obtenerCompleta(id),
        enabled: !!id
    })

    return {
        cotizacion: data?.data || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useCreateCotizacion
// ============================================

export const useCreateCotizacion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: apiCotizaciones.crear,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
        }
    })
}

// ============================================
// HOOK: useUpdateCotizacion
// ============================================

export const useUpdateCotizacion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => apiCotizaciones.actualizar(id, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
            queryClient.invalidateQueries({ queryKey: ['cotizacion', variables.id] })
        }
    })
}

// ============================================
// HOOK: useCambiarEstadoCotizacion
// ============================================

export const useCambiarEstadoCotizacion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, estado }) => apiCotizaciones.cambiarEstado(id, estado),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
            queryClient.invalidateQueries({ queryKey: ['cotizacion', variables.id] })
        }
    })
}

// ============================================
// HOOK: useAprobarCotizacion
// ============================================

export const useAprobarCotizacion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, opciones }) => apiCotizaciones.aprobar(id, opciones),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
            queryClient.invalidateQueries({ queryKey: ['cotizacion', variables.id] })
            queryClient.invalidateQueries({ queryKey: ['alquileres'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
        }
    })
}

// ============================================
// HOOK: useDuplicarCotizacion
// ============================================

export const useDuplicarCotizacion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: apiCotizaciones.duplicar,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
        }
    })
}

// ============================================
// HOOK: useDeleteCotizacion
// ============================================

export const useDeleteCotizacion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: apiCotizaciones.eliminar,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
        }
    })
}

// ============================================
// HOOKS DE RECARGOS
// ============================================

// ============================================
// HOOK: useAgregarRecargo
// Agrega un recargo a un producto de cotización
// ============================================

export const useAgregarRecargo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ cotizacionId, productoId, recargo }) =>
            apiCotizaciones.agregarRecargo(cotizacionId, productoId, recargo),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cotizacion', variables.cotizacionId] })
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
        }
    })
}

// ============================================
// HOOK: useActualizarRecargo
// ============================================

export const useActualizarRecargo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ cotizacionId, productoId, recargoId, recargo }) =>
            apiCotizaciones.actualizarRecargo(cotizacionId, productoId, recargoId, recargo),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cotizacion', variables.cotizacionId] })
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
        }
    })
}

// ============================================
// HOOK: useEliminarRecargo
// ============================================

export const useEliminarRecargo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ cotizacionId, productoId, recargoId }) =>
            apiCotizaciones.eliminarRecargo(cotizacionId, productoId, recargoId),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cotizacion', variables.cotizacionId] })
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
        }
    })
}

// ============================================
// HOOK: useAsignarEventoCotizacion
// ============================================

export const useAsignarEventoCotizacion = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ cotizacionId, eventoId }) =>
            apiCotizaciones.asignarEvento(cotizacionId, eventoId),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cotizacion', variables.cotizacionId] })
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
            queryClient.invalidateQueries({ queryKey: ['eventos'] })
        }
    })
}
