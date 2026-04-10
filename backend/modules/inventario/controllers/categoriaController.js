// ============================================
// CONTROLADOR: CATEGORIA
// Incluye manejo del campo emoji
// ============================================

const CategoriaModel = require('../models/CategoriaModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { validateNombre, validateEmoji, validateId } = require('../../../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../../../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../../../utils/pagination');

// ============================================
// OBTENER TODAS LAS CATEGORÍAS
// ============================================
exports.obtenerTodas = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;

    if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
      const { page, limit, offset } = getPaginationParams(req.query);
      const { sortBy, order } = getSortParams(req.query, 'nombre');
      const search = req.query.search || null;

      logger.debug('categoriaController.obtenerTodas', 'Modo paginado', {
        page, limit, offset, sortBy, order, search
      });

      const categorias = await CategoriaModel.obtenerConPaginacion(tenantId, {
        limit,
        offset,
        sortBy,
        order,
        search
      });
      const total = await CategoriaModel.contarTodas(tenantId, search);

      res.json(getPaginatedResponse(categorias, page, limit, total));
    } else {
      const categorias = await CategoriaModel.obtenerTodas(tenantId);

      res.json({
        success: true,
        data: categorias,
        total: categorias.length
      });
    }
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER SOLO CATEGORÍAS PADRE
// ============================================
exports.obtenerPadres = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;

    if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
      const { page, limit, offset } = getPaginationParams(req.query);
      const { sortBy, order } = getSortParams(req.query, 'nombre');
      const search = req.query.search || null;

      const categorias = await CategoriaModel.obtenerPadresConPaginacion(tenantId, {
        limit,
        offset,
        sortBy,
        order,
        search
      });
      const total = await CategoriaModel.contarPadres(tenantId, search);

      res.json(getPaginatedResponse(categorias, page, limit, total));
    } else {
      const categorias = await CategoriaModel.obtenerPadres(tenantId);

      res.json({
        success: true,
        data: categorias,
        total: categorias.length
      });
    }
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
    const categoria = await CategoriaModel.obtenerPorId(tenantId, id);

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
exports.obtenerHijas = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    const categoriaPadre = await CategoriaModel.obtenerPorId(tenantId, id);
    if (!categoriaPadre) {
      throw new AppError('Categoría padre no encontrada', 404);
    }

    const subcategorias = await CategoriaModel.obtenerHijas(tenantId, id);

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
exports.crear = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { nombre, emoji, padre_id } = req.body;

    logger.info('categoriaController.crear', 'Creando nueva categoría', { nombre });

    const nombreValidado = validateNombre(nombre, ENTIDADES.CATEGORIA);
    const emojiValidado = validateEmoji(emoji);

    if (padre_id) {
      const padreIdValidado = validateId(padre_id, 'padre_id');
      const categoriaPadre = await CategoriaModel.obtenerPorId(tenantId, padreIdValidado);
      if (!categoriaPadre) {
        throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO('Categoría padre'), 404);
      }
    }

    const resultado = await CategoriaModel.crear(tenantId, {
      nombre: nombreValidado,
      emoji: emojiValidado,
      padre_id: padre_id || null
    });

    const categoriaCreada = await CategoriaModel.obtenerPorId(tenantId, resultado.insertId);

    logger.info('categoriaController.crear', 'Categoría creada exitosamente', {
      id: resultado.insertId,
      nombre: nombreValidado
    });

    res.status(201).json({
      success: true,
      message: MENSAJES_EXITO.CREADO(ENTIDADES.CATEGORIA),
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
exports.actualizar = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { nombre, emoji, padre_id } = req.body;

    logger.info('categoriaController.actualizar', 'Actualizando categoría', { id });

    const categoriaExistente = await CategoriaModel.obtenerPorId(tenantId, id);
    if (!categoriaExistente) {
      throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.CATEGORIA), 404);
    }

    const nombreValidado = validateNombre(nombre, ENTIDADES.CATEGORIA);
    const emojiValidado = validateEmoji(emoji);

    if (padre_id && parseInt(padre_id) === parseInt(id)) {
      throw new AppError('Una categoría no puede ser su propia padre', 400);
    }

    if (padre_id) {
      const padreIdValidado = validateId(padre_id, 'padre_id');
      const categoriaPadre = await CategoriaModel.obtenerPorId(tenantId, padreIdValidado);
      if (!categoriaPadre) {
        throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO('Categoría padre'), 404);
      }
    }

    await CategoriaModel.actualizar(tenantId, id, {
      nombre: nombreValidado,
      emoji: emojiValidado,
      padre_id: padre_id || null
    });

    const categoriaActualizada = await CategoriaModel.obtenerPorId(tenantId, id);

    logger.info('categoriaController.actualizar', 'Categoría actualizada exitosamente', {
      id,
      nombre: nombreValidado
    });

    res.json({
      success: true,
      message: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.CATEGORIA),
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
exports.eliminar = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;

    logger.info('categoriaController.eliminar', 'Eliminando categoría', { id });

    const categoria = await CategoriaModel.obtenerPorId(tenantId, id);
    if (!categoria) {
      throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.CATEGORIA), 404);
    }

    const tieneSubcategorias = await CategoriaModel.tieneSubcategorias(tenantId, id);
    if (tieneSubcategorias) {
      throw new AppError(
        MENSAJES_ERROR.NO_SE_PUEDE_ELIMINAR_CON_HIJOS('una categoría'),
        400
      );
    }

    const tieneElementos = await CategoriaModel.tieneElementos(tenantId, id);
    logger.info('categoriaController.eliminar', 'Verificación de elementos', {
      id,
      tieneElementos,
      categoria_nombre: categoria.nombre
    });

    if (tieneElementos) {
      throw new AppError(
        'No se puede eliminar una categoría que tiene elementos asociados',
        400
      );
    }

    await CategoriaModel.eliminar(tenantId, id);

    logger.info('categoriaController.eliminar', 'Categoría eliminada exitosamente', {
      id,
      nombre: categoria.nombre
    });

    res.json({
      success: true,
      message: MENSAJES_EXITO.ELIMINADO(ENTIDADES.CATEGORIA)
    });
  } catch (error) {
    logger.error('categoriaController.eliminar', error);
    next(error);
  }
};
