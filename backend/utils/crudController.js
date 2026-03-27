// ============================================
// CRUD CONTROLLER FACTORY
// Generates standard CRUD handlers to reduce
// boilerplate across controllers.
// ============================================

const AppError = require('./AppError');
const logger = require('./logger');
const { validateId } = require('./validators');
const { MENSAJES_ERROR, MENSAJES_EXITO } = require('../config/constants');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('./pagination');

/**
 * Creates standard CRUD controller handlers.
 *
 * @param {Object} config
 * @param {Object} config.Model - The model class with static CRUD methods
 * @param {string} config.entityName - Entity name from ENTIDADES constant (e.g. 'Material')
 * @param {string} config.controllerName - Controller name for logging (e.g. 'materialController')
 * @param {string} [config.defaultSort='nombre'] - Default sort column
 * @param {Function} [config.validateBody] - Custom validation: (body, existing?) => cleanData
 * @param {Function} [config.checkDuplicate] - Custom duplicate check: (body, id?) => throws if duplicate
 * @returns {Object} Controller exports: { obtenerTodos, obtenerPorId, crear, actualizar, eliminar }
 */
function createCrudController(config) {
    const {
        Model,
        entityName,
        controllerName,
        defaultSort = 'nombre',
        validateBody,
        checkDuplicate
    } = config;

    const obtenerTodos = async (req, res, next) => {
        try {
            const paginar = shouldPaginate(req.query) && (req.query.page || req.query.limit);

            if (paginar) {
                const { page, limit, offset } = getPaginationParams(req.query);
                const { sortBy, order } = getSortParams(req.query, defaultSort);
                const search = req.query.search || null;

                logger.debug(`${controllerName}.obtenerTodos`, 'Listando con paginacion', {
                    page, limit, offset, sortBy, order, search
                });

                const obtenerFn = Model.obtenerConPaginacion || Model.obtenerTodas;
                const contarFn = Model.contarTodos || Model.contarTodas;

                const [data, total] = await Promise.all([
                    obtenerFn.call(Model, { limit, offset, sortBy, order, search }),
                    contarFn.call(Model, search)
                ]);

                return res.json(getPaginatedResponse(data, page, limit, total));
            }

            const obtenerAllFn = Model.obtenerTodos || Model.obtenerTodas;
            const data = await obtenerAllFn.call(Model);

            res.json({ success: true, data, total: data.length });
        } catch (error) {
            logger.error(`${controllerName}.obtenerTodos`, error);
            next(error);
        }
    };

    const obtenerPorId = async (req, res, next) => {
        try {
            const { id } = req.params;
            validateId(id, `ID de ${entityName}`);

            const data = await Model.obtenerPorId(id);
            if (!data) {
                throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(entityName), 404);
            }

            res.json({ success: true, data });
        } catch (error) {
            logger.error(`${controllerName}.obtenerPorId`, error);
            next(error);
        }
    };

    const crear = async (req, res, next) => {
        try {
            const body = req.body;
            logger.info(`${controllerName}.crear`, `Creando ${entityName}`, { nombre: body.nombre });

            const cleanData = validateBody ? validateBody(body) : body;

            if (checkDuplicate) {
                await checkDuplicate(cleanData);
            }

            const nuevoId = await Model.crear(cleanData);
            const data = await Model.obtenerPorId(nuevoId);

            logger.info(`${controllerName}.crear`, `${entityName} creado exitosamente`, { id: nuevoId });

            res.status(201).json({
                success: true,
                message: MENSAJES_EXITO.CREADO(entityName),
                data
            });
        } catch (error) {
            logger.error(`${controllerName}.crear`, error);
            next(error);
        }
    };

    const actualizar = async (req, res, next) => {
        try {
            const { id } = req.params;
            const body = req.body;

            logger.info(`${controllerName}.actualizar`, `Actualizando ${entityName}`, { id });
            validateId(id, `ID de ${entityName}`);

            const existe = await Model.obtenerPorId(id);
            if (!existe) {
                throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(entityName), 404);
            }

            const cleanData = validateBody ? validateBody(body, existe) : body;

            if (checkDuplicate) {
                await checkDuplicate(cleanData, id);
            }

            await Model.actualizar(id, cleanData);
            const data = await Model.obtenerPorId(id);

            logger.info(`${controllerName}.actualizar`, `${entityName} actualizado exitosamente`, { id });

            res.json({
                success: true,
                message: MENSAJES_EXITO.ACTUALIZADO(entityName),
                data
            });
        } catch (error) {
            logger.error(`${controllerName}.actualizar`, error);
            next(error);
        }
    };

    const eliminar = async (req, res, next) => {
        try {
            const { id } = req.params;

            logger.info(`${controllerName}.eliminar`, `Eliminando ${entityName}`, { id });
            validateId(id, `ID de ${entityName}`);

            const existe = await Model.obtenerPorId(id);
            if (!existe) {
                throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(entityName), 404);
            }

            await Model.eliminar(id);

            logger.info(`${controllerName}.eliminar`, `${entityName} eliminado exitosamente`, { id });

            res.json({
                success: true,
                message: MENSAJES_EXITO.ELIMINADO(entityName)
            });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return next(new AppError(
                    MENSAJES_ERROR.NO_SE_PUEDE_ELIMINAR_CON_HIJOS(entityName),
                    400
                ));
            }
            logger.error(`${controllerName}.eliminar`, error);
            next(error);
        }
    };

    return { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
}

module.exports = createCrudController;
