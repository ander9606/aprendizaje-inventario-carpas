// ============================================
// MODEL: SerieModel
// Responsabilidad: Consultas SQL de series
// ============================================

const { pool } = require('../config/database');

class SerieModel {
    
    // ============================================
    // OBTENER TODAS LAS SERIES (con elemento)
    // ============================================
    static async obtenerTodas() {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.fecha_ingreso,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query);
            return rows;
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
                    s.fecha_ingreso,
                    s.created_at,
                    s.updated_at,
                    e.nombre AS elemento_nombre,
                    e.descripcion AS elemento_descripcion,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
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
                    e.nombre AS elemento_nombre
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
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
                    s.fecha_ingreso
                FROM series s
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
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
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
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
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
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
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
                fecha_ingreso
            } = datos;
            
            const query = `
                INSERT INTO series 
                (id_elemento, numero_serie, estado, ubicacion, fecha_ingreso)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                id_elemento,
                numero_serie,
                estado || 'bueno',
                ubicacion || null,
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
                fecha_ingreso
            } = datos;
            
            const query = `
                UPDATE series 
                SET numero_serie = ?,
                    estado = ?,
                    ubicacion = ?,
                    fecha_ingreso = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                numero_serie,
                estado || 'bueno',
                ubicacion || null,
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
    static async cambiarEstado(id, nuevoEstado, ubicacion = null) {
        try {
            const query = `
                UPDATE series 
                SET estado = ?,
                    ubicacion = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                nuevoEstado,
                ubicacion,
                id
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
}

module.exports = SerieModel;