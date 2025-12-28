// ============================================
// MODEL: LoteModel
// Responsabilidad: Consultas SQL de lotes
// ============================================

const { pool } = require('../../../config/database');

class LoteModel {

    // ============================================
    // OBTENER TODOS LOS LOTES
    // ============================================
    static async obtenerTodos() {
        try {
            const query = `
                SELECT
                    l.id,
                    l.elemento_id,
                    l.lote_numero,
                    l.cantidad,
                    l.estado,
                    l.ubicacion,
                    l.created_at,
                    e.nombre AS elemento_nombre,
                    e.descripcion AS elemento_descripcion,
                    c.nombre AS categoria
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                ORDER BY e.nombre, l.lote_numero
            `;

            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER LOTES CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion({ limit, offset, sortBy = 'lote_numero', order = 'ASC', search = null }) {
        try {
            let query = `
                SELECT
                    l.id,
                    l.elemento_id,
                    l.lote_numero,
                    l.cantidad,
                    l.estado,
                    l.ubicacion,
                    l.created_at,
                    e.nombre AS elemento_nombre,
                    e.descripcion AS elemento_descripcion,
                    c.nombre AS categoria
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
            `;

            const params = [];

            // Agregar búsqueda si existe
            if (search) {
                query += ` WHERE l.lote_numero LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            // Agregar ordenamiento
            const validSortFields = ['lote_numero', 'cantidad', 'estado', 'elemento_nombre'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'lote_numero';

            // Mapear campo de ordenamiento a columna real
            let orderByClause = '';
            if (sortField === 'elemento_nombre') {
                orderByClause = 'e.nombre';
            } else {
                orderByClause = `l.${sortField}`;
            }

            const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${orderByClause} ${sortOrder}`;

            // Agregar paginación
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // CONTAR TOTAL DE LOTES
    // ============================================
    static async contarTodos(search = null) {
        try {
            let query = `
                SELECT COUNT(*) as total
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
            `;
            const params = [];

            if (search) {
                query += ` WHERE l.lote_numero LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            const [rows] = await pool.query(query, params);
            return rows[0].total;
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
                    e.descripcion AS elemento_descripcion,
                    c.nombre AS categoria
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
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
                    l.id,
                    l.lote_numero,
                    l.cantidad,
                    l.estado,
                    l.ubicacion,
                    l.created_at
                FROM lotes l
                WHERE l.elemento_id = ?
                ORDER BY l.lote_numero DESC
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
                    l.*,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                WHERE l.estado = ?
                ORDER BY e.nombre, l.lote_numero
            `;

            const [rows] = await pool.query(query, [estado]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER ESTADÍSTICAS DE LOTES POR ELEMENTO
    // ============================================
    static async obtenerEstadisticas(elementoId) {
        try {
            const query = `
                SELECT
                    COUNT(*) AS total_lotes,
                    COALESCE(SUM(cantidad), 0) AS cantidad_total,
                    COALESCE(SUM(CASE WHEN estado = 'bueno' THEN cantidad ELSE 0 END), 0) AS disponibles,
                    COALESCE(SUM(CASE WHEN estado = 'alquilado' THEN cantidad ELSE 0 END), 0) AS alquilados,
                    COALESCE(SUM(CASE WHEN estado = 'mantenimiento' THEN cantidad ELSE 0 END), 0) AS en_mantenimiento,
                    COALESCE(SUM(CASE WHEN estado = 'dañado' THEN cantidad ELSE 0 END), 0) AS dañados
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
    // CREAR NUEVO LOTE
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
                lote_numero,
                cantidad || 0,
                estado || 'bueno',
                ubicacion || null
            ]);

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // BUSCAR LOTE ESPECÍFICO (por elemento, estado y ubicación)
    // ============================================
    static async buscarLoteEspecifico(elementoId, estado, ubicacion) {
        try {
            const query = `
                SELECT * FROM lotes
                WHERE elemento_id = ?
                AND estado = ?
                AND ubicacion = ?
                LIMIT 1
            `;

            const [rows] = await pool.query(query, [elementoId, estado, ubicacion]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // SUMAR CANTIDAD A UN LOTE
    // ============================================
    static async sumarCantidad(id, cantidad) {
        try {
            const query = `
                UPDATE lotes
                SET cantidad = cantidad + ?
                WHERE id = ?
            `;

            const [result] = await pool.query(query, [cantidad, id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // RESTAR CANTIDAD DE UN LOTE
    // ============================================
    static async restarCantidad(id, cantidad) {
        try {
            const query = `
                UPDATE lotes
                SET cantidad = cantidad - ?
                WHERE id = ?
            `;

            const [result] = await pool.query(query, [cantidad, id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // ACTUALIZAR CANTIDAD DE UN LOTE (set absoluto)
    // ============================================
    static async actualizarCantidad(id, cantidad) {
        try {
            const query = `
                UPDATE lotes
                SET cantidad = ?
                WHERE id = ?
            `;

            const [result] = await pool.query(query, [cantidad, id]);
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
                 estado_origen, estado_destino, ubicacion_origen, ubicacion_destino, costo_reparacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                lote_origen_id,
                lote_destino_id,
                cantidad,
                motivo || null,
                descripcion || null,
                estado_origen,
                estado_destino,
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
    // OBTENER HISTORIAL DE MOVIMIENTOS DE UN LOTE
    // ============================================
    static async obtenerHistorial(loteId) {
        try {
            const query = `
                SELECT
                    h.*,
                    lo.lote_numero AS lote_origen_numero,
                    ld.lote_numero AS lote_destino_numero
                FROM lotes_movimientos h
                LEFT JOIN lotes lo ON h.lote_origen_id = lo.id
                LEFT JOIN lotes ld ON h.lote_destino_id = ld.id
                WHERE h.lote_origen_id = ? OR h.lote_destino_id = ?
                ORDER BY h.fecha_movimiento DESC
            `;

            const [rows] = await pool.query(query, [loteId, loteId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = LoteModel;
