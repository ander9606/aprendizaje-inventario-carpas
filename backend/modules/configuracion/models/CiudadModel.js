// ============================================
// MODELO: CiudadModel
// Catálogo maestro de ciudades
// ============================================

const { pool } = require('../../../config/database');

class CiudadModel {

  // ============================================
  // OBTENER TODAS
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT id, nombre, departamento, activo, created_at, updated_at
      FROM ciudades
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER ACTIVAS
  // ============================================
  static async obtenerActivas() {
    const query = `
      SELECT id, nombre, departamento
      FROM ciudades
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
      SELECT id, nombre, departamento, activo, created_at, updated_at
      FROM ciudades
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR NOMBRE
  // ============================================
  static async obtenerPorNombre(nombre) {
    const query = `
      SELECT id, nombre, departamento, activo
      FROM ciudades
      WHERE nombre = ?
    `;
    const [rows] = await pool.query(query, [nombre]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ nombre, departamento }) {
    const query = `
      INSERT INTO ciudades (nombre, departamento)
      VALUES (?, ?)
    `;
    const [result] = await pool.query(query, [nombre, departamento || null]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { nombre, departamento, activo }) {
    const query = `
      UPDATE ciudades
      SET nombre = ?, departamento = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      departamento || null,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    // Verificar si tiene tarifas o ubicaciones asociadas
    const [tarifas] = await pool.query(
      'SELECT COUNT(*) as total FROM tarifas_transporte WHERE ciudad_id = ?',
      [id]
    );
    const [ubicaciones] = await pool.query(
      'SELECT COUNT(*) as total FROM ubicaciones WHERE ciudad_id = ?',
      [id]
    );

    if (tarifas[0].total > 0 || ubicaciones[0].total > 0) {
      throw new Error('No se puede eliminar una ciudad con tarifas o ubicaciones asociadas');
    }

    const [result] = await pool.query('DELETE FROM ciudades WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // DESACTIVAR
  // ============================================
  static async desactivar(id) {
    const [result] = await pool.query(
      'UPDATE ciudades SET activo = FALSE WHERE id = ?',
      [id]
    );
    return result;
  }

  // ============================================
  // VERIFICAR SI NOMBRE EXISTE
  // ============================================
  static async nombreExiste(nombre, excluirId = null) {
    let query = 'SELECT COUNT(*) as total FROM ciudades WHERE nombre = ?';
    const params = [nombre];

    if (excluirId) {
      query += ' AND id != ?';
      params.push(excluirId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }
}

module.exports = CiudadModel;
