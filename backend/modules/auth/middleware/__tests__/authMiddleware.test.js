/**
 * Tests para authMiddleware
 *
 * Verifica que los 5 middlewares de autenticación/autorización
 * funcionan correctamente como guardianes de las rutas.
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../../services/TokenService');
jest.mock('../../../../utils/AppError');

const TokenService = require('../../services/TokenService');
const AppError = require('../../../../utils/AppError');
const {
    verificarToken,
    verificarTokenOpcional,
    verificarRol,
    verificarPermiso,
    verificarPropietario,
    authRol,
    authPermiso
} = require('../authMiddleware');

// AppError real — necesitamos que sea un Error para que el test funcione
AppError.mockImplementation((message, statusCode) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
});

// Helpers para crear req/res/next mock
const mockReq = (overrides = {}) => ({
    headers: {},
    usuario: null,
    ...overrides
});

const mockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
});

const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

// ============================================
// verificarToken
// ============================================
describe('verificarToken', () => {
    const decodedUser = {
        id: 1,
        email: 'admin@test.com',
        nombre: 'Admin',
        apellido: 'Test',
        rol_id: 1,
        rol_nombre: 'admin',
        permisos: { inventario: { leer: true } }
    };

    test('permite la petición si el token es válido', () => {
        TokenService.verificarAccessToken.mockReturnValue(decodedUser);
        const req = mockReq({ headers: { authorization: 'Bearer valid-token-123' } });
        const next = mockNext();

        verificarToken(req, {}, next);

        expect(TokenService.verificarAccessToken).toHaveBeenCalledWith('valid-token-123');
        expect(req.usuario).toEqual(decodedUser);
        expect(next).toHaveBeenCalledWith(); // sin error
    });

    test('rechaza si no hay header Authorization', () => {
        const req = mockReq();
        const next = mockNext();

        verificarToken(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe('Token de autenticación no proporcionado');
    });

    test('rechaza si el formato no es "Bearer <token>"', () => {
        const req = mockReq({ headers: { authorization: 'Basic abc123' } });
        const next = mockNext();

        verificarToken(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('Formato de token inválido');
    });

    test('rechaza si el header tiene más de 2 partes', () => {
        const req = mockReq({ headers: { authorization: 'Bearer token extra' } });
        const next = mockNext();

        verificarToken(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('rechaza si TokenService lanza error (token expirado/inválido)', () => {
        TokenService.verificarAccessToken.mockImplementation(() => {
            throw new Error('jwt expired');
        });
        const req = mockReq({ headers: { authorization: 'Bearer expired-token' } });
        const next = mockNext();

        verificarToken(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(req.usuario).toBeNull(); // no debe setear usuario
    });
});

// ============================================
// verificarTokenOpcional
// ============================================
describe('verificarTokenOpcional', () => {
    test('continúa con usuario null si no hay header', () => {
        const req = mockReq();
        const next = mockNext();

        verificarTokenOpcional(req, {}, next);

        expect(req.usuario).toBeNull();
        expect(next).toHaveBeenCalledWith(); // sin error
    });

    test('continúa con usuario null si el formato es inválido', () => {
        const req = mockReq({ headers: { authorization: 'InvalidFormat' } });
        const next = mockNext();

        verificarTokenOpcional(req, {}, next);

        expect(req.usuario).toBeNull();
        expect(next).toHaveBeenCalledWith();
    });

    test('setea usuario si el token es válido', () => {
        const decoded = { id: 1, email: 'test@test.com', nombre: 'Test', apellido: 'User', rol_id: 1, rol_nombre: 'admin', permisos: {} };
        TokenService.verificarAccessToken.mockReturnValue(decoded);
        const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
        const next = mockNext();

        verificarTokenOpcional(req, {}, next);

        expect(req.usuario).toEqual(decoded);
        expect(next).toHaveBeenCalledWith();
    });

    test('continúa con usuario null si el token es inválido (no bloquea)', () => {
        TokenService.verificarAccessToken.mockImplementation(() => {
            throw new Error('jwt expired');
        });
        const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
        const next = mockNext();

        verificarTokenOpcional(req, {}, next);

        expect(req.usuario).toBeNull();
        expect(next).toHaveBeenCalledWith(); // NO pasa error, a diferencia de verificarToken
    });
});

// ============================================
// verificarRol
// ============================================
describe('verificarRol', () => {
    test('permite si el rol del usuario está en la lista', () => {
        const middleware = verificarRol(['admin', 'gerente']);
        const req = mockReq({ usuario: { rol_nombre: 'admin' } });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(); // sin error
    });

    test('rechaza con 403 si el rol no está en la lista', () => {
        const middleware = verificarRol(['admin']);
        const req = mockReq({ usuario: { rol_nombre: 'ventas' } });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('Acceso denegado');
    });

    test('rechaza con 401 si no hay usuario autenticado', () => {
        const middleware = verificarRol(['admin']);
        const req = mockReq({ usuario: null });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe('Usuario no autenticado');
    });

    test('incluye los roles permitidos en el mensaje de error', () => {
        const middleware = verificarRol(['admin', 'gerente']);
        const req = mockReq({ usuario: { rol_nombre: 'ventas' } });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next.mock.calls[0][0].message).toContain('admin o gerente');
    });
});

// ============================================
// verificarPermiso
// ============================================
describe('verificarPermiso', () => {
    test('admin tiene acceso total sin verificar permisos', () => {
        const middleware = verificarPermiso('inventario', 'eliminar');
        const req = mockReq({
            usuario: { rol_nombre: 'admin', permisos: {} } // permisos vacíos, pero es admin
        });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(); // pasa directo
    });

    test('permite si el usuario tiene el permiso específico', () => {
        const middleware = verificarPermiso('inventario', 'leer');
        const req = mockReq({
            usuario: {
                rol_nombre: 'ventas',
                permisos: { inventario: { leer: true, crear: false } }
            }
        });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    test('rechaza con 403 si no tiene el permiso de la acción', () => {
        const middleware = verificarPermiso('inventario', 'eliminar');
        const req = mockReq({
            usuario: {
                rol_nombre: 'ventas',
                permisos: { inventario: { leer: true, eliminar: false } }
            }
        });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('eliminar en inventario');
    });

    test('rechaza con 403 si no tiene acceso al módulo', () => {
        const middleware = verificarPermiso('alquileres', 'leer');
        const req = mockReq({
            usuario: {
                rol_nombre: 'operaciones',
                permisos: { inventario: { leer: true } } // no tiene alquileres
            }
        });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('módulo: alquileres');
    });

    test('rechaza si permisos es null/undefined', () => {
        const middleware = verificarPermiso('inventario', 'leer');
        const req = mockReq({
            usuario: { rol_nombre: 'ventas', permisos: null }
        });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('rechaza con 401 si no hay usuario', () => {
        const middleware = verificarPermiso('inventario', 'leer');
        const req = mockReq({ usuario: null });
        const next = mockNext();

        middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toBe('Usuario no autenticado');
    });
});

// ============================================
// verificarPropietario
// ============================================
describe('verificarPropietario', () => {
    test('admin puede acceder a cualquier recurso', async () => {
        const middleware = verificarPropietario(req => req.params.id);
        const req = mockReq({
            usuario: { id: 1, rol_nombre: 'admin' },
            params: { id: '99' } // recurso de otro usuario
        });
        const next = mockNext();

        await middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(); // pasa sin verificar propietario
    });

    test('gerente puede acceder a cualquier recurso', async () => {
        const middleware = verificarPropietario(req => req.params.id);
        const req = mockReq({
            usuario: { id: 2, rol_nombre: 'gerente' },
            params: { id: '99' }
        });
        const next = mockNext();

        await middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    test('permite si el usuario es el propietario del recurso', async () => {
        const middleware = verificarPropietario(req => req.params.id);
        const req = mockReq({
            usuario: { id: 5, rol_nombre: 'ventas' },
            params: { id: '5' } // mismo ID
        });
        const next = mockNext();

        await middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    test('rechaza con 403 si NO es propietario ni admin/gerente', async () => {
        const middleware = verificarPropietario(req => req.params.id);
        const req = mockReq({
            usuario: { id: 5, rol_nombre: 'ventas' },
            params: { id: '99' } // recurso de otro
        });
        const next = mockNext();

        await middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('No tiene permiso');
    });

    test('rechaza si no hay usuario', async () => {
        const middleware = verificarPropietario(req => req.params.id);
        const req = mockReq({ usuario: null, params: { id: '1' } });
        const next = mockNext();

        await middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('soporta función async para obtener propietarioId', async () => {
        const middleware = verificarPropietario(async (req) => {
            return Promise.resolve(req.params.id);
        });
        const req = mockReq({
            usuario: { id: 5, rol_nombre: 'ventas' },
            params: { id: '5' }
        });
        const next = mockNext();

        await middleware(req, {}, next);

        expect(next).toHaveBeenCalledWith();
    });
});

// ============================================
// authRol y authPermiso: helpers combinados
// ============================================
describe('authRol / authPermiso', () => {
    test('authRol retorna array con [verificarToken, verificarRol]', () => {
        const middlewares = authRol(['admin']);

        expect(middlewares).toHaveLength(2);
        expect(middlewares[0]).toBe(verificarToken);
        expect(typeof middlewares[1]).toBe('function');
    });

    test('authPermiso retorna array con [verificarToken, verificarPermiso]', () => {
        const middlewares = authPermiso('inventario', 'leer');

        expect(middlewares).toHaveLength(2);
        expect(middlewares[0]).toBe(verificarToken);
        expect(typeof middlewares[1]).toBe('function');
    });
});
