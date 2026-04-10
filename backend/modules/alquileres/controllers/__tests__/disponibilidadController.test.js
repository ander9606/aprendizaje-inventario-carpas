/**
 * Tests para disponibilidadController
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/DisponibilidadModel');
jest.mock('../../models/CotizacionModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const DisponibilidadModel = require('../../models/DisponibilidadModel');
const CotizacionModel = require('../../models/CotizacionModel');
const controller = require('../disponibilidadController');
const AppError = require('../../../../utils/AppError');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, tenant: { id: 1, slug: 'test', nombre: 'Test' }, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

describe('verificarProductos', () => {
    test('verifica disponibilidad exitosamente', async () => {
        DisponibilidadModel.verificarDisponibilidadProductos.mockResolvedValue({ todos_disponibles: true });
        const res = mockRes(); const next = mockNext();
        await controller.verificarProductos(mockReq({
            body: {
                productos: [{ id: 1, cantidad: 5 }],
                fecha_montaje: '2026-04-01',
                fecha_desmontaje: '2026-04-03'
            }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { todos_disponibles: true } });
    });

    test('usa fecha_montaje como fecha_fin si no hay desmontaje', async () => {
        DisponibilidadModel.verificarDisponibilidadProductos.mockResolvedValue({});
        const res = mockRes(); const next = mockNext();
        await controller.verificarProductos(mockReq({
            body: { productos: [{ id: 1 }], fecha_montaje: '2026-04-01' }
        }), res, next);
        expect(DisponibilidadModel.verificarDisponibilidadProductos).toHaveBeenCalledWith(
            1, [{ id: 1 }], '2026-04-01', '2026-04-01'
        );
    });

    test('error sin productos', async () => {
        const next = mockNext();
        await controller.verificarProductos(mockReq({
            body: { productos: [], fecha_montaje: '2026-04-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error sin fecha_montaje', async () => {
        const next = mockNext();
        await controller.verificarProductos(mockReq({
            body: { productos: [{ id: 1 }] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('verificarCotizacion', () => {
    test('verifica disponibilidad de cotización existente', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({
            id: 1, fecha_montaje: '2026-04-01', fecha_desmontaje: '2026-04-03'
        });
        DisponibilidadModel.verificarDisponibilidadCotizacion.mockResolvedValue({ hay_problemas: false });
        const res = mockRes(); const next = mockNext();
        await controller.verificarCotizacion(mockReq({
            params: { id: '1' }, query: {}
        }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { hay_problemas: false } });
    });

    test('usa fechas de query si se proporcionan', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, fecha_montaje: '2026-04-01' });
        DisponibilidadModel.verificarDisponibilidadCotizacion.mockResolvedValue({});
        const res = mockRes(); const next = mockNext();
        await controller.verificarCotizacion(mockReq({
            params: { id: '1' },
            query: { fecha_inicio: '2026-05-01', fecha_fin: '2026-05-03' }
        }), res, next);
        expect(DisponibilidadModel.verificarDisponibilidadCotizacion).toHaveBeenCalledWith(
            1, '1', '2026-05-01', '2026-05-03'
        );
    });

    test('error 404 cotización', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.verificarCotizacion(mockReq({ params: { id: '999' }, query: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerCalendario', () => {
    test('retorna calendario de ocupación', async () => {
        DisponibilidadModel.obtenerCalendarioOcupacion.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerCalendario(mockReq({
            query: { fecha_inicio: '2026-04-01', fecha_fin: '2026-04-30' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    test('parsea IDs de elementos', async () => {
        DisponibilidadModel.obtenerCalendarioOcupacion.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerCalendario(mockReq({
            query: { fecha_inicio: '2026-04-01', fecha_fin: '2026-04-30', elementos: '1,2,3' }
        }), res, next);
        expect(DisponibilidadModel.obtenerCalendarioOcupacion).toHaveBeenCalledWith(
            1, '2026-04-01', '2026-04-30', [1, 2, 3]
        );
    });

    test('error sin fechas', async () => {
        const next = mockNext();
        await controller.obtenerCalendario(mockReq({ query: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('descomponerProductos', () => {
    test('descompone productos', async () => {
        DisponibilidadModel.obtenerElementosDeProductos.mockResolvedValue([{ elemento_id: 1, cantidad: 3 }]);
        const res = mockRes(); const next = mockNext();
        await controller.descomponerProductos(mockReq({
            body: { productos: [{ compuesto_id: 1, cantidad: 3 }] }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ elemento_id: 1, cantidad: 3 }]
        });
    });

    test('error sin productos', async () => {
        const next = mockNext();
        await controller.descomponerProductos(mockReq({ body: { productos: [] } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});
