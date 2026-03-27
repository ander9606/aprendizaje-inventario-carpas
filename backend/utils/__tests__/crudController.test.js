/**
 * Tests para crudController factory
 */

jest.mock('../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const createCrudController = require('../crudController');
const AppError = require('../AppError');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

let MockModel;
let crud;

beforeEach(() => {
    jest.clearAllMocks();
    MockModel = {
        obtenerTodos: jest.fn(),
        obtenerPorId: jest.fn(),
        obtenerConPaginacion: jest.fn(),
        contarTodos: jest.fn(),
        crear: jest.fn(),
        actualizar: jest.fn(),
        eliminar: jest.fn()
    };
    crud = createCrudController({
        Model: MockModel,
        entityName: 'TestEntity',
        controllerName: 'testController'
    });
});

describe('obtenerTodos', () => {
    test('retorna lista sin paginacion', async () => {
        MockModel.obtenerTodos.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const res = mockRes();
        await crud.obtenerTodos(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: 1 }, { id: 2 }],
            total: 2
        });
    });

    test('retorna lista con paginacion', async () => {
        MockModel.obtenerConPaginacion.mockResolvedValue([{ id: 1 }]);
        MockModel.contarTodos.mockResolvedValue(50);
        const res = mockRes();
        await crud.obtenerTodos(mockReq({ query: { page: '1', limit: '10' } }), res, mockNext());
        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.data).toEqual([{ id: 1 }]);
    });

    test('propaga error', async () => {
        MockModel.obtenerTodos.mockRejectedValue(new Error('DB'));
        const next = mockNext();
        await crud.obtenerTodos(mockReq(), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

describe('obtenerPorId', () => {
    test('retorna entidad existente', async () => {
        MockModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Test' });
        const res = mockRes();
        await crud.obtenerPorId(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { id: 1, nombre: 'Test' }
        });
    });

    test('error 404 si no existe', async () => {
        MockModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await crud.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('crear', () => {
    test('crea entidad exitosamente', async () => {
        MockModel.crear.mockResolvedValue(1);
        MockModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Nuevo' });
        const res = mockRes();
        await crud.crear(mockReq({ body: { nombre: 'Nuevo' } }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: { id: 1, nombre: 'Nuevo' }
        }));
    });

    test('ejecuta validateBody si se proporciona', async () => {
        const validateBody = jest.fn().mockReturnValue({ nombre: 'Limpio' });
        const crudWithValidation = createCrudController({
            Model: MockModel,
            entityName: 'Test',
            controllerName: 'test',
            validateBody
        });
        MockModel.crear.mockResolvedValue(1);
        MockModel.obtenerPorId.mockResolvedValue({ id: 1 });
        await crudWithValidation.crear(mockReq({ body: { nombre: 'raw' } }), mockRes(), mockNext());
        expect(validateBody).toHaveBeenCalledWith({ nombre: 'raw' });
        expect(MockModel.crear).toHaveBeenCalledWith({ nombre: 'Limpio' });
    });

    test('ejecuta checkDuplicate si se proporciona', async () => {
        const checkDuplicate = jest.fn().mockRejectedValue(new AppError('Duplicado', 400));
        const crudWithCheck = createCrudController({
            Model: MockModel,
            entityName: 'Test',
            controllerName: 'test',
            checkDuplicate
        });
        const next = mockNext();
        await crudWithCheck.crear(mockReq({ body: { nombre: 'Dup' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('actualizar', () => {
    test('actualiza entidad exitosamente', async () => {
        MockModel.obtenerPorId
            .mockResolvedValueOnce({ id: 1, nombre: 'Viejo' })
            .mockResolvedValueOnce({ id: 1, nombre: 'Nuevo' });
        MockModel.actualizar.mockResolvedValue(1);
        const res = mockRes();
        await crud.actualizar(mockReq({ params: { id: '1' }, body: { nombre: 'Nuevo' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: { id: 1, nombre: 'Nuevo' }
        }));
    });

    test('error 404 si no existe', async () => {
        MockModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await crud.actualizar(mockReq({ params: { id: '999' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('pasa existing a validateBody', async () => {
        const validateBody = jest.fn().mockReturnValue({ nombre: 'Ok' });
        const crudWithValidation = createCrudController({
            Model: MockModel,
            entityName: 'Test',
            controllerName: 'test',
            validateBody
        });
        const existing = { id: 1, nombre: 'Viejo' };
        MockModel.obtenerPorId.mockResolvedValueOnce(existing).mockResolvedValueOnce({ id: 1 });
        MockModel.actualizar.mockResolvedValue(1);
        await crudWithValidation.actualizar(mockReq({ params: { id: '1' }, body: { nombre: 'Nuevo' } }), mockRes(), mockNext());
        expect(validateBody).toHaveBeenCalledWith({ nombre: 'Nuevo' }, existing);
    });
});

describe('eliminar', () => {
    test('elimina entidad exitosamente', async () => {
        MockModel.obtenerPorId.mockResolvedValue({ id: 1 });
        MockModel.eliminar.mockResolvedValue(1);
        const res = mockRes();
        await crud.eliminar(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true
        }));
    });

    test('error 404 si no existe', async () => {
        MockModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await crud.eliminar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error 400 si FK constraint', async () => {
        MockModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const fkError = new Error('FK');
        fkError.code = 'ER_ROW_IS_REFERENCED_2';
        MockModel.eliminar.mockRejectedValue(fkError);
        const next = mockNext();
        await crud.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});
