const bcrypt = require('bcryptjs');
const AuthModel = require('../models/AuthModel');
const TokenService = require('../services/TokenService');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// Configuración de seguridad
const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO = 15;

/**
 * POST /api/auth/login
 * Iniciar sesión con email y contraseña
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            throw new AppError('Email y contraseña son requeridos', 400);
        }

        // Buscar empleado por email
        const empleado = await AuthModel.buscarPorEmail(email);

        if (!empleado) {
            throw new AppError('Credenciales inválidas', 401);
        }

        // Verificar estado del empleado
        if (empleado.estado === 'pendiente') {
            throw new AppError('Tu solicitud de acceso está pendiente de aprobación por un administrador', 403);
        }

        if (empleado.estado === 'inactivo') {
            throw new AppError('Tu cuenta ha sido desactivada. Contacta al administrador', 403);
        }

        // Verificar si la cuenta está bloqueada
        if (empleado.bloqueado_hasta && new Date(empleado.bloqueado_hasta) > new Date()) {
            const minutosRestantes = Math.ceil(
                (new Date(empleado.bloqueado_hasta) - new Date()) / (1000 * 60)
            );
            throw new AppError(
                `Cuenta bloqueada temporalmente. Intente de nuevo en ${minutosRestantes} minutos`,
                423
            );
        }

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, empleado.password_hash);

        if (!passwordValido) {
            // Incrementar intentos fallidos
            const intentos = await AuthModel.incrementarIntentosFallidos(empleado.id);

            // Bloquear cuenta si excede límite
            if (intentos >= MAX_INTENTOS_FALLIDOS) {
                const bloqueadoHasta = new Date();
                bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + MINUTOS_BLOQUEO);
                await AuthModel.bloquearCuenta(empleado.id, bloqueadoHasta);

                logger.warn('auth', `Cuenta bloqueada por exceso de intentos: ${email}`);

                throw new AppError(
                    `Demasiados intentos fallidos. Cuenta bloqueada por ${MINUTOS_BLOQUEO} minutos`,
                    423
                );
            }

            throw new AppError('Credenciales inválidas', 401);
        }

        // Login exitoso - actualizar último login
        await AuthModel.actualizarUltimoLogin(empleado.id);

        // Generar tokens
        const accessToken = TokenService.generarAccessToken(empleado);
        const refreshToken = await TokenService.generarRefreshToken(empleado);

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: empleado.id,
            accion: 'LOGIN',
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('auth', `Login exitoso: ${email}`);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                usuario: {
                    id: empleado.id,
                    nombre: empleado.nombre,
                    apellido: empleado.apellido,
                    email: empleado.email,
                    rol: empleado.rol_nombre,
                    permisos: empleado.permisos
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout
 * Cerrar sesión (revocar refresh token)
 */
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await TokenService.revocarRefreshToken(refreshToken);
        }

        // Registrar en auditoría si hay usuario autenticado
        if (req.usuario) {
            await AuthModel.registrarAuditoria({
                empleado_id: req.usuario.id,
                accion: 'LOGOUT',
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });

            logger.info('auth', `Logout: ${req.usuario.email}`);
        }

        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout-all
 * Cerrar todas las sesiones del usuario
 */
const logoutAll = async (req, res, next) => {
    try {
        await TokenService.revocarTodosTokensEmpleado(req.usuario.id);

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'LOGOUT_ALL',
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('auth', `Logout de todas las sesiones: ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Todas las sesiones han sido cerradas'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 */
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token es requerido', 400);
        }

        // Verificar refresh token
        const empleado = await TokenService.verificarRefreshToken(refreshToken);

        // Generar nuevo access token
        const accessToken = TokenService.generarAccessToken(empleado);

        res.json({
            success: true,
            data: {
                accessToken,
                expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 * Obtener perfil del usuario autenticado
 */
const me = async (req, res, next) => {
    try {
        const empleado = await AuthModel.obtenerPorId(req.usuario.id);

        if (!empleado) {
            throw new AppError('Usuario no encontrado', 404);
        }

        res.json({
            success: true,
            data: {
                id: empleado.id,
                nombre: empleado.nombre,
                apellido: empleado.apellido,
                email: empleado.email,
                telefono: empleado.telefono,
                rol: empleado.rol_nombre,
                permisos: empleado.permisos,
                ultimo_login: empleado.ultimo_login
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/auth/password
 * Cambiar contraseña del usuario autenticado
 */
const cambiarPassword = async (req, res, next) => {
    try {
        const { passwordActual, passwordNuevo } = req.body;

        // Validar campos requeridos
        if (!passwordActual || !passwordNuevo) {
            throw new AppError('Contraseña actual y nueva son requeridas', 400);
        }

        // Validar longitud mínima
        if (passwordNuevo.length < 8) {
            throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
        }

        // Obtener empleado con password
        const empleado = await AuthModel.buscarPorEmail(req.usuario.email);

        if (!empleado) {
            throw new AppError('Usuario no encontrado', 404);
        }

        // Verificar contraseña actual
        const passwordValido = await bcrypt.compare(passwordActual, empleado.password_hash);

        if (!passwordValido) {
            throw new AppError('Contraseña actual incorrecta', 401);
        }

        // Generar hash de nueva contraseña
        const nuevoHash = await bcrypt.hash(passwordNuevo, 10);

        // Actualizar contraseña
        await AuthModel.cambiarPassword(empleado.id, nuevoHash);

        // Revocar todos los tokens excepto el actual (opcional: forzar re-login)
        // await TokenService.revocarTodosTokensEmpleado(empleado.id);

        await AuthModel.registrarAuditoria({
            empleado_id: empleado.id,
            accion: 'CAMBIO_PASSWORD',
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('auth', `Cambio de contraseña: ${empleado.email}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/sessions
 * Obtener sesiones activas del usuario
 */
const getSessions = async (req, res, next) => {
    try {
        const sesiones = await TokenService.obtenerSesionesActivas(req.usuario.id);

        res.json({
            success: true,
            data: sesiones.map(s => ({
                id: s.id,
                creada: s.created_at,
                expira: s.expira_en,
                ultimoUso: s.ultimo_uso
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/registro
 * Solicitar acceso al sistema (auto-registro)
 */
const registro = async (req, res, next) => {
    try {
        const { nombre, apellido, email, telefono, password, rol_solicitado_id } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !email || !password) {
            throw new AppError('Nombre, apellido, email y contraseña son requeridos', 400);
        }

        // Normalizar inputs antes de validar
        const emailNormalizado = email.trim().toLowerCase();
        const nombreNormalizado = nombre.trim();
        const apellidoNormalizado = apellido.trim();

        // Validar longitud de contraseña
        if (password.length < 8) {
            throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
        }

        // Validar formato de email (después del trim)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailNormalizado)) {
            throw new AppError('El formato del email no es válido', 400);
        }

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Crear solicitud
        const solicitud = await AuthModel.registrarSolicitud({
            nombre: nombreNormalizado,
            apellido: apellidoNormalizado,
            email: emailNormalizado,
            telefono: telefono?.trim() || null,
            password_hash,
            rol_solicitado_id: rol_solicitado_id ? parseInt(rol_solicitado_id) : null
        });

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: null,
            accion: 'SOLICITUD_ACCESO',
            tabla_afectada: 'empleados',
            registro_id: solicitud.id,
            datos_nuevos: { nombre, apellido, email, rol_solicitado_id },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('auth', `Nueva solicitud de acceso: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Solicitud de acceso enviada correctamente. Un administrador revisará tu solicitud.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/roles-registro
 * Obtener roles disponibles para el formulario de registro público
 */
const getRolesRegistro = async (req, res, next) => {
    try {
        const roles = await AuthModel.obtenerRolesPublicos();

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    logout,
    logoutAll,
    refresh,
    me,
    cambiarPassword,
    getSessions,
    registro,
    getRolesRegistro
};
