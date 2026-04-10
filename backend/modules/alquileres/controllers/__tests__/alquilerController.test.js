/**
 * Tests para alquilerController
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/AlquilerModel');
jest.mock('../../models/AlquilerElementoModel');
jest.mock('../../models/CotizacionModel');
jest.mock('../../../operaciones/models/FotoOperacionModel');
jest.mock('../../../operaciones/models/NovedadModel');
jest.mock('../../../inventario/models/SerieModel');
jest.mock('../../../inventario/models/LoteModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const AlquilerModel = require('../../models/AlquilerModel');
const AlquilerElementoModel = require('../../models/AlquilerElementoModel');
const CotizacionModel = require('../../models/CotizacionModel');
const FotoOperacionModel = require('../../../operaciones/models/FotoOperacionModel');
const NovedadModel = require('../../../operaciones/models/NovedadModel');
const SerieModel = require('../../../inventario/models/SerieModel');
const LoteModel = require('../../../inventario/models/LoteModel');
const controller = require('../alquilerController');
const AppError = require('../../../../utils/AppError');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, usuario: null, tenant: { id: 1, slug: 'test', nombre: 'Test' }, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
    test('retorna todos', async () => {
        AlquilerModel.obtenerTodos.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerTodos(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerPorEstado', () => {
    test('retorna por estado válido', async () => {
        AlquilerModel.obtenerPorEstado.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorEstado(mockReq({ params: { estado: 'activo' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });

    test('error estado inválido', async () => {
        const next = mockNext();
        await controller.obtenerPorEstado(mockReq({ params: { estado: 'invalido' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerActivos', () => {
    test('retorna alquileres activos', async () => {
        AlquilerModel.obtenerActivos.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerActivos(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerProgramados', () => {
    test('retorna programados', async () => {
        AlquilerModel.obtenerProgramados.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerProgramados(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });
});

describe('obtenerPorId', () => {
    test('retorna alquiler', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });

    test('error 404', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerCompleto', () => {
    test('retorna alquiler completo', async () => {
        AlquilerModel.obtenerCompleto.mockResolvedValue({ id: 1, elementos: [] });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerCompleto(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, elementos: [] } });
    });

    test('error 404', async () => {
        AlquilerModel.obtenerCompleto.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerCompleto(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerElementos', () => {
    test('retorna elementos asignados', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1 });
        AlquilerElementoModel.obtenerPorAlquiler.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerElementos(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('error 404', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerElementos(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('asignarElementos', () => {
    test('asigna elementos exitosamente', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'programado' });
        AlquilerElementoModel.serieEnAlquilerActivo.mockResolvedValue(false);
        AlquilerElementoModel.asignarMultiples.mockResolvedValue();
        AlquilerModel.obtenerCompleto.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.asignarElementos(mockReq({
            params: { id: '1' },
            body: { elementos: [{ serie_id: 1, elemento_id: 1 }] }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si estado no es programado ni activo', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'finalizado' });
        const next = mockNext();
        await controller.asignarElementos(mockReq({
            params: { id: '1' },
            body: { elementos: [{ serie_id: 1 }] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si serie ya en alquiler activo', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'programado' });
        AlquilerElementoModel.serieEnAlquilerActivo.mockResolvedValue(true);
        const next = mockNext();
        await controller.asignarElementos(mockReq({
            params: { id: '1' },
            body: { elementos: [{ serie_id: 5 }] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error sin elementos', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'programado' });
        const next = mockNext();
        await controller.asignarElementos(mockReq({
            params: { id: '1' },
            body: { elementos: [] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('marcarSalida', () => {
    test('marca salida exitosamente con series y lotes', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'programado', cotizacion_id: 5 });
        AlquilerElementoModel.obtenerPorAlquiler.mockResolvedValue([
            { id: 1, serie_id: 10, lote_id: null },
            { id: 2, serie_id: null, lote_id: 20, cantidad_lote: 5 }
        ]);
        CotizacionModel.obtenerPorId.mockResolvedValue({ evento_ciudad: 'Bogotá' });
        SerieModel.cambiarEstado.mockResolvedValue();
        LoteModel.moverParaAlquiler.mockResolvedValue(99);
        AlquilerElementoModel.actualizarLoteAlquilado.mockResolvedValue();
        AlquilerModel.marcarActivo.mockResolvedValue();
        AlquilerModel.obtenerCompleto.mockResolvedValue({ id: 1, estado: 'activo' });
        const res = mockRes(); const next = mockNext();
        await controller.marcarSalida(mockReq({ params: { id: '1' }, body: {} }), res, next);
        expect(SerieModel.cambiarEstado).toHaveBeenCalledWith(1, 10, 'alquilado', 'Bogotá', null);
        expect(LoteModel.moverParaAlquiler).toHaveBeenCalledWith(1, 20, 5, '1');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si no es programado', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'activo' });
        const next = mockNext();
        await controller.marcarSalida(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si no tiene elementos', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'programado', cotizacion_id: 5 });
        AlquilerElementoModel.obtenerPorAlquiler.mockResolvedValue([]);
        CotizacionModel.obtenerPorId.mockResolvedValue({});
        const next = mockNext();
        await controller.marcarSalida(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('registrarRetornoElemento', () => {
    test('registra retorno de serie', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'activo' });
        AlquilerElementoModel.obtenerPorId.mockResolvedValue({ id: 5, serie_id: 10, ubicacion_original_id: 3 });
        AlquilerElementoModel.registrarRetorno.mockResolvedValue();
        SerieModel.cambiarEstado.mockResolvedValue();
        AlquilerModel.actualizarCostoDanos.mockResolvedValue();
        AlquilerModel.obtenerCompleto.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.registrarRetornoElemento(mockReq({
            params: { id: '1', elementoId: '5' },
            body: { estado_retorno: 'bueno' }
        }), res, next);
        expect(SerieModel.cambiarEstado).toHaveBeenCalledWith(1, 10, 'bueno', null, 3);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si no es activo', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'programado' });
        const next = mockNext();
        await controller.registrarRetornoElemento(mockReq({
            params: { id: '1', elementoId: '5' },
            body: { estado_retorno: 'bueno' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error estado_retorno inválido', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'activo' });
        const next = mockNext();
        await controller.registrarRetornoElemento(mockReq({
            params: { id: '1', elementoId: '5' },
            body: { estado_retorno: 'invalido' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('cancelar', () => {
    test('cancela exitosamente', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'programado' });
        AlquilerElementoModel.eliminarPorAlquiler.mockResolvedValue();
        AlquilerModel.cancelar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.cancelar(mockReq({ params: { id: '1' }, body: {} }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si ya finalizado', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'finalizado' });
        const next = mockNext();
        await controller.cancelar(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si ya cancelado', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'cancelado' });
        const next = mockNext();
        await controller.cancelar(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerPorRangoFechas', () => {
    test('retorna alquileres en rango', async () => {
        AlquilerModel.obtenerPorRangoFechas.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorRangoFechas(mockReq({
            query: { fechaInicio: '2026-01-01', fechaFin: '2026-12-31' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('error sin fechas', async () => {
        const next = mockNext();
        await controller.obtenerPorRangoFechas(mockReq({ query: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerEstadisticas', () => {
    test('retorna estadísticas', async () => {
        AlquilerModel.obtenerEstadisticas.mockResolvedValue({ total: 50 });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerEstadisticas(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 50 } });
    });
});

describe('extenderFechaRetorno', () => {
    test('extiende exitosamente', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({
            id: 1, estado: 'activo', fecha_retorno_esperado: '2026-04-01'
        });
        AlquilerModel.extenderFechaRetorno.mockResolvedValue({ dias_extension: 3 });
        const res = mockRes(); const next = mockNext();
        await controller.extenderFechaRetorno(mockReq({
            params: { id: '1' },
            body: { nueva_fecha_retorno: '2026-04-04' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error sin fecha', async () => {
        const next = mockNext();
        await controller.extenderFechaRetorno(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si estado no permitido', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'finalizado' });
        const next = mockNext();
        await controller.extenderFechaRetorno(mockReq({
            params: { id: '1' },
            body: { nueva_fecha_retorno: '2026-05-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerExtensiones', () => {
    test('retorna extensiones', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1 });
        AlquilerModel.obtenerExtensiones.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerExtensiones(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('error 404', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerExtensiones(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerFotosAlquiler', () => {
    test('retorna fotos', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1 });
        FotoOperacionModel.obtenerPorAlquiler.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerFotosAlquiler(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
});

describe('obtenerNovedadesAlquiler', () => {
    test('retorna novedades', async () => {
        AlquilerModel.obtenerPorId.mockResolvedValue({ id: 1 });
        NovedadModel.obtenerPorAlquiler.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerNovedadesAlquiler(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
});
