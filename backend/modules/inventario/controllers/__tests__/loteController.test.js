/**
 * Tests para loteController
 */

const mockConnection = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn()
};

jest.mock('../../../../config/database', () => ({
    pool: {
        query: jest.fn(),
        getConnection: jest.fn().mockResolvedValue(mockConnection)
    }
}));
jest.mock('../../models/LoteModel');
jest.mock('../../models/ElementoModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const { pool } = require('../../../../config/database');
const LoteModel = require('../../models/LoteModel');
const ElementoModel = require('../../models/ElementoModel');
const controller = require('../loteController');
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
// obtenerTodos
// ============================================
describe('obtenerTodos', () => {
    test('retorna todos sin paginación', async () => {
        LoteModel.obtenerTodos.mockResolvedValue([{ id: 1 }]);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('retorna paginado', async () => {
        LoteModel.obtenerConPaginacion.mockResolvedValue([]);
        LoteModel.contarTodos.mockResolvedValue(0);

        const req = mockReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(LoteModel.obtenerConPaginacion).toHaveBeenCalled();
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna lote existente', async () => {
        LoteModel.obtenerPorId.mockResolvedValue({ id: 1, lote_numero: 'LOTE-001' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, lote_numero: 'LOTE-001' } });
    });

    test('error 404', async () => {
        LoteModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorElemento
// ============================================
describe('obtenerPorElemento', () => {
    test('retorna lotes de un elemento sin series', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Sillas', cantidad: 100, requiere_series: false });
        LoteModel.obtenerPorElemento.mockResolvedValue([{ id: 1 }]);
        LoteModel.obtenerEstadisticas.mockResolvedValue({ total: 100 });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElemento(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            total_lotes: 1
        }));
    });

    test('error 404 si elemento no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { elementoId: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElemento(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error 400 si elemento requiere series', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: true });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElemento(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// obtenerPorEstado
// ============================================
describe('obtenerPorEstado', () => {
    test('retorna lotes por estado', async () => {
        LoteModel.obtenerPorEstado.mockResolvedValue([{ id: 1, estado: 'bueno' }]);

        const req = mockReq({ params: { estado: 'bueno' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorEstado(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            estado: 'bueno'
        }));
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea lote exitosamente', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: false });
        LoteModel.crear.mockResolvedValue(10);
        LoteModel.obtenerPorId.mockResolvedValue({ id: 10, lote_numero: 'LOTE-20260325-ABCD' });

        const req = mockReq({
            body: { elemento_id: 1, cantidad: 50, estado: 'bueno' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si elemento no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({
            body: { elemento_id: 999, cantidad: 10 }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si elemento requiere series', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: true });

        const req = mockReq({
            body: { elemento_id: 1, cantidad: 10 }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// moverCantidad
// ============================================
describe('moverCantidad', () => {
    test('mueve cantidad a lote destino existente', async () => {
        LoteModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, elemento_id: 5, cantidad: 100, estado: 'bueno', ubicacion: 'A' }) // origen
            .mockResolvedValueOnce({ id: 1, cantidad: 80 }); // origen actualizado
        LoteModel.buscarLoteEspecifico.mockResolvedValue({ id: 2, cantidad: 20 });
        LoteModel.sumarCantidad.mockResolvedValue();
        LoteModel.restarCantidad.mockResolvedValue();
        LoteModel.registrarMovimiento.mockResolvedValue();
        LoteModel.obtenerEstadisticas.mockResolvedValue({});
        LoteModel.obtenerPorElemento.mockResolvedValue([]);

        const req = mockReq({
            body: {
                lote_origen_id: 1,
                cantidad: 20,
                estado_destino: 'mantenimiento',
                ubicacion_destino: 'Taller'
            }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.moverCantidad(req, res, next);

        expect(LoteModel.sumarCantidad).toHaveBeenCalledWith(2, 20);
        expect(LoteModel.restarCantidad).toHaveBeenCalledWith(1, 20);
        expect(mockConnection.commit).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('crea nuevo lote destino si no existe', async () => {
        LoteModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, elemento_id: 5, cantidad: 50, estado: 'bueno', ubicacion: 'A' })
            .mockResolvedValueOnce({ id: 1, cantidad: 40 });
        LoteModel.buscarLoteEspecifico.mockResolvedValue(null);
        LoteModel.crear.mockResolvedValue(99);
        LoteModel.restarCantidad.mockResolvedValue();
        LoteModel.registrarMovimiento.mockResolvedValue();
        LoteModel.obtenerEstadisticas.mockResolvedValue({});
        LoteModel.obtenerPorElemento.mockResolvedValue([]);

        const req = mockReq({
            body: {
                lote_origen_id: 1,
                cantidad: 10,
                estado_destino: 'dañado'
            }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.moverCantidad(req, res, next);

        expect(LoteModel.crear).toHaveBeenCalled();
        expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('elimina lote origen si queda vacío', async () => {
        LoteModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, elemento_id: 5, cantidad: 10, estado: 'bueno', ubicacion: 'A' })
            .mockResolvedValueOnce({ id: 1, cantidad: 0 });
        LoteModel.buscarLoteEspecifico.mockResolvedValue({ id: 2 });
        LoteModel.sumarCantidad.mockResolvedValue();
        LoteModel.restarCantidad.mockResolvedValue();
        LoteModel.registrarMovimiento.mockResolvedValue();
        LoteModel.eliminar.mockResolvedValue();
        LoteModel.obtenerEstadisticas.mockResolvedValue({});
        LoteModel.obtenerPorElemento.mockResolvedValue([]);

        const req = mockReq({
            body: { lote_origen_id: 1, cantidad: 10, estado_destino: 'mantenimiento' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.moverCantidad(req, res, next);

        expect(LoteModel.eliminar).toHaveBeenCalledWith(1);
    });

    test('error si lote origen no existe', async () => {
        LoteModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({
            body: { lote_origen_id: 999, cantidad: 10, estado_destino: 'bueno' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.moverCantidad(req, res, next);

        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    test('error si cantidad insuficiente', async () => {
        LoteModel.obtenerPorId.mockResolvedValue({ id: 1, cantidad: 5 });

        const req = mockReq({
            body: { lote_origen_id: 1, cantidad: 100, estado_destino: 'bueno' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.moverCantidad(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('rollback en caso de error inesperado', async () => {
        LoteModel.obtenerPorId.mockResolvedValue({ id: 1, elemento_id: 5, cantidad: 100, estado: 'bueno', ubicacion: 'A' });
        LoteModel.buscarLoteEspecifico.mockRejectedValue(new Error('DB crash'));

        const req = mockReq({
            body: { lote_origen_id: 1, cantidad: 10, estado_destino: 'bueno' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.moverCantidad(req, res, next);

        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza cantidad y ubicación', async () => {
        LoteModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, cantidad: 50 })
            .mockResolvedValueOnce({ id: 1, cantidad: 30, ubicacion: 'B' });
        LoteModel.actualizarCantidad.mockResolvedValue();
        pool.query.mockResolvedValue();

        const req = mockReq({
            params: { id: '1' },
            body: { cantidad: 30, ubicacion: 'B' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(LoteModel.actualizarCantidad).toHaveBeenCalledWith('1', 30);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('elimina lote si cantidad = 0', async () => {
        LoteModel.obtenerPorId.mockResolvedValue({ id: 1, cantidad: 50 });
        LoteModel.actualizarCantidad.mockResolvedValue();
        LoteModel.eliminar.mockResolvedValue();

        const req = mockReq({
            params: { id: '1' },
            body: { cantidad: 0 }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(LoteModel.eliminar).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            lote_eliminado: true
        }));
    });

    test('error 404 si no existe', async () => {
        LoteModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' }, body: { cantidad: 10 } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina lote con cantidad 0', async () => {
        LoteModel.obtenerPorId.mockResolvedValue({ id: 1, cantidad: 0, lote_numero: 'L-001' });
        LoteModel.eliminar.mockResolvedValue(1);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 400 si tiene cantidad > 0', async () => {
        LoteModel.obtenerPorId.mockResolvedValue({ id: 1, cantidad: 50 });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('error 404 si no existe', async () => {
        LoteModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerHistorial
// ============================================
describe('obtenerHistorial', () => {
    test('retorna historial de un lote', async () => {
        LoteModel.obtenerPorId.mockResolvedValue({
            id: 1, elemento_nombre: 'Sillas', cantidad: 50, estado: 'bueno'
        });
        LoteModel.obtenerHistorial.mockResolvedValue([{ id: 1, motivo: 'traslado' }]);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerHistorial(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            total: 1
        }));
    });

    test('error 404 si lote no existe', async () => {
        LoteModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerHistorial(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerResumenDisponibilidad
// ============================================
describe('obtenerResumenDisponibilidad', () => {
    test('retorna resumen', async () => {
        pool.query.mockResolvedValue([[{ id: 1, elemento: 'Sillas', disponibles: 80 }]]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerResumenDisponibilidad(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1 }));
    });
});

// ============================================
// obtenerPorElementoConContexto
// ============================================
describe('obtenerPorElementoConContexto', () => {
    test('retorna lotes con contexto', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Sillas', cantidad: 100, requiere_series: false });
        LoteModel.obtenerPorElementoConContexto.mockResolvedValue({
            estadisticas: {},
            lotes_por_ubicacion: [],
            en_eventos: [],
            total_en_eventos: 0
        });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElementoConContexto(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si requiere series', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: true });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElementoConContexto(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// verificarExistencia
// ============================================
describe('verificarExistencia', () => {
    test('retorna existencia de lote', async () => {
        LoteModel.buscarLoteEspecifico.mockResolvedValue({ id: 1, cantidad: 50 });

        const req = mockReq({ query: { elementoId: '1', estado: 'bueno', ubicacion: 'Bodega' } });
        const res = mockRes();
        const next = mockNext();

        await controller.verificarExistencia(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                existe: true,
                lote: { id: 1, cantidad: 50 }
            }
        });
    });

    test('retorna no existe', async () => {
        LoteModel.buscarLoteEspecifico.mockResolvedValue(null);

        const req = mockReq({ query: { elementoId: '1', estado: 'bueno' } });
        const res = mockRes();
        const next = mockNext();

        await controller.verificarExistencia(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { existe: false, lote: null }
        });
    });

    test('error si falta estado', async () => {
        const req = mockReq({ query: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.verificarExistencia(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// obtenerDesgloseAlquileres
// ============================================
describe('obtenerDesgloseAlquileres', () => {
    test('retorna desglose', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Sillas' });
        LoteModel.obtenerDesgloseAlquileres.mockResolvedValue([
            { evento: 'Boda', cantidad_total: 30 }
        ]);

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerDesgloseAlquileres(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            total_eventos: 1,
            total_cantidad_en_eventos: 30
        }));
    });

    test('error 404 si elemento no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { elementoId: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerDesgloseAlquileres(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});
