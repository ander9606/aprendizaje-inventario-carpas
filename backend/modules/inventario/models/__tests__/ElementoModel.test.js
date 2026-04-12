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

const T = 1; // tenantId

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

        const result = await ElementoModel.obtenerTodos(T);

        expect(result).toEqual(mockRows);
        const sql = pool.query.mock.calls[0][0];
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

        const result = await ElementoModel.obtenerPorId(T, 5);

        expect(result).toEqual(mock);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.id = ?'), [5, T]);
    });

    test('retorna null si no existe', async () => {
        pool.query.mockResolvedValue([[]]);

        const result = await ElementoModel.obtenerPorId(T, 999);

        expect(result).toBeNull();
    });
});

// ============================================
// crear: INSERT con 14 campos parametrizados (including tenant_id)
// ============================================
describe('crear', () => {
    test('ejecuta INSERT y retorna insertId', async () => {
        pool.query.mockResolvedValue([{ insertId: 100 }]);

        const id = await ElementoModel.crear(T, {
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
        // 14 valores: tenantId + 13 campos
        expect(pool.query.mock.calls[0][1]).toHaveLength(14);
    });

    test('convierte campos opcionales vacíos a null', async () => {
        pool.query.mockResolvedValue([{ insertId: 101 }]);

        await ElementoModel.crear(T, {
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
        // params[0] = tenantId, params[1] = nombre, params[2] = descripcion...
        expect(params[0]).toBe(T);        // tenantId
        expect(params[2]).toBeNull();     // descripcion vacía → null
        expect(params[5]).toBeNull();     // costo_adquisicion vacío → null
        expect(params[6]).toBeNull();     // precio_unitario vacío → null
        expect(params[8]).toBeNull();     // categoria_id vacío → null
    });

    test('requiere_series acepta true, 1 y "1"', async () => {
        pool.query.mockResolvedValue([{ insertId: 1 }]);

        // Con true
        await ElementoModel.crear(T, { nombre: 'A', requiere_series: true });
        expect(pool.query.mock.calls[0][1][7]).toBe(true);

        // Con 1
        await ElementoModel.crear(T, { nombre: 'B', requiere_series: 1 });
        expect(pool.query.mock.calls[1][1][7]).toBe(true);

        // Con '1'
        await ElementoModel.crear(T, { nombre: 'C', requiere_series: '1' });
        expect(pool.query.mock.calls[2][1][7]).toBe(true);

        // Con false
        await ElementoModel.crear(T, { nombre: 'D', requiere_series: false });
        expect(pool.query.mock.calls[3][1][7]).toBe(false);
    });
});

// ============================================
// actualizar: UPDATE con WHERE id = ? AND tenant_id = ?
// ============================================
describe('actualizar', () => {
    test('ejecuta UPDATE y retorna affectedRows', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const rows = await ElementoModel.actualizar(T, 5, {
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
        // Last two params: id and tenantId
        const params = pool.query.mock.calls[0][1];
        expect(params[params.length - 2]).toBe(5);
        expect(params[params.length - 1]).toBe(T);
    });
});

// ============================================
// eliminar: DELETE con WHERE id = ? AND tenant_id = ?
// ============================================
describe('eliminar', () => {
    test('ejecuta DELETE y retorna affectedRows', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const rows = await ElementoModel.eliminar(T, 5);

        expect(rows).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
            'DELETE FROM elementos WHERE id = ? AND tenant_id = ?',
            [5, T]
        );
    });

    test('retorna 0 si el ID no existía', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 0 }]);

        const rows = await ElementoModel.eliminar(T, 999);

        expect(rows).toBe(0);
    });
});

// ============================================
// obtenerConPaginacion: LIMIT/OFFSET + search + sort
// ============================================
describe('obtenerConPaginacion', () => {
    test('aplica LIMIT y OFFSET como números', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion(T, { limit: 10, offset: 20 });

        const params = pool.query.mock.calls[0][1];
        expect(params[params.length - 2]).toBe(10);
        expect(params[params.length - 1]).toBe(20);
    });

    test('agrega AND LIKE cuando hay búsqueda', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion(T, { limit: 20, offset: 0, search: 'carpa' });

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('AND e.nombre LIKE ?');
    });

    test('usa campo mapeado para sortBy, previene SQL injection', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion(T, {
            limit: 20, offset: 0,
            sortBy: 'DROP TABLE',
            order: 'ASC'
        });

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('ORDER BY e.nombre ASC');
    });

    test('valida que order solo sea ASC o DESC', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerConPaginacion(T, {
            limit: 20, offset: 0,
            order: 'INVALID; DROP TABLE--'
        });

        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('ASC');
        expect(sql).not.toContain('INVALID');
    });
});

// ============================================
// contarTodos: COUNT para paginación
// ============================================
describe('contarTodos', () => {
    test('retorna total sin filtro', async () => {
        pool.query.mockResolvedValue([[{ total: 150 }]]);

        const result = await ElementoModel.contarTodos(T);

        expect(result).toBe(150);
    });

    test('filtra por búsqueda', async () => {
        pool.query.mockResolvedValue([[{ total: 5 }]]);

        await ElementoModel.contarTodos(T, 'silla');

        expect(pool.query.mock.calls[0][1]).toEqual([T, '%silla%']);
    });
});

// ============================================
// existe: verificación rápida por ID
// ============================================
describe('existe', () => {
    test('retorna true si encuentra el ID', async () => {
        pool.query.mockResolvedValue([[{ id: 5 }]]);

        const result = await ElementoModel.existe(T, 5);

        expect(result).toBe(true);
    });

    test('retorna false si no lo encuentra', async () => {
        pool.query.mockResolvedValue([[]]);

        const result = await ElementoModel.existe(T, 999);

        expect(result).toBe(false);
    });
});

// ============================================
// buscarPorNombre: búsqueda con LIKE
// ============================================
describe('buscarPorNombre', () => {
    test('busca con LIKE y parámetro seguro', async () => {
        pool.query.mockResolvedValue([[{ id: 1, nombre: 'Carpa 3x3' }]]);

        const result = await ElementoModel.buscarPorNombre(T, 'carpa');

        expect(result).toHaveLength(1);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE e.nombre LIKE ?'),
            ['%carpa%', T]
        );
    });
});

// ============================================
// contarPorCategoria: usado para validar antes de borrar categoría
// ============================================
describe('contarPorCategoria', () => {
    test('retorna cantidad de elementos en una categoría', async () => {
        pool.query.mockResolvedValue([[{ total: 12 }]]);

        const result = await ElementoModel.contarPorCategoria(T, 3);

        expect(result).toBe(12);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE categoria_id = ?'),
            [3, T]
        );
    });
});

// ============================================
// actualizarImagen: UPDATE solo del campo imagen
// ============================================
describe('actualizarImagen', () => {
    test('actualiza solo el campo imagen', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        const rows = await ElementoModel.actualizarImagen(T, 5, '/uploads/carpa.jpg');

        expect(rows).toBe(1);
        expect(pool.query).toHaveBeenCalledWith(
            'UPDATE elementos SET imagen = ? WHERE id = ? AND tenant_id = ?',
            ['/uploads/carpa.jpg', 5, T]
        );
    });
});

// ============================================
// obtenerPorCategoria: elementos de una categoría + subcategorías
// ============================================
describe('obtenerPorCategoria', () => {
    test('busca en la categoría directa Y en subcategorías con subquery', async () => {
        const mockRows = [
            { id: 1, nombre: 'Carpa 3x3', categoria_id: 2 },
            { id: 2, nombre: 'Carpa 6x6', categoria_id: 5 }
        ];
        pool.query.mockResolvedValue([mockRows]);

        const result = await ElementoModel.obtenerPorCategoria(T, 2);

        expect(result).toHaveLength(2);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('e.categoria_id = ?');
        expect(sql).toContain('SELECT id FROM categorias WHERE padre_id = ?');
        expect(pool.query.mock.calls[0][1]).toEqual([T, 2, 2, T]);
    });
});

// ============================================
// obtenerPorSubcategoriaConInfo: elementos + datos de la subcategoría
// ============================================
describe('obtenerPorSubcategoriaConInfo', () => {
    test('ejecuta 2 queries y retorna { elementos, subcategoria }', async () => {
        const mockElementos = [{ id: 1, nombre: 'Carpa 3x3' }];
        const mockSubcat = { id: 5, nombre: 'Carpas pequeñas', padre_id: 2 };

        pool.query.mockResolvedValueOnce([mockElementos]);
        pool.query.mockResolvedValueOnce([[mockSubcat]]);

        const result = await ElementoModel.obtenerPorSubcategoriaConInfo(T, 5);

        expect(result.elementos).toEqual(mockElementos);
        expect(result.subcategoria).toEqual(mockSubcat);
        expect(pool.query).toHaveBeenCalledTimes(2);
    });

    test('retorna subcategoria null si no existe', async () => {
        pool.query.mockResolvedValueOnce([[]]);
        pool.query.mockResolvedValueOnce([[]]);

        const result = await ElementoModel.obtenerPorSubcategoriaConInfo(T, 999);

        expect(result.elementos).toEqual([]);
        expect(result.subcategoria).toBeNull();
    });
});

// ============================================
// obtenerDirectosPorCategoria: sin incluir subcategorías
// ============================================
describe('obtenerDirectosPorCategoria', () => {
    test('filtra SOLO por categoria_id directa (sin subquery IN)', async () => {
        pool.query.mockResolvedValue([[{ id: 1, nombre: 'Silla' }]]);

        const result = await ElementoModel.obtenerDirectosPorCategoria(T, 3);

        expect(result).toHaveLength(1);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('WHERE e.categoria_id = ?');
        expect(sql).not.toContain('padre_id');
    });
});

// ============================================
// obtenerConSeries: elementos que requieren series con COUNT
// ============================================
describe('obtenerConSeries', () => {
    test('filtra por requiere_series = TRUE con COUNT de series', async () => {
        const mockRows = [
            { id: 1, nombre: 'Carpa 3x3', total_series: 15 }
        ];
        pool.query.mockResolvedValue([mockRows]);

        const result = await ElementoModel.obtenerConSeries(T);

        expect(result).toEqual(mockRows);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('requiere_series = TRUE');
        expect(sql).toContain('COUNT(s.id) AS total_series');
        expect(sql).toContain('GROUP BY');
    });
});

// ============================================
// obtenerSinSeries: elementos por lotes (stock general)
// ============================================
describe('obtenerSinSeries', () => {
    test('filtra por requiere_series = FALSE', async () => {
        pool.query.mockResolvedValue([[{ id: 10, nombre: 'Tornillo', cantidad: 500 }]]);

        const result = await ElementoModel.obtenerSinSeries(T);

        expect(result).toHaveLength(1);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('requiere_series = FALSE');
    });
});

// ============================================
// obtenerConStockBajo: alerta de inventario bajo
// ============================================
describe('obtenerConStockBajo', () => {
    test('usa CASE para calcular stock disponible y HAVING para filtrar', async () => {
        const mockRows = [
            { id: 1, nombre: 'Carpa 3x3', stock_minimo: 10, stock_disponible: 3 }
        ];
        pool.query.mockResolvedValue([mockRows]);

        const result = await ElementoModel.obtenerConStockBajo(T);

        expect(result).toEqual(mockRows);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('WHEN e.requiere_series = TRUE');
        expect(sql).toContain('HAVING stock_disponible < e.stock_minimo');
        expect(sql).toContain('WHERE e.stock_minimo > 0');
    });
});

// ============================================
// obtenerEstadisticasGenerales: dashboard - múltiples queries
// ============================================
describe('obtenerEstadisticasGenerales', () => {
    test('ejecuta 3 queries y combina resultados', async () => {
        pool.query.mockResolvedValueOnce([[{
            total_elementos: 50,
            elementos_con_series: 20,
            elementos_con_lotes: 30,
            valor_total: 5000000,
            valor_precio_unitario: 8000000
        }]]);
        pool.query.mockResolvedValueOnce([[{ total: 150 }]]);
        pool.query.mockResolvedValueOnce([[{ total: 800 }]]);

        const result = await ElementoModel.obtenerEstadisticasGenerales(T);

        expect(pool.query).toHaveBeenCalledTimes(3);
        expect(result.total_elementos).toBe(50);
        expect(result.total_series).toBe(150);
        expect(result.total_unidades_lotes).toBe(800);
        expect(result.total_unidades).toBe(950);
    });
});

// ============================================
// obtenerDistribucionPorEstado: combina series + lotes por estado
// ============================================
describe('obtenerDistribucionPorEstado', () => {
    test('combina estados de series y lotes en un solo mapa', async () => {
        pool.query.mockResolvedValueOnce([[
            { estado: 'bueno', cantidad: 10 },
            { estado: 'dañado', cantidad: 3 }
        ]]);
        pool.query.mockResolvedValueOnce([[
            { estado: 'bueno', cantidad: 50 },
            { estado: 'alquilado', cantidad: 20 }
        ]]);

        const result = await ElementoModel.obtenerDistribucionPorEstado(T);

        expect(pool.query).toHaveBeenCalledTimes(2);
        const bueno = result.find(r => r.estado === 'bueno');
        expect(bueno.cantidad).toBe(60);
        const danado = result.find(r => r.estado === 'dañado');
        expect(danado.cantidad).toBe(3);
        const alquilado = result.find(r => r.estado === 'alquilado');
        expect(alquilado.cantidad).toBe(20);
    });
});

// ============================================
// obtenerTopCategorias: ranking para dashboard
// ============================================
describe('obtenerTopCategorias', () => {
    test('usa LIMIT con parámetro y ordena por cantidad_total DESC', async () => {
        pool.query.mockResolvedValue([[
            { categoria: 'Carpas', total_elementos: 15, cantidad_total: 200 },
            { categoria: 'Sillas', total_elementos: 8, cantidad_total: 100 }
        ]]);

        const result = await ElementoModel.obtenerTopCategorias(T, 5);

        expect(result).toHaveLength(2);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('ORDER BY cantidad_total DESC');
        expect(sql).toContain('LIMIT ?');
        expect(pool.query.mock.calls[0][1]).toEqual([T, T, T, T, T, 5]);
    });

    test('usa limit por defecto de 10', async () => {
        pool.query.mockResolvedValue([[]]);

        await ElementoModel.obtenerTopCategorias(T);

        expect(pool.query.mock.calls[0][1]).toEqual([T, T, T, T, T, 10]);
    });
});

// ============================================
// obtenerDistribucionPorUbicacion: series + lotes por ubicación
// ============================================
describe('obtenerDistribucionPorUbicacion', () => {
    test('incluye solo ubicaciones activas con stock > 0', async () => {
        pool.query.mockResolvedValue([[
            { ubicacion: 'Bodega Principal', series: 50, lotes: 200, total: 250 },
            { ubicacion: 'Bodega Norte', series: 10, lotes: 80, total: 90 }
        ]]);

        const result = await ElementoModel.obtenerDistribucionPorUbicacion(T);

        expect(result).toHaveLength(2);
        const sql = pool.query.mock.calls[0][0];
        expect(sql).toContain('ub.activo = TRUE');
        expect(sql).toContain('ORDER BY total DESC');
    });
});

// ============================================
// PROPAGACIÓN DE ERRORES DE BD
// ============================================
describe('propagación de errores de base de datos', () => {
    const dbError = new Error('Connection lost: The server closed the connection.');
    dbError.code = 'PROTOCOL_CONNECTION_LOST';

    test('obtenerTodos propaga error de conexión', async () => {
        pool.query.mockRejectedValue(dbError);
        await expect(ElementoModel.obtenerTodos(T)).rejects.toThrow('Connection lost');
    });

    test('crear propaga error de constraint (FK inválida)', async () => {
        const fkError = new Error('Cannot add or update a child row: a foreign key constraint fails');
        fkError.code = 'ER_NO_REFERENCED_ROW_2';
        pool.query.mockRejectedValue(fkError);
        await expect(ElementoModel.crear(T, { nombre: 'Test', categoria_id: 9999 }))
            .rejects.toThrow('foreign key constraint');
    });

    test('actualizar propaga error de duplicado', async () => {
        const dupError = new Error("Duplicate entry 'Carpa 3x3' for key 'nombre'");
        dupError.code = 'ER_DUP_ENTRY';
        pool.query.mockRejectedValue(dupError);
        await expect(ElementoModel.actualizar(T, 1, { nombre: 'Carpa 3x3' }))
            .rejects.toThrow('Duplicate entry');
    });

    test('obtenerEstadisticasGenerales propaga error si falla a mitad de las queries', async () => {
        pool.query.mockResolvedValueOnce([[{ total_elementos: 50 }]]);
        pool.query.mockRejectedValueOnce(dbError);
        await expect(ElementoModel.obtenerEstadisticasGenerales(T))
            .rejects.toThrow('Connection lost');
    });
});
