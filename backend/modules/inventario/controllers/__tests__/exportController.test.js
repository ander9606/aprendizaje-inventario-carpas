/**
 * Tests para exportController
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../models/ExportModel');
jest.mock('../../services/InventarioExcelService');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const ExportModel = require('../../models/ExportModel');
const InventarioExcelService = require('../../services/InventarioExcelService');
const controller = require('../exportController');

const mockReq = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    ...overrides
});

const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

describe('exportarExcel', () => {
    test('genera y envía archivo Excel', async () => {
        const inventario = [{ id: 1, nombre: 'Carpa' }];
        const resumenCategoria = [{ categoria: 'Carpas', total: 5 }];
        const resumenUbicacion = [];
        const alertasStock = [];

        ExportModel.obtenerInventarioCompleto.mockResolvedValue(inventario);
        ExportModel.obtenerResumenPorCategoria.mockResolvedValue(resumenCategoria);
        ExportModel.obtenerResumenPorUbicacion.mockResolvedValue(resumenUbicacion);
        ExportModel.obtenerAlertasStockBajo.mockResolvedValue(alertasStock);

        const mockWorkbook = {
            xlsx: {
                write: jest.fn().mockResolvedValue()
            }
        };
        InventarioExcelService.generar.mockReturnValue(mockWorkbook);

        const res = {
            setHeader: jest.fn(),
            end: jest.fn()
        };
        const req = mockReq();
        const next = mockNext();

        await controller.exportarExcel(req, res, next);

        expect(ExportModel.obtenerInventarioCompleto).toHaveBeenCalled();
        expect(InventarioExcelService.generar).toHaveBeenCalledWith({
            inventario,
            resumenCategoria,
            resumenUbicacion,
            alertasStock
        });
        expect(res.setHeader).toHaveBeenCalledWith(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        expect(mockWorkbook.xlsx.write).toHaveBeenCalledWith(res);
        expect(res.end).toHaveBeenCalled();
    });

    test('propaga errores', async () => {
        ExportModel.obtenerInventarioCompleto.mockRejectedValue(new Error('DB error'));

        const res = { setHeader: jest.fn(), end: jest.fn() };
        const req = mockReq();
        const next = mockNext();

        await controller.exportarExcel(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
