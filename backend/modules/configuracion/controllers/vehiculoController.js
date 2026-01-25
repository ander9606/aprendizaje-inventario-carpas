const VehiculoModel = require('../models/VehiculoModel');
const AuthModel = require('../../auth/models/AuthModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

/**
 * GET /api/vehiculos
 * Listar vehículos con paginación y filtros
 */
const getAll = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            buscar,
            tipo,
            estado,
            activo,
            ordenar,
            direccion
        } = req.query;

        const resultado = await VehiculoModel.obtenerTodos({
            page: parseInt(page),
            limit: parseInt(limit),
            buscar,
            tipo,
            estado,
            activo: activo !== undefined ? activo === 'true' : null,
            ordenar,
            direccion
        });

        res.json({
            success: true,
            data: resultado.vehiculos,
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
 * GET /api/vehiculos/:id
 * Obtener vehículo por ID con historial
 */
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const vehiculo = await VehiculoModel.obtenerPorId(parseInt(id));

        if (!vehiculo) {
            throw new AppError('Vehículo no encontrado', 404);
        }

        res.json({
            success: true,
            data: vehiculo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/vehiculos
 * Crear nuevo vehículo
 */
const create = async (req, res, next) => {
    try {
        const {
            placa,
            marca,
            modelo,
            anio,
            tipo,
            capacidad_carga,
            estado,
            kilometraje_actual,
            proximo_mantenimiento,
            notas
        } = req.body;

        // Validaciones
        if (!placa || !marca || !modelo || !tipo) {
            throw new AppError('Placa, marca, modelo y tipo son requeridos', 400);
        }

        const tiposValidos = ['camion', 'camioneta', 'furgon', 'trailer', 'otro'];
        if (!tiposValidos.includes(tipo)) {
            throw new AppError(`Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`, 400);
        }

        const vehiculo = await VehiculoModel.crear({
            placa: placa.toUpperCase(),
            marca,
            modelo,
            anio,
            tipo,
            capacidad_carga,
            estado,
            kilometraje_actual,
            proximo_mantenimiento,
            notas
        });

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'CREAR_VEHICULO',
            tabla_afectada: 'vehiculos',
            registro_id: vehiculo.id,
            datos_nuevos: { placa, marca, modelo, tipo },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('vehiculos', `Vehículo creado: ${placa} por ${req.usuario.email}`);

        res.status(201).json({
            success: true,
            message: 'Vehículo creado correctamente',
            data: vehiculo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/vehiculos/:id
 * Actualizar vehículo
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const datos = req.body;

        // Si se proporciona tipo, validar
        if (datos.tipo) {
            const tiposValidos = ['camion', 'camioneta', 'furgon', 'trailer', 'otro'];
            if (!tiposValidos.includes(datos.tipo)) {
                throw new AppError(`Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`, 400);
            }
        }

        // Si se proporciona estado, validar
        if (datos.estado) {
            const estadosValidos = ['disponible', 'en_uso', 'mantenimiento', 'fuera_servicio'];
            if (!estadosValidos.includes(datos.estado)) {
                throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
            }
        }

        // Convertir placa a mayúsculas si se proporciona
        if (datos.placa) {
            datos.placa = datos.placa.toUpperCase();
        }

        const vehiculoAnterior = await VehiculoModel.obtenerPorId(parseInt(id));
        if (!vehiculoAnterior) {
            throw new AppError('Vehículo no encontrado', 404);
        }

        const vehiculo = await VehiculoModel.actualizar(parseInt(id), datos);

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'ACTUALIZAR_VEHICULO',
            tabla_afectada: 'vehiculos',
            registro_id: parseInt(id),
            datos_anteriores: {
                placa: vehiculoAnterior.placa,
                estado: vehiculoAnterior.estado
            },
            datos_nuevos: datos,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('vehiculos', `Vehículo actualizado: ${vehiculo.placa} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Vehículo actualizado correctamente',
            data: vehiculo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/vehiculos/:id
 * Eliminar (desactivar) vehículo
 */
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        const vehiculo = await VehiculoModel.obtenerPorId(parseInt(id));
        if (!vehiculo) {
            throw new AppError('Vehículo no encontrado', 404);
        }

        await VehiculoModel.eliminar(parseInt(id));

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'DESACTIVAR_VEHICULO',
            tabla_afectada: 'vehiculos',
            registro_id: parseInt(id),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('vehiculos', `Vehículo desactivado: ${vehiculo.placa} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Vehículo desactivado correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/vehiculos/disponibles
 * Obtener vehículos disponibles (opcionalmente para una fecha)
 */
const getDisponibles = async (req, res, next) => {
    try {
        const { fecha } = req.query;

        const vehiculos = await VehiculoModel.obtenerDisponibles(
            fecha ? new Date(fecha) : null
        );

        res.json({
            success: true,
            data: vehiculos
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/vehiculos/:id/uso
 * Registrar uso de vehículo
 */
const registrarUso = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            conductor_id,
            fecha_uso,
            kilometraje_inicio,
            kilometraje_fin,
            destino,
            proposito,
            notas
        } = req.body;

        const uso = await VehiculoModel.registrarUso(parseInt(id), {
            conductor_id: conductor_id || req.usuario.id,
            fecha_uso,
            kilometraje_inicio,
            kilometraje_fin,
            destino,
            proposito,
            notas
        });

        logger.info('vehiculos', `Uso registrado para vehículo ${id} por ${req.usuario.email}`);

        res.status(201).json({
            success: true,
            message: 'Uso registrado correctamente',
            data: uso
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/vehiculos/:id/mantenimiento
 * Programar/registrar mantenimiento
 */
const registrarMantenimiento = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            tipo,
            fecha_programada,
            fecha_realizada,
            kilometraje,
            costo,
            descripcion,
            estado
        } = req.body;

        if (!tipo || !fecha_programada) {
            throw new AppError('Tipo y fecha programada son requeridos', 400);
        }

        const tiposMantenimiento = ['preventivo', 'correctivo', 'revision', 'otro'];
        if (!tiposMantenimiento.includes(tipo)) {
            throw new AppError(`Tipo inválido. Valores permitidos: ${tiposMantenimiento.join(', ')}`, 400);
        }

        const mantenimiento = await VehiculoModel.registrarMantenimiento(parseInt(id), {
            tipo,
            fecha_programada,
            fecha_realizada,
            kilometraje,
            costo,
            descripcion,
            estado
        });

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'PROGRAMAR_MANTENIMIENTO',
            tabla_afectada: 'vehiculo_mantenimientos',
            registro_id: mantenimiento.id,
            datos_nuevos: { vehiculo_id: id, tipo, fecha_programada },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('vehiculos', `Mantenimiento programado para vehículo ${id} por ${req.usuario.email}`);

        res.status(201).json({
            success: true,
            message: 'Mantenimiento registrado correctamente',
            data: mantenimiento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/vehiculos/mantenimiento/:id
 * Actualizar mantenimiento
 */
const actualizarMantenimiento = async (req, res, next) => {
    try {
        const { id } = req.params;
        const datos = req.body;

        const mantenimiento = await VehiculoModel.actualizarMantenimiento(parseInt(id), datos);

        // Registrar en auditoría
        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'ACTUALIZAR_MANTENIMIENTO',
            tabla_afectada: 'vehiculo_mantenimientos',
            registro_id: parseInt(id),
            datos_nuevos: datos,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('vehiculos', `Mantenimiento ${id} actualizado por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Mantenimiento actualizado correctamente',
            data: mantenimiento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/vehiculos/estadisticas
 * Obtener estadísticas de vehículos
 */
const getEstadisticas = async (req, res, next) => {
    try {
        const estadisticas = await VehiculoModel.obtenerEstadisticas();

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
    getDisponibles,
    registrarUso,
    registrarMantenimiento,
    actualizarMantenimiento,
    getEstadisticas
};
