/**
 * Tests para descuentoController
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/DescuentoModel');
jest.mock('../../models/CotizacionDescuentoModel');
jest.mock('../../models/CotizacionModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const DescuentoModel = require('../../models/DescuentoModel');
const CotizacionDescuentoModel = require('../../models/CotizacionDescuentoModel');
const CotizacionModel = require('../../models/CotizacionModel');
const controller = require('../descuentoController');
const AppError = require('../../../../utils/AppError');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
    test('retorna descuentos activos', async () => {
        DescuentoModel.obtenerTodos.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerTodos(mockReq({ query: {} }), res, next);
        expect(DescuentoModel.obtenerTodos).toHaveBeenCalledWith(false);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('incluye inactivos si se pide', async () => {
        DescuentoModel.obtenerTodos.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerTodos(mockReq({ query: { incluir_inactivos: 'true' } }), res, next);
        expect(DescuentoModel.obtenerTodos).toHaveBeenCalledWith(true);
    });
});

describe('obtenerPorId', () => {
    test('retorna descuento', async () => {
        DescuentoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: '10%' });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: '10%' } });
    });

    test('error 404', async () => {
        DescuentoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('crear', () => {
    test('crea descuento porcentaje', async () => {
        DescuentoModel.crear.mockResolvedValue({ insertId: 5 });
        DescuentoModel.obtenerPorId.mockResolvedValue({ id: 5, tipo: 'porcentaje', valor: 10 });
        const res = mockRes(); const next = mockNext();
        await controller.crear(mockReq({
            body: { nombre: 'Promo', tipo: 'porcentaje', valor: 10 }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error sin nombre', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { tipo: 'fijo', valor: 100 } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error tipo inválido', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'X', tipo: 'invalido', valor: 10 } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error valor negativo', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'X', tipo: 'fijo', valor: -5 } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('actualizar', () => {
    test('actualiza exitosamente', async () => {
        DescuentoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1 })
            .mockResolvedValueOnce({ id: 1, nombre: 'Nuevo' });
        DescuentoModel.actualizar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '1' }, body: { nombre: 'Nuevo' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        DescuentoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '999' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error tipo inválido', async () => {
        DescuentoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '1' }, body: { tipo: 'invalido' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        DescuentoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        DescuentoModel.eliminar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        DescuentoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('aplicarACotizacion', () => {
    test('aplica descuento predefinido', async () => {
        CotizacionModel.obtenerCompleta
            .mockResolvedValueOnce({ resumen: { subtotal_productos: 1000, subtotal_transporte: 200 } })
            .mockResolvedValueOnce({ id: 1, total: 1080 });
        CotizacionDescuentoModel.agregarDescuentoPredefinido.mockResolvedValue({ insertId: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.aplicarACotizacion(mockReq({
            params: { id: '1' },
            body: { descuento_id: 5 }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('aplica descuento manual', async () => {
        CotizacionModel.obtenerCompleta
            .mockResolvedValueOnce({ resumen: { subtotal_productos: 500, subtotal_transporte: 0 } })
            .mockResolvedValueOnce({ id: 1, total: 400 });
        CotizacionDescuentoModel.agregarDescuentoManual.mockResolvedValue({ insertId: 2 });
        const res = mockRes(); const next = mockNext();
        await controller.aplicarACotizacion(mockReq({
            params: { id: '1' },
            body: { monto: 100, es_porcentaje: false }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error 404 cotización', async () => {
        CotizacionModel.obtenerCompleta.mockResolvedValue(null);
        const next = mockNext();
        await controller.aplicarACotizacion(mockReq({ params: { id: '999' }, body: { descuento_id: 1 } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error sin descuento_id ni monto', async () => {
        CotizacionModel.obtenerCompleta.mockResolvedValue({ resumen: { subtotal_productos: 100, subtotal_transporte: 0 } });
        const next = mockNext();
        await controller.aplicarACotizacion(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerDeCotizacion', () => {
    test('retorna descuentos de cotización', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CotizacionDescuentoModel.obtenerPorCotizacion.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerDeCotizacion(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('error 404', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerDeCotizacion(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('eliminarDeCotizacion', () => {
    test('elimina descuento de cotización', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CotizacionDescuentoModel.eliminar.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.eliminarDeCotizacion(mockReq({
            params: { id: '1', descuentoAplicadoId: '5' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
