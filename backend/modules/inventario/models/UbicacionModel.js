// ============================================
// MODELO: UBICACIONES
// ============================================

const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class UbicacionModel {

    // ============================================
    // OBTENER TODAS LAS UBICACIONES
    // ============================================
    static async obtenerTodas(tenantId) {
        const query = `
            SELECT
                u.id,
                u.nombre,
                u.tipo,
                u.direccion,
                u.ciudad_id,
                c.nombre as ciudad,
                u.responsable,
                u.telefono,
                u.email,
                u.capacidad_estimada,
                u.observaciones,
                u.activo,
                u.es_principal,
                u.created_at,
                u.updated_at
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.tenant_id = ?
            ORDER BY u.es_principal DESC, u.tipo, u.nombre
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion(tenantId, { limit, offset, sortBy = 'nombre', order = 'ASC', search = null }) {
        const sortFieldMap = {
            'nombre': 'u.nombre',
            'tipo': 'u.tipo',
            'id': 'u.id',
            'created_at': 'u.created_at'
        };

        let query = `
            SELECT
                u.id, u.nombre, u.tipo, u.direccion, u.ciudad_id,
                c.nombre as ciudad, u.responsable, u.telefono, u.email,
                u.capacidad_estimada, u.observaciones, u.activo,
                u.es_principal, u.created_at, u.updated_at
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.tenant_id = ?
        `;
        const params = [tenantId];

        if (search) {
            query += ` AND u.nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const sortField = sortFieldMap[sortBy] || 'u.nombre';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY u.es_principal DESC, ${sortField} ${sortOrder}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // ============================================
    // CONTAR TOTAL
    // ============================================
    static async contarTodas(tenantId, search = null) {
        let query = `SELECT COUNT(*) as total FROM ubicaciones WHERE tenant_id = ?`;
        const params = [tenantId];

        if (search) {
            query += ` AND nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    // ============================================
    // OBTENER SOLO UBICACIONES ACTIVAS
    // ============================================
    static async obtenerActivas(tenantId) {
        const query = `
            SELECT
                u.id,
                u.nombre,
                u.tipo,
                u.direccion,
                u.ciudad_id,
                c.nombre as ciudad,
                u.responsable,
                u.telefono,
                u.activo,
                u.es_principal
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.activo = TRUE AND u.tenant_id = ?
            ORDER BY u.es_principal DESC, u.tipo, u.nombre
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER UBICACIÓN POR ID
    // ============================================
    static async obtenerPorId(tenantId, id) {
        const query = `
            SELECT
                u.id,
                u.nombre,
                u.tipo,
                u.direccion,
                u.ciudad_id,
                c.nombre as ciudad,
                u.responsable,
                u.telefono,
                u.email,
                u.capacidad_estimada,
                u.observaciones,
                u.activo,
                u.es_principal,
                u.created_at,
                u.updated_at
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.id = ? AND u.tenant_id = ?
        `;

        const [rows] = await pool.query(query, [id, tenantId]);
        return rows[0];
    }

    // ============================================
    // OBTENER UBICACIÓN PRINCIPAL
    // ============================================
    static async obtenerPrincipal(tenantId) {
        const query = `
            SELECT
                u.id, u.nombre, u.tipo, u.direccion, u.ciudad_id,
                c.nombre as ciudad, u.responsable, u.telefono, u.email,
                u.capacidad_estimada, u.observaciones, u.activo,
                u.es_principal, u.created_at, u.updated_at
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.es_principal = TRUE AND u.tenant_id = ?
            LIMIT 1
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows[0];
    }

    // ============================================
    // OBTENER UBICACIONES POR CIUDAD
    // ============================================
    static async obtenerPorCiudadId(tenantId, ciudadId) {
        const query = `
            SELECT
                u.id, u.nombre, u.tipo, u.direccion, u.ciudad_id,
                c.nombre as ciudad, u.responsable, u.telefono,
                u.observaciones, u.activo, u.es_principal
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.ciudad_id = ? AND u.activo = TRUE AND u.tenant_id = ?
            ORDER BY u.tipo, u.nombre
        `;

        const [rows] = await pool.query(query, [ciudadId, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER UBICACIONES POR TIPO
    // ============================================
    static async obtenerPorTipo(tenantId, tipo) {
        const query = `
            SELECT
                u.id, u.nombre, u.tipo, u.direccion, u.ciudad_id,
                c.nombre as ciudad, u.responsable, u.telefono,
                u.activo, u.es_principal
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.tipo = ? AND u.activo = TRUE AND u.tenant_id = ?
            ORDER BY u.es_principal DESC, u.nombre
        `;

        const [rows] = await pool.query(query, [tipo, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER UBICACIÓN POR NOMBRE
    // ============================================
    static async obtenerPorNombre(tenantId, nombre) {
        const query = `
            SELECT u.*, c.nombre as ciudad
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            WHERE u.nombre = ? AND u.tenant_id = ?
            LIMIT 1
        `;

        const [rows] = await pool.query(query, [nombre, tenantId]);
        return rows[0];
    }

    // ============================================
    // OBTENER UBICACIONES CON INVENTARIO
    // ============================================
    static async obtenerConInventario(tenantId) {
        const query = `
            SELECT
                u.id, u.nombre, u.tipo, u.ciudad_id,
                c.nombre as ciudad, u.responsable, u.activo, u.es_principal,
                COALESCE(series.total_series, 0) as total_series,
                COALESCE(lotes.total_unidades, 0) as total_unidades,
                COALESCE(series.total_series, 0) + COALESCE(lotes.total_unidades, 0) as total_items
            FROM ubicaciones u
            LEFT JOIN ciudades c ON u.ciudad_id = c.id AND c.tenant_id = u.tenant_id
            LEFT JOIN (
                SELECT ubicacion_id, COUNT(*) as total_series
                FROM series
                WHERE ubicacion_id IS NOT NULL AND tenant_id = ?
                GROUP BY ubicacion_id
            ) series ON u.id = series.ubicacion_id
            LEFT JOIN (
                SELECT ubicacion_id, SUM(cantidad) as total_unidades
                FROM lotes
                WHERE ubicacion_id IS NOT NULL AND tenant_id = ?
                GROUP BY ubicacion_id
            ) lotes ON u.id = lotes.ubicacion_id
            WHERE u.activo = TRUE AND u.tenant_id = ?
            ORDER BY u.es_principal DESC, total_items DESC, u.tipo, u.nombre
        `;

        const [rows] = await pool.query(query, [tenantId, tenantId, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER DETALLE DE INVENTARIO POR UBICACIÓN
    // ============================================
    static async obtenerDetalleInventario(tenantId, id) {
        const querySeries = `
            SELECT
                e.nombre AS elemento_nombre,
                s.estado,
                COUNT(*) as cantidad
            FROM series s
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            WHERE s.ubicacion_id = ? AND s.tenant_id = ?
            GROUP BY e.nombre, s.estado
            ORDER BY e.nombre, s.estado
        `;

        const queryLotes = `
            SELECT
                e.nombre AS elemento_nombre,
                l.estado,
                SUM(l.cantidad) as cantidad
            FROM lotes l
            INNER JOIN elementos e ON l.elemento_id = e.id AND e.tenant_id = l.tenant_id
            WHERE l.ubicacion_id = ? AND l.tenant_id = ?
            GROUP BY e.nombre, l.estado
            ORDER BY e.nombre, l.estado
        `;

        const [series] = await pool.query(querySeries, [id, tenantId]);
        const [lotes] = await pool.query(queryLotes, [id, tenantId]);

        return { series, lotes };
    }

    // ============================================
    // CREAR NUEVA UBICACIÓN
    // ============================================
    static async crear(tenantId, datos) {
        const {
            nombre, tipo, direccion, ciudad_id, responsable,
            telefono, email, capacidad_estimada, observaciones,
            activo, es_principal
        } = datos;

        if (es_principal) {
            await pool.query('UPDATE ubicaciones SET es_principal = FALSE WHERE tenant_id = ?', [tenantId]);
        }

        const query = `
            INSERT INTO ubicaciones
            (tenant_id, nombre, tipo, direccion, ciudad_id, responsable, telefono,
             email, capacidad_estimada, observaciones, activo, es_principal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            tenantId,
            nombre,
            tipo || 'bodega',
            direccion || null,
            ciudad_id || null,
            responsable || null,
            telefono || null,
            email || null,
            capacidad_estimada || null,
            observaciones || null,
            activo !== undefined ? activo : true,
            es_principal || false
        ]);

        return result.insertId;
    }

    // ============================================
    // ACTUALIZAR UBICACIÓN
    // ============================================
    static async actualizar(tenantId, id, datos) {
        const {
            nombre, tipo, direccion, ciudad_id, responsable,
            telefono, email, capacidad_estimada, observaciones,
            activo, es_principal
        } = datos;

        if (es_principal) {
            await pool.query(
                'UPDATE ubicaciones SET es_principal = FALSE WHERE id != ? AND tenant_id = ?',
                [id, tenantId]
            );
        }

        const query = `
            UPDATE ubicaciones
            SET nombre = ?, tipo = ?, direccion = ?, ciudad_id = ?,
                responsable = ?, telefono = ?, email = ?,
                capacidad_estimada = ?, observaciones = ?,
                activo = ?, es_principal = ?
            WHERE id = ? AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [
            nombre, tipo || 'bodega', direccion || null,
            ciudad_id || null, responsable || null, telefono || null,
            email || null, capacidad_estimada || null, observaciones || null,
            activo !== undefined ? activo : true,
            es_principal !== undefined ? es_principal : false, id, tenantId
        ]);

        return result.affectedRows;
    }

    // ============================================
    // MARCAR COMO PRINCIPAL
    // ============================================
    static async marcarComoPrincipal(tenantId, id) {
        await pool.query(
            'UPDATE ubicaciones SET es_principal = FALSE WHERE id != ? AND tenant_id = ?',
            [id, tenantId]
        );

        const [result] = await pool.query(
            'UPDATE ubicaciones SET es_principal = TRUE WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );

        return result.affectedRows;
    }

    // ============================================
    // DESACTIVAR UBICACIÓN (Soft Delete)
    // ============================================
    static async desactivar(tenantId, id) {
        const ubicacion = await this.obtenerPorId(tenantId, id);
        if (ubicacion && ubicacion.es_principal) {
            throw new AppError('No se puede desactivar la ubicación principal. Marca otra como principal primero.', 400);
        }

        const [result] = await pool.query(
            'UPDATE ubicaciones SET activo = FALSE WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return result.affectedRows;
    }

    // ============================================
    // ACTIVAR UBICACIÓN
    // ============================================
    static async activar(tenantId, id) {
        const [result] = await pool.query(
            'UPDATE ubicaciones SET activo = TRUE WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return result.affectedRows;
    }

    // ============================================
    // ELIMINAR UBICACIÓN (Hard Delete)
    // ============================================
    static async eliminar(tenantId, id) {
        const ubicacion = await this.obtenerPorId(tenantId, id);
        if (ubicacion && ubicacion.es_principal) {
            throw new AppError('No se puede eliminar la ubicación principal. Marca otra como principal primero.', 400);
        }

        const querySeries = 'SELECT COUNT(*) as total FROM series WHERE ubicacion_id = ? AND tenant_id = ?';
        const queryLotes = 'SELECT COUNT(*) as total FROM lotes WHERE ubicacion_id = ? AND tenant_id = ?';

        const [series] = await pool.query(querySeries, [id, tenantId]);
        const [lotes] = await pool.query(queryLotes, [id, tenantId]);

        if (series[0].total > 0 || lotes[0].total > 0) {
            throw new AppError('No se puede eliminar una ubicación con inventario asociado', 400);
        }

        const [result] = await pool.query(
            'DELETE FROM ubicaciones WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );

        return result.affectedRows;
    }

    // ============================================
    // VERIFICAR SI NOMBRE EXISTE
    // ============================================
    static async nombreExiste(tenantId, nombre, excluirId = null) {
        let query = 'SELECT COUNT(*) as total FROM ubicaciones WHERE nombre = ? AND tenant_id = ?';
        const params = [nombre, tenantId];

        if (excluirId) {
            query += ' AND id != ?';
            params.push(excluirId);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total > 0;
    }
}

module.exports = UbicacionModel;
