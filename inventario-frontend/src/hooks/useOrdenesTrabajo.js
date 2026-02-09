// ============================================
// CUSTOM HOOK: useOrdenesTrabajo
// Maneja operaciones con órdenes de trabajo
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import operacionesAPI from '../api/apiOperaciones'

const { ordenes: ordenesAPI, elementos: elementosAPI, validacion: validacionAPI, alertas: alertasOperacionesAPI } = operacionesAPI

// ============================================
// HOOK: useGetOrdenes
// Obtiene órdenes con paginación y filtros
// ============================================

export const useGetOrdenes = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', params],
        queryFn: () => ordenesAPI.obtenerTodas(params)
    })

    return {
        ordenes: data?.data || [],
        pagination: data?.pagination || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetOrden
// Obtiene una orden por ID
// ============================================

export const useGetOrden = (id) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', id],
        queryFn: () => ordenesAPI.obtenerPorId(id),
        enabled: !!id
    })

    return {
        orden: data?.data || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetOrdenesPorAlquiler
// Obtiene órdenes de un alquiler específico
// ============================================

export const useGetOrdenesPorAlquiler = (alquilerId) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', 'alquiler', alquilerId],
        queryFn: () => ordenesAPI.obtenerPorAlquiler(alquilerId),
        enabled: !!alquilerId
    })

    return {
        ordenes: data?.data || [],
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetOrdenCompleta
// Obtiene una orden con productos, transporte y elementos
// ============================================

export const useGetOrdenCompleta = (id, options = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', id, 'completa'],
        queryFn: () => ordenesAPI.obtenerOrdenCompleta(id),
        enabled: !!id && (options.enabled !== false)
    })

    return {
        ordenCompleta: data?.data || null,
        productos: data?.data?.productos || [],
        alquilerElementos: data?.data?.alquiler_elementos || [],
        ordenElementos: data?.data?.orden_elementos || [],
        elementosCargue: data?.data?.elementos_cargue || [], // Elementos para modal de cargue
        resumenCotizacion: data?.data?.resumen_cotizacion || null,
        resumenElementos: data?.data?.resumen_elementos || null,
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetCalendario
// Obtiene vista de calendario
// ============================================

export const useGetCalendario = (params = {}) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', 'calendario', params],
        queryFn: () => ordenesAPI.obtenerCalendario(params)
    })

    return {
        eventos: data?.data || [],
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useGetEstadisticasOperaciones
// Obtiene estadísticas de operaciones
// ============================================

export const useGetEstadisticasOperaciones = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['ordenes', 'estadisticas'],
        queryFn: ordenesAPI.obtenerEstadisticas
    })

    return {
        estadisticas: data?.data || null,
        isLoading,
        error
    }
}

// ============================================
// HOOK: useCrearOrdenManual
// Crea una orden manual (mantenimiento, traslado, etc.)
// ============================================

export const useCrearOrdenManual = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data) => ordenesAPI.crearManual(data),
        retry: 0,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
        }
    })
}

// ============================================
// HOOK: useUpdateOrden
// Actualiza una orden
// ============================================

export const useUpdateOrden = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => ordenesAPI.actualizar(id, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.id] })
        }
    })
}

// ============================================
// HOOK: useCambiarFechaOrden
// Cambia la fecha de una orden con validación
// ============================================

export const useCambiarFechaOrden = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => ordenesAPI.cambiarFecha(id, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.id] })
            queryClient.invalidateQueries({ queryKey: ['alertas'] })
        }
    })
}

// ============================================
// HOOK: useCambiarEstadoOrden
// Cambia el estado de una orden
// ============================================

export const useCambiarEstadoOrden = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => ordenesAPI.cambiarEstado(id, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.id] })
            // Cambio de estado puede afectar alquileres y eventos asociados
            queryClient.invalidateQueries({ queryKey: ['alquileres'] })
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
            queryClient.invalidateQueries({ queryKey: ['eventos'] })
        }
    })
}

// ============================================
// HOOK: useAsignarEquipo
// Asigna equipo de trabajo a una orden
// ============================================

export const useAsignarEquipo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }) => ordenesAPI.asignarEquipo(id, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.id] })
        }
    })
}

// ============================================
// HOOK: useValidarCambioFecha
// Valida un cambio de fecha antes de aplicarlo
// ============================================

export const useValidarCambioFecha = () => {
    return useMutation({
        mutationFn: validacionAPI.validarCambioFecha,
        retry: 0
    })
}

// ============================================
// HOOK: useGetElementosOrden
// Obtiene elementos de una orden
// ============================================

export const useGetElementosOrden = (ordenId) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', ordenId, 'elementos'],
        queryFn: () => elementosAPI.obtenerPorOrden(ordenId),
        enabled: !!ordenId
    })

    return {
        elementos: data?.data || [],
        isLoading,
        error,
        refetch
    }
}

// ============================================
// HOOK: useCambiarEstadoElemento
// Cambia el estado de un elemento
// ============================================

export const useCambiarEstadoElemento = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ ordenId, elementoId, data }) =>
            elementosAPI.cambiarEstado(ordenId, elementoId, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId, 'elementos'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId] })
        }
    })
}

// ============================================
// HOOK: useCambiarEstadoElementosMasivo
// Cambia el estado de múltiples elementos a la vez
// Permite operaciones masivas para agilizar el proceso
// ============================================

export const useCambiarEstadoElementosMasivo = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ ordenId, elementoIds, estado }) =>
            elementosAPI.cambiarEstadoMasivo(ordenId, elementoIds, estado),
        retry: 0,
        onSuccess: (_, variables) => {
            // Invalidar todas las queries relacionadas con la orden
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId, 'elementos'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId, 'completa'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId] })
        }
    })
}

// ============================================
// HOOK: useReportarIncidencia
// Reporta una incidencia en un elemento
// ============================================

export const useReportarIncidencia = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ ordenId, elementoId, data }) =>
            elementosAPI.reportarIncidencia(ordenId, elementoId, data),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId, 'elementos'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId] })
            queryClient.invalidateQueries({ queryKey: ['alertas'] })
        }
    })
}

// ============================================
// HOOK: useSubirFotoElemento
// Sube foto de un elemento
// ============================================

export const useSubirFotoElemento = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ ordenId, elementoId, formData }) =>
            elementosAPI.subirFoto(ordenId, elementoId, formData),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId, 'elementos'] })
        }
    })
}

// ============================================
// HOOKS: PREPARACIÓN Y EJECUCIÓN
// ============================================

/**
 * Hook: useGetElementosDisponibles
 * Obtiene elementos disponibles para asignar a una orden
 */
export const useGetElementosDisponibles = (ordenId) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', ordenId, 'elementos-disponibles'],
        queryFn: () => ordenesAPI.obtenerElementosDisponibles(ordenId),
        enabled: !!ordenId
    })

    return {
        orden: data?.data?.orden || null,
        productos: data?.data?.productos || [],
        isLoading,
        error,
        refetch
    }
}

/**
 * Hook: usePrepararElementos
 * Asigna elementos (series/lotes) a una orden
 */
export const usePrepararElementos = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ ordenId, elementos }) =>
            ordenesAPI.prepararElementos(ordenId, elementos),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId, 'elementos'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId, 'elementos-disponibles'] })
        }
    })
}

/**
 * Hook: useEjecutarSalida
 * Ejecuta la salida de una orden de montaje
 * Cambia estado del alquiler a "activo"
 */
export const useEjecutarSalida = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ ordenId, datos }) =>
            ordenesAPI.ejecutarSalida(ordenId, datos),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId] })
            queryClient.invalidateQueries({ queryKey: ['alquileres'] })
            queryClient.invalidateQueries({ queryKey: ['alquiler'] })
            // La salida cambia alquiler_estado → refrescar cotizaciones (calendario) y eventos
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
            queryClient.invalidateQueries({ queryKey: ['eventos'] })
        }
    })
}

/**
 * Hook: useEjecutarRetorno
 * Ejecuta el retorno de una orden de desmontaje
 * Registra estado de retorno y cambia alquiler a "finalizado"
 */
export const useEjecutarRetorno = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ ordenId, retornos }) =>
            ordenesAPI.ejecutarRetorno(ordenId, retornos),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ordenes'] })
            queryClient.invalidateQueries({ queryKey: ['ordenes', variables.ordenId] })
            queryClient.invalidateQueries({ queryKey: ['alquileres'] })
            queryClient.invalidateQueries({ queryKey: ['alquiler'] })
            // El retorno puede resolver alertas de disponibilidad → refrescar alertas
            queryClient.invalidateQueries({ queryKey: ['alertas'] })
            queryClient.invalidateQueries({ queryKey: ['alertas-operaciones'] })
            // El retorno finaliza alquiler y puede auto-finalizar evento → refrescar cotizaciones (calendario) y eventos
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
            queryClient.invalidateQueries({ queryKey: ['eventos'] })
        }
    })
}

/**
 * Hook: useGetAlertasOrden
 * Obtiene alertas asociadas a una orden de trabajo
 */
export const useGetAlertasOrden = (ordenId) => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ordenes', ordenId, 'alertas'],
        queryFn: () => ordenesAPI.obtenerAlertasPorOrden(ordenId),
        enabled: !!ordenId
    })

    return {
        alertas: data?.data || [],
        isLoading,
        error,
        refetch
    }
}

/**
 * Hook: useCrearAlertaOperaciones
 * Crea una alerta de operaciones (ej: insuficiencia de inventario)
 */
export const useCrearAlertaOperaciones = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (datos) => alertasOperacionesAPI.crear(datos),
        retry: 0,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['alertas-operaciones'] })
            queryClient.invalidateQueries({ queryKey: ['alertas'] })
            // Invalidar alertas de la orden si se especificó orden_id
            if (variables?.orden_id) {
                queryClient.invalidateQueries({ queryKey: ['ordenes', variables.orden_id, 'alertas'] })
            }
        }
    })
}
