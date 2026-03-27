/**
 * Tests para elementoController
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../models/ElementoModel');
jest.mock('../../models/LoteModel');
jest.mock('../../../../middleware/upload', () => ({
    deleteImageFile: jest.fn()
}));
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}));

const ElementoModel = require('../../models/ElementoModel');
const LoteModel = require('../../models/LoteModel');
const { deleteImageFile } = require('../../../../middleware/upload');
const controller = require('../elementoController');
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
// obtenerTodos
// ============================================
describe('obtenerTodos', () => {
    test('retorna todos sin paginación', async () => {
        const elementos = [{ id: 1, nombre: 'Carpa 3x3' }];
        ElementoModel.obtenerTodos.mockResolvedValue(elementos);

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: elementos,
            total: 1
        });
    });

    test('retorna paginado con page y limit', async () => {
        ElementoModel.obtenerConPaginacion.mockResolvedValue([]);
        ElementoModel.contarTodos.mockResolvedValue(0);

        const req = mockReq({ query: { page: '1', limit: '20' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(ElementoModel.obtenerConPaginacion).toHaveBeenCalled();
    });

    test('propaga errores', async () => {
        ElementoModel.obtenerTodos.mockRejectedValue(new Error('fail'));

        const req = mockReq({ query: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerTodos(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna elemento existente', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpa' });

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: 'Carpa' } });
    });

    test('error 404 si no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorId(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorCategoria
// ============================================
describe('obtenerPorCategoria', () => {
    test('retorna elementos de una categoría padre', async () => {
        ElementoModel.obtenerPorCategoria.mockResolvedValue([{ id: 1 }]);

        const req = mockReq({ params: { categoriaId: '5' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorCategoria(req, res, next);

        expect(ElementoModel.obtenerPorCategoria).toHaveBeenCalledWith('5');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1 }));
    });

    test('retorna elementos de una subcategoría con info', async () => {
        ElementoModel.obtenerPorSubcategoriaConInfo.mockResolvedValue({
            elementos: [{ id: 1 }],
            subcategoria: { id: 3, nombre: 'Sub' }
        });

        const req = mockReq({ params: { categoriaId: '1', subcategoriaId: '3' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorCategoria(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            subcategoria: { id: 3, nombre: 'Sub' }
        }));
    });

    test('error si no hay categoriaId ni subcategoriaId', async () => {
        const req = mockReq({ params: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerPorCategoria(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });
});

// ============================================
// obtenerDirectosPorCategoria
// ============================================
describe('obtenerDirectosPorCategoria', () => {
    test('retorna elementos directos', async () => {
        ElementoModel.obtenerDirectosPorCategoria.mockResolvedValue([{ id: 1 }]);

        const req = mockReq({ params: { categoriaId: '2' } });
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerDirectosPorCategoria(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1 }));
    });
});

// ============================================
// obtenerConSeries / obtenerSinSeries
// ============================================
describe('obtenerConSeries', () => {
    test('retorna elementos con series', async () => {
        ElementoModel.obtenerConSeries.mockResolvedValue([{ id: 1 }]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerConSeries(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerSinSeries', () => {
    test('retorna elementos sin series', async () => {
        ElementoModel.obtenerSinSeries.mockResolvedValue([]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerSinSeries(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });
});

// ============================================
// buscar
// ============================================
describe('buscar', () => {
    test('busca elementos por término', async () => {
        ElementoModel.buscarPorNombre.mockResolvedValue([{ id: 1, nombre: 'Carpa grande' }]);

        const req = mockReq({ query: { q: 'carpa' } });
        const res = mockRes();
        const next = mockNext();

        await controller.buscar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            termino: 'carpa',
            total: 1
        }));
    });

    test('error si término muy corto', async () => {
        const req = mockReq({ query: { q: 'a' } });
        const res = mockRes();
        const next = mockNext();

        await controller.buscar(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea elemento sin series exitosamente', async () => {
        ElementoModel.crear.mockResolvedValue(10);
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 10, nombre: 'Carpa 3x3' });

        const req = mockReq({
            body: {
                nombre: 'Carpa 3x3',
                cantidad: 5,
                requiere_series: false,
                cantidad_inicial: 0
            }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(ElementoModel.crear).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('crea elemento con lote inicial', async () => {
        ElementoModel.crear.mockResolvedValue(10);
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 10, nombre: 'Sillas' });
        LoteModel.crear.mockResolvedValue(1);

        const req = mockReq({
            body: {
                nombre: 'Sillas',
                cantidad: 50,
                requiere_series: false,
                cantidad_inicial: 50,
                estado_inicial: 'bueno'
            }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(LoteModel.crear).toHaveBeenCalledWith(expect.objectContaining({
            elemento_id: 10,
            cantidad: 50
        }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('no crea lote si requiere series', async () => {
        ElementoModel.crear.mockResolvedValue(10);
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 10, nombre: 'Carpa' });

        const req = mockReq({
            body: {
                nombre: 'Carpa',
                cantidad: 1,
                requiere_series: true,
                cantidad_inicial: 5
            }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.crear(req, res, next);

        expect(LoteModel.crear).not.toHaveBeenCalled();
    });

    test('error si nombre vacío', async () => {
        const req = mockReq({ body: { nombre: '' } });
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
    const existente = {
        id: 1, nombre: 'Carpa', descripcion: null, cantidad: 5,
        stock_minimo: 0, costo_adquisicion: null, precio_unitario: null,
        requiere_series: false, estado: 'bueno', ubicacion: null,
        fecha_ingreso: null, categoria_id: null, material_id: null, unidad_id: null
    };

    test('actualiza exitosamente', async () => {
        ElementoModel.obtenerPorId
            .mockResolvedValueOnce(existente)
            .mockResolvedValueOnce({ ...existente, nombre: 'Carpa Updated' });
        ElementoModel.actualizar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' }, body: { nombre: 'Carpa Updated' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(ElementoModel.actualizar).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' }, body: { nombre: 'Test' } });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('usa valores existentes como fallback', async () => {
        ElementoModel.obtenerPorId
            .mockResolvedValueOnce(existente)
            .mockResolvedValueOnce(existente);
        ElementoModel.actualizar.mockResolvedValue();

        const req = mockReq({ params: { id: '1' }, body: {} });
        const res = mockRes();
        const next = mockNext();

        await controller.actualizar(req, res, next);

        expect(ElementoModel.actualizar).toHaveBeenCalledWith('1', expect.objectContaining({
            nombre: 'Carpa',
            cantidad: 5
        }));
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpa' });
        ElementoModel.eliminar.mockResolvedValue(1);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('error 404 si eliminar retorna 0 filas', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpa' });
        ElementoModel.eliminar.mockResolvedValue(0);

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminar(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// obtenerAlertasStock
// ============================================
describe('obtenerAlertasStock', () => {
    test('retorna alertas de stock bajo', async () => {
        ElementoModel.obtenerConStockBajo.mockResolvedValue([{ id: 1, cantidad: 2 }]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerAlertasStock(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1 }));
    });
});

// ============================================
// obtenerEstadisticasInventario
// ============================================
describe('obtenerEstadisticasInventario', () => {
    test('retorna estadísticas del dashboard', async () => {
        ElementoModel.obtenerEstadisticasGenerales.mockResolvedValue({ total: 100 });
        ElementoModel.obtenerDistribucionPorEstado.mockResolvedValue([]);
        ElementoModel.obtenerTopCategorias.mockResolvedValue([]);
        ElementoModel.obtenerDistribucionPorUbicacion.mockResolvedValue([]);
        ElementoModel.obtenerConStockBajo.mockResolvedValue([]);

        const req = mockReq();
        const res = mockRes();
        const next = mockNext();

        await controller.obtenerEstadisticasInventario(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                generales: { total: 100 },
                distribucionEstado: [],
                topCategorias: [],
                distribucionUbicacion: [],
                alertasStock: []
            }
        });
    });
});

// ============================================
// subirImagen
// ============================================
describe('subirImagen', () => {
    test('sube imagen exitosamente', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: null });
        ElementoModel.actualizarImagen.mockResolvedValue();

        const req = mockReq({
            params: { id: '1' },
            file: { filename: 'foto.jpg' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.subirImagen(req, res, next);

        expect(ElementoModel.actualizarImagen).toHaveBeenCalledWith('1', '/uploads/elementos/foto.jpg');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('elimina imagen anterior al subir nueva', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: '/uploads/elementos/vieja.jpg' });
        ElementoModel.actualizarImagen.mockResolvedValue();

        const req = mockReq({
            params: { id: '1' },
            file: { filename: 'nueva.jpg' }
        });
        const res = mockRes();
        const next = mockNext();

        await controller.subirImagen(req, res, next);

        expect(deleteImageFile).toHaveBeenCalledWith('/uploads/elementos/vieja.jpg');
    });

    test('error si no hay archivo', async () => {
        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.subirImagen(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(400);
    });

    test('error 404 si elemento no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' }, file: { filename: 'f.jpg' } });
        const res = mockRes();
        const next = mockNext();

        await controller.subirImagen(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });
});

// ============================================
// eliminarImagen
// ============================================
describe('eliminarImagen', () => {
    test('elimina imagen exitosamente', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: '/uploads/elementos/foto.jpg' });
        ElementoModel.actualizarImagen.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminarImagen(req, res, next);

        expect(deleteImageFile).toHaveBeenCalledWith('/uploads/elementos/foto.jpg');
        expect(ElementoModel.actualizarImagen).toHaveBeenCalledWith('1', null);
    });

    test('error 404 si elemento no existe', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ params: { id: '999' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminarImagen(req, res, next);

        const error = next.mock.calls[0][0];
        expect(error.statusCode).toBe(404);
    });

    test('no falla si no tiene imagen previa', async () => {
        ElementoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: null });
        ElementoModel.actualizarImagen.mockResolvedValue();

        const req = mockReq({ params: { id: '1' } });
        const res = mockRes();
        const next = mockNext();

        await controller.eliminarImagen(req, res, next);

        expect(deleteImageFile).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
