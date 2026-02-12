// ============================================
// FUNCIONES AUXILIARES (HELPERS)
// Utilidades reutilizables en toda la app
// ============================================

import { ESTADO_COLORS, ESTADO_LABELS } from './constants'

// ============================================
// FORMATEO DE FECHAS
// ============================================

/**
 * Formatea una fecha en formato corto (día + mes abreviado)
 * @param {string|Date} dateStr - Fecha a formatear
 * @returns {string|null} - Fecha formateada o null
 */
export const formatearFechaCorta = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short'
  })
}

/**
 * Formatea una fecha al formato DD/MM/YYYY
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return '-'
  
  const date = new Date(fecha)
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const año = date.getFullYear()
  
  return `${dia}/${mes}/${año}`
}

/**
 * Formatea una fecha al formato DD/MM/YYYY HH:mm
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha y hora formateada
 */
export const formatearFechaHora = (fecha) => {
  if (!fecha) return '-'
  
  const date = new Date(fecha)
  const fechaFormateada = formatearFecha(fecha)
  const horas = String(date.getHours()).padStart(2, '0')
  const minutos = String(date.getMinutes()).padStart(2, '0')
  
  return `${fechaFormateada} ${horas}:${minutos}`
}

/**
 * Calcula hace cuánto tiempo ocurrió algo
 * @param {string|Date} fecha - Fecha a comparar
 * @returns {string} - Texto relativo (ej: "hace 2 días")
 */
export const tiempoRelativo = (fecha) => {
  if (!fecha) return '-'
  
  const ahora = new Date()
  const entonces = new Date(fecha)
  const diferencia = ahora - entonces
  
  const segundos = Math.floor(diferencia / 1000)
  const minutos = Math.floor(segundos / 60)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)
  
  if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`
  if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`
  if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`
  return 'hace un momento'
}

// ============================================
// FORMATEO DE NÚMEROS
// ============================================

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - Número a formatear
 * @returns {string} - Número formateado (ej: "1,234")
 */
export const formatearNumero = (numero) => {
  if (numero === null || numero === undefined) return '0'
  return new Intl.NumberFormat('es-ES').format(numero)
}

/**
 * Formatea un número como moneda (pesos colombianos)
 * @param {number} monto - Monto a formatear
 * @returns {string} - Monto formateado (ej: "$1,234,567")
 */
export const formatearMoneda = (monto) => {
  if (monto === null || monto === undefined) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(monto)
}

// ============================================
// FUNCIONES DE ESTADOS
// ============================================

/**
 * Obtiene los colores de un estado
 * @param {string} estado - Estado del elemento
 * @returns {object} - Objeto con las clases de Tailwind
 */
export const obtenerColoresEstado = (estado) => {
  return ESTADO_COLORS[estado] || ESTADO_COLORS.bueno
}

/**
 * Obtiene la etiqueta amigable de un estado
 * @param {string} estado - Estado del elemento
 * @returns {string} - Etiqueta con emoji
 */
export const obtenerLabelEstado = (estado) => {
  return ESTADO_LABELS[estado] || estado
}

// ============================================
// VALIDACIONES
// ============================================

/**
 * Valida si un email es válido
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Valida si un número de serie es válido
 * @param {string} serie - Número de serie
 * @returns {boolean} - true si es válido
 */
export const validarSerie = (serie) => {
  // Al menos 3 caracteres, puede tener letras, números y guiones
  const regex = /^[A-Za-z0-9-]{3,}$/
  return regex.test(serie)
}

/**
 * Valida si un número es positivo
 * @param {number} numero - Número a validar
 * @returns {boolean} - true si es positivo
 */
export const validarPositivo = (numero) => {
  return numero > 0
}

// ============================================
// MANIPULACIÓN DE STRINGS
// ============================================

/**
 * Capitaliza la primera letra de un string
 * @param {string} texto - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export const capitalizar = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

/**
 * Trunca un texto a cierta longitud
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @returns {string} - Texto truncado con "..."
 */
export const truncar = (texto, longitud = 50) => {
  if (!texto) return ''
  if (texto.length <= longitud) return texto
  return texto.substring(0, longitud) + '...'
}

/**
 * Convierte un texto a formato slug (URL amigable)
 * @param {string} texto - Texto a convertir
 * @returns {string} - Slug generado
 */
export const generarSlug = (texto) => {
  if (!texto) return ''
  
  return texto
    .toLowerCase()
    .normalize('NFD')                    // Normaliza caracteres especiales
    .replace(/[\u0300-\u036f]/g, '')    // Elimina acentos
    .replace(/[^a-z0-9\s-]/g, '')       // Elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-')               // Reemplaza espacios con guiones
    .replace(/-+/g, '-')                // Reemplaza múltiples guiones
}

// ============================================
// FUNCIONES DE ARRAYS
// ============================================

/**
 * Agrupa elementos por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} propiedad - Propiedad por la cual agrupar
 * @returns {object} - Objeto con elementos agrupados
 */
export const agruparPor = (array, propiedad) => {
  return array.reduce((grupos, item) => {
    const clave = item[propiedad]
    if (!grupos[clave]) {
      grupos[clave] = []
    }
    grupos[clave].push(item)
    return grupos
  }, {})
}

/**
 * Ordena un array por una propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} propiedad - Propiedad por la cual ordenar
 * @param {string} orden - 'asc' o 'desc'
 * @returns {Array} - Array ordenado
 */
export const ordenarPor = (array, propiedad, orden = 'asc') => {
  return [...array].sort((a, b) => {
    if (a[propiedad] < b[propiedad]) return orden === 'asc' ? -1 : 1
    if (a[propiedad] > b[propiedad]) return orden === 'asc' ? 1 : -1
    return 0
  })
}

// ============================================
// FUNCIONES DE BÚSQUEDA Y FILTRADO
// ============================================

/**
 * Filtra elementos por texto de búsqueda
 * @param {Array} items - Items a filtrar
 * @param {string} busqueda - Texto de búsqueda
 * @param {Array} campos - Campos donde buscar
 * @returns {Array} - Items filtrados
 */
export const filtrarPorBusqueda = (items, busqueda, campos = ['nombre']) => {
  if (!busqueda) return items
  
  const busquedaLower = busqueda.toLowerCase()
  
  return items.filter(item => {
    return campos.some(campo => {
      const valor = item[campo]
      return valor && valor.toString().toLowerCase().includes(busquedaLower)
    })
  })
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcula el porcentaje de un valor sobre un total
 * @param {number} valor - Valor parcial
 * @param {number} total - Valor total
 * @returns {number} - Porcentaje (0-100)
 */
export const calcularPorcentaje = (valor, total) => {
  if (!total || total === 0) return 0
  return Math.round((valor / total) * 100)
}

/**
 * Suma los valores de una propiedad en un array
 * @param {Array} array - Array de objetos
 * @param {string} propiedad - Propiedad a sumar
 * @returns {number} - Suma total
 */
export const sumarPropiedad = (array, propiedad) => {
  return array.reduce((suma, item) => suma + (item[propiedad] || 0), 0)
}

// ============================================
// MANEJO DE ERRORES
// ============================================

/**
 * Extrae el mensaje de error de una respuesta de API
 * @param {object} error - Objeto de error
 * @returns {string} - Mensaje de error legible
 */
export const obtenerMensajeError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'Ocurrió un error inesperado'
}