// ============================================
// MODELO: CategoriaModel (Versión combinada)
// Clase + soporte para emoji + relaciones
// ============================================

const { pool } = require('../config/database');

class CategoriaModel {

  // ============================================
  // OBTENER TODAS LAS CATEGORÍAS
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.emoji,
        c.padre_id,
        c.created_at,
        padre.nombre AS padre_nombre,
        padre.emoji AS padre_emoji,
        (
          SELECT COUNT(*) 
          FROM categorias 
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id
      ORDER BY 
        c.padre_id IS NULL DESC,
        c.padre_id,
        c.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER SOLO CATEGORÍAS PADRE
  // ============================================
  static async obtenerPadres() {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.emoji,
        c.created_at,
        (
          SELECT COUNT(*) 
          FROM categorias 
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      WHERE c.padre_id IS NULL
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER CATEGORÍA POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.emoji,
        c.padre_id,
        c.created_at,
        padre.nombre AS padre_nombre,
        padre.emoji AS padre_emoji,
        (
          SELECT COUNT(*) 
          FROM categorias 
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id
      WHERE c.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER SUBCATEGORÍAS DE UNA CATEGORÍA
  // ============================================
  static async obtenerHijas(padreId) {
    const query = `
      SELECT 
        id,
        nombre,
        emoji,
        padre_id,
        created_at,
        (
          SELECT COUNT(*) 
          FROM elementos 
          WHERE categoria_id = categorias.id
        ) AS total_elementos
      FROM categorias
      WHERE padre_id = ?
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query, [padreId]);
    return rows;
  }

  // ============================================
  // CREAR NUEVA CATEGORÍA
  // ============================================
  static async crear({ nombre, emoji, padre_id }) {
    const query = `
      INSERT INTO categorias (nombre, emoji, padre_id)
      VALUES (?, ?, ?)
    `;
    const values = [nombre, emoji || null, padre_id || null];
    const [result] = await pool.query(query, values);
    return result;
  }

  // ============================================
  // ACTUALIZAR CATEGORÍA
  // ============================================
  static async actualizar(id, { nombre, emoji, padre_id }) {
    const query = `
      UPDATE categorias 
      SET nombre = ?, emoji = ?, padre_id = ?
      WHERE id = ?
    `;
    const values = [nombre, emoji || null, padre_id || null, id];
    const [result] = await pool.query(query, values);
    return result;
  }

  // ============================================
  // ELIMINAR CATEGORÍA
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // VERIFICAR SI TIENE SUBCATEGORÍAS
  // ============================================
  static async tieneSubcategorias(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM categorias WHERE padre_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // VERIFICAR SI TIENE ELEMENTOS
  // ============================================
  static async tieneElementos(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM elementos WHERE categoria_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }
}

module.exports = CategoriaModel;
