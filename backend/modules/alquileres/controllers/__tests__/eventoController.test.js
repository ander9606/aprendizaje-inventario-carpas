/**
 * Tests para eventoController
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/EventoModel');
jest.mock('../../../clientes/models/ClienteModel');
jest.mock('../../models/CotizacionModel');
jest.mock('../../models/CotizacionProductoModel');
jest.mock('../../../operaciones/models/NovedadModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const EventoModel = require('../../models/EventoModel');
const ClienteModel = require('../../../clientes/models/ClienteModel');
const CotizacionModel = require('../../models/CotizacionModel');
const CotizacionProductoModel = require('../../models/CotizacionProductoModel');
const NovedadModel = require('../../../operaciones/models/NovedadModel');
const controller = require('../eventoController');
const AppError = require('../../../../utils/AppError');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
    test('retorna todos los eventos', async () => {
        EventoModel.obtenerTodos.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerTodos(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerPorId', () => {
    test('retorna evento con puede_agregar_cotizaciones', async () => {
        EventoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Boda' });
        EventoModel.puedeAgregarCotizaciones.mockResolvedValue({ permitido: true });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        EventoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerPorCliente', () => {
    test('retorna eventos del cliente', async () => {
        EventoModel.obtenerPorCliente.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorCliente(mockReq({ params: { clienteId: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });
});

describe('obtenerPorEstado', () => {
    test('retorna eventos por estado válido', async () => {
        EventoModel.obtenerPorEstado.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorEstado(mockReq({ params: { estado: 'activo' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('error con estado inválido', async () => {
        const next = mockNext();
        await controller.obtenerPorEstado(mockReq({ params: { estado: 'invalido' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('crear', () => {
    test('crea evento exitosamente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        EventoModel.crear.mockResolvedValue({ insertId: 10 });
        EventoModel.obtenerPorId.mockResolvedValue({ id: 10, nombre: 'Boda' });
        const res = mockRes(); const next = mockNext();
        await controller.crear(mockReq({
            body: { cliente_id: 1, nombre: 'Boda', fecha_inicio: '2026-04-01' }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error sin cliente_id', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'X', fecha_inicio: '2026-01-01' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error sin nombre', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { cliente_id: 1, fecha_inicio: '2026-01-01' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error sin fecha_inicio', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { cliente_id: 1, nombre: 'X' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si cliente no existe', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.crear(mockReq({
            body: { cliente_id: 999, nombre: 'X', fecha_inicio: '2026-01-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('actualizar', () => {
    test('actualiza exitosamente', async () => {
        EventoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Viejo' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Nuevo' });
        EventoModel.actualizar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '1' }, body: { nombre: 'Nuevo' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        EventoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '999' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('cambiarEstado', () => {
    test('cambia estado válido', async () => {
        EventoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        EventoModel.cambiarEstado.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.cambiarEstado(mockReq({ params: { id: '1' }, body: { estado: 'completado' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error estado inválido', async () => {
        const next = mockNext();
        await controller.cambiarEstado(mockReq({ params: { id: '1' }, body: { estado: 'x' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404', async () => {
        EventoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.cambiarEstado(mockReq({ params: { id: '999' }, body: { estado: 'activo' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('eliminar', () => {
    test('elimina evento sin cotizaciones', async () => {
        EventoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        EventoModel.tieneCotizaciones.mockResolvedValue(false);
        EventoModel.eliminar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        EventoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si tiene cotizaciones', async () => {
        EventoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        EventoModel.tieneCotizaciones.mockResolvedValue(true);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerCotizaciones', () => {
    test('retorna cotizaciones del evento', async () => {
        EventoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        EventoModel.obtenerCotizaciones.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerCotizaciones(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('error 404', async () => {
        EventoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerCotizaciones(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('puedeAgregarCotizacion', () => {
    test('retorna resultado', async () => {
        EventoModel.puedeAgregarCotizaciones.mockResolvedValue({ permitido: true });
        const res = mockRes(); const next = mockNext();
        await controller.puedeAgregarCotizacion(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { permitido: true } });
    });
});

describe('repetir', () => {
    test('repite evento con productos', async () => {
        EventoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, cliente_id: 5, nombre: 'Boda', ciudad_nombre: 'Bogotá' })
            .mockResolvedValueOnce({ id: 20, nombre: 'Boda' });
        EventoModel.crear.mockResolvedValue({ insertId: 20 });
        EventoModel.obtenerProductosAprobados.mockResolvedValue([
            { cantidad: '10', precio_base: '100', deposito: '50', precio_adicionales: '0' }
        ]);
        CotizacionModel.crear.mockResolvedValue({ insertId: 30 });
        CotizacionProductoModel.agregarMultiples.mockResolvedValue();
        CotizacionModel.recalcularTotales.mockResolvedValue();

        const res = mockRes(); const next = mockNext();
        await controller.repetir(mockReq({
            params: { id: '1' },
            body: { fecha_inicio: '2026-05-01', fecha_fin: '2026-05-02' }
        }), res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error sin fecha_inicio', async () => {
        const next = mockNext();
        await controller.repetir(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 evento original', async () => {
        EventoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.repetir(mockReq({
            params: { id: '999' },
            body: { fecha_inicio: '2026-05-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerNovedadesEvento', () => {
    test('retorna novedades', async () => {
        EventoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        NovedadModel.obtenerPorEvento.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerNovedadesEvento(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    test('error 404', async () => {
        EventoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerNovedadesEvento(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
