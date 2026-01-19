const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

// Configuración JWT desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'desarrollo_secreto_cambiar_en_produccion';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

class TokenService {
    /**
     * Generar Access Token (corta duración)
     * @param {Object} empleado - Datos del empleado
     * @returns {string} JWT token
     */
    static generarAccessToken(empleado) {
        const payload = {
            id: empleado.id,
            email: empleado.email,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            rol_id: empleado.rol_id,
            rol_nombre: empleado.rol_nombre,
            permisos: empleado.permisos,
            tipo: 'access'
        };

        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_ACCESS_EXPIRES,
            issuer: 'inventario-carpas-api'
        });
    }

    /**
     * Generar Refresh Token (larga duración)
     * Se almacena en base de datos para poder revocarlo
     * @param {Object} empleado - Datos del empleado
     * @returns {Promise<string>} Refresh token
     */
    static async generarRefreshToken(empleado) {
        // Generar token único
        const tokenValue = crypto.randomBytes(64).toString('hex');

        // Calcular fecha de expiración (7 días por defecto)
        const diasExpiracion = parseInt(JWT_REFRESH_EXPIRES) || 7;
        const expiraEn = new Date();
        expiraEn.setDate(expiraEn.getDate() + diasExpiracion);

        // Guardar en base de datos
        await pool.query(`
            INSERT INTO refresh_tokens (empleado_id, token, expires_at)
            VALUES (?, ?, ?)
        `, [empleado.id, tokenValue, expiraEn]);

        return tokenValue;
    }

    /**
     * Verificar Access Token
     * @param {string} token
     * @returns {Object} Payload decodificado
     * @throws {AppError} Si el token es inválido o expirado
     */
    static verificarAccessToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET, {
                issuer: 'inventario-carpas-api'
            });

            if (decoded.tipo !== 'access') {
                throw new AppError('Tipo de token inválido', 401);
            }

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AppError('Token expirado', 401);
            }
            if (error.name === 'JsonWebTokenError') {
                throw new AppError('Token inválido', 401);
            }
            throw error;
        }
    }

    /**
     * Verificar Refresh Token
     * @param {string} token
     * @returns {Promise<Object>} Datos del empleado asociado
     * @throws {AppError} Si el token es inválido, expirado o revocado
     */
    static async verificarRefreshToken(token) {
        const [rows] = await pool.query(`
            SELECT
                rt.id as token_id,
                rt.empleado_id,
                rt.expires_at,
                rt.revoked,
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.rol_id,
                e.activo,
                r.nombre as rol_nombre,
                r.permisos
            FROM refresh_tokens rt
            INNER JOIN empleados e ON rt.empleado_id = e.id
            INNER JOIN roles r ON e.rol_id = r.id
            WHERE rt.token = ?
        `, [token]);

        if (rows.length === 0) {
            throw new AppError('Refresh token no encontrado', 401);
        }

        const tokenData = rows[0];

        // Verificar si está revocado
        if (tokenData.revoked) {
            throw new AppError('Refresh token ha sido revocado', 401);
        }

        // Verificar si expiró
        if (new Date(tokenData.expires_at) < new Date()) {
            throw new AppError('Refresh token expirado', 401);
        }

        // Verificar si el empleado sigue activo
        if (!tokenData.activo) {
            throw new AppError('Cuenta de usuario desactivada', 401);
        }

        // Parsear permisos
        if (tokenData.permisos && typeof tokenData.permisos === 'string') {
            tokenData.permisos = JSON.parse(tokenData.permisos);
        }

        return tokenData;
    }

    /**
     * Revocar un refresh token específico
     * @param {string} token
     */
    static async revocarRefreshToken(token) {
        await pool.query(`
            UPDATE refresh_tokens
            SET revoked = TRUE,
                revoked_at = CURRENT_TIMESTAMP
            WHERE token = ?
        `, [token]);
    }

    /**
     * Revocar todos los refresh tokens de un empleado
     * (útil para logout de todas las sesiones)
     * @param {number} empleadoId
     */
    static async revocarTodosTokensEmpleado(empleadoId) {
        await pool.query(`
            UPDATE refresh_tokens
            SET revoked = TRUE,
                revoked_at = CURRENT_TIMESTAMP
            WHERE empleado_id = ? AND revoked = FALSE
        `, [empleadoId]);
    }

    /**
     * Limpiar tokens expirados (mantenimiento)
     * @returns {Promise<number>} Cantidad de tokens eliminados
     */
    static async limpiarTokensExpirados() {
        const [result] = await pool.query(`
            DELETE FROM refresh_tokens
            WHERE expires_at < CURRENT_TIMESTAMP OR revoked = TRUE
        `);

        return result.affectedRows;
    }

    /**
     * Obtener sesiones activas de un empleado
     * @param {number} empleadoId
     * @returns {Promise<Array>} Lista de sesiones activas
     */
    static async obtenerSesionesActivas(empleadoId) {
        const [rows] = await pool.query(`
            SELECT
                id,
                created_at,
                expires_at,
                created_at as last_used
            FROM refresh_tokens
            WHERE empleado_id = ?
              AND revoked = FALSE
              AND expires_at > CURRENT_TIMESTAMP
            ORDER BY created_at DESC
        `, [empleadoId]);

        return rows;
    }

    // Nota: La columna ultimo_uso no existe en la tabla actual
    // Si se necesita tracking de último uso, agregar la columna a la tabla
}

module.exports = TokenService;
