/**
 * Tests para materialController
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../models/MaterialModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const MaterialModel = require('../../models/MaterialModel');
const controller = require('../materialController');
const AppError = require('../../../../utils/AppError');

const mockReq = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    tenant: { id: 1, slug: 'test', nombre: 'Test Tenant' },
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
// obtenerTodos
// ============================================
describe('obtenerTodos', () => {
    test('retorna todos sin paginación', async () => {
        const materiales = [{ id: 1, nombre: 'PVC' }];
        MaterialModel.obtenerTodos.mockResolvedValue(materiales);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: materiales,
            total: 1
        });
    });

    test('retorna paginado con page y limit', async () => {
        MaterialModel.obtenerConPaginacion.mockResolvedValue([{ id: 1 }]);
        MaterialModel.contarTodos.mockResolvedValue(1);

        const req = mockReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(MaterialModel.obtenerConPaginacion).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('propaga errores', async () => {
        MaterialModel.obtenerTodos.mockRejectedValue(new Error('fail'));

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna material existente', async () => {
        MaterialModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'PVC' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: 'PVC' } });
    });

    test('error 404 si no existe', async () => {
        MaterialModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea material exitosamente', async () => {
        MaterialModel.obtenerPorNombre.mockResolvedValue(null);
        MaterialModel.crear.mockResolvedValue(5);
        MaterialModel.obtenerPorId.mockResolvedValue({ id: 5, nombre: 'Aluminio' });

        const req = mockReq({ body: { nombre: 'Aluminio', descripcion: 'Metal ligero' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: { id: 5, nombre: 'Aluminio' } })
        );
    });

    test('error si nombre duplicado', async () => {
        MaterialModel.obtenerPorNombre.mockResolvedValue({ id: 1, nombre: 'PVC' });

        const req = mockReq({ body: { nombre: 'PVC' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
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
    test('actualiza exitosamente', async () => {
        MaterialModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'PVC', descripcion: '' })
            .mockResolvedValueOnce({ id: 1, nombre: 'PVC Premium', descripcion: 'Mejor' });
        MaterialModel.obtenerPorNombre.mockResolvedValue(null);
        MaterialModel.actualizar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'PVC Premium', descripcion: 'Mejor' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        MaterialModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' }, body: { nombre: 'Test' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si nombre duplicado por otro', async () => {
        MaterialModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'PVC' });
        MaterialModel.obtenerPorNombre.mockResolvedValue({ id: 2, nombre: 'Aluminio' });

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Aluminio' } });
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
        MaterialModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'PVC' });
        MaterialModel.eliminar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        MaterialModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error 400 si tiene elementos relacionados (FK constraint)', async () => {
        MaterialModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'PVC' });
        MaterialModel.eliminar.mockRejectedValue({ code: 'ER_ROW_IS_REFERENCED_2' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(400);
    });
});
