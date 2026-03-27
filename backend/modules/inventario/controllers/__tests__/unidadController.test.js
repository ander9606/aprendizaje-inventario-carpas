/**
 * Tests para unidadController
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../models/UnidadModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const UnidadModel = require('../../models/UnidadModel');
const controller = require('../unidadController');
const AppError = require('../../../../utils/AppError');

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
    test('retorna todas sin paginación', async () => {
        const unidades = [{ id: 1, nombre: 'Metro' }];
        UnidadModel.obtenerTodas.mockResolvedValue(unidades);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: unidades,
            total: 1
        });
    });

    test('retorna paginado', async () => {
        UnidadModel.obtenerConPaginacion.mockResolvedValue([]);
        UnidadModel.contarTodas.mockResolvedValue(0);

        const req = mockReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(UnidadModel.obtenerConPaginacion).toHaveBeenCalled();
    });

    test('propaga errores', async () => {
        UnidadModel.obtenerTodas.mockRejectedValue(new Error('fail'));

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna unidad existente', async () => {
        UnidadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Metro' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: 'Metro' } });
    });

    test('error 404', async () => {
        UnidadModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorTipo
// ============================================
describe('obtenerPorTipo', () => {
    test('retorna unidades por tipo válido', async () => {
        UnidadModel.obtenerPorTipo.mockResolvedValue([{ id: 1, nombre: 'Metro', tipo: 'longitud' }]);

        const req = mockReq({ params: { tipo: 'longitud' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorTipo(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            tipo: 'longitud'
        }));
    });

    test('error con tipo inválido', async () => {
        const req = mockReq({ params: { tipo: 'invalido' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorTipo(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// obtenerMasUsadas
// ============================================
describe('obtenerMasUsadas', () => {
    test('retorna unidades más usadas', async () => {
        UnidadModel.obtenerMasUsadas.mockResolvedValue([{ id: 1, nombre: 'Metro', uso: 15 }]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerMasUsadas(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea unidad exitosamente', async () => {
        UnidadModel.obtenerPorNombre.mockResolvedValue(null);
        UnidadModel.crear.mockResolvedValue(5);
        UnidadModel.obtenerPorId.mockResolvedValue({ id: 5, nombre: 'Kilogramo', tipo: 'peso' });

        const req = mockReq({ body: { nombre: 'Kilogramo', abreviatura: 'kg', tipo: 'peso' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si nombre duplicado', async () => {
        UnidadModel.obtenerPorNombre.mockResolvedValue({ id: 1 });

        const req = mockReq({ body: { nombre: 'Metro' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('error si tipo inválido', async () => {
        const req = mockReq({ body: { nombre: 'Test Unit', tipo: 'invalido' } });
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
    test('actualiza exitosamente', async () => {
        UnidadModel.obtenerPorNombre.mockResolvedValue(null);
        UnidadModel.actualizar.mockResolvedValue(1);
        UnidadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Metro lineal' });

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Metro lineal' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si filasAfectadas=0', async () => {
        UnidadModel.obtenerPorNombre.mockResolvedValue(null);
        UnidadModel.actualizar.mockResolvedValue(0);

        const req = mockReq({ params: { id: '999' }, body: { nombre: 'NoExiste' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si nombre duplicado por otra unidad', async () => {
        UnidadModel.obtenerPorNombre.mockResolvedValue({ id: 2, nombre: 'Metro' });

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Metro' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        UnidadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Metro' });
        UnidadModel.eliminar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        UnidadModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error 400 si FK constraint', async () => {
        UnidadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Metro' });
        UnidadModel.eliminar.mockRejectedValue({ code: 'ER_ROW_IS_REFERENCED_2' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
    });
});
