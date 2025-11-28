// ============================================
// CONTROLADOR: ELEMENTO
// Incluye paginación, validaciones y logging
// ============================================

const ElementoModel = require('../models/ElementoModel');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const {
    validateNombre,
    validateDescripcion,
    validateCantidad,
    validateBoolean,
    validateId,
    validateEstado,
    validateTerminoBusqueda
} = require('../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../utils/pagination');

/**
 * MEJORAS EN ESTA VERSIÓN:
 *
 * 1. Usa AppError para manejo centralizado de errores
 * 2. Usa validadores centralizados de utils/validators
 * 3. Usa constantes centralizadas de config/constants
 * 4. Logging estructurado con utils/logger
 * 5. Paginación opcional con infraestructura reutilizable
 * 6. Los errores se propagan al middleware global
 */

// ============================================
// OBTENER TODOS LOS ELEMENTOS
// ============================================

/**
 * GET /api/elementos
 *
 * Soporta paginación opcional:
 * - Sin params: Retorna todos los elementos
 * - Con ?page=1&limit=20: Retorna paginado
 * - Con ?search=carpa: Búsqueda por nombre
 * - Con ?sortBy=nombre&order=DESC: Ordenamiento
 * - Con ?paginate=false: Fuerza sin paginación
 */
exports.obtenerTodos = async (req, res, next) => {
    try {
        // Verificar si se debe paginar
        if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
            // MODO PAGINADO
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'nombre');
            const search = req.query.search || null;

            logger.debug('elementoController.obtenerTodos', 'Modo paginado', {
                page, limit, offset, sortBy, order, search
            });

            // Obtener datos y total
            const elementos = await ElementoModel.obtenerConPaginacion({
                limit,
                offset,
                sortBy,
                order,
                search
            });
            const total = await ElementoModel.contarTodos(search);

            // Retornar respuesta paginada
            res.json(getPaginatedResponse(elementos, page, limit, total));
        } else {
            // MODO SIN PAGINACIÓN (retrocompatible)
            const elementos = await ElementoModel.obtenerTodos();

            res.json({
                success: true,
                data: elementos,
                total: elementos.length
            });
        }
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER ELEMENTO POR ID
// ============================================

/**
 * GET /api/elementos/:id
 * Nota: El ID ya viene validado por el middleware validateId
 */
exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const elemento = await ElementoModel.obtenerPorId(id);

        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        res.json({
            success: true,
            data: elemento
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER ELEMENTOS POR CATEGORÍA/SUBCATEGORÍA
// ============================================

/**
 * GET /api/elementos/categoria/:categoriaId
 * GET /api/elementos/subcategoria/:subcategoriaId
 *
 * Nota: Ambas rutas apuntan aquí. En el sistema de 3 niveles,
 * lo que llamamos "categoría" es técnicamente una "subcategoría"
 */
exports.obtenerPorCategoria = async (req, res, next) => {
    try {
        // Aceptar ambos parámetros para flexibilidad
        const { categoriaId, subcategoriaId } = req.params;
        const id = categoriaId || subcategoriaId;

        // Validar ID
        validateId(id, 'ID de categoría/subcategoría');

        // Si viene de la ruta /subcategoria, devolver con info completa
        if (subcategoriaId) {
            const resultado = await ElementoModel.obtenerPorSubcategoriaConInfo(id);

            res.json({
                success: true,
                data: resultado.elementos,
                subcategoria: resultado.subcategoria,
                total: resultado.elementos.length
            });
        } else {
            // Ruta simple /categoria, solo elementos
            const elementos = await ElementoModel.obtenerPorCategoria(id);

            res.json({
                success: true,
                data: elementos,
                total: elementos.length
            });
        }
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER ELEMENTOS CON SERIES
// ============================================

/**
 * GET /api/elementos/con-series
 */
exports.obtenerConSeries = async (req, res, next) => {
    try {
        const elementos = await ElementoModel.obtenerConSeries();

        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER ELEMENTOS SIN SERIES
// ============================================

/**
 * GET /api/elementos/sin-series
 */
exports.obtenerSinSeries = async (req, res, next) => {
    try {
        const elementos = await ElementoModel.obtenerSinSeries();

        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// BUSCAR ELEMENTOS
// ============================================

/**
 * GET /api/elementos/buscar?q=termino
 */
exports.buscar = async (req, res, next) => {
    try {
        const { q } = req.query;

        // Validar término de búsqueda
        const termino = validateTerminoBusqueda(q);

        const elementos = await ElementoModel.buscarPorNombre(termino);

        res.json({
            success: true,
            data: elementos,
            total: elementos.length,
            termino
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// CREAR ELEMENTO
// ============================================

/**
 * POST /api/elementos
 *
 * Body:
 * {
 *   "nombre": "Carpa 4x4",
 *   "descripcion": "Carpa grande para eventos",  // opcional
 *   "cantidad": 10,
 *   "requiere_series": true,  // opcional
 *   "categoria_id": 1,  // opcional
 *   "material_id": 1,  // opcional
 *   "unidad_id": 1,  // opcional
 *   "estado": "bueno",  // opcional
 *   "ubicacion": "Bodega principal",  // opcional
 *   "fecha_ingreso": "2024-01-15"  // opcional
 * }
 */
exports.crear = async (req, res, next) => {
    try {
        const {
            nombre,
            descripcion,
            cantidad,
            requiere_series,
            categoria_id,
            estado,
            ubicacion,
            fecha_ingreso
        } = req.body;

        logger.info('elementoController.crear', 'Creando nuevo elemento', { nombre });

        // ============================================
        // VALIDACIONES
        // ============================================

        const nombreValidado = validateNombre(nombre, ENTIDADES.ELEMENTO);
        const descripcionValidada = validateDescripcion(descripcion);
        const cantidadValidada = validateCantidad(cantidad, 'Cantidad', false);
        const requiereSeriesValidado = validateBoolean(requiere_series, 'requiere_series', false);
        const estadoValidado = validateEstado(estado, false);

        // Validar IDs si existen
        if (categoria_id) validateId(categoria_id, 'categoria_id');

        // ============================================
        // CREAR ELEMENTO
        // ============================================

        const nuevoId = await ElementoModel.crear({
            nombre: nombreValidado,
            descripcion: descripcionValidada,
            cantidad: cantidadValidada,
            requiere_series: requiereSeriesValidado,
            categoria_id: categoria_id || null,
            estado: estadoValidado || 'bueno',
            ubicacion: ubicacion || null,
            fecha_ingreso: fecha_ingreso || null
        });

        // Obtener el elemento creado con todos sus datos
        const elementoCreado = await ElementoModel.obtenerPorId(nuevoId);

        logger.info('elementoController.crear', 'Elemento creado exitosamente', {
            id: nuevoId,
            nombre: nombreValidado
        });

        res.status(201).json({
            success: true,
            mensaje: MENSAJES_EXITO.CREADO(ENTIDADES.ELEMENTO),
            data: elementoCreado
        });
    } catch (error) {
        logger.error('elementoController.crear', error);
        next(error);
    }
};

// ============================================
// ACTUALIZAR ELEMENTO
// ============================================

/**
 * PUT /api/elementos/:id
 *
 * Body: Mismo que crear
 */
exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            cantidad,
            requiere_series,
            categoria_id,
            estado,
            ubicacion,
            fecha_ingreso
        } = req.body;

        logger.info('elementoController.actualizar', 'Actualizando elemento', { id });

        // ============================================
        // VALIDACIONES
        // ============================================

        // Verificar que el elemento existe
        const elementoExistente = await ElementoModel.obtenerPorId(id);
        if (!elementoExistente) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        const nombreValidado = validateNombre(nombre, ENTIDADES.ELEMENTO);
        const descripcionValidada = validateDescripcion(descripcion);
        const cantidadValidada = validateCantidad(cantidad, 'Cantidad', false);
        const requiereSeriesValidado = validateBoolean(requiere_series, 'requiere_series', false);
        const estadoValidado = validateEstado(estado, false);

        // Validar IDs si existen
        if (categoria_id) validateId(categoria_id, 'categoria_id');

        // ============================================
        // ACTUALIZAR ELEMENTO
        // ============================================

        await ElementoModel.actualizar(id, {
            nombre: nombreValidado,
            descripcion: descripcionValidada,
            cantidad: cantidadValidada,
            requiere_series: requiereSeriesValidado,
            categoria_id: categoria_id || null,
            estado: estadoValidado || 'bueno',
            ubicacion: ubicacion || null,
            fecha_ingreso: fecha_ingreso || null
        });

        // Obtener el elemento actualizado
        const elementoActualizado = await ElementoModel.obtenerPorId(id);

        logger.info('elementoController.actualizar', 'Elemento actualizado exitosamente', {
            id,
            nombre: nombreValidado
        });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.ELEMENTO),
            data: elementoActualizado
        });
    } catch (error) {
        logger.error('elementoController.actualizar', error);
        next(error);
    }
};

// ============================================
// ELIMINAR ELEMENTO
// ============================================

/**
 * DELETE /api/elementos/:id
 */
exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info('elementoController.eliminar', 'Eliminando elemento', { id });

        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(id);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // Eliminar elemento
        const filasAfectadas = await ElementoModel.eliminar(id);

        if (filasAfectadas === 0) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        logger.info('elementoController.eliminar', 'Elemento eliminado exitosamente', {
            id,
            nombre: elemento.nombre
        });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ELIMINADO(ENTIDADES.ELEMENTO)
        });
    } catch (error) {
        logger.error('elementoController.eliminar', error);
        next(error);
    }
};
