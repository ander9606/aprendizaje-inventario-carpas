// ============================================
// MODELO: MATERIALES
// ============================================

const BaseModel = require('../../../utils/BaseModel');

const base = new BaseModel({
    table: 'materiales',
    alias: 'm',
    columns: ['id', 'nombre', 'descripcion', 'created_at'],
    sortFieldMap: {
        'nombre': 'm.nombre',
        'id': 'm.id',
        'created_at': 'm.created_at'
    }
});

class MaterialModel {

    static obtenerTodos(tenantId) {
        return base.obtenerTodos(tenantId);
    }

    static obtenerConPaginacion(tenantId, params) {
        return base.obtenerConPaginacion(tenantId, params);
    }

    static contarTodos(tenantId, search) {
        return base.contarTodos(tenantId, search);
    }

    static obtenerPorId(tenantId, id) {
        return base.obtenerPorId(tenantId, id);
    }

    static obtenerPorNombre(tenantId, nombre) {
        return base.obtenerPorNombre(tenantId, nombre);
    }

    static crear(tenantId, data) {
        const { nombre, descripcion = null } = data;
        return base.crear(tenantId, { nombre, descripcion });
    }

    static actualizar(tenantId, id, data) {
        const { nombre, descripcion = null } = data;
        return base.actualizar(tenantId, id, { nombre, descripcion });
    }

    static eliminar(tenantId, id) {
        return base.eliminar(tenantId, id);
    }
}

module.exports = MaterialModel;
