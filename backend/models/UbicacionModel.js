// ============================================
// MODEL: UbicacionModel
// Responsabilidad: Consultas SQL de ubicaciones
// ============================================

const { pool } = require('../config/database');

class UbicacionModel {
    
    // ============================================
    // OBTENER TODAS LAS UBICACIONES
    // ============================================
    static async obtenerTodas() {
        try {
            const query = `
                SELECT 
                    id,
                    nombre,
                    tipo,
                    direccion,
                    ciudad,
                    responsable,
                    telefono,
                    email,
                    capacidad_estimada,
                    observaciones,
                    activo,
                    created_at,
                    updated_at
                FROM ubicaciones
                ORDER BY tipo, nombre
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SOLO UBICACIONES ACTIVAS
    // ============================================
    static async obtenerActivas() {
        try {
            const query = `
                SELECT 
                    id,
                    nombre,
                    tipo,
                    direccion,
                    ciudad,
                    responsable,
                    telefono,
                    activo
                FROM ubicaciones
                WHERE activo = TRUE
                ORDER BY tipo, nombre
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UBICACIÓN POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT 
                    id,
                    nombre,
                    tipo,
                    direccion,
                    ciudad,
                    responsable,
                    telefono,
                    email,
                    capacidad_estimada,
                    observaciones,
                    activo,
                    created_at,
                    updated_at
                FROM ubicaciones
                WHERE id = ?
            `;
            
            const [rows] = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UBICACIONES POR TIPO
    // ============================================
    static async obtenerPorTipo(tipo) {
        try {
            const query = `
                SELECT 
                    id,
                    nombre,
                    tipo,
                    direccion,
                    ciudad,
                    responsable,
                    telefono,
                    activo
                FROM ubicaciones
                WHERE tipo = ? AND activo = TRUE
                ORDER BY nombre
            `;
            
            const [rows] = await pool.query(query, [tipo]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UBICACIÓN POR NOMBRE
    // ============================================
    static async obtenerPorNombre(nombre) {
        try {
            const query = `
                SELECT * FROM ubicaciones
                WHERE nombre = ?
                LIMIT 1
            `;
            
            const [rows] = await pool.query(query, [nombre]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UBICACIONES CON INVENTARIO
    // ============================================
    static async obtenerConInventario() {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.tipo,
                    u.ciudad,
                    u.responsable,
                    u.activo,
                    COALESCE(series.total_series, 0) as total_series,
                    COALESCE(lotes.total_unidades, 0) as total_unidades,
                    COALESCE(series.total_series, 0) + COALESCE(lotes.total_unidades, 0) as total_items
                FROM ubicaciones u
                LEFT JOIN (
                    SELECT ubicacion_id, COUNT(*) as total_series
                    FROM series
                    WHERE ubicacion_id IS NOT NULL
                    GROUP BY ubicacion_id
                ) series ON u.id = series.ubicacion_id
                LEFT JOIN (
                    SELECT ubicacion_id, SUM(cantidad) as total_unidades
                    FROM lotes
                    WHERE ubicacion_id IS NOT NULL
                    GROUP BY ubicacion_id
                ) lotes ON u.id = lotes.ubicacion_id
                WHERE u.activo = TRUE
                ORDER BY total_items DESC, u.tipo, u.nombre
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER DETALLE DE INVENTARIO POR UBICACIÓN
    // ============================================
    static async obtenerDetalleInventario(id) {
        try {
            // Obtener series en esta ubicación
            const querySeries = `
                SELECT 
                    e.nombre AS elemento_nombre,
                    s.estado,
                    COUNT(*) as cantidad
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                WHERE s.ubicacion_id = ?
                GROUP BY e.nombre, s.estado
                ORDER BY e.nombre, s.estado
            `;
            
            // Obtener lotes en esta ubicación
            const queryLotes = `
                SELECT 
                    e.nombre AS elemento_nombre,
                    l.estado,
                    SUM(l.cantidad) as cantidad
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                WHERE l.ubicacion_id = ?
                GROUP BY e.nombre, l.estado
                ORDER BY e.nombre, l.estado
            `;
            
            const [series] = await pool.query(querySeries, [id]);
            const [lotes] = await pool.query(queryLotes, [id]);
            
            return {
                series,
                lotes
            };
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR NUEVA UBICACIÓN
    // ============================================
    static async crear(datos) {
        try {
            const {
                nombre,
                tipo,
                direccion,
                ciudad,
                responsable,
                telefono,
                email,
                capacidad_estimada,
                observaciones,
                activo
            } = datos;
            
            const query = `
                INSERT INTO ubicaciones 
                (nombre, tipo, direccion, ciudad, responsable, telefono, 
                 email, capacidad_estimada, observaciones, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                nombre,
                tipo || 'bodega',
                direccion || null,
                ciudad || null,
                responsable || null,
                telefono || null,
                email || null,
                capacidad_estimada || null,
                observaciones || null,
                activo !== undefined ? activo : true
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR UBICACIÓN
    // ============================================
    static async actualizar(id, datos) {
        try {
            const {
                nombre,
                tipo,
                direccion,
                ciudad,
                responsable,
                telefono,
                email,
                capacidad_estimada,
                observaciones,
                activo
            } = datos;
            
            const query = `
                UPDATE ubicaciones 
                SET nombre = ?,
                    tipo = ?,
                    direccion = ?,
                    ciudad = ?,
                    responsable = ?,
                    telefono = ?,
                    email = ?,
                    capacidad_estimada = ?,
                    observaciones = ?,
                    activo = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                nombre,
                tipo || 'bodega',
                direccion || null,
                ciudad || null,
                responsable || null,
                telefono || null,
                email || null,
                capacidad_estimada || null,
                observaciones || null,
                activo !== undefined ? activo : true,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // DESACTIVAR UBICACIÓN (Soft Delete)
    // ============================================
    static async desactivar(id) {
        try {
            const [result] = await pool.query(
                'UPDATE ubicaciones SET activo = FALSE WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTIVAR UBICACIÓN
    // ============================================
    static async activar(id) {
        try {
            const [result] = await pool.query(
                'UPDATE ubicaciones SET activo = TRUE WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR UBICACIÓN (Hard Delete)
    // Solo si no tiene inventario asociado
    // ============================================
    static async eliminar(id) {
        try {
            // Verificar que no tenga inventario
            const querySeries = 'SELECT COUNT(*) as total FROM series WHERE ubicacion_id = ?';
            const queryLotes = 'SELECT COUNT(*) as total FROM lotes WHERE ubicacion_id = ?';
            
            const [series] = await pool.query(querySeries, [id]);
            const [lotes] = await pool.query(queryLotes, [id]);
            
            if (series[0].total > 0 || lotes[0].total > 0) {
                throw new Error('No se puede eliminar una ubicación con inventario asociado');
            }
            
            const [result] = await pool.query(
                'DELETE FROM ubicaciones WHERE id = ?',
                [id]
            );
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // VERIFICAR SI NOMBRE EXISTE
    // ============================================
    static async nombreExiste(nombre, excluirId = null) {
        try {
            let query = 'SELECT COUNT(*) as total FROM ubicaciones WHERE nombre = ?';
            const params = [nombre];
            
            if (excluirId) {
                query += ' AND id != ?';
                params.push(excluirId);
            }
            
            const [rows] = await pool.query(query, params);
            return rows[0].total > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UbicacionModel;