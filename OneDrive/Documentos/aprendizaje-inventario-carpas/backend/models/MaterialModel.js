// ============================================
// MODEL: MaterialModel
// Responsabilidad: Consultas SQL de materiales
// ============================================

const { pool } = require('../config/database');

class MaterialModel {
    
    // ============================================
    // OBTENER TODOS LOS MATERIALES
    // ============================================
    static async obtenerTodos() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM materiales ORDER BY nombre'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER MATERIAL POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM materiales WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER MATERIAL POR NOMBRE
    // ============================================
    static async obtenerPorNombre(nombre) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM materiales WHERE nombre = ?',
                [nombre]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER MATERIALES MÁS USADOS
    // ============================================
    static async obtenerMasUsados() {
        try {
            const query = `
                SELECT 
                    m.id,
                    m.nombre,
                    m.descripcion,
                    COUNT(e.id) AS cantidad_elementos
                FROM materiales m
                LEFT JOIN elementos e ON m.id = e.material_id
                GROUP BY m.id, m.nombre, m.descripcion
                ORDER BY cantidad_elementos DESC
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR MATERIAL
    // ============================================
    static async crear(datos) {
        try {
            const { nombre, descripcion } = datos;
            
            const [result] = await pool.query(
                'INSERT INTO materiales (nombre, descripcion) VALUES (?, ?)',
                [nombre, descripcion || null]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR MATERIAL
    // ============================================
    static async actualizar(id, datos) {
        try {
            const { nombre, descripcion } = datos;
            
            const [result] = await pool.query(
                'UPDATE materiales SET nombre = ?, descripcion = ? WHERE id = ?',
                [nombre, descripcion || null, id]
            );
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR MATERIAL
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM materiales WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // BUSCAR MATERIALES
    // ============================================
    static async buscar(termino) {
        try {
            const query = `
                SELECT * FROM materiales 
                WHERE nombre LIKE ? OR descripcion LIKE ?
                ORDER BY nombre
            `;
            
            const [rows] = await pool.query(query, [`%${termino}%`, `%${termino}%`]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = MaterialModel;