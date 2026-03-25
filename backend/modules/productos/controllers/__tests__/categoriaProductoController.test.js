/**
 * Tests para categoriaProductoController
 *
 * Endpoints testeados:
 * - obtenerTodas, obtenerActivas, obtenerArbol, obtenerActivasArbol, obtenerHijos
 * - obtenerPorId (404 si no existe)
 * - crear: valida nombre obligatorio, categoría padre existe si se da
 * - actualizar: valida existencia, nombre, auto-referencia, padre existe
 * - eliminar: verifica subcategorías y productos asociados
 * - obtenerCategoriasConConteo
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/CategoriaProductoModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const CategoriaProductoModel = require('../../models/CategoriaProductoModel');
const controller = require('../categoriaProductoController');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

// ============================================
// Listados simples
// ============================================
describe('obtenerTodas', () => {
    test('retorna todas las categorías', async () => {
        CategoriaProductoModel.obtenerTodas.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.obtenerTodas(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('propaga error', async () => {
        CategoriaProductoModel.obtenerTodas.mockRejectedValue(new Error('DB'));
        const next = mockNext();
        await controller.obtenerTodas(mockReq(), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

describe('obtenerActivas', () => {
    test('retorna categorías activas', async () => {
        CategoriaProductoModel.obtenerActivas.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.obtenerActivas(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerArbol', () => {
    test('retorna árbol jerárquico', async () => {
        CategoriaProductoModel.obtenerArbol.mockResolvedValue([{ id: 1, hijos: [] }]);
        const res = mockRes();
        await controller.obtenerArbol(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, hijos: [] }] });
    });
});

describe('obtenerActivasArbol', () => {
    test('retorna árbol de activas', async () => {
        CategoriaProductoModel.obtenerActivasArbol.mockResolvedValue([]);
        const res = mockRes();
        await controller.obtenerActivasArbol(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
});

describe('obtenerHijos', () => {
    test('retorna hijos de una categoría', async () => {
        CategoriaProductoModel.obtenerHijos.mockResolvedValue([{ id: 2 }]);
        const res = mockRes();
        await controller.obtenerHijos(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 2 }], total: 1 });
    });
});

describe('obtenerCategoriasConConteo', () => {
    test('retorna categorías con conteo', async () => {
        CategoriaProductoModel.obtenerCategoriasConConteo.mockResolvedValue([{ id: 1, total_productos: 5 }]);
        const res = mockRes();
        await controller.obtenerCategoriasConConteo(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1, total_productos: 5 }],
            total: 1
        });
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna categoría existente', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpas' });
        const res = mockRes();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: 'Carpas' } });
    });

    test('error 404 si no existe', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea categoría exitosamente', async () => {
        CategoriaProductoModel.crear.mockResolvedValue({ insertId: 1 });
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpas' });
        const res = mockRes();
        await controller.crear(mockReq({ body: { nombre: 'Carpas' } }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Categoría de producto creada exitosamente'
        }));
    });

    test('crea con categoría padre', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValueOnce({ id: 1, nombre: 'Padre' }); // padre existe
        CategoriaProductoModel.crear.mockResolvedValue({ insertId: 2 });
        CategoriaProductoModel.obtenerPorId.mockResolvedValueOnce({ id: 2 }); // nueva creada
        const res = mockRes();
        await controller.crear(mockReq({
            body: { nombre: 'Subcategoria', categoria_padre_id: 1 }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si nombre vacío', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: '' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si nombre falta', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si categoría padre no existe', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.crear(mockReq({
            body: { nombre: 'Test', categoria_padre_id: 999 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('padre no existe');
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza exitosamente', async () => {
        CategoriaProductoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Carpas' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Carpas XL' });
        CategoriaProductoModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Carpas XL' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Categoría de producto actualizada exitosamente'
        }));
    });

    test('error 404 si no existe', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '999' },
            body: { nombre: 'Test' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si nombre vacío', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: '' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si intenta ser su propio padre', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Carpas', categoria_padre_id: 1 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('propio padre');
    });

    test('error si categoría padre no existe', async () => {
        CategoriaProductoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Carpas' })
            .mockResolvedValueOnce(null); // padre no existe
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Carpas', categoria_padre_id: 999 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('padre no existe');
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina categoría exitosamente', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CategoriaProductoModel.tieneSubcategorias.mockResolvedValue(false);
        CategoriaProductoModel.tieneProductos.mockResolvedValue(false);
        CategoriaProductoModel.eliminar.mockResolvedValue();
        const res = mockRes();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            mensaje: 'Categoría de producto eliminada exitosamente'
        });
    });

    test('error 404 si no existe', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si tiene subcategorías', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CategoriaProductoModel.tieneSubcategorias.mockResolvedValue(true);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('subcategorías');
    });

    test('error si tiene productos asociados', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CategoriaProductoModel.tieneSubcategorias.mockResolvedValue(false);
        CategoriaProductoModel.tieneProductos.mockResolvedValue(true);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('productos');
    });
});
