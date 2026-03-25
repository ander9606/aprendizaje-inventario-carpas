/**
 * Tests para departamentoController
 *
 * Endpoints testeados:
 * - obtenerTodos: lista todos los departamentos
 * - obtenerActivos: lista solo departamentos activos
 * - obtenerPorId: obtiene departamento por ID (404 si no existe)
 * - crear: crea departamento (valida nombre obligatorio y duplicado)
 * - actualizar: actualiza departamento (valida existencia y nombre único)
 * - eliminar: elimina departamento (captura error de ciudades asociadas)
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/DepartamentoModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const DepartamentoModel = require('../../models/DepartamentoModel');
const controller = require('../departamentoController');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

// ============================================
// obtenerTodos
// ============================================
describe('obtenerTodos', () => {
    test('retorna lista de departamentos', async () => {
        DepartamentoModel.obtenerTodos.mockResolvedValue([{ id: 1, nombre: 'Cundinamarca' }]);
        const res = mockRes();
        await controller.obtenerTodos(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1, nombre: 'Cundinamarca' }],
            total: 1
        });
    });

    test('propaga error al next', async () => {
        DepartamentoModel.obtenerTodos.mockRejectedValue(new Error('DB'));
        const next = mockNext();
        await controller.obtenerTodos(mockReq(), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

// ============================================
// obtenerActivos
// ============================================
describe('obtenerActivos', () => {
    test('retorna solo departamentos activos', async () => {
        DepartamentoModel.obtenerActivos.mockResolvedValue([{ id: 1, activo: true }]);
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
    test('retorna departamento existente', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cundinamarca' });
        const res = mockRes();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { id: 1, nombre: 'Cundinamarca' }
        });
    });

    test('error 404 si no existe', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// crear
// ============================================
describe('crear', () => {
    test('crea departamento exitosamente', async () => {
        DepartamentoModel.nombreExiste.mockResolvedValue(false);
        DepartamentoModel.crear.mockResolvedValue({ insertId: 1 });
        DepartamentoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Valle' });
        const res = mockRes();
        await controller.crear(mockReq({ body: { nombre: 'Valle' } }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Departamento creado exitosamente'
        }));
    });

    test('error si nombre vacío', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: '' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('nombre');
    });

    test('error si nombre falta', async () => {
        const next = mockNext();
        await controller.crear(mockReq({ body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si nombre duplicado', async () => {
        DepartamentoModel.nombreExiste.mockResolvedValue(true);
        const next = mockNext();
        await controller.crear(mockReq({ body: { nombre: 'Cundinamarca' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Ya existe');
    });

    test('hace trim del nombre', async () => {
        DepartamentoModel.nombreExiste.mockResolvedValue(false);
        DepartamentoModel.crear.mockResolvedValue({ insertId: 1 });
        DepartamentoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.crear(mockReq({ body: { nombre: '  Valle  ' } }), res, mockNext());
        expect(DepartamentoModel.nombreExiste).toHaveBeenCalledWith('Valle');
        expect(DepartamentoModel.crear).toHaveBeenCalledWith({ nombre: 'Valle' });
    });
});

// ============================================
// actualizar
// ============================================
describe('actualizar', () => {
    test('actualiza departamento exitosamente', async () => {
        DepartamentoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Cundinamarca' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Cundinamarca Dept' });
        DepartamentoModel.nombreExiste.mockResolvedValue(false);
        DepartamentoModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Cundinamarca Dept' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            mensaje: 'Departamento actualizado exitosamente'
        }));
    });

    test('error 404 si no existe', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '999' },
            body: { nombre: 'Test' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si nombre duplicado', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Cundinamarca' });
        DepartamentoModel.nombreExiste.mockResolvedValue(true);
        const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Valle' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('no verifica duplicado si nombre no cambia', async () => {
        DepartamentoModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Cundinamarca' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Cundinamarca' });
        DepartamentoModel.actualizar.mockResolvedValue();
        const res = mockRes();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { nombre: 'Cundinamarca', activo: true }
        }), res, mockNext());
        expect(DepartamentoModel.nombreExiste).not.toHaveBeenCalled();
    });
});

// ============================================
// eliminar
// ============================================
describe('eliminar', () => {
    test('elimina departamento exitosamente', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        DepartamentoModel.eliminar.mockResolvedValue();
        const res = mockRes();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            mensaje: 'Departamento eliminado exitosamente'
        });
    });

    test('error 404 si no existe', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error 400 si tiene ciudades asociadas', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        DepartamentoModel.eliminar.mockRejectedValue(new Error('Tiene ciudades asociadas'));
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('propaga otros errores sin transformar', async () => {
        DepartamentoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        DepartamentoModel.eliminar.mockRejectedValue(new Error('DB crash'));
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].message).toBe('DB crash');
    });
});
