/**
 * Tests para CategoriaModel
 *
 * Mockeamos pool.query para NO necesitar base de datos real.
 * Cada test verifica que el modelo:
 *  1. Llama a pool.query con el SQL y parámetros correctos
 *  2. Retorna los datos en el formato esperado
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));

const CategoriaModel = require('../CategoriaModel');
const { pool } = require('../../../../config/database');

// Limpiar mocks entre tests para que no se contaminen
afterEach(() => jest.clearAllMocks());

// ============================================
// obtenerTodas: lista completa con JOINs
// ============================================
describe('obtenerTodas', () => {
    test('ejecuta SELECT con JOIN a categoría padre y retorna rows', async () => {
        const mockRows = [
            { id: 1, nombre: 'Carpas', emoji: '⛺', padre_id: null },
            { id: 2, nombre: 'Carpas pequeñas', emoji: null, padre_id: 1 }
        ];
        pool.query.mockResolvedValue([mockRows]);

        const result = await CategoriaModel.obtenerTodas();

        expect(result).toEqual(mockRows);
        expect(pool.query).toHaveBeenCalledTimes(1);
        // Verifica que el SQL incluye el JOIN con la tabla padre
        expect(pool.query.mock.calls[0][0]).toContain('LEFT JOIN categorias padre');
    });
});

// ============================================
// obtenerPadres: solo categorías raíz (padre_id IS NULL)
// ============================================
describe('obtenerPadres', () => {
    test('filtra por padre_id IS NULL', async () => {
        pool.query.mockResolvedValue([[{ id: 1, nombre: 'Carpas' }]]);

        const result = await CategoriaModel.obtenerPadres();

        expect(result).toHaveLength(1);
        expect(pool.query.mock.calls[0][0]).toContain('padre_id IS NULL');
    });
});

// ============================================
// obtenerPorId: busca por ID con parámetro seguro (?)
// ============================================
describe('obtenerPorId', () => {
    test('retorna la categoría encontrada', async () => {
        const mockCategoria = { id: 5, nombre: 'Sillas', emoji: '🪑' };
        pool.query.mockResolvedValue([[mockCategoria]]);

        const result = await CategoriaModel.obtenerPorId(5);

        expect(result).toEqual(mockCategoria);
        // Verifica que pasa el ID como parámetro (prepared statement, no concatenación)
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE c.id = ?'), [5]);
    });

    test('retorna undefined si no existe', async () => {
        pool.query.mockResolvedValue([[]]);

        const result = await CategoriaModel.obtenerPorId(999);

        expect(result).toBeUndefined();
    });
});

// ============================================
// obtenerHijas: subcategorías de un padre
// ============================================
describe('obtenerHijas', () => {
    test('filtra por padre_id del parámetro', async () => {
        pool.query.mockResolvedValue([[
            { id: 10, nombre: 'Carpa 3x3', padre_id: 1 },
            { id: 11, nombre: 'Carpa 6x6', padre_id: 1 }
        ]]);

        const result = await CategoriaModel.obtenerHijas(1);

        expect(result).toHaveLength(2);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE padre_id = ?'), [1]);
    });
});

// ============================================
// crear: INSERT con valores parametrizados
// ============================================
describe('crear', () => {
    test('ejecuta INSERT con nombre, emoji y padre_id', async () => {
        pool.query.mockResolvedValue([{ insertId: 42 }]);

        const result = await CategoriaModel.crear({
            nombre: 'Mesas',
            emoji: '🪑',
            padre_id: null
        });

        expect(result.insertId).toBe(42);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO categorias'),
            ['Mesas', '🪑', null]
        );
    });

    test('convierte emoji y padre_id vacíos a null', async () => {
        pool.query.mockResolvedValue([{ insertId: 43 }]);

        await CategoriaModel.crear({ nombre: 'Test', emoji: '', padre_id: '' });

        // El segundo y tercer parámetro deben ser null (por el || null)
        const params = pool.query.mock.calls[0][1];
        expect(params[1]).toBeNull(); // emoji
        expect(params[2]).toBeNull(); // padre_id
    });
});

// ============================================
// actualizar: UPDATE con WHERE id = ?
// ============================================
describe('actualizar', () => {
    test('ejecuta UPDATE con los datos correctos', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const result = await CategoriaModel.actualizar(5, {
            nombre: 'Carpas Editada',
            emoji: '⛺',
            padre_id: null
        });

        expect(result.affectedRows).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE categorias'),
            ['Carpas Editada', '⛺', null, 5] // último param es el ID en WHERE
        );
    });
});

// ============================================
// eliminar: DELETE con WHERE id = ?
// ============================================
describe('eliminar', () => {
    test('ejecuta DELETE y retorna affectedRows', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const result = await CategoriaModel.eliminar(5);

        expect(result.affectedRows).toBe(1);
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM categorias WHERE id = ?', [5]);
    });

    test('retorna 0 si el ID no existía', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 0 }]);

        const result = await CategoriaModel.eliminar(999);

        expect(result.affectedRows).toBe(0);
    });
});

// ============================================
// tieneSubcategorias: verifica dependencias antes de borrar
// ============================================
describe('tieneSubcategorias', () => {
    test('retorna true si tiene hijas', async () => {
        pool.query.mockResolvedValue([[{ total: 3 }]]);

        const result = await CategoriaModel.tieneSubcategorias(1);

        expect(result).toBe(true);
    });

    test('retorna false si no tiene hijas', async () => {
        pool.query.mockResolvedValue([[{ total: 0 }]]);

        const result = await CategoriaModel.tieneSubcategorias(1);

        expect(result).toBe(false);
    });
});

// ============================================
// tieneElementos: verifica elementos directos + en subcategorías
// ============================================
describe('tieneElementos', () => {
    test('retorna true si tiene elementos directos', async () => {
        // Primera query: COUNT elementos directos
        pool.query.mockResolvedValueOnce([[{ total: 2 }]]);
        // Segunda query: subcategorías
        pool.query.mockResolvedValueOnce([[]]);

        const result = await CategoriaModel.tieneElementos(1);

        expect(result).toBe(true);
    });

    test('retorna true si una subcategoría tiene elementos', async () => {
        // Primera query: 0 elementos directos
        pool.query.mockResolvedValueOnce([[{ total: 0 }]]);
        // Segunda query: tiene subcategoría id=10
        pool.query.mockResolvedValueOnce([[{ id: 10 }]]);
        // Tercera query: la subcategoría 10 tiene 5 elementos
        pool.query.mockResolvedValueOnce([[{ total: 5 }]]);

        const result = await CategoriaModel.tieneElementos(1);

        expect(result).toBe(true);
    });

    test('retorna false si ni ella ni sus hijas tienen elementos', async () => {
        pool.query.mockResolvedValueOnce([[{ total: 0 }]]);
        pool.query.mockResolvedValueOnce([[{ id: 10 }]]);
        pool.query.mockResolvedValueOnce([[{ total: 0 }]]);

        const result = await CategoriaModel.tieneElementos(1);

        expect(result).toBe(false);
    });
});

// ============================================
// obtenerConPaginacion: LIMIT/OFFSET + búsqueda + orden
// ============================================
describe('obtenerConPaginacion', () => {
    test('aplica LIMIT y OFFSET', async () => {
        pool.query.mockResolvedValue([[]]);

        await CategoriaModel.obtenerConPaginacion({ limit: 10, offset: 20 });

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('LIMIT ? OFFSET ?');
        const params = pool.query.mock.calls[0][1];
        expect(params).toContain(10);
        expect(params).toContain(20);
    });

    test('agrega WHERE LIKE cuando hay búsqueda', async () => {
        pool.query.mockResolvedValue([[]]);

        await CategoriaModel.obtenerConPaginacion({ limit: 20, offset: 0, search: 'carpa' });

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('WHERE c.nombre LIKE ?');
        expect(pool.query.mock.calls[0][1][0]).toBe('%carpa%');
    });

    test('usa campo de orden válido, ignora campos peligrosos', async () => {
        pool.query.mockResolvedValue([[]]);

        await CategoriaModel.obtenerConPaginacion({
            limit: 20, offset: 0,
            sortBy: 'DROP TABLE', // intento de inyección
            order: 'ASC'
        });

        const sql = pool.query.mock.calls[0][0];
        // Debe usar 'nombre' como fallback porque 'DROP TABLE' no está en validSortFields
        expect(sql).toContain('ORDER BY c.nombre ASC');
    });
});

// ============================================
// contarTodas: COUNT para paginación
// ============================================
describe('contarTodas', () => {
    test('retorna total sin filtro', async () => {
        pool.query.mockResolvedValue([[{ total: 45 }]]);

        const result = await CategoriaModel.contarTodas();

        expect(result).toBe(45);
    });

    test('filtra por búsqueda si se proporciona', async () => {
        pool.query.mockResolvedValue([[{ total: 3 }]]);

        await CategoriaModel.contarTodas('mesa');

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('WHERE nombre LIKE ?');
        expect(pool.query.mock.calls[0][1]).toEqual(['%mesa%']);
    });
});
