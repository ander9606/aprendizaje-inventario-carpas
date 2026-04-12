// ============================================
// MODEL: FotoOperacionModel
// CRUD de fotos operativas por etapa
// ============================================

const { pool } = require('../../../config/database');

const FotoOperacionModel = {
    /**
     * Crear registro de foto
     * @param {number} tenantId
     * @param {Object} datos - { orden_id, etapa, imagen_url, notas, subido_por }
     */
    async crear(tenantId, datos) {
        const { orden_id, etapa, imagen_url, notas, subido_por } = datos;
        const [result] = await pool.query(
            `INSERT INTO orden_trabajo_fotos (tenant_id, orden_id, etapa, imagen_url, notas, subido_por)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tenantId, orden_id, etapa, imagen_url, notas || null, subido_por || null]
        );
        return { id: result.insertId, ...datos };
    },

    /**
     * Obtener fotos de una orden agrupadas por etapa
     * @param {number} tenantId
     * @param {number} ordenId
     */
    async obtenerPorOrden(tenantId, ordenId) {
        const [rows] = await pool.query(
            `SELECT f.*, e.nombre AS subido_por_nombre
             FROM orden_trabajo_fotos f
             LEFT JOIN empleados e ON f.subido_por = e.id AND e.tenant_id = ?
             WHERE f.tenant_id = ? AND f.orden_id = ?
             ORDER BY f.etapa, f.created_at ASC`,
            [tenantId, tenantId, ordenId]
        );

        // Agrupar por etapa
        const agrupadas = {};
        for (const foto of rows) {
            if (!agrupadas[foto.etapa]) {
                agrupadas[foto.etapa] = [];
            }
            agrupadas[foto.etapa].push(foto);
        }

        return { fotos: rows, porEtapa: agrupadas };
    },

    /**
     * Obtener fotos de todas las órdenes de un alquiler
     * @param {number} tenantId
     * @param {number} alquilerId
     */
    async obtenerPorAlquiler(tenantId, alquilerId) {
        const [rows] = await pool.query(
            `SELECT f.*, ot.tipo AS orden_tipo, e.nombre AS subido_por_nombre
             FROM orden_trabajo_fotos f
             INNER JOIN ordenes_trabajo ot ON f.orden_id = ot.id AND ot.tenant_id = ?
             LEFT JOIN empleados e ON f.subido_por = e.id AND e.tenant_id = ?
             WHERE f.tenant_id = ? AND ot.alquiler_id = ?
             ORDER BY ot.tipo, f.etapa, f.created_at ASC`,
            [tenantId, tenantId, tenantId, alquilerId]
        );

        // Agrupar por tipo de orden y etapa
        const porOrden = {};
        for (const foto of rows) {
            const key = `${foto.orden_tipo}`;
            if (!porOrden[key]) {
                porOrden[key] = {};
            }
            if (!porOrden[key][foto.etapa]) {
                porOrden[key][foto.etapa] = [];
            }
            porOrden[key][foto.etapa].push(foto);
        }

        return { fotos: rows, porOrden };
    },

    /**
     * Eliminar una foto
     * @param {number} tenantId
     * @param {number} id
     */
    async eliminar(tenantId, id) {
        const [foto] = await pool.query(
            'SELECT * FROM orden_trabajo_fotos WHERE tenant_id = ? AND id = ?',
            [tenantId, id]
        );
        if (foto.length === 0) return null;

        await pool.query('DELETE FROM orden_trabajo_fotos WHERE tenant_id = ? AND id = ?', [tenantId, id]);
        return foto[0];
    },

    /**
     * Obtener una foto por ID
     * @param {number} tenantId
     * @param {number} id
     */
    async obtenerPorId(tenantId, id) {
        const [rows] = await pool.query(
            'SELECT * FROM orden_trabajo_fotos WHERE tenant_id = ? AND id = ?',
            [tenantId, id]
        );
        return rows[0] || null;
    }
};

module.exports = FotoOperacionModel;
