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
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../../../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../../../utils/pagination');

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

exports.obtenerTodas = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;

        if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'numero_serie');
            const search = req.query.search || null;

            logger.debug('serieController.obtenerTodas', 'Modo paginado', {
                page, limit, offset, sortBy, order, search
            });

            const series = await SerieModel.obtenerConPaginacion(tenantId, {
                limit,
                offset,
                sortBy,
                order,
                search
            });
            const total = await SerieModel.contarTodas(tenantId, search);

            res.json(getPaginatedResponse(series, page, limit, total));
        } else {
            const series = await SerieModel.obtenerTodas(tenantId);

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

exports.obtenerPorId = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const serie = await SerieModel.obtenerPorId(tenantId, id);

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

exports.obtenerPorNumeroSerie = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { numeroSerie } = req.params;
        const serie = await SerieModel.obtenerPorNumeroSerie(tenantId, numeroSerie);

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

exports.obtenerPorElemento = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elementoId } = req.params;

        validateId(elementoId, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        const series = await SerieModel.obtenerPorElemento(tenantId, elementoId);
        const stats = await SerieModel.contarPorElemento(tenantId, elementoId);

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

exports.obtenerPorEstado = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { estado } = req.params;

        const estadoValidado = validateEstado(estado, true);

        const series = await SerieModel.obtenerPorEstado(tenantId, estadoValidado);

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

exports.obtenerDisponibles = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const series = await SerieModel.obtenerDisponibles(tenantId);

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

exports.obtenerAlquiladas = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const series = await SerieModel.obtenerAlquiladas(tenantId);

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

exports.crear = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const {
            id_elemento,
            numero_serie,
            estado,
            ubicacion,
            ubicacion_id,
            fecha_ingreso
        } = req.body;

        logger.info('serieController.crear', 'Creando nueva serie', { numero_serie });

        const idElementoValidado = validateId(id_elemento, 'id_elemento');
        const numeroSerieValidado = validateNumeroSerie(numero_serie);
        const estadoValidado = estado ? validateEstado(estado, false) : 'bueno';

        const elemento = await ElementoModel.obtenerPorId(tenantId, idElementoValidado);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        if (!elemento.requiere_series) {
            throw new AppError('Este elemento no requiere números de serie', 400);
        }

        const serieExistente = await SerieModel.obtenerPorNumeroSerie(tenantId, numeroSerieValidado);
        if (serieExistente) {
            throw new AppError('Este número de serie ya existe', 400);
        }

        if (ubicacion_id) {
            validateId(ubicacion_id, 'ubicacion_id');
        }

        const nuevoId = await SerieModel.crear(tenantId, {
            id_elemento: idElementoValidado,
            numero_serie: numeroSerieValidado,
            estado: estadoValidado,
            ubicacion: ubicacion || null,
            ubicacion_id: ubicacion_id || null,
            fecha_ingreso: fecha_ingreso || null
        });

        const serieCreada = await SerieModel.obtenerPorId(tenantId, nuevoId);

        logger.info('serieController.crear', 'Serie creada exitosamente', {
            id: nuevoId,
            numero_serie: numeroSerieValidado
        });

        res.status(201).json({
            success: true,
            message: MENSAJES_EXITO.CREADO(ENTIDADES.SERIE),
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

exports.actualizar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const {
            numero_serie,
            estado,
            ubicacion,
            ubicacion_id,
            fecha_ingreso
        } = req.body;

        logger.info('serieController.actualizar', 'Actualizando serie', { id });

        const serieExistente = await SerieModel.obtenerPorId(tenantId, id);
        if (!serieExistente) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        const numeroSerieValidado = validateNumeroSerie(numero_serie);
        const estadoValidado = estado ? validateEstado(estado, false) : 'bueno';

        const serieConMismoNumero = await SerieModel.obtenerPorNumeroSerie(tenantId, numeroSerieValidado);
        if (serieConMismoNumero && serieConMismoNumero.id != id) {
            throw new AppError('Este número de serie ya está en uso', 400);
        }

        if (ubicacion_id) {
            validateId(ubicacion_id, 'ubicacion_id');
        }

        await SerieModel.actualizar(tenantId, id, {
            numero_serie: numeroSerieValidado,
            estado: estadoValidado,
            ubicacion: ubicacion || null,
            ubicacion_id: ubicacion_id || null,
            fecha_ingreso: fecha_ingreso || null
        });

        const serieActualizada = await SerieModel.obtenerPorId(tenantId, id);

        logger.info('serieController.actualizar', 'Serie actualizada exitosamente', {
            id,
            numero_serie: numeroSerieValidado
        });

        res.json({
            success: true,
            message: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.SERIE),
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

exports.cambiarEstado = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const { estado, ubicacion, ubicacion_id } = req.body;

        logger.info('serieController.cambiarEstado', 'Cambiando estado de serie', { id, estado });

        const serieExistente = await SerieModel.obtenerPorId(tenantId, id);
        if (!serieExistente) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        const estadoValidado = validateEstado(estado, true);

        if (ubicacion_id) {
            validateId(ubicacion_id, 'ubicacion_id');
        }

        await SerieModel.cambiarEstado(tenantId, id, estadoValidado, ubicacion, ubicacion_id);

        const serieActualizada = await SerieModel.obtenerPorId(tenantId, id);

        logger.info('serieController.cambiarEstado', 'Estado cambiado exitosamente', {
            id,
            estado_anterior: serieExistente.estado,
            estado_nuevo: estadoValidado
        });

        res.json({
            success: true,
            message: 'Estado cambiado exitosamente',
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

exports.eliminar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        logger.info('serieController.eliminar', 'Eliminando serie', { id });

        const serie = await SerieModel.obtenerPorId(tenantId, id);
        if (!serie) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        const filasAfectadas = await SerieModel.eliminar(tenantId, id);

        if (filasAfectadas === 0) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.SERIE), 404);
        }

        logger.info('serieController.eliminar', 'Serie eliminada exitosamente', {
            id,
            numero_serie: serie.numero_serie
        });

        res.json({
            success: true,
            message: MENSAJES_EXITO.ELIMINADO(ENTIDADES.SERIE)
        });
    } catch (error) {
        logger.error('serieController.eliminar', error);
        next(error);
    }
};

// ============================================
// OBTENER SIGUIENTE NÚMERO DE SERIE
// ============================================

exports.obtenerSiguienteNumero = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elementoId } = req.params;

        validateId(elementoId, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        if (!elemento.requiere_series) {
            throw new AppError('Este elemento no requiere números de serie', 400);
        }

        const numero = await SerieModel.obtenerSiguienteNumero(tenantId, elementoId);

        res.json({
            success: true,
            data: { numero }
        });
    } catch (error) {
        logger.error('serieController.obtenerSiguienteNumero', error);
        next(error);
    }
};

// ============================================
// OBTENER SERIES CON CONTEXTO DE ALQUILER
// ============================================

exports.obtenerPorElementoConContexto = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { elementoId } = req.params;

        validateId(elementoId, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        if (!elemento.requiere_series) {
            throw new AppError(
                'Este elemento no requiere series. Use el endpoint de lotes.',
                400
            );
        }

        const series = await SerieModel.obtenerPorElementoConContexto(tenantId, elementoId);
        const stats = await SerieModel.contarPorElemento(tenantId, elementoId);

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
// OBTENER SERIE POR ID CON CONTEXTO
// ============================================

exports.obtenerPorIdConContexto = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        const serie = await SerieModel.obtenerPorIdConContexto(tenantId, id);

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
