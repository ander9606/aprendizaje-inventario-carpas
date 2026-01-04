// ============================================
// CONTROLADOR: Ciudad
// Catálogo maestro de ciudades
// ============================================

const CiudadModel = require('../models/CiudadModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODAS
// ============================================
exports.obtenerTodas = async (req, res, next) => {
  try {
    const ciudades = await CiudadModel.obtenerTodas();
    res.json({
      success: true,
      data: ciudades,
      total: ciudades.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER ACTIVAS
// ============================================
exports.obtenerActivas = async (req, res, next) => {
  try {
    const ciudades = await CiudadModel.obtenerActivas();
    res.json({
      success: true,
      data: ciudades,
      total: ciudades.length
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
    const ciudad = await CiudadModel.obtenerPorId(id);

    if (!ciudad) {
      throw new AppError('Ciudad no encontrada', 404);
    }

    res.json({
      success: true,
      data: ciudad
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
    const { nombre, departamento } = req.body;

    if (!nombre) {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // Verificar que no exista
    const existe = await CiudadModel.nombreExiste(nombre);
    if (existe) {
      throw new AppError('Ya existe una ciudad con ese nombre', 400);
    }

    const resultado = await CiudadModel.crear({ nombre, departamento });

    logger.info('ciudadController.crear', 'Ciudad creada', {
      id: resultado.insertId,
      nombre,
      departamento
    });

    const ciudadCreada = await CiudadModel.obtenerPorId(resultado.insertId);

    res.status(201).json({
      success: true,
      mensaje: 'Ciudad creada exitosamente',
      data: ciudadCreada
    });
  } catch (error) {
    logger.error('ciudadController.crear', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, departamento, activo } = req.body;

    const ciudadExistente = await CiudadModel.obtenerPorId(id);
    if (!ciudadExistente) {
      throw new AppError('Ciudad no encontrada', 404);
    }

    // Verificar nombre único
    if (nombre && nombre !== ciudadExistente.nombre) {
      const existe = await CiudadModel.nombreExiste(nombre, id);
      if (existe) {
        throw new AppError('Ya existe una ciudad con ese nombre', 400);
      }
    }

    await CiudadModel.actualizar(id, {
      nombre: nombre || ciudadExistente.nombre,
      departamento: departamento !== undefined ? departamento : ciudadExistente.departamento,
      activo
    });

    const ciudadActualizada = await CiudadModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Ciudad actualizada exitosamente',
      data: ciudadActualizada
    });
  } catch (error) {
    logger.error('ciudadController.actualizar', error);
    next(error);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ciudad = await CiudadModel.obtenerPorId(id);
    if (!ciudad) {
      throw new AppError('Ciudad no encontrada', 404);
    }

    await CiudadModel.eliminar(id);

    res.json({
      success: true,
      mensaje: 'Ciudad eliminada exitosamente'
    });
  } catch (error) {
    // Si el modelo lanza error por tener asociaciones
    if (error.message.includes('tarifas o ubicaciones')) {
      return next(new AppError(error.message, 400));
    }
    logger.error('ciudadController.eliminar', error);
    next(error);
  }
};

// ============================================
// DESACTIVAR
// ============================================
exports.desactivar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ciudad = await CiudadModel.obtenerPorId(id);
    if (!ciudad) {
      throw new AppError('Ciudad no encontrada', 404);
    }

    await CiudadModel.desactivar(id);

    res.json({
      success: true,
      mensaje: 'Ciudad desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
