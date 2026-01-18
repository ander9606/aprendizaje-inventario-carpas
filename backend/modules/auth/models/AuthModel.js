const pool = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class AuthModel {
    /**
     * Buscar empleado por email para autenticación
     * @param {string} email
     * @returns {Promise<Object|null>} Empleado con rol y permisos
     */
    static async buscarPorEmail(email) {
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.password_hash,
                e.telefono,
                e.rol_id,
                e.activo,
                e.intentos_fallidos,
                e.bloqueado_hasta,
                e.ultimo_login,
                r.nombre as rol_nombre,
                r.permisos
            FROM empleados e
            INNER JOIN roles r ON e.rol_id = r.id
            WHERE e.email = ? AND e.activo = TRUE
        `, [email]);

        if (rows.length === 0) {
            return null;
        }

        const empleado = rows[0];
        // Parsear permisos JSON
        if (empleado.permisos && typeof empleado.permisos === 'string') {
            empleado.permisos = JSON.parse(empleado.permisos);
        }

        return empleado;
    }

    /**
     * Actualizar fecha de último login
     * @param {number} empleadoId
     */
    static async actualizarUltimoLogin(empleadoId) {
        await pool.query(`
            UPDATE empleados
            SET ultimo_login = CURRENT_TIMESTAMP,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ?
        `, [empleadoId]);
    }

    /**
     * Incrementar intentos fallidos de login
     * @param {number} empleadoId
     * @returns {Promise<number>} Intentos actuales
     */
    static async incrementarIntentosFallidos(empleadoId) {
        await pool.query(`
            UPDATE empleados
            SET intentos_fallidos = intentos_fallidos + 1
            WHERE id = ?
        `, [empleadoId]);

        const [rows] = await pool.query(`
            SELECT intentos_fallidos FROM empleados WHERE id = ?
        `, [empleadoId]);

        return rows[0]?.intentos_fallidos || 0;
    }

    /**
     * Bloquear cuenta temporalmente
     * @param {number} empleadoId
     * @param {Date} hasta - Fecha hasta cuando estará bloqueada
     */
    static async bloquearCuenta(empleadoId, hasta) {
        await pool.query(`
            UPDATE empleados
            SET bloqueado_hasta = ?
            WHERE id = ?
        `, [hasta, empleadoId]);
    }

    /**
     * Desbloquear cuenta y resetear intentos
     * @param {number} empleadoId
     */
    static async desbloquearCuenta(empleadoId) {
        await pool.query(`
            UPDATE empleados
            SET bloqueado_hasta = NULL,
                intentos_fallidos = 0
            WHERE id = ?
        `, [empleadoId]);
    }

    /**
     * Verificar si la cuenta está bloqueada
     * @param {number} empleadoId
     * @returns {Promise<Date|null>} Fecha de desbloqueo o null
     */
    static async verificarBloqueo(empleadoId) {
        const [rows] = await pool.query(`
            SELECT bloqueado_hasta
            FROM empleados
            WHERE id = ? AND bloqueado_hasta > CURRENT_TIMESTAMP
        `, [empleadoId]);

        return rows[0]?.bloqueado_hasta || null;
    }

    /**
     * Cambiar contraseña del empleado
     * @param {number} empleadoId
     * @param {string} nuevoPasswordHash
     */
    static async cambiarPassword(empleadoId, nuevoPasswordHash) {
        await pool.query(`
            UPDATE empleados
            SET password_hash = ?,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ?
        `, [nuevoPasswordHash, empleadoId]);
    }

    /**
     * Obtener empleado por ID (sin password)
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.telefono,
                e.rol_id,
                e.activo,
                e.ultimo_login,
                e.created_at,
                r.nombre as rol_nombre,
                r.permisos
            FROM empleados e
            INNER JOIN roles r ON e.rol_id = r.id
            WHERE e.id = ?
        `, [id]);

        if (rows.length === 0) {
            return null;
        }

        const empleado = rows[0];
        if (empleado.permisos && typeof empleado.permisos === 'string') {
            empleado.permisos = JSON.parse(empleado.permisos);
        }

        return empleado;
    }

    /**
     * Registrar acción en audit_log
     * @param {Object} datos
     */
    static async registrarAuditoria(datos) {
        const { empleado_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent } = datos;

        await pool.query(`
            INSERT INTO audit_log
            (empleado_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            empleado_id,
            accion,
            tabla_afectada || null,
            registro_id || null,
            datos_anteriores ? JSON.stringify(datos_anteriores) : null,
            datos_nuevos ? JSON.stringify(datos_nuevos) : null,
            ip_address || null,
            user_agent || null
        ]);
    }
}

module.exports = AuthModel;
