/**
 * Tests para shared/utils/helpers.js
 *
 * Funciones puras testeadas:
 * - formatearFechaCorta, formatearFecha, formatearFechaHora, tiempoRelativo
 * - formatearNumero, formatearMoneda
 * - obtenerColoresEstado, obtenerLabelEstado
 * - validarEmail, validarSerie, validarPositivo
 * - capitalizar, truncar, generarSlug
 * - agruparPor, ordenarPor
 * - filtrarPorBusqueda
 * - calcularPorcentaje, sumarPropiedad
 * - obtenerMensajeError
 */

import {
  formatearFecha,
  formatearFechaHora,
  formatearFechaCorta,
  tiempoRelativo,
  formatearNumero,
  formatearMoneda,
  obtenerColoresEstado,
  obtenerLabelEstado,
  validarEmail,
  validarSerie,
  validarPositivo,
  capitalizar,
  truncar,
  generarSlug,
  agruparPor,
  ordenarPor,
  filtrarPorBusqueda,
  calcularPorcentaje,
  sumarPropiedad,
  obtenerMensajeError
} from '../helpers'

// ============================================
// Formateo de fechas
// ============================================
describe('formatearFecha', () => {
  test('formatea fecha correctamente', () => {
    const result = formatearFecha('2024-03-15T12:00:00')
    expect(result).toBe('15/03/2024')
  })

  test('retorna guión si fecha es null', () => {
    expect(formatearFecha(null)).toBe('-')
  })

  test('retorna guión si fecha es undefined', () => {
    expect(formatearFecha(undefined)).toBe('-')
  })
})

describe('formatearFechaHora', () => {
  test('formatea fecha y hora correctamente', () => {
    const result = formatearFechaHora('2024-03-15T14:30:00')
    expect(result).toMatch(/15\/03\/2024 14:30/)
  })

  test('retorna guión si fecha es null', () => {
    expect(formatearFechaHora(null)).toBe('-')
  })
})

describe('formatearFechaCorta', () => {
  test('retorna null si fecha es null', () => {
    expect(formatearFechaCorta(null)).toBeNull()
  })

  test('formatea fecha a formato corto', () => {
    const result = formatearFechaCorta('2024-03-15')
    expect(result).toBeTruthy()
    // Debería contener el día y mes abreviado
    expect(typeof result).toBe('string')
  })
})

describe('tiempoRelativo', () => {
  test('retorna guión si fecha es null', () => {
    expect(tiempoRelativo(null)).toBe('-')
  })

  test('retorna "hace un momento" para fecha reciente', () => {
    const ahora = new Date()
    expect(tiempoRelativo(ahora.toISOString())).toBe('hace un momento')
  })

  test('retorna minutos para fechas recientes', () => {
    const hace5min = new Date(Date.now() - 5 * 60 * 1000)
    expect(tiempoRelativo(hace5min)).toBe('hace 5 minutos')
  })

  test('retorna horas para fechas de hoy', () => {
    const hace3h = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(tiempoRelativo(hace3h)).toBe('hace 3 horas')
  })

  test('retorna días para fechas pasadas', () => {
    const hace2d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(tiempoRelativo(hace2d)).toBe('hace 2 días')
  })

  test('singular para 1 día', () => {
    const hace1d = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    expect(tiempoRelativo(hace1d)).toBe('hace 1 día')
  })
})

// ============================================
// Formateo de números
// ============================================
describe('formatearNumero', () => {
  test('formatea número con separador de miles', () => {
    const result = formatearNumero(1234567)
    // es-ES usa punto como separador de miles
    expect(result).toContain('1')
    expect(result).toContain('234')
  })

  test('retorna 0 para null', () => {
    expect(formatearNumero(null)).toBe('0')
  })

  test('retorna 0 para undefined', () => {
    expect(formatearNumero(undefined)).toBe('0')
  })
})

describe('formatearMoneda', () => {
  test('formatea como moneda colombiana', () => {
    const result = formatearMoneda(1000)
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  test('retorna $0 para null', () => {
    expect(formatearMoneda(null)).toBe('$0')
  })

  test('retorna $0 para undefined', () => {
    expect(formatearMoneda(undefined)).toBe('$0')
  })
})

// ============================================
// Estados
// ============================================
describe('obtenerColoresEstado', () => {
  test('retorna colores para estado bueno', () => {
    const colores = obtenerColoresEstado('bueno')
    expect(colores.bg).toContain('green')
  })

  test('retorna colores por defecto para estado desconocido', () => {
    const colores = obtenerColoresEstado('inexistente')
    expect(colores).toBeTruthy()
  })
})

describe('obtenerLabelEstado', () => {
  test('retorna label para estado bueno', () => {
    expect(obtenerLabelEstado('bueno')).toContain('Bueno')
  })

  test('retorna el mismo string si no tiene label', () => {
    expect(obtenerLabelEstado('custom')).toBe('custom')
  })
})

// ============================================
// Validaciones
// ============================================
describe('validarEmail', () => {
  test('acepta email válido', () => {
    expect(validarEmail('test@email.com')).toBe(true)
  })

  test('rechaza email sin @', () => {
    expect(validarEmail('testemail.com')).toBe(false)
  })

  test('rechaza email sin dominio', () => {
    expect(validarEmail('test@')).toBe(false)
  })

  test('rechaza email con espacios', () => {
    expect(validarEmail('test @email.com')).toBe(false)
  })
})

describe('validarSerie', () => {
  test('acepta serie válida', () => {
    expect(validarSerie('ABC-123')).toBe(true)
  })

  test('rechaza serie menor a 3 caracteres', () => {
    expect(validarSerie('AB')).toBe(false)
  })

  test('rechaza serie con caracteres especiales', () => {
    expect(validarSerie('ABC@123')).toBe(false)
  })
})

describe('validarPositivo', () => {
  test('acepta número positivo', () => {
    expect(validarPositivo(5)).toBe(true)
  })

  test('rechaza cero', () => {
    expect(validarPositivo(0)).toBe(false)
  })

  test('rechaza negativo', () => {
    expect(validarPositivo(-1)).toBe(false)
  })
})

// ============================================
// Strings
// ============================================
describe('capitalizar', () => {
  test('capitaliza primera letra', () => {
    expect(capitalizar('hola mundo')).toBe('Hola mundo')
  })

  test('retorna vacío para null', () => {
    expect(capitalizar(null)).toBe('')
  })

  test('retorna vacío para string vacío', () => {
    expect(capitalizar('')).toBe('')
  })
})

describe('truncar', () => {
  test('trunca texto largo', () => {
    const texto = 'a'.repeat(60)
    expect(truncar(texto, 50)).toBe('a'.repeat(50) + '...')
  })

  test('no trunca texto corto', () => {
    expect(truncar('Hola', 50)).toBe('Hola')
  })

  test('retorna vacío para null', () => {
    expect(truncar(null)).toBe('')
  })

  test('usa longitud 50 por defecto', () => {
    const texto = 'a'.repeat(60)
    expect(truncar(texto)).toBe('a'.repeat(50) + '...')
  })
})

describe('generarSlug', () => {
  test('genera slug de texto simple', () => {
    expect(generarSlug('Hola Mundo')).toBe('hola-mundo')
  })

  test('elimina acentos', () => {
    expect(generarSlug('Categoría Única')).toBe('categoria-unica')
  })

  test('elimina caracteres especiales', () => {
    expect(generarSlug('Hola! @Mundo#')).toBe('hola-mundo')
  })

  test('retorna vacío para null', () => {
    expect(generarSlug(null)).toBe('')
  })
})

// ============================================
// Arrays
// ============================================
describe('agruparPor', () => {
  test('agrupa por propiedad', () => {
    const items = [
      { tipo: 'A', nombre: '1' },
      { tipo: 'B', nombre: '2' },
      { tipo: 'A', nombre: '3' }
    ]
    const result = agruparPor(items, 'tipo')
    expect(result.A).toHaveLength(2)
    expect(result.B).toHaveLength(1)
  })
})

describe('ordenarPor', () => {
  test('ordena ascendente', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }]
    const result = ordenarPor(items, 'n', 'asc')
    expect(result.map(i => i.n)).toEqual([1, 2, 3])
  })

  test('ordena descendente', () => {
    const items = [{ n: 1 }, { n: 3 }, { n: 2 }]
    const result = ordenarPor(items, 'n', 'desc')
    expect(result.map(i => i.n)).toEqual([3, 2, 1])
  })

  test('no modifica array original', () => {
    const items = [{ n: 3 }, { n: 1 }]
    ordenarPor(items, 'n')
    expect(items[0].n).toBe(3) // sin cambiar
  })
})

// ============================================
// Búsqueda
// ============================================
describe('filtrarPorBusqueda', () => {
  const items = [
    { nombre: 'Carpa Grande', tipo: 'carpa' },
    { nombre: 'Mesa Redonda', tipo: 'mobiliario' },
    { nombre: 'Silla Plástica', tipo: 'mobiliario' }
  ]

  test('filtra por nombre por defecto', () => {
    const result = filtrarPorBusqueda(items, 'carpa')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Carpa Grande')
  })

  test('filtra por múltiples campos', () => {
    const result = filtrarPorBusqueda(items, 'mobiliario', ['nombre', 'tipo'])
    expect(result).toHaveLength(2)
  })

  test('retorna todos si búsqueda es vacía', () => {
    expect(filtrarPorBusqueda(items, '')).toHaveLength(3)
  })

  test('búsqueda case-insensitive', () => {
    expect(filtrarPorBusqueda(items, 'CARPA')).toHaveLength(1)
  })
})

// ============================================
// Cálculos
// ============================================
describe('calcularPorcentaje', () => {
  test('calcula porcentaje correctamente', () => {
    expect(calcularPorcentaje(50, 200)).toBe(25)
  })

  test('retorna 0 si total es 0', () => {
    expect(calcularPorcentaje(50, 0)).toBe(0)
  })

  test('retorna 0 si total es null', () => {
    expect(calcularPorcentaje(50, null)).toBe(0)
  })
})

describe('sumarPropiedad', () => {
  test('suma propiedad correctamente', () => {
    const items = [{ precio: 100 }, { precio: 200 }, { precio: 300 }]
    expect(sumarPropiedad(items, 'precio')).toBe(600)
  })

  test('ignora valores faltantes', () => {
    const items = [{ precio: 100 }, { otro: 200 }, { precio: 300 }]
    expect(sumarPropiedad(items, 'precio')).toBe(400)
  })
})

// ============================================
// Error handling
// ============================================
describe('obtenerMensajeError', () => {
  test('extrae mensaje de respuesta API', () => {
    const error = { response: { data: { message: 'No autorizado' } } }
    expect(obtenerMensajeError(error)).toBe('No autorizado')
  })

  test('usa error.message como fallback', () => {
    const error = { message: 'Network error' }
    expect(obtenerMensajeError(error)).toBe('Network error')
  })

  test('retorna mensaje genérico como último recurso', () => {
    expect(obtenerMensajeError({})).toBe('Ocurrió un error inesperado')
  })
})
