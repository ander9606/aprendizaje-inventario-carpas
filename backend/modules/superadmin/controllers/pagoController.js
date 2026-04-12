const PagoModel = require('../models/PagoModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { getPaginationParams, getPaginatedResponse } = require('../../../utils/pagination');

/**
 * GET /api/superadmin/pagos
 */
exports.obtenerTodos = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPaginationParams(req.query);
        const { pagado, mes, tenant_id } = req.query;
        const filters = { pagado: pagado !== undefined ? pagado : '', mes: mes || '', tenantId: tenant_id || '' };

        const [pagos, total] = await Promise.all([
            PagoModel.obtenerTodos({ limit, offset, ...filters }),
            PagoModel.contar(filters)
        ]);

        res.json(getPaginatedResponse(pagos, page, limit, total));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/superadmin/pagos/resumen
 */
exports.obtenerResumen = async (req, res, next) => {
    try {
        const { mes } = req.query;
        const resumen = await PagoModel.obtenerResumen(mes || null);
        res.json({ success: true, data: resumen });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/superadmin/pagos/:id
 */
exports.marcarPago = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pago = await PagoModel.obtenerPorId(id);

        if (!pago) {
            throw new AppError('Registro de pago no encontrado', 404);
        }

        const { pagado, fecha_pago, metodo_pago, notas } = req.body;

        if (pagado === undefined) {
            throw new AppError('Campo pagado es requerido', 400);
        }

        await PagoModel.marcarPago(id, { pagado, fecha_pago, metodo_pago, notas });
        const updated = await PagoModel.obtenerPorId(id);

        logger.info('[superadmin] Pago marcado', {
            pagoId: id, pagado, tenant: pago.tenant_nombre, usuario: req.usuario.id
        });

        res.json({
            success: true,
            message: pagado ? 'Pago registrado exitosamente' : 'Pago desmarcado',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/superadmin/pagos/generar-periodo
 */
exports.generarPeriodo = async (req, res, next) => {
    try {
        const { mes } = req.body;

        if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
            throw new AppError('Formato de mes inválido. Use YYYY-MM', 400);
        }

        const result = await PagoModel.generarPeriodo(mes);

        logger.info('[superadmin] Periodo generado', { mes, generados: result.generados, usuario: req.usuario.id });

        res.status(201).json({
            success: true,
            message: `${result.generados} registros de pago generados para ${mes}`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/superadmin/pagos/:id
 */
exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pago = await PagoModel.obtenerPorId(id);

        if (!pago) {
            throw new AppError('Registro de pago no encontrado', 404);
        }

        await PagoModel.eliminar(id);

        logger.info('[superadmin] Pago eliminado', { pagoId: id, usuario: req.usuario.id });

        res.json({ success: true, message: 'Registro de pago eliminado' });
    } catch (error) {
        next(error);
    }
};
