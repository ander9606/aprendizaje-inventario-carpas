/**
 * Tests para empleadoController
 *
 * Endpoints: getAll, getById, create, update, remove, reactivar,
 * cambiarPassword, getDisponiblesCampo, getRoles, getEstadisticas,
 * aprobar, rechazar, getPendientesCount
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/EmpleadoModel');
jest.mock('../../../auth/models/AuthModel');
jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed_pw') }));
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const EmpleadoModel = require('../../models/EmpleadoModel');
const AuthModel = require('../../../auth/models/AuthModel');
const controller = require('../empleadoController');

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
    test('retorna empleados con paginación', async () => {
        EmpleadoModel.obtenerTodos.mockResolvedValue({
            empleados: [{ id: 1 }], total: 1, page: 1, limit: 20, totalPages: 1
        });
        const res = mockRes();
        await controller.getAll(mockReq({ query: { page: '1', limit: '20' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: [{ id: 1 }],
            pagination: { total: 1, page: 1, limit: 20, totalPages: 1 }
        }));
    });
});

// ============================================
// getById
// ============================================
describe('getById', () => {
    test('retorna empleado existente', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Juan' });
        const res = mockRes();
        await controller.getById(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: 'Juan' } });
    });

    test('error 404 si no existe', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.getById(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// create
// ============================================
describe('create', () => {
    test('crea empleado exitosamente', async () => {
        EmpleadoModel.crear.mockResolvedValue({ id: 1, email: 'new@test.com' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.create(mockReq({
            body: { nombre: 'Juan', apellido: 'P', email: 'new@test.com', password: '12345678', rol_id: 1 }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(EmpleadoModel.crear).toHaveBeenCalledWith(1, expect.objectContaining({
            password_hash: 'hashed_pw'
        }));
    });

    test('error si faltan campos requeridos', async () => {
        const next = mockNext();
        await controller.create(mockReq({
            body: { nombre: 'Juan' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si contraseña menor a 8 caracteres', async () => {
        const next = mockNext();
        await controller.create(mockReq({
            body: { nombre: 'J', apellido: 'P', email: 'e@t.com', password: '1234', rol_id: 1 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('8 caracteres');
    });
});

// ============================================
// update
// ============================================
describe('update', () => {
    test('actualiza empleado exitosamente', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Juan', apellido: 'P', email: 'j@t.com', rol_id: 1, estado: 'activo' });
        EmpleadoModel.actualizar.mockResolvedValue({ id: 1, email: 'j@t.com' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.update(mockReq({
            params: { id: '1' },
            body: { nombre: 'Pedro' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(AuthModel.registrarAuditoria).toHaveBeenCalled();
    });

    test('error 404 si no existe', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.update(mockReq({ params: { id: '999' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// remove
// ============================================
describe('remove', () => {
    test('desactiva empleado exitosamente', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue({ id: 2, email: 'e@t.com' });
        EmpleadoModel.eliminar.mockResolvedValue();
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.remove(mockReq({ params: { id: '2' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: 'Empleado desactivado correctamente'
        }));
    });

    test('error al intentar auto-eliminación', async () => {
        const next = mockNext();
        await controller.remove(mockReq({
            params: { id: '1' },
            usuario: { id: 1, email: 'admin@test.com' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('propia cuenta');
    });

    test('error 404 si no existe', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.remove(mockReq({ params: { id: '2' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// reactivar
// ============================================
describe('reactivar', () => {
    test('reactiva empleado exitosamente', async () => {
        EmpleadoModel.reactivar.mockResolvedValue({ id: 2, email: 'e@t.com' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.reactivar(mockReq({ params: { id: '2' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: 'Empleado reactivado correctamente'
        }));
    });
});

// ============================================
// cambiarPassword
// ============================================
describe('cambiarPassword', () => {
    test('cambia contraseña exitosamente', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue({ id: 2, email: 'e@t.com' });
        EmpleadoModel.cambiarPassword.mockResolvedValue();
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.cambiarPassword(mockReq({
            params: { id: '2' },
            body: { password: 'newpass123' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si contraseña menor a 8 caracteres', async () => {
        const next = mockNext();
        await controller.cambiarPassword(mockReq({
            params: { id: '2' },
            body: { password: '1234' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si no se proporciona contraseña', async () => {
        const next = mockNext();
        await controller.cambiarPassword(mockReq({
            params: { id: '2' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 si empleado no existe', async () => {
        EmpleadoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.cambiarPassword(mockReq({
            params: { id: '999' },
            body: { password: 'newpass123' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// getDisponiblesCampo
// ============================================
describe('getDisponiblesCampo', () => {
    test('retorna empleados disponibles', async () => {
        EmpleadoModel.obtenerDisponiblesCampo.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.getDisponiblesCampo(mockReq({ query: {} }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
    });

    test('pasa fecha si se proporciona', async () => {
        EmpleadoModel.obtenerDisponiblesCampo.mockResolvedValue([]);
        const res = mockRes();
        await controller.getDisponiblesCampo(mockReq({ query: { fecha: '2025-01-01' } }), res, mockNext());
        expect(EmpleadoModel.obtenerDisponiblesCampo).toHaveBeenCalledWith(1, expect.any(Date));
    });
});

// ============================================
// getRoles, getEstadisticas, getPendientesCount
// ============================================
describe('getRoles', () => {
    test('retorna roles', async () => {
        EmpleadoModel.obtenerRoles.mockResolvedValue([{ id: 1, nombre: 'Admin' }]);
        const res = mockRes();
        await controller.getRoles(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, nombre: 'Admin' }] });
    });
});

describe('getEstadisticas', () => {
    test('retorna estadísticas', async () => {
        EmpleadoModel.obtenerEstadisticas.mockResolvedValue({ total: 10 });
        const res = mockRes();
        await controller.getEstadisticas(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 10 } });
    });
});

describe('getPendientesCount', () => {
    test('retorna conteo de pendientes', async () => {
        EmpleadoModel.contarPendientes.mockResolvedValue(3);
        const res = mockRes();
        await controller.getPendientesCount(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 3 } });
    });
});

// ============================================
// aprobar
// ============================================
describe('aprobar', () => {
    test('aprueba solicitud exitosamente', async () => {
        EmpleadoModel.aprobarSolicitud.mockResolvedValue({ id: 2, email: 'e@t.com', rol_nombre: 'Admin' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.aprobar(mockReq({
            params: { id: '2' },
            body: { rol_id: 1 }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si no se especifica rol_id', async () => {
        const next = mockNext();
        await controller.aprobar(mockReq({
            params: { id: '2' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('rol');
    });
});

// ============================================
// rechazar
// ============================================
describe('rechazar', () => {
    test('rechaza solicitud exitosamente', async () => {
        EmpleadoModel.rechazarSolicitud.mockResolvedValue({ id: 2, email: 'e@t.com' });
        AuthModel.registrarAuditoria.mockResolvedValue();
        const res = mockRes();
        await controller.rechazar(mockReq({
            params: { id: '2' },
            body: { motivo: 'No cumple requisitos' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: 'Solicitud rechazada'
        }));
    });
});
