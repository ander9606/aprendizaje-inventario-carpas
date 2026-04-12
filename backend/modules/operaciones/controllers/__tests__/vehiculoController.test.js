/**
 * Tests para vehiculoController
 *
 * Endpoints: getAll, getById, create, update, remove, getDisponibles,
 * registrarUso, registrarMantenimiento, actualizarMantenimiento, getEstadisticas
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/VehiculoModel');
jest.mock('../../../auth/models/AuthModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const VehiculoModel = require('../../models/VehiculoModel');
const AuthModel = require('../../../auth/models/AuthModel');
const controller = require('../vehiculoController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    tenant: { id: 1, slug: 'test', nombre: 'Test Tenant' },
    usuario: { id: 1, email: 'admin@test.com' },
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('test-agent'),
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

// ============================================
// getAll
// ============================================
describe('getAll', () => {
    test('retorna vehículos con paginación', async () => {
        VehiculoModel.obtenerTodos.mockResolvedValue({
            vehiculos: [{ id: 1 }], total: 1, page: 1, limit: 20, totalPages: 1
        });
        const res = mockRes();
        await controller.getAll(mockReq({ query: {} }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: [{ id: 1 }]
        }));
    });
});

// ============================================
// getById
// ============================================
describe('getById', () => {
    test('retorna vehículo existente', async () => {
        VehiculoModel.obtenerPorId.mockResolvedValue({ id: 1, placa: 'ABC123' });
        const res = mockRes();
        await controller.getById(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, placa: 'ABC123' } });
    });

    test('error 404 si no existe', async () => {
        VehiculoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.getById(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// create
// ============================================
describe('create', () => {
    test('crea vehículo exitosamente', async () => {
        VehiculoModel.crear.mockResolvedValue({ id: 1, placa: 'ABC123' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.create(mockReq({
            body: { placa: 'abc123', marca: 'Toyota', modelo: 'Hilux', tipo: 'camioneta' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(VehiculoModel.crear).toHaveBeenCalledWith(1, expect.objectContaining({ placa: 'ABC123' }));
    });

    test('error si faltan campos requeridos', async () => {
        const next = mockNext();
        await controller.create(mockReq({ body: { placa: 'ABC' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si tipo inválido', async () => {
        const next = mockNext();
        await controller.create(mockReq({
            body: { placa: 'ABC', marca: 'T', modelo: 'H', tipo: 'bicicleta' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Tipo inválido');
    });
});

// ============================================
// update
// ============================================
describe('update', () => {
    test('actualiza vehículo exitosamente', async () => {
        VehiculoModel.obtenerPorId.mockResolvedValue({ id: 1, placa: 'ABC123', estado: 'disponible' });
        VehiculoModel.actualizar.mockResolvedValue({ id: 1, placa: 'ABC123' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.update(mockReq({
            params: { id: '1' },
            body: { marca: 'Nissan' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('convierte placa a mayúsculas', async () => {
        VehiculoModel.obtenerPorId.mockResolvedValue({ id: 1, placa: 'ABC', estado: 'disponible' });
        VehiculoModel.actualizar.mockResolvedValue({ id: 1, placa: 'XYZ789' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const req = mockReq({ params: { id: '1' }, body: { placa: 'xyz789' } });
        await controller.update(req, mockRes(), mockNext());
        expect(VehiculoModel.actualizar).toHaveBeenCalledWith(1, 1, expect.objectContaining({ placa: 'XYZ789' }));
    });

    test('error si tipo inválido', async () => {
        const next = mockNext();
        await controller.update(mockReq({
            params: { id: '1' },
            body: { tipo: 'moto' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si estado inválido', async () => {
        const next = mockNext();
        await controller.update(mockReq({
            params: { id: '1' },
            body: { estado: 'destruido' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 si no existe', async () => {
        VehiculoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.update(mockReq({ params: { id: '999' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// remove
// ============================================
describe('remove', () => {
    test('desactiva vehículo exitosamente', async () => {
        VehiculoModel.obtenerPorId.mockResolvedValue({ id: 1, placa: 'ABC' });
        VehiculoModel.eliminar.mockResolvedValue();
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.remove(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        VehiculoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.remove(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// getDisponibles
// ============================================
describe('getDisponibles', () => {
    test('retorna vehículos disponibles', async () => {
        VehiculoModel.obtenerDisponibles.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.getDisponibles(mockReq({ query: {} }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
        expect(VehiculoModel.obtenerDisponibles).toHaveBeenCalledWith(1, null);
    });

    test('pasa fecha si se proporciona', async () => {
        VehiculoModel.obtenerDisponibles.mockResolvedValue([]);
        await controller.getDisponibles(mockReq({ query: { fecha: '2025-06-01' } }), mockRes(), mockNext());
        expect(VehiculoModel.obtenerDisponibles).toHaveBeenCalledWith(1, expect.any(Date));
    });
});

// ============================================
// registrarUso
// ============================================
describe('registrarUso', () => {
    test('registra uso exitosamente', async () => {
        VehiculoModel.registrarUso.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.registrarUso(mockReq({
            params: { id: '1' },
            body: { destino: 'Bogotá', proposito: 'Entrega' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('usa usuario actual como conductor por defecto', async () => {
        VehiculoModel.registrarUso.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.registrarUso(mockReq({
            params: { id: '1' },
            body: {}
        }), res, mockNext());
        expect(VehiculoModel.registrarUso).toHaveBeenCalledWith(1, 1, expect.objectContaining({ conductor_id: 1 }));
    });
});

// ============================================
// registrarMantenimiento
// ============================================
describe('registrarMantenimiento', () => {
    test('registra mantenimiento exitosamente', async () => {
        VehiculoModel.registrarMantenimiento.mockResolvedValue({ id: 1 });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.registrarMantenimiento(mockReq({
            params: { id: '1' },
            body: { tipo: 'preventivo', fecha_programada: '2025-06-01' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si faltan campos requeridos', async () => {
        const next = mockNext();
        await controller.registrarMantenimiento(mockReq({
            params: { id: '1' },
            body: { tipo: 'preventivo' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si tipo de mantenimiento inválido', async () => {
        const next = mockNext();
        await controller.registrarMantenimiento(mockReq({
            params: { id: '1' },
            body: { tipo: 'pintura', fecha_programada: '2025-06-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Tipo inválido');
    });
});

// ============================================
// actualizarMantenimiento
// ============================================
describe('actualizarMantenimiento', () => {
    test('actualiza mantenimiento exitosamente', async () => {
        VehiculoModel.actualizarMantenimiento.mockResolvedValue({ id: 1 });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.actualizarMantenimiento(mockReq({
            params: { id: '1' },
            body: { estado: 'completado' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

// ============================================
// getEstadisticas
// ============================================
describe('getEstadisticas', () => {
    test('retorna estadísticas', async () => {
        VehiculoModel.obtenerEstadisticas.mockResolvedValue({ total: 5 });
        const res = mockRes();
        await controller.getEstadisticas(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 5 } });
    });
});
