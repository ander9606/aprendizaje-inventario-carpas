const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class EmpleadoModel {
    /**
     * Obtener todos los empleados con paginación y filtros
     * @param {number} tenantId - ID del tenant
     * @param {Object} options - Opciones de filtrado y paginación
     * @returns {Promise<Object>} Lista de empleados y total
     */
    static async obtenerTodos(tenantId, options = {}) {
        const {
            page = 1,
            limit = 20,
            buscar = '',
            rol_id = null,
            estado = null,
            ordenar = 'nombre',
            direccion = 'ASC'
        } = options;

        const offset = (page - 1) * limit;
        const params = [tenantId];
        let whereClause = 'WHERE e.tenant_id = ?';

        // Filtro por búsqueda (nombre, apellido, email)
        if (buscar) {
            whereClause += ` AND (e.nombre LIKE ? OR e.apellido LIKE ? OR e.email LIKE ?)`;
            const buscarPattern = `%${buscar}%`;
            params.push(buscarPattern, buscarPattern, buscarPattern);
        }

        // Filtro por rol
        if (rol_id) {
            whereClause += ` AND e.rol_id = ?`;
            params.push(rol_id);
        }

        // Filtro por estado
        if (estado) {
            whereClause += ` AND e.estado = ?`;
            params.push(estado);
        }

        // Validar campo de ordenación
        const camposValidos = ['nombre', 'apellido', 'email', 'created_at', 'ultimo_login'];
        const ordenarCampo = camposValidos.includes(ordenar) ? ordenar : 'nombre';
        const ordenarDireccion = direccion.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Query principal
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.telefono,
                e.rol_id,
                e.estado,
                e.rol_solicitado_id,
                e.ultimo_login,
                e.created_at,
                r.nombre as rol_nombre,
                rs.nombre as rol_solicitado_nombre
            FROM empleados e
            LEFT JOIN roles r ON e.rol_id = r.id AND r.tenant_id = ?
            LEFT JOIN roles rs ON e.rol_solicitado_id = rs.id AND rs.tenant_id = ?
            ${whereClause}
            ORDER BY e.${ordenarCampo} ${ordenarDireccion}
            LIMIT ? OFFSET ?
        `, [tenantId, tenantId, ...params, limit, offset]);

        // Contar total
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM empleados e
            LEFT JOIN roles r ON e.rol_id = r.id AND r.tenant_id = ?
            LEFT JOIN roles rs ON e.rol_solicitado_id = rs.id AND rs.tenant_id = ?
            ${whereClause}
        `, [tenantId, tenantId, ...params]);

        return {
            empleados: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    /**
     * Obtener empleado por ID
     * @param {number} tenantId - ID del tenant
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
                e.rol_solicitado_id,
                e.motivo_rechazo,
                e.ultimo_login,
                e.intentos_fallidos,
                e.bloqueado_hasta,
                e.created_at,
                e.updated_at,
                r.nombre as rol_nombre,
                r.descripcion as rol_descripcion,
                r.permisos,
                rs.nombre as rol_solicitado_nombre
            FROM empleados e
            LEFT JOIN roles r ON e.rol_id = r.id AND r.tenant_id = ?
            LEFT JOIN roles rs ON e.rol_solicitado_id = rs.id AND rs.tenant_id = ?
            WHERE e.id = ? AND e.tenant_id = ?
        `, [tenantId, tenantId, id, tenantId]);

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
     * Crear nuevo empleado
     * @param {number} tenantId - ID del tenant
     * @param {Object} datos
     * @returns {Promise<Object>} Empleado creado
     */
    static async crear(tenantId, datos) {
        const { nombre, apellido, email, telefono, password_hash, rol_id } = datos;

        // Verificar si el email ya existe
        const [existente] = await pool.query(
            'SELECT id FROM empleados WHERE email = ? AND tenant_id = ?',
            [email, tenantId]
        );

        if (existente.length > 0) {
            throw new AppError('Ya existe un empleado con ese email', 400);
        }

        // Verificar que el rol existe
        const [rol] = await pool.query('SELECT id FROM roles WHERE id = ? AND tenant_id = ?', [rol_id, tenantId]);
        if (rol.length === 0) {
            throw new AppError('El rol especificado no existe', 400);
        }

        const [result] = await pool.query(`
            INSERT INTO empleados (tenant_id, nombre, apellido, email, telefono, password_hash, rol_id, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')
        `, [tenantId, nombre, apellido, email, telefono || null, password_hash, rol_id]);

        return this.obtenerPorId(tenantId, result.insertId);
    }

    /**
     * Actualizar empleado
     * @param {number} tenantId - ID del tenant
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>} Empleado actualizado
     */
    static async actualizar(tenantId, id, datos) {
        const { nombre, apellido, email, telefono, rol_id, estado } = datos;

        // Verificar que existe
        const empleadoExistente = await this.obtenerPorId(tenantId, id);
        if (!empleadoExistente) {
            throw new AppError('Empleado no encontrado', 404);
        }

        // Verificar si el nuevo email ya existe (si cambió)
        if (email && email !== empleadoExistente.email) {
            const [existente] = await pool.query(
                'SELECT id FROM empleados WHERE email = ? AND id != ? AND tenant_id = ?',
                [email, id, tenantId]
            );

            if (existente.length > 0) {
                throw new AppError('Ya existe otro empleado con ese email', 400);
            }
        }

        // Verificar que el rol existe (si cambió)
        if (rol_id && rol_id !== empleadoExistente.rol_id) {
            const [rol] = await pool.query('SELECT id FROM roles WHERE id = ? AND tenant_id = ?', [rol_id, tenantId]);
            if (rol.length === 0) {
                throw new AppError('El rol especificado no existe', 400);
            }
        }

        // Construir actualización dinámica
        const campos = [];
        const valores = [];

        if (nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(nombre);
        }
        if (apellido !== undefined) {
            campos.push('apellido = ?');
            valores.push(apellido);
        }
        if (email !== undefined) {
            campos.push('email = ?');
            valores.push(email);
        }
        if (telefono !== undefined) {
            campos.push('telefono = ?');
            valores.push(telefono);
        }
        if (rol_id !== undefined) {
            campos.push('rol_id = ?');
            valores.push(rol_id);
        }
        if (estado !== undefined) {
            campos.push('estado = ?');
            valores.push(estado);
        }

        if (campos.length === 0) {
            throw new AppError('No hay datos para actualizar', 400);
        }

        valores.push(id, tenantId);

        await pool.query(`
            UPDATE empleados
            SET ${campos.join(', ')}
            WHERE id = ? AND tenant_id = ?
        `, valores);

        return this.obtenerPorId(tenantId, id);
    }

    /**
     * Eliminar (desactivar) empleado
     * @param {number} tenantId - ID del tenant
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    static async eliminar(tenantId, id) {
        const empleado = await this.obtenerPorId(tenantId, id);
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }

        // Soft delete - cambiar estado a inactivo
        await pool.query("UPDATE empleados SET estado = 'inactivo' WHERE id = ? AND tenant_id = ?", [id, tenantId]);

        return true;
    }

    /**
     * Reactivar empleado
     * @param {number} tenantId - ID del tenant
     * @param {number} id
     * @returns {Promise<Object>}
     */
    static async reactivar(tenantId, id) {
        const [rows] = await pool.query('SELECT id FROM empleados WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (rows.length === 0) {
            throw new AppError('Empleado no encontrado', 404);
        }

        await pool.query("UPDATE empleados SET estado = 'activo' WHERE id = ? AND tenant_id = ?", [id, tenantId]);

        return this.obtenerPorId(tenantId, id);
    }

    /**
     * Obtener empleados por rol
     * @param {number} tenantId - ID del tenant
     * @param {number} rolId
     * @returns {Promise<Array>}
     */
    static async obtenerPorRol(tenantId, rolId) {
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.telefono,
                e.estado,
                r.nombre as rol_nombre
            FROM empleados e
            INNER JOIN roles r ON e.rol_id = r.id AND r.tenant_id = ?
            WHERE e.rol_id = ? AND e.estado = 'activo' AND e.tenant_id = ?
            ORDER BY e.nombre ASC
        `, [tenantId, rolId, tenantId]);

        return rows;
    }

    /**
     * Obtener empleados disponibles para trabajo de campo
     * (operaciones y personal que puede asignarse a órdenes)
     * @param {number} tenantId - ID del tenant
     * @param {Date} fecha - Fecha para verificar disponibilidad (opcional)
     * @returns {Promise<Array>}
     */
    static async obtenerDisponiblesCampo(tenantId, fecha = null) {
        // Roles que pueden ir a campo: operaciones (4)
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.telefono,
                r.nombre as rol_nombre
            FROM empleados e
            INNER JOIN roles r ON e.rol_id = r.id AND r.tenant_id = ?
            WHERE e.estado = 'activo'
              AND r.nombre IN ('operaciones', 'bodega')
              AND e.tenant_id = ?
            ORDER BY e.nombre ASC
        `, [tenantId, tenantId]);

        // TODO: Si se proporciona fecha, filtrar por disponibilidad
        // (no asignados a otras órdenes en esa fecha)

        return rows;
    }

    /**
     * Cambiar contraseña de empleado (admin)
     * @param {number} tenantId - ID del tenant
     * @param {number} id
     * @param {string} nuevoPasswordHash
     */
    static async cambiarPassword(tenantId, id, nuevoPasswordHash) {
        const empleado = await this.obtenerPorId(tenantId, id);
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }

        await pool.query(`
            UPDATE empleados
            SET password_hash = ?,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ? AND tenant_id = ?
        `, [nuevoPasswordHash, id, tenantId]);
    }

    /**
     * Obtener todos los roles disponibles
     * @param {number} tenantId - ID del tenant
     * @returns {Promise<Array>}
     */
    static async obtenerRoles(tenantId) {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, permisos
            FROM roles
            WHERE tenant_id = ?
            ORDER BY id ASC
        `, [tenantId]);

        return rows.map(rol => ({
            ...rol,
            permisos: typeof rol.permisos === 'string' ? JSON.parse(rol.permisos) : rol.permisos
        }));
    }

    /**
     * Obtener estadísticas de empleados
     * @param {number} tenantId - ID del tenant
     * @returns {Promise<Object>}
     */
    static async obtenerEstadisticas(tenantId) {
        const [stats] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as inactivos,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN bloqueado_hasta > NOW() THEN 1 ELSE 0 END) as bloqueados
            FROM empleados
            WHERE tenant_id = ?
        `, [tenantId]);

        const [porRol] = await pool.query(`
            SELECT
                r.nombre as rol,
                COUNT(e.id) as cantidad
            FROM roles r
            LEFT JOIN empleados e ON r.id = e.rol_id AND e.estado = 'activo' AND e.tenant_id = ?
            WHERE r.tenant_id = ?
            GROUP BY r.id, r.nombre
            ORDER BY r.id
        `, [tenantId, tenantId]);

        return {
            ...stats[0],
            porRol
        };
    }
    /**
     * Aprobar solicitud de acceso
     * @param {number} tenantId - ID del tenant
     * @param {number} id - ID del empleado pendiente
     * @param {number} rolId - Rol a asignar
     * @returns {Promise<Object>} Empleado aprobado
     */
    static async aprobarSolicitud(tenantId, id, rolId) {
        const empleado = await this.obtenerPorId(tenantId, id);
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }
        if (empleado.estado !== 'pendiente') {
            throw new AppError('Este empleado no tiene solicitud pendiente', 400);
        }

        // Verificar que el rol existe
        const [rol] = await pool.query('SELECT id FROM roles WHERE id = ? AND tenant_id = ?', [rolId, tenantId]);
        if (rol.length === 0) {
            throw new AppError('El rol especificado no existe', 400);
        }

        await pool.query(`
            UPDATE empleados
            SET estado = 'activo', rol_id = ?, motivo_rechazo = NULL
            WHERE id = ? AND tenant_id = ?
        `, [rolId, id, tenantId]);

        return this.obtenerPorId(tenantId, id);
    }

    /**
     * Rechazar solicitud de acceso
     * @param {number} tenantId - ID del tenant
     * @param {number} id - ID del empleado pendiente
     * @param {string} motivo - Motivo del rechazo
     * @returns {Promise<Object>} Empleado rechazado
     */
    static async rechazarSolicitud(tenantId, id, motivo) {
        const empleado = await this.obtenerPorId(tenantId, id);
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }
        if (empleado.estado !== 'pendiente') {
            throw new AppError('Este empleado no tiene solicitud pendiente', 400);
        }

        await pool.query(`
            UPDATE empleados
            SET estado = 'inactivo', motivo_rechazo = ?
            WHERE id = ? AND tenant_id = ?
        `, [motivo || null, id, tenantId]);

        return this.obtenerPorId(tenantId, id);
    }

    /**
     * Contar solicitudes pendientes
     * @param {number} tenantId - ID del tenant
     * @returns {Promise<number>}
     */
    static async contarPendientes(tenantId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM empleados WHERE estado = 'pendiente' AND tenant_id = ?",
            [tenantId]
        );
        return rows[0].total;
    }
}

module.exports = EmpleadoModel;
