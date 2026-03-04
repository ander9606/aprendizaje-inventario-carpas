// ============================================
// VALIDACIONES DE FORMULARIOS
// Reglas de validación reutilizables
// ============================================

/**
 * EXPLICACIÓN:
 * 
 * Este archivo contiene todas las reglas de validación
 * para los formularios de la aplicación.
 * 
 * Usamos el formato de React Hook Form:
 * - required: campo obligatorio
 * - minLength: longitud mínima
 * - maxLength: longitud máxima
 * - pattern: expresión regular
 * - validate: función personalizada
 */

// ============================================
// VALIDACIONES PARA CATEGORÍAS
// ============================================

/**
 * Reglas de validación para categorías y subcategorías
 * 
 * @example
 * const { register } = useForm()
 * <input {...register('nombre', categoriaValidation.nombre)} />
 */
export const categoriaValidation = {
  nombre: {
    required: {
      value: true,
      message: 'El nombre es obligatorio'
    },
    minLength: {
      value: 3,
      message: 'El nombre debe tener al menos 3 caracteres'
    },
    maxLength: {
      value: 50,
      message: 'El nombre no puede tener más de 50 caracteres'
    },
    pattern: {
      value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/,
      message: 'El nombre solo puede contener letras, números y espacios'
    }
  },
  
  icono: {
    required: false,
    maxLength: {
      value: 10,
      message: 'El icono no puede tener más de 10 caracteres'
    }
  },
  
  descripcion: {
    required: false,
    maxLength: {
      value: 200,
      message: 'La descripción no puede tener más de 200 caracteres'
    }
  }
}

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================

/**
 * Objeto con todas las validaciones agrupadas
 * 
 * @example
 * import validations from './utils/validation'
 * 
 * const rules = validations.categoria.nombre
 */
export default {
  categoria: categoriaValidation
}

// ============================================
// NOTA: Validaciones futuras
// ============================================

/**
 * TODO: Agregar cuando se implementen estas features:
 * 
 * - elementoValidation: Para formularios de elementos (Nivel 3)
 * - serieValidation: Para elementos con número de serie
 * - loteValidation: Para movimientos de cantidades
 * - moverCantidadValidation: Para transferencias entre lotes
 * 
 * Se agregarán conforme se desarrollen esas funcionalidades.
 */