// ============================================
// CUSTOM HOOK: useVehiculos
// Maneja operaciones con vehículos y mantenimientos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import vehiculosAPI from '../api/apiVehiculos'

// ============================================
// HOOK: useGetVehiculos
// Obtiene vehículos con paginación y filtros
// ============================================

export const useGetVehiculos = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['vehiculos', params],
        queryFn: () => vehiculosAPI.obtenerTodos(params)
    })

    return {
        vehiculos: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetVehiculo
// Obtiene un vehículo por ID con historial
// ============================================

export const useGetVehiculo = (id) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['vehiculos', id],
        queryFn: () => vehiculosAPI.obtenerPorId(id),
        enabled: !!id
    })

    return {
        vehiculo: data?.data || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetVehiculosDisponibles
// Obtiene vehículos disponibles para una fecha
// ============================================

export const useGetVehiculosDisponibles = (fecha = null) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['vehiculos', 'disponibles', fecha],
        queryFn: () => vehiculosAPI.obtenerDisponibles(fecha)
    })

    return {
        vehiculos: data?.data || [],
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetVehiculosEstadisticas
// Obtiene estadísticas de vehículos
// ============================================

export const useGetVehiculosEstadisticas = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['vehiculos', 'estadisticas'],
        queryFn: vehiculosAPI.obtenerEstadisticas
    })

    return {
        estadisticas: data?.data || null,
        isLoading,
        error
    }
}

// ============================================
// HOOK: useCreateVehiculo
// Crea un nuevo vehículo
// ============================================

export const useCreateVehiculo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: vehiculosAPI.crear,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
        }
    })
}

// ============================================
// HOOK: useUpdateVehiculo
// Actualiza un vehículo
// ============================================

export const useUpdateVehiculo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => vehiculosAPI.actualizar(id, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
            queryClient.invalidateQueries({ queryKey: ['vehiculos', variables.id] })
        }
    })
}

// ============================================
// HOOK: useDeleteVehiculo
// Desactiva un vehículo
// ============================================

export const useDeleteVehiculo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: vehiculosAPI.eliminar,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
        }
    })
}

// ============================================
// HOOK: useRegistrarUsoVehiculo
// Registra uso de un vehículo
// ============================================

export const useRegistrarUsoVehiculo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ vehiculoId, data }) => vehiculosAPI.registrarUso(vehiculoId, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
            queryClient.invalidateQueries({ queryKey: ['vehiculos', variables.vehiculoId] })
        }
    })
}

// ============================================
// HOOK: useRegistrarMantenimiento
// Registra o programa mantenimiento
// ============================================

export const useRegistrarMantenimiento = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ vehiculoId, data }) => vehiculosAPI.registrarMantenimiento(vehiculoId, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
            queryClient.invalidateQueries({ queryKey: ['vehiculos', variables.vehiculoId] })
        }
    })
}

// ============================================
// HOOK: useActualizarMantenimiento
// Actualiza un mantenimiento existente
// ============================================

export const useActualizarMantenimiento = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ mantenimientoId, data }) => vehiculosAPI.actualizarMantenimiento(mantenimientoId, data),
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] })
        }
    })
}
