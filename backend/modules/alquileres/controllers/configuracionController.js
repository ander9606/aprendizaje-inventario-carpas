// ============================================
// CONTROLADOR: Configuración
// Parámetros del sistema de alquileres
// ============================================

const ConfiguracionModel = require('../models/ConfiguracionModel');
const AppError = require('../../../utils/AppError');

// ============================================
// OBTENER TODAS LAS CONFIGURACIONES
// ============================================
exports.obtenerTodas = async (req, res, next) => {
  try {
    const configuraciones = await ConfiguracionModel.obtenerTodas();

    // Agrupar por categoría
    const agrupadas = configuraciones.reduce((acc, config) => {
      if (!acc[config.categoria]) {
        acc[config.categoria] = [];
      }
      acc[config.categoria].push(config);
      return acc;
    }, {});

    res.json({
      success: true,
      data: configuraciones,
      agrupadas
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER POR CATEGORÍA
// ============================================
exports.obtenerPorCategoria = async (req, res, next) => {
  try {
    const { categoria } = req.params;
    const configuraciones = await ConfiguracionModel.obtenerPorCategoria(categoria);

    res.json({
      success: true,
      data: configuraciones
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER VALOR ESPECÍFICO
// ============================================
exports.obtenerValor = async (req, res, next) => {
  try {
    const { clave } = req.params;
    const valor = await ConfiguracionModel.obtenerValor(clave);

    if (valor === null) {
      throw new AppError('Configuración no encontrada', 404);
    }

    res.json({
      success: true,
      data: { clave, valor }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER CONFIGURACIÓN COMPLETA (OBJETO)
// ============================================
exports.obtenerConfiguracionCompleta = async (req, res, next) => {
  try {
    const config = await ConfiguracionModel.obtenerConfiguracionCompleta();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ACTUALIZAR VALOR
// ============================================
exports.actualizarValor = async (req, res, next) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;

    if (valor === undefined) {
      throw new AppError('El valor es requerido', 400);
    }

    await ConfiguracionModel.actualizarValor(clave, valor);
    const valorActualizado = await ConfiguracionModel.obtenerValor(clave);

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: { clave, valor: valorActualizado }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ACTUALIZAR MÚLTIPLES VALORES
// ============================================
exports.actualizarValores = async (req, res, next) => {
  try {
    const { valores } = req.body;

    if (!valores || typeof valores !== 'object') {
      throw new AppError('Se requiere un objeto con los valores a actualizar', 400);
    }

    const resultado = await ConfiguracionModel.actualizarValores(valores);
    const configActualizada = await ConfiguracionModel.obtenerConfiguracionCompleta();

    res.json({
      success: true,
      message: `${resultado.actualizados} configuraciones actualizadas`,
      data: configActualizada
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER CATEGORÍAS
// ============================================
exports.obtenerCategorias = async (req, res, next) => {
  try {
    const categorias = await ConfiguracionModel.obtenerCategorias();

    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    next(error);
  }
};
