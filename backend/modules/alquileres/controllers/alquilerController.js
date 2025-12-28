// ============================================
// CONTROLADOR: Alquiler
// Alquileres confirmados
// ============================================

const AlquilerModel = require('../models/AlquilerModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODOS
// ============================================
exports.obtenerTodos = async (req, res, next) => {
  try {
    const alquileres = await AlquilerModel.obtenerTodos();
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR ESTADO
// ============================================
exports.obtenerPorEstado = async (req, res, next) => {
  try {
    const { estado } = req.params;
    const estadosValidos = ['programado', 'activo', 'finalizado', 'cancelado'];

    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
    }

    const alquileres = await AlquilerModel.obtenerPorEstado(estado);
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
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
    const alquileres = await AlquilerModel.obtenerActivos();
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER PROGRAMADOS
// ============================================
exports.obtenerProgramados = async (req, res, next) => {
  try {
    const alquileres = await AlquilerModel.obtenerProgramados();
    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
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
    const alquiler = await AlquilerModel.obtenerPorId(id);

    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    res.json({
      success: true,
      data: alquiler
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MARCAR SALIDA (activo)
// ============================================
exports.marcarSalida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_salida, notas_salida } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado !== 'programado') {
      throw new AppError('Solo se puede marcar salida en alquileres programados', 400);
    }

    await AlquilerModel.marcarActivo(id, {
      fecha_salida: fecha_salida || new Date(),
      notas_salida
    });

    logger.info('alquilerController.marcarSalida', 'Alquiler marcado como activo', { id });

    const alquilerActualizado = await AlquilerModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Salida registrada exitosamente',
      data: alquilerActualizado
    });
  } catch (error) {
    logger.error('alquilerController.marcarSalida', error);
    next(error);
  }
};

// ============================================
// MARCAR RETORNO (finalizado)
// ============================================
exports.marcarRetorno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_retorno_real, costo_danos, notas_retorno } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado !== 'activo') {
      throw new AppError('Solo se puede marcar retorno en alquileres activos', 400);
    }

    await AlquilerModel.marcarFinalizado(id, {
      fecha_retorno_real: fecha_retorno_real || new Date(),
      costo_danos,
      notas_retorno
    });

    logger.info('alquilerController.marcarRetorno', 'Alquiler finalizado', {
      id,
      costo_danos
    });

    const alquilerActualizado = await AlquilerModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Retorno registrado exitosamente',
      data: alquilerActualizado
    });
  } catch (error) {
    logger.error('alquilerController.marcarRetorno', error);
    next(error);
  }
};

// ============================================
// CANCELAR
// ============================================
exports.cancelar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notas } = req.body;

    const alquiler = await AlquilerModel.obtenerPorId(id);
    if (!alquiler) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    if (alquiler.estado === 'finalizado') {
      throw new AppError('No se puede cancelar un alquiler ya finalizado', 400);
    }

    if (alquiler.estado === 'cancelado') {
      throw new AppError('El alquiler ya está cancelado', 400);
    }

    await AlquilerModel.cancelar(id, notas);

    logger.info('alquilerController.cancelar', 'Alquiler cancelado', { id });

    res.json({
      success: true,
      mensaje: 'Alquiler cancelado exitosamente'
    });
  } catch (error) {
    logger.error('alquilerController.cancelar', error);
    next(error);
  }
};

// ============================================
// OBTENER POR RANGO DE FECHAS
// ============================================
exports.obtenerPorRangoFechas = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      throw new AppError('Se requieren fechaInicio y fechaFin', 400);
    }

    const alquileres = await AlquilerModel.obtenerPorRangoFechas(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: alquileres,
      total: alquileres.length
    });
  } catch (error) {
    next(error);
  }
};
