// ============================================
// CONTROLADOR: MATERIALES
// Refactorizado: exports funcionales, logger,
// validadores, constantes, paginación
// ============================================

const MaterialModel = require('../models/MaterialModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { validateNombre, validateDescripcion, validateId } = require('../../../utils/validators');
const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../../../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../../../utils/pagination');

// ============================================
// LISTAR MATERIALES (con y sin paginación)
// ============================================

exports.obtenerTodos = async (req, res, next) => {
    try {
        const paginar = shouldPaginate(req.query) && (req.query.page || req.query.limit);

        if (paginar) {
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'nombre');
            const search = req.query.search || null;

            logger.debug('materialController.obtenerTodos', 'Listando con paginación', {
                page, limit, offset, sortBy, order, search
            });

            const [materiales, total] = await Promise.all([
                MaterialModel.obtenerConPaginacion({ limit, offset, sortBy, order, search }),
                MaterialModel.contarTodos(search)
            ]);

            return res.json(getPaginatedResponse(materiales, page, limit, total));
        }

        const materiales = await MaterialModel.obtenerTodos();

        res.json({
            success: true,
            data: materiales,
            total: materiales.length
        });
    } catch (error) {
        logger.error('materialController.obtenerTodos', error);
        next(error);
    }
};

// ============================================
// OBTENER POR ID
// ============================================

exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        validateId(id, 'ID de material');

        const material = await MaterialModel.obtenerPorId(id);

        if (!material) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.MATERIAL), 404);
        }

        res.json({ success: true, data: material });
    } catch (error) {
        logger.error('materialController.obtenerPorId', error);
        next(error);
    }
};

// ============================================
// CREAR MATERIAL
// ============================================

exports.crear = async (req, res, next) => {
    try {
        const body = req.body;
        logger.info('materialController.crear', 'Creando material', { nombre: body.nombre });

        const nombre = validateNombre(body.nombre, ENTIDADES.MATERIAL);
        const descripcion = validateDescripcion(body.descripcion);

        // Verificar duplicados
        const existente = await MaterialModel.obtenerPorNombre(nombre);
        if (existente) {
            throw new AppError('Ya existe un material con ese nombre', 400);
        }

        const nuevoId = await MaterialModel.crear({ nombre, descripcion });
        const material = await MaterialModel.obtenerPorId(nuevoId);

        logger.info('materialController.crear', 'Material creado exitosamente', { id: nuevoId });

        res.status(201).json({
            success: true,
            mensaje: MENSAJES_EXITO.CREADO(ENTIDADES.MATERIAL),
            data: material
        });
    } catch (error) {
        logger.error('materialController.crear', error);
        next(error);
    }
};

// ============================================
// ACTUALIZAR MATERIAL
// ============================================

exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;

        logger.info('materialController.actualizar', 'Actualizando material', { id });

        validateId(id, 'ID de material');

        const existe = await MaterialModel.obtenerPorId(id);
        if (!existe) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.MATERIAL), 404);
        }

        const nombre = body.nombre !== undefined
            ? validateNombre(body.nombre, ENTIDADES.MATERIAL)
            : existe.nombre;
        const descripcion = body.descripcion !== undefined
            ? validateDescripcion(body.descripcion)
            : existe.descripcion;

        // Verificar duplicados (excluyendo el actual)
        if (body.nombre !== undefined) {
            const duplicado = await MaterialModel.obtenerPorNombre(nombre);
            if (duplicado && duplicado.id != id) {
                throw new AppError('Ya existe otro material con ese nombre', 400);
            }
        }

        await MaterialModel.actualizar(id, { nombre, descripcion });
        const actualizado = await MaterialModel.obtenerPorId(id);

        logger.info('materialController.actualizar', 'Material actualizado exitosamente', { id });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.MATERIAL),
            data: actualizado
        });
    } catch (error) {
        logger.error('materialController.actualizar', error);
        next(error);
    }
};

// ============================================
// ELIMINAR MATERIAL
// ============================================

exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info('materialController.eliminar', 'Eliminando material', { id });

        validateId(id, 'ID de material');

        const existe = await MaterialModel.obtenerPorId(id);
        if (!existe) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.MATERIAL), 404);
        }

        await MaterialModel.eliminar(id);

        logger.info('materialController.eliminar', 'Material eliminado exitosamente', { id });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ELIMINADO(ENTIDADES.MATERIAL)
        });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return next(new AppError(
                MENSAJES_ERROR.NO_SE_PUEDE_ELIMINAR_CON_HIJOS(ENTIDADES.MATERIAL),
                400
            ));
        }
        logger.error('materialController.eliminar', error);
        next(error);
    }
};
