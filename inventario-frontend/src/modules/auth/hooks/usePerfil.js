// ============================================
// HOOKS: Perfil de Usuario
// React Query hooks para perfil, password, historial, sesiones
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import authAPI from '../api/apiAuth'

/**
 * Hook para obtener perfil del usuario autenticado
 */
export const useGetPerfil = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['auth', 'perfil'],
        queryFn: () => authAPI.getMe(),
        staleTime: 5 * 60 * 1000,
    })

    return {
        perfil: data?.data || null,
        isLoading,
        error,
        refetch
    }
}

/**
 * Hook para actualizar perfil
 */
export const useUpdatePerfil = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (datos) => authAPI.actualizarPerfil(datos),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth', 'perfil'] })
        }
    })
}

/**
 * Hook para cambiar contraseña
 */
export const useCambiarPassword = () => {
    return useMutation({
        mutationFn: ({ passwordActual, passwordNuevo }) =>
            authAPI.cambiarPassword(passwordActual, passwordNuevo)
    })
}

/**
 * Hook para obtener historial de actividad
 */
export const useGetHistorial = (page = 1, limit = 20) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['auth', 'historial', page, limit],
        queryFn: () => authAPI.obtenerHistorial({ page, limit }),
        staleTime: 2 * 60 * 1000,
    })

    return {
        registros: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error
    }
}

/**
 * Hook para obtener sesiones activas
 */
export const useGetSesiones = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['auth', 'sesiones'],
        queryFn: () => authAPI.getSesiones(),
        staleTime: 1 * 60 * 1000,
    })

    return {
        sesiones: data?.data || [],
        isLoading,
        error,
        refetch
    }
}
