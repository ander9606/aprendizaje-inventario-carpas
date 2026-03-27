const {
    validateRequired,
    validateNombre,
    validateEmoji,
    validateDescripcion,
    validateCantidad,
    validatePrecio,
    validateId,
    validateEstado,
    validateTipoUbicacion,
    validateTipoUnidad,
    validateEnum,
    validateBoolean,
    validateTerminoBusqueda,
    validatePaginacion
} = require('../validators');

// ============================================
// validateRequired: campo obligatorio
// ============================================
describe('validateRequired', () => {
    test('acepta valores válidos', () => {
        expect(validateRequired('hola', 'campo')).toBe('hola');
        expect(validateRequired(0, 'campo')).toBe(0);
        expect(validateRequired(false, 'campo')).toBe(false);
    });

    test('rechaza null, undefined y vacío', () => {
        expect(() => validateRequired(null, 'campo')).toThrow();
        expect(() => validateRequired(undefined, 'campo')).toThrow();
        expect(() => validateRequired('', 'campo')).toThrow();
    });

    test('rechaza strings de solo espacios', () => {
        expect(() => validateRequired('   ', 'campo')).toThrow();
    });
});

// ============================================
// validateNombre: entre 3-50 caracteres
// ============================================
describe('validateNombre', () => {
    test('acepta nombres válidos (3-50 chars)', () => {
        expect(validateNombre('Ana')).toBe('Ana');
        expect(validateNombre('  Mesa grande  ')).toBe('Mesa grande');
    });

    test('rechaza nombres muy cortos (<3)', () => {
        expect(() => validateNombre('ab')).toThrow(/al menos 3/);
    });

    test('rechaza nombres muy largos (>50)', () => {
        expect(() => validateNombre('a'.repeat(51))).toThrow(/máximo 50/);
    });

    test('rechaza valores no-string', () => {
        expect(() => validateNombre(123)).toThrow(/cadena de texto/);
    });
});

// ============================================
// validateEmoji: opcional, 1-10 chars
// ============================================
describe('validateEmoji', () => {
    test('retorna null si no hay emoji', () => {
        expect(validateEmoji(null)).toBeNull();
        expect(validateEmoji('')).toBeNull();
    });

    test('acepta emojis válidos', () => {
        expect(validateEmoji('🏕️')).toBe('🏕️');
    });

    test('rechaza valor no-string', () => {
        expect(() => validateEmoji(123)).toThrow();
    });
});

// ============================================
// validateDescripcion: opcional, max 500
// ============================================
describe('validateDescripcion', () => {
    test('retorna null si vacío', () => {
        expect(validateDescripcion(null)).toBeNull();
        expect(validateDescripcion('')).toBeNull();
    });

    test('acepta descripción válida', () => {
        expect(validateDescripcion('Una carpa grande')).toBe('Una carpa grande');
    });

    test('rechaza descripción >500 chars', () => {
        expect(() => validateDescripcion('a'.repeat(501))).toThrow(/máximo 500/);
    });
});

// ============================================
// validateCantidad: entero >= 0, <= 999999
// ============================================
describe('validateCantidad', () => {
    test('acepta enteros válidos', () => {
        expect(validateCantidad(0)).toBe(0);
        expect(validateCantidad(100)).toBe(100);
        expect(validateCantidad('50')).toBe(50);
    });

    test('rechaza decimales', () => {
        expect(() => validateCantidad(3.5)).toThrow(/entero/);
    });

    test('rechaza negativos', () => {
        expect(() => validateCantidad(-1)).toThrow(/mayor o igual/);
    });

    test('rechaza mayores a 999999', () => {
        expect(() => validateCantidad(1000000)).toThrow(/menor o igual/);
    });

    test('retorna null si no es requerido y no hay valor', () => {
        expect(validateCantidad(null, 'Cantidad', false)).toBeNull();
    });

    test('rechaza texto no numérico', () => {
        expect(() => validateCantidad('abc')).toThrow(/número/);
    });
});

// ============================================
// validatePrecio: decimal >= 0, <= 9999999.99
// ============================================
describe('validatePrecio', () => {
    test('acepta precios válidos y redondea a 2 decimales', () => {
        expect(validatePrecio(100)).toBe(100);
        expect(validatePrecio(99.999)).toBe(100);
        expect(validatePrecio('50.5')).toBe(50.5);
    });

    test('retorna null si no es requerido y no hay valor', () => {
        expect(validatePrecio(null)).toBeNull();
        expect(validatePrecio('')).toBeNull();
    });

    test('rechaza texto no numérico', () => {
        expect(() => validatePrecio('abc', true)).toThrow(/número/);
    });

    test('rechaza precios negativos', () => {
        // PRECIO_MIN es 0
        expect(() => validatePrecio(-1, true)).toThrow(/mayor o igual/);
    });
});

// ============================================
// validateId: entero positivo > 0
// ============================================
describe('validateId', () => {
    test('acepta IDs válidos', () => {
        expect(validateId(1)).toBe(1);
        expect(validateId('42')).toBe(42);
    });

    test('rechaza 0, negativos y decimales', () => {
        expect(() => validateId(0)).toThrow(/entero positivo/);
        expect(() => validateId(-5)).toThrow(/entero positivo/);
        expect(() => validateId(1.5)).toThrow(/entero positivo/);
    });

    test('rechaza texto', () => {
        expect(() => validateId('abc')).toThrow(/entero positivo/);
    });
});

// ============================================
// validateEstado: solo valores permitidos
// ============================================
describe('validateEstado', () => {
    test('acepta estados válidos', () => {
        expect(validateEstado('bueno')).toBe('bueno');
        expect(validateEstado('dañado')).toBe('dañado');
        expect(validateEstado('mantenimiento')).toBe('mantenimiento');
        expect(validateEstado('alquilado')).toBe('alquilado');
    });

    test('rechaza estados inventados', () => {
        expect(() => validateEstado('roto')).toThrow(/inválido/);
    });

    test('retorna null si no requerido y vacío', () => {
        expect(validateEstado(null, false)).toBeNull();
    });
});

// ============================================
// validateTipoUbicacion: solo valores permitidos
// ============================================
describe('validateTipoUbicacion', () => {
    test('acepta tipos válidos', () => {
        expect(validateTipoUbicacion('bodega')).toBe('bodega');
        expect(validateTipoUbicacion('finca')).toBe('finca');
    });

    test('rechaza tipos inventados', () => {
        expect(() => validateTipoUbicacion('garage')).toThrow(/inválido/);
    });
});

// ============================================
// validateTipoUnidad: solo valores permitidos
// ============================================
describe('validateTipoUnidad', () => {
    test('acepta tipos válidos', () => {
        expect(validateTipoUnidad('longitud')).toBe('longitud');
        expect(validateTipoUnidad('peso')).toBe('peso');
    });

    test('retorna null si no requerido y vacío', () => {
        expect(validateTipoUnidad(null)).toBeNull();
    });

    test('rechaza tipos inventados', () => {
        expect(() => validateTipoUnidad('temperatura', true)).toThrow(/inválido/);
    });
});

// ============================================
// validateEnum: valor en lista personalizada
// ============================================
describe('validateEnum', () => {
    test('acepta valor en la lista', () => {
        expect(validateEnum('rojo', ['rojo', 'azul', 'verde'], 'Color')).toBe('rojo');
    });

    test('rechaza valor fuera de la lista', () => {
        expect(() => validateEnum('morado', ['rojo', 'azul'], 'Color')).toThrow(/inválido/);
    });
});

// ============================================
// validateBoolean
// ============================================
describe('validateBoolean', () => {
    test('acepta true/false', () => {
        expect(validateBoolean(true, 'activo')).toBe(true);
        expect(validateBoolean(false, 'activo')).toBe(false);
    });

    test('retorna null si no requerido y sin valor', () => {
        expect(validateBoolean(null, 'activo')).toBeNull();
        expect(validateBoolean(undefined, 'activo')).toBeNull();
    });

    test('rechaza strings y números', () => {
        expect(() => validateBoolean('true', 'activo', true)).toThrow(/verdadero o falso/);
        expect(() => validateBoolean(1, 'activo', true)).toThrow(/verdadero o falso/);
    });
});

// ============================================
// validateTerminoBusqueda: 2-100 chars
// ============================================
describe('validateTerminoBusqueda', () => {
    test('acepta búsquedas válidas', () => {
        expect(validateTerminoBusqueda('carpa')).toBe('carpa');
    });

    test('rechaza búsquedas muy cortas (<2)', () => {
        expect(() => validateTerminoBusqueda('a')).toThrow();
    });

    test('rechaza búsquedas muy largas (>100)', () => {
        expect(() => validateTerminoBusqueda('a'.repeat(101))).toThrow();
    });
});

// ============================================
// validatePaginacion: page y limit seguros
// ============================================
describe('validatePaginacion', () => {
    test('retorna defaults si no hay parámetros', () => {
        const result = validatePaginacion({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
    });

    test('calcula offset correctamente', () => {
        const result = validatePaginacion({ page: '3', limit: '10' });
        expect(result.page).toBe(3);
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(20);  // (3-1) * 10
    });

    test('corrige page < 1', () => {
        const result = validatePaginacion({ page: '-1' });
        expect(result.page).toBe(1);
    });

    test('limita limit al máximo (100)', () => {
        const result = validatePaginacion({ limit: '500' });
        expect(result.limit).toBe(100);
    });
});
