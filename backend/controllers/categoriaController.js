// ============================================
// CONTROLADOR: CATEGORIA
// Incluye manejo del campo emoji
// ============================================

const CategoriaModel = require('../models/CategoriaModel');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { validateNombre, validateEmoji, validateId } = require('../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../config/constants');

/**
 * MEJORAS EN ESTA VERSIÓN:
 *
 * 1. Usa AppError para manejo centralizado de errores
 * 2. Usa validadores centralizados de utils/validators
 * 3. Usa constantes centralizadas de config/constants
 * 4. Logging estructurado con utils/logger
 * 5. Los errores se propagan al middleware global
 * 6. USA COMMONJS (module.exports) NO ES6 MODULES
 */

// ============================================
// OBTENER TODAS LAS CATEGORÍAS
// ============================================

/**
 * GET /api/categorias
 */
exports.obtenerTodas = async (req, res, next) => {
  try {
    const categorias = await CategoriaModel.obtenerTodas();

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
// OBTENER SOLO CATEGORÍAS PADRE
// ============================================

/**
 * GET /api/categorias/padres
 */
exports.obtenerPadres = async (req, res, next) => {
  try {
    const categorias = await CategoriaModel.obtenerPadres();

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

/**
 * GET /api/categorias/:id
 * Nota: El ID ya viene validado por el middleware validateId
 */
exports.obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await CategoriaModel.obtenerPorId(id);

    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
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
// OBTENER SUBCATEGORÍAS
// ============================================

/**
 * GET /api/categorias/:id/hijas
 */
exports.obtenerHijas = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que la categoría padre existe
    const categoriaPadre = await CategoriaModel.obtenerPorId(id);
    if (!categoriaPadre) {
      throw new AppError('Categoría padre no encontrada', 404);
    }

    const subcategorias = await CategoriaModel.obtenerHijas(id);

    res.json({
      success: true,
      data: subcategorias,
      total: subcategorias.length,
      categoria_padre: categoriaPadre
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CREAR CATEGORÍA
// ============================================

/**
 * POST /api/categorias
 *
 * Body:
 * {
 *   "nombre": "Carpas",
 *   "emoji": "🏕️",  // opcional
 *   "padre_id": null  // opcional
 * }
 */
exports.crear = async (req, res, next) => {
  try {
    const { nombre, emoji, padre_id } = req.body;

    logger.info('categoriaController.crear', 'Creando nueva categoría', { nombre });

    // ============================================
    // VALIDACIONES
    // ============================================

    const nombreValidado = validateNombre(nombre, ENTIDADES.CATEGORIA);
    const emojiValidado = validateEmoji(emoji);

    // Validar padre_id si existe
    if (padre_id) {
      const padreIdValidado = validateId(padre_id, 'padre_id');
      const categoriaPadre = await CategoriaModel.obtenerPorId(padreIdValidado);
      if (!categoriaPadre) {
        throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO('Categoría padre'), 404);
      }
    }

    // ============================================
    // CREAR CATEGORÍA
    // ============================================

    const resultado = await CategoriaModel.crear({
      nombre: nombreValidado,
      emoji: emojiValidado,
      padre_id: padre_id || null
    });

    // Obtener la categoría creada con todos sus datos
    const categoriaCreada = await CategoriaModel.obtenerPorId(resultado.insertId);

    logger.info('categoriaController.crear', 'Categoría creada exitosamente', {
      id: resultado.insertId,
      nombre: nombreValidado
    });

    res.status(201).json({
      success: true,
      mensaje: MENSAJES_EXITO.CREADO(ENTIDADES.CATEGORIA),
      data: categoriaCreada
    });
  } catch (error) {
    logger.error('categoriaController.crear', error);
    next(error);
  }
};

// ============================================
// ACTUALIZAR CATEGORÍA
// ============================================

/**
 * PUT /api/categorias/:id
 *
 * Body:
 * {
 *   "nombre": "Carpas Actualizadas",
 *   "emoji": "⛺",  // opcional
 *   "padre_id": null  // opcional
 * }
 */
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, emoji, padre_id } = req.body;

    logger.info('categoriaController.actualizar', 'Actualizando categoría', { id });

    // ============================================
    // VALIDACIONES
    // ============================================

    // Verificar que la categoría existe
    const categoriaExistente = await CategoriaModel.obtenerPorId(id);
    if (!categoriaExistente) {
      throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.CATEGORIA), 404);
    }

    const nombreValidado = validateNombre(nombre, ENTIDADES.CATEGORIA);
    const emojiValidado = validateEmoji(emoji);

    // Validar que no se esté poniendo como su propio padre
    if (padre_id && parseInt(padre_id) === parseInt(id)) {
      throw new AppError('Una categoría no puede ser su propia padre', 400);
    }

    // Validar padre_id si existe
    if (padre_id) {
      const padreIdValidado = validateId(padre_id, 'padre_id');
      const categoriaPadre = await CategoriaModel.obtenerPorId(padreIdValidado);
      if (!categoriaPadre) {
        throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO('Categoría padre'), 404);
      }
    }

    // ============================================
    // ACTUALIZAR CATEGORÍA
    // ============================================

    await CategoriaModel.actualizar(id, {
      nombre: nombreValidado,
      emoji: emojiValidado,
      padre_id: padre_id || null
    });

    // Obtener la categoría actualizada
    const categoriaActualizada = await CategoriaModel.obtenerPorId(id);

    logger.info('categoriaController.actualizar', 'Categoría actualizada exitosamente', {
      id,
      nombre: nombreValidado
    });

    res.json({
      success: true,
      mensaje: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.CATEGORIA),
      data: categoriaActualizada
    });
  } catch (error) {
    logger.error('categoriaController.actualizar', error);
    next(error);
  }
};

// ============================================
// ELIMINAR CATEGORÍA
// ============================================

/**
 * DELETE /api/categorias/:id
 */
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info('categoriaController.eliminar', 'Eliminando categoría', { id });

    // Verificar que la categoría existe
    const categoria = await CategoriaModel.obtenerPorId(id);
    if (!categoria) {
      throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.CATEGORIA), 404);
    }

    // Verificar que no tenga subcategorías
    const tieneSubcategorias = await CategoriaModel.tieneSubcategorias(id);
    if (tieneSubcategorias) {
      throw new AppError(
        MENSAJES_ERROR.NO_SE_PUEDE_ELIMINAR_CON_HIJOS('una categoría'),
        400
      );
    }

    // Verificar que no tenga elementos
    const tieneElementos = await CategoriaModel.tieneElementos(id);
    if (tieneElementos) {
      throw new AppError(
        'No se puede eliminar una categoría que tiene elementos asociados',
        400
      );
    }

    // Eliminar categoría
    await CategoriaModel.eliminar(id);

    logger.info('categoriaController.eliminar', 'Categoría eliminada exitosamente', {
      id,
      nombre: categoria.nombre
    });

    res.json({
      success: true,
      mensaje: MENSAJES_EXITO.ELIMINADO(ENTIDADES.CATEGORIA)
    });
  } catch (error) {
    logger.error('categoriaController.eliminar', error);
    next(error);
  }
};

