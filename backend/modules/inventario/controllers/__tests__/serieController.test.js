/**
 * Tests para serieController
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../models/SerieModel');
jest.mock('../../models/ElementoModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const SerieModel = require('../../models/SerieModel');
const ElementoModel = require('../../models/ElementoModel');
const controller = require('../serieController');
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
// obtenerTodas
// ============================================
describe('obtenerTodas', () => {
    test('retorna todas sin paginación', async () => {
        SerieModel.obtenerTodas.mockResolvedValue([{ id: 1 }]);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('retorna paginado', async () => {
        SerieModel.obtenerConPaginacion.mockResolvedValue([]);
        SerieModel.contarTodas.mockResolvedValue(0);

        const req = mockReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(SerieModel.obtenerConPaginacion).toHaveBeenCalled();
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna serie existente', async () => {
        SerieModel.obtenerPorId.mockResolvedValue({ id: 1, numero_serie: 'ABC-001' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, numero_serie: 'ABC-001' } });
    });

    test('error 404', async () => {
        SerieModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorNumeroSerie
// ============================================
describe('obtenerPorNumeroSerie', () => {
    test('retorna serie por número', async () => {
        SerieModel.obtenerPorNumeroSerie.mockResolvedValue({ id: 1, numero_serie: 'XYZ' });

        const req = mockReq({ params: { numeroSerie: 'XYZ' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorNumeroSerie(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        SerieModel.obtenerPorNumeroSerie.mockResolvedValue(null);

        const req = mockReq({ params: { numeroSerie: 'NOPE' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorNumeroSerie(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorElemento
// ============================================
describe('obtenerPorElemento', () => {
    test('retorna series de un elemento', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpa' });
        SerieModel.obtenerPorElemento.mockResolvedValue([{ id: 1 }]);
        SerieModel.contarPorElemento.mockResolvedValue({ total: 1 });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElemento(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            elemento: { id: 1, nombre: 'Carpa' },
            total: 1
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
});

// ============================================
// obtenerPorEstado
// ============================================
describe('obtenerPorEstado', () => {
    test('retorna series por estado válido', async () => {
        SerieModel.obtenerPorEstado.mockResolvedValue([{ id: 1 }]);

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
// obtenerDisponibles / obtenerAlquiladas
// ============================================
describe('obtenerDisponibles', () => {
    test('retorna series disponibles', async () => {
        SerieModel.obtenerDisponibles.mockResolvedValue([]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerDisponibles(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });
});

describe('obtenerAlquiladas', () => {
    test('retorna series alquiladas', async () => {
        SerieModel.obtenerAlquiladas.mockResolvedValue([{ id: 1 }]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerAlquiladas(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea serie exitosamente', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: true });
        SerieModel.obtenerPorNumeroSerie.mockResolvedValue(null);
        SerieModel.crear.mockResolvedValue(10);
        SerieModel.obtenerPorId.mockResolvedValue({ id: 10, numero_serie: 'SER-001' });

        const req = mockReq({
            body: { id_elemento: 1, numero_serie: 'SER-001', estado: 'bueno' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si elemento no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({
            body: { id_elemento: 999, numero_serie: 'SER-001' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si elemento no requiere series', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: false });

        const req = mockReq({
            body: { id_elemento: 1, numero_serie: 'SER-001' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('error si número de serie duplicado', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: true });
        SerieModel.obtenerPorNumeroSerie.mockResolvedValue({ id: 5 });

        const req = mockReq({
            body: { id_elemento: 1, numero_serie: 'SER-001' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza serie exitosamente', async () => {
        SerieModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, numero_serie: 'OLD' })
            .mockResolvedValueOnce({ id: 1, numero_serie: 'NEW' });
        SerieModel.obtenerPorNumeroSerie.mockResolvedValue(null);
        SerieModel.actualizar.mockResolvedValue();

        const req = mockReq({
            params: { id: '1' },
            body: { numero_serie: 'NEW', estado: 'bueno' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si serie no existe', async () => {
        SerieModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({
            params: { id: '999' },
            body: { numero_serie: 'X' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si número de serie en uso por otra', async () => {
        SerieModel.obtenerPorId.mockResolvedValue({ id: 1, numero_serie: 'OLD' });
        SerieModel.obtenerPorNumeroSerie.mockResolvedValue({ id: 2, numero_serie: 'TAKEN' });

        const req = mockReq({
            params: { id: '1' },
            body: { numero_serie: 'TAKEN' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// cambiarEstado
// ============================================
describe('cambiarEstado', () => {
    test('cambia estado exitosamente', async () => {
        SerieModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, estado: 'bueno' })
            .mockResolvedValueOnce({ id: 1, estado: 'alquilado' });
        SerieModel.cambiarEstado.mockResolvedValue();

        const req = mockReq({
            params: { id: '1' },
            body: { estado: 'alquilado' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.cambiarEstado(req, res, next);

        expect(SerieModel.cambiarEstado).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si serie no existe', async () => {
        SerieModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({
            params: { id: '999' },
            body: { estado: 'bueno' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.cambiarEstado(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        SerieModel.obtenerPorId.mockResolvedValue({ id: 1, numero_serie: 'ABC' });
        SerieModel.eliminar.mockResolvedValue(1);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        SerieModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error 404 si eliminar retorna 0', async () => {
        SerieModel.obtenerPorId.mockResolvedValue({ id: 1 });
        SerieModel.eliminar.mockResolvedValue(0);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerSiguienteNumero
// ============================================
describe('obtenerSiguienteNumero', () => {
    test('retorna siguiente número', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: true });
        SerieModel.obtenerSiguienteNumero.mockResolvedValue('CARPA-004');

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerSiguienteNumero(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { numero: 'CARPA-004' } });
    });

    test('error si elemento no requiere series', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: false });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerSiguienteNumero(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// obtenerPorElementoConContexto
// ============================================
describe('obtenerPorElementoConContexto', () => {
    test('retorna series con contexto', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpa', requiere_series: true });
        SerieModel.obtenerPorElementoConContexto.mockResolvedValue([
            { id: 1, estado: 'bueno', en_alquiler: false, proximo_evento: null }
        ]);
        SerieModel.contarPorElemento.mockResolvedValue({ total: 1 });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElementoConContexto(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            resumen: expect.objectContaining({ total: 1, disponibles: 1 })
        }));
    });

    test('error si elemento no requiere series', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, requiere_series: false });

        const req = mockReq({ params: { elementoId: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorElementoConContexto(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// obtenerPorIdConContexto
// ============================================
describe('obtenerPorIdConContexto', () => {
    test('retorna serie con contexto', async () => {
        SerieModel.obtenerPorIdConContexto.mockResolvedValue({ id: 1, evento_actual: null });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorIdConContexto(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, evento_actual: null } });
    });

    test('error 404', async () => {
        SerieModel.obtenerPorIdConContexto.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorIdConContexto(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});
