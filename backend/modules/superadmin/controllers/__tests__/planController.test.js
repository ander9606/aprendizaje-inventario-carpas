/**
 * Tests para planController (superadmin)
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/PlanModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const PlanModel = require('../../models/PlanModel');
const controller = require('../planController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    usuario: { id: 1, rol_nombre: 'super_admin', tenant_id: 1 },
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
    test('retorna lista de planes', async () => {
        PlanModel.obtenerTodos.mockResolvedValue([
            { id: 1, nombre: 'Básico', tenant_count: 5 },
            { id: 2, nombre: 'Profesional', tenant_count: 3 }
        ]);
        const res = mockRes();
        await controller.obtenerTodos(mockReq(), res, mockNext());
        expect(res.json.mock.calls[0][0].total).toBe(2);
    });
});

describe('obtenerPorId', () => {
    test('retorna plan existente', async () => {
        PlanModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Básico' });
        const res = mockRes();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].data.nombre).toBe('Básico');
    });

    test('error 404 si no existe', async () => {
        PlanModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('crear', () => {
    test('crea plan exitosamente', async () => {
        PlanModel.slugExiste.mockResolvedValue(false);
        PlanModel.crear.mockResolvedValue(4);
        PlanModel.obtenerPorId.mockResolvedValue({ id: 4, nombre: 'Premium', slug: 'premium' });
        const res = mockRes();
        await controller.crear(mockReq({
            body: { nombre: 'Premium', slug: 'premium', max_empleados: 20, precio_mensual: 199 }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error 400 sin nombre/slug', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 400 slug inválido', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'X', slug: 'BAD SLUG' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 409 slug duplicado', async () => {
        PlanModel.slugExiste.mockResolvedValue(true);
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'X', slug: 'basico' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(409);
    });
});

describe('actualizar', () => {
    test('actualiza plan exitosamente', async () => {
        PlanModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Viejo' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Nuevo' });
        PlanModel.slugExiste.mockResolvedValue(false);
        PlanModel.actualizar.mockResolvedValue(1);
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Nuevo', slug: 'nuevo' }
        }), res, mockNext());
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('error 404 si no existe', async () => {
        PlanModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '999' }, body: { nombre: 'X', slug: 'x' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error 400 sin nombre/slug', async () => {
        PlanModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 409 slug duplicado', async () => {
        PlanModel.obtenerPorId.mockResolvedValue({ id: 1 });
        PlanModel.slugExiste.mockResolvedValue(true);
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '1' }, body: { nombre: 'X', slug: 'existente' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(409);
    });
});

describe('eliminar', () => {
    test('elimina plan sin tenants', async () => {
        PlanModel.obtenerPorId.mockResolvedValue({ id: 4 });
        PlanModel.eliminar.mockResolvedValue({ deleted: true, tenantCount: 0 });
        const res = mockRes();
        await controller.eliminar(mockReq({ params: { id: '4' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('error 400 si tiene tenants', async () => {
        PlanModel.obtenerPorId.mockResolvedValue({ id: 1 });
        PlanModel.eliminar.mockResolvedValue({ deleted: false, tenantCount: 5 });
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 si no existe', async () => {
        PlanModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
