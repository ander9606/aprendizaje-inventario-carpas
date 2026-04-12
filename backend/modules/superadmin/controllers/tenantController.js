const TenantModel = require('../models/TenantModel');
const PagoModel = require('../models/PagoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { getPaginationParams, getPaginatedResponse } = require('../../../utils/pagination');

/**
 * GET /api/superadmin/tenants
 */
exports.obtenerTodos = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { search, estado, plan_id } = req.query;
        const filters = { search: search || '', estado: estado || '', planId: plan_id || '' };

        const [tenants, total] = await Promise.all([
            TenantModel.obtenerTodos({ limit, offset, ...filters }),
            TenantModel.contar(filters)
        ]);

        res.json(getPaginatedResponse(tenants, page, limit, total));
    } catch (error) {
        logger.error('[superadmin] Error obtenerTodos tenants:', error.message);
        next(error);
    }
};

/**
 * GET /api/superadmin/tenants/:id
 */
exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenant = await TenantModel.obtenerPorId(id);

        if (!tenant) {
            throw new AppError('Tenant no encontrado', 404);
        }

        const stats = await TenantModel.obtenerEstadisticas(id);

        res.json({
            success: true,
            data: { ...tenant, estadisticas: stats }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/superadmin/tenants/:id/empleados
 */
exports.obtenerEmpleados = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenant = await TenantModel.obtenerPorId(id);

        if (!tenant) {
            throw new AppError('Tenant no encontrado', 404);
        }

        const { limit, offset } = getPaginationParams(req.query);
        const empleados = await TenantModel.obtenerEmpleados(id, { limit, offset });

        res.json({ success: true, data: empleados });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/superadmin/tenants
 */
exports.crear = async (req, res, next) => {
    try {
        const { nombre, slug, email_contacto, telefono, nit, direccion, plan_id } = req.body;

        if (!nombre || !slug) {
            throw new AppError('Nombre y slug son requeridos', 400);
        }

        // Validar slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            throw new AppError('Slug solo puede contener letras minúsculas, números y guiones', 400);
        }

        // Slugs reservados
        if (['admin', 'api', 'www', 'app', 'superadmin'].includes(slug)) {
            throw new AppError('Slug reservado', 400);
        }

        const existe = await TenantModel.slugExiste(slug);
        if (existe) {
            throw new AppError('Ya existe un tenant con ese slug', 409);
        }

        const tenantId = await TenantModel.crear({ nombre, slug, email_contacto, telefono, nit, direccion, plan_id });
        const tenant = await TenantModel.obtenerPorId(tenantId);

        logger.info('[superadmin] Tenant creado', { tenantId, slug, usuario: req.usuario.id });

        res.status(201).json({
            success: true,
            message: 'Tenant creado exitosamente',
            data: tenant
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/superadmin/tenants/:id
 */
exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenant = await TenantModel.obtenerPorId(id);

        if (!tenant) {
            throw new AppError('Tenant no encontrado', 404);
        }

        const { nombre, email_contacto, telefono, nit, direccion, plan_id } = req.body;

        if (!nombre) {
            throw new AppError('Nombre es requerido', 400);
        }

        await TenantModel.actualizar(id, { nombre, email_contacto, telefono, nit, direccion, plan_id: plan_id || tenant.plan_id });
        const updated = await TenantModel.obtenerPorId(id);

        logger.info('[superadmin] Tenant actualizado', { tenantId: id, usuario: req.usuario.id });

        res.json({
            success: true,
            message: 'Tenant actualizado exitosamente',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/superadmin/tenants/:id/estado
 */
exports.cambiarEstado = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['activo', 'inactivo', 'suspendido'].includes(estado)) {
            throw new AppError('Estado inválido. Valores: activo, inactivo, suspendido', 400);
        }

        const tenant = await TenantModel.obtenerPorId(id);
        if (!tenant) {
            throw new AppError('Tenant no encontrado', 404);
        }

        if (id === '1' || parseInt(id) === 1) {
            throw new AppError('No se puede cambiar el estado del tenant principal', 400);
        }

        await TenantModel.cambiarEstado(id, estado);

        logger.info('[superadmin] Estado tenant cambiado', { tenantId: id, estado, usuario: req.usuario.id });

        res.json({
            success: true,
            message: `Tenant ${estado === 'activo' ? 'activado' : estado === 'suspendido' ? 'suspendido' : 'desactivado'} exitosamente`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/superadmin/tenants/:id/pagos
 */
exports.obtenerPagos = async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenant = await TenantModel.obtenerPorId(id);

        if (!tenant) {
            throw new AppError('Tenant no encontrado', 404);
        }

        const pagos = await PagoModel.obtenerPorTenant(id);
        res.json({ success: true, data: pagos });
    } catch (error) {
        next(error);
    }
};
