// ============================================
// MODELO: UNIDADES
// ============================================

const { pool } = require('../../../config/database');

class UnidadModel {

    static async obtenerTodas() {
        const [rows] = await pool.query(
            'SELECT * FROM unidades ORDER BY nombre'
        );
        return rows;
    }

    static async obtenerConPaginacion({ limit, offset, sortBy = 'nombre', order = 'ASC', search = null }) {
        const sortFieldMap = {
            'nombre': 'nombre',
            'tipo': 'tipo',
            'id': 'id'
        };

        let query = `SELECT * FROM unidades`;
        const params = [];

        if (search) {
            query += ` WHERE nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const sortField = sortFieldMap[sortBy] || 'nombre';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortField} ${sortOrder}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async contarTodas(search = null) {
        let query = `SELECT COUNT(*) as total FROM unidades`;
        const params = [];

        if (search) {
            query += ` WHERE nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    static async obtenerPorId(id) {
        const [rows] = await pool.query(
            'SELECT * FROM unidades WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async obtenerPorNombre(nombre) {
        const [rows] = await pool.query(
            'SELECT * FROM unidades WHERE nombre = ?',
            [nombre]
        );
        return rows[0];
    }

    static async obtenerPorTipo(tipo) {
        const [rows] = await pool.query(
            'SELECT * FROM unidades WHERE tipo = ? ORDER BY nombre',
            [tipo]
        );
        return rows;
    }

    static async obtenerMasUsadas() {
        const query = `
            SELECT
                u.id,
                u.nombre,
                u.abreviatura,
                u.tipo,
                COUNT(e.id) AS cantidad_elementos
            FROM unidades u
            LEFT JOIN elementos e ON u.id = e.unidad_id
            GROUP BY u.id, u.nombre, u.abreviatura, u.tipo
            ORDER BY cantidad_elementos DESC
        `;

        const [rows] = await pool.query(query);
        return rows;
    }

    static async crear(datos) {
        const { nombre, abreviatura, tipo } = datos;

        const [result] = await pool.query(
            'INSERT INTO unidades (nombre, abreviatura, tipo) VALUES (?, ?, ?)',
            [nombre, abreviatura || null, tipo || 'cantidad']
        );

        return result.insertId;
    }

    static async actualizar(id, datos) {
        const { nombre, abreviatura, tipo } = datos;

        const [result] = await pool.query(
            'UPDATE unidades SET nombre = ?, abreviatura = ?, tipo = ? WHERE id = ?',
            [nombre, abreviatura || null, tipo || 'cantidad', id]
        );

        return result.affectedRows;
    }

    static async eliminar(id) {
        const [result] = await pool.query(
            'DELETE FROM unidades WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }
}

module.exports = UnidadModel;
