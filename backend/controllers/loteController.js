// ============================================
// CONTROLLER: loteController
// Responsabilidad: Lógica de negocio de lotes
// ============================================

const LoteModel = require('../models/LoteModel');
const ElementoModel = require('../models/ElementoModel');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { validateCantidad, validateEstado, validateId } = require('../utils/validators');
const { ESTADOS_VALIDOS, MENSAJES_ERROR, MENSAJES_EXITO, ENTIDADES } = require('../config/constants');
const { pool } = require('../config/database');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../utils/pagination');

// ============================================
// OBTENER TODOS LOS LOTES
// ============================================

/**
 * GET /api/lotes
 *
 * Soporta paginación opcional:
 * - Sin params: Retorna todos los lotes
 * - Con ?page=1&limit=20: Retorna paginado
 * - Con ?search=LOTE-123: Búsqueda por número de lote o elemento
 * - Con ?sortBy=cantidad&order=DESC: Ordenamiento
 * - Con ?paginate=false: Fuerza sin paginación
 */

exports.obtenerTodos = async (req, res, next) => {
    try {
        // Verificar si se debe paginar
        if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
            // MODO PAGINADO
            const { page, limit, offset } = getPaginationParams(req.query);
            const { sortBy, order } = getSortParams(req.query, 'lote_numero');
            const search = req.query.search || null;

            logger.debug('loteController.obtenerTodos', 'Modo paginado', {
                page, limit, offset, sortBy, order, search
            });

            // Obtener datos y total
            const lotes = await LoteModel.obtenerConPaginacion({
                limit,
                offset,
                sortBy,
                order,
                search
            });
            const total = await LoteModel.contarTodos(search);

            // Retornar respuesta paginada
            res.json(getPaginatedResponse(lotes, page, limit, total));
        } else {
            // MODO SIN PAGINACIÓN (retrocompatible)
            const lotes = await LoteModel.obtenerTodos();

            res.json({
                success: true,
                data: lotes,
                total: lotes.length
            });
        }
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER LOTE POR ID
// ============================================
exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lote = await LoteModel.obtenerPorId(id);

        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        res.json({
            success: true,
            data: lote
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER LOTES DE UN ELEMENTO
// ============================================
exports.obtenerPorElemento = async (req, res, next) => {
    try {
        const { elementoId } = req.params;

        // Validar elementoId
        validateId(elementoId, 'ID de elemento');

        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(elementoId);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // Verificar que NO requiere series
        if (elemento.requiere_series) {
            throw new AppError(
                'Este elemento requiere series individuales. Use el endpoint /api/series',
                400
            );
        }

        // Obtener lotes
        const lotes = await LoteModel.obtenerPorElemento(elementoId);

        // Obtener estadísticas
        const stats = await LoteModel.obtenerEstadisticas(elementoId);

        res.json({
            success: true,
            elemento: {
                id: elemento.id,
                nombre: elemento.nombre,
                cantidad_total: elemento.cantidad
            },
            estadisticas: stats,
            lotes: lotes,
            total_lotes: lotes.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER LOTES POR ESTADO
// ============================================
exports.obtenerPorEstado = async (req, res, next) => {
    try {
        const { estado } = req.params;

        // Validar estado
        const estadoValidado = validateEstado(estado, true);

        const lotes = await LoteModel.obtenerPorEstado(estadoValidado);

        res.json({
            success: true,
            estado: estadoValidado,
            data: lotes,
            total: lotes.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// CREAR LOTE MANUALMENTE
// ============================================
exports.crear = async (req, res, next) => {
    try {
        const { elemento_id, cantidad, estado, ubicacion, lote_numero } = req.body;

        logger.info('loteController.crear', 'Creando nuevo lote', { elemento_id, cantidad });

        // ============================================
        // VALIDACIONES
        // ============================================

        const elementoIdValidado = validateId(elemento_id, 'elemento_id');
        const cantidadValidada = validateCantidad(cantidad, 'Cantidad');
        const estadoValidado = estado ? validateEstado(estado, false) : 'bueno';

        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(elementoIdValidado);
        if (!elemento) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.ELEMENTO), 404);
        }

        // Verificar que NO requiere series
        if (elemento.requiere_series) {
            throw new AppError(
                'Este elemento requiere series individuales, no puede usar lotes',
                400
            );
        }

        // ============================================
        // CREAR LOTE
        // ============================================

        const nuevoId = await LoteModel.crear({
            elemento_id: elementoIdValidado,
            lote_numero: lote_numero || `LOTE-${Date.now()}`,
            cantidad: cantidadValidada,
            estado: estadoValidado,
            ubicacion: ubicacion || null
        });

        // Obtener el lote creado
        const nuevoLote = await LoteModel.obtenerPorId(nuevoId);

        logger.info('loteController.crear', 'Lote creado exitosamente', {
            id: nuevoId,
            lote_numero: nuevoLote.lote_numero
        });

        res.status(201).json({
            success: true,
            mensaje: MENSAJES_EXITO.CREADO(ENTIDADES.LOTE),
            data: nuevoLote
        });
    } catch (error) {
        logger.error('loteController.crear', error);
        next(error);
    }
};

// ============================================
// MOVER CANTIDAD ENTRE LOTES (Función Principal)
// ============================================
/**
 * MOVER CANTIDAD ENTRE LOTES
 *
 * Mueve una cantidad de un lote origen a un lote destino.
 * Si el lote destino no existe, lo crea.
 * Si el lote origen queda vacío, lo elimina.
 * Usa transacciones para garantizar atomicidad.
 *
 * POST /api/lotes/mover
 * Body: { lote_origen_id, cantidad, estado_destino, ubicacion_destino, motivo, descripcion, costo_reparacion }
 */
exports.moverCantidad = async (req, res, next) => {
    const connection = await pool.getConnection();

    try {
        const {
            lote_origen_id,
            cantidad,
            estado_destino,
            ubicacion_destino,
            motivo,
            descripcion,
            costo_reparacion
        } = req.body;

        logger.info('loteController.moverCantidad', 'Iniciando movimiento de lote', {
            lote_origen_id,
            cantidad,
            estado_destino
        });

        // ═══════════════════════════════════════
        // VALIDACIONES
        // ═══════════════════════════════════════

        const loteOrigenId = validateId(lote_origen_id, 'lote_origen_id');
        const cantidadValidada = validateCantidad(cantidad, 'Cantidad');
        const estadoDestinoValidado = validateEstado(estado_destino);

        // Obtener lote origen
        const loteOrigen = await LoteModel.obtenerPorId(loteOrigenId);
        if (!loteOrigen) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO('Lote origen'), 404);
        }

        // Verificar cantidad disponible
        if (loteOrigen.cantidad < cantidadValidada) {
            throw new AppError(
                `Cantidad insuficiente. Disponible: ${loteOrigen.cantidad}, Solicitado: ${cantidadValidada}`,
                400
            );
        }

        // ═══════════════════════════════════════
        // INICIAR TRANSACCIÓN
        // ═══════════════════════════════════════

        await connection.beginTransaction();
        logger.debug('loteController.moverCantidad', 'Transacción iniciada');

        // 1. Buscar o crear lote destino
        let loteDestino = await LoteModel.buscarLoteEspecifico(
            loteOrigen.elemento_id,
            estadoDestinoValidado,
            ubicacion_destino
        );

        let loteDestinoId;
        let loteDestinoCreado = false;

        if (loteDestino) {
            logger.debug('loteController.moverCantidad', 'Lote destino encontrado', {
                lote_destino_id: loteDestino.id
            });

            await LoteModel.sumarCantidad(loteDestino.id, cantidadValidada);
            loteDestinoId = loteDestino.id;
        } else {
            logger.debug('loteController.moverCantidad', 'Creando nuevo lote destino');

            loteDestinoId = await LoteModel.crear({
                elemento_id: loteOrigen.elemento_id,
                cantidad: cantidadValidada,
                estado: estadoDestinoValidado,
                ubicacion: ubicacion_destino,
                lote_numero: `LOTE-${Date.now()}`
            });
            loteDestinoCreado = true;
        }

        // 2. Restar cantidad del lote origen
        await LoteModel.restarCantidad(loteOrigenId, cantidadValidada);
        logger.debug('loteController.moverCantidad', 'Cantidad restada del lote origen');

        // 3. Registrar movimiento en historial
        await LoteModel.registrarMovimiento({
            lote_origen_id: loteOrigenId,
            lote_destino_id: loteDestinoId,
            cantidad: cantidadValidada,
            motivo: motivo || null,
            descripcion: descripcion || null,
            estado_origen: loteOrigen.estado,
            estado_destino: estadoDestinoValidado,
            ubicacion_origen: loteOrigen.ubicacion,
            ubicacion_destino: ubicacion_destino,
            costo_reparacion: costo_reparacion || null
        });
        logger.debug('loteController.moverCantidad', 'Movimiento registrado en historial');

        // 4. Si el lote origen quedó vacío, eliminarlo
        const loteOrigenActualizado = await LoteModel.obtenerPorId(loteOrigenId);
        let loteOrigenEliminado = false;

        if (loteOrigenActualizado && loteOrigenActualizado.cantidad === 0) {
            await LoteModel.eliminar(loteOrigenId);
            loteOrigenEliminado = true;
            logger.debug('loteController.moverCantidad', 'Lote origen eliminado (cantidad = 0)');
        }

        // ═══════════════════════════════════════
        // COMMIT TRANSACCIÓN
        // ═══════════════════════════════════════

        await connection.commit();
        logger.info('loteController.moverCantidad', 'Transacción completada exitosamente', {
            lote_origen_eliminado: loteOrigenEliminado,
            lote_destino_creado: loteDestinoCreado
        });

        // 5. Obtener estado actualizado
        const estadisticas = await LoteModel.obtenerEstadisticas(loteOrigen.elemento_id);
        const lotesActualizados = await LoteModel.obtenerPorElemento(loteOrigen.elemento_id);

        // ═══════════════════════════════════════
        // RESPUESTA
        // ═══════════════════════════════════════

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.MOVIMIENTO_EXITOSO,
            movimiento: {
                cantidad_movida: cantidadValidada,
                estado_origen: loteOrigen.estado,
                estado_destino: estadoDestinoValidado,
                lote_origen_eliminado: loteOrigenEliminado,
                lote_destino_creado: loteDestinoCreado
            },
            estadisticas: estadisticas,
            lotes_actuales: lotesActualizados
        });

    } catch (error) {
        // ═══════════════════════════════════════
        // ROLLBACK EN CASO DE ERROR
        // ═══════════════════════════════════════

        await connection.rollback();
        logger.error('loteController.moverCantidad', error, {
            lote_origen_id: req.body.lote_origen_id,
            cantidad: req.body.cantidad
        });

        next(error);
    } finally {
        connection.release();
        logger.debug('loteController.moverCantidad', 'Conexión liberada');
    }
};

// ============================================
// ACTUALIZAR LOTE (cantidad, ubicación)
// ============================================
exports.actualizar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cantidad, ubicacion } = req.body;

        logger.info('loteController.actualizar', 'Actualizando lote', { id });

        // Obtener lote actual
        const lote = await LoteModel.obtenerPorId(id);
        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        // Actualizar cantidad si se proporciona
        if (cantidad !== undefined) {
            const cantidadValidada = validateCantidad(cantidad, 'Cantidad', false);
            await LoteModel.actualizarCantidad(id, cantidadValidada);

            // Si la cantidad queda en 0, eliminar el lote automáticamente
            if (cantidadValidada === 0) {
                await LoteModel.eliminar(id);
                logger.info('loteController.actualizar', 'Lote eliminado automáticamente (cantidad = 0)', { id });

                return res.json({
                    success: true,
                    mensaje: 'Lote actualizado y eliminado automáticamente (cantidad = 0)',
                    data: null,
                    lote_eliminado: true
                });
            }
        }

        // Si se proporciona ubicación, actualizar
        if (ubicacion !== undefined) {
            await pool.query(
                'UPDATE lotes SET ubicacion = ? WHERE id = ?',
                [ubicacion, id]
            );
        }

        // Obtener lote actualizado
        const loteActualizado = await LoteModel.obtenerPorId(id);

        logger.info('loteController.actualizar', 'Lote actualizado exitosamente', { id });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO(ENTIDADES.LOTE),
            data: loteActualizado
        });
    } catch (error) {
        logger.error('loteController.actualizar', error);
        next(error);
    }
};

// ============================================
// ELIMINAR LOTE
// ============================================
exports.eliminar = async (req, res, next) => {
    try {
        const { id } = req.params;

        logger.info('loteController.eliminar', 'Eliminando lote', { id });

        // Obtener lote para verificar
        const lote = await LoteModel.obtenerPorId(id);
        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        // Advertencia si tiene cantidad
        if (lote.cantidad > 0) {
            throw new AppError(
                `No se puede eliminar un lote con cantidad ${lote.cantidad}. Primero mueva o reduzca la cantidad a 0.`,
                400
            );
        }

        const filasAfectadas = await LoteModel.eliminar(id);

        if (filasAfectadas === 0) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        logger.info('loteController.eliminar', 'Lote eliminado exitosamente', {
            id,
            lote_numero: lote.lote_numero
        });

        res.json({
            success: true,
            mensaje: MENSAJES_EXITO.ELIMINADO(ENTIDADES.LOTE)
        });
    } catch (error) {
        logger.error('loteController.eliminar', error);
        next(error);
    }
};

// ============================================
// OBTENER HISTORIAL DE MOVIMIENTOS
// ============================================
exports.obtenerHistorial = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verificar que el lote existe
        const lote = await LoteModel.obtenerPorId(id);
        if (!lote) {
            throw new AppError(MENSAJES_ERROR.NO_ENCONTRADO(ENTIDADES.LOTE), 404);
        }

        const historial = await LoteModel.obtenerHistorial(id);

        res.json({
            success: true,
            lote: {
                id: lote.id,
                elemento: lote.elemento_nombre,
                cantidad_actual: lote.cantidad,
                estado: lote.estado
            },
            historial: historial,
            total: historial.length
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// OBTENER RESUMEN DE DISPONIBILIDAD
// ============================================
exports.obtenerResumenDisponibilidad = async (req, res, next) => {
    try {
        const query = `
            SELECT
                e.id,
                e.nombre AS elemento,
                e.cantidad AS cantidad_total,
                SUM(CASE WHEN l.estado = 'bueno' THEN l.cantidad ELSE 0 END) AS disponibles,
                SUM(CASE WHEN l.estado = 'alquilado' THEN l.cantidad ELSE 0 END) AS alquilados,
                SUM(CASE WHEN l.estado = 'mantenimiento' THEN l.cantidad ELSE 0 END) AS en_mantenimiento
            FROM elementos e
            LEFT JOIN lotes l ON e.id = l.elemento_id
            WHERE e.requiere_series = FALSE
            GROUP BY e.id, e.nombre, e.cantidad
            HAVING COUNT(l.id) > 0
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query);

        res.json({
            success: true,
            data: rows,
            total: rows.length
        });
    } catch (error) {
        next(error);
    }
};