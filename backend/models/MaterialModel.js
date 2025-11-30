// ============================================
// MODELO: MATERIALES
// ============================================

const pool = require('../config/db')

class MaterialModel {

  static async obtenerTodos() {
    const [rows] = await pool.query(`
      SELECT id, nombre, descripcion, created_at
      FROM materiales
      ORDER BY id DESC
    `)
    return rows
  }

  static async obtenerPorId(id) {
    const [rows] = await pool.query(`
      SELECT id, nombre, descripcion, created_at
      FROM materiales
      WHERE id = ?
    `, [id])
    return rows[0]
  }

  static async crear(data) {
    const { nombre, descripcion = null } = data

    const [result] = await pool.query(`
      INSERT INTO materiales (nombre, descripcion)
      VALUES (?, ?)
    `, [nombre, descripcion])

    return result.insertId
  }

  static async actualizar(id, data) {
    const { nombre, descripcion = null } = data

    await pool.query(`
      UPDATE materiales
      SET nombre = ?, descripcion = ?
      WHERE id = ?
    `, [nombre, descripcion, id])
  }

  static async eliminar(id) {
    await pool.query(`
      DELETE FROM materiales WHERE id = ?
    `, [id])
  }
}

module.exports = MaterialModel
