const bcrypt = require('bcryptjs');
const EmpleadoModel = require('../models/EmpleadoModel');
const AuthModel = require('../../auth/models/AuthModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

/**
 * GET /api/empleados
 * Listar empleados con paginación y filtros
 */
const getAll = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            buscar,
            rol_id,
            activo,
            ordenar,
            direccion
        } = req.query;

        const resultado = await EmpleadoModel.obtenerTodos({
            page: parseInt(page),
            limit: parseInt(limit),
            buscar,
            rol_id: rol_id ? parseInt(rol_id) : null,
            activo: activo !== undefined ? activo === 'true' : null,
            ordenar,
            direccion
        });

        res.json({
            success: true,
            data: resultado.empleados,
            pagination: {
                total: resultado.total,
                page: resultado.page,
                limit: resultado.limit,
                totalPages: resultado.totalPages
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/empleados/:id
 * Obtener empleado por ID
 */
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const empleado = await EmpleadoModel.obtenerPorId(parseInt(id));

        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }

        res.json({
            success: true,
            data: empleado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/empleados
 * Crear nuevo empleado
 */
const create = async (req, res, next) => {
    try {
        const { nombre, apellido, email, telefono, password, rol_id } = req.body;

        // Validaciones
        if (!nombre || !apellido || !email || !password || !rol_id) {
            throw new AppError('Nombre, apellido, email, contraseña y rol son requeridos', 400);
        }

        if (password.length < 8) {
            throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
        }

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        const empleado = await EmpleadoModel.crear({
            nombre,
            apellido,
            email,
            telefono,
            password_hash,
            rol_id
        });

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'CREAR_EMPLEADO',
            tabla_afectada: 'empleados',
            registro_id: empleado.id,
            datos_nuevos: { nombre, apellido, email, rol_id },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('empleados', `Empleado creado: ${email} por ${req.usuario.email}`);

        res.status(201).json({
            success: true,
            message: 'Empleado creado correctamente',
            data: empleado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/empleados/:id
 * Actualizar empleado
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, telefono, rol_id, activo } = req.body;

        const empleadoAnterior = await EmpleadoModel.obtenerPorId(parseInt(id));
        if (!empleadoAnterior) {
            throw new AppError('Empleado no encontrado', 404);
        }

        const empleado = await EmpleadoModel.actualizar(parseInt(id), {
            nombre,
            apellido,
            email,
            telefono,
            rol_id,
            activo
        });

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'ACTUALIZAR_EMPLEADO',
            tabla_afectada: 'empleados',
            registro_id: parseInt(id),
            datos_anteriores: {
                nombre: empleadoAnterior.nombre,
                apellido: empleadoAnterior.apellido,
                email: empleadoAnterior.email,
                rol_id: empleadoAnterior.rol_id,
                activo: empleadoAnterior.activo
            },
            datos_nuevos: { nombre, apellido, email, rol_id, activo },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('empleados', `Empleado actualizado: ${empleado.email} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Empleado actualizado correctamente',
            data: empleado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/empleados/:id
 * Eliminar (desactivar) empleado
 */
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        // No permitir auto-eliminación
        if (parseInt(id) === req.usuario.id) {
            throw new AppError('No puede desactivar su propia cuenta', 400);
        }

        const empleado = await EmpleadoModel.obtenerPorId(parseInt(id));
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }

        await EmpleadoModel.eliminar(parseInt(id));

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'DESACTIVAR_EMPLEADO',
            tabla_afectada: 'empleados',
            registro_id: parseInt(id),
            datos_anteriores: { activo: true },
            datos_nuevos: { activo: false },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('empleados', `Empleado desactivado: ${empleado.email} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Empleado desactivado correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/empleados/:id/reactivar
 * Reactivar empleado
 */
const reactivar = async (req, res, next) => {
    try {
        const { id } = req.params;

        const empleado = await EmpleadoModel.reactivar(parseInt(id));

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'REACTIVAR_EMPLEADO',
            tabla_afectada: 'empleados',
            registro_id: parseInt(id),
            datos_anteriores: { activo: false },
            datos_nuevos: { activo: true },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('empleados', `Empleado reactivado: ${empleado.email} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Empleado reactivado correctamente',
            data: empleado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/empleados/:id/password
 * Cambiar contraseña de empleado (admin)
 */
const cambiarPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
        }

        const empleado = await EmpleadoModel.obtenerPorId(parseInt(id));
        if (!empleado) {
            throw new AppError('Empleado no encontrado', 404);
        }

        const password_hash = await bcrypt.hash(password, 10);
        await EmpleadoModel.cambiarPassword(parseInt(id), password_hash);

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'CAMBIAR_PASSWORD_EMPLEADO',
            tabla_afectada: 'empleados',
            registro_id: parseInt(id),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('empleados', `Contraseña cambiada para: ${empleado.email} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/empleados/disponibles/campo
 * Obtener empleados disponibles para trabajo de campo
 */
const getDisponiblesCampo = async (req, res, next) => {
    try {
        const { fecha } = req.query;

        const empleados = await EmpleadoModel.obtenerDisponiblesCampo(
            fecha ? new Date(fecha) : null
        );

        res.json({
            success: true,
            data: empleados
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/empleados/roles
 * Obtener lista de roles disponibles
 */
const getRoles = async (req, res, next) => {
    try {
        const roles = await EmpleadoModel.obtenerRoles();

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/empleados/estadisticas
 * Obtener estadísticas de empleados
 */
const getEstadisticas = async (req, res, next) => {
    try {
        const estadisticas = await EmpleadoModel.obtenerEstadisticas();

        res.json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    reactivar,
    cambiarPassword,
    getDisponiblesCampo,
    getRoles,
    getEstadisticas
};
