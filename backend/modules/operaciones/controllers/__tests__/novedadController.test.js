/**
 * Tests para novedadController
 *
 * Endpoints: crearNovedad, obtenerNovedadesOrden, resolverNovedad,
 * obtenerNovedadesPendientes
 *
 * Nota: crearNovedad usa uploadOperacionImagen como middleware callback,
 * lo que hace su testing más complejo. El mock simula la invocación
 * del callback inmediatamente.
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/NovedadModel');
jest.mock('../../../../middleware/upload', () => ({
    uploadOperacionImagen: jest.fn((req, res, cb) => cb(null))
}));
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const NovedadModel = require('../../models/NovedadModel');
const { uploadOperacionImagen } = require('../../../../middleware/upload');
const controller = require('../novedadController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    tenant: { id: 1, slug: 'test', nombre: 'Test Tenant' },
    usuario: { id: 1, email: 'admin@test.com' },
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    // Resetear el mock de upload para que funcione normalmente
    uploadOperacionImagen.mockImplementation((req, res, cb) => cb(null));
});

// ============================================
// crearNovedad
// ============================================
describe('crearNovedad', () => {
    test('crea novedad exitosamente', async () => {
        NovedadModel.crear.mockResolvedValue({ id: 1, tipo_novedad: 'daño' });
        const res = mockRes(); const next = mockNext();
        await controller.crearNovedad(mockReq({
            params: { id: '5' },
            body: { tipo_novedad: 'daño', descripcion: 'Elemento roto' }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(NovedadModel.crear).toHaveBeenCalledWith(1, expect.objectContaining({
            orden_id: 5,
            tipo_novedad: 'daño',
            descripcion: 'Elemento roto',
            reportada_por: 1
        }));
    });

    test('crea novedad con imagen', async () => {
        NovedadModel.crear.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.crearNovedad(mockReq({
            params: { id: '5' },
            body: { tipo_novedad: 'daño', descripcion: 'Roto' },
            file: { filename: 'foto.jpg' }
        }), res, next);
        expect(NovedadModel.crear).toHaveBeenCalledWith(1, expect.objectContaining({
            imagen_url: '/uploads/operaciones/foto.jpg'
        }));
    });

    test('error si tipo_novedad falta', async () => {
        const next = mockNext();
        await controller.crearNovedad(mockReq({
            params: { id: '5' },
            body: { descripcion: 'Algo pasó' }
        }), mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si descripcion falta', async () => {
        const next = mockNext();
        await controller.crearNovedad(mockReq({
            params: { id: '5' },
            body: { tipo_novedad: 'daño' }
        }), mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si descripcion está vacía después de trim', async () => {
        const next = mockNext();
        await controller.crearNovedad(mockReq({
            params: { id: '5' },
            body: { tipo_novedad: 'daño', descripcion: '   ' }
        }), mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si upload falla', async () => {
        uploadOperacionImagen.mockImplementation((req, res, cb) => cb(new Error('File too large')));
        const next = mockNext();
        await controller.crearNovedad(mockReq({
            params: { id: '5' },
            body: { tipo_novedad: 'daño', descripcion: 'Test' }
        }), mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// obtenerNovedadesOrden
// ============================================
describe('obtenerNovedadesOrden', () => {
    test('retorna novedades de una orden', async () => {
        NovedadModel.obtenerPorOrden.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.obtenerNovedadesOrden(mockReq({ params: { id: '5' } }), res, mockNext());
        expect(NovedadModel.obtenerPorOrden).toHaveBeenCalledWith(1, 5);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
    });
});

// ============================================
// resolverNovedad
// ============================================
describe('resolverNovedad', () => {
    test('resuelve novedad exitosamente', async () => {
        NovedadModel.resolver.mockResolvedValue({ id: 1, resuelta: true });
        const res = mockRes();
        await controller.resolverNovedad(mockReq({
            params: { id: '1' },
            body: { resolucion: 'Se reemplazó el elemento' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(NovedadModel.resolver).toHaveBeenCalledWith(1, 1, {
            resolucion: 'Se reemplazó el elemento',
            resuelta_por: 1
        });
    });

    test('error si resolución falta', async () => {
        const next = mockNext();
        await controller.resolverNovedad(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si resolución vacía después de trim', async () => {
        const next = mockNext();
        await controller.resolverNovedad(mockReq({
            params: { id: '1' },
            body: { resolucion: '   ' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 si novedad no existe', async () => {
        NovedadModel.resolver.mockResolvedValue(null);
        const next = mockNext();
        await controller.resolverNovedad(mockReq({
            params: { id: '999' },
            body: { resolucion: 'Fix' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// obtenerNovedadesPendientes
// ============================================
describe('obtenerNovedadesPendientes', () => {
    test('retorna novedades pendientes', async () => {
        NovedadModel.obtenerPendientes.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.obtenerNovedadesPendientes(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
    });
});
