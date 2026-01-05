// ============================================
// MODELO: TarifaTransporteModel
// Tarifas de transporte por tipo de camión y ciudad
// ============================================

const { pool } = require('../../../config/database');

class TarifaTransporteModel {

  // ============================================
  // OBTENER TODAS
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio, t.activo, t.created_at, t.updated_at
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      ORDER BY c.nombre, t.tipo_camion
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER ACTIVAS
  // ============================================
  static async obtenerActivas() {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.activo = TRUE
      ORDER BY c.nombre, t.tipo_camion
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio, t.activo, t.created_at, t.updated_at
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR CIUDAD ID
  // ============================================
  static async obtenerPorCiudadId(ciudadId) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.ciudad_id = ? AND t.activo = TRUE
      ORDER BY t.precio ASC
    `;
    const [rows] = await pool.query(query, [ciudadId]);
    return rows;
  }

  // ============================================
  // OBTENER POR TIPO DE CAMIÓN
  // ============================================
  static async obtenerPorTipoCamion(tipoCamion) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tipo_camion = ? AND t.activo = TRUE
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query, [tipoCamion]);
    return rows;
  }

  // ============================================
  // OBTENER CIUDADES ÚNICAS (con tarifas activas)
  // ============================================
  static async obtenerCiudades() {
    const query = `
      SELECT DISTINCT c.id, c.nombre
      FROM tarifas_transporte t
      INNER JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.activo = TRUE
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER TIPOS DE CAMIÓN ÚNICOS
  // ============================================
  static async obtenerTiposCamion() {
    const query = `
      SELECT DISTINCT tipo_camion
      FROM tarifas_transporte
      WHERE activo = TRUE
      ORDER BY tipo_camion
    `;
    const [rows] = await pool.query(query);
    return rows.map(r => r.tipo_camion);
  }

  // ============================================
  // BUSCAR TARIFA ESPECÍFICA
  // ============================================
  static async buscarTarifa(tipoCamion, ciudadId) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tipo_camion = ? AND t.ciudad_id = ? AND t.activo = TRUE
    `;
    const [rows] = await pool.query(query, [tipoCamion, ciudadId]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ tipo_camion, ciudad_id, precio }) {
    const query = `
      INSERT INTO tarifas_transporte (tipo_camion, ciudad_id, precio)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(query, [tipo_camion, ciudad_id, precio]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { tipo_camion, ciudad_id, precio, activo }) {
    const query = `
      UPDATE tarifas_transporte
      SET tipo_camion = ?, ciudad_id = ?, precio = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      tipo_camion,
      ciudad_id,
      precio,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM tarifas_transporte WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // DESACTIVAR
  // ============================================
  static async desactivar(id) {
    const [result] = await pool.query(
      'UPDATE tarifas_transporte SET activo = FALSE WHERE id = ?',
      [id]
    );
    return result;
  }
}

module.exports = TarifaTransporteModel;
