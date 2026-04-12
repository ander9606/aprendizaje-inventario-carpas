const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class AuthModel {
    /**
     * Buscar empleado por email para autenticación
     * @param {string} email
     * @returns {Promise<Object|null>} Empleado con rol y permisos
     */
    static async buscarPorEmail(tenantId, email) {
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.password_hash,
                e.telefono,
                e.rol_id,
                e.estado,
                e.tenant_id,
                e.intentos_fallidos,
                e.bloqueado_hasta,
                e.ultimo_login,
                r.nombre as rol_nombre,
                r.permisos
            FROM empleados e
            LEFT JOIN roles r ON e.rol_id = r.id AND (r.tenant_id = ? OR r.tenant_id IS NULL)
            WHERE e.email = ? AND e.tenant_id = ?
        `, [tenantId, email, tenantId]);

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
     * Buscar empleado por email sin filtrar por tenant (login cross-tenant en dev)
     */
    static async buscarPorEmailGlobal(email) {
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.password_hash,
                e.telefono,
                e.rol_id,
                e.estado,
                e.tenant_id,
                e.intentos_fallidos,
                e.bloqueado_hasta,
                e.ultimo_login,
                r.nombre as rol_nombre,
                r.permisos,
                t.slug as tenant_slug
            FROM empleados e
            LEFT JOIN roles r ON e.rol_id = r.id AND (r.tenant_id = e.tenant_id OR r.tenant_id IS NULL)
            LEFT JOIN tenants t ON e.tenant_id = t.id
            WHERE e.email = ? AND e.estado = 'activo'
            LIMIT 1
        `, [email]);

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
     * Actualizar fecha de último login
     * @param {number} empleadoId
     */
    static async actualizarUltimoLogin(tenantId, empleadoId) {
        await pool.query(`
            UPDATE empleados
            SET ultimo_login = CURRENT_TIMESTAMP,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ? AND tenant_id = ?
        `, [empleadoId, tenantId]);
    }

    /**
     * Incrementar intentos fallidos de login
     * @param {number} empleadoId
     * @returns {Promise<number>} Intentos actuales
     */
    static async incrementarIntentosFallidos(tenantId, empleadoId) {
        await pool.query(`
            UPDATE empleados
            SET intentos_fallidos = intentos_fallidos + 1
            WHERE id = ? AND tenant_id = ?
        `, [empleadoId, tenantId]);

        const [rows] = await pool.query(`
            SELECT intentos_fallidos FROM empleados WHERE id = ? AND tenant_id = ?
        `, [empleadoId, tenantId]);

        return rows[0]?.intentos_fallidos || 0;
    }

    /**
     * Bloquear cuenta temporalmente
     * @param {number} empleadoId
     * @param {Date} hasta - Fecha hasta cuando estará bloqueada
     */
    static async bloquearCuenta(tenantId, empleadoId, hasta) {
        await pool.query(`
            UPDATE empleados
            SET bloqueado_hasta = ?
            WHERE id = ? AND tenant_id = ?
        `, [hasta, empleadoId, tenantId]);
    }

    /**
     * Desbloquear cuenta y resetear intentos
     * @param {number} empleadoId
     */
    static async desbloquearCuenta(tenantId, empleadoId) {
        await pool.query(`
            UPDATE empleados
            SET bloqueado_hasta = NULL,
                intentos_fallidos = 0
            WHERE id = ? AND tenant_id = ?
        `, [empleadoId, tenantId]);
    }

    /**
     * Verificar si la cuenta está bloqueada
     * @param {number} empleadoId
     * @returns {Promise<Date|null>} Fecha de desbloqueo o null
     */
    static async verificarBloqueo(tenantId, empleadoId) {
        const [rows] = await pool.query(`
            SELECT bloqueado_hasta
            FROM empleados
            WHERE id = ? AND tenant_id = ? AND bloqueado_hasta > CURRENT_TIMESTAMP
        `, [empleadoId, tenantId]);

        return rows[0]?.bloqueado_hasta || null;
    }

    /**
     * Cambiar contraseña del empleado
     * @param {number} empleadoId
     * @param {string} nuevoPasswordHash
     */
    static async cambiarPassword(tenantId, empleadoId, nuevoPasswordHash) {
        await pool.query(`
            UPDATE empleados
            SET password_hash = ?,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ? AND tenant_id = ?
        `, [nuevoPasswordHash, empleadoId, tenantId]);
    }

    /**
     * Obtener empleado por ID (sin password)
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(tenantId, id) {
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.telefono,
                e.rol_id,
                e.estado,
                e.tenant_id,
                e.ultimo_login,
                e.created_at,
                r.nombre as rol_nombre,
                r.permisos,
                t.slug as tenant_slug
            FROM empleados e
            LEFT JOIN roles r ON e.rol_id = r.id AND (r.tenant_id = ? OR r.tenant_id IS NULL)
            LEFT JOIN tenants t ON e.tenant_id = t.id
            WHERE e.id = ? AND e.tenant_id = ?
        `, [tenantId, id, tenantId]);

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
     * Registrar solicitud de acceso (auto-registro)
     * @param {Object} datos - Datos del solicitante
     * @returns {Promise<Object>} Empleado creado con estado pendiente
     */
    static async registrarSolicitud(tenantId, datos) {
        const { nombre, apellido, email, telefono, password_hash, rol_solicitado_id } = datos;

        // Verificar si el email ya existe
        const [existente] = await pool.query(
            'SELECT id, estado FROM empleados WHERE email = ? AND tenant_id = ?',
            [email, tenantId]
        );

        if (existente.length > 0) {
            if (existente[0].estado === 'pendiente') {
                throw new AppError('Ya existe una solicitud pendiente con este email', 400);
            }
            throw new AppError('Ya existe un empleado registrado con este email', 400);
        }

        // Verificar que el rol solicitado existe
        if (rol_solicitado_id) {
            const [rol] = await pool.query('SELECT id FROM roles WHERE id = ? AND activo = TRUE AND tenant_id = ?', [rol_solicitado_id, tenantId]);
            if (rol.length === 0) {
                throw new AppError('El rol solicitado no existe', 400);
            }
        }

        const [result] = await pool.query(`
            INSERT INTO empleados (tenant_id, nombre, apellido, email, telefono, password_hash, estado, rol_solicitado_id)
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)
        `, [tenantId, nombre, apellido, email, telefono || null, password_hash, rol_solicitado_id || null]);

        return { id: result.insertId, nombre, apellido, email, estado: 'pendiente' };
    }

    /**
     * Obtener roles disponibles para solicitud de registro
     * @returns {Promise<Array>}
     */
    static async obtenerRolesPublicos(tenantId) {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion
            FROM roles
            WHERE activo = TRUE AND nombre != 'admin' AND tenant_id = ?
            ORDER BY id ASC
        `, [tenantId]);
        return rows;
    }

    /**
     * Actualizar perfil del empleado (nombre, apellido, telefono)
     * @param {number} id
     * @param {Object} datos
     */
    static async actualizarPerfil(tenantId, id, datos) {
        const campos = [];
        const valores = [];

        if (datos.nombre) {
            campos.push('nombre = ?');
            valores.push(datos.nombre);
        }
        if (datos.apellido) {
            campos.push('apellido = ?');
            valores.push(datos.apellido);
        }
        if (datos.telefono !== undefined) {
            campos.push('telefono = ?');
            valores.push(datos.telefono);
        }

        if (campos.length === 0) return;

        valores.push(id, tenantId);
        await pool.query(
            `UPDATE empleados SET ${campos.join(', ')} WHERE id = ? AND tenant_id = ?`,
            valores
        );
    }

    /**
     * Obtener historial de auditoría del usuario
     * @param {number} empleadoId
     * @param {number} limit
     * @param {number} offset
     * @returns {Promise<{registros: Array, total: number}>}
     */
    static async obtenerHistorialUsuario(tenantId, empleadoId, limit = 20, offset = 0) {
        const [countRows] = await pool.query(
            'SELECT COUNT(*) as total FROM audit_log WHERE empleado_id = ? AND tenant_id = ?',
            [empleadoId, tenantId]
        );

        const [rows] = await pool.query(`
            SELECT id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, created_at
            FROM audit_log
            WHERE empleado_id = ? AND tenant_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [empleadoId, tenantId, limit, offset]);

        return {
            registros: rows.map(r => ({
                ...r,
                datos_anteriores: r.datos_anteriores && typeof r.datos_anteriores === 'string'
                    ? JSON.parse(r.datos_anteriores) : r.datos_anteriores,
                datos_nuevos: r.datos_nuevos && typeof r.datos_nuevos === 'string'
                    ? JSON.parse(r.datos_nuevos) : r.datos_nuevos
            })),
            total: countRows[0].total
        };
    }

    /**
     * Registrar acción en audit_log
     * @param {Object} datos
     */
    static async registrarAuditoria(tenantId, datos) {
        const { empleado_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent } = datos;

        await pool.query(`
            INSERT INTO audit_log
            (tenant_id, empleado_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tenantId,
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
