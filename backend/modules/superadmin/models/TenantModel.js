const { pool } = require('../../../config/database');

class TenantModel {
    /**
     * Obtener todos los tenants con info de plan
     */
    static async obtenerTodos({ limit = 20, offset = 0, search = '', estado = '', planId = '' } = {}) {
        let query = `
            SELECT t.*, p.nombre AS plan_nombre, p.slug AS plan_slug,
                   p.max_empleados, p.max_elementos, p.precio_mensual
            FROM tenants t
            LEFT JOIN planes p ON t.plan_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (t.nombre LIKE ? OR t.slug LIKE ? OR t.email_contacto LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (estado) {
            query += ` AND t.estado = ?`;
            params.push(estado);
        }
        if (planId) {
            query += ` AND t.plan_id = ?`;
            params.push(parseInt(planId));
        }

        query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        return rows;
    }

    /**
     * Contar tenants con filtros
     */
    static async contar({ search = '', estado = '', planId = '' } = {}) {
        let query = `SELECT COUNT(*) AS total FROM tenants t WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (t.nombre LIKE ? OR t.slug LIKE ? OR t.email_contacto LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (estado) {
            query += ` AND t.estado = ?`;
            params.push(estado);
        }
        if (planId) {
            query += ` AND t.plan_id = ?`;
            params.push(parseInt(planId));
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    /**
     * Obtener tenant por ID con stats
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT t.*, p.nombre AS plan_nombre, p.slug AS plan_slug,
                   p.max_empleados, p.max_elementos, p.precio_mensual, p.features
            FROM tenants t
            LEFT JOIN planes p ON t.plan_id = p.id
            WHERE t.id = ?
        `, [id]);
        return rows[0];
    }

    /**
     * Obtener estadísticas de un tenant
     */
    static async obtenerEstadisticas(tenantId) {
        const queries = await Promise.all([
            pool.query('SELECT COUNT(*) AS total FROM empleados WHERE tenant_id = ? AND estado = ?', [tenantId, 'activo']),
            pool.query('SELECT COUNT(*) AS total FROM elementos WHERE tenant_id = ?', [tenantId]),
            pool.query('SELECT COUNT(*) AS total FROM alquileres WHERE tenant_id = ? AND estado IN (?, ?)', [tenantId, 'programado', 'en_curso']),
            pool.query('SELECT COUNT(*) AS total FROM cotizaciones WHERE tenant_id = ?', [tenantId])
        ]);

        return {
            empleados: queries[0][0][0].total,
            elementos: queries[1][0][0].total,
            alquileres_activos: queries[2][0][0].total,
            cotizaciones: queries[3][0][0].total
        };
    }

    /**
     * Obtener empleados de un tenant
     */
    static async obtenerEmpleados(tenantId, { limit = 20, offset = 0 } = {}) {
        const [rows] = await pool.query(`
            SELECT e.id, e.nombre, e.apellido, e.email, e.telefono, e.estado,
                   e.ultimo_login, e.created_at, r.nombre AS rol_nombre
            FROM empleados e
            LEFT JOIN roles r ON e.rol_id = r.id AND r.tenant_id = ?
            WHERE e.tenant_id = ?
            ORDER BY e.nombre ASC
            LIMIT ? OFFSET ?
        `, [tenantId, tenantId, limit, offset]);
        return rows;
    }

    /**
     * Crear tenant
     */
    static async crear(data) {
        const { nombre, slug, email_contacto, telefono, nit, direccion, plan_id } = data;
        const [result] = await pool.query(
            `INSERT INTO tenants (nombre, slug, email_contacto, telefono, nit, direccion, plan_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombre, slug, email_contacto || null, telefono || null, nit || null, direccion || null, plan_id || 1]
        );
        return result.insertId;
    }

    /**
     * Actualizar tenant
     */
    static async actualizar(id, data) {
        const { nombre, email_contacto, telefono, nit, direccion, plan_id } = data;
        const [result] = await pool.query(
            `UPDATE tenants SET nombre = ?, email_contacto = ?, telefono = ?, nit = ?, direccion = ?, plan_id = ?
             WHERE id = ?`,
            [nombre, email_contacto || null, telefono || null, nit || null, direccion || null, plan_id, id]
        );
        return result.affectedRows;
    }

    /**
     * Cambiar estado del tenant
     */
    static async cambiarEstado(id, estado) {
        const [result] = await pool.query(
            'UPDATE tenants SET estado = ? WHERE id = ?',
            [estado, id]
        );
        return result.affectedRows;
    }

    /**
     * Verificar si slug ya existe
     */
    static async slugExiste(slug, excludeId = null) {
        let query = 'SELECT COUNT(*) AS total FROM tenants WHERE slug = ?';
        const params = [slug];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.query(query, params);
        return rows[0].total > 0;
    }

    /**
     * Estadísticas globales para dashboard
     */
    static async estadisticasGlobales() {
        const queries = await Promise.all([
            pool.query(`SELECT COUNT(*) AS total,
                        SUM(estado = 'activo') AS activos,
                        SUM(estado = 'suspendido') AS suspendidos,
                        SUM(estado = 'inactivo') AS inactivos
                        FROM tenants`),
            pool.query('SELECT COUNT(*) AS total FROM empleados WHERE estado = ?', ['activo']),
            pool.query('SELECT COUNT(*) AS total FROM elementos'),
            pool.query(`SELECT COUNT(*) AS total FROM alquileres WHERE estado IN ('programado', 'en_curso')`),
            pool.query(`SELECT t.plan_id, p.nombre AS plan_nombre, COUNT(*) AS total
                        FROM tenants t LEFT JOIN planes p ON t.plan_id = p.id
                        GROUP BY t.plan_id, p.nombre`),
            pool.query(`SELECT COUNT(*) AS total FROM tenants
                        WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`)
        ]);

        const tenantStats = queries[0][0][0];
        return {
            tenants: {
                total: tenantStats.total,
                activos: tenantStats.activos || 0,
                suspendidos: tenantStats.suspendidos || 0,
                inactivos: tenantStats.inactivos || 0
            },
            totalEmpleados: queries[1][0][0].total,
            totalElementos: queries[2][0][0].total,
            totalAlquileresActivos: queries[3][0][0].total,
            tenantsPorPlan: queries[4][0],
            tenantsNuevosEsteMes: queries[5][0][0].total
        };
    }

    /**
     * Tenants cercanos a límites de plan
     */
    static async tenantsCercaLimites() {
        const [rows] = await pool.query(`
            SELECT t.id, t.nombre, t.slug, t.estado,
                   p.nombre AS plan_nombre, p.max_empleados, p.max_elementos,
                   (SELECT COUNT(*) FROM empleados e WHERE e.tenant_id = t.id AND e.estado = 'activo') AS empleados_count,
                   (SELECT COUNT(*) FROM elementos el WHERE el.tenant_id = t.id) AS elementos_count
            FROM tenants t
            INNER JOIN planes p ON t.plan_id = p.id
            WHERE t.estado = 'activo'
              AND p.max_empleados IS NOT NULL
            HAVING (empleados_count >= p.max_empleados * 0.8 OR elementos_count >= p.max_elementos * 0.8)
            ORDER BY (empleados_count / p.max_empleados) DESC
        `);
        return rows;
    }
}

module.exports = TenantModel;
