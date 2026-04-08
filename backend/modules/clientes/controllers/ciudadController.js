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
    const tenantId = req.tenant.id;
    const ciudades = await CiudadModel.obtenerTodas(tenantId);
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
    const tenantId = req.tenant.id;
    const ciudades = await CiudadModel.obtenerActivas(tenantId);
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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const ciudad = await CiudadModel.obtenerPorId(tenantId, id);

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
    const tenantId = req.tenant.id;
    const { nombre, departamento_id, departamento, tarifas } = req.body;

    if (!nombre) {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // Verificar que no exista
    const existe = await CiudadModel.nombreExiste(tenantId, nombre);
    if (existe) {
      throw new AppError('Ya existe una ciudad con ese nombre', 400);
    }

    const resultado = await CiudadModel.crear(tenantId, { nombre, departamento_id, departamento, tarifas });

    logger.info('ciudadController.crear', 'Ciudad creada con tarifas', {
      id: resultado.insertId,
      nombre,
      departamento_id,
      tarifas
    });

    const ciudadCreada = await CiudadModel.obtenerPorId(tenantId, resultado.insertId);

    res.status(201).json({
      success: true,
      message: 'Ciudad creada exitosamente',
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
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { nombre, departamento_id, departamento, activo, tarifas } = req.body;

    const ciudadExistente = await CiudadModel.obtenerPorId(tenantId, id);
    if (!ciudadExistente) {
      throw new AppError('Ciudad no encontrada', 404);
    }

    // Verificar nombre único
    if (nombre && nombre !== ciudadExistente.nombre) {
      const existe = await CiudadModel.nombreExiste(tenantId, nombre, id);
      if (existe) {
        throw new AppError('Ya existe una ciudad con ese nombre', 400);
      }
    }

    await CiudadModel.actualizar(tenantId, id, {
      nombre: nombre || ciudadExistente.nombre,
      departamento_id: departamento_id !== undefined ? departamento_id : ciudadExistente.departamento_id,
      departamento: departamento !== undefined ? departamento : ciudadExistente.departamento,
      activo,
      tarifas
    });

    const ciudadActualizada = await CiudadModel.obtenerPorId(tenantId, id);

    res.json({
      success: true,
      message: 'Ciudad actualizada exitosamente',
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
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const ciudad = await CiudadModel.obtenerPorId(tenantId, id);
    if (!ciudad) {
      throw new AppError('Ciudad no encontrada', 404);
    }

    await CiudadModel.eliminar(tenantId, id);

    res.json({
      success: true,
      message: 'Ciudad eliminada exitosamente'
    });
  } catch (error) {
    // Si el modelo lanza error por tener ubicaciones asociadas
    if (error.message.includes('ubicaciones asociadas')) {
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
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const ciudad = await CiudadModel.obtenerPorId(tenantId, id);
    if (!ciudad) {
      throw new AppError('Ciudad no encontrada', 404);
    }

    await CiudadModel.desactivar(tenantId, id);

    res.json({
      success: true,
      message: 'Ciudad desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
