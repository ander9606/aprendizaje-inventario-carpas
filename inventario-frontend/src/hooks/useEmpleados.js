// ============================================
// CUSTOM HOOK: useEmpleados
// Maneja operaciones con empleados
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import empleadosAPI from '../api/apiEmpleados'

// ============================================
// HOOK: useGetEmpleados
// Obtiene empleados con paginación y filtros
// ============================================

export const useGetEmpleados = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['empleados', params],
        queryFn: () => empleadosAPI.obtenerTodos(params)
    })

    return {
        empleados: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetEmpleado
// Obtiene un empleado por ID
// ============================================

export const useGetEmpleado = (id) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['empleados', id],
        queryFn: () => empleadosAPI.obtenerPorId(id),
        enabled: !!id
    })

    return {
        empleado: data?.data || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetRoles
// Obtiene los roles disponibles
// ============================================

export const useGetRoles = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['empleados', 'roles'],
        queryFn: empleadosAPI.obtenerRoles,
        staleTime: 10 * 60 * 1000 // 10 min, los roles cambian poco
    })

    return {
        roles: data?.data || [],
        isLoading,
        error
    }
}

// ============================================
// HOOK: useGetEmpleadosCampo
// Obtiene empleados disponibles para trabajo de campo
// ============================================

export const useGetEmpleadosCampo = (fecha = null) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['empleados', 'campo', fecha],
        queryFn: () => empleadosAPI.obtenerDisponiblesCampo(fecha)
    })

    return {
        empleados: data?.data || [],
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetEmpleadosEstadisticas
// Obtiene estadísticas de empleados
// ============================================

export const useGetEmpleadosEstadisticas = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['empleados', 'estadisticas'],
        queryFn: empleadosAPI.obtenerEstadisticas
    })

    return {
        estadisticas: data?.data || null,
        isLoading,
        error
    }
}

// ============================================
// HOOK: useCreateEmpleado
// Crea un nuevo empleado
// ============================================

export const useCreateEmpleado = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: empleadosAPI.crear,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['empleados'] })
        }
    })
}

// ============================================
// HOOK: useUpdateEmpleado
// Actualiza un empleado
// ============================================

export const useUpdateEmpleado = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => empleadosAPI.actualizar(id, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['empleados'] })
            queryClient.invalidateQueries({ queryKey: ['empleados', variables.id] })
        }
    })
}

// ============================================
// HOOK: useDeleteEmpleado
// Desactiva un empleado
// ============================================

export const useDeleteEmpleado = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: empleadosAPI.eliminar,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['empleados'] })
        }
    })
}

// ============================================
// HOOK: useReactivarEmpleado
// Reactiva un empleado desactivado
// ============================================

export const useReactivarEmpleado = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: empleadosAPI.reactivar,
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['empleados'] })
        }
    })
}

// ============================================
// HOOK: useCambiarPasswordEmpleado
// Cambia la contraseña de un empleado (admin)
// ============================================

export const useCambiarPasswordEmpleado = () => {
    return useMutation({
        mutationFn: ({ id, password }) => empleadosAPI.cambiarPassword(id, password),
        retry: 0
    })
}
