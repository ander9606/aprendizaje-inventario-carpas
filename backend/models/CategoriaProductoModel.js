// ============================================
// MODELO: CategoriaProductoModel
// Categorías para productos de alquiler
// ============================================

const { pool } = require('../config/database');

class CategoriaProductoModel {

  // ============================================
  // OBTENER TODAS LAS CATEGORÍAS
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT
        id,
        nombre,
        descripcion,
        emoji,
        activo,
        created_at,
        updated_at
      FROM categorias_productos
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER SOLO ACTIVAS
  // ============================================
  static async obtenerActivas() {
    const query = `
      SELECT
        id,
        nombre,
        descripcion,
        emoji,
        created_at
      FROM categorias_productos
      WHERE activo = TRUE
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT
        id,
        nombre,
        descripcion,
        emoji,
        activo,
        created_at,
        updated_at
      FROM categorias_productos
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ nombre, descripcion, emoji }) {
    const query = `
      INSERT INTO categorias_productos (nombre, descripcion, emoji)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(query, [nombre, descripcion || null, emoji || null]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { nombre, descripcion, emoji, activo }) {
    const query = `
      UPDATE categorias_productos
      SET nombre = ?, descripcion = ?, emoji = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      descripcion || null,
      emoji || null,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM categorias_productos WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // VERIFICAR SI TIENE PRODUCTOS
  // ============================================
  static async tieneProductos(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM elementos_compuestos WHERE categoria_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // CONTAR TODAS
  // ============================================
  static async contarTodas() {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM categorias_productos');
    return rows[0].total;
  }
}

module.exports = CategoriaProductoModel;
