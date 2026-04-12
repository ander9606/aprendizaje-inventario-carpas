const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AuthModel = require('../models/AuthModel');
const VerificacionEmailModel = require('../models/VerificacionEmailModel');
const TokenService = require('../services/TokenService');
const EmailService = require('../services/EmailService');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// Configuración de seguridad
const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO = 15;
const MINUTOS_EXPIRACION_CODIGO = 30;
const MAX_INTENTOS_VERIFICACION = 5;

/**
 * Generar código numérico de 6 dígitos
 */
const generarCodigo = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * POST /api/auth/login
 * Iniciar sesión con email y contraseña
 */
const login = async (req, res, next) => {
    try {
        const tenantId = req.tenant?.id;
        const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            throw new AppError('Email y contraseña son requeridos', 400);
        }

        // Buscar empleado por email (cross-tenant si no hay tenant resuelto)
        let empleado;
        if (tenantId) {
            empleado = await AuthModel.buscarPorEmail(tenantId, email);
        } else {
            empleado = await AuthModel.buscarPorEmailGlobal(email);
        }

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

        // Usar tenant_id del empleado si no hay tenant resuelto (login cross-tenant)
        const effectiveTenantId = tenantId || empleado.tenant_id;

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, empleado.password_hash);

        if (!passwordValido) {
            // Incrementar intentos fallidos
            const intentos = await AuthModel.incrementarIntentosFallidos(effectiveTenantId, empleado.id);

            // Bloquear cuenta si excede límite
            if (intentos >= MAX_INTENTOS_FALLIDOS) {
                const bloqueadoHasta = new Date();
                bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + MINUTOS_BLOQUEO);
                await AuthModel.bloquearCuenta(effectiveTenantId, empleado.id, bloqueadoHasta);

                logger.warn('auth', `Cuenta bloqueada por exceso de intentos: ${email}`);

                throw new AppError(
                    `Demasiados intentos fallidos. Cuenta bloqueada por ${MINUTOS_BLOQUEO} minutos`,
                    423
                );
            }

            throw new AppError('Credenciales inválidas', 401);
        }

        // Login exitoso - actualizar último login
        await AuthModel.actualizarUltimoLogin(effectiveTenantId, empleado.id);

        // Generar tokens
        const accessToken = TokenService.generarAccessToken(empleado);
        const refreshToken = await TokenService.generarRefreshToken(empleado);

        // Registrar en auditoría
        await AuthModel.registrarAuditoria(effectiveTenantId, {
            empleado_id: empleado.id,
            accion: 'LOGIN',
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('auth', `Login exitoso: ${email}`);

        // Obtener slug del tenant para el frontend
        let tenantSlug = null;
        if (empleado.tenant_slug) {
            tenantSlug = empleado.tenant_slug;
        } else if (req.tenant?.slug) {
            tenantSlug = req.tenant.slug;
        }

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
                    permisos: empleado.permisos,
                    tenant_id: empleado.tenant_id,
                    tenant_slug: tenantSlug
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
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const { refreshToken } = req.body;

        if (refreshToken) {
            await TokenService.revocarRefreshToken(refreshToken);
        }

        // Registrar en auditoría si hay usuario autenticado
        if (req.usuario && tenantId) {
            await AuthModel.registrarAuditoria(tenantId, {
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
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        await TokenService.revocarTodosTokensEmpleado(req.usuario.id);

        await AuthModel.registrarAuditoria(tenantId, {
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
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const empleado = await AuthModel.obtenerPorId(tenantId, req.usuario.id);

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
                ultimo_login: empleado.ultimo_login,
                created_at: empleado.created_at,
                tenant_id: empleado.tenant_id,
                tenant_slug: empleado.tenant_slug
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/auth/perfil
 * Actualizar perfil del usuario autenticado
 */
const actualizarPerfil = async (req, res, next) => {
    try {
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const { nombre, apellido, telefono } = req.body;

        if (!nombre && !apellido && telefono === undefined) {
            throw new AppError('Debe proporcionar al menos un campo para actualizar', 400);
        }

        const datos = {};
        if (nombre) datos.nombre = nombre.trim();
        if (apellido) datos.apellido = apellido.trim();
        if (telefono !== undefined) datos.telefono = telefono?.trim() || null;

        const empleadoAnterior = await AuthModel.obtenerPorId(tenantId, req.usuario.id);
        await AuthModel.actualizarPerfil(tenantId, req.usuario.id, datos);
        const empleadoActualizado = await AuthModel.obtenerPorId(tenantId, req.usuario.id);

        await AuthModel.registrarAuditoria(tenantId, {
            empleado_id: req.usuario.id,
            accion: 'ACTUALIZAR_PERFIL',
            tabla_afectada: 'empleados',
            registro_id: req.usuario.id,
            datos_anteriores: {
                nombre: empleadoAnterior.nombre,
                apellido: empleadoAnterior.apellido,
                telefono: empleadoAnterior.telefono
            },
            datos_nuevos: datos,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('auth', `Perfil actualizado: ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: {
                id: empleadoActualizado.id,
                nombre: empleadoActualizado.nombre,
                apellido: empleadoActualizado.apellido,
                email: empleadoActualizado.email,
                telefono: empleadoActualizado.telefono,
                rol: empleadoActualizado.rol_nombre,
                permisos: empleadoActualizado.permisos
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
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
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
        const empleado = await AuthModel.buscarPorEmail(tenantId, req.usuario.email);

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
        await AuthModel.cambiarPassword(tenantId, empleado.id, nuevoHash);

        await AuthModel.registrarAuditoria(tenantId, {
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
 * GET /api/auth/historial
 * Obtener historial de actividad del usuario autenticado
 */
const obtenerHistorial = async (req, res, next) => {
    try {
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const { registros, total } = await AuthModel.obtenerHistorialUsuario(
            tenantId,
            req.usuario.id,
            limit,
            offset
        );

        res.json({
            success: true,
            data: registros,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/registro
 * Paso 1: Enviar código de verificación al email
 */
const registro = async (req, res, next) => {
    try {
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const { nombre, apellido, email, telefono, password, rol_solicitado_id } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !email || !password) {
            throw new AppError('Nombre, apellido, email y contraseña son requeridos', 400);
        }

        // Normalizar inputs
        const emailNormalizado = email.trim().toLowerCase();
        const nombreNormalizado = nombre.trim();
        const apellidoNormalizado = apellido.trim();

        // Validar longitud de contraseña
        if (password.length < 8) {
            throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailNormalizado)) {
            throw new AppError('El formato del email no es válido', 400);
        }

        // Verificar si el email ya está registrado como empleado
        const existente = await AuthModel.buscarPorEmail(tenantId, emailNormalizado);
        if (existente) {
            if (existente.estado === 'pendiente') {
                throw new AppError('Ya existe una solicitud pendiente con este email', 400);
            }
            throw new AppError('Ya existe un empleado registrado con este email', 400);
        }

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Generar código de verificación
        const codigo = generarCodigo();
        const expira_en = new Date();
        expira_en.setMinutes(expira_en.getMinutes() + MINUTOS_EXPIRACION_CODIGO);

        // Guardar en tabla de verificación
        await VerificacionEmailModel.crear(tenantId, {
            email: emailNormalizado,
            codigo,
            datos_registro: {
                nombre: nombreNormalizado,
                apellido: apellidoNormalizado,
                telefono: telefono?.trim() || null,
                password_hash,
                rol_solicitado_id: rol_solicitado_id ? parseInt(rol_solicitado_id) : null
            },
            expira_en
        });

        // Enviar email con código
        try {
            await EmailService.enviarCodigoVerificacion(emailNormalizado, codigo, nombreNormalizado);
        } catch (emailError) {
            logger.error('auth', `Error enviando email de verificación a ${emailNormalizado}: ${emailError.message}`);
            // No fallar el registro si el email no se puede enviar (modo desarrollo)
        }

        logger.info('auth', `Código de verificación enviado a: ${emailNormalizado}`);

        res.status(201).json({
            success: true,
            message: 'Código de verificación enviado a tu correo electrónico.',
            data: {
                email: emailNormalizado,
                expira_en: MINUTOS_EXPIRACION_CODIGO
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/verificar-email
 * Paso 2: Verificar código y crear solicitud de acceso
 */
const verificarEmail = async (req, res, next) => {
    try {
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            throw new AppError('Email y código son requeridos', 400);
        }

        const emailNormalizado = email.trim().toLowerCase();

        // Buscar verificación pendiente
        const verificacion = await VerificacionEmailModel.buscarPorEmail(tenantId, emailNormalizado);

        if (!verificacion) {
            throw new AppError('No se encontró una verificación pendiente. El código puede haber expirado.', 400);
        }

        // Verificar intentos
        if (verificacion.intentos >= MAX_INTENTOS_VERIFICACION) {
            throw new AppError('Demasiados intentos. Solicita un nuevo código.', 429);
        }

        // Verificar código
        if (verificacion.codigo !== codigo.trim()) {
            await VerificacionEmailModel.incrementarIntentos(verificacion.id);
            const intentosRestantes = MAX_INTENTOS_VERIFICACION - verificacion.intentos - 1;
            throw new AppError(
                `Código incorrecto. ${intentosRestantes > 0 ? `Te quedan ${intentosRestantes} intentos.` : 'Solicita un nuevo código.'}`,
                400
            );
        }

        // Código correcto - marcar como verificado
        await VerificacionEmailModel.marcarVerificado(verificacion.id);

        // Crear empleado con estado pendiente
        const datos = verificacion.datos_registro;
        const solicitud = await AuthModel.registrarSolicitud(tenantId, {
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: emailNormalizado,
            telefono: datos.telefono,
            password_hash: datos.password_hash,
            rol_solicitado_id: datos.rol_solicitado_id
        });

        // Registrar en auditoría
        await AuthModel.registrarAuditoria(tenantId, {
            empleado_id: null,
            accion: 'SOLICITUD_ACCESO',
            tabla_afectada: 'empleados',
            registro_id: solicitud.id,
            datos_nuevos: { nombre: datos.nombre, apellido: datos.apellido, email: emailNormalizado, email_verificado: true },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('auth', `Email verificado y solicitud creada: ${emailNormalizado}`);

        res.json({
            success: true,
            message: 'Email verificado correctamente. Tu solicitud de acceso ha sido enviada. Un administrador la revisará.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/reenviar-codigo
 * Reenviar código de verificación
 */
const reenviarCodigo = async (req, res, next) => {
    try {
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const { email } = req.body;

        if (!email) {
            throw new AppError('Email es requerido', 400);
        }

        const emailNormalizado = email.trim().toLowerCase();

        // Verificar si ya existe como empleado
        const existente = await AuthModel.buscarPorEmail(tenantId, emailNormalizado);
        if (existente) {
            throw new AppError('Este email ya está registrado en el sistema', 400);
        }

        // Buscar verificación pendiente para obtener datos
        const verificacionAnterior = await VerificacionEmailModel.buscarPorEmail(tenantId, emailNormalizado);

        if (!verificacionAnterior) {
            throw new AppError('No se encontró una solicitud de registro para este email. Regístrate nuevamente.', 400);
        }

        // Generar nuevo código
        const codigo = generarCodigo();
        const expira_en = new Date();
        expira_en.setMinutes(expira_en.getMinutes() + MINUTOS_EXPIRACION_CODIGO);

        // Crear nueva verificación (la anterior se elimina automáticamente)
        await VerificacionEmailModel.crear(tenantId, {
            email: emailNormalizado,
            codigo,
            datos_registro: verificacionAnterior.datos_registro,
            expira_en
        });

        // Enviar email
        try {
            await EmailService.enviarCodigoVerificacion(
                emailNormalizado,
                codigo,
                verificacionAnterior.datos_registro.nombre
            );
        } catch (emailError) {
            logger.error('auth', `Error reenviando código a ${emailNormalizado}: ${emailError.message}`);
        }

        logger.info('auth', `Código reenviado a: ${emailNormalizado}`);

        res.json({
            success: true,
            message: 'Nuevo código de verificación enviado.',
            data: {
                email: emailNormalizado,
                expira_en: MINUTOS_EXPIRACION_CODIGO
            }
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
        const tenantId = req.tenant?.id || req.usuario?.tenant_id;
        const roles = await AuthModel.obtenerRolesPublicos(tenantId);

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
    actualizarPerfil,
    cambiarPassword,
    getSessions,
    obtenerHistorial,
    registro,
    verificarEmail,
    reenviarCodigo,
    getRolesRegistro
};
