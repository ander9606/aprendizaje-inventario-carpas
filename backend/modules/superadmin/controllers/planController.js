const PlanModel = require('../models/PlanModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

/**
 * GET /api/superadmin/planes
 */
exports.obtenerTodos = async (req, res, next) => {
    try {
        const planes = await PlanModel.obtenerTodos();
        res.json({ success: true, data: planes, total: planes.length });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/superadmin/planes/:id
 */
exports.obtenerPorId = async (req, res, next) => {
    try {
        const plan = await PlanModel.obtenerPorId(req.params.id);
        if (!plan) {
            throw new AppError('Plan no encontrado', 404);
        }
        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/superadmin/planes
 */
exports.crear = async (req, res, next) => {
    try {
        const { nombre, slug, max_empleados, max_elementos, max_alquileres, max_cotizaciones, precio_mensual, features } = req.body;

        if (!nombre || !slug) {
            throw new AppError('Nombre y slug son requeridos', 400);
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            throw new AppError('Slug solo puede contener letras minúsculas, números y guiones', 400);
        }

        const existe = await PlanModel.slugExiste(slug);
        if (existe) {
            throw new AppError('Ya existe un plan con ese slug', 409);
        }

        const planId = await PlanModel.crear({ nombre, slug, max_empleados, max_elementos, max_alquileres, max_cotizaciones, precio_mensual, features });
        const plan = await PlanModel.obtenerPorId(planId);

        logger.info('[superadmin] Plan creado', { planId, slug, usuario: req.usuario.id });

        res.status(201).json({
            success: true,
            message: 'Plan creado exitosamente',
            data: plan
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/superadmin/planes/:id
 */
exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await PlanModel.obtenerPorId(id);

        if (!plan) {
            throw new AppError('Plan no encontrado', 404);
        }

        const { nombre, slug } = req.body;
        if (!nombre || !slug) {
            throw new AppError('Nombre y slug son requeridos', 400);
        }

        const slugDup = await PlanModel.slugExiste(slug, id);
        if (slugDup) {
            throw new AppError('Ya existe otro plan con ese slug', 409);
        }

        await PlanModel.actualizar(id, req.body);
        const updated = await PlanModel.obtenerPorId(id);

        logger.info('[superadmin] Plan actualizado', { planId: id, usuario: req.usuario.id });

        res.json({
            success: true,
            message: 'Plan actualizado exitosamente',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/superadmin/planes/:id
 */
exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await PlanModel.obtenerPorId(id);

        if (!plan) {
            throw new AppError('Plan no encontrado', 404);
        }

        const result = await PlanModel.eliminar(id);
        if (!result.deleted) {
            throw new AppError(`No se puede eliminar: ${result.tenantCount} tenants usan este plan`, 400);
        }

        logger.info('[superadmin] Plan eliminado', { planId: id, usuario: req.usuario.id });

        res.json({ success: true, message: 'Plan eliminado exitosamente' });
    } catch (error) {
        next(error);
    }
};
