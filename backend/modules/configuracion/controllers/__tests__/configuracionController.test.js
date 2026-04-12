/**
 * Tests para configuracionController
 *
 * Endpoints: obtenerTodas, obtenerPorCategoria, obtenerValor,
 * obtenerConfiguracionCompleta, actualizarValor, actualizarValores,
 * obtenerCategorias, subirLogo, eliminarLogo
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/ConfiguracionModel');
jest.mock('multer', () => {
    const m = jest.fn(() => ({ single: jest.fn() }));
    m.diskStorage = jest.fn();
    return m;
});

const ConfiguracionModel = require('../../models/ConfiguracionModel');
const fs = require('fs');
const controller = require('../configuracionController');

jest.mock('fs');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, tenant: { id: 1, slug: 'test', nombre: 'Test Tenant' }, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('obtenerTodas', () => {
    test('retorna configuraciones agrupadas por categoría', async () => {
        ConfiguracionModel.obtenerTodas.mockResolvedValue([
            { clave: 'a', categoria: 'empresa' },
            { clave: 'b', categoria: 'empresa' },
            { clave: 'c', categoria: 'alquiler' }
        ]);
        const res = mockRes();
        await controller.obtenerTodas(mockReq(), res, mockNext());
        const call = res.json.mock.calls[0][0];
        expect(call.success).toBe(true);
        expect(call.agrupadas.empresa).toHaveLength(2);
        expect(call.agrupadas.alquiler).toHaveLength(1);
    });
});

describe('obtenerPorCategoria', () => {
    test('retorna configuraciones de una categoría', async () => {
        ConfiguracionModel.obtenerPorCategoria.mockResolvedValue([{ clave: 'a' }]);
        const res = mockRes();
        await controller.obtenerPorCategoria(mockReq({ params: { categoria: 'empresa' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ clave: 'a' }] });
    });
});

describe('obtenerValor', () => {
    test('retorna valor específico', async () => {
        ConfiguracionModel.obtenerValor.mockResolvedValue('Mi Empresa');
        const res = mockRes();
        await controller.obtenerValor(mockReq({ params: { clave: 'empresa_nombre' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { clave: 'empresa_nombre', valor: 'Mi Empresa' }
        });
    });

    test('error 404 si configuración no existe', async () => {
        ConfiguracionModel.obtenerValor.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerValor(mockReq({ params: { clave: 'no_existe' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerConfiguracionCompleta', () => {
    test('retorna configuración como objeto', async () => {
        ConfiguracionModel.obtenerConfiguracionCompleta.mockResolvedValue({ empresa_nombre: 'Test' });
        const res = mockRes();
        await controller.obtenerConfiguracionCompleta(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { empresa_nombre: 'Test' } });
    });
});

describe('actualizarValor', () => {
    test('actualiza valor exitosamente', async () => {
        ConfiguracionModel.actualizarValor.mockResolvedValue();
        ConfiguracionModel.obtenerValor.mockResolvedValue('Nuevo Valor');
        const res = mockRes();
        await controller.actualizarValor(mockReq({
            params: { clave: 'empresa_nombre' },
            body: { valor: 'Nuevo Valor' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: { clave: 'empresa_nombre', valor: 'Nuevo Valor' }
        }));
    });

    test('error si valor es undefined', async () => {
        const next = mockNext();
        await controller.actualizarValor(mockReq({
            params: { clave: 'test' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('actualizarValores', () => {
    test('actualiza múltiples valores exitosamente', async () => {
        ConfiguracionModel.actualizarValores.mockResolvedValue({ actualizados: 2 });
        ConfiguracionModel.obtenerConfiguracionCompleta.mockResolvedValue({ a: '1', b: '2' });
        const res = mockRes();
        await controller.actualizarValores(mockReq({
            body: { valores: { a: '1', b: '2' } }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: '2 configuraciones actualizadas'
        }));
    });

    test('error si valores no es objeto', async () => {
        const next = mockNext();
        await controller.actualizarValores(mockReq({
            body: { valores: 'not_an_object' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si valores falta', async () => {
        const next = mockNext();
        await controller.actualizarValores(mockReq({ body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerCategorias', () => {
    test('retorna categorías disponibles', async () => {
        ConfiguracionModel.obtenerCategorias.mockResolvedValue(['empresa', 'alquiler']);
        const res = mockRes();
        await controller.obtenerCategorias(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: ['empresa', 'alquiler'] });
    });
});

describe('subirLogo', () => {
    test('sube logo exitosamente', async () => {
        ConfiguracionModel.actualizarValor.mockResolvedValue();
        const res = mockRes();
        await controller.subirLogo(mockReq({
            file: { filename: 'logo_empresa.png' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Logo subido correctamente',
            data: { url: '/uploads/logos/logo_empresa.png' }
        });
    });

    test('error si no se recibe archivo', async () => {
        const next = mockNext();
        await controller.subirLogo(mockReq(), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('eliminarLogo', () => {
    test('elimina logo existente', async () => {
        ConfiguracionModel.obtenerValor.mockResolvedValue('/uploads/logos/logo.png');
        ConfiguracionModel.actualizarValor.mockResolvedValue();
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockReturnValue();
        const res = mockRes();
        await controller.eliminarLogo(mockReq(), res, mockNext());
        expect(fs.unlinkSync).toHaveBeenCalled();
        expect(ConfiguracionModel.actualizarValor).toHaveBeenCalledWith(1, 'empresa_logo', '');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('no intenta eliminar archivo si no existe', async () => {
        ConfiguracionModel.obtenerValor.mockResolvedValue('/uploads/logos/logo.png');
        ConfiguracionModel.actualizarValor.mockResolvedValue();
        fs.existsSync.mockReturnValue(false);
        const res = mockRes();
        await controller.eliminarLogo(mockReq(), res, mockNext());
        expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    test('funciona sin logo previo', async () => {
        ConfiguracionModel.obtenerValor.mockResolvedValue(null);
        ConfiguracionModel.actualizarValor.mockResolvedValue();
        const res = mockRes();
        await controller.eliminarLogo(mockReq(), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
