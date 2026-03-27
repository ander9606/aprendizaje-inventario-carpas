// ============================================
// CONTROLADOR: Departamento
// Catalogo maestro de departamentos
// ============================================

const DepartamentoModel = require('../models/DepartamentoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const createCrudController = require('../../../utils/crudController');

function validateBody(body, existing) {
    let nombre;
    if (body.nombre !== undefined) {
        if (!body.nombre || !body.nombre.trim()) {
            throw new AppError('El nombre es obligatorio', 400);
        }
        nombre = body.nombre.trim();
    } else if (existing) {
        nombre = existing.nombre;
    } else {
        throw new AppError('El nombre es obligatorio', 400);
    }
    const activo = body.activo !== undefined ? body.activo : existing?.activo;
    return { nombre, activo };
}

async function checkDuplicate(data, excludeId) {
    const existe = await DepartamentoModel.nombreExiste(data.nombre, excludeId || null);
    if (existe) {
        throw new AppError('Ya existe un departamento con ese nombre', 400);
    }
}

const crud = createCrudController({
    Model: DepartamentoModel,
    entityName: 'Departamento',
    controllerName: 'departamentoController',
    validateBody,
    checkDuplicate
});

exports.obtenerTodos = crud.obtenerTodos;
exports.obtenerPorId = crud.obtenerPorId;
exports.crear = crud.crear;
exports.actualizar = crud.actualizar;

// Custom: obtenerActivos (not in standard CRUD)
exports.obtenerActivos = async (req, res, next) => {
    try {
        const departamentos = await DepartamentoModel.obtenerActivos();
        res.json({ success: true, data: departamentos, total: departamentos.length });
    } catch (error) {
        next(error);
    }
};

// Custom: eliminar with FK error from model
exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const departamento = await DepartamentoModel.obtenerPorId(id);
        if (!departamento) {
            throw new AppError('Departamento no encontrado', 404);
        }
        await DepartamentoModel.eliminar(id);
        res.json({ success: true, message: 'Departamento eliminado exitosamente' });
    } catch (error) {
        if (error.message.includes('ciudades asociadas')) {
            return next(new AppError(error.message, 400));
        }
        logger.error('departamentoController.eliminar', error);
        next(error);
    }
};
