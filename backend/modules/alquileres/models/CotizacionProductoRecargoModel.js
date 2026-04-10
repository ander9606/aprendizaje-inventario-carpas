// ============================================
// MODELO: CotizacionProductoRecargoModel
// Recargos por adelanto/extensión de productos
// ============================================

const { pool } = require('../../../config/database');

class CotizacionProductoRecargoModel {

    /**
     * Obtener recargos de un producto de cotización
     * @param {number} tenantId
     * @param {number} cotizacionProductoId
     * @returns {Promise<Array>}
     */
    static async obtenerPorProducto(tenantId, cotizacionProductoId) {
        const query = `
            SELECT
                id,
                cotizacion_producto_id,
                tipo,
                dias,
                porcentaje,
                monto_recargo,
                fecha_original,
                fecha_modificada,
                notas,
                created_at
            FROM cotizacion_producto_recargos
            WHERE tenant_id = ? AND cotizacion_producto_id = ?
            ORDER BY tipo ASC, created_at ASC
        `;
        const [rows] = await pool.query(query, [tenantId, cotizacionProductoId]);
        return rows;
    }

    /**
     * Obtener recargo por ID
     * @param {number} tenantId
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(tenantId, id) {
        const query = `SELECT * FROM cotizacion_producto_recargos WHERE tenant_id = ? AND id = ?`;
        const [rows] = await pool.query(query, [tenantId, id]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Agregar recargo a un producto
     * @param {number} tenantId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async agregar(tenantId, { cotizacion_producto_id, tipo, dias, porcentaje, fecha_original, fecha_modificada, notas }) {
        // Obtener precio base del producto para calcular monto
        const [productos] = await pool.query(
            'SELECT precio_base, cotizacion_id FROM cotizacion_productos WHERE tenant_id = ? AND id = ?',
            [tenantId, cotizacion_producto_id]
        );

        if (productos.length === 0) {
            throw new Error('Producto de cotización no encontrado');
        }

        const precioBase = parseFloat(productos[0].precio_base);
        const cotizacionId = productos[0].cotizacion_id;
        const montoRecargo = this.calcularMonto(precioBase, porcentaje, dias);

        const query = `
            INSERT INTO cotizacion_producto_recargos
                (tenant_id, cotizacion_producto_id, tipo, dias, porcentaje, monto_recargo, fecha_original, fecha_modificada, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            tenantId,
            cotizacion_producto_id,
            tipo,
            dias,
            porcentaje,
            montoRecargo,
            fecha_original || null,
            fecha_modificada || null,
            notas || null
        ]);

        // Actualizar total_recargos en el producto
        await this.recalcularTotalRecargos(tenantId, cotizacion_producto_id);

        return {
            id: result.insertId,
            cotizacion_producto_id,
            cotizacion_id: cotizacionId,
            tipo,
            dias,
            porcentaje,
            monto_recargo: montoRecargo,
            fecha_original,
            fecha_modificada,
            notas
        };
    }

    /**
     * Actualizar un recargo existente
     * @param {number} tenantId
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object|null>}
     */
    static async actualizar(tenantId, id, { dias, porcentaje, fecha_modificada, notas }) {
        // Obtener datos actuales del recargo
        const recargo = await this.obtenerPorId(tenantId, id);
        if (!recargo) return null;

        // Obtener precio base del producto
        const [productos] = await pool.query(
            'SELECT precio_base FROM cotizacion_productos WHERE tenant_id = ? AND id = ?',
            [tenantId, recargo.cotizacion_producto_id]
        );

        if (productos.length === 0) {
            throw new Error('Producto de cotización no encontrado');
        }

        const precioBase = parseFloat(productos[0].precio_base);
        const montoRecargo = this.calcularMonto(precioBase, porcentaje, dias);

        const query = `
            UPDATE cotizacion_producto_recargos
            SET dias = ?, porcentaje = ?, monto_recargo = ?, fecha_modificada = ?, notas = ?
            WHERE tenant_id = ? AND id = ?
        `;
        await pool.query(query, [dias, porcentaje, montoRecargo, fecha_modificada || null, notas || null, tenantId, id]);

        // Recalcular total de recargos del producto
        await this.recalcularTotalRecargos(tenantId, recargo.cotizacion_producto_id);

        return {
            ...recargo,
            dias,
            porcentaje,
            monto_recargo: montoRecargo,
            fecha_modificada,
            notas
        };
    }

    /**
     * Eliminar un recargo
     * @param {number} tenantId
     * @param {number} id
     * @returns {Promise<Object>}
     */
    static async eliminar(tenantId, id) {
        // Obtener datos antes de eliminar
        const recargo = await this.obtenerPorId(tenantId, id);
        if (!recargo) {
            return { eliminado: false };
        }

        const cotizacionProductoId = recargo.cotizacion_producto_id;

        await pool.query('DELETE FROM cotizacion_producto_recargos WHERE tenant_id = ? AND id = ?', [tenantId, id]);

        // Recalcular total de recargos del producto
        await this.recalcularTotalRecargos(tenantId, cotizacionProductoId);

        return { eliminado: true, cotizacion_producto_id: cotizacionProductoId };
    }

    /**
     * Eliminar todos los recargos de un producto
     * @param {number} tenantId
     * @param {number} cotizacionProductoId
     * @returns {Promise<number>}
     */
    static async eliminarTodosPorProducto(tenantId, cotizacionProductoId) {
        const [result] = await pool.query(
            'DELETE FROM cotizacion_producto_recargos WHERE tenant_id = ? AND cotizacion_producto_id = ?',
            [tenantId, cotizacionProductoId]
        );

        // Resetear total_recargos a 0
        await pool.query(
            'UPDATE cotizacion_productos SET total_recargos = 0 WHERE tenant_id = ? AND id = ?',
            [tenantId, cotizacionProductoId]
        );

        return result.affectedRows;
    }

    /**
     * Recalcular el total de recargos de un producto
     * @param {number} tenantId
     * @param {number} cotizacionProductoId
     * @returns {Promise<number>}
     */
    static async recalcularTotalRecargos(tenantId, cotizacionProductoId) {
        // Calcular suma de todos los recargos
        const [resultado] = await pool.query(`
            SELECT COALESCE(SUM(monto_recargo), 0) AS total
            FROM cotizacion_producto_recargos
            WHERE tenant_id = ? AND cotizacion_producto_id = ?
        `, [tenantId, cotizacionProductoId]);

        const totalRecargos = parseFloat(resultado[0].total);

        // Actualizar en cotizacion_productos
        await pool.query(
            'UPDATE cotizacion_productos SET total_recargos = ? WHERE tenant_id = ? AND id = ?',
            [totalRecargos, tenantId, cotizacionProductoId]
        );

        return totalRecargos;
    }

    /**
     * Obtener la cotización ID a partir de un recargo
     * @param {number} tenantId
     * @param {number} recargoId
     * @returns {Promise<number|null>}
     */
    static async obtenerCotizacionId(tenantId, recargoId) {
        const query = `
            SELECT cp.cotizacion_id
            FROM cotizacion_producto_recargos cpr
            INNER JOIN cotizacion_productos cp ON cpr.cotizacion_producto_id = cp.id AND cp.tenant_id = ?
            WHERE cpr.tenant_id = ? AND cpr.id = ?
        `;
        const [rows] = await pool.query(query, [tenantId, tenantId, recargoId]);
        return rows.length > 0 ? rows[0].cotizacion_id : null;
    }

    /**
     * Calcular monto de recargo
     * Fórmula: monto = precio_base * (porcentaje / 100) * dias
     * @param {number} precioBase
     * @param {number} porcentaje
     * @param {number} dias
     * @returns {number}
     */
    static calcularMonto(precioBase, porcentaje, dias) {
        return Math.round((precioBase * (porcentaje / 100) * dias) * 100) / 100;
    }

    /**
     * Obtener todos los recargos de una cotización
     * @param {number} tenantId
     * @param {number} cotizacionId
     * @returns {Promise<Array>}
     */
    static async obtenerPorCotizacion(tenantId, cotizacionId) {
        const query = `
            SELECT
                cpr.*,
                cp.compuesto_id,
                ec.nombre AS producto_nombre
            FROM cotizacion_producto_recargos cpr
            INNER JOIN cotizacion_productos cp ON cpr.cotizacion_producto_id = cp.id AND cp.tenant_id = ?
            INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id AND ec.tenant_id = ?
            WHERE cpr.tenant_id = ? AND cp.cotizacion_id = ?
            ORDER BY cpr.tipo ASC
        `;
        const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, cotizacionId]);
        return rows;
    }

    /**
     * Calcular total de recargos de una cotización
     * @param {number} tenantId
     * @param {number} cotizacionId
     * @returns {Promise<number>}
     */
    static async calcularTotalCotizacion(tenantId, cotizacionId) {
        const query = `
            SELECT COALESCE(SUM(cpr.monto_recargo), 0) AS total
            FROM cotizacion_producto_recargos cpr
            INNER JOIN cotizacion_productos cp ON cpr.cotizacion_producto_id = cp.id AND cp.tenant_id = ?
            WHERE cpr.tenant_id = ? AND cp.cotizacion_id = ?
        `;
        const [rows] = await pool.query(query, [tenantId, tenantId, cotizacionId]);
        return parseFloat(rows[0].total);
    }
}

module.exports = CotizacionProductoRecargoModel;
