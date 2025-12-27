// ============================================
// CONTROLADOR: CategoriaProducto
// Categorías para productos de alquiler
// ============================================

const CategoriaProductoModel = require('../models/CategoriaProductoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// OBTENER TODAS
// ============================================
exports.obtenerTodas = async (req, res, next) => {
  try {
    const categorias = await CategoriaProductoModel.obtenerTodas();
    res.json({
      success: true,
      data: categorias,
      total: categorias.length
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
    const categorias = await CategoriaProductoModel.obtenerActivas();
    res.json({
      success: true,
      data: categorias,
      total: categorias.length
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
    const categoria = await CategoriaProductoModel.obtenerPorId(id);

    if (!categoria) {
      throw new AppError('Categoría de producto no encontrada', 404);
    }

    res.json({
      success: true,
      data: categoria
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
    const { nombre, descripcion, emoji } = req.body;

    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    logger.info('categoriaProductoController.crear', 'Creando categoría', { nombre });

    const resultado = await CategoriaProductoModel.crear({
      nombre: nombre.trim(),
      descripcion,
      emoji
    });

    const categoriaCreada = await CategoriaProductoModel.obtenerPorId(resultado.insertId);

    res.status(201).json({
      success: true,
      mensaje: 'Categoría de producto creada exitosamente',
      data: categoriaCreada
    });
  } catch (error) {
    logger.error('categoriaProductoController.crear', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, emoji, activo } = req.body;

    const categoriaExistente = await CategoriaProductoModel.obtenerPorId(id);
    if (!categoriaExistente) {
      throw new AppError('Categoría de producto no encontrada', 404);
    }

    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    await CategoriaProductoModel.actualizar(id, {
      nombre: nombre.trim(),
      descripcion,
      emoji,
      activo
    });

    const categoriaActualizada = await CategoriaProductoModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Categoría de producto actualizada exitosamente',
      data: categoriaActualizada
    });
  } catch (error) {
    logger.error('categoriaProductoController.actualizar', error);
    next(error);
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const categoria = await CategoriaProductoModel.obtenerPorId(id);
    if (!categoria) {
      throw new AppError('Categoría de producto no encontrada', 404);
    }

    const tieneProductos = await CategoriaProductoModel.tieneProductos(id);
    if (tieneProductos) {
      throw new AppError('No se puede eliminar una categoría que tiene productos asociados', 400);
    }

    await CategoriaProductoModel.eliminar(id);

    res.json({
      success: true,
      mensaje: 'Categoría de producto eliminada exitosamente'
    });
  } catch (error) {
    logger.error('categoriaProductoController.eliminar', error);
    next(error);
  }
};
