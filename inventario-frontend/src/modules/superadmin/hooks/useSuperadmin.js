// ============================================
// HOOKS: SUPERADMIN
// React Query hooks para tenants, planes, pagos
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardAPI, tenantsAPI, planesAPI, pagosAPI } from '../api/apiSuperadmin'

// ============================================
// DASHBOARD
// ============================================

export const useGetDashboard = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['superadmin', 'dashboard'],
        queryFn: () => dashboardAPI.obtener()
    })
    return { dashboard: data?.data || null, isLoading, error, refetch }
}

// ============================================
// TENANTS
// ============================================

export const useGetTenants = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['superadmin', 'tenants', params],
        queryFn: () => tenantsAPI.obtenerTodos(params)
    })
    return {
        tenants: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error,
        refetch
    }
}

export const useGetTenant = (id) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['superadmin', 'tenants', id],
        queryFn: () => tenantsAPI.obtenerPorId(id),
        enabled: !!id
    })
    return { tenant: data?.data || null, isLoading, error, refetch }
}

export const useGetTenantEmpleados = (id) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['superadmin', 'tenants', id, 'empleados'],
        queryFn: () => tenantsAPI.obtenerEmpleados(id),
        enabled: !!id
    })
    return { empleados: data?.data || [], isLoading, error }
}

export const useGetTenantPagos = (id) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['superadmin', 'tenants', id, 'pagos'],
        queryFn: () => tenantsAPI.obtenerPagos(id),
        enabled: !!id
    })
    return { pagos: data?.data || [], isLoading, error }
}

export const useCrearTenant = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => tenantsAPI.crear(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] })
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] })
        }
    })
}

export const useActualizarTenant = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => tenantsAPI.actualizar(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] })
        }
    })
}

export const useCambiarEstadoTenant = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, estado }) => tenantsAPI.cambiarEstado(id, estado),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] })
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] })
        }
    })
}

// ============================================
// PLANES
// ============================================

export const useGetPlanes = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['superadmin', 'planes'],
        queryFn: () => planesAPI.obtenerTodos()
    })
    return { planes: data?.data || [], isLoading, error, refetch }
}

export const useCrearPlan = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => planesAPI.crear(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'planes'] })
        }
    })
}

export const useActualizarPlan = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => planesAPI.actualizar(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'planes'] })
        }
    })
}

export const useEliminarPlan = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id) => planesAPI.eliminar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'planes'] })
        }
    })
}

// ============================================
// PAGOS
// ============================================

export const useGetPagos = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['superadmin', 'pagos', params],
        queryFn: () => pagosAPI.obtenerTodos(params)
    })
    return {
        pagos: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error,
        refetch
    }
}

export const useGetResumenPagos = (mes = null) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['superadmin', 'pagos', 'resumen', mes],
        queryFn: () => pagosAPI.obtenerResumen(mes)
    })
    return { resumen: data?.data || null, isLoading, error }
}

export const useMarcarPago = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => pagosAPI.marcarPago(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'pagos'] })
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] })
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] })
        }
    })
}

export const useGenerarPeriodo = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (mes) => pagosAPI.generarPeriodo(mes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin', 'pagos'] })
        }
    })
}
