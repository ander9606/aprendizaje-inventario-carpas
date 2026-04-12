/**
 * Tests para pagoController (superadmin)
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/PagoModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const PagoModel = require('../../models/PagoModel');
const controller = require('../pagoController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    usuario: { id: 1, rol_nombre: 'super_admin', tenant_id: 1 },
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
    test('retorna lista paginada de pagos', async () => {
        PagoModel.obtenerTodos.mockResolvedValue([{ id: 1, monto: 99 }]);
        PagoModel.contar.mockResolvedValue(1);
        const res = mockRes();
        await controller.obtenerTodos(mockReq({ query: { page: '1', limit: '10' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('filtra por estado de pago', async () => {
        PagoModel.obtenerTodos.mockResolvedValue([]);
        PagoModel.contar.mockResolvedValue(0);
        const res = mockRes();
        await controller.obtenerTodos(mockReq({ query: { pagado: '0', mes: '2026-04' } }), res, mockNext());
        expect(PagoModel.obtenerTodos).toHaveBeenCalledWith(expect.objectContaining({ pagado: '0', mes: '2026-04' }));
    });
});

describe('obtenerResumen', () => {
    test('retorna resumen sin filtro', async () => {
        PagoModel.obtenerResumen.mockResolvedValue({ pendientes: 3, monto_por_cobrar: 297 });
        const res = mockRes();
        await controller.obtenerResumen(mockReq(), res, mockNext());
        expect(res.json.mock.calls[0][0].data.pendientes).toBe(3);
    });

    test('retorna resumen con filtro de mes', async () => {
        PagoModel.obtenerResumen.mockResolvedValue({ pendientes: 1 });
        const res = mockRes();
        await controller.obtenerResumen(mockReq({ query: { mes: '2026-04' } }), res, mockNext());
        expect(PagoModel.obtenerResumen).toHaveBeenCalledWith('2026-04');
    });
});

describe('marcarPago', () => {
    test('marca pago exitosamente', async () => {
        PagoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, tenant_nombre: 'Test' })
            .mockResolvedValueOnce({ id: 1, pagado: 1, fecha_pago: '2026-04-12' });
        PagoModel.marcarPago.mockResolvedValue(1);
        const res = mockRes();
        await controller.marcarPago(mockReq({
            params: { id: '1' },
            body: { pagado: true, metodo_pago: 'transferencia' }
        }), res, mockNext());
        expect(res.json.mock.calls[0][0].success).toBe(true);
        expect(res.json.mock.calls[0][0].message).toContain('registrado');
    });

    test('desmarca pago', async () => {
        PagoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, tenant_nombre: 'Test' })
            .mockResolvedValueOnce({ id: 1, pagado: 0 });
        PagoModel.marcarPago.mockResolvedValue(1);
        const res = mockRes();
        await controller.marcarPago(mockReq({
            params: { id: '1' },
            body: { pagado: false }
        }), res, mockNext());
        expect(res.json.mock.calls[0][0].message).toContain('desmarcado');
    });

    test('error 404 si pago no existe', async () => {
        PagoModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.marcarPago(mockReq({ params: { id: '999' }, body: { pagado: true } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error 400 sin campo pagado', async () => {
        PagoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.marcarPago(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('generarPeriodo', () => {
    test('genera periodo exitosamente', async () => {
        PagoModel.generarPeriodo.mockResolvedValue({ generados: 3, periodo: '2026-05' });
        const res = mockRes();
        await controller.generarPeriodo(mockReq({ body: { mes: '2026-05' } }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json.mock.calls[0][0].data.generados).toBe(3);
    });

    test('error 400 formato de mes inválido', async () => {
        const next = mockNext();
        await controller.generarPeriodo(mockReq({ body: { mes: 'mayo' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 400 sin mes', async () => {
        const next = mockNext();
        await controller.generarPeriodo(mockReq({ body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('eliminar', () => {
    test('elimina pago exitosamente', async () => {
        PagoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        PagoModel.eliminar.mockResolvedValue(1);
        const res = mockRes();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('error 404 si no existe', async () => {
        PagoModel.obtenerPorId.mockResolvedValue(undefined);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
