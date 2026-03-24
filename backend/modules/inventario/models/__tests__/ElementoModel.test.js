/**
 * Tests para ElementoModel
 *
 * Mockeamos pool.query para NO necesitar MySQL.
 * Verificamos que cada método:
 *  1. Construye el SQL correcto (JOINs, WHERE, ORDER, LIMIT)
 *  2. Pasa parámetros seguros (prepared statements)
 *  3. Retorna datos en el formato esperado
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));

const ElementoModel = require('../ElementoModel');
const { pool } = require('../../../../config/database');

afterEach(() => jest.clearAllMocks());

// ============================================
// obtenerTodos: lista completa con JOINs
// ============================================
describe('obtenerTodos', () => {
    test('retorna todos los elementos con categoría, material y unidad', async () => {
        const mockRows = [
            { id: 1, nombre: 'Carpa 3x3', categoria_nombre: 'Carpas', material: 'Lona' }
        ];
        pool.query.mockResolvedValue([mockRows]);

        const result = await ElementoModel.obtenerTodos();

        expect(result).toEqual(mockRows);
        const sql = pool.query.mock.calls[0][0];
        // Verifica que hace JOIN con categorías, materiales y unidades
        expect(sql).toContain('LEFT JOIN categorias c');
        expect(sql).toContain('LEFT JOIN materiales m');
        expect(sql).toContain('LEFT JOIN unidades u');
    });
});

// ============================================
// obtenerPorId: busca por ID, retorna null si no existe
// ============================================
describe('obtenerPorId', () => {
    test('retorna el elemento encontrado', async () => {
        const mock = { id: 5, nombre: 'Mesa plegable' };
        pool.query.mockResolvedValue([[mock]]);

        const result = await ElementoModel.obtenerPorId(5);

        expect(result).toEqual(mock);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.id = ?'), [5]);
    });

    test('retorna null si no existe', async () => {
        pool.query.mockResolvedValue([[]]);

        const result = await ElementoModel.obtenerPorId(999);

        expect(result).toBeNull();
    });
});

// ============================================
// crear: INSERT con 13 campos parametrizados
// ============================================
describe('crear', () => {
    test('ejecuta INSERT y retorna insertId', async () => {
        pool.query.mockResolvedValue([{ insertId: 100 }]);

        const id = await ElementoModel.crear({
            nombre: 'Silla plástica',
            descripcion: 'Silla blanca plegable',
            cantidad: 50,
            stock_minimo: 10,
            costo_adquisicion: 15000,
            precio_unitario: 5000,
            requiere_series: false,
            categoria_id: 2,
            material_id: 1,
            unidad_id: null,
            estado: 'bueno',
            ubicacion: 'Bodega principal',
            fecha_ingreso: '2024-01-15'
        });

        expect(id).toBe(100);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO elementos'),
            expect.any(Array)
        );
        // Verifica que pasa 13 valores (uno por cada campo)
        expect(pool.query.mock.calls[0][1]).toHaveLength(13);
    });

    test('convierte campos opcionales vacíos a null', async () => {
        pool.query.mockResolvedValue([{ insertId: 101 }]);

        await ElementoModel.crear({
            nombre: 'Test',
            descripcion: '',
            cantidad: undefined,
            stock_minimo: undefined,
            costo_adquisicion: '',
            precio_unitario: '',
            requiere_series: false,
            categoria_id: '',
            material_id: '',
            unidad_id: '',
            estado: '',
            ubicacion: '',
            fecha_ingreso: ''
        });

        const params = pool.query.mock.calls[0][1];
        expect(params[1]).toBeNull();  // descripcion vacía → null
        expect(params[4]).toBeNull();  // costo_adquisicion vacío → null
        expect(params[5]).toBeNull();  // precio_unitario vacío → null
        expect(params[7]).toBeNull();  // categoria_id vacío → null
    });

    test('requiere_series acepta true, 1 y "1"', async () => {
        pool.query.mockResolvedValue([{ insertId: 1 }]);

        // Con true
        await ElementoModel.crear({ nombre: 'A', requiere_series: true });
        expect(pool.query.mock.calls[0][1][6]).toBe(true);

        // Con 1
        await ElementoModel.crear({ nombre: 'B', requiere_series: 1 });
        expect(pool.query.mock.calls[1][1][6]).toBe(true);

        // Con '1'
        await ElementoModel.crear({ nombre: 'C', requiere_series: '1' });
        expect(pool.query.mock.calls[2][1][6]).toBe(true);

        // Con false
        await ElementoModel.crear({ nombre: 'D', requiere_series: false });
        expect(pool.query.mock.calls[3][1][6]).toBe(false);
    });
});

// ============================================
// actualizar: UPDATE con WHERE id = ?
// ============================================
describe('actualizar', () => {
    test('ejecuta UPDATE y retorna affectedRows', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const rows = await ElementoModel.actualizar(5, {
            nombre: 'Silla editada',
            descripcion: 'Descripción nueva',
            cantidad: 30,
            stock_minimo: 5,
            costo_adquisicion: 12000,
            precio_unitario: 4000,
            requiere_series: false,
            categoria_id: 2,
            material_id: 1,
            unidad_id: null,
            estado: 'bueno',
            ubicacion: 'Bodega',
            fecha_ingreso: '2024-06-01'
        });

        expect(rows).toBe(1);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('UPDATE elementos');
        expect(sql).toContain('WHERE id = ?');
        // El último parámetro debe ser el ID
        const params = pool.query.mock.calls[0][1];
        expect(params[params.length - 1]).toBe(5);
    });
});

// ============================================
// eliminar: DELETE con WHERE id = ?
// ============================================
describe('eliminar', () => {
    test('ejecuta DELETE y retorna affectedRows', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const rows = await ElementoModel.eliminar(5);

        expect(rows).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
            'DELETE FROM elementos WHERE id = ?',
            [5]
        );
    });

    test('retorna 0 si el ID no existía', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 0 }]);

        const rows = await ElementoModel.eliminar(999);

        expect(rows).toBe(0);
    });
});

// ============================================
// obtenerConPaginacion: LIMIT/OFFSET + search + sort
// ============================================
describe('obtenerConPaginacion', () => {
    test('aplica LIMIT y OFFSET como números', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion({ limit: 10, offset: 20 });

        const params = pool.query.mock.calls[0][1];
        // Los dos últimos params son limit y offset como Number
        expect(params[params.length - 2]).toBe(10);
        expect(params[params.length - 1]).toBe(20);
    });

    test('agrega WHERE LIKE cuando hay búsqueda', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion({ limit: 20, offset: 0, search: 'carpa' });

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('WHERE e.nombre LIKE ?');
        expect(pool.query.mock.calls[0][1][0]).toBe('%carpa%');
    });

    test('usa campo mapeado para sortBy, previene SQL injection', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion({
            limit: 20, offset: 0,
            sortBy: 'DROP TABLE', // intento de inyección
            order: 'ASC'
        });

        const sql = pool.query.mock.calls[0][0];
        // Debe usar 'e.nombre' como fallback (campo por defecto)
        expect(sql).toContain('ORDER BY e.nombre ASC');
    });

    test('valida que order solo sea ASC o DESC', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion({
            limit: 20, offset: 0,
            order: 'INVALID; DROP TABLE--'
        });

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('ASC'); // fallback a ASC
        expect(sql).not.toContain('INVALID');
    });
});

// ============================================
// contarTodos: COUNT para paginación
// ============================================
describe('contarTodos', () => {
    test('retorna total sin filtro', async () => {
        pool.query.mockResolvedValue([[{ total: 150 }]]);

        const result = await ElementoModel.contarTodos();

        expect(result).toBe(150);
    });

    test('filtra por búsqueda', async () => {
        pool.query.mockResolvedValue([[{ total: 5 }]]);

        await ElementoModel.contarTodos('silla');

        expect(pool.query.mock.calls[0][1]).toEqual(['%silla%']);
    });
});

// ============================================
// existe: verificación rápida por ID
// ============================================
describe('existe', () => {
    test('retorna true si encuentra el ID', async () => {
        pool.query.mockResolvedValue([[{ id: 5 }]]);

        const result = await ElementoModel.existe(5);

        expect(result).toBe(true);
    });

    test('retorna false si no lo encuentra', async () => {
        pool.query.mockResolvedValue([[]]);

        const result = await ElementoModel.existe(999);

        expect(result).toBe(false);
    });
});

// ============================================
// buscarPorNombre: búsqueda con LIKE
// ============================================
describe('buscarPorNombre', () => {
    test('busca con LIKE y parámetro seguro', async () => {
        pool.query.mockResolvedValue([[{ id: 1, nombre: 'Carpa 3x3' }]]);

        const result = await ElementoModel.buscarPorNombre('carpa');

        expect(result).toHaveLength(1);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE e.nombre LIKE ?'),
            ['%carpa%']
        );
    });
});

// ============================================
// contarPorCategoria: usado para validar antes de borrar categoría
// ============================================
describe('contarPorCategoria', () => {
    test('retorna cantidad de elementos en una categoría', async () => {
        pool.query.mockResolvedValue([[{ total: 12 }]]);

        const result = await ElementoModel.contarPorCategoria(3);

        expect(result).toBe(12);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE categoria_id = ?'),
            [3]
        );
    });
});

// ============================================
// actualizarImagen: UPDATE solo del campo imagen
// ============================================
describe('actualizarImagen', () => {
    test('actualiza solo el campo imagen', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const rows = await ElementoModel.actualizarImagen(5, '/uploads/carpa.jpg');

        expect(rows).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
            'UPDATE elementos SET imagen = ? WHERE id = ?',
            ['/uploads/carpa.jpg', 5]
        );
    });
});
