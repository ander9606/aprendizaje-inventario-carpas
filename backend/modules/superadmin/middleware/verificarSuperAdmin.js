const AppError = require('../../../utils/AppError');

/**
 * Middleware: verifica que el usuario autenticado sea super_admin de tenant 1.
 * Debe usarse DESPUÉS de verificarToken.
 */
const verificarSuperAdmin = (req, res, next) => {
    try {
        if (!req.usuario) {
            throw new AppError('No autenticado', 401);
        }

        if (!req.usuario.es_super_admin) {
            throw new AppError('Acceso denegado. Se requiere super_admin', 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = verificarSuperAdmin;
