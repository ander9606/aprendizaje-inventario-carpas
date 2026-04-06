/**
 * Tests para authController
 *
 * Mockeamos AuthModel, TokenService, bcrypt y logger
 * para testear la lógica del controller sin BD ni JWT reales.
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('bcryptjs');
jest.mock('../../models/AuthModel');
jest.mock('../../models/VerificacionEmailModel');
jest.mock('../../services/TokenService', () => ({
    generarAccessToken: jest.fn(),
    generarRefreshToken: jest.fn(),
    verificarAccessToken: jest.fn(),
    verificarRefreshToken: jest.fn(),
    revocarRefreshToken: jest.fn(),
    revocarTodosTokensEmpleado: jest.fn(),
    obtenerSesionesActivas: jest.fn(),
    actualizarUltimoUso: jest.fn()
}));
jest.mock('../../services/EmailService', () => ({
    enviarCodigoVerificacion: jest.fn().mockResolvedValue(),
    enviarAprobacion: jest.fn().mockResolvedValue(),
    enviarRechazo: jest.fn().mockResolvedValue()
}));
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

const bcrypt = require('bcryptjs');
const AuthModel = require('../../models/AuthModel');
const VerificacionEmailModel = require('../../models/VerificacionEmailModel');
const TokenService = require('../../services/TokenService');
const EmailService = require('../../services/EmailService');
const authController = require('../authController');

// Helpers
const mockReq = (overrides = {}) => ({
    body: {},
    headers: {},
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('jest-test-agent'),
    usuario: null,
    ...overrides
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = () => jest.fn();

// Empleado de prueba completo
const empleadoMock = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@test.com',
    password_hash: '$2a$10$hasheado',
    estado: 'activo',
    rol_nombre: 'admin',
    permisos: { inventario: { leer: true } },
    bloqueado_hasta: null,
    intentos_fallidos: 0,
    ultimo_login: null
};

afterEach(() => jest.clearAllMocks());

// ============================================
// LOGIN
// ============================================
describe('login', () => {
    test('login exitoso retorna tokens y datos del usuario', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);
        bcrypt.compare.mockResolvedValue(true);
        AuthModel.actualizarUltimoLogin.mockResolvedValue();
        TokenService.generarAccessToken.mockReturnValue('access-token-123');
        TokenService.generarRefreshToken.mockResolvedValue('refresh-token-456');
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({ body: { email: 'juan@test.com', password: 'password123' } });
        const res = mockRes();
        const next = mockNext();

        await authController.login(req, res, next);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                usuario: expect.objectContaining({
                    id: 1,
                    email: 'juan@test.com',
                    rol: 'admin'
                }),
                tokens: expect.objectContaining({
                    accessToken: 'access-token-123',
                    refreshToken: 'refresh-token-456'
                })
            })
        }));
    });

    test('rechaza si faltan email o password', async () => {
        const req = mockReq({ body: { email: 'juan@test.com' } }); // sin password
        const next = mockNext();

        await authController.login(req, mockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('requeridos');
    });

    test('rechaza si el email no existe (no revela si existe)', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(null);
        const req = mockReq({ body: { email: 'noexiste@test.com', password: 'pass123' } });
        const next = mockNext();

        await authController.login(req, mockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        // Mensaje genérico (no dice "email no encontrado")
        expect(next.mock.calls[0][0].message).toBe('Credenciales inválidas');
    });

    test('rechaza si la cuenta está pendiente de aprobación', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue({ ...empleadoMock, estado: 'pendiente' });
        const req = mockReq({ body: { email: 'juan@test.com', password: 'pass123' } });
        const next = mockNext();

        await authController.login(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('pendiente de aprobación');
    });

    test('rechaza si la cuenta está inactiva', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue({ ...empleadoMock, estado: 'inactivo' });
        const req = mockReq({ body: { email: 'juan@test.com', password: 'pass123' } });
        const next = mockNext();

        await authController.login(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('desactivada');
    });

    test('rechaza si la cuenta está bloqueada temporalmente', async () => {
        const futuro = new Date();
        futuro.setMinutes(futuro.getMinutes() + 10);
        AuthModel.buscarPorEmail.mockResolvedValue({
            ...empleadoMock,
            bloqueado_hasta: futuro.toISOString()
        });
        const req = mockReq({ body: { email: 'juan@test.com', password: 'pass123' } });
        const next = mockNext();

        await authController.login(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('bloqueada temporalmente');
    });

    test('password incorrecto incrementa intentos fallidos', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);
        bcrypt.compare.mockResolvedValue(false);
        AuthModel.incrementarIntentosFallidos.mockResolvedValue(1); // primer intento

        const req = mockReq({ body: { email: 'juan@test.com', password: 'wrong' } });
        const next = mockNext();

        await authController.login(req, mockRes(), next);

        expect(AuthModel.incrementarIntentosFallidos).toHaveBeenCalledWith(1);
        expect(next.mock.calls[0][0].message).toBe('Credenciales inválidas');
    });

    test('bloquea la cuenta tras 5 intentos fallidos', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);
        bcrypt.compare.mockResolvedValue(false);
        AuthModel.incrementarIntentosFallidos.mockResolvedValue(5); // límite alcanzado
        AuthModel.bloquearCuenta.mockResolvedValue();

        const req = mockReq({ body: { email: 'juan@test.com', password: 'wrong' } });
        const next = mockNext();

        await authController.login(req, mockRes(), next);

        expect(AuthModel.bloquearCuenta).toHaveBeenCalledWith(1, expect.any(Date));
        expect(next.mock.calls[0][0].message).toContain('Demasiados intentos');
    });

    test('registra auditoría tras login exitoso', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);
        bcrypt.compare.mockResolvedValue(true);
        AuthModel.actualizarUltimoLogin.mockResolvedValue();
        TokenService.generarAccessToken.mockReturnValue('token');
        TokenService.generarRefreshToken.mockResolvedValue('refresh');
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({ body: { email: 'juan@test.com', password: 'pass' } });
        await authController.login(req, mockRes(), mockNext());

        expect(AuthModel.registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({
            empleado_id: 1,
            accion: 'LOGIN'
        }));
    });
});

// ============================================
// LOGOUT
// ============================================
describe('logout', () => {
    test('revoca refresh token y registra auditoría', async () => {
        TokenService.revocarRefreshToken.mockResolvedValue();
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({
            body: { refreshToken: 'refresh-123' },
            usuario: { id: 1, email: 'juan@test.com' }
        });
        const res = mockRes();

        await authController.logout(req, res, mockNext());

        expect(TokenService.revocarRefreshToken).toHaveBeenCalledWith('refresh-123');
        expect(AuthModel.registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({
            accion: 'LOGOUT'
        }));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('funciona sin refreshToken en body', async () => {
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({ body: {}, usuario: { id: 1, email: 'test@test.com' } });
        const res = mockRes();

        await authController.logout(req, res, mockNext());

        expect(TokenService.revocarRefreshToken).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

// ============================================
// LOGOUT ALL
// ============================================
describe('logoutAll', () => {
    test('revoca todos los tokens del usuario', async () => {
        TokenService.revocarTodosTokensEmpleado.mockResolvedValue();
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({ usuario: { id: 1, email: 'juan@test.com' } });
        const res = mockRes();

        await authController.logoutAll(req, res, mockNext());

        expect(TokenService.revocarTodosTokensEmpleado).toHaveBeenCalledWith(1);
        expect(AuthModel.registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({
            accion: 'LOGOUT_ALL'
        }));
    });
});

// ============================================
// REFRESH
// ============================================
describe('refresh', () => {
    test('genera nuevo access token con refresh token válido', async () => {
        const empleadoData = { id: 1, email: 'juan@test.com', rol_nombre: 'admin' };
        TokenService.verificarRefreshToken.mockResolvedValue(empleadoData);
        TokenService.generarAccessToken.mockReturnValue('new-access-token');

        const req = mockReq({ body: { refreshToken: 'valid-refresh' } });
        const res = mockRes();

        await authController.refresh(req, res, mockNext());

        expect(TokenService.verificarRefreshToken).toHaveBeenCalledWith('valid-refresh');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                accessToken: 'new-access-token'
            })
        }));
    });

    test('rechaza si no se envía refreshToken', async () => {
        const req = mockReq({ body: {} });
        const next = mockNext();

        await authController.refresh(req, mockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('Refresh token es requerido');
    });

    test('propaga error si el refresh token es inválido/expirado', async () => {
        TokenService.verificarRefreshToken.mockRejectedValue(new Error('Token revocado'));
        const req = mockReq({ body: { refreshToken: 'revoked-token' } });
        const next = mockNext();

        await authController.refresh(req, mockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

// ============================================
// ME (perfil del usuario autenticado)
// ============================================
describe('me', () => {
    test('retorna datos del usuario sin password', async () => {
        AuthModel.obtenerPorId.mockResolvedValue(empleadoMock);

        const req = mockReq({ usuario: { id: 1 } });
        const res = mockRes();

        await authController.me(req, res, mockNext());

        const responseData = res.json.mock.calls[0][0].data;
        expect(responseData.id).toBe(1);
        expect(responseData.email).toBe('juan@test.com');
        expect(responseData.rol).toBe('admin');
        // NO debe incluir password_hash
        expect(responseData.password_hash).toBeUndefined();
        expect(responseData.password).toBeUndefined();
    });

    test('retorna 404 si el usuario ya no existe', async () => {
        AuthModel.obtenerPorId.mockResolvedValue(null);

        const req = mockReq({ usuario: { id: 999 } });
        const next = mockNext();

        await authController.me(req, mockRes(), next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('no encontrado');
    });
});

// ============================================
// CAMBIAR PASSWORD
// ============================================
describe('cambiarPassword', () => {
    test('cambia password exitosamente', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);
        bcrypt.compare.mockResolvedValue(true); // password actual correcto
        bcrypt.hash.mockResolvedValue('$2a$10$newHash');
        AuthModel.cambiarPassword.mockResolvedValue();
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({
            body: { passwordActual: 'oldpass123', passwordNuevo: 'newpass123' },
            usuario: { id: 1, email: 'juan@test.com' }
        });
        const res = mockRes();

        await authController.cambiarPassword(req, res, mockNext());

        expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
        expect(AuthModel.cambiarPassword).toHaveBeenCalledWith(1, '$2a$10$newHash');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('rechaza si faltan campos', async () => {
        const req = mockReq({
            body: { passwordActual: 'old' }, // falta passwordNuevo
            usuario: { id: 1, email: 'test@test.com' }
        });
        const next = mockNext();

        await authController.cambiarPassword(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('requeridas');
    });

    test('rechaza si la nueva password tiene menos de 8 caracteres', async () => {
        const req = mockReq({
            body: { passwordActual: 'oldpass', passwordNuevo: 'short' },
            usuario: { id: 1, email: 'test@test.com' }
        });
        const next = mockNext();

        await authController.cambiarPassword(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('8 caracteres');
    });

    test('rechaza si la password actual es incorrecta', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);
        bcrypt.compare.mockResolvedValue(false);

        const req = mockReq({
            body: { passwordActual: 'wrongpass', passwordNuevo: 'newpass123' },
            usuario: { id: 1, email: 'juan@test.com' }
        });
        const next = mockNext();

        await authController.cambiarPassword(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('Contraseña actual incorrecta');
        expect(AuthModel.cambiarPassword).not.toHaveBeenCalled(); // NO debe cambiar
    });

    test('registra auditoría tras cambio exitoso', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('hash');
        AuthModel.cambiarPassword.mockResolvedValue();
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({
            body: { passwordActual: 'old', passwordNuevo: 'newpass123' },
            usuario: { id: 1, email: 'juan@test.com' }
        });

        await authController.cambiarPassword(req, mockRes(), mockNext());

        expect(AuthModel.registrarAuditoria).toHaveBeenCalledWith(expect.objectContaining({
            accion: 'CAMBIO_PASSWORD'
        }));
    });
});

// ============================================
// GET SESSIONS
// ============================================
describe('getSessions', () => {
    test('retorna sesiones activas formateadas', async () => {
        TokenService.obtenerSesionesActivas.mockResolvedValue([
            { id: 1, created_at: '2024-01-01', expira_en: '2024-01-08', ultimo_uso: '2024-01-02' },
            { id: 2, created_at: '2024-01-05', expira_en: '2024-01-12', ultimo_uso: '2024-01-06' }
        ]);

        const req = mockReq({ usuario: { id: 1 } });
        const res = mockRes();

        await authController.getSessions(req, res, mockNext());

        const data = res.json.mock.calls[0][0].data;
        expect(data).toHaveLength(2);
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('creada');
        expect(data[0]).toHaveProperty('expira');
        expect(data[0]).toHaveProperty('ultimoUso');
        // No debe exponer el token hash
        expect(data[0].token_hash).toBeUndefined();
    });
});

// ============================================
// REGISTRO (envía código de verificación)
// ============================================
describe('registro', () => {
    test('envía código de verificación exitosamente', async () => {
        bcrypt.hash.mockResolvedValue('$2a$10$hashNuevo');
        AuthModel.buscarPorEmail.mockResolvedValue(null);
        VerificacionEmailModel.crear.mockResolvedValue({ id: 1, email: 'maria@test.com' });

        const req = mockReq({
            body: {
                nombre: 'María',
                apellido: 'García',
                email: 'maria@test.com',
                password: 'securepass123',
                telefono: '3001234567'
            }
        });
        const res = mockRes();

        await authController.registro(req, res, mockNext());

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: expect.stringContaining('Código de verificación')
        }));
        expect(bcrypt.hash).toHaveBeenCalledWith('securepass123', 10);
        expect(VerificacionEmailModel.crear).toHaveBeenCalledWith(expect.objectContaining({
            email: 'maria@test.com'
        }));
        expect(EmailService.enviarCodigoVerificacion).toHaveBeenCalled();
    });

    test('rechaza si faltan campos requeridos', async () => {
        const req = mockReq({
            body: { nombre: 'María', email: 'maria@test.com' }
        });
        const next = mockNext();

        await authController.registro(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('requeridos');
    });

    test('rechaza si la password tiene menos de 8 caracteres', async () => {
        const req = mockReq({
            body: { nombre: 'María', apellido: 'G', email: 'maria@test.com', password: 'short' }
        });
        const next = mockNext();

        await authController.registro(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('8 caracteres');
    });

    test('rechaza si el email tiene formato inválido', async () => {
        const req = mockReq({
            body: { nombre: 'M', apellido: 'G', email: 'no-es-email', password: 'securepass123' }
        });
        const next = mockNext();

        await authController.registro(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('formato del email');
    });

    test('rechaza si el email ya está registrado', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue({ ...empleadoMock, estado: 'activo' });

        const req = mockReq({
            body: { nombre: 'M', apellido: 'G', email: 'juan@test.com', password: 'securepass123' }
        });
        const next = mockNext();

        await authController.registro(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('Ya existe');
    });

    test('normaliza email a minúsculas y trimea espacios', async () => {
        bcrypt.hash.mockResolvedValue('hash');
        AuthModel.buscarPorEmail.mockResolvedValue(null);
        VerificacionEmailModel.crear.mockResolvedValue({ id: 1 });

        const req = mockReq({
            body: {
                nombre: '  María  ',
                apellido: '  García  ',
                email: '  MARIA@Test.COM  ',
                password: 'securepass123'
            }
        });

        await authController.registro(req, mockRes(), mockNext());

        expect(VerificacionEmailModel.crear).toHaveBeenCalledWith(expect.objectContaining({
            email: 'maria@test.com'
        }));
    });
});

// ============================================
// VERIFICAR EMAIL
// ============================================
describe('verificarEmail', () => {
    const verificacionMock = {
        id: 1,
        email: 'maria@test.com',
        codigo: '123456',
        intentos: 0,
        datos_registro: {
            nombre: 'María',
            apellido: 'García',
            telefono: null,
            password_hash: 'hash123',
            rol_solicitado_id: null
        }
    };

    test('verifica código correcto y crea solicitud', async () => {
        VerificacionEmailModel.buscarPorEmail.mockResolvedValue(verificacionMock);
        VerificacionEmailModel.marcarVerificado.mockResolvedValue();
        AuthModel.registrarSolicitud.mockResolvedValue({ id: 10 });
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({ body: { email: 'maria@test.com', codigo: '123456' } });
        const res = mockRes();

        await authController.verificarEmail(req, res, mockNext());

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: expect.stringContaining('verificado correctamente')
        }));
        expect(VerificacionEmailModel.marcarVerificado).toHaveBeenCalledWith(1);
        expect(AuthModel.registrarSolicitud).toHaveBeenCalled();
    });

    test('rechaza código incorrecto', async () => {
        VerificacionEmailModel.buscarPorEmail.mockResolvedValue(verificacionMock);
        VerificacionEmailModel.incrementarIntentos.mockResolvedValue(1);

        const req = mockReq({ body: { email: 'maria@test.com', codigo: '999999' } });
        const next = mockNext();

        await authController.verificarEmail(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('incorrecto');
    });

    test('rechaza si no hay verificación pendiente', async () => {
        VerificacionEmailModel.buscarPorEmail.mockResolvedValue(null);

        const req = mockReq({ body: { email: 'maria@test.com', codigo: '123456' } });
        const next = mockNext();

        await authController.verificarEmail(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('expirado');
    });

    test('rechaza si excede intentos máximos', async () => {
        VerificacionEmailModel.buscarPorEmail.mockResolvedValue({ ...verificacionMock, intentos: 5 });

        const req = mockReq({ body: { email: 'maria@test.com', codigo: '123456' } });
        const next = mockNext();

        await authController.verificarEmail(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('Demasiados intentos');
    });

    test('rechaza si faltan campos', async () => {
        const req = mockReq({ body: { email: 'maria@test.com' } });
        const next = mockNext();

        await authController.verificarEmail(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('requeridos');
    });
});

// ============================================
// REENVIAR CÓDIGO
// ============================================
describe('reenviarCodigo', () => {
    test('reenvía código exitosamente', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(null);
        VerificacionEmailModel.buscarPorEmail.mockResolvedValue({
            id: 1,
            email: 'maria@test.com',
            datos_registro: { nombre: 'María' }
        });
        VerificacionEmailModel.crear.mockResolvedValue({ id: 2 });

        const req = mockReq({ body: { email: 'maria@test.com' } });
        const res = mockRes();

        await authController.reenviarCodigo(req, res, mockNext());

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: expect.stringContaining('Nuevo código')
        }));
    });

    test('rechaza si el email ya está registrado', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(empleadoMock);

        const req = mockReq({ body: { email: 'juan@test.com' } });
        const next = mockNext();

        await authController.reenviarCodigo(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('ya está registrado');
    });

    test('rechaza si no hay verificación pendiente', async () => {
        AuthModel.buscarPorEmail.mockResolvedValue(null);
        VerificacionEmailModel.buscarPorEmail.mockResolvedValue(null);

        const req = mockReq({ body: { email: 'nueva@test.com' } });
        const next = mockNext();

        await authController.reenviarCodigo(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('Regístrate nuevamente');
    });
});

// ============================================
// ACTUALIZAR PERFIL
// ============================================
describe('actualizarPerfil', () => {
    test('actualiza nombre y apellido', async () => {
        AuthModel.obtenerPorId.mockResolvedValueOnce({ ...empleadoMock, telefono: null });
        AuthModel.actualizarPerfil.mockResolvedValue();
        AuthModel.obtenerPorId.mockResolvedValueOnce({ ...empleadoMock, nombre: 'Juan Carlos', telefono: null, rol_nombre: 'admin', permisos: {} });
        AuthModel.registrarAuditoria.mockResolvedValue();

        const req = mockReq({
            body: { nombre: 'Juan Carlos', apellido: 'Pérez' },
            usuario: { id: 1, email: 'juan@test.com' }
        });
        const res = mockRes();

        await authController.actualizarPerfil(req, res, mockNext());

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: expect.stringContaining('actualizado')
        }));
        expect(AuthModel.actualizarPerfil).toHaveBeenCalledWith(1, expect.objectContaining({
            nombre: 'Juan Carlos'
        }));
    });

    test('rechaza si no se envían campos', async () => {
        const req = mockReq({
            body: {},
            usuario: { id: 1, email: 'juan@test.com' }
        });
        const next = mockNext();

        await authController.actualizarPerfil(req, mockRes(), next);

        expect(next.mock.calls[0][0].message).toContain('al menos un campo');
    });
});

// ============================================
// OBTENER HISTORIAL
// ============================================
describe('obtenerHistorial', () => {
    test('retorna historial paginado', async () => {
        AuthModel.obtenerHistorialUsuario.mockResolvedValue({
            registros: [{ id: 1, accion: 'LOGIN', created_at: '2026-01-01' }],
            total: 1
        });

        const req = mockReq({
            query: { page: '1', limit: '20' },
            usuario: { id: 1 }
        });
        const res = mockRes();

        await authController.obtenerHistorial(req, res, mockNext());

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.arrayContaining([
                expect.objectContaining({ accion: 'LOGIN' })
            ]),
            pagination: expect.objectContaining({
                page: 1,
                total: 1
            })
        }));
    });
});

// ============================================
// GET ROLES REGISTRO
// ============================================
describe('getRolesRegistro', () => {
    test('retorna roles públicos', async () => {
        AuthModel.obtenerRolesPublicos.mockResolvedValue([
            { id: 2, nombre: 'ventas' },
            { id: 3, nombre: 'operaciones' }
        ]);

        const req = mockReq();
        const res = mockRes();

        await authController.getRolesRegistro(req, res, mockNext());

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.arrayContaining([
                expect.objectContaining({ nombre: 'ventas' })
            ])
        }));
    });
});
