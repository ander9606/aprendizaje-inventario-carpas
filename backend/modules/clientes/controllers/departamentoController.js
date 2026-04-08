// ============================================
// CONTROLADOR: Departamento
// Catalogo maestro de departamentos
// ============================================

const DepartamentoModel = require('../models/DepartamentoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

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

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const data = await DepartamentoModel.obtenerTodos(tenantId);
        res.json({ success: true, data, total: data.length });
    } catch (error) {
        logger.error('departamentoController.obtenerTodos', error);
        next(error);
    }
};

// ============================================
// OBTENER POR ID
// ============================================
exports.obtenerPorId = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const data = await DepartamentoModel.obtenerPorId(tenantId, id);
        if (!data) {
            throw new AppError('Departamento no encontrado', 404);
        }
        res.json({ success: true, data });
    } catch (error) {
        logger.error('departamentoController.obtenerPorId', error);
        next(error);
    }
};

// ============================================
// CREAR
// ============================================
exports.crear = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const cleanData = validateBody(req.body);

        const existe = await DepartamentoModel.nombreExiste(tenantId, cleanData.nombre, null);
        if (existe) {
            throw new AppError('Ya existe un departamento con ese nombre', 400);
        }

        const nuevoId = await DepartamentoModel.crear(tenantId, cleanData);
        const data = await DepartamentoModel.obtenerPorId(tenantId, nuevoId);

        logger.info('departamentoController.crear', 'Departamento creado exitosamente', { id: nuevoId });

        res.status(201).json({
            success: true,
            message: 'Departamento creado exitosamente',
            data
        });
    } catch (error) {
        logger.error('departamentoController.crear', error);
        next(error);
    }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        const existe = await DepartamentoModel.obtenerPorId(tenantId, id);
        if (!existe) {
            throw new AppError('Departamento no encontrado', 404);
        }

        const cleanData = validateBody(req.body, existe);

        const duplicado = await DepartamentoModel.nombreExiste(tenantId, cleanData.nombre, id);
        if (duplicado) {
            throw new AppError('Ya existe un departamento con ese nombre', 400);
        }

        await DepartamentoModel.actualizar(tenantId, id, cleanData);
        const data = await DepartamentoModel.obtenerPorId(tenantId, id);

        logger.info('departamentoController.actualizar', 'Departamento actualizado exitosamente', { id });

        res.json({
            success: true,
            message: 'Departamento actualizado exitosamente',
            data
        });
    } catch (error) {
        logger.error('departamentoController.actualizar', error);
        next(error);
    }
};

// ============================================
// OBTENER ACTIVOS
// ============================================
exports.obtenerActivos = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const departamentos = await DepartamentoModel.obtenerActivos(tenantId);
        res.json({ success: true, data: departamentos, total: departamentos.length });
    } catch (error) {
        next(error);
    }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const departamento = await DepartamentoModel.obtenerPorId(tenantId, id);
        if (!departamento) {
            throw new AppError('Departamento no encontrado', 404);
        }
        await DepartamentoModel.eliminar(tenantId, id);
        res.json({ success: true, message: 'Departamento eliminado exitosamente' });
    } catch (error) {
        if (error.message.includes('ciudades asociadas')) {
            return next(new AppError(error.message, 400));
        }
        logger.error('departamentoController.eliminar', error);
        next(error);
    }
};
