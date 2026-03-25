/**
 * Tests para clienteController
 *
 * Endpoints testeados:
 * - obtenerTodos: lista todos los clientes
 * - obtenerActivos: lista solo clientes activos
 * - obtenerPorId: obtiene un cliente por ID (404 si no existe)
 * - crear: crea cliente (valida documento, nombre, duplicado)
 * - actualizar: actualiza cliente (valida existencia, documento, duplicado en otro)
 * - eliminar: elimina cliente (verifica cotizaciones asociadas)
 * - obtenerHistorialEventos: historial de eventos del cliente
 * - buscar: busca clientes (mínimo 2 caracteres)
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/ClienteModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const ClienteModel = require('../../models/ClienteModel');
const controller = require('../clienteController');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

// ============================================
// obtenerTodos
// ============================================
describe('obtenerTodos', () => {
    test('retorna lista de clientes', async () => {
        ClienteModel.obtenerTodos.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const res = mockRes();
        await controller.obtenerTodos(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1 }, { id: 2 }],
            total: 2
        });
    });

    test('propaga error al next', async () => {
        ClienteModel.obtenerTodos.mockRejectedValue(new Error('DB'));
        const next = mockNext();
        await controller.obtenerTodos(mockReq(), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

// ============================================
// obtenerActivos
// ============================================
describe('obtenerActivos', () => {
    test('retorna solo clientes activos', async () => {
        ClienteModel.obtenerActivos.mockResolvedValue([{ id: 1, activo: true }]);
        const res = mockRes();
        await controller.obtenerActivos(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1, activo: true }],
            total: 1
        });
    });
});

// ============================================
// obtenerPorId
// ============================================
describe('obtenerPorId', () => {
    test('retorna cliente existente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Juan' });
        const res = mockRes();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { id: 1, nombre: 'Juan' }
        });
    });

    test('error 404 si no existe', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea cliente exitosamente', async () => {
        ClienteModel.obtenerPorDocumento.mockResolvedValue(null);
        ClienteModel.crear.mockResolvedValue({ insertId: 1 });
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Juan' });
        const res = mockRes(); const next = mockNext();
        await controller.crear(mockReq({
            body: { numero_documento: '123', nombre: 'Juan', tipo_documento: 'CC' }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Cliente creado exitosamente'
        }));
    });

    test('error si numero_documento vacío', async () => {
        const next = mockNext();
        await controller.crear(mockReq({
            body: { numero_documento: '', nombre: 'Juan' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('número de documento');
    });

    test('error si numero_documento falta', async () => {
        const next = mockNext();
        await controller.crear(mockReq({
            body: { nombre: 'Juan' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si nombre vacío', async () => {
        const next = mockNext();
        await controller.crear(mockReq({
            body: { numero_documento: '123', nombre: '' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('nombre');
    });

    test('error si nombre falta', async () => {
        const next = mockNext();
        await controller.crear(mockReq({
            body: { numero_documento: '123' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si documento ya existe', async () => {
        ClienteModel.obtenerPorDocumento.mockResolvedValue({ id: 5 });
        const next = mockNext();
        await controller.crear(mockReq({
            body: { numero_documento: '123', nombre: 'Juan' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Ya existe');
    });

    test('usa CC como tipo_documento por defecto', async () => {
        ClienteModel.obtenerPorDocumento.mockResolvedValue(null);
        ClienteModel.crear.mockResolvedValue({ insertId: 1 });
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.crear(mockReq({
            body: { numero_documento: '123', nombre: 'Juan' }
        }), res, mockNext());
        expect(ClienteModel.obtenerPorDocumento).toHaveBeenCalledWith('CC', '123');
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza cliente exitosamente', async () => {
        ClienteModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Juan' })  // verificar existencia
            .mockResolvedValueOnce({ id: 1, nombre: 'Pedro' }); // retornar actualizado
        ClienteModel.obtenerPorDocumento.mockResolvedValue(null);
        ClienteModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { numero_documento: '123', nombre: 'Pedro', tipo_documento: 'CC' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Cliente actualizado exitosamente'
        }));
    });

    test('error 404 si cliente no existe', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '999' },
            body: { numero_documento: '123', nombre: 'Pedro' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si numero_documento vacío', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { numero_documento: '', nombre: 'Pedro' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si nombre vacío', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { numero_documento: '123', nombre: '' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si documento duplicado en otro cliente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ClienteModel.obtenerPorDocumento.mockResolvedValue({ id: 5 }); // otro cliente
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { numero_documento: '123', nombre: 'Pedro' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('otro cliente');
    });

    test('permite mismo documento si es el mismo cliente', async () => {
        ClienteModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Juan' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Pedro' });
        ClienteModel.obtenerPorDocumento.mockResolvedValue({ id: 1 }); // mismo cliente
        ClienteModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { numero_documento: '123', nombre: 'Pedro' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina cliente exitosamente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ClienteModel.tieneCotizaciones.mockResolvedValue(false);
        ClienteModel.eliminar.mockResolvedValue();
        const res = mockRes();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            mensaje: 'Cliente eliminado exitosamente'
        });
    });

    test('error 404 si no existe', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si tiene cotizaciones asociadas', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        ClienteModel.tieneCotizaciones.mockResolvedValue(true);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('cotizaciones');
    });
});

// ============================================
// obtenerHistorialEventos
// ============================================
describe('obtenerHistorialEventos', () => {
    test('retorna historial del cliente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Juan' });
        ClienteModel.obtenerHistorialEventos.mockResolvedValue({ eventos: [], total: 0 });
        const res = mockRes();
        await controller.obtenerHistorialEventos(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                cliente: { id: 1, nombre: 'Juan' },
                eventos: [],
                total: 0
            }
        });
    });

    test('error 404 si cliente no existe', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerHistorialEventos(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// buscar
// ============================================
describe('buscar', () => {
    test('busca clientes exitosamente', async () => {
        ClienteModel.buscar.mockResolvedValue([{ id: 1, nombre: 'Juan' }]);
        const res = mockRes();
        await controller.buscar(mockReq({ query: { q: 'Juan' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1, nombre: 'Juan' }],
            total: 1
        });
        expect(ClienteModel.buscar).toHaveBeenCalledWith('Juan');
    });

    test('error si término menor a 2 caracteres', async () => {
        const next = mockNext();
        await controller.buscar(mockReq({ query: { q: 'J' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('2 caracteres');
    });

    test('error si no hay término de búsqueda', async () => {
        const next = mockNext();
        await controller.buscar(mockReq({ query: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('hace trim del término de búsqueda', async () => {
        ClienteModel.buscar.mockResolvedValue([]);
        const res = mockRes();
        await controller.buscar(mockReq({ query: { q: '  Juan  ' } }), res, mockNext());
        expect(ClienteModel.buscar).toHaveBeenCalledWith('Juan');
    });
});
