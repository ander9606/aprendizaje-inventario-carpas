// ============================================
// CONTROLADOR: MATERIALES
// ============================================

const MaterialModel = require('../models/MaterialModel');
const AppError = require('../../../utils/AppError');
const createCrudController = require('../../../utils/crudController');
const { validateNombre, validateDescripcion } = require('../../../utils/validators');
const { ENTIDADES } = require('../../../config/constants');

function validateBody(body, existing) {
    const nombre = body.nombre !== undefined
        ? validateNombre(body.nombre, ENTIDADES.MATERIAL)
        : existing?.nombre;
    const descripcion = body.descripcion !== undefined
        ? validateDescripcion(body.descripcion)
        : existing?.descripcion ?? null;
    return { nombre, descripcion };
}

async function checkDuplicate(data, excludeId) {
    const existente = await MaterialModel.obtenerPorNombre(data.nombre);
    if (existente && (!excludeId || existente.id != excludeId)) {
        throw new AppError('Ya existe un material con ese nombre', 400);
    }
}

const crud = createCrudController({
    Model: MaterialModel,
    entityName: ENTIDADES.MATERIAL,
    controllerName: 'materialController',
    validateBody,
    checkDuplicate
});

exports.obtenerTodos = crud.obtenerTodos;
exports.obtenerPorId = crud.obtenerPorId;
exports.crear = crud.crear;
exports.actualizar = crud.actualizar;
exports.eliminar = crud.eliminar;
