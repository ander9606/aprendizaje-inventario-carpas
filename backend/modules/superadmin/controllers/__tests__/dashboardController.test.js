/**
 * Tests para dashboardController (superadmin)
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/TenantModel');
jest.mock('../../models/PagoModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const TenantModel = require('../../models/TenantModel');
const PagoModel = require('../../models/PagoModel');
const controller = require('../dashboardController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    usuario: { id: 1, rol_nombre: 'super_admin', tenant_id: 1 },
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('obtenerDashboard', () => {
    test('retorna estadísticas globales', async () => {
        TenantModel.estadisticasGlobales.mockResolvedValue({
            tenants: { total: 5, activos: 4 },
            totalEmpleados: 20,
            totalElementos: 500
        });
        TenantModel.tenantsCercaLimites.mockResolvedValue([]);
        PagoModel.obtenerResumen.mockResolvedValue({ pendientes: 2, monto_por_cobrar: 198 });

        const res = mockRes();
        await controller.obtenerDashboard(mockReq(), res, mockNext());

        const data = res.json.mock.calls[0][0];
        expect(data.success).toBe(true);
        expect(data.data.tenants.total).toBe(5);
        expect(data.data.pagos.pendientes).toBe(2);
        expect(data.data.tenantsCercaLimites).toEqual([]);
    });

    test('propaga error', async () => {
        TenantModel.estadisticasGlobales.mockRejectedValue(new Error('DB'));
        const next = mockNext();
        await controller.obtenerDashboard(mockReq(), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
