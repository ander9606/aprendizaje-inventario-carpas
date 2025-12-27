// ============================================
// MODEL: SerieModel (ACTUALIZADO CON UBICACIONES)
// Responsabilidad: Consultas SQL de series
// ============================================

const { pool } = require('../../../config/database');

class SerieModel {
    
    // ============================================
    // OBTENER TODAS LAS SERIES (con elemento y ubicación)
    // ============================================
    static async obtenerTodas() {
        try {
            const query = `
                SELECT
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    s.fecha_ingreso,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                ORDER BY e.nombre, s.numero_serie
            `;

            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER SERIES CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion({ limit, offset, sortBy = 'numero_serie', order = 'ASC', search = null }) {
        try {
            let query = `
                SELECT
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    s.fecha_ingreso,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
            `;

            const params = [];

            // Agregar búsqueda si existe
            if (search) {
                query += ` WHERE s.numero_serie LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            // Agregar ordenamiento
            const validSortFields = ['numero_serie', 'estado', 'fecha_ingreso', 'elemento_nombre'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'numero_serie';

            // Mapear campo de ordenamiento a columna real
            let orderByClause = '';
            if (sortField === 'elemento_nombre') {
                orderByClause = 'e.nombre';
            } else {
                orderByClause = `s.${sortField}`;
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
    // CONTAR TOTAL DE SERIES
    // ============================================
    static async contarTodas(search = null) {
        try {
            let query = `
                SELECT COUNT(*) as total
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
            `;
            const params = [];

            if (search) {
                query += ` WHERE s.numero_serie LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            const [rows] = await pool.query(query, params);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIE POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.id_elemento,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    u.ciudad AS ubicacion_ciudad,
                    s.fecha_ingreso,
                    s.created_at,
                    s.updated_at,
                    e.nombre AS elemento_nombre,
                    e.descripcion AS elemento_descripcion,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.id = ?
            `;
            
            const [rows] = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIE POR NÚMERO DE SERIE
    // ============================================
    static async obtenerPorNumeroSerie(numeroSerie) {
        try {
            const query = `
                SELECT 
                    s.*,
                    e.nombre AS elemento_nombre,
                    u.nombre AS ubicacion_nombre
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.numero_serie = ?
            `;
            
            const [rows] = await pool.query(query, [numeroSerie]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES DE UN ELEMENTO
    // ============================================
    static async obtenerPorElemento(elementoId) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    s.fecha_ingreso
                FROM series s
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.id_elemento = ?
                ORDER BY s.numero_serie
            `;
            
            const [rows] = await pool.query(query, [elementoId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES POR UBICACIÓN
    // ============================================
    static async obtenerPorUbicacion(ubicacionId) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.fecha_ingreso,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                WHERE s.ubicacion_id = ?
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query, [ubicacionId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES POR ESTADO
    // ============================================
    static async obtenerPorEstado(estado) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.estado = ?
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query, [estado]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES DISPONIBLES
    // ============================================
    static async obtenerDisponibles() {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.estado = 'bueno'
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES ALQUILADAS
    // ============================================
    static async obtenerAlquiladas() {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    u.nombre AS ubicacion_nombre,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.estado = 'alquilado'
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR NUEVA SERIE
    // ============================================
    static async crear(datos) {
        try {
            const {
                id_elemento,
                numero_serie,
                estado,
                ubicacion,
                ubicacion_id,
                fecha_ingreso
            } = datos;
            
            const query = `
                INSERT INTO series 
                (id_elemento, numero_serie, estado, ubicacion, ubicacion_id, fecha_ingreso)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                id_elemento,
                numero_serie,
                estado || 'bueno',
                ubicacion || null,
                ubicacion_id || null,
                fecha_ingreso || null
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR SERIE
    // ============================================
    static async actualizar(id, datos) {
        try {
            const {
                numero_serie,
                estado,
                ubicacion,
                ubicacion_id,
                fecha_ingreso
            } = datos;
            
            const query = `
                UPDATE series 
                SET numero_serie = ?,
                    estado = ?,
                    ubicacion = ?,
                    ubicacion_id = ?,
                    fecha_ingreso = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                numero_serie,
                estado || 'bueno',
                ubicacion || null,
                ubicacion_id || null,
                fecha_ingreso || null,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CAMBIAR ESTADO DE SERIE
    // ============================================
    static async cambiarEstado(id, nuevoEstado, ubicacion = null, ubicacion_id = null) {
        try {
            const query = `
                UPDATE series 
                SET estado = ?,
                    ubicacion = ?,
                    ubicacion_id = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                nuevoEstado,
                ubicacion,
                ubicacion_id,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // MOVER SERIE A OTRA UBICACIÓN ✨ NUEVO
    // ============================================
    static async moverUbicacion(id, ubicacionDestinoId) {
        try {
            // Obtener nombre de la ubicación destino
            const [ubicacion] = await pool.query(
                'SELECT nombre FROM ubicaciones WHERE id = ?',
                [ubicacionDestinoId]
            );
            
            if (!ubicacion || ubicacion.length === 0) {
                throw new Error('Ubicación destino no encontrada');
            }
            
            const query = `
                UPDATE series 
                SET ubicacion_id = ?,
                    ubicacion = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                ubicacionDestinoId,
                ubicacion[0].nombre,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // MOVER MÚLTIPLES SERIES A OTRA UBICACIÓN ✨ NUEVO
    // ============================================
    static async moverMultiples(seriesIds, ubicacionDestinoId) {
        try {
            // Obtener nombre de la ubicación destino
            const [ubicacion] = await pool.query(
                'SELECT nombre FROM ubicaciones WHERE id = ?',
                [ubicacionDestinoId]
            );
            
            if (!ubicacion || ubicacion.length === 0) {
                throw new Error('Ubicación destino no encontrada');
            }
            
            const query = `
                UPDATE series 
                SET ubicacion_id = ?,
                    ubicacion = ?
                WHERE id IN (?)
            `;
            
            const [result] = await pool.query(query, [
                ubicacionDestinoId,
                ubicacion[0].nombre,
                seriesIds
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR SERIE
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM series WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CONTAR SERIES POR ELEMENTO
    // ============================================
    static async contarPorElemento(elementoId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                    SUM(CASE WHEN estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas,
                    SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS en_mantenimiento
                FROM series
                WHERE id_elemento = ?
            `;
            
            const [rows] = await pool.query(query, [elementoId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CONTAR SERIES POR UBICACIÓN ✨ NUEVO
    // ============================================
    static async contarPorUbicacion(ubicacionId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                    SUM(CASE WHEN estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas,
                    SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS en_mantenimiento,
                    SUM(CASE WHEN estado = 'dañado' THEN 1 ELSE 0 END) AS dañados
                FROM series
                WHERE ubicacion_id = ?
            `;
            
            const [rows] = await pool.query(query, [ubicacionId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER RESUMEN POR UBICACIÓN ✨ NUEVO
    // ============================================
    static async obtenerResumenPorUbicaciones() {
        try {
            const query = `
                SELECT 
                    u.id AS ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    COUNT(s.id) AS total_series,
                    SUM(CASE WHEN s.estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                    SUM(CASE WHEN s.estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas
                FROM ubicaciones u
                LEFT JOIN series s ON u.id = s.ubicacion_id
                WHERE u.activo = TRUE
                GROUP BY u.id, u.nombre, u.tipo
                ORDER BY total_series DESC
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = SerieModel;