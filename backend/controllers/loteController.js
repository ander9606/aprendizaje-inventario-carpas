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

// ============================================
// OBTENER TODOS LOS LOTES
// ============================================
exports.obtenerTodos = async (req, res) => {
    try {
        const lotes = await LoteModel.obtenerTodos();
        
        res.json({
            success: true,
            data: lotes,
            total: lotes.length
        });
    } catch (error) {
        console.error('Error en obtenerTodos:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener lotes',
            error: error.message
        });
    }
};

// ============================================
// OBTENER LOTE POR ID
// ============================================
exports.obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const lote = await LoteModel.obtenerPorId(id);
        
        if (!lote) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lote no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: lote
        });
    } catch (error) {
        console.error('Error en obtenerPorId:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener lote',
            error: error.message
        });
    }
};

// ============================================
// OBTENER LOTES DE UN ELEMENTO
// ============================================
exports.obtenerPorElemento = async (req, res) => {
    try {
        const { elementoId } = req.params;
        
        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(elementoId);
        if (!elemento) {
            return res.status(404).json({
                success: false,
                mensaje: 'Elemento no encontrado'
            });
        }
        
        // Verificar que NO requiere series
        if (elemento.requiere_series) {
            return res.status(400).json({
                success: false,
                mensaje: 'Este elemento requiere series individuales. Use el endpoint /api/series'
            });
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
        console.error('Error en obtenerPorElemento:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener lotes del elemento',
            error: error.message
        });
    }
};

// ============================================
// OBTENER LOTES POR ESTADO
// ============================================
exports.obtenerPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        
        // Validar estado
        const estadosValidos = ['nuevo', 'bueno', 'mantenimiento', 'alquilado', 'dañado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Estado inválido',
                estadosValidos
            });
        }
        
        const lotes = await LoteModel.obtenerPorEstado(estado);
        
        res.json({
            success: true,
            estado,
            data: lotes,
            total: lotes.length
        });
    } catch (error) {
        console.error('Error en obtenerPorEstado:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener lotes por estado',
            error: error.message
        });
    }
};

// ============================================
// CREAR LOTE MANUALMENTE
// ============================================
exports.crear = async (req, res) => {
    try {
        const { elemento_id, cantidad, estado, ubicacion, lote_numero } = req.body;
        
        // Validaciones básicas
        if (!elemento_id) {
            return res.status(400).json({
                success: false,
                mensaje: 'El elemento_id es obligatorio'
            });
        }
        
        if (!cantidad || cantidad <= 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'La cantidad debe ser mayor a 0'
            });
        }
        
        // Verificar que el elemento existe
        const elemento = await ElementoModel.obtenerPorId(elemento_id);
        if (!elemento) {
            return res.status(404).json({
                success: false,
                mensaje: 'El elemento no existe'
            });
        }
        
        // Verificar que NO requiere series
        if (elemento.requiere_series) {
            return res.status(400).json({
                success: false,
                mensaje: 'Este elemento requiere series individuales, no puede usar lotes'
            });
        }
        
        // Crear lote
        const nuevoId = await LoteModel.crear({
            elemento_id,
            lote_numero,
            cantidad,
            estado,
            ubicacion
        });
        
        // Obtener el lote creado
        const nuevoLote = await LoteModel.obtenerPorId(nuevoId);
        
        res.status(201).json({
            success: true,
            mensaje: 'Lote creado exitosamente',
            data: nuevoLote
        });
    } catch (error) {
        console.error('Error en crear:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear lote',
            error: error.message
        });
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
exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, ubicacion } = req.body;
        
        // Obtener lote actual
        const lote = await LoteModel.obtenerPorId(id);
        if (!lote) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lote no encontrado'
            });
        }
        
        // Actualizar cantidad si se proporciona
        if (cantidad !== undefined) {
            if (cantidad < 0) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'La cantidad no puede ser negativa'
                });
            }
            
            await LoteModel.actualizarCantidad(id, cantidad);
        }
        
        // Si se proporciona ubicación, actualizar (requiere query diferente)
        if (ubicacion !== undefined) {
            await pool.query(
                'UPDATE lotes SET ubicacion = ? WHERE id = ?',
                [ubicacion, id]
            );
        }
        
        // Obtener lote actualizado
        const loteActualizado = await LoteModel.obtenerPorId(id);
        
        res.json({
            success: true,
            mensaje: 'Lote actualizado exitosamente',
            data: loteActualizado
        });
    } catch (error) {
        console.error('Error en actualizar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar lote',
            error: error.message
        });
    }
};

// ============================================
// ELIMINAR LOTE
// ============================================
exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener lote para verificar
        const lote = await LoteModel.obtenerPorId(id);
        if (!lote) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lote no encontrado'
            });
        }
        
        // Advertencia si tiene cantidad
        if (lote.cantidad > 0) {
            return res.status(400).json({
                success: false,
                mensaje: `No se puede eliminar un lote con cantidad ${lote.cantidad}. Primero mueva o reduzca la cantidad a 0.`
            });
        }
        
        const filasAfectadas = await LoteModel.eliminar(id);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lote no encontrado'
            });
        }
        
        res.json({
            success: true,
            mensaje: 'Lote eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar lote',
            error: error.message
        });
    }
};

// ============================================
// OBTENER HISTORIAL DE MOVIMIENTOS
// ============================================
exports.obtenerHistorial = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el lote existe
        const lote = await LoteModel.obtenerPorId(id);
        if (!lote) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lote no encontrado'
            });
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
        console.error('Error en obtenerHistorial:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener historial',
            error: error.message
        });
    }
};

// ============================================
// OBTENER RESUMEN DE DISPONIBILIDAD
// ============================================
exports.obtenerResumenDisponibilidad = async (req, res) => {
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
        
        const { pool } = require('../config/database');
        const [rows] = await pool.query(query);
        
        res.json({
            success: true,
            data: rows,
            total: rows.length
        });
    } catch (error) {
        console.error('Error en obtenerResumenDisponibilidad:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener resumen de disponibilidad',
            error: error.message
        });
    }
};