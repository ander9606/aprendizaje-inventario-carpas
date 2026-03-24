// ============================================
// CONTROLADOR: Departamento
// Catálogo maestro de departamentos
// ============================================

const DepartamentoModel = require('../models/DepartamentoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const departamentos = await DepartamentoModel.obtenerTodos();
    res.json({
      success: true,
      data: departamentos,
      total: departamentos.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER ACTIVOS
// ============================================
exports.obtenerActivos = async (req, res, next) => {
  try {
    const departamentos = await DepartamentoModel.obtenerActivos();
    res.json({
      success: true,
      data: departamentos,
      total: departamentos.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR ID
// ============================================
exports.obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const departamento = await DepartamentoModel.obtenerPorId(id);

    if (!departamento) {
      throw new AppError('Departamento no encontrado', 404);
    }

    res.json({
      success: true,
      data: departamento
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CREAR
// ============================================
exports.crear = async (req, res, next) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      throw new AppError('El nombre es obligatorio', 400);
    }

    const existe = await DepartamentoModel.nombreExiste(nombre.trim());
    if (existe) {
      throw new AppError('Ya existe un departamento con ese nombre', 400);
    }

    const resultado = await DepartamentoModel.crear({ nombre: nombre.trim() });

    logger.info('departamentoController.crear', 'Departamento creado', {
      id: resultado.insertId,
      nombre
    });

    const departamentoCreado = await DepartamentoModel.obtenerPorId(resultado.insertId);

    res.status(201).json({
      success: true,
      mensaje: 'Departamento creado exitosamente',
      data: departamentoCreado
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
    const { id } = req.params;
    const { nombre, activo } = req.body;

    const departamento = await DepartamentoModel.obtenerPorId(id);
    if (!departamento) {
      throw new AppError('Departamento no encontrado', 404);
    }

    if (nombre && nombre.trim() !== departamento.nombre) {
      const existe = await DepartamentoModel.nombreExiste(nombre.trim(), id);
      if (existe) {
        throw new AppError('Ya existe un departamento con ese nombre', 400);
      }
    }

    await DepartamentoModel.actualizar(id, {
      nombre: nombre ? nombre.trim() : departamento.nombre,
      activo
    });

    const departamentoActualizado = await DepartamentoModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Departamento actualizado exitosamente',
      data: departamentoActualizado
    });
  } catch (error) {
    logger.error('departamentoController.actualizar', error);
    next(error);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const departamento = await DepartamentoModel.obtenerPorId(id);
    if (!departamento) {
      throw new AppError('Departamento no encontrado', 404);
    }

    await DepartamentoModel.eliminar(id);

    res.json({
      success: true,
      mensaje: 'Departamento eliminado exitosamente'
    });
  } catch (error) {
    if (error.message.includes('ciudades asociadas')) {
      return next(new AppError(error.message, 400));
    }
    logger.error('departamentoController.eliminar', error);
    next(error);
  }
};
