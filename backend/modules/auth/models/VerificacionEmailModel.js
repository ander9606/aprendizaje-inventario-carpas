const { pool } = require('../../../config/database');

class VerificacionEmailModel {
    /**
     * Crear registro de verificación
     * @param {number} tenantId
     * @param {Object} datos - email, codigo, datos_registro, expira_en
     * @returns {Promise<Object>}
     */
    static async crear(tenantId, datos) {
        const { email, codigo, datos_registro, expira_en } = datos;

        // Eliminar verificaciones anteriores no completadas del mismo email
        await pool.query(
            'DELETE FROM verificacion_email WHERE email = ? AND verificado = 0 AND tenant_id = ?',
            [email, tenantId]
        );

        const [result] = await pool.query(
            `INSERT INTO verificacion_email (tenant_id, email, codigo, datos_registro, expira_en)
             VALUES (?, ?, ?, ?, ?)`,
            [tenantId, email, codigo, JSON.stringify(datos_registro), expira_en]
        );

        return { id: result.insertId, email, expira_en };
    }

    /**
     * Buscar verificación pendiente por email
     * @param {number} tenantId
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    static async buscarPorEmail(tenantId, email) {
        const [rows] = await pool.query(
            `SELECT * FROM verificacion_email
             WHERE email = ? AND verificado = 0 AND expira_en > NOW() AND tenant_id = ?
             ORDER BY created_at DESC LIMIT 1`,
            [email, tenantId]
        );

        if (rows.length === 0) return null;

        const registro = rows[0];
        if (registro.datos_registro && typeof registro.datos_registro === 'string') {
            registro.datos_registro = JSON.parse(registro.datos_registro);
        }

        return registro;
    }

    /**
     * Incrementar intentos de verificación
     * @param {number} id
     * @returns {Promise<number>} Intentos actuales
     */
    static async incrementarIntentos(id) {
        await pool.query(
            'UPDATE verificacion_email SET intentos = intentos + 1 WHERE id = ?',
            [id]
        );

        const [rows] = await pool.query(
            'SELECT intentos FROM verificacion_email WHERE id = ?',
            [id]
        );

        return rows[0]?.intentos || 0;
    }

    /**
     * Marcar como verificado
     * @param {number} id
     */
    static async marcarVerificado(id) {
        await pool.query(
            'UPDATE verificacion_email SET verificado = 1 WHERE id = ?',
            [id]
        );
    }

    /**
     * Limpiar registros expirados
     */
    static async limpiarExpirados() {
        await pool.query(
            'DELETE FROM verificacion_email WHERE expira_en < NOW() OR verificado = 1'
        );
    }
}

module.exports = VerificacionEmailModel;
