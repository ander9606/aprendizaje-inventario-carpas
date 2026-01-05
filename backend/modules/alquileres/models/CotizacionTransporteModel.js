// ============================================
// MODELO: CotizacionTransporteModel
// Camiones asignados a cada cotización
// ============================================

const { pool } = require('../../../config/database');

class CotizacionTransporteModel {

  // ============================================
  // OBTENER POR COTIZACIÓN
  // ============================================
  static async obtenerPorCotizacion(cotizacionId) {
    const query = `
      SELECT
        ct.id,
        ct.cotizacion_id,
        ct.tarifa_id,
        ct.cantidad,
        ct.precio_unitario,
        ct.subtotal,
        ct.notas,
        ct.created_at,
        t.tipo_camion,
        c.nombre AS ciudad
      FROM cotizacion_transportes ct
      INNER JOIN tarifas_transporte t ON ct.tarifa_id = t.id
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE ct.cotizacion_id = ?
      ORDER BY t.tipo_camion
    `;
    const [rows] = await pool.query(query, [cotizacionId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT
        ct.*,
        t.tipo_camion,
        c.nombre AS ciudad
      FROM cotizacion_transportes ct
      INNER JOIN tarifas_transporte t ON ct.tarifa_id = t.id
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE ct.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // AGREGAR TRANSPORTE A COTIZACIÓN
  // ============================================
  static async agregar({ cotizacion_id, tarifa_id, cantidad, precio_unitario, notas }) {
    const subtotal = (precio_unitario || 0) * (cantidad || 1);

    const query = `
      INSERT INTO cotizacion_transportes
        (cotizacion_id, tarifa_id, cantidad, precio_unitario, subtotal, notas)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cotizacion_id,
      tarifa_id,
      cantidad || 1,
      precio_unitario,
      subtotal,
      notas || null
    ]);
    return result;
  }

  // ============================================
  // AGREGAR MÚLTIPLES TRANSPORTES
  // ============================================
  static async agregarMultiples(cotizacionId, transportes) {
    if (!transportes || transportes.length === 0) return { affectedRows: 0 };

    const query = `
      INSERT INTO cotizacion_transportes
        (cotizacion_id, tarifa_id, cantidad, precio_unitario, subtotal, notas)
      VALUES ?
    `;

    const valores = transportes.map(t => {
      const subtotal = (t.precio_unitario || 0) * (t.cantidad || 1);
      return [
        cotizacionId,
        t.tarifa_id,
        t.cantidad || 1,
        t.precio_unitario,
        subtotal,
        t.notas || null
      ];
    });

    const [result] = await pool.query(query, [valores]);
    return result;
  }

  // ============================================
  // ACTUALIZAR TRANSPORTE
  // ============================================
  static async actualizar(id, { cantidad, precio_unitario, notas }) {
    const subtotal = (precio_unitario || 0) * (cantidad || 1);

    const query = `
      UPDATE cotizacion_transportes
      SET cantidad = ?, precio_unitario = ?, subtotal = ?, notas = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      cantidad || 1,
      precio_unitario,
      subtotal,
      notas || null,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR TRANSPORTE
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM cotizacion_transportes WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // ELIMINAR TODOS DE UNA COTIZACIÓN
  // ============================================
  static async eliminarPorCotizacion(cotizacionId) {
    const [result] = await pool.query(
      'DELETE FROM cotizacion_transportes WHERE cotizacion_id = ?',
      [cotizacionId]
    );
    return result;
  }

  // ============================================
  // CALCULAR SUBTOTAL TRANSPORTE DE COTIZACIÓN
  // ============================================
  static async calcularSubtotalCotizacion(cotizacionId) {
    const query = `
      SELECT COALESCE(SUM(subtotal), 0) AS subtotal_transporte
      FROM cotizacion_transportes
      WHERE cotizacion_id = ?
    `;
    const [rows] = await pool.query(query, [cotizacionId]);
    return rows[0].subtotal_transporte;
  }
}

module.exports = CotizacionTransporteModel;
