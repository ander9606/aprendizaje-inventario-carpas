// ============================================
// CONTROLADOR: UBICACIONES
// Refactorizado: logger, validadores,
// constantes, paginación, next(error)
// ============================================

const UbicacionModel = require('../models/UbicacionModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { validateNombre, validateId, validateTipoUbicacion } = require('../../../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../../../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../../../utils/pagination');

// ============================================
// LISTAR UBICACIONES (con y sin paginación)
// ============================================

exports.obtenerTodas = async (req, res, next) => {
    try {
        const paginar = shouldPaginate(req.query) && (req.query.page || req.query.limit);

        if (paginar) {
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'nombre');
            const search = req.query.search || null;

            logger.debug('ubicacionController.obtenerTodas', 'Listando con paginación', {
                page, limit, offset, sortBy, order, search
            });

            const [ubicaciones, total] = await Promise.all([
                UbicacionModel.obtenerConPaginacion({ limit, offset, sortBy, order, search }),
                UbicacionModel.contarTodas(search)
            ]);

            return res.json(getPaginatedResponse(ubicaciones, page, limit, total));
        }

        const ubicaciones = await UbicacionModel.obtenerTodas();

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        logger.error('ubicacionController.obtenerTodas', error);
        next(error);
    }
};

// ============================================
// OBTENER SOLO UBICACIONES ACTIVAS
// ============================================

exports.obtenerActivas = async (req, res, next) => {
    try {
        const ubicaciones = await UbicacionModel.obtenerActivas();

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        logger.error('ubicacionController.obtenerActivas', error);
        next(error);
    }
};

// ============================================
// OBTENER UBICACIÓN PRINCIPAL
// ============================================

exports.obtenerPrincipal = async (req, res, next) => {
    try {
        const ubicacion = await UbicacionModel.obtenerPrincipal();

        if (!ubicacion) {
            throw new AppError('No hay ubicación principal configurada', 404);
        }

        res.json({
            success: true,
            data: ubicacion
        });
    } catch (error) {
        logger.error('ubicacionController.obtenerPrincipal', error);
        next(error);
    }
};

// ============================================
// OBTENER POR ID
// ============================================

exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de ubicación');

        const ubicacion = await UbicacionModel.obtenerPorId(id);

        if (!ubicacion) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UBICACION), 404);
        }

        res.json({ success: true, data: ubicacion });
    } catch (error) {
        logger.error('ubicacionController.obtenerPorId', error);
        next(error);
    }
};

// ============================================
// OBTENER POR TIPO
// ============================================

exports.obtenerPorTipo = async (req, res, next) => {
    try {
        const { tipo } = req.params;
        validateTipoUbicacion(tipo, true);

        const ubicaciones = await UbicacionModel.obtenerPorTipo(tipo);

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        logger.error('ubicacionController.obtenerPorTipo', error);
        next(error);
    }
};

// ============================================
// OBTENER UBICACIONES CON INVENTARIO
// ============================================

exports.obtenerConInventario = async (req, res, next) => {
    try {
        const ubicaciones = await UbicacionModel.obtenerConInventario();

        res.json({
            success: true,
            data: ubicaciones
        });
    } catch (error) {
        logger.error('ubicacionController.obtenerConInventario', error);
        next(error);
    }
};

// ============================================
// OBTENER DETALLE DE INVENTARIO DE UNA UBICACIÓN
// ============================================

exports.obtenerDetalleInventario = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de ubicación');

        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UBICACION), 404);
        }

        const detalle = await UbicacionModel.obtenerDetalleInventario(id);

        res.json({
            success: true,
            data: {
                ubicacion: {
                    id: ubicacion.id,
                    nombre: ubicacion.nombre,
                    tipo: ubicacion.tipo
                },
                inventario: detalle
            }
        });
    } catch (error) {
        logger.error('ubicacionController.obtenerDetalleInventario', error);
        next(error);
    }
};

// ============================================
// CREAR NUEVA UBICACIÓN
// ============================================

exports.crear = async (req, res, next) => {
    try {
        const body = req.body;
        logger.info('ubicacionController.crear', 'Creando ubicación', { nombre: body.nombre });

        validateNombre(body.nombre, ENTIDADES.UBICACION);

        if (body.tipo) {
            validateTipoUbicacion(body.tipo, false);
        }

        // Verificar duplicados
        const nombreExiste = await UbicacionModel.nombreExiste(body.nombre);
        if (nombreExiste) {
            throw new AppError('Ya existe una ubicación con ese nombre', 400);
        }

        const nuevoId = await UbicacionModel.crear(body);
        const ubicacion = await UbicacionModel.obtenerPorId(nuevoId);

        logger.info('ubicacionController.crear', 'Ubicación creada exitosamente', { id: nuevoId });

        res.status(201).json({
            success: true,
            mensaje: MENSAJES_EXITO.CREADO(ENTIDADES.UBICACION),
            data: ubicacion
        });
    } catch (error) {
        logger.error('ubicacionController.crear', error);
        next(error);
    }
};

// ============================================
// ACTUALIZAR UBICACIÓN
// ============================================

exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;

        logger.info('ubicacionController.actualizar', 'Actualizando ubicación', { id });

        validateId(id, 'ID de ubicación');

        const ubicacionExiste = await UbicacionModel.obtenerPorId(id);
        if (!ubicacionExiste) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UBICACION), 404);
        }

        if (body.nombre && body.nombre.trim() !== '') {
            validateNombre(body.nombre, ENTIDADES.UBICACION);

            const nombreExiste = await UbicacionModel.nombreExiste(body.nombre, id);
            if (nombreExiste) {
                throw new AppError('Ya existe otra ubicación con ese nombre', 400);
            }
        }

        if (body.tipo) {
            validateTipoUbicacion(body.tipo, false);
        }

        await UbicacionModel.actualizar(id, body);
        const ubicacionActualizada = await UbicacionModel.obtenerPorId(id);

        logger.info('ubicacionController.actualizar', 'Ubicación actualizada exitosamente', { id });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.UBICACION),
            data: ubicacionActualizada
        });
    } catch (error) {
        logger.error('ubicacionController.actualizar', error);
        next(error);
    }
};

// ============================================
// MARCAR COMO PRINCIPAL
// ============================================

exports.marcarComoPrincipal = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de ubicación');

        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UBICACION), 404);
        }

        if (!ubicacion.activo) {
            throw new AppError('No se puede marcar como principal una ubicación inactiva', 400);
        }

        await UbicacionModel.marcarComoPrincipal(id);
        const ubicacionActualizada = await UbicacionModel.obtenerPorId(id);

        res.json({
            success: true,
            mensaje: 'Ubicación marcada como principal exitosamente',
            data: ubicacionActualizada
        });
    } catch (error) {
        logger.error('ubicacionController.marcarComoPrincipal', error);
        next(error);
    }
};

// ============================================
// DESACTIVAR UBICACIÓN (Soft Delete)
// ============================================

exports.desactivar = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de ubicación');

        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UBICACION), 404);
        }

        await UbicacionModel.desactivar(id);

        res.json({
            success: true,
            mensaje: 'Ubicación desactivada exitosamente'
        });
    } catch (error) {
        logger.error('ubicacionController.desactivar', error);
        next(error);
    }
};

// ============================================
// ACTIVAR UBICACIÓN
// ============================================

exports.activar = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de ubicación');

        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UBICACION), 404);
        }

        await UbicacionModel.activar(id);

        res.json({
            success: true,
            mensaje: 'Ubicación activada exitosamente'
        });
    } catch (error) {
        logger.error('ubicacionController.activar', error);
        next(error);
    }
};

// ============================================
// ELIMINAR UBICACIÓN (Hard Delete)
// ============================================

exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de ubicación');

        const ubicacion = await UbicacionModel.obtenerPorId(id);
        if (!ubicacion) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UBICACION), 404);
        }

        await UbicacionModel.eliminar(id);

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ELIMINADO(ENTIDADES.UBICACION)
        });
    } catch (error) {
        logger.error('ubicacionController.eliminar', error);
        next(error);
    }
};
