// ============================================
// CONTROLADOR: CATEGORIA
// Incluye manejo del campo emoji
// ============================================

const CategoriaModel = require('../models/CategoriaModel');
const AppError = require('../utils/AppError');

/**
 * MEJORAS EN ESTA VERSIÓN:
 *
 * 1. Usa AppError para manejo centralizado de errores
 * 2. Validación de emoji (opcional pero con límites)
 * 3. Los errores se propagan al middleware global
 * 4. USA COMMONJS (module.exports) NO ES6 MODULES
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

    // ============================================
    // VALIDACIONES
    // ============================================

    // Validar nombre
    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    if (nombre.length < 3 || nombre.length > 50) {
      throw new AppError('El nombre debe tener entre 3 y 50 caracteres', 400);
    }

    // Validar emoji (opcional pero con límites)
    if (emoji && emoji.length > 10) {
      throw new AppError('El emoji no puede tener más de 10 caracteres', 400);
    }

    // Validar padre_id si existe
    if (padre_id) {
      const categoriaPadre = await CategoriaModel.obtenerPorId(padre_id);
      if (!categoriaPadre) {
        throw new AppError('La categoría padre no existe', 404);
      }
    }

    // ============================================
    // CREAR CATEGORÍA
    // ============================================

    const resultado = await CategoriaModel.crear({
      nombre: nombre.trim(),
      emoji: emoji?.trim() || null,
      padre_id: padre_id || null
    });

    // Obtener la categoría creada con todos sus datos
    const categoriaCreada = await CategoriaModel.obtenerPorId(resultado.insertId);

    res.status(201).json({
      success: true,
      mensaje: 'Categoría creada exitosamente',
      data: categoriaCreada
    });
  } catch (error) {
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

    // ============================================
    // VALIDACIONES
    // ============================================

    // Verificar que la categoría existe
    const categoriaExistente = await CategoriaModel.obtenerPorId(id);
    if (!categoriaExistente) {
      throw new AppError('Categoría no encontrada', 404);
    }

    // Validar nombre
    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre es obligatorio', 400);
    }

    if (nombre.length < 3 || nombre.length > 50) {
      throw new AppError('El nombre debe tener entre 3 y 50 caracteres', 400);
    }

    // Validar emoji
    if (emoji && emoji.length > 10) {
      throw new AppError('El emoji no puede tener más de 10 caracteres', 400);
    }

    // Validar que no se esté poniendo como su propio padre
    if (padre_id && parseInt(padre_id) === parseInt(id)) {
      throw new AppError('Una categoría no puede ser su propia padre', 400);
    }

    // Validar padre_id si existe
    if (padre_id) {
      const categoriaPadre = await CategoriaModel.obtenerPorId(padre_id);
      if (!categoriaPadre) {
        throw new AppError('La categoría padre no existe', 404);
      }
    }

    // ============================================
    // ACTUALIZAR CATEGORÍA
    // ============================================

    await CategoriaModel.actualizar(id, {
      nombre: nombre.trim(),
      emoji: emoji?.trim() || null,
      padre_id: padre_id || null
    });

    // Obtener la categoría actualizada
    const categoriaActualizada = await CategoriaModel.obtenerPorId(id);

    res.json({
      success: true,
      mensaje: 'Categoría actualizada exitosamente',
      data: categoriaActualizada
    });
  } catch (error) {
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

    // Verificar que la categoría existe
    const categoria = await CategoriaModel.obtenerPorId(id);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404);
    }

    // Verificar que no tenga subcategorías
    const tieneSubcategorias = await CategoriaModel.tieneSubcategorias(id);
    if (tieneSubcategorias) {
      throw new AppError('No se puede eliminar una categoría que tiene subcategorías', 400);
    }

    // Verificar que no tenga elementos
    const tieneElementos = await CategoriaModel.tieneElementos(id);
    if (tieneElementos) {
      throw new AppError('No se puede eliminar una categoría que tiene elementos asociados', 400);
    }

    // Eliminar categoría
    await CategoriaModel.eliminar(id);

    res.json({
      success: true,
      mensaje: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

