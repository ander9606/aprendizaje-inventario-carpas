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

    static obtenerTodos() {
        return base.obtenerTodos();
    }

    static obtenerConPaginacion(params) {
        return base.obtenerConPaginacion(params);
    }

    static contarTodos(search) {
        return base.contarTodos(search);
    }

    static obtenerPorId(id) {
        return base.obtenerPorId(id);
    }

    static obtenerPorNombre(nombre) {
        return base.obtenerPorNombre(nombre);
    }

    static crear(data) {
        const { nombre, descripcion = null } = data;
        return base.crear({ nombre, descripcion });
    }

    static actualizar(id, data) {
        const { nombre, descripcion = null } = data;
        return base.actualizar(id, { nombre, descripcion });
    }

    static eliminar(id) {
        return base.eliminar(id);
    }
}

module.exports = MaterialModel;
