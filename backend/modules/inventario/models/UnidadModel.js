// ============================================
// MODELO: UNIDADES
// ============================================

const { pool } = require('../../../config/database');
const BaseModel = require('../../../utils/BaseModel');

const base = new BaseModel({
    table: 'unidades',
    alias: 'u',
    sortFieldMap: {
        'nombre': 'nombre',
        'tipo': 'tipo',
        'id': 'id'
    }
});

class UnidadModel {

    static obtenerTodas() {
        return base.obtenerTodos();
    }

    static obtenerConPaginacion(params) {
        return base.obtenerConPaginacion(params);
    }

    static contarTodas(search) {
        return base.contarTodos(search);
    }

    static obtenerPorId(id) {
        return base.obtenerPorId(id);
    }

    static obtenerPorNombre(nombre) {
        return base.obtenerPorNombre(nombre);
    }

    static async obtenerPorTipo(tipo) {
        const [rows] = await pool.query(
            'SELECT * FROM unidades WHERE tipo = ? ORDER BY nombre',
            [tipo]
        );
        return rows;
    }

    static async obtenerMasUsadas() {
        const [rows] = await pool.query(`
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
        `);
        return rows;
    }

    static crear(datos) {
        const { nombre, abreviatura, tipo } = datos;
        return base.crear({ nombre, abreviatura: abreviatura || null, tipo: tipo || 'cantidad' });
    }

    static actualizar(id, datos) {
        const { nombre, abreviatura, tipo } = datos;
        return base.actualizar(id, { nombre, abreviatura: abreviatura || null, tipo: tipo || 'cantidad' });
    }

    static eliminar(id) {
        return base.eliminar(id);
    }
}

module.exports = UnidadModel;
