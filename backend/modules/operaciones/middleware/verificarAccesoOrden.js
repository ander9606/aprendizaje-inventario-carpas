// ============================================
// MIDDLEWARE: Verificar acceso a orden de trabajo
// Solo responsables asignados (o admin/gerente)
// pueden ver/manipular una orden específica
// ============================================

const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

const verificarAccesoOrden = async (req, res, next) => {
    try {
        // Admin y gerente tienen acceso total
        if (['admin', 'gerente'].includes(req.usuario.rol_nombre)) {
            return next();
        }

        const ordenId = parseInt(req.params.id);
        if (!ordenId) return next();

        // Verificar si el empleado está asignado a esta orden
        const [rows] = await pool.query(
            'SELECT 1 FROM orden_trabajo_equipo WHERE orden_id = ? AND empleado_id = ? AND estado_asignacion = ?',
            [ordenId, req.usuario.id, 'aceptada']
        );

        if (rows.length === 0) {
            throw new AppError('No tiene acceso a esta orden de trabajo', 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = verificarAccesoOrden;
