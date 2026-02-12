// ============================================
// CONTROLADOR: UNIDADES
// Refactorizado: logger, validadores,
// constantes, paginación, next(error)
// ============================================

const UnidadModel = require('../models/UnidadModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { validateNombre, validateId, validateTipoUnidad } = require('../../../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../../../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../../../utils/pagination');

// ============================================
// LISTAR UNIDADES (con y sin paginación)
// ============================================

exports.obtenerTodas = async (req, res, next) => {
    try {
        const paginar = shouldPaginate(req.query) && (req.query.page || req.query.limit);

        if (paginar) {
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'nombre');
            const search = req.query.search || null;

            logger.debug('unidadController.obtenerTodas', 'Listando con paginación', {
                page, limit, offset, sortBy, order, search
            });

            const [unidades, total] = await Promise.all([
                UnidadModel.obtenerConPaginacion({ limit, offset, sortBy, order, search }),
                UnidadModel.contarTodas(search)
            ]);

            return res.json(getPaginatedResponse(unidades, page, limit, total));
        }

        const unidades = await UnidadModel.obtenerTodas();

        res.json({
            success: true,
            data: unidades,
            total: unidades.length
        });
    } catch (error) {
        logger.error('unidadController.obtenerTodas', error);
        next(error);
    }
};

// ============================================
// OBTENER POR ID
// ============================================

exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de unidad');

        const unidad = await UnidadModel.obtenerPorId(id);

        if (!unidad) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UNIDAD), 404);
        }

        res.json({ success: true, data: unidad });
    } catch (error) {
        logger.error('unidadController.obtenerPorId', error);
        next(error);
    }
};

// ============================================
// OBTENER POR TIPO
// ============================================

exports.obtenerPorTipo = async (req, res, next) => {
    try {
        const { tipo } = req.params;
        validateTipoUnidad(tipo, true);

        const unidades = await UnidadModel.obtenerPorTipo(tipo);

        res.json({
            success: true,
            tipo,
            data: unidades,
            total: unidades.length
        });
    } catch (error) {
        logger.error('unidadController.obtenerPorTipo', error);
        next(error);
    }
};

// ============================================
// OBTENER MÁS USADAS
// ============================================

exports.obtenerMasUsadas = async (req, res, next) => {
    try {
        const unidades = await UnidadModel.obtenerMasUsadas();

        res.json({
            success: true,
            data: unidades,
            total: unidades.length
        });
    } catch (error) {
        logger.error('unidadController.obtenerMasUsadas', error);
        next(error);
    }
};

// ============================================
// CREAR UNIDAD
// ============================================

exports.crear = async (req, res, next) => {
    try {
        const { nombre, abreviatura, tipo } = req.body;
        logger.info('unidadController.crear', 'Creando unidad', { nombre });

        validateNombre(nombre, ENTIDADES.UNIDAD);

        if (tipo) {
            validateTipoUnidad(tipo, false);
        }

        // Verificar duplicados
        const existente = await UnidadModel.obtenerPorNombre(nombre);
        if (existente) {
            throw new AppError('Ya existe una unidad con ese nombre', 400);
        }

        const nuevoId = await UnidadModel.crear({ nombre, abreviatura, tipo });
        const nuevaUnidad = await UnidadModel.obtenerPorId(nuevoId);

        logger.info('unidadController.crear', 'Unidad creada exitosamente', { id: nuevoId });

        res.status(201).json({
            success: true,
            mensaje: MENSAJES_EXITO.CREADO(ENTIDADES.UNIDAD),
            data: nuevaUnidad
        });
    } catch (error) {
        logger.error('unidadController.crear', error);
        next(error);
    }
};

// ============================================
// ACTUALIZAR UNIDAD
// ============================================

exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, abreviatura, tipo } = req.body;

        logger.info('unidadController.actualizar', 'Actualizando unidad', { id });

        validateId(id, 'ID de unidad');
        validateNombre(nombre, ENTIDADES.UNIDAD);

        if (tipo) {
            validateTipoUnidad(tipo, false);
        }

        // Verificar duplicados (excluyendo la actual)
        const existente = await UnidadModel.obtenerPorNombre(nombre);
        if (existente && existente.id != id) {
            throw new AppError('Ya existe otra unidad con ese nombre', 400);
        }

        const filasAfectadas = await UnidadModel.actualizar(id, { nombre, abreviatura, tipo });

        if (filasAfectadas === 0) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UNIDAD), 404);
        }

        const unidadActualizada = await UnidadModel.obtenerPorId(id);

        logger.info('unidadController.actualizar', 'Unidad actualizada exitosamente', { id });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.UNIDAD),
            data: unidadActualizada
        });
    } catch (error) {
        logger.error('unidadController.actualizar', error);
        next(error);
    }
};

// ============================================
// ELIMINAR UNIDAD
// ============================================

exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info('unidadController.eliminar', 'Eliminando unidad', { id });

        validateId(id, 'ID de unidad');

        const existe = await UnidadModel.obtenerPorId(id);
        if (!existe) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.UNIDAD), 404);
        }

        await UnidadModel.eliminar(id);

        logger.info('unidadController.eliminar', 'Unidad eliminada exitosamente', { id });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ELIMINADO(ENTIDADES.UNIDAD)
        });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return next(new AppError(
                'No se puede eliminar la unidad porque está en uso por elementos',
                400
            ));
        }
        logger.error('unidadController.eliminar', error);
        next(error);
    }
};
