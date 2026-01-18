const OrdenTrabajoModel = require('../models/OrdenTrabajoModel');
const OrdenElementoModel = require('../models/OrdenElementoModel');
const AlertaModel = require('../models/AlertaModel');
const ValidadorFechasService = require('../services/ValidadorFechasService');
const AuthModel = require('../../auth/models/AuthModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================
// ÓRDENES DE TRABAJO
// ============================================

/**
 * GET /api/operaciones/ordenes
 * Listar órdenes de trabajo
 */
const getOrdenes = async (req, res, next) => {
    try {
        const filtros = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            tipo: req.query.tipo,
            estado: req.query.estado,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            alquiler_id: req.query.alquiler_id ? parseInt(req.query.alquiler_id) : null,
            empleado_id: req.query.empleado_id ? parseInt(req.query.empleado_id) : null,
            vehiculo_id: req.query.vehiculo_id ? parseInt(req.query.vehiculo_id) : null,
            ordenar: req.query.ordenar,
            direccion: req.query.direccion
        };

        const resultado = await OrdenTrabajoModel.obtenerTodas(filtros);

        res.json({
            success: true,
            data: resultado.ordenes,
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
 * GET /api/operaciones/ordenes/:id
 * Obtener orden por ID
 */
const getOrdenById = async (req, res, next) => {
    try {
        const orden = await OrdenTrabajoModel.obtenerPorId(parseInt(req.params.id));

        if (!orden) {
            throw new AppError('Orden de trabajo no encontrada', 404);
        }

        res.json({
            success: true,
            data: orden
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/alquiler/:id/ordenes
 * Obtener órdenes de un alquiler
 */
const getOrdenesPorAlquiler = async (req, res, next) => {
    try {
        const ordenes = await OrdenTrabajoModel.obtenerPorAlquiler(parseInt(req.params.id));

        res.json({
            success: true,
            data: ordenes
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id
 * Actualizar orden
 */
const updateOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const datos = req.body;

        const orden = await OrdenTrabajoModel.actualizar(parseInt(id), datos);

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'ACTUALIZAR_ORDEN',
            tabla_afectada: 'ordenes_trabajo',
            registro_id: parseInt(id),
            datos_nuevos: datos,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Orden ${id} actualizada por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Orden actualizada correctamente',
            data: orden
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/fecha
 * Cambiar fecha de la orden (con validación)
 */
const cambiarFechaOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fecha, motivo, forzar = false } = req.body;

        if (!fecha) {
            throw new AppError('La fecha es requerida', 400);
        }

        if (!motivo) {
            throw new AppError('El motivo del cambio es requerido', 400);
        }

        // Validar el cambio de fecha
        const validacion = await ValidadorFechasService.validarCambioFecha(parseInt(id), fecha);

        // Si hay conflictos críticos y no se está forzando
        if (validacion.severidad === 'critico' && !forzar) {
            // Crear alerta para aprobación
            if (validacion.conflictos.length > 0) {
                await AlertaModel.crearAlertaDisponibilidad(parseInt(id), validacion.conflictos);
            }

            return res.status(409).json({
                success: false,
                message: 'El cambio de fecha genera conflictos que requieren aprobación',
                data: {
                    validacion,
                    requiereAprobacion: true
                }
            });
        }

        // Proceder con el cambio
        const orden = await OrdenTrabajoModel.cambiarFecha(
            parseInt(id),
            fecha,
            motivo,
            forzar ? req.usuario.id : null
        );

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'CAMBIAR_FECHA_ORDEN',
            tabla_afectada: 'ordenes_trabajo',
            registro_id: parseInt(id),
            datos_anteriores: { fecha: validacion.fechaActual },
            datos_nuevos: { fecha, motivo, forzado: forzar },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Fecha de orden ${id} cambiada a ${fecha} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Fecha actualizada correctamente',
            data: {
                orden,
                validacion
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/estado
 * Cambiar estado de la orden
 */
const cambiarEstadoOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado) {
            throw new AppError('El estado es requerido', 400);
        }

        const ordenAnterior = await OrdenTrabajoModel.obtenerPorId(parseInt(id));
        if (!ordenAnterior) {
            throw new AppError('Orden no encontrada', 404);
        }

        const orden = await OrdenTrabajoModel.cambiarEstado(parseInt(id), estado);

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'CAMBIAR_ESTADO_ORDEN',
            tabla_afectada: 'ordenes_trabajo',
            registro_id: parseInt(id),
            datos_anteriores: { estado: ordenAnterior.estado },
            datos_nuevos: { estado },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Estado de orden ${id} cambiado a ${estado} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Estado actualizado correctamente',
            data: orden
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/equipo
 * Asignar equipo a la orden
 */
const asignarEquipo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { empleados } = req.body;

        if (!empleados || !Array.isArray(empleados)) {
            throw new AppError('Debe proporcionar un array de empleados', 400);
        }

        const equipo = await OrdenTrabajoModel.asignarEquipo(parseInt(id), empleados);

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'ASIGNAR_EQUIPO_ORDEN',
            tabla_afectada: 'orden_trabajo_equipo',
            registro_id: parseInt(id),
            datos_nuevos: { empleados },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Equipo asignado a orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Equipo asignado correctamente',
            data: equipo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/vehiculo
 * Asignar vehículo a la orden
 */
const asignarVehiculo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { vehiculo_id } = req.body;

        if (!vehiculo_id) {
            throw new AppError('Debe proporcionar el ID del vehículo', 400);
        }

        const orden = await OrdenTrabajoModel.asignarVehiculo(parseInt(id), vehiculo_id);

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'ASIGNAR_VEHICULO_ORDEN',
            tabla_afectada: 'ordenes_trabajo',
            registro_id: parseInt(id),
            datos_nuevos: { vehiculo_id },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Vehículo ${vehiculo_id} asignado a orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Vehículo asignado correctamente',
            data: orden
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/calendario
 * Vista calendario de órdenes
 */
const getCalendario = async (req, res, next) => {
    try {
        const { desde, hasta } = req.query;

        if (!desde || !hasta) {
            throw new AppError('Debe proporcionar fechas desde y hasta', 400);
        }

        const ordenes = await OrdenTrabajoModel.obtenerCalendario(desde, hasta);

        res.json({
            success: true,
            data: ordenes
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/estadisticas
 * Estadísticas de operaciones
 */
const getEstadisticas = async (req, res, next) => {
    try {
        const { desde, hasta } = req.query;

        const estadisticas = await OrdenTrabajoModel.obtenerEstadisticas(desde, hasta);

        res.json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// ELEMENTOS DE ÓRDENES
// ============================================

/**
 * GET /api/operaciones/ordenes/:id/elementos
 * Obtener elementos de una orden
 */
const getElementosOrden = async (req, res, next) => {
    try {
        const elementos = await OrdenElementoModel.obtenerPorOrden(parseInt(req.params.id));

        res.json({
            success: true,
            data: elementos
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/elementos/:elemId/estado
 * Cambiar estado de un elemento
 */
const cambiarEstadoElemento = async (req, res, next) => {
    try {
        const { elemId } = req.params;
        const { estado } = req.body;

        if (!estado) {
            throw new AppError('El estado es requerido', 400);
        }

        const elemento = await OrdenElementoModel.cambiarEstado(parseInt(elemId), estado);

        logger.info('operaciones', `Estado de elemento ${elemId} cambiado a ${estado} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Estado actualizado',
            data: elemento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/operaciones/ordenes/:id/elementos/:elemId/incidencia
 * Reportar incidencia en un elemento
 */
const reportarIncidencia = async (req, res, next) => {
    try {
        const { elemId } = req.params;
        const { tipo, descripcion, severidad } = req.body;

        if (!tipo || !descripcion) {
            throw new AppError('Tipo y descripción son requeridos', 400);
        }

        const incidencia = await OrdenElementoModel.registrarIncidencia(parseInt(elemId), {
            tipo,
            descripcion,
            severidad,
            reportado_por: req.usuario.id
        });

        // Crear alerta si es severidad alta o crítica
        if (severidad === 'alta' || severidad === 'critica') {
            const elemento = await OrdenElementoModel.obtenerPorId(parseInt(elemId));
            await AlertaModel.crear({
                orden_id: elemento.orden_id,
                tipo: 'incidencia',
                severidad: severidad === 'critica' ? 'critica' : 'alta',
                titulo: `Incidencia en elemento: ${elemento.elemento_nombre}`,
                mensaje: descripcion,
                datos: { elementoId: elemId, incidenciaId: incidencia.id }
            });
        }

        logger.info('operaciones', `Incidencia reportada en elemento ${elemId} por ${req.usuario.email}`);

        res.status(201).json({
            success: true,
            message: 'Incidencia reportada',
            data: incidencia
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/operaciones/ordenes/:id/elementos/:elemId/foto
 * Subir foto de elemento
 */
const subirFotoElemento = async (req, res, next) => {
    try {
        const { elemId } = req.params;
        const { url_foto, tipo, descripcion } = req.body;

        if (!url_foto) {
            throw new AppError('La URL de la foto es requerida', 400);
        }

        const foto = await OrdenElementoModel.subirFoto(parseInt(elemId), {
            url_foto,
            tipo,
            descripcion,
            subido_por: req.usuario.id
        });

        res.status(201).json({
            success: true,
            message: 'Foto subida correctamente',
            data: foto
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// ALERTAS
// ============================================

/**
 * GET /api/operaciones/alertas
 * Listar alertas
 */
const getAlertas = async (req, res, next) => {
    try {
        const filtros = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            tipo: req.query.tipo,
            severidad: req.query.severidad,
            estado: req.query.estado,
            orden_id: req.query.orden_id ? parseInt(req.query.orden_id) : null,
            ordenar: req.query.ordenar,
            direccion: req.query.direccion
        };

        const resultado = await AlertaModel.obtenerTodas(filtros);

        res.json({
            success: true,
            data: resultado.alertas,
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
 * GET /api/operaciones/alertas/pendientes
 * Obtener alertas pendientes
 */
const getAlertasPendientes = async (req, res, next) => {
    try {
        const alertas = await AlertaModel.obtenerPendientes();

        res.json({
            success: true,
            data: alertas
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/alertas/resumen
 * Obtener resumen de alertas
 */
const getResumenAlertas = async (req, res, next) => {
    try {
        const resumen = await AlertaModel.obtenerResumen();

        res.json({
            success: true,
            data: resumen
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/alertas/:id/resolver
 * Resolver alerta
 */
const resolverAlerta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notas_resolucion, estado = 'resuelta' } = req.body;

        const alerta = await AlertaModel.resolver(parseInt(id), {
            resuelta_por: req.usuario.id,
            notas_resolucion,
            estado
        });

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'RESOLVER_ALERTA',
            tabla_afectada: 'alertas_operaciones',
            registro_id: parseInt(id),
            datos_nuevos: { estado, notas_resolucion },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Alerta ${id} resuelta por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Alerta resuelta correctamente',
            data: alerta
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// VALIDACIÓN
// ============================================

/**
 * POST /api/operaciones/validar-fecha
 * Validar cambio de fecha (sin aplicar)
 */
const validarCambioFecha = async (req, res, next) => {
    try {
        const { orden_id, fecha } = req.body;

        if (!orden_id || !fecha) {
            throw new AppError('orden_id y fecha son requeridos', 400);
        }

        const validacion = await ValidadorFechasService.validarCambioFecha(orden_id, fecha);

        res.json({
            success: true,
            data: validacion
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Órdenes
    getOrdenes,
    getOrdenById,
    getOrdenesPorAlquiler,
    updateOrden,
    cambiarFechaOrden,
    cambiarEstadoOrden,
    asignarEquipo,
    asignarVehiculo,
    getCalendario,
    getEstadisticas,

    // Elementos
    getElementosOrden,
    cambiarEstadoElemento,
    reportarIncidencia,
    subirFotoElemento,

    // Alertas
    getAlertas,
    getAlertasPendientes,
    getResumenAlertas,
    resolverAlerta,

    // Validación
    validarCambioFecha
};
