// ============================================
// CONTROLADOR: SERIE
// Incluye paginación, validaciones y logging
// ============================================

const SerieModel = require('../models/SerieModel');
const ElementoModel = require('../models/ElementoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const {
    validateRequired,
    validateId,
    validateEstado
} = require('../../../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES, ESTADOS_VALIDOS } = require('../../../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../../../utils/pagination');

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
// VALIDADOR ESPECÍFICO PARA NÚMERO DE SERIE
// ============================================

const validateNumeroSerie = (numeroSerie) => {
    validateRequired(numeroSerie, 'Número de serie');

    if (typeof numeroSerie !== 'string') {
        throw new AppError('Número de serie debe ser una cadena de texto', 400);
    }

    const trimmed = numeroSerie.trim();

    if (trimmed.length < 1) {
        throw new AppError('Número de serie no puede estar vacío', 400);
    }

    if (trimmed.length > 100) {
        throw new AppError('Número de serie debe tener máximo 100 caracteres', 400);
    }

    return trimmed;
};

// ============================================
// OBTENER TODAS LAS SERIES
// ============================================

/**
 * GET /api/series
 *
 * Soporta paginación opcional:
 * - Sin params: Retorna todas las series
 * - Con ?page=1&limit=20: Retorna paginado
 * - Con ?search=ABC123: Búsqueda por número de serie o elemento
 * - Con ?sortBy=numero_serie&order=DESC: Ordenamiento
 * - Con ?paginate=false: Fuerza sin paginación
 */
exports.obtenerTodas = async (req, res, next) => {
    try {
        // Verificar si se debe paginar
        if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
            // MODO PAGINADO
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'numero_serie');
            const search = req.query.search || null;

            logger.debug('serieController.obtenerTodas', 'Modo paginado', {
                page, limit, offset, sortBy, order, search
            });

            // Obtener datos y total
            const series = await SerieModel.obtenerConPaginacion({
                limit,
                offset,
                sortBy,
                order,
                search
            });
            const total = await SerieModel.contarTodas(search);

            // Retornar respuesta paginada
            res.json(getPaginatedResponse(series, page, limit, total));
        } else {
            // MODO SIN PAGINACIÓN (retrocompatible)
            const series = await SerieModel.obtenerTodas();

            res.json({
                success: true,
                data: series,
                total: series.length
            });
        }
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER SERIE POR ID
// ============================================

/**
 * GET /api/series/:id
 */
exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const serie = await SerieModel.obtenerPorId(id);

        if (!serie) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        res.json({
            success: true,
            data: serie
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER SERIE POR NÚMERO DE SERIE
// ============================================

/**
 * GET /api/series/numero/:numeroSerie
 */
exports.obtenerPorNumeroSerie = async (req, res, next) => {
    try {
        const { numeroSerie } = req.params;
        const serie = await SerieModel.obtenerPorNumeroSerie(numeroSerie);

        if (!serie) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        res.json({
            success: true,
            data: serie
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER SERIES DE UN ELEMENTO
// ============================================

/**
 * GET /api/series/elemento/:elementoId
 */
exports.obtenerPorElemento = async (req, res, next) => {
    try {
        const { elementoId } = req.params;

        // Validar elementoId
        validateId(elementoId, 'ID de elemento');

        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // Obtener series
        const series = await SerieModel.obtenerPorElemento(elementoId);

        // Obtener estadísticas
        const stats = await SerieModel.contarPorElemento(elementoId);

        res.json({
            success: true,
            elemento: {
                id: elemento.id,
                nombre: elemento.nombre
            },
            estadisticas: stats,
            data: series,
            total: series.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER SERIES POR ESTADO
// ============================================

/**
 * GET /api/series/estado/:estado
 */
exports.obtenerPorEstado = async (req, res, next) => {
    try {
        const { estado } = req.params;

        // Validar estado
        const estadoValidado = validateEstado(estado, true);

        const series = await SerieModel.obtenerPorEstado(estadoValidado);

        res.json({
            success: true,
            estado: estadoValidado,
            data: series,
            total: series.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER SERIES DISPONIBLES
// ============================================

/**
 * GET /api/series/disponibles
 */
exports.obtenerDisponibles = async (req, res, next) => {
    try {
        const series = await SerieModel.obtenerDisponibles();

        res.json({
            success: true,
            data: series,
            total: series.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER SERIES ALQUILADAS
// ============================================

/**
 * GET /api/series/alquiladas
 */
exports.obtenerAlquiladas = async (req, res, next) => {
    try {
        const series = await SerieModel.obtenerAlquiladas();

        res.json({
            success: true,
            data: series,
            total: series.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// CREAR SERIE
// ============================================

/**
 * POST /api/series
 *
 * Body:
 * {
 *   "id_elemento": 1,
 *   "numero_serie": "ABC-12345",
 *   "estado": "bueno",  // opcional
 *   "ubicacion": "Bodega A",  // opcional
 *   "ubicacion_id": 1,  // opcional
 *   "fecha_ingreso": "2024-01-15"  // opcional
 * }
 */
exports.crear = async (req, res, next) => {
    try {
        const {
            id_elemento,
            numero_serie,
            estado,
            ubicacion,
            ubicacion_id,
            fecha_ingreso
        } = req.body;

        logger.info('serieController.crear', 'Creando nueva serie', { numero_serie });

        // ============================================
        // VALIDACIONES
        // ============================================

        // Validar id_elemento
        const idElementoValidado = validateId(id_elemento, 'id_elemento');

        // Validar numero_serie
        const numeroSerieValidado = validateNumeroSerie(numero_serie);

        // Validar estado si existe
        const estadoValidado = estado ? validateEstado(estado, false) : 'bueno';

        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(idElementoValidado);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // Verificar que el elemento requiere series
        if (!elemento.requiere_series) {
            throw new AppError('Este elemento no requiere números de serie', 400);
        }

        // Verificar que el número de serie no exista
        const serieExistente = await SerieModel.obtenerPorNumeroSerie(numeroSerieValidado);
        if (serieExistente) {
            throw new AppError('Este número de serie ya existe', 400);
        }

        // Validar ubicacion_id si existe
        if (ubicacion_id) {
            validateId(ubicacion_id, 'ubicacion_id');
        }

        // ============================================
        // CREAR SERIE
        // ============================================

        const nuevoId = await SerieModel.crear({
            id_elemento: idElementoValidado,
            numero_serie: numeroSerieValidado,
            estado: estadoValidado,
            ubicacion: ubicacion || null,
            ubicacion_id: ubicacion_id || null,
            fecha_ingreso: fecha_ingreso || null
        });

        // Obtener la serie creada con todos sus datos
        const serieCreada = await SerieModel.obtenerPorId(nuevoId);

        logger.info('serieController.crear', 'Serie creada exitosamente', {
            id: nuevoId,
            numero_serie: numeroSerieValidado
        });

        res.status(201).json({
            success: true,
            mensaje: MENSAJES_EXITO.CREADO(ENTIDADES.SERIE),
            data: serieCreada
        });
    } catch (error) {
        logger.error('serieController.crear', error);
        next(error);
    }
};

// ============================================
// ACTUALIZAR SERIE
// ============================================

/**
 * PUT /api/series/:id
 *
 * Body: Similar a crear
 */
exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            numero_serie,
            estado,
            ubicacion,
            ubicacion_id,
            fecha_ingreso
        } = req.body;

        logger.info('serieController.actualizar', 'Actualizando serie', { id });

        // ============================================
        // VALIDACIONES
        // ============================================

        // Verificar que la serie existe
        const serieExistente = await SerieModel.obtenerPorId(id);
        if (!serieExistente) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        // Validar numero_serie
        const numeroSerieValidado = validateNumeroSerie(numero_serie);

        // Validar estado si existe
        const estadoValidado = estado ? validateEstado(estado, false) : 'bueno';

        // Verificar que el número de serie no esté en uso por otra serie
        const serieConMismoNumero = await SerieModel.obtenerPorNumeroSerie(numeroSerieValidado);
        if (serieConMismoNumero && serieConMismoNumero.id != id) {
            throw new AppError('Este número de serie ya está en uso', 400);
        }

        // Validar ubicacion_id si existe
        if (ubicacion_id) {
            validateId(ubicacion_id, 'ubicacion_id');
        }

        // ============================================
        // ACTUALIZAR SERIE
        // ============================================

        await SerieModel.actualizar(id, {
            numero_serie: numeroSerieValidado,
            estado: estadoValidado,
            ubicacion: ubicacion || null,
            ubicacion_id: ubicacion_id || null,
            fecha_ingreso: fecha_ingreso || null
        });

        // Obtener la serie actualizada
        const serieActualizada = await SerieModel.obtenerPorId(id);

        logger.info('serieController.actualizar', 'Serie actualizada exitosamente', {
            id,
            numero_serie: numeroSerieValidado
        });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.SERIE),
            data: serieActualizada
        });
    } catch (error) {
        logger.error('serieController.actualizar', error);
        next(error);
    }
};

// ============================================
// CAMBIAR ESTADO DE SERIE
// ============================================

/**
 * PATCH /api/series/:id/estado
 *
 * Body:
 * {
 *   "estado": "alquilado",
 *   "ubicacion": "Evento XYZ",  // opcional
 *   "ubicacion_id": 5  // opcional
 * }
 */
exports.cambiarEstado = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado, ubicacion, ubicacion_id } = req.body;

        logger.info('serieController.cambiarEstado', 'Cambiando estado de serie', { id, estado });

        // ============================================
        // VALIDACIONES
        // ============================================

        // Verificar que la serie existe
        const serieExistente = await SerieModel.obtenerPorId(id);
        if (!serieExistente) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        // Validar estado
        const estadoValidado = validateEstado(estado, true);

        // Validar ubicacion_id si existe
        if (ubicacion_id) {
            validateId(ubicacion_id, 'ubicacion_id');
        }

        // ============================================
        // CAMBIAR ESTADO
        // ============================================

        await SerieModel.cambiarEstado(id, estadoValidado, ubicacion, ubicacion_id);

        // Obtener la serie actualizada
        const serieActualizada = await SerieModel.obtenerPorId(id);

        logger.info('serieController.cambiarEstado', 'Estado cambiado exitosamente', {
            id,
            estado_anterior: serieExistente.estado,
            estado_nuevo: estadoValidado
        });

        res.json({
            success: true,
            mensaje: 'Estado cambiado exitosamente',
            data: serieActualizada
        });
    } catch (error) {
        logger.error('serieController.cambiarEstado', error);
        next(error);
    }
};

// ============================================
// ELIMINAR SERIE
// ============================================

/**
 * DELETE /api/series/:id
 */
exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info('serieController.eliminar', 'Eliminando serie', { id });

        // Verificar que la serie existe
        const serie = await SerieModel.obtenerPorId(id);
        if (!serie) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        // Eliminar serie
        const filasAfectadas = await SerieModel.eliminar(id);

        if (filasAfectadas === 0) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        logger.info('serieController.eliminar', 'Serie eliminada exitosamente', {
            id,
            numero_serie: serie.numero_serie
        });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ELIMINADO(ENTIDADES.SERIE)
        });
    } catch (error) {
        logger.error('serieController.eliminar', error);
        next(error);
    }
};

// ============================================
// OBTENER SERIES CON CONTEXTO DE ALQUILER ✨ NUEVO
// ============================================

/**
 * GET /api/series/elemento/:elementoId/contexto
 *
 * Retorna las series de un elemento CON información de:
 * - Evento actual (si está alquilado)
 * - Próximo evento (si tiene reserva futura)
 * - Estado operativo detallado
 */
exports.obtenerPorElementoConContexto = async (req, res, next) => {
    try {
        const { elementoId } = req.params;

        // Validar elementoId
        validateId(elementoId, 'ID de elemento');

        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // Verificar que requiere series
        if (!elemento.requiere_series) {
            throw new AppError(
                'Este elemento no requiere series. Use el endpoint de lotes.',
                400
            );
        }

        // Obtener series con contexto
        const series = await SerieModel.obtenerPorElementoConContexto(elementoId);

        // Obtener estadísticas
        const stats = await SerieModel.contarPorElemento(elementoId);

        // Calcular resumen de estados
        const resumen = {
            total: series.length,
            disponibles: series.filter(s => s.estado === 'bueno' && !s.en_alquiler).length,
            en_evento: series.filter(s => s.en_alquiler).length,
            reservadas: series.filter(s => !s.en_alquiler && s.proximo_evento).length,
            mantenimiento: series.filter(s => s.estado === 'mantenimiento').length,
            danadas: series.filter(s => s.estado === 'dañado').length
        };

        res.json({
            success: true,
            elemento: {
                id: elemento.id,
                nombre: elemento.nombre
            },
            estadisticas: stats,
            resumen,
            data: series,
            total: series.length
        });
    } catch (error) {
        logger.error('serieController.obtenerPorElementoConContexto', error);
        next(error);
    }
};

// ============================================
// OBTENER SERIE POR ID CON CONTEXTO ✨ NUEVO
// ============================================

/**
 * GET /api/series/:id/contexto
 *
 * Retorna una serie específica CON:
 * - Información del evento actual
 * - Próximo evento
 * - Historial de alquileres
 */
exports.obtenerPorIdConContexto = async (req, res, next) => {
    try {
        const { id } = req.params;

        const serie = await SerieModel.obtenerPorIdConContexto(id);

        if (!serie) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        res.json({
            success: true,
            data: serie
        });
    } catch (error) {
        logger.error('serieController.obtenerPorIdConContexto', error);
        next(error);
    }
};
