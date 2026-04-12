const { pool } = require('../../../config/database');

class SuperAdminModel {
    /**
     * Buscar super admin por email (para login)
     */
    static async buscarPorEmail(email) {
        const [rows] = await pool.query(
            `SELECT id, nombre, apellido, email, password_hash, telefono, estado,
                    intentos_fallidos, bloqueado_hasta, ultimo_login
             FROM super_admins
             WHERE email = ?`,
            [email]
        );
        return rows[0] || null;
    }

    /**
     * Obtener super admin por id (sin password)
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(
            `SELECT id, nombre, apellido, email, telefono, estado, ultimo_login, created_at
             FROM super_admins
             WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async actualizarUltimoLogin(id) {
        await pool.query(
            `UPDATE super_admins
             SET ultimo_login = CURRENT_TIMESTAMP,
                 intentos_fallidos = 0,
                 bloqueado_hasta = NULL
             WHERE id = ?`,
            [id]
        );
    }

    static async incrementarIntentosFallidos(id) {
        await pool.query(
            `UPDATE super_admins SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?`,
            [id]
        );
        const [rows] = await pool.query(
            `SELECT intentos_fallidos FROM super_admins WHERE id = ?`,
            [id]
        );
        return rows[0]?.intentos_fallidos || 0;
    }

    static async bloquearCuenta(id, hasta) {
        await pool.query(
            `UPDATE super_admins SET bloqueado_hasta = ? WHERE id = ?`,
            [hasta, id]
        );
    }
}

module.exports = SuperAdminModel;
