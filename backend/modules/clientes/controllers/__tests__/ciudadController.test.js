/**
 * Tests para ciudadController
 *
 * Endpoints testeados:
 * - obtenerTodas: lista todas las ciudades
 * - obtenerActivas: lista solo ciudades activas
 * - obtenerPorId: obtiene ciudad por ID (404 si no existe)
 * - crear: crea ciudad (valida nombre obligatorio y duplicado)
 * - actualizar: actualiza ciudad (valida existencia y nombre único)
 * - eliminar: elimina ciudad (captura error de ubicaciones asociadas)
 * - desactivar: desactiva una ciudad
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/CiudadModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const CiudadModel = require('../../models/CiudadModel');
const controller = require('../ciudadController');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

// ============================================
// obtenerTodas
// ============================================
describe('obtenerTodas', () => {
    test('retorna lista de ciudades', async () => {
        CiudadModel.obtenerTodas.mockResolvedValue([{ id: 1, nombre: 'Bogotá' }]);
        const res = mockRes();
        await controller.obtenerTodas(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1, nombre: 'Bogotá' }],
            total: 1
        });
    });

    test('propaga error al next', async () => {
        CiudadModel.obtenerTodas.mockRejectedValue(new Error('DB'));
        const next = mockNext();
        await controller.obtenerTodas(mockReq(), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

// ============================================
// obtenerActivas
// ============================================
describe('obtenerActivas', () => {
    test('retorna solo ciudades activas', async () => {
        CiudadModel.obtenerActivas.mockResolvedValue([{ id: 1, activo: true }]);
        const res = mockRes();
        await controller.obtenerActivas(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1, activo: true }],
            total: 1
        });
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna ciudad existente', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Bogotá' });
        const res = mockRes();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { id: 1, nombre: 'Bogotá' }
        });
    });

    test('error 404 si no existe', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea ciudad exitosamente', async () => {
        CiudadModel.nombreExiste.mockResolvedValue(false);
        CiudadModel.crear.mockResolvedValue({ insertId: 1 });
        CiudadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cali' });
        const res = mockRes();
        await controller.crear(mockReq({
            body: { nombre: 'Cali', departamento_id: 2, tarifas: [] }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Ciudad creada exitosamente'
        }));
    });

    test('error si nombre falta', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('nombre');
    });

    test('error si nombre duplicado', async () => {
        CiudadModel.nombreExiste.mockResolvedValue(true);
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'Bogotá' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Ya existe');
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza ciudad exitosamente', async () => {
        CiudadModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Bogotá', departamento_id: 1, departamento: 'Cundinamarca' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Bogotá DC' });
        CiudadModel.nombreExiste.mockResolvedValue(false);
        CiudadModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Bogotá DC' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Ciudad actualizada exitosamente'
        }));
    });

    test('error 404 si ciudad no existe', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '999' },
            body: { nombre: 'Test' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si nombre duplicado al actualizar', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Bogotá' });
        CiudadModel.nombreExiste.mockResolvedValue(true);
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Cali' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Ya existe');
    });

    test('no verifica duplicado si nombre no cambia', async () => {
        CiudadModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Bogotá', departamento_id: 1, departamento: 'Cund' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Bogotá' });
        CiudadModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Bogotá' }
        }), res, mockNext());
        expect(CiudadModel.nombreExiste).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina ciudad exitosamente', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cali' });
        CiudadModel.eliminar.mockResolvedValue();
        const res = mockRes();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            mensaje: 'Ciudad eliminada exitosamente'
        });
    });

    test('error 404 si no existe', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error 400 si tiene ubicaciones asociadas', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CiudadModel.eliminar.mockRejectedValue(new Error('Tiene ubicaciones asociadas'));
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('propaga otros errores sin transformar', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CiudadModel.eliminar.mockRejectedValue(new Error('Error inesperado'));
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe('Error inesperado');
    });
});

// ============================================
// desactivar
// ============================================
describe('desactivar', () => {
    test('desactiva ciudad exitosamente', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cali' });
        CiudadModel.desactivar.mockResolvedValue();
        const res = mockRes();
        await controller.desactivar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            mensaje: 'Ciudad desactivada exitosamente'
        });
    });

    test('error 404 si ciudad no existe', async () => {
        CiudadModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.desactivar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
