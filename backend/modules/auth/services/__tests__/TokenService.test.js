// Configurar JWT_SECRET ANTES de importar TokenService
process.env.JWT_SECRET = 'test_secret_key_solo_para_tests_1234567890';

const jwt = require('jsonwebtoken');

// Mock de la base de datos (no necesitamos DB real para tests)
jest.mock('../../../../config/database', () => ({
    pool: {
        query: jest.fn()
    }
}));

const TokenService = require('../TokenService');
const { pool } = require('../../../../config/database');

const empleadoMock = {
    id: 1,
    email: 'admin@carpas.com',
    nombre: 'Admin',
    apellido: 'Sistema',
    rol_id: 1,
    rol_nombre: 'admin',
    permisos: { inventario: { ver: true } }
};

// ============================================
// generarAccessToken: crea JWT con datos del empleado
// ============================================
describe('generarAccessToken', () => {
    test('genera un token JWT válido', () => {
        const token = TokenService.generarAccessToken(empleadoMock);

        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    test('el token contiene los datos del empleado', () => {
        const token = TokenService.generarAccessToken(empleadoMock);
        const decoded = jwt.decode(token);

        expect(decoded.id).toBe(1);
        expect(decoded.email).toBe('admin@carpas.com');
        expect(decoded.nombre).toBe('Admin');
        expect(decoded.rol_nombre).toBe('admin');
        expect(decoded.tipo).toBe('access');
    });

    test('el token tiene issuer correcto', () => {
        const token = TokenService.generarAccessToken(empleadoMock);
        const decoded = jwt.decode(token);

        expect(decoded.iss).toBe('inventario-carpas-api');
    });
});

// ============================================
// verificarAccessToken: valida JWT recibido
// ============================================
describe('verificarAccessToken', () => {
    test('verifica un token válido y retorna payload', () => {
        const token = TokenService.generarAccessToken(empleadoMock);
        const decoded = TokenService.verificarAccessToken(token);

        expect(decoded.id).toBe(1);
        expect(decoded.email).toBe('admin@carpas.com');
    });

    test('rechaza token con secret incorrecto', () => {
        const tokenFalso = jwt.sign(
            { id: 1, tipo: 'access' },
            'secret_incorrecto',
            { issuer: 'inventario-carpas-api' }
        );

        expect(() => TokenService.verificarAccessToken(tokenFalso))
            .toThrow(/Token inválido/);
    });

    test('rechaza token expirado', () => {
        const tokenExpirado = jwt.sign(
            { id: 1, tipo: 'access' },
            process.env.JWT_SECRET,
            { expiresIn: '0s', issuer: 'inventario-carpas-api' }
        );

        expect(() => TokenService.verificarAccessToken(tokenExpirado))
            .toThrow(/Token expirado/);
    });

    test('rechaza token de tipo diferente a access', () => {
        const refreshToken = jwt.sign(
            { id: 1, tipo: 'refresh' },
            process.env.JWT_SECRET,
            { issuer: 'inventario-carpas-api' }
        );

        expect(() => TokenService.verificarAccessToken(refreshToken))
            .toThrow(/Tipo de token inválido/);
    });
});

// ============================================
// generarRefreshToken: guarda token en BD
// ============================================
describe('generarRefreshToken', () => {
    test('genera token y lo guarda en base de datos', async () => {
        pool.query.mockResolvedValue([{ insertId: 1 }]);

        const token = await TokenService.generarRefreshToken(empleadoMock);

        expect(typeof token).toBe('string');
        expect(token.length).toBe(128); // 64 bytes en hex = 128 chars
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO refresh_tokens'),
            expect.arrayContaining([1, token])
        );
    });
});

// ============================================
// revocarRefreshToken: marca token como revocado
// ============================================
describe('revocarRefreshToken', () => {
    test('ejecuta UPDATE con revoked = TRUE', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);

        await TokenService.revocarRefreshToken('token_abc');

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('SET revoked = TRUE'),
            ['token_abc']
        );
    });
});

// ============================================
// limpiarTokensExpirados: elimina tokens viejos
// ============================================
describe('limpiarTokensExpirados', () => {
    test('retorna cantidad de tokens eliminados', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 5 }]);

        const eliminados = await TokenService.limpiarTokensExpirados();

        expect(eliminados).toBe(5);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM refresh_tokens')
        );
    });
});
