/**
 * Tests para ubicacionController
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../models/UbicacionModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const UbicacionModel = require('../../models/UbicacionModel');
const controller = require('../ubicacionController');
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
        const ubicaciones = [{ id: 1, nombre: 'Bodega A' }];
        UbicacionModel.obtenerTodas.mockResolvedValue(ubicaciones);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: ubicaciones });
    });

    test('retorna paginado', async () => {
        UbicacionModel.obtenerConPaginacion.mockResolvedValue([]);
        UbicacionModel.contarTodas.mockResolvedValue(0);

        const req = mockReq({ query: { page: '1', limit: '10' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodas(req, res, next);

        expect(UbicacionModel.obtenerConPaginacion).toHaveBeenCalled();
    });
});

// ============================================
// obtenerActivas
// ============================================
describe('obtenerActivas', () => {
    test('retorna ubicaciones activas', async () => {
        UbicacionModel.obtenerActivas.mockResolvedValue([{ id: 1, activo: true }]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerActivas(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, activo: true }] });
    });
});

// ============================================
// obtenerPrincipal
// ============================================
describe('obtenerPrincipal', () => {
    test('retorna ubicación principal', async () => {
        const ub = { id: 1, nombre: 'Principal', es_principal: true };
        UbicacionModel.obtenerPrincipal.mockResolvedValue(ub);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPrincipal(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: ub });
    });

    test('error 404 si no hay principal', async () => {
        UbicacionModel.obtenerPrincipal.mockResolvedValue(null);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPrincipal(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna ubicación', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Bodega' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: 'Bodega' } });
    });

    test('error 404', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorCiudad
// ============================================
describe('obtenerPorCiudad', () => {
    test('retorna ubicaciones de una ciudad', async () => {
        UbicacionModel.obtenerPorCiudadId.mockResolvedValue([{ id: 1 }]);

        const req = mockReq({ params: { ciudadId: '5' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorCiudad(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1 }));
    });
});

// ============================================
// obtenerPorTipo
// ============================================
describe('obtenerPorTipo', () => {
    test('retorna ubicaciones por tipo válido', async () => {
        UbicacionModel.obtenerPorTipo.mockResolvedValue([{ id: 1, tipo: 'bodega' }]);

        const req = mockReq({ params: { tipo: 'bodega' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorTipo(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, tipo: 'bodega' }] });
    });

    test('error con tipo inválido', async () => {
        const req = mockReq({ params: { tipo: 'invalido' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorTipo(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// obtenerConInventario
// ============================================
describe('obtenerConInventario', () => {
    test('retorna ubicaciones con inventario', async () => {
        UbicacionModel.obtenerConInventario.mockResolvedValue([]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerConInventario(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
});

// ============================================
// obtenerDetalleInventario
// ============================================
describe('obtenerDetalleInventario', () => {
    test('retorna detalle de una ubicación existente', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Bodega', tipo: 'bodega' });
        UbicacionModel.obtenerDetalleInventario.mockResolvedValue([{ elemento: 'Carpa' }]);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerDetalleInventario(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                ubicacion: { id: 1, nombre: 'Bodega', tipo: 'bodega' },
                inventario: [{ elemento: 'Carpa' }]
            }
        });
    });

    test('error 404 si ubicación no existe', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerDetalleInventario(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea ubicación exitosamente', async () => {
        UbicacionModel.nombreExiste.mockResolvedValue(false);
        UbicacionModel.crear.mockResolvedValue(5);
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 5, nombre: 'Bodega B' });

        const req = mockReq({ body: { nombre: 'Bodega B', tipo: 'bodega' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si nombre duplicado', async () => {
        UbicacionModel.nombreExiste.mockResolvedValue(true);

        const req = mockReq({ body: { nombre: 'Bodega A' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('error si tipo inválido', async () => {
        const req = mockReq({ body: { nombre: 'Test Place', tipo: 'invalido' } });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza exitosamente', async () => {
        UbicacionModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Bodega' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Bodega Actualizada' });
        UbicacionModel.nombreExiste.mockResolvedValue(false);
        UbicacionModel.actualizar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Bodega Actualizada' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' }, body: { nombre: 'Test' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error si nombre duplicado', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        UbicacionModel.nombreExiste.mockResolvedValue(true);

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Duplicado' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// marcarComoPrincipal
// ============================================
describe('marcarComoPrincipal', () => {
    test('marca como principal exitosamente', async () => {
        UbicacionModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, activo: true })
            .mockResolvedValueOnce({ id: 1, es_principal: true });
        UbicacionModel.marcarComoPrincipal.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.marcarComoPrincipal(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.marcarComoPrincipal(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error 400 si ubicación inactiva', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 1, activo: false });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.marcarComoPrincipal(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// desactivar
// ============================================
describe('desactivar', () => {
    test('desactiva exitosamente', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        UbicacionModel.desactivar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.desactivar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.desactivar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// activar
// ============================================
describe('activar', () => {
    test('activa exitosamente', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        UbicacionModel.activar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.activar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        UbicacionModel.eliminar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        UbicacionModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});
