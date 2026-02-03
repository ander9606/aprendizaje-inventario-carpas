// ============================================
// API: OPERACIONES
// Órdenes de trabajo, alertas y validaciones
// ============================================

import api from './Axios.config'

/**
 * API de Operaciones
 *
 * Endpoints de Órdenes de Trabajo:
 * - GET    /operaciones/ordenes                           → Listar órdenes
 * - GET    /operaciones/ordenes/:id                       → Obtener orden por ID
 * - GET    /operaciones/alquiler/:id/ordenes              → Órdenes de un alquiler
 * - PUT    /operaciones/ordenes/:id                       → Actualizar orden
 * - PUT    /operaciones/ordenes/:id/fecha                 → Cambiar fecha
 * - PUT    /operaciones/ordenes/:id/estado                → Cambiar estado
 * - PUT    /operaciones/ordenes/:id/equipo                → Asignar equipo
 * - PUT    /operaciones/ordenes/:id/vehiculo              → Asignar vehículo
 * - GET    /operaciones/calendario                        → Vista calendario
 * - GET    /operaciones/estadisticas                      → Estadísticas
 *
 * Endpoints de Elementos:
 * - GET    /operaciones/ordenes/:id/elementos             → Elementos de orden
 * - PUT    /operaciones/ordenes/:id/elementos/:elemId/estado     → Estado elemento
 * - POST   /operaciones/ordenes/:id/elementos/:elemId/incidencia → Reportar incidencia
 * - POST   /operaciones/ordenes/:id/elementos/:elemId/foto       → Subir foto
 *
 * Endpoints de Alertas:
 * - GET    /operaciones/alertas                           → Listar alertas
 * - GET    /operaciones/alertas/pendientes                → Alertas pendientes
 * - GET    /operaciones/alertas/resumen                   → Resumen alertas
 * - PUT    /operaciones/alertas/:id/resolver              → Resolver alerta
 *
 * Endpoints de Validación:
 * - POST   /operaciones/validar-fecha                     → Validar cambio fecha
 */

// ============================================
// ÓRDENES DE TRABAJO
// ============================================

const ordenesAPI = {
    /**
     * Obtener todas las órdenes con filtros
     * @param {Object} params - { page, limit, tipo, estado, fecha_desde, fecha_hasta, empleado_id }
     */
    obtenerTodas: async (params = {}) => {
        const response = await api.get('/operaciones/ordenes', { params })
        return response.data
    },

    /**
     * Obtener orden por ID con detalles completos
     * @param {number} id
     */
    obtenerPorId: async (id) => {
        const response = await api.get(`/operaciones/ordenes/${id}`)
        return response.data
    },

    /**
     * Crear orden manual (mantenimiento, traslado, revisión, etc.)
     * @param {Object} datos - { tipo, fecha_programada, direccion_destino, ciudad_destino, notas, prioridad, elementos }
     */
    crearManual: async (datos) => {
        const response = await api.post('/operaciones/ordenes', datos)
        return response.data
    },

    /**
     * Obtener órdenes de un alquiler específico
     * @param {number} alquilerId
     */
    obtenerPorAlquiler: async (alquilerId) => {
        const response = await api.get(`/operaciones/alquiler/${alquilerId}/ordenes`)
        return response.data
    },

    /**
     * Actualizar orden de trabajo
     * @param {number} id
     * @param {Object} datos - { fecha_programada, notas, prioridad, ... }
     */
    actualizar: async (id, datos) => {
        const response = await api.put(`/operaciones/ordenes/${id}`, datos)
        return response.data
    },

    /**
     * Cambiar fecha de orden (con validación de disponibilidad)
     * @param {number} id
     * @param {Object} datos - { nueva_fecha, motivo }
     */
    cambiarFecha: async (id, datos) => {
        const response = await api.put(`/operaciones/ordenes/${id}/fecha`, datos)
        return response.data
    },

    /**
     * Cambiar estado de orden
     * @param {number} id
     * @param {Object} datos - { estado, notas }
     * Estados: pendiente, en_proceso, completado, cancelado
     */
    cambiarEstado: async (id, datos) => {
        const response = await api.put(`/operaciones/ordenes/${id}/estado`, datos)
        return response.data
    },

    /**
     * Asignar responsable a orden
     * @param {number} id
     * @param {Object} datos - { empleados: [{empleado_id, rol_en_orden}] }
     */
    asignarEquipo: async (id, datos) => {
        const response = await api.put(`/operaciones/ordenes/${id}/equipo`, datos)
        return response.data
    },

    /**
     * Obtener vista de calendario
     * @param {Object} params - { fecha_inicio, fecha_fin, empleado_id }
     */
    obtenerCalendario: async (params = {}) => {
        const response = await api.get('/operaciones/calendario', { params })
        return response.data
    },

    /**
     * Obtener estadísticas de operaciones
     */
    obtenerEstadisticas: async () => {
        const response = await api.get('/operaciones/estadisticas')
        return response.data
    },

    // ============================================
    // PREPARACIÓN Y EJECUCIÓN
    // ============================================

    /**
     * Obtener elementos disponibles para asignar a la orden
     * @param {number} id - ID de la orden
     * @returns {Object} - { orden, productos: [{ componentes: [{ disponibles }] }] }
     */
    obtenerElementosDisponibles: async (id) => {
        const response = await api.get(`/operaciones/ordenes/${id}/elementos-disponibles`)
        return response.data
    },

    /**
     * Preparar elementos (asignar series/lotes a la orden)
     * @param {number} id - ID de la orden
     * @param {Array} elementos - [{ elemento_id, serie_id, lote_id, cantidad }]
     */
    prepararElementos: async (id, elementos) => {
        const response = await api.post(`/operaciones/ordenes/${id}/preparar-elementos`, { elementos })
        return response.data
    },

    /**
     * Ejecutar salida (para órdenes de montaje)
     * Cambia estado de alquiler a "activo" y series/lotes a "alquilado"
     * @param {number} id - ID de la orden de montaje
     * @param {Object} datos - { notas }
     */
    ejecutarSalida: async (id, datos = {}) => {
        const response = await api.post(`/operaciones/ordenes/${id}/ejecutar-salida`, datos)
        return response.data
    },

    /**
     * Ejecutar retorno (para órdenes de desmontaje)
     * Registra estado de retorno de cada elemento
     * @param {number} id - ID de la orden de desmontaje
     * @param {Array} retornos - [{ alquiler_elemento_id, estado_retorno, costo_dano, notas }]
     */
    ejecutarRetorno: async (id, retornos) => {
        const response = await api.post(`/operaciones/ordenes/${id}/ejecutar-retorno`, { retornos })
        return response.data
    }
}

// ============================================
// ELEMENTOS DE ÓRDENES
// ============================================

const elementosAPI = {
    /**
     * Obtener elementos de una orden
     * @param {number} ordenId
     */
    obtenerPorOrden: async (ordenId) => {
        const response = await api.get(`/operaciones/ordenes/${ordenId}/elementos`)
        return response.data
    },

    /**
     * Cambiar estado de un elemento
     * @param {number} ordenId
     * @param {number} elementoId
     * @param {Object} datos - { estado, notas }
     * Estados: pendiente, cargado, descargado, instalado, verificado, con_problema
     */
    cambiarEstado: async (ordenId, elementoId, datos) => {
        const response = await api.put(
            `/operaciones/ordenes/${ordenId}/elementos/${elementoId}/estado`,
            datos
        )
        return response.data
    },

    /**
     * Reportar incidencia en elemento
     * @param {number} ordenId
     * @param {number} elementoId
     * @param {Object} datos - { tipo, descripcion, severidad }
     */
    reportarIncidencia: async (ordenId, elementoId, datos) => {
        const response = await api.post(
            `/operaciones/ordenes/${ordenId}/elementos/${elementoId}/incidencia`,
            datos
        )
        return response.data
    },

    /**
     * Subir foto de elemento
     * @param {number} ordenId
     * @param {number} elementoId
     * @param {FormData} formData - Contiene el archivo de imagen
     */
    subirFoto: async (ordenId, elementoId, formData) => {
        const response = await api.post(
            `/operaciones/ordenes/${ordenId}/elementos/${elementoId}/foto`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        )
        return response.data
    }
}

// ============================================
// ALERTAS
// ============================================

const alertasAPI = {
    /**
     * Obtener todas las alertas con filtros
     * @param {Object} params - { page, limit, tipo, severidad, resuelta }
     */
    obtenerTodas: async (params = {}) => {
        const response = await api.get('/operaciones/alertas', { params })
        return response.data
    },

    /**
     * Obtener alertas pendientes (no resueltas)
     * @param {Object} params - { severidad }
     */
    obtenerPendientes: async (params = {}) => {
        const response = await api.get('/operaciones/alertas/pendientes', { params })
        return response.data
    },

    /**
     * Obtener resumen de alertas (conteos por tipo/severidad)
     */
    obtenerResumen: async () => {
        const response = await api.get('/operaciones/alertas/resumen')
        return response.data
    },

    /**
     * Marcar alerta como leída
     * @param {number} id
     */
    marcarLeida: async (id) => {
        const response = await api.put(`/operaciones/alertas/${id}/leida`)
        return response.data
    },

    /**
     * Resolver una alerta
     * @param {number} id
     * @param {Object} datos - { notas_resolucion }
     */
    resolver: async (id, datos = {}) => {
        const response = await api.put(`/operaciones/alertas/${id}/resolver`, datos)
        return response.data
    }
}

// ============================================
// VALIDACIÓN
// ============================================

const validacionAPI = {
    /**
     * Validar cambio de fecha antes de aplicarlo
     * @param {Object} datos - { orden_id, nueva_fecha }
     * @returns {Object} - { valido: boolean, conflictos: [], advertencias: [] }
     */
    validarCambioFecha: async (datos) => {
        const response = await api.post('/operaciones/validar-fecha', datos)
        return response.data
    }
}

// ============================================
// EXPORT
// ============================================

const operacionesAPI = {
    ordenes: ordenesAPI,
    elementos: elementosAPI,
    alertas: alertasAPI,
    validacion: validacionAPI
}

export default operacionesAPI

// También exportar las APIs individuales
export { ordenesAPI, elementosAPI, alertasAPI, validacionAPI }
