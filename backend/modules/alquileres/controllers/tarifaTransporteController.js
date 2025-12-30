// ============================================
// CONTROLADOR: TarifaTransporte
// Tarifas de transporte por tipo de camión y ciudad
// ============================================

const TarifaTransporteModel = require('../models/TarifaTransporteModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODAS
// ============================================
exports.obtenerTodas = async (req, res, next) => {
  try {
    const tarifas = await TarifaTransporteModel.obtenerTodas();
    res.json({
      success: true,
      data: tarifas,
      total: tarifas.length
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
    const tarifas = await TarifaTransporteModel.obtenerActivas();
    res.json({
      success: true,
      data: tarifas,
      total: tarifas.length
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
    const tarifa = await TarifaTransporteModel.obtenerPorId(id);

    if (!tarifa) {
      throw new AppError('Tarifa no encontrada', 404);
    }

    res.json({
      success: true,
      data: tarifa
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR CIUDAD
// ============================================
exports.obtenerPorCiudad = async (req, res, next) => {
  try {
    const { ciudad } = req.params;
    const tarifas = await TarifaTransporteModel.obtenerPorCiudad(ciudad);

    res.json({
      success: true,
      data: tarifas,
      total: tarifas.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER CIUDADES DISPONIBLES
// ============================================
exports.obtenerCiudades = async (req, res, next) => {
  try {
    const ciudades = await TarifaTransporteModel.obtenerCiudades();
    res.json({
      success: true,
      data: ciudades
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER TIPOS DE CAMIÓN
// ============================================
exports.obtenerTiposCamion = async (req, res, next) => {
  try {
    const tipos = await TarifaTransporteModel.obtenerTiposCamion();
    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// BUSCAR TARIFA (tipo + ciudad)
// ============================================
exports.buscarTarifa = async (req, res, next) => {
  try {
    const { tipo_camion, ciudad } = req.query;

    if (!tipo_camion || !ciudad) {
      throw new AppError('Se requiere tipo_camion y ciudad', 400);
    }

    const tarifa = await TarifaTransporteModel.buscarTarifa(tipo_camion, ciudad);

    if (!tarifa) {
      throw new AppError('No existe tarifa para esa combinación', 404);
    }

    res.json({
      success: true,
      data: tarifa
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
    const { tipo_camion, ciudad, precio } = req.body;

    if (!tipo_camion || !ciudad || !precio) {
      throw new AppError('tipo_camion, ciudad y precio son obligatorios', 400);
    }

    // Verificar que no exista
    const existente = await TarifaTransporteModel.buscarTarifa(tipo_camion, ciudad);
    if (existente) {
      throw new AppError('Ya existe una tarifa para esa combinación', 400);
    }

    const resultado = await TarifaTransporteModel.crear({ tipo_camion, ciudad, precio });

    logger.info('tarifaTransporteController.crear', 'Tarifa creada', {
      id: resultado.insertId,
      tipo_camion,
      ciudad,
      precio
    });

    const tarifaCreada = await TarifaTransporteModel.obtenerPorId(resultado.insertId);

    res.status(201).json({
      success: true,
      mensaje: 'Tarifa creada exitosamente',
      data: tarifaCreada
    });
  } catch (error) {
    logger.error('tarifaTransporteController.crear', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo_camion, ciudad, precio, activo } = req.body;

    const tarifaExistente = await TarifaTransporteModel.obtenerPorId(id);
    if (!tarifaExistente) {
      throw new AppError('Tarifa no encontrada', 404);
    }

    await TarifaTransporteModel.actualizar(id, {
      tipo_camion: tipo_camion || tarifaExistente.tipo_camion,
      ciudad: ciudad || tarifaExistente.ciudad,
      precio: precio !== undefined ? precio : tarifaExistente.precio,
      activo
    });

    const tarifaActualizada = await TarifaTransporteModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Tarifa actualizada exitosamente',
      data: tarifaActualizada
    });
  } catch (error) {
    logger.error('tarifaTransporteController.actualizar', error);
    next(error);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tarifa = await TarifaTransporteModel.obtenerPorId(id);
    if (!tarifa) {
      throw new AppError('Tarifa no encontrada', 404);
    }

    await TarifaTransporteModel.eliminar(id);

    res.json({
      success: true,
      mensaje: 'Tarifa eliminada exitosamente'
    });
  } catch (error) {
    logger.error('tarifaTransporteController.eliminar', error);
    next(error);
  }
};

// ============================================
// DESACTIVAR
// ============================================
exports.desactivar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tarifa = await TarifaTransporteModel.obtenerPorId(id);
    if (!tarifa) {
      throw new AppError('Tarifa no encontrada', 404);
    }

    await TarifaTransporteModel.desactivar(id);

    res.json({
      success: true,
      mensaje: 'Tarifa desactivada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
