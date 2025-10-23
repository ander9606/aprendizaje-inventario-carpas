// ============================================
// CONTROLLER: loteController
// Responsabilidad: Lógica de negocio de lotes
// ============================================

const LoteModel = require('../models/LoteModel');
const ElementoModel = require('../models/ElementoModel');

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
exports.moverCantidad = async (req, res) => {
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
        
        // ═══════════════════════════════════════
        // VALIDACIONES
        // ═══════════════════════════════════════
        
        if (!lote_origen_id) {
            return res.status(400).json({
                success: false,
                mensaje: 'El lote_origen_id es obligatorio'
            });
        }
        
        if (!cantidad || cantidad <= 0) {
            return res.status(400).json({
                success: false,
                mensaje: 'La cantidad debe ser mayor a 0'
            });
        }
        
        if (!estado_destino) {
            return res.status(400).json({
                success: false,
                mensaje: 'El estado_destino es obligatorio'
            });
        }
        
        // Validar estado
        const estadosValidos = ['nuevo', 'bueno', 'mantenimiento', 'alquilado', 'dañado'];
        if (!estadosValidos.includes(estado_destino)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Estado destino inválido',
                estadosValidos
            });
        }
        
        // Obtener lote origen
        const loteOrigen = await LoteModel.obtenerPorId(lote_origen_id);
        if (!loteOrigen) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lote origen no encontrado'
            });
        }
        
        // Verificar cantidad disponible
        if (loteOrigen.cantidad < cantidad) {
            return res.status(400).json({
                success: false,
                mensaje: `Cantidad insuficiente en lote origen. Disponible: ${loteOrigen.cantidad}, Solicitado: ${cantidad}`
            });
        }
        
        // ═══════════════════════════════════════
        // LÓGICA DE MOVIMIENTO
        // ═══════════════════════════════════════
        
        // 1. Buscar si ya existe un lote con el estado+ubicación destino
        let loteDestino = await LoteModel.buscarLoteEspecifico(
            loteOrigen.elemento_id,
            estado_destino,
            ubicacion_destino
        );
        
        let loteDestinoId;
        
        if (loteDestino) {
            // ───────────────────────────────────
            // CASO A: Ya existe lote → SUMAR
            // ───────────────────────────────────
            console.log(`✅ Lote destino encontrado (id: ${loteDestino.id}). Sumando cantidad...`);
            
            await LoteModel.sumarCantidad(loteDestino.id, cantidad);
            loteDestinoId = loteDestino.id;
            
        } else {
            // ───────────────────────────────────
            // CASO B: No existe → CREAR NUEVO
            // ───────────────────────────────────
            console.log('🆕 Lote destino no existe. Creando nuevo lote...');
            
            loteDestinoId = await LoteModel.crear({
                elemento_id: loteOrigen.elemento_id,
                cantidad: cantidad,
                estado: estado_destino,
                ubicacion: ubicacion_destino,
                lote_numero: `LOTE-${Date.now()}`  // Generar número único
            });
        }
        
        // 2. Restar cantidad del lote origen
        await LoteModel.restarCantidad(lote_origen_id, cantidad);
        
        // 3. Registrar movimiento en historial
        await LoteModel.registrarMovimiento({
            lote_origen_id: lote_origen_id,
            lote_destino_id: loteDestinoId,
            cantidad: cantidad,
            motivo: motivo,
            descripcion: descripcion,
            estado_origen: loteOrigen.estado,
            estado_destino: estado_destino,
            ubicacion_origen: loteOrigen.ubicacion,
            ubicacion_destino: ubicacion_destino,
            costo_reparacion: costo_reparacion
        });
        
        // 4. Si el lote origen quedó vacío, eliminarlo
        const loteOrigenActualizado = await LoteModel.obtenerPorId(lote_origen_id);
        if (loteOrigenActualizado && loteOrigenActualizado.cantidad === 0) {
            console.log(`🗑️  Lote origen vacío (id: ${lote_origen_id}). Eliminando...`);
            await LoteModel.eliminar(lote_origen_id);
        }
        
        // 5. Obtener estado actualizado
        const estadisticas = await LoteModel.obtenerEstadisticas(loteOrigen.elemento_id);
        const lotesActualizados = await LoteModel.obtenerPorElemento(loteOrigen.elemento_id);
        
        // ═══════════════════════════════════════
        // RESPUESTA
        // ═══════════════════════════════════════
        
        res.json({
            success: true,
            mensaje: 'Movimiento realizado exitosamente',
            movimiento: {
                cantidad_movida: cantidad,
                estado_origen: loteOrigen.estado,
                estado_destino: estado_destino,
                lote_origen_eliminado: loteOrigenActualizado?.cantidad === 0,
                lote_destino_creado: !loteDestino
            },
            estadisticas: estadisticas,
            lotes_actuales: lotesActualizados
        });
        
    } catch (error) {
        console.error('Error en moverCantidad:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al mover cantidad',
            error: error.message
        });
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