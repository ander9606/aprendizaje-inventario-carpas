// ============================================
// MODEL: UnidadModel
// Responsabilidad: Consultas SQL de unidades
// ============================================

const { pool } = require('../../../config/database');

class UnidadModel {
    
    // ============================================
    // OBTENER TODAS LAS UNIDADES
    // ============================================
    static async obtenerTodas() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM unidades ORDER BY nombre'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UNIDAD POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM unidades WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UNIDAD POR NOMBRE
    // ============================================
    static async obtenerPorNombre(nombre) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM unidades WHERE nombre = ?',
                [nombre]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UNIDADES POR TIPO
    // ============================================
    static async obtenerPorTipo(tipo) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM unidades WHERE tipo = ? ORDER BY nombre',
                [tipo]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER UNIDADES MÁS USADAS
    // ============================================
    static async obtenerMasUsadas() {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.abreviatura,
                    u.tipo,
                    COUNT(e.id) AS cantidad_elementos
                FROM unidades u
                LEFT JOIN elementos e ON u.id = e.unidad_id
                GROUP BY u.id, u.nombre, u.abreviatura, u.tipo
                ORDER BY cantidad_elementos DESC
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR UNIDAD
    // ============================================
    static async crear(datos) {
        try {
            const { nombre, abreviatura, tipo } = datos;
            
            const [result] = await pool.query(
                'INSERT INTO unidades (nombre, abreviatura, tipo) VALUES (?, ?, ?)',
                [nombre, abreviatura || null, tipo || 'cantidad']
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR UNIDAD
    // ============================================
    static async actualizar(id, datos) {
        try {
            const { nombre, abreviatura, tipo } = datos;
            
            const [result] = await pool.query(
                'UPDATE unidades SET nombre = ?, abreviatura = ?, tipo = ? WHERE id = ?',
                [nombre, abreviatura || null, tipo || 'cantidad', id]
            );
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR UNIDAD
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM unidades WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UnidadModel;