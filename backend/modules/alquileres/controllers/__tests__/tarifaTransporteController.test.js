/**
 * Tests para tarifaTransporteController
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/TarifaTransporteModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const TarifaTransporteModel = require('../../models/TarifaTransporteModel');
const controller = require('../tarifaTransporteController');
const AppError = require('../../../../utils/AppError');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

describe('obtenerTodas', () => {
    test('retorna todas las tarifas', async () => {
        TarifaTransporteModel.obtenerTodas.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerTodas(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerActivas', () => {
    test('retorna tarifas activas', async () => {
        TarifaTransporteModel.obtenerActivas.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerActivas(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });
});

describe('obtenerPorId', () => {
    test('retorna tarifa', async () => {
        TarifaTransporteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });

    test('error 404', async () => {
        TarifaTransporteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerPorCiudadId', () => {
    test('retorna tarifas por ciudad', async () => {
        TarifaTransporteModel.obtenerPorCiudadId.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorCiudadId(mockReq({ params: { ciudadId: '5' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerCiudades', () => {
    test('retorna ciudades', async () => {
        TarifaTransporteModel.obtenerCiudades.mockResolvedValue([{ id: 1, nombre: 'Bogotá' }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerCiudades(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, nombre: 'Bogotá' }] });
    });
});

describe('obtenerTiposCamion', () => {
    test('retorna tipos', async () => {
        TarifaTransporteModel.obtenerTiposCamion.mockResolvedValue(['turbo', 'dobletroque']);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerTiposCamion(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: ['turbo', 'dobletroque'] });
    });
});

describe('buscarTarifa', () => {
    test('encuentra tarifa', async () => {
        TarifaTransporteModel.buscarTarifa.mockResolvedValue({ id: 1, precio: 500000 });
        const res = mockRes(); const next = mockNext();
        await controller.buscarTarifa(mockReq({ query: { tipo_camion: 'turbo', ciudad_id: '5' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, precio: 500000 } });
    });

    test('error sin parámetros', async () => {
        const next = mockNext();
        await controller.buscarTarifa(mockReq({ query: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 si no existe', async () => {
        TarifaTransporteModel.buscarTarifa.mockResolvedValue(null);
        const next = mockNext();
        await controller.buscarTarifa(mockReq({ query: { tipo_camion: 'x', ciudad_id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('crear', () => {
    test('crea tarifa exitosamente', async () => {
        TarifaTransporteModel.buscarTarifa.mockResolvedValue(null);
        TarifaTransporteModel.crear.mockResolvedValue({ insertId: 10 });
        TarifaTransporteModel.obtenerPorId.mockResolvedValue({ id: 10 });
        const res = mockRes(); const next = mockNext();
        await controller.crear(mockReq({
            body: { tipo_camion: 'turbo', ciudad_id: 5, precio: 500000 }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error campos faltantes', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { tipo_camion: 'turbo' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si ya existe', async () => {
        TarifaTransporteModel.buscarTarifa.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.crear(mockReq({
            body: { tipo_camion: 'turbo', ciudad_id: 5, precio: 500000 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('actualizar', () => {
    test('actualiza exitosamente', async () => {
        TarifaTransporteModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1 })
            .mockResolvedValueOnce({ id: 1, precio: 600000 });
        TarifaTransporteModel.actualizar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '1' }, body: { precio: 600000 } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        TarifaTransporteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '999' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        TarifaTransporteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        TarifaTransporteModel.eliminar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        TarifaTransporteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('desactivar', () => {
    test('desactiva exitosamente', async () => {
        TarifaTransporteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        TarifaTransporteModel.desactivar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.desactivar(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404', async () => {
        TarifaTransporteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.desactivar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
