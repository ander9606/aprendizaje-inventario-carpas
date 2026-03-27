/**
 * Tests para elementoCompuestoController
 *
 * Endpoints testeados:
 * - obtenerTodos, obtenerPorCategoria, buscar
 * - obtenerPorId, obtenerPorIdConComponentes (404)
 * - crear: valida categoria_id, nombre, categoría existe, componentes opcionales
 * - actualizar: valida existencia, nombre obligatorio
 * - eliminar: verifica cotizaciones asociadas
 * - obtenerComponentesAgrupados, agregarComponente, eliminarComponente, actualizarComponentes
 * - subirImagen, eliminarImagen
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/ElementoCompuestoModel');
jest.mock('../../models/CompuestoComponenteModel');
jest.mock('../../models/CategoriaProductoModel');
jest.mock('../../../../middleware/upload', () => ({ deleteImageFile: jest.fn() }));
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const ElementoCompuestoModel = require('../../models/ElementoCompuestoModel');
const CompuestoComponenteModel = require('../../models/CompuestoComponenteModel');
const CategoriaProductoModel = require('../../models/CategoriaProductoModel');
const { deleteImageFile } = require('../../../../middleware/upload');
const controller = require('../elementoCompuestoController');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

// ============================================
// Listados simples
// ============================================
describe('obtenerTodos', () => {
    test('retorna todos los elementos', async () => {
        ElementoCompuestoModel.obtenerTodos.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.obtenerTodos(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerPorCategoria', () => {
    test('retorna elementos de una categoría', async () => {
        ElementoCompuestoModel.obtenerPorCategoria.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.obtenerPorCategoria(mockReq({ params: { categoriaId: '5' } }), res, mockNext());
        expect(ElementoCompuestoModel.obtenerPorCategoria).toHaveBeenCalledWith('5');
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna elemento existente', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpa 3x3' });
        const res = mockRes();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, nombre: 'Carpa 3x3' } });
    });

    test('error 404 si no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// obtenerPorIdConComponentes
// ============================================
describe('obtenerPorIdConComponentes', () => {
    test('retorna elemento con componentes', async () => {
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue({ id: 1, componentes: [] });
        const res = mockRes();
        await controller.obtenerPorIdConComponentes(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, componentes: [] } });
    });

    test('error 404 si no existe', async () => {
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorIdConComponentes(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// obtenerComponentesAgrupados
// ============================================
describe('obtenerComponentesAgrupados', () => {
    test('retorna componentes agrupados', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Carpa' });
        CompuestoComponenteModel.obtenerAgrupados.mockResolvedValue([{ grupo: 'estructura' }]);
        const res = mockRes();
        await controller.obtenerComponentesAgrupados(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { elemento: { id: 1, nombre: 'Carpa' }, componentes: [{ grupo: 'estructura' }] }
        });
    });

    test('error 404 si elemento no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerComponentesAgrupados(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea elemento exitosamente', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ElementoCompuestoModel.crear.mockResolvedValue({ insertId: 1 });
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue({ id: 1, nombre: 'Carpa' });
        const res = mockRes();
        await controller.crear(mockReq({
            body: { categoria_id: 1, nombre: 'Carpa', precio_base: 100 }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: 'Elemento compuesto creado exitosamente'
        }));
    });

    test('crea con componentes', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ElementoCompuestoModel.crear.mockResolvedValue({ insertId: 1 });
        CompuestoComponenteModel.agregarMultiples.mockResolvedValue();
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.crear(mockReq({
            body: {
                categoria_id: 1,
                nombre: 'Carpa',
                componentes: [{ elemento_id: 10, cantidad: 4 }]
            }
        }), res, mockNext());
        expect(CompuestoComponenteModel.agregarMultiples).toHaveBeenCalledWith(1, [{ elemento_id: 10, cantidad: 4 }]);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('no agrega componentes si array vacío', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ElementoCompuestoModel.crear.mockResolvedValue({ insertId: 1 });
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.crear(mockReq({
            body: { categoria_id: 1, nombre: 'Carpa', componentes: [] }
        }), res, mockNext());
        expect(CompuestoComponenteModel.agregarMultiples).not.toHaveBeenCalled();
    });

    test('error si falta categoria_id', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'Carpa' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('categoría');
    });

    test('error si nombre vacío', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { categoria_id: 1, nombre: '' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si categoría no existe', async () => {
        CategoriaProductoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.crear(mockReq({ body: { categoria_id: 999, nombre: 'Test' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
        expect(next.mock.calls[0][0].message).toContain('Categoría no encontrada');
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza exitosamente', async () => {
        ElementoCompuestoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1 })
            .mockResolvedValueOnce({ id: 1, nombre: 'Carpa XL' });
        ElementoCompuestoModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Carpa XL' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '999' },
            body: { nombre: 'Test' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si nombre vacío', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: '' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ElementoCompuestoModel.tieneCotizaciones.mockResolvedValue(false);
        ElementoCompuestoModel.eliminar.mockResolvedValue();
        const res = mockRes();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Elemento compuesto eliminado exitosamente'
        });
    });

    test('error 404 si no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si tiene cotizaciones', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ElementoCompuestoModel.tieneCotizaciones.mockResolvedValue(true);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('cotizaciones');
    });
});

// ============================================
// buscar
// ============================================
describe('buscar', () => {
    test('busca exitosamente', async () => {
        ElementoCompuestoModel.buscar.mockResolvedValue([{ id: 1, nombre: 'Carpa 3x3' }]);
        const res = mockRes();
        await controller.buscar(mockReq({ query: { q: 'Carpa' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1, nombre: 'Carpa 3x3' }],
            total: 1
        });
    });

    test('error si término menor a 2 caracteres', async () => {
        const next = mockNext();
        await controller.buscar(mockReq({ query: { q: 'C' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si no hay término', async () => {
        const next = mockNext();
        await controller.buscar(mockReq({ query: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// agregarComponente
// ============================================
describe('agregarComponente', () => {
    test('agrega componente exitosamente', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CompuestoComponenteModel.existeEnCompuesto.mockResolvedValue(false);
        CompuestoComponenteModel.agregar.mockResolvedValue();
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue({ id: 1, componentes: [{ id: 10 }] });
        const res = mockRes();
        await controller.agregarComponente(mockReq({
            params: { id: '1' },
            body: { elemento_id: 10, cantidad: 4 }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: 'Componente agregado exitosamente'
        }));
    });

    test('error 404 si elemento compuesto no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.agregarComponente(mockReq({
            params: { id: '999' },
            body: { elemento_id: 10 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si falta elemento_id', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.agregarComponente(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si componente ya existe en compuesto', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CompuestoComponenteModel.existeEnCompuesto.mockResolvedValue(true);
        const next = mockNext();
        await controller.agregarComponente(mockReq({
            params: { id: '1' },
            body: { elemento_id: 10 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('ya está agregado');
    });
});

// ============================================
// eliminarComponente
// ============================================
describe('eliminarComponente', () => {
    test('elimina componente exitosamente', async () => {
        CompuestoComponenteModel.obtenerPorId.mockResolvedValue({ id: 5, compuesto_id: 1 });
        CompuestoComponenteModel.eliminar.mockResolvedValue();
        const res = mockRes();
        await controller.eliminarComponente(mockReq({
            params: { id: '1', componenteId: '5' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Componente eliminado exitosamente'
        });
    });

    test('error 404 si componente no existe', async () => {
        CompuestoComponenteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminarComponente(mockReq({
            params: { id: '1', componenteId: '999' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error 404 si componente pertenece a otro compuesto', async () => {
        CompuestoComponenteModel.obtenerPorId.mockResolvedValue({ id: 5, compuesto_id: 99 });
        const next = mockNext();
        await controller.eliminarComponente(mockReq({
            params: { id: '1', componenteId: '5' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// actualizarComponentes (reemplazar todos)
// ============================================
describe('actualizarComponentes', () => {
    test('reemplaza componentes exitosamente', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CompuestoComponenteModel.eliminarPorCompuesto.mockResolvedValue();
        CompuestoComponenteModel.agregarMultiples.mockResolvedValue();
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue({ id: 1, componentes: [{ id: 10 }] });
        const res = mockRes();
        await controller.actualizarComponentes(mockReq({
            params: { id: '1' },
            body: { componentes: [{ elemento_id: 10, cantidad: 2 }] }
        }), res, mockNext());
        expect(CompuestoComponenteModel.eliminarPorCompuesto).toHaveBeenCalledWith('1');
        expect(CompuestoComponenteModel.agregarMultiples).toHaveBeenCalledWith('1', [{ elemento_id: 10, cantidad: 2 }]);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('reemplaza con lista vacía (elimina todos)', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CompuestoComponenteModel.eliminarPorCompuesto.mockResolvedValue();
        ElementoCompuestoModel.obtenerPorIdConComponentes.mockResolvedValue({ id: 1, componentes: [] });
        const res = mockRes();
        await controller.actualizarComponentes(mockReq({
            params: { id: '1' },
            body: { componentes: [] }
        }), res, mockNext());
        expect(CompuestoComponenteModel.eliminarPorCompuesto).toHaveBeenCalled();
        expect(CompuestoComponenteModel.agregarMultiples).not.toHaveBeenCalled();
    });

    test('error 404 si elemento no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizarComponentes(mockReq({
            params: { id: '999' },
            body: { componentes: [] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// subirImagen
// ============================================
describe('subirImagen', () => {
    test('sube imagen exitosamente', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: null });
        ElementoCompuestoModel.actualizarImagen.mockResolvedValue();
        const res = mockRes();
        await controller.subirImagen(mockReq({
            params: { id: '1' },
            file: { filename: 'carpa.jpg' }
        }), res, mockNext());
        expect(ElementoCompuestoModel.actualizarImagen).toHaveBeenCalledWith('1', '/uploads/productos/carpa.jpg');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: { imagen: '/uploads/productos/carpa.jpg' }
        }));
    });

    test('elimina imagen anterior antes de subir nueva', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: '/uploads/productos/old.jpg' });
        ElementoCompuestoModel.actualizarImagen.mockResolvedValue();
        const res = mockRes();
        await controller.subirImagen(mockReq({
            params: { id: '1' },
            file: { filename: 'new.jpg' }
        }), res, mockNext());
        expect(deleteImageFile).toHaveBeenCalledWith('/uploads/productos/old.jpg');
    });

    test('error si no se recibe archivo', async () => {
        const next = mockNext();
        await controller.subirImagen(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('archivo');
    });

    test('error 404 si elemento no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.subirImagen(mockReq({
            params: { id: '999' },
            file: { filename: 'test.jpg' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// eliminarImagen
// ============================================
describe('eliminarImagen', () => {
    test('elimina imagen exitosamente', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: '/uploads/productos/carpa.jpg' });
        ElementoCompuestoModel.actualizarImagen.mockResolvedValue();
        const res = mockRes();
        await controller.eliminarImagen(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(deleteImageFile).toHaveBeenCalledWith('/uploads/productos/carpa.jpg');
        expect(ElementoCompuestoModel.actualizarImagen).toHaveBeenCalledWith('1', null);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('no llama deleteImageFile si no hay imagen', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue({ id: 1, imagen: null });
        ElementoCompuestoModel.actualizarImagen.mockResolvedValue();
        const res = mockRes();
        await controller.eliminarImagen(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(deleteImageFile).not.toHaveBeenCalled();
        expect(ElementoCompuestoModel.actualizarImagen).toHaveBeenCalledWith('1', null);
    });

    test('error 404 si elemento no existe', async () => {
        ElementoCompuestoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminarImagen(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
