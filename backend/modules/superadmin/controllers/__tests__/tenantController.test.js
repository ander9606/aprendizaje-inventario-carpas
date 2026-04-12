/**
 * Tests para tenantController (superadmin)
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/TenantModel');
jest.mock('../../models/PagoModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const TenantModel = require('../../models/TenantModel');
const PagoModel = require('../../models/PagoModel');
const controller = require('../tenantController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    usuario: { id: 1, rol_nombre: 'super_admin', tenant_id: 1 },
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
    test('retorna lista paginada de tenants', async () => {
        TenantModel.obtenerTodos.mockResolvedValue([{ id: 1, nombre: 'Test' }]);
        TenantModel.contar.mockResolvedValue(1);
        const res = mockRes();
        await controller.obtenerTodos(mockReq({ query: { page: '1', limit: '10' } }), res, mockNext());
        expect(res.json).toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('propaga error', async () => {
        TenantModel.obtenerTodos.mockRejectedValue(new Error('DB'));
        const next = mockNext();
        await controller.obtenerTodos(mockReq(), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

describe('obtenerPorId', () => {
    test('retorna tenant con estadísticas', async () => {
        TenantModel.obtenerPorId.mockResolvedValue({ id: 2, nombre: 'Carpa Express' });
        TenantModel.obtenerEstadisticas.mockResolvedValue({ empleados: 3, elementos: 120 });
        const res = mockRes();
        await controller.obtenerPorId(mockReq({ params: { id: '2' } }), res, mockNext());
        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.data.nombre).toBe('Carpa Express');
        expect(data.data.estadisticas.empleados).toBe(3);
    });

    test('error 404 si no existe', async () => {
        TenantModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerEmpleados', () => {
    test('retorna empleados del tenant', async () => {
        TenantModel.obtenerPorId.mockResolvedValue({ id: 2 });
        TenantModel.obtenerEmpleados.mockResolvedValue([{ id: 1, nombre: 'Juan' }]);
        const res = mockRes();
        await controller.obtenerEmpleados(mockReq({ params: { id: '2' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].data).toHaveLength(1);
    });

    test('error 404 si tenant no existe', async () => {
        TenantModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.obtenerEmpleados(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('crear', () => {
    test('crea tenant exitosamente', async () => {
        TenantModel.slugExiste.mockResolvedValue(false);
        TenantModel.crear.mockResolvedValue(5);
        TenantModel.obtenerPorId.mockResolvedValue({ id: 5, nombre: 'Nuevo', slug: 'nuevo' });
        const res = mockRes();
        await controller.crear(mockReq({ body: { nombre: 'Nuevo', slug: 'nuevo' } }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json.mock.calls[0][0].data.slug).toBe('nuevo');
    });

    test('error 400 sin nombre/slug', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 400 slug inválido', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'Test', slug: 'INVALID SLUG!' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 400 slug reservado', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'Admin', slug: 'admin' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 409 slug duplicado', async () => {
        TenantModel.slugExiste.mockResolvedValue(true);
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'Test', slug: 'existente' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(409);
    });
});

describe('actualizar', () => {
    test('actualiza tenant exitosamente', async () => {
        TenantModel.obtenerPorId
            .mockResolvedValueOnce({ id: 2, nombre: 'Viejo', plan_id: 1 })
            .mockResolvedValueOnce({ id: 2, nombre: 'Nuevo' });
        TenantModel.actualizar.mockResolvedValue(1);
        const res = mockRes();
        await controller.actualizar(mockReq({ params: { id: '2' }, body: { nombre: 'Nuevo' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('error 404 si no existe', async () => {
        TenantModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '999' }, body: { nombre: 'X' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error 400 sin nombre', async () => {
        TenantModel.obtenerPorId.mockResolvedValue({ id: 2 });
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '2' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('cambiarEstado', () => {
    test('cambia estado exitosamente', async () => {
        TenantModel.obtenerPorId.mockResolvedValue({ id: 2 });
        TenantModel.cambiarEstado.mockResolvedValue(1);
        const res = mockRes();
        await controller.cambiarEstado(mockReq({ params: { id: '2' }, body: { estado: 'suspendido' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('error 400 estado inválido', async () => {
        const next = mockNext();
        await controller.cambiarEstado(mockReq({ params: { id: '2' }, body: { estado: 'bogus' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 400 no puede cambiar tenant principal', async () => {
        TenantModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.cambiarEstado(mockReq({ params: { id: '1' }, body: { estado: 'suspendido' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 tenant no existe', async () => {
        TenantModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.cambiarEstado(mockReq({ params: { id: '999' }, body: { estado: 'activo' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerPagos', () => {
    test('retorna pagos del tenant', async () => {
        TenantModel.obtenerPorId.mockResolvedValue({ id: 2 });
        PagoModel.obtenerPorTenant.mockResolvedValue([{ id: 1, monto: 99 }]);
        const res = mockRes();
        await controller.obtenerPagos(mockReq({ params: { id: '2' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].data).toHaveLength(1);
    });

    test('error 404 si tenant no existe', async () => {
        TenantModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.obtenerPagos(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
