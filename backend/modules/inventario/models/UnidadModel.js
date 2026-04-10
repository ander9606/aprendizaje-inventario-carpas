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

    static obtenerTodas(tenantId) {
        return base.obtenerTodos(tenantId);
    }

    static obtenerConPaginacion(tenantId, params) {
        return base.obtenerConPaginacion(tenantId, params);
    }

    static contarTodas(tenantId, search) {
        return base.contarTodos(tenantId, search);
    }

    static obtenerPorId(tenantId, id) {
        return base.obtenerPorId(tenantId, id);
    }

    static obtenerPorNombre(tenantId, nombre) {
        return base.obtenerPorNombre(tenantId, nombre);
    }

    static async obtenerPorTipo(tenantId, tipo) {
        const [rows] = await pool.query(
            'SELECT * FROM unidades WHERE tipo = ? AND tenant_id = ? ORDER BY nombre',
            [tipo, tenantId]
        );
        return rows;
    }

    static async obtenerMasUsadas(tenantId) {
        const [rows] = await pool.query(`
            SELECT
                u.id,
                u.nombre,
                u.abreviatura,
                u.tipo,
                COUNT(e.id) AS cantidad_elementos
            FROM unidades u
            LEFT JOIN elementos e ON u.id = e.unidad_id AND e.tenant_id = ?
            WHERE u.tenant_id = ?
            GROUP BY u.id, u.nombre, u.abreviatura, u.tipo
            ORDER BY cantidad_elementos DESC
        `, [tenantId, tenantId]);
        return rows;
    }

    static crear(tenantId, datos) {
        const { nombre, abreviatura, tipo } = datos;
        return base.crear(tenantId, { nombre, abreviatura: abreviatura || null, tipo: tipo || 'cantidad' });
    }

    static actualizar(tenantId, id, datos) {
        const { nombre, abreviatura, tipo } = datos;
        return base.actualizar(tenantId, id, { nombre, abreviatura: abreviatura || null, tipo: tipo || 'cantidad' });
    }

    static eliminar(tenantId, id) {
        return base.eliminar(tenantId, id);
    }
}

module.exports = UnidadModel;
