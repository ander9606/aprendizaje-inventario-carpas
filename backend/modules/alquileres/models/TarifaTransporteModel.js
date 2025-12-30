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
      SELECT id, tipo_camion, ciudad, precio, activo, created_at, updated_at
      FROM tarifas_transporte
      ORDER BY ciudad, tipo_camion
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER ACTIVAS
  // ============================================
  static async obtenerActivas() {
    const query = `
      SELECT id, tipo_camion, ciudad, precio
      FROM tarifas_transporte
      WHERE activo = TRUE
      ORDER BY ciudad, tipo_camion
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT id, tipo_camion, ciudad, precio, activo, created_at, updated_at
      FROM tarifas_transporte
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR CIUDAD
  // ============================================
  static async obtenerPorCiudad(ciudad) {
    const query = `
      SELECT id, tipo_camion, ciudad, precio
      FROM tarifas_transporte
      WHERE ciudad = ? AND activo = TRUE
      ORDER BY precio ASC
    `;
    const [rows] = await pool.query(query, [ciudad]);
    return rows;
  }

  // ============================================
  // OBTENER POR TIPO DE CAMIÓN
  // ============================================
  static async obtenerPorTipoCamion(tipoCamion) {
    const query = `
      SELECT id, tipo_camion, ciudad, precio
      FROM tarifas_transporte
      WHERE tipo_camion = ? AND activo = TRUE
      ORDER BY ciudad
    `;
    const [rows] = await pool.query(query, [tipoCamion]);
    return rows;
  }

  // ============================================
  // OBTENER CIUDADES ÚNICAS
  // ============================================
  static async obtenerCiudades() {
    const query = `
      SELECT DISTINCT ciudad
      FROM tarifas_transporte
      WHERE activo = TRUE
      ORDER BY ciudad
    `;
    const [rows] = await pool.query(query);
    return rows.map(r => r.ciudad);
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
  static async buscarTarifa(tipoCamion, ciudad) {
    const query = `
      SELECT id, tipo_camion, ciudad, precio
      FROM tarifas_transporte
      WHERE tipo_camion = ? AND ciudad = ? AND activo = TRUE
    `;
    const [rows] = await pool.query(query, [tipoCamion, ciudad]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ tipo_camion, ciudad, precio }) {
    const query = `
      INSERT INTO tarifas_transporte (tipo_camion, ciudad, precio)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(query, [tipo_camion, ciudad, precio]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { tipo_camion, ciudad, precio, activo }) {
    const query = `
      UPDATE tarifas_transporte
      SET tipo_camion = ?, ciudad = ?, precio = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      tipo_camion,
      ciudad,
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
