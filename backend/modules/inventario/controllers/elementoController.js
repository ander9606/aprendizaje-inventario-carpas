// ============================================
// CONTROLADOR: ELEMENTO (VERSIÓN CORREGIDA)
// Optimizado, limpio y con mejores prácticas
// ============================================

const ElementoModel = require('../models/ElementoModel');
const LoteModel = require('../models/LoteModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { deleteImageFile } = require('../../../middleware/upload');

const {
    validateNombre,
    validateDescripcion,
    validateCantidad,
    validatePrecio,
    validateBoolean,
    validateId,
    validateEstado,
    validateTerminoBusqueda
} = require('../../../utils/validators');

const { MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../../../config/constants');

const {
    getPaginationParams,
    getPaginatedResponse,
    shouldPaginate,
    getSortParams
} = require('../../../utils/pagination');

// ============================================
// LISTAR ELEMENTOS (con y sin paginación)
// ============================================

exports.obtenerTodos = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const paginar = shouldPaginate(req.query) && (req.query.page || req.query.limit);

        if (paginar) {
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'nombre');
            const search = req.query.search || null;

            logger.debug('elementoController.obtenerTodos', 'Listando con paginación', {
                page, limit, offset, sortBy, order, search
            });

            const [elementos, total] = await Promise.all([
                ElementoModel.obtenerConPaginacion(tenantId, { limit, offset, sortBy, order, search }),
                ElementoModel.contarTodos(tenantId, search)
            ]);

            return res.json(getPaginatedResponse(elementos, page, limit, total));
        }

        // MODO SIN PAGINACIÓN
        const elementos = await ElementoModel.obtenerTodos(tenantId);

        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });

    } catch (error) {
        logger.error('elementoController.obtenerTodos', error);
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

        // Validar ID
        validateId(id, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, id);

        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        res.json({ success: true, data: elemento });

    } catch (error) {
        logger.error('elementoController.obtenerPorId', error);
        next(error);
    }
};

// ============================================
// OBTENER POR CATEGORÍA / SUBCATEGORÍA
// ============================================

exports.obtenerPorCategoria = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { categoriaId, subcategoriaId } = req.params;
        const id = subcategoriaId || categoriaId;

        if (!id) {
            throw new AppError('Se requiere categoriaId o subcategoriaId', 400);
        }

        validateId(id, 'ID de categoría/subcategoría');

        // Si es subcategoría, obtener con información adicional
        if (subcategoriaId) {
            const resultado = await ElementoModel.obtenerPorSubcategoriaConInfo(tenantId, id);

            return res.json({
                success: true,
                data: resultado.elementos,
                subcategoria: resultado.subcategoria,
                total: resultado.elementos.length
            });
        }

        // Si es categoría padre, incluir elementos de subcategorías
        const elementos = await ElementoModel.obtenerPorCategoria(tenantId, id);

        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });

    } catch (error) {
        logger.error('elementoController.obtenerPorCategoria', error);
        next(error);
    }
};

// ============================================
// OBTENER ELEMENTOS DIRECTOS DE UNA CATEGORÍA
// (Sin incluir subcategorías)
// ============================================

exports.obtenerDirectosPorCategoria = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { categoriaId } = req.params;

        validateId(categoriaId, 'ID de categoría');

        const elementos = await ElementoModel.obtenerDirectosPorCategoria(tenantId, categoriaId);

        res.json({
            success: true,
            data: elementos,
            total: elementos.length
        });

    } catch (error) {
        logger.error('elementoController.obtenerDirectosPorCategoria', error);
        next(error);
    }
};

// ============================================
// ELEMENTOS CON SERIES
// ============================================

exports.obtenerConSeries = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const elementos = await ElementoModel.obtenerConSeries(tenantId);
        res.json({ success: true, data: elementos, total: elementos.length });

    } catch (error) {
        logger.error('elementoController.obtenerConSeries', error);
        next(error);
    }
};

// ============================================
// ELEMENTOS SIN SERIES
// ============================================

exports.obtenerSinSeries = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const elementos = await ElementoModel.obtenerSinSeries(tenantId);
        res.json({ success: true, data: elementos, total: elementos.length });

    } catch (error) {
        logger.error('elementoController.obtenerSinSeries', error);
        next(error);
    }
};

// ============================================
// BUSCAR ELEMENTOS
// ============================================

exports.buscar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const termino = validateTerminoBusqueda(req.query.q);
        const elementos = await ElementoModel.buscarPorNombre(tenantId, termino);

        res.json({
            success: true,
            termino,
            data: elementos,
            total: elementos.length
        });

    } catch (error) {
        logger.error('elementoController.buscar', error);
        next(error);
    }
};

// ============================================
// CREAR ELEMENTO
// ============================================

exports.crear = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const body = req.body;
        logger.info('elementoController.crear', 'Creando elemento', { nombre: body.nombre });

        // VALIDACIONES
        const data = {
            nombre: validateNombre(body.nombre, ENTIDADES.ELEMENTO),
            descripcion: validateDescripcion(body.descripcion),
            cantidad: validateCantidad(body.cantidad, 'Cantidad', false),
            stock_minimo: body.stock_minimo !== undefined && body.stock_minimo !== null
                ? validateCantidad(body.stock_minimo, 'Stock mínimo', false)
                : 0,
            costo_adquisicion: body.costo_adquisicion !== undefined && body.costo_adquisicion !== null && body.costo_adquisicion !== ''
                ? validatePrecio(body.costo_adquisicion, 'Costo de adquisición', false)
                : null,
            precio_unitario: body.precio_unitario !== undefined && body.precio_unitario !== null && body.precio_unitario !== ''
                ? validatePrecio(body.precio_unitario, 'Precio unitario', false)
                : null,
            requiere_series: validateBoolean(body.requiere_series, 'requiere_series', false),
            estado: validateEstado(body.estado, false) || 'bueno',
            ubicacion: body.ubicacion?.trim() || null,
            fecha_ingreso: body.fecha_ingreso || null,
            categoria_id: body.categoria_id ? validateId(body.categoria_id, 'categoria_id') : null,
            material_id: body.material_id ? validateId(body.material_id, 'material_id') : null,
            unidad_id: body.unidad_id ? validateId(body.unidad_id, 'unidad_id') : null
        };

        const nuevoId = await ElementoModel.crear(tenantId, data);

        // ============================================
        // CREAR LOTE INICIAL (si es gestión por lotes)
        // ============================================
        if (!data.requiere_series) {
            const cantidadInicial = validateCantidad(body.cantidad_inicial, 'Cantidad inicial', false) || 0;
            const estadoInicial = validateEstado(body.estado_inicial, false) || 'bueno';
            const ubicacionInicial = body.ubicacion_inicial?.trim() || null;

            if (cantidadInicial > 0) {
                logger.info('elementoController.crear', 'Creando lote inicial automáticamente', {
                    elementoId: nuevoId,
                    cantidad: cantidadInicial,
                    estado: estadoInicial,
                    ubicacion: ubicacionInicial
                });

                await LoteModel.crear(tenantId, {
                    elemento_id: nuevoId,
                    lote_numero: `LOTE-${nuevoId}-001`,
                    cantidad: cantidadInicial,
                    estado: estadoInicial,
                    ubicacion: ubicacionInicial
                });

                logger.info('elementoController.crear', 'Lote inicial creado exitosamente');
            }
        }

        const elementoCreado = await ElementoModel.obtenerPorId(tenantId, nuevoId);

        logger.info('elementoController.crear', 'Elemento creado exitosamente', {
            id: nuevoId,
            nombre: data.nombre
        });

        res.status(201).json({
            success: true,
            message: MENSAJES_EXITO.CREADO(ENTIDADES.ELEMENTO),
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

exports.actualizar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const body = req.body;

        logger.info('elementoController.actualizar', 'Actualizando elemento', { id });

        // Validar ID
        validateId(id, 'ID de elemento');

        const existente = await ElementoModel.obtenerPorId(tenantId, id);
        if (!existente) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // VALIDACIONES - Usar valores existentes como fallback si no se envían
        const data = {
            nombre: body.nombre !== undefined
                ? validateNombre(body.nombre, ENTIDADES.ELEMENTO)
                : existente.nombre,
            descripcion: body.descripcion !== undefined
                ? validateDescripcion(body.descripcion)
                : existente.descripcion,
            cantidad: body.cantidad !== undefined
                ? validateCantidad(body.cantidad, 'Cantidad', false)
                : existente.cantidad,
            stock_minimo: body.stock_minimo !== undefined
                ? validateCantidad(body.stock_minimo, 'Stock mínimo', false)
                : existente.stock_minimo,
            costo_adquisicion: body.costo_adquisicion !== undefined
                ? (body.costo_adquisicion !== null && body.costo_adquisicion !== ''
                    ? validatePrecio(body.costo_adquisicion, 'Costo de adquisición', false)
                    : null)
                : existente.costo_adquisicion,
            precio_unitario: body.precio_unitario !== undefined
                ? (body.precio_unitario !== null && body.precio_unitario !== ''
                    ? validatePrecio(body.precio_unitario, 'Precio unitario', false)
                    : null)
                : existente.precio_unitario,
            requiere_series: body.requiere_series !== undefined
                ? validateBoolean(body.requiere_series, 'requiere_series', false)
                : existente.requiere_series,
            estado: body.estado !== undefined
                ? (validateEstado(body.estado, false) || 'bueno')
                : existente.estado,
            ubicacion: body.ubicacion !== undefined
                ? (body.ubicacion?.trim() || null)
                : existente.ubicacion,
            fecha_ingreso: body.fecha_ingreso !== undefined
                ? body.fecha_ingreso
                : existente.fecha_ingreso,
            categoria_id: body.categoria_id !== undefined
                ? (body.categoria_id ? validateId(body.categoria_id, 'categoria_id') : null)
                : existente.categoria_id,
            material_id: body.material_id !== undefined
                ? (body.material_id ? validateId(body.material_id, 'material_id') : null)
                : existente.material_id,
            unidad_id: body.unidad_id !== undefined
                ? (body.unidad_id ? validateId(body.unidad_id, 'unidad_id') : null)
                : existente.unidad_id
        };

        await ElementoModel.actualizar(tenantId, id, data);
        const actualizado = await ElementoModel.obtenerPorId(tenantId, id);

        logger.info('elementoController.actualizar', 'Elemento actualizado exitosamente', {
            id,
            nombre: data.nombre
        });

        res.json({
            success: true,
            message: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.ELEMENTO),
            data: actualizado
        });

    } catch (error) {
        logger.error('elementoController.actualizar', error);
        next(error);
    }
};

// ============================================
// ELIMINAR ELEMENTO
// ============================================

exports.eliminar = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;

        logger.info('elementoController.eliminar', 'Eliminando elemento', { id });

        // Validar ID
        validateId(id, 'ID de elemento');

        const existente = await ElementoModel.obtenerPorId(tenantId, id);
        if (!existente) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        const filas = await ElementoModel.eliminar(tenantId, id);
        if (filas === 0) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        logger.info('elementoController.eliminar', 'Elemento eliminado exitosamente', {
            id,
            nombre: existente.nombre
        });

        res.json({
            success: true,
            message: MENSAJES_EXITO.ELIMINADO(ENTIDADES.ELEMENTO)
        });

    } catch (error) {
        logger.error('elementoController.eliminar', error);
        next(error);
    }
};

// ============================================
// ALERTAS DE STOCK BAJO
// ============================================

exports.obtenerAlertasStock = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const alertas = await ElementoModel.obtenerConStockBajo(tenantId);

        res.json({
            success: true,
            data: alertas,
            total: alertas.length
        });

    } catch (error) {
        logger.error('elementoController.obtenerAlertasStock', error);
        next(error);
    }
};

// ============================================
// ESTADISTICAS DE INVENTARIO (Dashboard)
// ============================================

exports.obtenerEstadisticasInventario = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const [generales, distribucionEstado, topCategorias, distribucionUbicacion, alertasStock] = await Promise.all([
            ElementoModel.obtenerEstadisticasGenerales(tenantId),
            ElementoModel.obtenerDistribucionPorEstado(tenantId),
            ElementoModel.obtenerTopCategorias(tenantId, 10),
            ElementoModel.obtenerDistribucionPorUbicacion(tenantId),
            ElementoModel.obtenerConStockBajo(tenantId)
        ]);

        res.json({
            success: true,
            data: {
                generales,
                distribucionEstado,
                topCategorias,
                distribucionUbicacion,
                alertasStock
            }
        });

    } catch (error) {
        logger.error('elementoController.obtenerEstadisticasInventario', error);
        next(error);
    }
};

// ============================================
// SUBIR IMAGEN DE ELEMENTO
// ============================================

exports.subirImagen = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        validateId(id, 'ID de elemento');

        if (!req.file) {
            throw new AppError('No se recibió ningún archivo', 400);
        }

        const elemento = await ElementoModel.obtenerPorId(tenantId, id);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // Eliminar imagen anterior si existe
        if (elemento.imagen) {
            deleteImageFile(elemento.imagen);
        }

        const imagenUrl = `/uploads/elementos/${req.file.filename}`;
        await ElementoModel.actualizarImagen(tenantId, id, imagenUrl);

        logger.info('elementoController.subirImagen', 'Imagen subida', { id, imagenUrl });

        res.json({
            success: true,
            message: 'Imagen subida correctamente',
            data: { imagen: imagenUrl }
        });
    } catch (error) {
        logger.error('elementoController.subirImagen', error);
        next(error);
    }
};

// ============================================
// ELIMINAR IMAGEN DE ELEMENTO
// ============================================

exports.eliminarImagen = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        validateId(id, 'ID de elemento');

        const elemento = await ElementoModel.obtenerPorId(tenantId, id);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        if (elemento.imagen) {
            deleteImageFile(elemento.imagen);
        }

        await ElementoModel.actualizarImagen(tenantId, id, null);

        logger.info('elementoController.eliminarImagen', 'Imagen eliminada', { id });

        res.json({
            success: true,
            message: 'Imagen eliminada correctamente'
        });
    } catch (error) {
        logger.error('elementoController.eliminarImagen', error);
        next(error);
    }
};
