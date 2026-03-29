const { pool } = require('../../../config/database');
const OrdenTrabajoModel = require('../models/OrdenTrabajoModel');
const OrdenElementoModel = require('../models/OrdenElementoModel');
const AlertaModel = require('../models/AlertaModel');
const FotoOperacionModel = require('../models/FotoOperacionModel');
const ValidadorFechasService = require('../services/ValidadorFechasService');
const SincronizacionAlquilerService = require('../services/SincronizacionAlquilerService');
const AuthModel = require('../../auth/models/AuthModel');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');
const { uploadOperacionImagen, deleteImageFile } = require('../../../middleware/upload');
const path = require('path');
const fs = require('fs');

// ============================================
// ÓRDENES DE TRABAJO
// ============================================

/**
 * GET /api/operaciones/ordenes
 * Listar órdenes de trabajo
 */
const getOrdenes = async (req, res, next) => {
    try {
        const esAdminOGerente = ['admin', 'gerente'].includes(req.usuario.rol_nombre);

        const filtros = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            buscar: req.query.buscar || null,
            tipo: req.query.tipo,
            estado: req.query.estado,
            excluir_finalizados: req.query.excluir_finalizados === 'true',
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            alquiler_id: req.query.alquiler_id ? parseInt(req.query.alquiler_id) : null,
            empleado_id: req.query.empleado_id ? parseInt(req.query.empleado_id) : null,
            vehiculo_id: req.query.vehiculo_id ? parseInt(req.query.vehiculo_id) : null,
            ordenar: req.query.ordenar,
            direccion: req.query.direccion,
            sin_responsable: req.query.sin_responsable === 'true'
        };

        // Visibilidad: no-admin solo ve sus ordenes asignadas (o las sin asignar)
        if (!esAdminOGerente && !filtros.sin_responsable) {
            filtros.empleado_id = req.usuario.id;
        }

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
 * GET /api/operaciones/ordenes/:id/completa
 * Obtener orden completa con toda la información de cotización
 * Incluye: productos, transporte, elementos del alquiler
 */
const getOrdenCompleta = async (req, res, next) => {
    try {
        const orden = await OrdenTrabajoModel.obtenerOrdenCompleta(parseInt(req.params.id));

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

        const estadoAnterior = ordenAnterior.estado;

        // Validar: desmontaje no puede avanzar más allá de confirmado si montaje no está completado
        if (ordenAnterior.tipo === 'desmontaje' && ['en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso', 'en_retorno', 'descargue', 'completado'].includes(estado)) {
            const [montajeRows] = await pool.query(
                `SELECT id, estado FROM ordenes_trabajo WHERE alquiler_id = ? AND tipo = 'montaje' AND estado != 'cancelado' LIMIT 1`,
                [ordenAnterior.alquiler_id]
            );
            if (montajeRows.length > 0 && montajeRows[0].estado !== 'completado') {
                throw new AppError('No se puede avanzar el desmontaje hasta que el montaje esté completado', 409);
            }
        }

        // Validar: para pasar de en_proceso a en_retorno, el checklist de recogida debe estar completo
        if (ordenAnterior.tipo === 'desmontaje' && estado === 'en_retorno') {
            const checklistData = await OrdenElementoModel.obtenerChecklistOrden(parseInt(id));
            if (checklistData.totalElementos > 0 && checklistData.verificadosRecogida < checklistData.totalElementos) {
                throw new AppError(
                    `Debes completar el Checklist de Recogida antes de iniciar el retorno (${checklistData.verificadosRecogida}/${checklistData.totalElementos} verificados)`,
                    409
                );
            }
        }

        // Validar: para pasar de descargue a completado, el checklist en bodega debe estar completo
        if (ordenAnterior.tipo === 'desmontaje' && estado === 'completado') {
            const checklistData = await OrdenElementoModel.obtenerChecklistOrden(parseInt(id));
            if (checklistData.totalElementos > 0 && checklistData.verificadosBodega < checklistData.totalElementos) {
                throw new AppError(
                    `Debes completar el Checklist en Bodega antes de finalizar (${checklistData.verificadosBodega}/${checklistData.totalElementos} verificados)`,
                    409
                );
            }
        }

        const orden = await OrdenTrabajoModel.cambiarEstado(parseInt(id), estado);

        // Registrar en historial de estados para conteo de tiempos
        await OrdenTrabajoModel.registrarCambioEstado(
            parseInt(id), estadoAnterior, estado, req.usuario.id
        );

        // ========================================
        // SINCRONIZACIÓN BIDIRECCIONAL
        // Actualizar estado del alquiler si corresponde
        // ========================================
        let sincronizacion = null;
        if (ordenAnterior.alquiler_id) {
            sincronizacion = await SincronizacionAlquilerService.sincronizarEstadoAlquiler(
                parseInt(id),
                estado,
                estadoAnterior
            );

            if (sincronizacion.sincronizado) {
                logger.info('operaciones', `Sincronización: Alquiler ${sincronizacion.alquiler_id} → ${sincronizacion.estado_nuevo}`);
            }
        }

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'CAMBIAR_ESTADO_ORDEN',
            tabla_afectada: 'ordenes_trabajo',
            registro_id: parseInt(id),
            datos_anteriores: { estado: estadoAnterior },
            datos_nuevos: { estado, sincronizacion: sincronizacion?.sincronizado ? sincronizacion : null },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Estado de orden ${id} cambiado a ${estado} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Estado actualizado correctamente',
            data: orden,
            sincronizacion: sincronizacion
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/equipo
 * Asignar equipo a la orden (crea alertas para nuevos asignados)
 */
const asignarEquipo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { empleados } = req.body;

        if (!empleados || !Array.isArray(empleados)) {
            throw new AppError('Debe proporcionar un array de empleados', 400);
        }

        const ordenId = parseInt(id);

        // Obtener equipo actual para detectar nuevos asignados
        const ordenAntes = await OrdenTrabajoModel.obtenerPorId(ordenId);
        const idsActuales = new Set((ordenAntes?.equipo || []).map(e => e.empleado_id || e.id));

        const equipo = await OrdenTrabajoModel.asignarEquipo(ordenId, empleados);

        // Crear alertas para los nuevos asignados
        const nuevosEmpleados = empleados.filter(e => !idsActuales.has(e.empleado_id));
        if (nuevosEmpleados.length > 0 && ordenAntes) {
            // Obtener info de la orden para la alerta
            const [cotInfo] = await pool.query(`
                SELECT cot.evento_nombre, ot.tipo as orden_tipo, ot.fecha_programada
                FROM ordenes_trabajo ot
                LEFT JOIN alquileres a ON ot.alquiler_id = a.id
                LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id
                WHERE ot.id = ?
            `, [ordenId]);
            const info = cotInfo[0] || {};

            for (const emp of nuevosEmpleados) {
                await AlertaModel.crearAlertaAsignacion(ordenId, emp.empleado_id, {
                    ordenTipo: info.orden_tipo || 'operación',
                    eventoNombre: info.evento_nombre,
                    fechaProgramada: info.fecha_programada ? new Date(info.fecha_programada).toLocaleDateString('es-CO') : 'sin fecha',
                    asignadoPor: `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() || req.usuario.email
                });
            }
        }

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'ASIGNAR_EQUIPO_ORDEN',
            tabla_afectada: 'orden_trabajo_equipo',
            registro_id: ordenId,
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
 * POST /api/operaciones/ordenes/:id/auto-asignar
 * El empleado se asigna a sí mismo como responsable
 */
const autoAsignarse = async (req, res, next) => {
    try {
        const ordenId = parseInt(req.params.id);
        const empleadoId = req.usuario.id;

        const equipo = await OrdenTrabajoModel.agregarResponsable(ordenId, empleadoId, 'responsable');

        // Auto-asignación se acepta automáticamente
        await pool.query(`
            UPDATE orden_trabajo_equipo
            SET estado_asignacion = 'aceptada', fecha_respuesta = CURRENT_TIMESTAMP
            WHERE orden_id = ? AND empleado_id = ?
        `, [ordenId, empleadoId]);

        await AuthModel.registrarAuditoria({
            empleado_id: empleadoId,
            accion: 'AUTO_ASIGNAR_ORDEN',
            tabla_afectada: 'orden_trabajo_equipo',
            registro_id: ordenId,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Empleado ${req.usuario.email} se auto-asignó a orden ${ordenId}`);

        res.json({
            success: true,
            message: 'Te has asignado correctamente a esta orden',
            data: equipo
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return next(new AppError('Ya estás asignado a esta orden', 409));
        }
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/responder-asignacion
 * El empleado acepta o rechaza su asignación
 */
const responderAsignacion = async (req, res, next) => {
    try {
        const ordenId = parseInt(req.params.id);
        const empleadoId = req.usuario.id;
        const { respuesta, motivo } = req.body;

        if (!['aceptada', 'rechazada'].includes(respuesta)) {
            throw new AppError('La respuesta debe ser "aceptada" o "rechazada"', 400);
        }

        const orden = await OrdenTrabajoModel.responderAsignacion(
            ordenId, empleadoId, respuesta, motivo
        );

        // Si rechazó, crear alerta para admin/gerente y resolver la alerta de asignación
        if (respuesta === 'rechazada') {
            const empleadoNombre = `${req.usuario.nombre || ''} ${req.usuario.apellido || ''}`.trim() || req.usuario.email;
            await AlertaModel.crearAlertaRechazoAsignacion(ordenId, empleadoNombre, motivo);
        }

        // Resolver la alerta de asignación original
        const alertasEmpleado = await AlertaModel.obtenerPorDestinatario(empleadoId);
        const alertaAsignacion = alertasEmpleado.find(
            a => a.orden_id === ordenId && a.tipo === 'asignacion'
        );
        if (alertaAsignacion) {
            await AlertaModel.resolver(alertaAsignacion.id, {
                resuelta_por: empleadoId,
                notas_resolucion: respuesta === 'aceptada' ? 'Asignación aceptada' : `Rechazada: ${motivo}`,
                estado: 'resuelta'
            });
        }

        await AuthModel.registrarAuditoria({
            empleado_id: empleadoId,
            accion: respuesta === 'aceptada' ? 'ACEPTAR_ASIGNACION' : 'RECHAZAR_ASIGNACION',
            tabla_afectada: 'orden_trabajo_equipo',
            registro_id: ordenId,
            datos_nuevos: { respuesta, motivo },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones',
            `Empleado ${req.usuario.email} ${respuesta === 'aceptada' ? 'aceptó' : 'rechazó'} asignación en orden ${ordenId}`
        );

        res.json({
            success: true,
            message: respuesta === 'aceptada'
                ? 'Asignación aceptada correctamente'
                : 'Asignación rechazada. Se ha notificado al administrador.',
            data: orden
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/mis-alertas
 * Obtener alertas pendientes del empleado actual
 */
const getMisAlertas = async (req, res, next) => {
    try {
        const alertas = await AlertaModel.obtenerPorDestinatario(req.usuario.id);

        res.json({
            success: true,
            data: alertas,
            total: alertas.length
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

        const opciones = {};
        if (!['admin', 'gerente'].includes(req.usuario.rol_nombre)) {
            opciones.empleadoId = req.usuario.id;
        }
        if (req.query.sin_responsable === 'true' && ['admin', 'gerente'].includes(req.usuario.rol_nombre)) {
            opciones.sinResponsable = true;
        }

        const ordenes = await OrdenTrabajoModel.obtenerCalendario(desde, hasta, opciones);

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
 * PUT /api/operaciones/ordenes/:id/elementos/estado-masivo
 * Cambiar estado de múltiples elementos a la vez
 * Permite operaciones masivas para agilizar el proceso
 */
const cambiarEstadoElementosMasivo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { elemento_ids, estado } = req.body;

        if (!elemento_ids || !Array.isArray(elemento_ids) || elemento_ids.length === 0) {
            throw new AppError('Debe proporcionar un array de elemento_ids', 400);
        }

        if (!estado) {
            throw new AppError('El estado es requerido', 400);
        }

        const resultado = await OrdenElementoModel.cambiarEstadoMasivo(
            parseInt(id),
            elemento_ids.map(eId => parseInt(eId)),
            estado
        );

        logger.info('operaciones', `${resultado.actualizados} elementos cambiados a ${estado} en orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: `${resultado.actualizados} elemento(s) actualizado(s) a "${estado}"`,
            data: resultado
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

/**
 * POST /api/operaciones/alertas
 * Crear alerta manual (ej: insuficiencia de inventario)
 */
const crearAlerta = async (req, res, next) => {
    try {
        const { orden_id, tipo, severidad, titulo, mensaje } = req.body;

        if (!tipo || !titulo || !mensaje) {
            throw new AppError('Se requiere tipo, titulo y mensaje', 400);
        }

        const alerta = await AlertaModel.crear({
            orden_id: orden_id || null,
            tipo,
            severidad: severidad || 'alta',
            titulo,
            mensaje
        });

        logger.info('operaciones', `Alerta creada: "${titulo}" por ${req.usuario.email}`);

        res.status(201).json({
            success: true,
            message: 'Alerta creada correctamente',
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

/**
 * POST /api/operaciones/ordenes
 * Crear orden manual (mantenimiento, traslado, revisión, etc.)
 */
const crearOrdenManual = async (req, res, next) => {
    try {
        const {
            tipo,
            fecha_programada,
            direccion_destino,
            ciudad_destino,
            notas,
            prioridad = 'normal',
            elementos = []
        } = req.body;

        // Validar campos requeridos
        if (!tipo) {
            throw new AppError('El tipo de orden es requerido', 400);
        }

        if (!fecha_programada) {
            throw new AppError('La fecha programada es requerida', 400);
        }

        // Validar tipo de orden
        const tiposValidos = ['mantenimiento', 'traslado', 'revision', 'inventario', 'otro'];
        if (!tiposValidos.includes(tipo)) {
            throw new AppError(`Tipo inválido. Valores permitidos: ${tiposValidos.join(', ')}`, 400);
        }

        // Crear la orden
        const orden = await OrdenTrabajoModel.crear({
            alquiler_id: null, // Orden manual sin alquiler
            tipo,
            fecha_programada,
            direccion_evento: direccion_destino || null,
            ciudad_evento: ciudad_destino || null,
            notas,
            prioridad,
            creado_por: req.usuario.id
        });

        // Agregar elementos si se proporcionaron
        if (elementos.length > 0) {
            for (const elem of elementos) {
                await pool.query(`
                    INSERT INTO orden_trabajo_elementos
                    (orden_id, elemento_id, serie_id, lote_id, cantidad, estado)
                    VALUES (?, ?, ?, ?, ?, 'pendiente')
                `, [
                    orden.id,
                    elem.elemento_id,
                    elem.serie_id || null,
                    elem.lote_id || null,
                    elem.cantidad || 1
                ]);
            }
        }

        await AuthModel.registrarAuditoria({
            empleado_id: req.usuario.id,
            accion: 'CREAR_ORDEN_MANUAL',
            tabla_afectada: 'ordenes_trabajo',
            registro_id: orden.id,
            datos_nuevos: { tipo, fecha_programada, elementos: elementos.length },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        logger.info('operaciones', `Orden manual ${orden.id} creada por ${req.usuario.email}`);

        // Obtener la orden completa con elementos
        const ordenCompleta = await OrdenTrabajoModel.obtenerPorId(orden.id);

        res.status(201).json({
            success: true,
            message: 'Orden creada correctamente',
            data: ordenCompleta
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// PREPARACIÓN Y EJECUCIÓN DE ÓRDENES
// ============================================

/**
 * GET /api/operaciones/ordenes/:id/elementos-disponibles
 * Obtener elementos disponibles para asignar a la orden
 */
const getElementosDisponibles = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resultado = await SincronizacionAlquilerService.obtenerElementosDisponibles(parseInt(id));

        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/operaciones/ordenes/:id/preparar-elementos
 * Asignar elementos (series/lotes) a la orden
 */
const prepararElementos = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { elementos } = req.body;

        if (!elementos || !Array.isArray(elementos) || elementos.length === 0) {
            throw new AppError('Debe proporcionar al menos un elemento', 400);
        }

        const resultado = await SincronizacionAlquilerService.asignarElementosAOrden(
            parseInt(id),
            elementos
        );

        logger.info('operaciones', `Elementos preparados para orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: resultado.mensaje,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/operaciones/ordenes/:id/ejecutar-salida
 * Ejecutar salida de elementos (montaje inicia)
 */
const ejecutarSalida = async (req, res, next) => {
    try {
        const { id } = req.params;
        const datos = req.body;

        // Obtener estado anterior para historial
        const ordenAntes = await OrdenTrabajoModel.obtenerPorId(parseInt(id));
        const estadoAnterior = ordenAntes?.estado;

        const resultado = await SincronizacionAlquilerService.ejecutarSalida(
            parseInt(id),
            datos
        );

        // Registrar transición de estado (salida → en_ruta)
        await OrdenTrabajoModel.registrarCambioEstado(
            parseInt(id), estadoAnterior, 'en_ruta', req.usuario.id
        );

        logger.info('operaciones', `Salida ejecutada - Orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: resultado.mensaje,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/operaciones/ordenes/:id/ejecutar-retorno
 * Registrar retorno de elementos (desmontaje finaliza)
 */
const ejecutarRetorno = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { retornos } = req.body;

        if (!retornos || !Array.isArray(retornos) || retornos.length === 0) {
            throw new AppError('Debe proporcionar el estado de retorno de los elementos', 400);
        }

        // Obtener estado anterior para historial
        const ordenAntes = await OrdenTrabajoModel.obtenerPorId(parseInt(id));
        const estadoAnterior = ordenAntes?.estado;

        // Validar que el checklist en bodega esté completo antes de ejecutar retorno
        if (ordenAntes?.tipo === 'desmontaje') {
            const checklistData = await OrdenElementoModel.obtenerChecklistOrden(parseInt(id));
            if (checklistData.totalElementos > 0 && checklistData.verificadosBodega < checklistData.totalElementos) {
                throw new AppError(
                    `Debes completar el Checklist en Bodega antes de ejecutar el retorno (${checklistData.verificadosBodega}/${checklistData.totalElementos} verificados)`,
                    409
                );
            }
        }

        const resultado = await SincronizacionAlquilerService.ejecutarRetorno(
            parseInt(id),
            retornos
        );

        // Registrar transición de estado (retorno → completado)
        await OrdenTrabajoModel.registrarCambioEstado(
            parseInt(id), estadoAnterior, 'completado', req.usuario.id
        );

        logger.info('operaciones', `Retorno ejecutado - Orden ${id} por ${req.usuario.email}`);

        // Verificar si el retorno de inventario resuelve alertas de disponibilidad pendientes
        // Se ejecuta en background para no retrasar la respuesta al operador
        SincronizacionAlquilerService.verificarAlertasDisponibilidad()
            .then(verificacion => {
                if (verificacion.resueltas > 0) {
                    logger.info('operaciones', `Post-retorno: ${verificacion.resueltas} alerta(s) de disponibilidad resueltas`);
                }
            })
            .catch(err => {
                logger.error('operaciones', `Error en verificación post-retorno: ${err.message}`);
            });

        res.json({
            success: true,
            message: resultado.mensaje,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/alquiler/:id/sincronizacion
 * Obtener estado de sincronización de un alquiler
 */
const getEstadoSincronizacion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const estado = await SincronizacionAlquilerService.obtenerEstadoSincronizacion(parseInt(id));

        if (!estado) {
            throw new AppError('Alquiler no encontrado', 404);
        }

        res.json({
            success: true,
            data: estado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/alquiler/:id/verificar-consistencia
 * Verificar consistencia entre orden y alquiler
 */
const verificarConsistencia = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reporte = await SincronizacionAlquilerService.verificarConsistencia(parseInt(id));

        res.json({
            success: true,
            data: reporte
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/ordenes/:id/alertas
 * Obtener alertas asociadas a una orden de trabajo
 */
const getAlertasPorOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const alertas = await AlertaModel.obtenerPorOrden(parseInt(id));

        res.json({
            success: true,
            data: alertas
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// INVENTARIO CLIENTE
// ============================================

/**
 * GET /api/operaciones/ordenes/:id/inventario-cliente
 * Generar documento de inventario para el cliente después de montaje completado
 */
const getInventarioCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const inventario = await OrdenTrabajoModel.generarInventarioCliente(parseInt(id));

        res.json({
            success: true,
            data: inventario
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// DURACIONES Y HISTORIAL DE ESTADOS
// ============================================

/**
 * GET /api/operaciones/ordenes/:id/duraciones
 * Obtener historial de estados y duraciones calculadas
 */
const getDuracionesOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resultado = await OrdenTrabajoModel.calcularDuraciones(parseInt(id));

        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// CHECKLIST DE CARGUE / DESCARGUE
// ============================================

/**
 * GET /api/operaciones/ordenes/:id/checklist
 * Obtener estado del checklist de la orden
 */
const getChecklistOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const checklist = await OrdenElementoModel.obtenerChecklistOrden(parseInt(id));

        res.json({
            success: true,
            data: checklist
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/elementos/:elemId/verificar-cargue
 * Toggle verificación de cargue de un elemento individual
 */
const verificarElementoCargue = async (req, res, next) => {
    try {
        const { id, elemId } = req.params;
        const { verificado, notas } = req.body;

        if (typeof verificado !== 'boolean') {
            throw new AppError('El campo "verificado" (boolean) es requerido', 400);
        }

        const elemento = await OrdenElementoModel.toggleVerificacionCargue(
            parseInt(elemId),
            verificado,
            notas || null
        );

        logger.info('operaciones', `Elemento ${elemId} ${verificado ? 'verificado' : 'desverificado'} para cargue en orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: verificado ? 'Elemento marcado como cargado' : 'Verificación de cargue removida',
            data: elemento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/elementos/:elemId/verificar-descargue
 * Toggle verificación de descargue de un elemento individual
 */
const verificarElementoDescargue = async (req, res, next) => {
    try {
        const { id, elemId } = req.params;
        const { verificado, notas } = req.body;

        if (typeof verificado !== 'boolean') {
            throw new AppError('El campo "verificado" (boolean) es requerido', 400);
        }

        const elemento = await OrdenElementoModel.toggleVerificacionDescargue(
            parseInt(elemId),
            verificado,
            notas || null
        );

        logger.info('operaciones', `Elemento ${elemId} ${verificado ? 'verificado' : 'desverificado'} para descargue en orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: verificado ? 'Elemento marcado como descargado' : 'Verificación de descargue removida',
            data: elemento
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/operaciones/ordenes/:id/elementos/:elemId/verificar-bodega
 * Toggle verificación en bodega de un elemento individual
 */
const verificarElementoBodega = async (req, res, next) => {
    try {
        const { id, elemId } = req.params;
        const { verificado, notas } = req.body;

        if (typeof verificado !== 'boolean') {
            throw new AppError('El campo "verificado" (boolean) es requerido', 400);
        }

        const elemento = await OrdenElementoModel.toggleVerificacionBodega(
            parseInt(elemId),
            verificado,
            notas || null
        );

        logger.info('operaciones', `Elemento ${elemId} ${verificado ? 'verificado' : 'desverificado'} en bodega para orden ${id} por ${req.usuario.email}`);

        res.json({
            success: true,
            message: verificado ? 'Elemento verificado en bodega' : 'Verificación en bodega removida',
            data: elemento
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// FOTOS OPERATIVAS
// ============================================

/**
 * POST /api/operaciones/ordenes/:id/fotos
 * Subir foto de una etapa operativa
 */
const subirFotoOrden = async (req, res, next) => {
    uploadOperacionImagen(req, res, async (err) => {
        try {
            if (err) {
                throw new AppError(err.message || 'Error al subir imagen', 400);
            }

            const { id } = req.params;
            const { etapa, notas } = req.body;

            if (!etapa) {
                throw new AppError('La etapa es requerida', 400);
            }

            if (!req.file) {
                throw new AppError('La imagen es requerida', 400);
            }

            const imagen_url = `/uploads/operaciones/${req.file.filename}`;

            const foto = await FotoOperacionModel.crear({
                orden_id: parseInt(id),
                etapa,
                imagen_url,
                notas: notas || null,
                subido_por: req.usuario.id
            });

            logger.info('operaciones', `Foto subida para orden ${id}, etapa ${etapa} por ${req.usuario.email}`);

            res.status(201).json({
                success: true,
                message: 'Foto subida correctamente',
                data: foto
            });
        } catch (error) {
            next(error);
        }
    });
};

/**
 * GET /api/operaciones/ordenes/:id/fotos
 * Obtener fotos de una orden agrupadas por etapa
 */
const obtenerFotosOrden = async (req, res, next) => {
    try {
        const { id } = req.params;
        const resultado = await FotoOperacionModel.obtenerPorOrden(parseInt(id));

        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/operaciones/ordenes/:id/fotos/:fotoId
 * Eliminar foto de una orden
 */
const eliminarFotoOrden = async (req, res, next) => {
    try {
        const { fotoId } = req.params;
        const foto = await FotoOperacionModel.eliminar(parseInt(fotoId));

        if (!foto) {
            throw new AppError('Foto no encontrada', 404);
        }

        // Eliminar archivo físico
        deleteImageFile(foto.imagen_url);

        logger.info('operaciones', `Foto ${fotoId} eliminada por ${req.usuario.email}`);

        res.json({
            success: true,
            message: 'Foto eliminada correctamente'
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// FIRMA CLIENTE
// ============================================

/**
 * POST /api/operaciones/ordenes/:id/firma-cliente
 * Guardar firma digital del cliente
 */
const guardarFirmaCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firma, nombre } = req.body;

        if (!firma) {
            throw new AppError('La firma es requerida', 400);
        }

        if (!nombre || !nombre.trim()) {
            throw new AppError('El nombre del firmante es requerido', 400);
        }

        // Guardar firma base64 como archivo
        const firmasDir = path.join(__dirname, '../../../uploads/operaciones/firmas');
        if (!fs.existsSync(firmasDir)) {
            fs.mkdirSync(firmasDir, { recursive: true });
        }

        const base64Data = firma.replace(/^data:image\/\w+;base64,/, '');
        const filename = `firma_${id}_${Date.now()}.png`;
        const filePath = path.join(firmasDir, filename);
        fs.writeFileSync(filePath, base64Data, 'base64');

        const firma_url = `/uploads/operaciones/firmas/${filename}`;

        // Actualizar orden con firma
        await pool.query(
            `UPDATE ordenes_trabajo
             SET firma_cliente_url = ?, firma_cliente_fecha = NOW(), firma_cliente_nombre = ?
             WHERE id = ?`,
            [firma_url, nombre.trim(), parseInt(id)]
        );

        logger.info('operaciones', `Firma cliente guardada para orden ${id} por ${req.usuario.email}`);

        res.status(201).json({
            success: true,
            message: 'Firma guardada correctamente',
            data: {
                firma_cliente_url: firma_url,
                firma_cliente_nombre: nombre.trim(),
                firma_cliente_fecha: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/operaciones/ordenes/:id/firma-cliente
 * Obtener firma del cliente
 */
const obtenerFirmaCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT firma_cliente_url, firma_cliente_fecha, firma_cliente_nombre
             FROM ordenes_trabajo WHERE id = ?`,
            [parseInt(id)]
        );

        if (rows.length === 0) {
            throw new AppError('Orden no encontrada', 404);
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Órdenes
    getOrdenes,
    getOrdenById,
    getOrdenCompleta,
    getOrdenesPorAlquiler,
    crearOrdenManual,
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
    cambiarEstadoElementosMasivo,
    reportarIncidencia,
    subirFotoElemento,

    // Inventario Cliente
    getInventarioCliente,

    // Duraciones
    getDuracionesOrden,

    // Checklist
    getChecklistOrden,
    verificarElementoCargue,
    verificarElementoDescargue,
    verificarElementoBodega,

    // Alertas
    getAlertas,
    getAlertasPendientes,
    getResumenAlertas,
    getAlertasPorOrden,
    resolverAlerta,
    crearAlerta,

    // Validación
    validarCambioFecha,

    // Preparación y Ejecución
    getElementosDisponibles,
    prepararElementos,
    ejecutarSalida,
    ejecutarRetorno,

    // Sincronización
    getEstadoSincronizacion,
    verificarConsistencia,

    // Fotos operativas
    subirFotoOrden,
    obtenerFotosOrden,
    eliminarFotoOrden,

    // Firma cliente
    guardarFirmaCliente,
    obtenerFirmaCliente,

    // Asignación responsable
    autoAsignarse,
    responderAsignacion,
    getMisAlertas
};
