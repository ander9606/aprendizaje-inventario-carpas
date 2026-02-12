// ============================================
// API: EXPORTACIÓN DE INVENTARIO
// ============================================

import api from './Axios.config'

/**
 * Descarga el inventario completo como archivo Excel
 * Sigue el mismo patrón de apiCotizaciones.descargarPDF
 */
export const exportarInventarioExcel = async () => {
    const response = await api.get('/inventario/export/excel', {
        responseType: 'blob'
    })

    const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const fecha = new Date().toISOString().split('T')[0]
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventario_${fecha}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}
