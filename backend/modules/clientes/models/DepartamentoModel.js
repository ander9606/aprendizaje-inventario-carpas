// ============================================
// MODELO: DepartamentoModel
// Catálogo maestro de departamentos
// ============================================

const { pool } = require('../../../config/database');

class DepartamentoModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos() {
    const query = `
      SELECT d.id, d.nombre, d.activo, d.created_at, d.updated_at,
             COUNT(c.id) as total_ciudades
      FROM departamentos d
      LEFT JOIN ciudades c ON c.departamento_id = d.id AND c.activo = TRUE
      GROUP BY d.id
      ORDER BY d.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER ACTIVOS
  // ============================================
  static async obtenerActivos() {
    const query = `
      SELECT id, nombre
      FROM departamentos
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
      SELECT id, nombre, activo, created_at, updated_at
      FROM departamentos
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ nombre }) {
    const query = `
      INSERT INTO departamentos (nombre)
      VALUES (?)
    `;
    const [result] = await pool.query(query, [nombre]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { nombre, activo }) {
    const query = `
      UPDATE departamentos
      SET nombre = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    // Verificar si tiene ciudades asociadas
    const [ciudades] = await pool.query(
      'SELECT COUNT(*) as total FROM ciudades WHERE departamento_id = ?',
      [id]
    );

    if (ciudades[0].total > 0) {
      throw new Error('No se puede eliminar un departamento con ciudades asociadas');
    }

    const [result] = await pool.query('DELETE FROM departamentos WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // VERIFICAR SI NOMBRE EXISTE
  // ============================================
  static async nombreExiste(nombre, excluirId = null) {
    let query = 'SELECT COUNT(*) as total FROM departamentos WHERE nombre = ?';
    const params = [nombre];

    if (excluirId) {
      query += ' AND id != ?';
      params.push(excluirId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }
}

module.exports = DepartamentoModel;
