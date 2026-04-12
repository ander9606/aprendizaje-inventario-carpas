// ============================================
// CONTROLADOR: Novedades en campo
// Reportes y resolución de novedades operativas
// ============================================

const NovedadModel = require('../models/NovedadModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { uploadOperacionImagen } = require('../../../middleware/upload');

/**
 * POST /api/operaciones/ordenes/:id/novedades
 * Crear novedad desde campo
 */
const crearNovedad = async (req, res, next) => {
    uploadOperacionImagen(req, res, async (err) => {
        try {
            if (err) {
                throw new AppError(err.message || 'Error al subir imagen', 400);
            }

            const tenantId = req.tenant.id;
            const { id } = req.params;
            const { tipo_novedad, descripcion, producto_id, elemento_orden_id, cantidad_afectada } = req.body;

            if (!tipo_novedad) {
                throw new AppError('El tipo de novedad es requerido', 400);
            }

            if (!descripcion || !descripcion.trim()) {
                throw new AppError('La descripción es requerida', 400);
            }

            const imagen_url = req.file
                ? `/uploads/operaciones/${req.file.filename}`
                : null;

            const novedad = await NovedadModel.crear(tenantId, {
                orden_id: parseInt(id),
                tipo_novedad,
                descripcion: descripcion.trim(),
                producto_id: producto_id ? parseInt(producto_id) : null,
                elemento_orden_id: elemento_orden_id ? parseInt(elemento_orden_id) : null,
                cantidad_afectada: cantidad_afectada ? parseInt(cantidad_afectada) : 1,
                imagen_url,
                reportada_por: req.usuario.id
            });

            logger.info('operaciones', `Novedad creada para orden ${id}: ${tipo_novedad} por ${req.usuario.email}`);

            res.status(201).json({
                success: true,
                message: 'Novedad reportada correctamente',
                data: novedad
            });
        } catch (error) {
            next(error);
        }
    });
};

/**
 * GET /api/operaciones/ordenes/:id/novedades
 * Obtener novedades de una orden
 */
const obtenerNovedadesOrden = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const novedades = await NovedadModel.obtenerPorOrden(tenantId, parseInt(id));

        res.json({
            success: true,
            data: novedades
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/novedades/:id/resolver
 * Resolver novedad (admin)
 */
const resolverNovedad = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { id } = req.params;
        const { resolucion } = req.body;

        if (!resolucion || !resolucion.trim()) {
            throw new AppError('La resolución es requerida', 400);
        }

        const novedad = await NovedadModel.resolver(tenantId, parseInt(id), {
            resolucion: resolucion.trim(),
            resuelta_por: req.usuario.id
        });

        if (!novedad) {
            throw new AppError('Novedad no encontrada', 404);
        }

        logger.info('operaciones', `Novedad ${id} resuelta por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Novedad resuelta correctamente',
            data: novedad
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/novedades/pendientes
 * Obtener novedades pendientes (dashboard admin)
 */
const obtenerNovedadesPendientes = async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const novedades = await NovedadModel.obtenerPendientes(tenantId);

        res.json({
            success: true,
            data: novedades
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    crearNovedad,
    obtenerNovedadesOrden,
    resolverNovedad,
    obtenerNovedadesPendientes
};
