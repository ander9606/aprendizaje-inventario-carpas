const { pool } = require('../../../config/database');

class PlanModel {
    /**
     * Obtener todos los planes con conteo de tenants
     */
    static async obtenerTodos() {
        const [rows] = await pool.query(`
            SELECT p.*,
                   (SELECT COUNT(*) FROM tenants t WHERE t.plan_id = p.id) AS tenant_count
            FROM planes p
            ORDER BY p.precio_mensual ASC
        `);
        return rows;
    }

    /**
     * Obtener plan por ID
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT p.*,
                   (SELECT COUNT(*) FROM tenants t WHERE t.plan_id = p.id) AS tenant_count
            FROM planes p
            WHERE p.id = ?
        `, [id]);
        return rows[0];
    }

    /**
     * Crear plan
     */
    static async crear(data) {
        const { nombre, slug, max_empleados, max_elementos, max_alquileres, max_cotizaciones, precio_mensual, features } = data;
        const [result] = await pool.query(
            `INSERT INTO planes (nombre, slug, max_empleados, max_elementos, max_alquileres, max_cotizaciones, precio_mensual, features)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, slug, max_empleados || null, max_elementos || null, max_alquileres || null, max_cotizaciones || null, precio_mensual || 0, JSON.stringify(features || {})]
        );
        return result.insertId;
    }

    /**
     * Actualizar plan
     */
    static async actualizar(id, data) {
        const { nombre, slug, max_empleados, max_elementos, max_alquileres, max_cotizaciones, precio_mensual, features, activo } = data;
        const [result] = await pool.query(
            `UPDATE planes SET nombre = ?, slug = ?, max_empleados = ?, max_elementos = ?,
             max_alquileres = ?, max_cotizaciones = ?, precio_mensual = ?, features = ?, activo = ?
             WHERE id = ?`,
            [nombre, slug, max_empleados || null, max_elementos || null, max_alquileres || null, max_cotizaciones || null, precio_mensual || 0, JSON.stringify(features || {}), activo !== undefined ? activo : 1, id]
        );
        return result.affectedRows;
    }

    /**
     * Eliminar plan (solo si no tiene tenants)
     */
    static async eliminar(id) {
        const [count] = await pool.query('SELECT COUNT(*) AS total FROM tenants WHERE plan_id = ?', [id]);
        if (count[0].total > 0) {
            return { deleted: false, tenantCount: count[0].total };
        }
        const [result] = await pool.query('DELETE FROM planes WHERE id = ?', [id]);
        return { deleted: result.affectedRows > 0, tenantCount: 0 };
    }

    /**
     * Verificar si slug existe
     */
    static async slugExiste(slug, excludeId = null) {
        let query = 'SELECT COUNT(*) AS total FROM planes WHERE slug = ?';
        const params = [slug];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.query(query, params);
        return rows[0].total > 0;
    }
}

module.exports = PlanModel;
