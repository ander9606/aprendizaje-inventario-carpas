// ============================================
// MODELO: TarifaTransporteModel
// Tarifas de transporte por tipo de camión y ciudad
// ============================================

const { pool } = require('../../../config/database');

class TarifaTransporteModel {

  // ============================================
  // OBTENER TODAS
  // ============================================
  static async obtenerTodas(tenantId) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio, t.activo, t.created_at, t.updated_at
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tenant_id = ?
      ORDER BY c.nombre, t.tipo_camion
    `;
    const [rows] = await pool.query(query, [tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER ACTIVAS
  // ============================================
  static async obtenerActivas(tenantId) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tenant_id = ? AND t.activo = TRUE
      ORDER BY c.nombre, t.tipo_camion
    `;
    const [rows] = await pool.query(query, [tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(tenantId, id) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio, t.activo, t.created_at, t.updated_at
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.id = ? AND t.tenant_id = ?
    `;
    const [rows] = await pool.query(query, [id, tenantId]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR CIUDAD ID
  // ============================================
  static async obtenerPorCiudadId(tenantId, ciudadId) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tenant_id = ? AND t.ciudad_id = ? AND t.activo = TRUE
      ORDER BY t.precio ASC
    `;
    const [rows] = await pool.query(query, [tenantId, ciudadId]);
    return rows;
  }

  // ============================================
  // OBTENER POR TIPO DE CAMIÓN
  // ============================================
  static async obtenerPorTipoCamion(tenantId, tipoCamion) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tenant_id = ? AND t.tipo_camion = ? AND t.activo = TRUE
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query, [tenantId, tipoCamion]);
    return rows;
  }

  // ============================================
  // OBTENER CIUDADES ÚNICAS (con tarifas activas)
  // ============================================
  static async obtenerCiudades(tenantId) {
    const query = `
      SELECT DISTINCT c.id, c.nombre
      FROM tarifas_transporte t
      INNER JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tenant_id = ? AND t.activo = TRUE
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query, [tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER TIPOS DE CAMIÓN ÚNICOS
  // ============================================
  static async obtenerTiposCamion(tenantId) {
    const query = `
      SELECT DISTINCT tipo_camion
      FROM tarifas_transporte
      WHERE tenant_id = ? AND activo = TRUE
      ORDER BY tipo_camion
    `;
    const [rows] = await pool.query(query, [tenantId]);
    return rows.map(r => r.tipo_camion);
  }

  // ============================================
  // BUSCAR TARIFA ESPECÍFICA
  // ============================================
  static async buscarTarifa(tenantId, tipoCamion, ciudadId) {
    const query = `
      SELECT t.id, t.tipo_camion, t.ciudad_id, c.nombre as ciudad, t.precio
      FROM tarifas_transporte t
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE t.tenant_id = ? AND t.tipo_camion = ? AND t.ciudad_id = ? AND t.activo = TRUE
    `;
    const [rows] = await pool.query(query, [tenantId, tipoCamion, ciudadId]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear(tenantId, { tipo_camion, ciudad_id, precio }) {
    const query = `
      INSERT INTO tarifas_transporte (tenant_id, tipo_camion, ciudad_id, precio)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [tenantId, tipo_camion, ciudad_id, precio]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(tenantId, id, { tipo_camion, ciudad_id, precio, activo }) {
    const query = `
      UPDATE tarifas_transporte
      SET tipo_camion = ?, ciudad_id = ?, precio = ?, activo = ?
      WHERE id = ? AND tenant_id = ?
    `;
    const [result] = await pool.query(query, [
      tipo_camion,
      ciudad_id,
      precio,
      activo !== undefined ? activo : true,
      id,
      tenantId
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(tenantId, id) {
    const [result] = await pool.query('DELETE FROM tarifas_transporte WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return result;
  }

  // ============================================
  // DESACTIVAR
  // ============================================
  static async desactivar(tenantId, id) {
    const [result] = await pool.query(
      'UPDATE tarifas_transporte SET activo = FALSE WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    return result;
  }
}

module.exports = TarifaTransporteModel;
