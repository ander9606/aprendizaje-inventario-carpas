const TokenService = require('../services/TokenService');
const AppError = require('../../../utils/AppError');

/**
 * Middleware para verificar token JWT
 * Extrae el token del header Authorization y verifica su validez
 * Añade req.usuario con los datos del token decodificado
 */
const verificarToken = (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('Token de autenticación no proporcionado', 401);
        }

        // Formato esperado: "Bearer <token>"
        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AppError('Formato de token inválido. Use: Bearer <token>', 401);
        }

        const token = parts[1];

        // Verificar y decodificar token
        const decoded = TokenService.verificarAccessToken(token);

        // Añadir datos del usuario a la request
        req.usuario = {
            id: decoded.id,
            email: decoded.email,
            nombre: decoded.nombre,
            apellido: decoded.apellido,
            rol_id: decoded.rol_id,
            rol_nombre: decoded.rol_nombre,
            permisos: decoded.permisos
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware opcional para verificar token
 * Si hay token, lo verifica. Si no hay, continúa sin autenticación
 * Útil para rutas que funcionan diferente según si hay usuario o no
 */
const verificarTokenOpcional = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            req.usuario = null;
            return next();
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            req.usuario = null;
            return next();
        }

        const token = parts[1];

        try {
            const decoded = TokenService.verificarAccessToken(token);
            req.usuario = {
                id: decoded.id,
                email: decoded.email,
                nombre: decoded.nombre,
                apellido: decoded.apellido,
                rol_id: decoded.rol_id,
                rol_nombre: decoded.rol_nombre,
                permisos: decoded.permisos
            };
        } catch (error) {
            req.usuario = null;
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware para verificar rol del usuario
 * @param {string[]} rolesPermitidos - Array de nombres de rol permitidos
 * @returns {Function} Middleware
 *
 * Ejemplo de uso:
 *   router.get('/admin', verificarToken, verificarRol(['admin']), controller)
 *   router.get('/config', verificarToken, verificarRol(['admin', 'gerente']), controller)
 */
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        try {
            if (!req.usuario) {
                throw new AppError('Usuario no autenticado', 401);
            }

            const rolUsuario = req.usuario.rol_nombre;

            if (!rolesPermitidos.includes(rolUsuario)) {
                throw new AppError(
                    `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
                    403
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware para verificar permiso específico
 * @param {string} modulo - Nombre del módulo (ej: 'inventario', 'alquileres')
 * @param {string} accion - Acción requerida (ej: 'leer', 'crear', 'editar', 'eliminar')
 * @returns {Function} Middleware
 *
 * Ejemplo de uso:
 *   router.post('/elementos', verificarToken, verificarPermiso('inventario', 'crear'), controller)
 *   router.delete('/alquileres/:id', verificarToken, verificarPermiso('alquileres', 'eliminar'), controller)
 */
const verificarPermiso = (modulo, accion) => {
    return (req, res, next) => {
        try {
            if (!req.usuario) {
                throw new AppError('Usuario no autenticado', 401);
            }

            const permisos = req.usuario.permisos;

            // Admin tiene acceso total
            if (req.usuario.rol_nombre === 'admin') {
                return next();
            }

            // Verificar si tiene el permiso específico
            if (!permisos || !permisos[modulo]) {
                throw new AppError(
                    `No tiene permisos para acceder al módulo: ${modulo}`,
                    403
                );
            }

            const permisosModulo = permisos[modulo];

            // Verificar acción específica
            if (!permisosModulo[accion]) {
                throw new AppError(
                    `No tiene permiso para: ${accion} en ${modulo}`,
                    403
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware para verificar que el usuario es el propietario del recurso
 * o tiene rol de admin/gerente
 * @param {Function} obtenerPropietarioId - Función que recibe req y retorna el ID del propietario
 * @returns {Function} Middleware
 *
 * Ejemplo de uso:
 *   router.put('/perfil/:id', verificarToken, verificarPropietario(req => req.params.id), controller)
 */
const verificarPropietario = (obtenerPropietarioId) => {
    return async (req, res, next) => {
        try {
            if (!req.usuario) {
                throw new AppError('Usuario no autenticado', 401);
            }

            // Admin y gerente pueden acceder a cualquier recurso
            if (['admin', 'gerente'].includes(req.usuario.rol_nombre)) {
                return next();
            }

            const propietarioId = await obtenerPropietarioId(req);

            if (req.usuario.id !== parseInt(propietarioId)) {
                throw new AppError('No tiene permiso para acceder a este recurso', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware combinado: verifica token Y rol en una sola llamada
 * @param {string[]} rolesPermitidos - Array de nombres de rol permitidos
 * @returns {Function[]} Array de middlewares
 *
 * Ejemplo de uso:
 *   router.get('/admin', ...authRol(['admin']), controller)
 */
const authRol = (rolesPermitidos) => {
    return [verificarToken, verificarRol(rolesPermitidos)];
};

/**
 * Middleware combinado: verifica token Y permiso en una sola llamada
 * @param {string} modulo
 * @param {string} accion
 * @returns {Function[]} Array de middlewares
 *
 * Ejemplo de uso:
 *   router.post('/elementos', ...authPermiso('inventario', 'crear'), controller)
 */
const authPermiso = (modulo, accion) => {
    return [verificarToken, verificarPermiso(modulo, accion)];
};

module.exports = {
    verificarToken,
    verificarTokenOpcional,
    verificarRol,
    verificarPermiso,
    verificarPropietario,
    authRol,
    authPermiso
};
