const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class EmpleadoModel {
    /**
     * Obtener todos los empleados con paginación y filtros
     * @param {Object} options - Opciones de filtrado y paginación
     * @returns {Promise<Object>} Lista de empleados y total
     */
    static async obtenerTodos(options = {}) {
        const {
            page = 1,
            limit = 20,
            buscar = '',
            rol_id = null,
            activo = null,
            ordenar = 'nombre',
            direccion = 'ASC'
        } = options;

        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

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

        // Filtro por estado activo
        if (activo !== null) {
            whereClause += ` AND e.activo = ?`;
            params.push(activo);
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
                e.activo,
                e.ultimo_login,
                e.created_at,
                r.nombre as rol_nombre
            FROM empleados e
            INNER JOIN roles r ON e.rol_id = r.id
            ${whereClause}
            ORDER BY e.${ordenarCampo} ${ordenarDireccion}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Contar total
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM empleados e
            ${whereClause}
        `, params);

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
                e.intentos_fallidos,
                e.bloqueado_hasta,
                e.created_at,
                e.updated_at,
                r.nombre as rol_nombre,
                r.descripcion as rol_descripcion,
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
     * Crear nuevo empleado
     * @param {Object} datos
     * @returns {Promise<Object>} Empleado creado
     */
    static async crear(datos) {
        const { nombre, apellido, email, telefono, password_hash, rol_id } = datos;

        // Verificar si el email ya existe
        const [existente] = await pool.query(
            'SELECT id FROM empleados WHERE email = ?',
            [email]
        );

        if (existente.length > 0) {
            throw new AppError('Ya existe un empleado con ese email', 400);
        }

        // Verificar que el rol existe
        const [rol] = await pool.query('SELECT id FROM roles WHERE id = ?', [rol_id]);
        if (rol.length === 0) {
            throw new AppError('El rol especificado no existe', 400);
        }

        const [result] = await pool.query(`
            INSERT INTO empleados (nombre, apellido, email, telefono, password_hash, rol_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [nombre, apellido, email, telefono || null, password_hash, rol_id]);

        return this.obtenerPorId(result.insertId);
    }

    /**
     * Actualizar empleado
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>} Empleado actualizado
     */
    static async actualizar(id, datos) {
        const { nombre, apellido, email, telefono, rol_id, activo } = datos;

        // Verificar que existe
        const empleadoExistente = await this.obtenerPorId(id);
        if (!empleadoExistente) {
            throw new AppError('Empleado no encontrado', 404);
        }

        // Verificar si el nuevo email ya existe (si cambió)
        if (email && email !== empleadoExistente.email) {
            const [existente] = await pool.query(
                'SELECT id FROM empleados WHERE email = ? AND id != ?',
                [email, id]
            );

            if (existente.length > 0) {
                throw new AppError('Ya existe otro empleado con ese email', 400);
            }
        }

        // Verificar que el rol existe (si cambió)
        if (rol_id && rol_id !== empleadoExistente.rol_id) {
            const [rol] = await pool.query('SELECT id FROM roles WHERE id = ?', [rol_id]);
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
        if (activo !== undefined) {
            campos.push('activo = ?');
            valores.push(activo);
        }

        if (campos.length === 0) {
            throw new AppError('No hay datos para actualizar', 400);
        }

        valores.push(id);

        await pool.query(`
            UPDATE empleados
            SET ${campos.join(', ')}
            WHERE id = ?
        `, valores);

        return this.obtenerPorId(id);
    }

    /**
     * Eliminar (desactivar) empleado
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    static async eliminar(id) {
        const empleado = await this.obtenerPorId(id);
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }

        // Soft delete - solo desactivar
        await pool.query('UPDATE empleados SET activo = FALSE WHERE id = ?', [id]);

        return true;
    }

    /**
     * Reactivar empleado
     * @param {number} id
     * @returns {Promise<Object>}
     */
    static async reactivar(id) {
        const [rows] = await pool.query('SELECT id FROM empleados WHERE id = ?', [id]);
        if (rows.length === 0) {
            throw new AppError('Empleado no encontrado', 404);
        }

        await pool.query('UPDATE empleados SET activo = TRUE WHERE id = ?', [id]);

        return this.obtenerPorId(id);
    }

    /**
     * Obtener empleados por rol
     * @param {number} rolId
     * @returns {Promise<Array>}
     */
    static async obtenerPorRol(rolId) {
        const [rows] = await pool.query(`
            SELECT
                e.id,
                e.nombre,
                e.apellido,
                e.email,
                e.telefono,
                e.activo,
                r.nombre as rol_nombre
            FROM empleados e
            INNER JOIN roles r ON e.rol_id = r.id
            WHERE e.rol_id = ? AND e.activo = TRUE
            ORDER BY e.nombre ASC
        `, [rolId]);

        return rows;
    }

    /**
     * Obtener empleados disponibles para trabajo de campo
     * (operaciones y personal que puede asignarse a órdenes)
     * @param {Date} fecha - Fecha para verificar disponibilidad (opcional)
     * @returns {Promise<Array>}
     */
    static async obtenerDisponiblesCampo(fecha = null) {
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
            INNER JOIN roles r ON e.rol_id = r.id
            WHERE e.activo = TRUE
              AND r.nombre IN ('operaciones', 'bodega')
            ORDER BY e.nombre ASC
        `);

        // TODO: Si se proporciona fecha, filtrar por disponibilidad
        // (no asignados a otras órdenes en esa fecha)

        return rows;
    }

    /**
     * Cambiar contraseña de empleado (admin)
     * @param {number} id
     * @param {string} nuevoPasswordHash
     */
    static async cambiarPassword(id, nuevoPasswordHash) {
        const empleado = await this.obtenerPorId(id);
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }

        await pool.query(`
            UPDATE empleados
            SET password_hash = ?,
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ?
        `, [nuevoPasswordHash, id]);
    }

    /**
     * Obtener todos los roles disponibles
     * @returns {Promise<Array>}
     */
    static async obtenerRoles() {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, permisos
            FROM roles
            ORDER BY id ASC
        `);

        return rows.map(rol => ({
            ...rol,
            permisos: typeof rol.permisos === 'string' ? JSON.parse(rol.permisos) : rol.permisos
        }));
    }

    /**
     * Obtener estadísticas de empleados
     * @returns {Promise<Object>}
     */
    static async obtenerEstadisticas() {
        const [stats] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN activo = FALSE THEN 1 ELSE 0 END) as inactivos,
                SUM(CASE WHEN bloqueado_hasta > NOW() THEN 1 ELSE 0 END) as bloqueados
            FROM empleados
        `);

        const [porRol] = await pool.query(`
            SELECT
                r.nombre as rol,
                COUNT(e.id) as cantidad
            FROM roles r
            LEFT JOIN empleados e ON r.id = e.rol_id AND e.activo = TRUE
            GROUP BY r.id, r.nombre
            ORDER BY r.id
        `);

        return {
            ...stats[0],
            porRol
        };
    }
}

module.exports = EmpleadoModel;
