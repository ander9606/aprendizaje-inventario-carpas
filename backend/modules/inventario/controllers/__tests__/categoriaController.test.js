/**
 * Tests para categoriaController
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../models/CategoriaModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const CategoriaModel = require('../../models/CategoriaModel');
const controller = require('../categoriaController');
const AppError = require('../../../../utils/AppError');

// Helpers
const mockReq = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    ...overrides
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

// ============================================
// obtenerTodas
// ============================================
describe('obtenerTodas', () => {
    test('retorna todas sin paginación cuando no hay query params', async () => {
        const categorias = [{ id: 1, nombre: 'Carpas' }];
        CategoriaModel.obtenerTodas.mockResolvedValue(categorias);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(CategoriaModel.obtenerTodas).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: categorias,
            total: 1
        });
    });

    test('retorna paginado cuando hay page y limit', async () => {
        const categorias = [{ id: 1, nombre: 'Carpas' }];
        CategoriaModel.obtenerConPaginacion.mockResolvedValue(categorias);
        CategoriaModel.contarTodas.mockResolvedValue(1);

        const req = mockReq({ query: { page: '1', limit: '20' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(CategoriaModel.obtenerConPaginacion).toHaveBeenCalled();
        expect(CategoriaModel.contarTodas).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: categorias })
        );
    });

    test('propaga errores al next', async () => {
        const error = new Error('DB error');
        CategoriaModel.obtenerTodas.mockRejectedValue(error);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    test('paginado con paginate=false retorna todas', async () => {
        const categorias = [{ id: 1 }, { id: 2 }];
        CategoriaModel.obtenerTodas.mockResolvedValue(categorias);

        const req = mockReq({ query: { paginate: 'false' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(CategoriaModel.obtenerTodas).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 2 }));
    });
});

// ============================================
// obtenerPadres
// ============================================
describe('obtenerPadres', () => {
    test('retorna padres sin paginación', async () => {
        const padres = [{ id: 1, nombre: 'Raíz', padre_id: null }];
        CategoriaModel.obtenerPadres.mockResolvedValue(padres);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPadres(req, res, next);

        expect(CategoriaModel.obtenerPadres).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: padres,
            total: 1
        });
    });

    test('retorna padres paginado', async () => {
        CategoriaModel.obtenerPadresConPaginacion.mockResolvedValue([]);
        CategoriaModel.contarPadres.mockResolvedValue(0);

        const req = mockReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPadres(req, res, next);

        expect(CategoriaModel.obtenerPadresConPaginacion).toHaveBeenCalled();
    });

    test('propaga errores al next', async () => {
        const error = new Error('fail');
        CategoriaModel.obtenerPadres.mockRejectedValue(error);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPadres(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna categoría existente', async () => {
        const cat = { id: 1, nombre: 'Carpas' };
        CategoriaModel.obtenerPorId.mockResolvedValue(cat);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: cat });
    });

    test('lanza 404 si no existe', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerHijas
// ============================================
describe('obtenerHijas', () => {
    test('retorna subcategorías de un padre existente', async () => {
        const padre = { id: 1, nombre: 'Carpas' };
        const hijas = [{ id: 2, nombre: 'Pequeñas' }];
        CategoriaModel.obtenerPorId.mockResolvedValue(padre);
        CategoriaModel.obtenerHijas.mockResolvedValue(hijas);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerHijas(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: hijas,
            total: 1,
            categoria_padre: padre
        });
    });

    test('lanza 404 si padre no existe', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerHijas(req, res, next);

        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea categoría exitosamente sin padre', async () => {
        CategoriaModel.crear.mockResolvedValue({ insertId: 10 });
        CategoriaModel.obtenerPorId.mockResolvedValue({ id: 10, nombre: 'Nueva' });

        const req = mockReq({ body: { nombre: 'Nueva', emoji: '🏕️' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(CategoriaModel.crear).toHaveBeenCalledWith({
            nombre: 'Nueva',
            emoji: '🏕️',
            padre_id: null
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: { id: 10, nombre: 'Nueva' } })
        );
    });

    test('crea categoría con padre válido', async () => {
        CategoriaModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Padre' }) // verificar padre
            .mockResolvedValueOnce({ id: 10, nombre: 'Hija' }); // obtener creada
        CategoriaModel.crear.mockResolvedValue({ insertId: 10 });

        const req = mockReq({ body: { nombre: 'Hija', padre_id: 1 } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si padre no existe', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ body: { nombre: 'Hija', padre_id: 999 } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si nombre vacío', async () => {
        const req = mockReq({ body: { nombre: '' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza categoría existente', async () => {
        CategoriaModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Vieja' }) // verificar existencia
            .mockResolvedValueOnce({ id: 1, nombre: 'Nueva' }); // obtener actualizada
        CategoriaModel.actualizar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Nueva', emoji: '⛺' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(CategoriaModel.actualizar).toHaveBeenCalledWith('1', {
            nombre: 'Nueva',
            emoji: '⛺',
            padre_id: null
        });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    test('error 404 si categoría no existe', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' }, body: { nombre: 'Test' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si intenta ser su propio padre', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cat' });

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Cat', padre_id: 1 } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('error si padre_id no existe', async () => {
        CategoriaModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Cat' }) // existe
            .mockResolvedValueOnce(null); // padre no existe

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Cat', padre_id: 99 } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina categoría sin hijos ni elementos', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cat' });
        CategoriaModel.tieneSubcategorias.mockResolvedValue(false);
        CategoriaModel.tieneElementos.mockResolvedValue(false);
        CategoriaModel.eliminar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        expect(CategoriaModel.eliminar).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error 400 si tiene subcategorías', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cat' });
        CategoriaModel.tieneSubcategorias.mockResolvedValue(true);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('error 400 si tiene elementos', async () => {
        CategoriaModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cat' });
        CategoriaModel.tieneSubcategorias.mockResolvedValue(false);
        CategoriaModel.tieneElementos.mockResolvedValue(true);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});
