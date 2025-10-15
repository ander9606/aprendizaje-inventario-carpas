// ============================================
// MODEL: CategoriaModel
// Responsabilidad: Consultas SQL de categorías
// ============================================

const { pool } = require('../config/database');

class CategoriaModel {
    
    // ============================================
    // OBTENER TODAS LAS CATEGORÍAS
    // ============================================
    static async obtenerTodas() {
        try {
            const [rows] = await pool.query('SELECT * FROM categorias');
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER CATEGORÍA POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM categorias WHERE id = ?',
                [id]
            );
            return rows[0]; // Retorna solo la primera fila
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER CATEGORÍAS PADRE (sin padre_id)
    // ============================================
    static async obtenerPadres() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM categorias WHERE padre_id IS NULL'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SUBCATEGORÍAS DE UNA CATEGORÍA
    // ============================================
    static async obtenerHijas(padreId) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM categorias WHERE padre_id = ?',
                [padreId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR NUEVA CATEGORÍA
    // ============================================
    static async crear(datos) {
        try {
            const { nombre, padre_id } = datos;
            const [result] = await pool.query(
                'INSERT INTO categorias (nombre, padre_id) VALUES (?, ?)',
                [nombre, padre_id || null]
            );
            return result.insertId; // Retorna el ID del nuevo registro
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR CATEGORÍA
    // ============================================
    static async actualizar(id, datos) {
        try {
            const { nombre, padre_id } = datos;
            const [result] = await pool.query(
                'UPDATE categorias SET nombre = ?, padre_id = ? WHERE id = ?',
                [nombre, padre_id || null, id]
            );
            return result.affectedRows; // Retorna cuántas filas se actualizaron
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR CATEGORÍA
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM categorias WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CategoriaModel;