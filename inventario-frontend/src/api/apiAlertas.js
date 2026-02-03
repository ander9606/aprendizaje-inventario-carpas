// ============================================
// API: Alertas de Alquileres
// ============================================

import axiosInstance from './axiosConfig'

const API_URL = '/alertas/alquileres'

/**
 * Obtener todas las alertas activas
 * @param {Object} params - Parámetros opcionales
 * @param {boolean} params.solo_criticas - Si true, solo retorna críticas
 */
export const getAlertas = async (params = {}) => {
  const response = await axiosInstance.get(API_URL, { params })
  return response.data
}

/**
 * Obtener solo alertas críticas
 */
export const getAlertasCriticas = async () => {
  const response = await axiosInstance.get(`${API_URL}/criticas`)
  return response.data
}

/**
 * Obtener resumen de alertas (conteos)
 */
export const getResumenAlertas = async () => {
  const response = await axiosInstance.get(`${API_URL}/resumen`)
  return response.data
}

/**
 * Ignorar una alerta por un período de tiempo
 * @param {string} tipo - Tipo de alerta
 * @param {number} referencia_id - ID del alquiler/orden
 * @param {number} dias - Días a ignorar (1-30)
 */
export const ignorarAlerta = async (tipo, referencia_id, dias = 1) => {
  const response = await axiosInstance.post(`${API_URL}/ignorar`, {
    tipo,
    referencia_id,
    dias
  })
  return response.data
}

/**
 * Limpiar alertas expiradas (solo admin)
 */
export const limpiarAlertasExpiradas = async () => {
  const response = await axiosInstance.post(`${API_URL}/limpiar`)
  return response.data
}

export default {
  getAlertas,
  getAlertasCriticas,
  getResumenAlertas,
  ignorarAlerta,
  limpiarAlertasExpiradas
}
