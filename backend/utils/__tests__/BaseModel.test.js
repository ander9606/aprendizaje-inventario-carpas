/**
 * Tests para BaseModel
 */

jest.mock('../../config/database', () => ({
    pool: { query: jest.fn() }
}));

const { pool } = require('../../config/database');
const BaseModel = require('../BaseModel');

let model;

beforeEach(() => {
    jest.clearAllMocks();
    model = new BaseModel({
        table: 'materiales',
        alias: 'm',
        columns: ['id', 'nombre', 'descripcion'],
        sortFieldMap: { nombre: 'm.nombre', id: 'm.id' },
        searchColumns: ['nombre']
    });
});

describe('obtenerTodos', () => {
    test('retorna todas las filas ordenadas por defecto', async () => {
        pool.query.mockResolvedValue([[{ id: 1, nombre: 'Acero' }]]);
        const result = await model.obtenerTodos();
        expect(result).toEqual([{ id: 1, nombre: 'Acero' }]);
        expect(pool.query.mock.calls[0][0]).toContain('FROM materiales m');
        expect(pool.query.mock.calls[0][0]).toContain('ORDER BY m.nombre');
    });
});

describe('obtenerPorId', () => {
    test('retorna una fila por id', async () => {
        pool.query.mockResolvedValue([[{ id: 5, nombre: 'Aluminio' }]]);
        const result = await model.obtenerPorId(5);
        expect(result).toEqual({ id: 5, nombre: 'Aluminio' });
        expect(pool.query.mock.calls[0][1]).toEqual([5]);
    });

    test('retorna undefined si no existe', async () => {
        pool.query.mockResolvedValue([[]]);
        const result = await model.obtenerPorId(999);
        expect(result).toBeUndefined();
    });
});

describe('obtenerConPaginacion', () => {
    test('aplica limit y offset', async () => {
        pool.query.mockResolvedValue([[{ id: 1 }]]);
        await model.obtenerConPaginacion({ limit: 10, offset: 20, sortBy: 'nombre', order: 'ASC' });
        const query = pool.query.mock.calls[0][0];
        expect(query).toContain('LIMIT');
        expect(pool.query.mock.calls[0][1]).toEqual([10, 20]);
    });

    test('aplica busqueda', async () => {
        pool.query.mockResolvedValue([[{ id: 1 }]]);
        await model.obtenerConPaginacion({ limit: 10, offset: 0, search: 'acero' });
        const query = pool.query.mock.calls[0][0];
        expect(query).toContain('WHERE');
        expect(query).toContain('LIKE');
        expect(pool.query.mock.calls[0][1][0]).toBe('%acero%');
    });

    test('valida orden DESC', async () => {
        pool.query.mockResolvedValue([[]]);
        await model.obtenerConPaginacion({ limit: 10, offset: 0, order: 'DESC' });
        expect(pool.query.mock.calls[0][0]).toContain('DESC');
    });

    test('usa campo de ordenamiento por defecto si sortBy es invalido', async () => {
        pool.query.mockResolvedValue([[]]);
        await model.obtenerConPaginacion({ limit: 10, offset: 0, sortBy: 'INVALID' });
        expect(pool.query.mock.calls[0][0]).toContain('m.nombre');
    });
});

describe('contarTodos', () => {
    test('retorna total sin busqueda', async () => {
        pool.query.mockResolvedValue([[{ total: 42 }]]);
        const result = await model.contarTodos();
        expect(result).toBe(42);
        expect(pool.query.mock.calls[0][0]).not.toContain('WHERE');
    });

    test('retorna total con busqueda', async () => {
        pool.query.mockResolvedValue([[{ total: 3 }]]);
        const result = await model.contarTodos('acero');
        expect(result).toBe(3);
        expect(pool.query.mock.calls[0][0]).toContain('WHERE');
    });
});

describe('obtenerPorNombre', () => {
    test('retorna fila por nombre', async () => {
        pool.query.mockResolvedValue([[{ id: 1, nombre: 'Acero' }]]);
        const result = await model.obtenerPorNombre('Acero');
        expect(result).toEqual({ id: 1, nombre: 'Acero' });
    });
});

describe('nombreExiste', () => {
    test('retorna true si existe', async () => {
        pool.query.mockResolvedValue([[{ total: 1 }]]);
        const result = await model.nombreExiste('Acero');
        expect(result).toBe(true);
    });

    test('excluye id si se proporciona', async () => {
        pool.query.mockResolvedValue([[{ total: 0 }]]);
        const result = await model.nombreExiste('Acero', 5);
        expect(result).toBe(false);
        expect(pool.query.mock.calls[0][1]).toEqual(['Acero', 5]);
    });
});

describe('crear', () => {
    test('inserta y retorna insertId', async () => {
        pool.query.mockResolvedValue([{ insertId: 10 }]);
        const result = await model.crear({ nombre: 'Nuevo', descripcion: 'Desc' });
        expect(result).toBe(10);
        expect(pool.query.mock.calls[0][0]).toContain('INSERT INTO materiales');
        expect(pool.query.mock.calls[0][1]).toEqual(['Nuevo', 'Desc']);
    });
});

describe('actualizar', () => {
    test('actualiza campos por id', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);
        const result = await model.actualizar(5, { nombre: 'Editado' });
        expect(result).toBe(1);
        expect(pool.query.mock.calls[0][0]).toContain('UPDATE materiales SET nombre = ?');
        expect(pool.query.mock.calls[0][1]).toEqual(['Editado', 5]);
    });
});

describe('eliminar', () => {
    test('elimina por id', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);
        const result = await model.eliminar(5);
        expect(result).toBe(1);
        expect(pool.query.mock.calls[0][1]).toEqual([5]);
    });
});

describe('configuracion', () => {
    test('usa alias por defecto si no se especifica', () => {
        const m = new BaseModel({ table: 'tests' });
        expect(m.alias).toBe('t');
        expect(m.defaultSort).toBe('nombre');
    });

    test('selectColumns con wildcard', () => {
        const m = new BaseModel({ table: 'tests' });
        expect(m.selectColumns).toBe('t.*');
    });

    test('selectColumns con columnas especificas', () => {
        const m = new BaseModel({ table: 'tests', alias: 'x', columns: ['id', 'nombre'] });
        expect(m.selectColumns).toBe('x.id, x.nombre');
    });

    test('busqueda en multiples columnas', async () => {
        const multi = new BaseModel({
            table: 'vehiculos',
            alias: 'v',
            searchColumns: ['nombre', 'placa']
        });
        pool.query.mockResolvedValue([[]]);
        await multi.obtenerConPaginacion({ limit: 10, offset: 0, search: 'abc' });
        const query = pool.query.mock.calls[0][0];
        expect(query).toContain('v.nombre LIKE ?');
        expect(query).toContain('v.placa LIKE ?');
        expect(query).toContain('OR');
        expect(pool.query.mock.calls[0][1]).toEqual(['%abc%', '%abc%', 10, 0]);
    });
});
