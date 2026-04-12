// ============================================
// API: SUPERADMIN
// Gestión de tenants, planes y pagos
// ============================================

import api from '@shared/api/Axios.config'

// ============================================
// DASHBOARD
// ============================================

export const dashboardAPI = {
    obtener: async () => {
        const response = await api.get('/superadmin/dashboard')
        return response.data
    }
}

// ============================================
// TENANTS
// ============================================

export const tenantsAPI = {
    obtenerTodos: async (params = {}) => {
        const response = await api.get('/superadmin/tenants', { params })
        return response.data
    },

    obtenerPorId: async (id) => {
        const response = await api.get(`/superadmin/tenants/${id}`)
        return response.data
    },

    obtenerEmpleados: async (id, params = {}) => {
        const response = await api.get(`/superadmin/tenants/${id}/empleados`, { params })
        return response.data
    },

    obtenerPagos: async (id) => {
        const response = await api.get(`/superadmin/tenants/${id}/pagos`)
        return response.data
    },

    crear: async (data) => {
        const response = await api.post('/superadmin/tenants', data)
        return response.data
    },

    actualizar: async (id, data) => {
        const response = await api.put(`/superadmin/tenants/${id}`, data)
        return response.data
    },

    cambiarEstado: async (id, estado) => {
        const response = await api.patch(`/superadmin/tenants/${id}/estado`, { estado })
        return response.data
    }
}

// ============================================
// PLANES
// ============================================

export const planesAPI = {
    obtenerTodos: async () => {
        const response = await api.get('/superadmin/planes')
        return response.data
    },

    obtenerPorId: async (id) => {
        const response = await api.get(`/superadmin/planes/${id}`)
        return response.data
    },

    crear: async (data) => {
        const response = await api.post('/superadmin/planes', data)
        return response.data
    },

    actualizar: async (id, data) => {
        const response = await api.put(`/superadmin/planes/${id}`, data)
        return response.data
    },

    eliminar: async (id) => {
        const response = await api.delete(`/superadmin/planes/${id}`)
        return response.data
    }
}

// ============================================
// PAGOS
// ============================================

export const pagosAPI = {
    obtenerTodos: async (params = {}) => {
        const response = await api.get('/superadmin/pagos', { params })
        return response.data
    },

    obtenerResumen: async (mes = null) => {
        const params = mes ? { mes } : {}
        const response = await api.get('/superadmin/pagos/resumen', { params })
        return response.data
    },

    marcarPago: async (id, data) => {
        const response = await api.patch(`/superadmin/pagos/${id}`, data)
        return response.data
    },

    generarPeriodo: async (mes) => {
        const response = await api.post('/superadmin/pagos/generar-periodo', { mes })
        return response.data
    },

    eliminar: async (id) => {
        const response = await api.delete(`/superadmin/pagos/${id}`)
        return response.data
    }
}

export default { dashboardAPI, tenantsAPI, planesAPI, pagosAPI }
