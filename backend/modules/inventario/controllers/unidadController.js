// ============================================
// CONTROLADOR: UNIDADES
// ============================================

const UnidadModel = require('../models/UnidadModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const createCrudController = require('../../../utils/crudController');
const { validateNombre, validateTipoUnidad } = require('../../../utils/validators');
const { ENTIDADES } = require('../../../config/constants');

function validateBody(body, existing) {
    const nombre = body.nombre !== undefined
        ? validateNombre(body.nombre, ENTIDADES.UNIDAD)
        : existing?.nombre;
    const abreviatura = body.abreviatura !== undefined ? body.abreviatura : existing?.abreviatura;
    const tipo = body.tipo !== undefined ? body.tipo : existing?.tipo;
    if (tipo) validateTipoUnidad(tipo, false);
    return { nombre, abreviatura, tipo };
}

async function checkDuplicate(tenantId, data, excludeId) {
    const existente = await UnidadModel.obtenerPorNombre(tenantId, data.nombre);
    if (existente && (!excludeId || existente.id != excludeId)) {
        throw new AppError('Ya existe una unidad con ese nombre', 400);
    }
}

const crud = createCrudController({
    Model: UnidadModel,
    entityName: ENTIDADES.UNIDAD,
    controllerName: 'unidadController',
    validateBody,
    checkDuplicate
});

exports.obtenerTodas = crud.obtenerTodos;
exports.obtenerPorId = crud.obtenerPorId;
exports.crear = crud.crear;
exports.actualizar = crud.actualizar;
exports.eliminar = crud.eliminar;

// Custom: obtenerPorTipo
exports.obtenerPorTipo = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { tipo } = req.params;
        validateTipoUnidad(tipo, true);
        const unidades = await UnidadModel.obtenerPorTipo(tenantId, tipo);
        res.json({ success: true, tipo, data: unidades, total: unidades.length });
    } catch (error) {
        logger.error('unidadController.obtenerPorTipo', error);
        next(error);
    }
};

// Custom: obtenerMasUsadas
exports.obtenerMasUsadas = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const unidades = await UnidadModel.obtenerMasUsadas(tenantId);
        res.json({ success: true, data: unidades, total: unidades.length });
    } catch (error) {
        logger.error('unidadController.obtenerMasUsadas', error);
        next(error);
    }
};
