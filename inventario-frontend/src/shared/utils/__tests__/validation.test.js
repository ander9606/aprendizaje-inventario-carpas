/**
 * Tests para shared/utils/validation.js
 * Reglas de validación de React Hook Form
 */

import { categoriaValidation } from '../validation'
import validations from '../validation'

describe('categoriaValidation', () => {
  describe('nombre', () => {
    test('es requerido', () => {
      expect(categoriaValidation.nombre.required.value).toBe(true)
    })

    test('mínimo 3 caracteres', () => {
      expect(categoriaValidation.nombre.minLength.value).toBe(3)
    })

    test('máximo 50 caracteres', () => {
      expect(categoriaValidation.nombre.maxLength.value).toBe(50)
    })

    test('acepta letras, números y espacios', () => {
      const pattern = categoriaValidation.nombre.pattern.value
      expect(pattern.test('Carpas 3x3')).toBe(true)
      expect(pattern.test('Categoría')).toBe(true)
    })

    test('rechaza caracteres especiales', () => {
      const pattern = categoriaValidation.nombre.pattern.value
      expect(pattern.test('Test@#$')).toBe(false)
      expect(pattern.test('Test!')).toBe(false)
    })
  })

  describe('icono', () => {
    test('no es requerido', () => {
      expect(categoriaValidation.icono.required).toBe(false)
    })

    test('máximo 10 caracteres', () => {
      expect(categoriaValidation.icono.maxLength.value).toBe(10)
    })
  })

  describe('descripcion', () => {
    test('no es requerida', () => {
      expect(categoriaValidation.descripcion.required).toBe(false)
    })

    test('máximo 200 caracteres', () => {
      expect(categoriaValidation.descripcion.maxLength.value).toBe(200)
    })
  })
})

describe('default export', () => {
  test('exporta validaciones agrupadas', () => {
    expect(validations.categoria).toBe(categoriaValidation)
  })
})
