// ============================================
// MODEL: LoteModel
// Responsabilidad: Consultas SQL de lotes
// ============================================

const { pool } = require('../config/database');

class LoteModel {
    
    // ============================================
    // OBTENER TODOS LOS LOTES
    // ============================================
    static async obtenerTodos() {
        try {
            const query = `
                SELECT 
                    l.id,
                    l.lote_numero,
                    l.cantidad,
                    l.estado,
                    l.ubicacion,
                    l.created_at,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                ORDER BY e.nombre, l.estado
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER LOTE POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT 
                    l.*,
                    e.nombre AS elemento_nombre,
                    e.requiere_series
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                WHERE l.id = ?
            `;
            
            const [rows] = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER LOTES DE UN ELEMENTO
    // ============================================
    static async obtenerPorElemento(elementoId) {
        try {
            const query = `
                SELECT 
                    id,
                    lote_numero,
                    cantidad,
                    estado,
                    ubicacion,
                    created_at
                FROM lotes
                WHERE elemento_id = ?
                ORDER BY estado, ubicacion
            `;
            
            const [rows] = await pool.query(query, [elementoId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER LOTES POR ESTADO
    // ============================================
    static async obtenerPorEstado(estado) {
        try {
            const query = `
                SELECT 
                    l.id,
                    l.cantidad,
                    l.estado,
                    l.ubicacion,
                    e.nombre AS elemento_nombre
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                WHERE l.estado = ?
                ORDER BY e.nombre
            `;
            
            const [rows] = await pool.query(query, [estado]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // BUSCAR LOTE ESPECÍFICO (por elemento, estado, ubicación)
    // ============================================
    static async buscarLoteEspecifico(elementoId, estado, ubicacion) {
        try {
            const query = `
                SELECT * FROM lotes
                WHERE elemento_id = ?
                  AND estado = ?
                  AND (ubicacion = ? OR (ubicacion IS NULL AND ? IS NULL))
                LIMIT 1
            `;
            
            const [rows] = await pool.query(query, [
                elementoId,
                estado,
                ubicacion,
                ubicacion
            ]);
            
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR LOTE
    // ============================================
    static async crear(datos) {
        try {
            const {
                elemento_id,
                lote_numero,
                cantidad,
                estado,
                ubicacion
            } = datos;
            
            const query = `
                INSERT INTO lotes 
                (elemento_id, lote_numero, cantidad, estado, ubicacion)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                elemento_id,
                lote_numero || null,
                cantidad,
                estado || 'bueno',
                ubicacion || null
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR CANTIDAD DE LOTE
    // ============================================
    static async actualizarCantidad(id, nuevaCantidad) {
        try {
            const [result] = await pool.query(
                'UPDATE lotes SET cantidad = ? WHERE id = ?',
                [nuevaCantidad, id]
            );
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // SUMAR CANTIDAD A LOTE
    // ============================================
    static async sumarCantidad(id, cantidadASumar) {
        try {
            const [result] = await pool.query(
                'UPDATE lotes SET cantidad = cantidad + ? WHERE id = ?',
                [cantidadASumar, id]
            );
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // RESTAR CANTIDAD DE LOTE
    // ============================================
    static async restarCantidad(id, cantidadARestar) {
        try {
            // Primero verificar que hay suficiente cantidad
            const lote = await this.obtenerPorId(id);
            
            if (!lote) {
                throw new Error('Lote no encontrado');
            }
            
            if (lote.cantidad < cantidadARestar) {
                throw new Error(`Cantidad insuficiente. Disponible: ${lote.cantidad}, Solicitado: ${cantidadARestar}`);
            }
            
            const [result] = await pool.query(
                'UPDATE lotes SET cantidad = cantidad - ? WHERE id = ?',
                [cantidadARestar, id]
            );
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR LOTE
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM lotes WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ESTADÍSTICAS DE UN ELEMENTO
    // ============================================
    static async obtenerEstadisticas(elementoId) {
        try {
            const query = `
                SELECT 
                    SUM(cantidad) AS total,
                    SUM(CASE WHEN estado = 'bueno' THEN cantidad ELSE 0 END) AS disponibles,
                    SUM(CASE WHEN estado = 'nuevo' THEN cantidad ELSE 0 END) AS nuevos,
                    SUM(CASE WHEN estado = 'alquilado' THEN cantidad ELSE 0 END) AS alquilados,
                    SUM(CASE WHEN estado = 'mantenimiento' THEN cantidad ELSE 0 END) AS en_mantenimiento,
                    SUM(CASE WHEN estado = 'dañado' THEN cantidad ELSE 0 END) AS dañados
                FROM lotes
                WHERE elemento_id = ?
            `;
            
            const [rows] = await pool.query(query, [elementoId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // REGISTRAR MOVIMIENTO EN HISTORIAL
    // ============================================
    static async registrarMovimiento(datos) {
        try {
            const {
                lote_origen_id,
                lote_destino_id,
                cantidad,
                motivo,
                descripcion,
                estado_origen,
                estado_destino,
                ubicacion_origen,
                ubicacion_destino,
                costo_reparacion
            } = datos;
            
            const query = `
                INSERT INTO lotes_movimientos 
                (lote_origen_id, lote_destino_id, cantidad, motivo, descripcion,
                 estado_origen, estado_destino, ubicacion_origen, ubicacion_destino,
                 costo_reparacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                lote_origen_id || null,
                lote_destino_id || null,
                cantidad,
                motivo || null,
                descripcion || null,
                estado_origen || null,
                estado_destino || null,
                ubicacion_origen || null,
                ubicacion_destino || null,
                costo_reparacion || null
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER HISTORIAL DE MOVIMIENTOS
    // ============================================
    static async obtenerHistorial(loteId) {
        try {
            const query = `
                SELECT 
                    m.*,
                    lo.lote_numero AS lote_origen_numero,
                    ld.lote_numero AS lote_destino_numero
                FROM lotes_movimientos m
                LEFT JOIN lotes lo ON m.lote_origen_id = lo.id
                LEFT JOIN lotes ld ON m.lote_destino_id = ld.id
                WHERE m.lote_origen_id = ? OR m.lote_destino_id = ?
                ORDER BY m.fecha_movimiento DESC
            `;
            
            const [rows] = await pool.query(query, [loteId, loteId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = LoteModel;