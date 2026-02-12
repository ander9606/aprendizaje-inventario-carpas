// ============================================
// MODELO: MATERIALES
// ============================================

const { pool } = require('../../../config/database');

class MaterialModel {

    static async obtenerTodos() {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, created_at
            FROM materiales
            ORDER BY nombre
        `);
        return rows;
    }

    static async obtenerConPaginacion({ limit, offset, sortBy = 'nombre', order = 'ASC', search = null }) {
        const sortFieldMap = {
            'nombre': 'm.nombre',
            'id': 'm.id',
            'created_at': 'm.created_at'
        };

        let query = `SELECT m.id, m.nombre, m.descripcion, m.created_at FROM materiales m`;
        const params = [];

        if (search) {
            query += ` WHERE m.nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const sortField = sortFieldMap[sortBy] || 'm.nombre';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortField} ${sortOrder}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async contarTodos(search = null) {
        let query = `SELECT COUNT(*) as total FROM materiales`;
        const params = [];

        if (search) {
            query += ` WHERE nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, created_at
            FROM materiales
            WHERE id = ?
        `, [id]);
        return rows[0];
    }

    static async obtenerPorNombre(nombre) {
        const [rows] = await pool.query(
            'SELECT id, nombre FROM materiales WHERE nombre = ? LIMIT 1',
            [nombre]
        );
        return rows[0];
    }

    static async crear(data) {
        const { nombre, descripcion = null } = data;

        const [result] = await pool.query(`
            INSERT INTO materiales (nombre, descripcion)
            VALUES (?, ?)
        `, [nombre, descripcion]);

        return result.insertId;
    }

    static async actualizar(id, data) {
        const { nombre, descripcion = null } = data;

        await pool.query(`
            UPDATE materiales
            SET nombre = ?, descripcion = ?
            WHERE id = ?
        `, [nombre, descripcion, id]);
    }

    static async eliminar(id) {
        await pool.query(
            'DELETE FROM materiales WHERE id = ?',
            [id]
        );
    }
}

module.exports = MaterialModel;
