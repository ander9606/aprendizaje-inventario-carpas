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
// OBTENER EN ÁRBOL JERÁRQUICO
// ============================================
exports.obtenerArbol = async (req, res, next) => {
  try {
    const categorias = await CategoriaProductoModel.obtenerArbol();
    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER ACTIVAS EN ÁRBOL
// ============================================
exports.obtenerActivasArbol = async (req, res, next) => {
  try {
    const categorias = await CategoriaProductoModel.obtenerActivasArbol();
    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER HIJOS DE UNA CATEGORÍA
// ============================================
exports.obtenerHijos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hijos = await CategoriaProductoModel.obtenerHijos(id);
    res.json({
      success: true,
      data: hijos,
      total: hijos.length
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
    const { nombre, descripcion, emoji, categoria_padre_id } = req.body;

    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // Validar que la categoría padre existe si se proporciona
    if (categoria_padre_id) {
      const padre = await CategoriaProductoModel.obtenerPorId(categoria_padre_id);
      if (!padre) {
        throw new AppError('La categoría padre no existe', 400);
      }
    }

    logger.info('categoriaProductoController.crear', 'Creando categoría', { nombre, categoria_padre_id });

    const resultado = await CategoriaProductoModel.crear({
      nombre: nombre.trim(),
      descripcion,
      emoji,
      categoria_padre_id
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
    const { nombre, descripcion, emoji, activo, categoria_padre_id } = req.body;

    const categoriaExistente = await CategoriaProductoModel.obtenerPorId(id);
    if (!categoriaExistente) {
      throw new AppError('Categoría de producto no encontrada', 404);
    }

    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    // No permitir que una categoría sea su propio padre
    if (categoria_padre_id && parseInt(categoria_padre_id) === parseInt(id)) {
      throw new AppError('Una categoría no puede ser su propio padre', 400);
    }

    // Validar que la categoría padre existe si se proporciona
    if (categoria_padre_id) {
      const padre = await CategoriaProductoModel.obtenerPorId(categoria_padre_id);
      if (!padre) {
        throw new AppError('La categoría padre no existe', 400);
      }
    }

    await CategoriaProductoModel.actualizar(id, {
      nombre: nombre.trim(),
      descripcion,
      emoji,
      activo,
      categoria_padre_id
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

    // Verificar si tiene subcategorías
    const tieneSubcategorias = await CategoriaProductoModel.tieneSubcategorias(id);
    if (tieneSubcategorias) {
      throw new AppError('No se puede eliminar una categoría que tiene subcategorías. Elimine primero las subcategorías.', 400);
    }

    // Verificar si tiene productos
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
