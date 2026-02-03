// ============================================
// CONTROLADOR: alertasController
// Gestiona las alertas de alquileres
// ============================================

const AlertasAlquilerService = require('../services/AlertasAlquilerService');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

/**
 * GET /api/alertas/alquileres
 * Obtener todas las alertas activas
 */
const getAlertas = async (req, res, next) => {
  try {
    const usuario_id = req.usuario?.id;
    const { solo_criticas } = req.query;

    const alertas = await AlertasAlquilerService.obtenerTodasLasAlertas({
      usuario_id,
      solo_criticas: solo_criticas === 'true'
    });

    res.json({
      success: true,
      data: alertas,
      total: alertas.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alertas/alquileres/criticas
 * Obtener solo alertas críticas
 */
const getAlertasCriticas = async (req, res, next) => {
  try {
    const usuario_id = req.usuario?.id;

    const alertas = await AlertasAlquilerService.obtenerTodasLasAlertas({
      usuario_id,
      solo_criticas: true
    });

    res.json({
      success: true,
      data: alertas,
      total: alertas.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alertas/alquileres/resumen
 * Obtener resumen de alertas (conteos)
 */
const getResumen = async (req, res, next) => {
  try {
    const usuario_id = req.usuario?.id;
    const resumen = await AlertasAlquilerService.obtenerResumen(usuario_id);

    res.json({
      success: true,
      data: resumen
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/alertas/alquileres/ignorar
 * Ignorar una alerta por un período de tiempo
 *
 * Body: { tipo, referencia_id, dias }
 */
const ignorarAlerta = async (req, res, next) => {
  try {
    const { tipo, referencia_id, dias = 1 } = req.body;
    const usuario_id = req.usuario.id;

    if (!tipo || !referencia_id) {
      throw new AppError('tipo y referencia_id son requeridos', 400);
    }

    if (dias < 1 || dias > 30) {
      throw new AppError('dias debe estar entre 1 y 30', 400);
    }

    const resultado = await AlertasAlquilerService.ignorarAlerta(
      tipo,
      referencia_id,
      usuario_id,
      dias
    );

    logger.info('alertas', `Alerta ${tipo}:${referencia_id} ignorada por ${dias} días por ${req.usuario.email}`);

    res.json({
      success: true,
      message: `Alerta ignorada por ${dias} día(s)`,
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/alertas/alquileres/limpiar
 * Limpiar alertas expiradas (admin)
 */
const limpiarExpiradas = async (req, res, next) => {
  try {
    const eliminadas = await AlertasAlquilerService.limpiarAlertasExpiradas();

    res.json({
      success: true,
      message: `${eliminadas} alertas expiradas eliminadas`,
      data: { eliminadas }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlertas,
  getAlertasCriticas,
  getResumen,
  ignorarAlerta,
  limpiarExpiradas
};
