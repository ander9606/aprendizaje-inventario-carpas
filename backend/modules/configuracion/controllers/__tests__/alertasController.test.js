/**
 * Tests para alertasController
 *
 * Endpoints: getAlertas, getAlertasCriticas, getResumen,
 * ignorarAlerta, limpiarExpiradas
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../services/AlertasAlquilerService');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const AlertasAlquilerService = require('../../services/AlertasAlquilerService');
const controller = require('../alertasController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    usuario: { id: 1, email: 'admin@test.com' },
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('getAlertas', () => {
    test('retorna todas las alertas', async () => {
        AlertasAlquilerService.obtenerTodasLasAlertas.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const res = mockRes();
        await controller.getAlertas(mockReq({ query: {} }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }, { id: 2 }], total: 2 });
    });

    test('pasa solo_criticas como boolean', async () => {
        AlertasAlquilerService.obtenerTodasLasAlertas.mockResolvedValue([]);
        await controller.getAlertas(mockReq({ query: { solo_criticas: 'true' } }), mockRes(), mockNext());
        expect(AlertasAlquilerService.obtenerTodasLasAlertas).toHaveBeenCalledWith({
            usuario_id: 1, solo_criticas: true
        });
    });
});

describe('getAlertasCriticas', () => {
    test('retorna alertas críticas', async () => {
        AlertasAlquilerService.obtenerTodasLasAlertas.mockResolvedValue([{ id: 1, critica: true }]);
        const res = mockRes();
        await controller.getAlertasCriticas(mockReq(), res, mockNext());
        expect(AlertasAlquilerService.obtenerTodasLasAlertas).toHaveBeenCalledWith({
            usuario_id: 1, solo_criticas: true
        });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1 }));
    });
});

describe('getResumen', () => {
    test('retorna resumen de alertas', async () => {
        AlertasAlquilerService.obtenerResumen.mockResolvedValue({ total: 5, criticas: 2 });
        const res = mockRes();
        await controller.getResumen(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 5, criticas: 2 } });
    });
});

describe('ignorarAlerta', () => {
    test('ignora alerta exitosamente', async () => {
        AlertasAlquilerService.ignorarAlerta.mockResolvedValue({ ignorada: true });
        const res = mockRes();
        await controller.ignorarAlerta(mockReq({
            body: { tipo: 'vencimiento', referencia_id: 10, dias: 7 }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: 'Alerta ignorada por 7 día(s)'
        }));
    });

    test('usa 1 día por defecto', async () => {
        AlertasAlquilerService.ignorarAlerta.mockResolvedValue({ ignorada: true });
        const res = mockRes();
        await controller.ignorarAlerta(mockReq({
            body: { tipo: 'vencimiento', referencia_id: 10 }
        }), res, mockNext());
        expect(AlertasAlquilerService.ignorarAlerta).toHaveBeenCalledWith('vencimiento', 10, 1, 1);
    });

    test('error si falta tipo', async () => {
        const next = mockNext();
        await controller.ignorarAlerta(mockReq({
            body: { referencia_id: 10 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si falta referencia_id', async () => {
        const next = mockNext();
        await controller.ignorarAlerta(mockReq({
            body: { tipo: 'vencimiento' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si dias fuera de rango (0)', async () => {
        const next = mockNext();
        await controller.ignorarAlerta(mockReq({
            body: { tipo: 'vencimiento', referencia_id: 10, dias: 0 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si dias fuera de rango (31)', async () => {
        const next = mockNext();
        await controller.ignorarAlerta(mockReq({
            body: { tipo: 'vencimiento', referencia_id: 10, dias: 31 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('limpiarExpiradas', () => {
    test('limpia alertas expiradas', async () => {
        AlertasAlquilerService.limpiarAlertasExpiradas.mockResolvedValue(3);
        const res = mockRes();
        await controller.limpiarExpiradas(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: '3 alertas expiradas eliminadas',
            data: { eliminadas: 3 }
        });
    });
});
