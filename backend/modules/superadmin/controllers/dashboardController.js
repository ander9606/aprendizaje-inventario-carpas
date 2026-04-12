const TenantModel = require('../models/TenantModel');
const PagoModel = require('../models/PagoModel');
const logger = require('../../../utils/logger');

/**
 * GET /api/superadmin/dashboard
 * Estadísticas globales de la plataforma
 */
exports.obtenerDashboard = async (req, res, next) => {
    try {
        const [stats, cercaLimites, resumenPagos] = await Promise.all([
            TenantModel.estadisticasGlobales(),
            TenantModel.tenantsCercaLimites(),
            PagoModel.obtenerResumen()
        ]);

        logger.info('[superadmin] Dashboard consultado', { usuario: req.usuario.id });

        res.json({
            success: true,
            data: {
                ...stats,
                tenantsCercaLimites: cercaLimites,
                pagos: resumenPagos
            }
        });
    } catch (error) {
        logger.error('[superadmin] Error dashboard:', error.message);
        next(error);
    }
};
