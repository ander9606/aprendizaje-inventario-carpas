// ============================================
// MODELO: CotizacionDescuentoModel
// Descuentos aplicados a cotizaciones (pivote)
// ============================================

const { pool } = require('../../../config/database');
const CotizacionModel = require('./CotizacionModel');

class CotizacionDescuentoModel {

  // ============================================
  // OBTENER POR COTIZACIÓN
  // ============================================
  static async obtenerPorCotizacion(cotizacionId) {
    const query = `
      SELECT
        cd.id,
        cd.cotizacion_id,
        cd.descuento_id,
        cd.tipo,
        cd.valor,
        cd.monto_calculado,
        cd.descripcion,
        cd.created_at,
        d.nombre AS descuento_nombre,
        d.descripcion AS descuento_descripcion
      FROM cotizacion_descuentos cd
      LEFT JOIN descuentos d ON cd.descuento_id = d.id
      WHERE cd.cotizacion_id = ?
      ORDER BY cd.created_at ASC
    `;
    const [rows] = await pool.query(query, [cotizacionId]);
    return rows;
  }

  // ============================================
  // AGREGAR DESCUENTO PREDEFINIDO
  // ============================================
  static async agregarDescuentoPredefinido(cotizacionId, descuentoId, baseCalculo, descripcion = null) {
    // Obtener info del descuento
    const [descuentoData] = await pool.query(
      'SELECT tipo, valor FROM descuentos WHERE id = ? AND activo = TRUE',
      [descuentoId]
    );

    if (!descuentoData[0]) {
      throw new Error('Descuento no encontrado o inactivo');
    }

    const descuento = descuentoData[0];
    const tipo = descuento.tipo; // 'porcentaje' o 'fijo'
    const valor = parseFloat(descuento.valor);
    const montoCalculado = tipo === 'porcentaje'
      ? baseCalculo * (valor / 100)
      : valor;

    const query = `
      INSERT INTO cotizacion_descuentos
        (cotizacion_id, descuento_id, tipo, valor, monto_calculado, descripcion)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cotizacionId,
      descuentoId,
      tipo,
      valor,
      montoCalculado,
      descripcion
    ]);

    // Recalcular totales
    await CotizacionModel.recalcularTotales(cotizacionId);

    return result;
  }

  // ============================================
  // AGREGAR DESCUENTO MANUAL
  // ============================================
  static async agregarDescuentoManual(cotizacionId, valor, tipo, baseCalculo, descripcion = null) {
    const valorNum = parseFloat(valor);
    const montoCalculado = tipo === 'porcentaje'
      ? baseCalculo * (valorNum / 100)
      : valorNum;

    const query = `
      INSERT INTO cotizacion_descuentos
        (cotizacion_id, descuento_id, tipo, valor, monto_calculado, descripcion)
      VALUES (?, NULL, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cotizacionId,
      tipo,
      valorNum,
      montoCalculado,
      descripcion || 'Descuento manual'
    ]);

    // Recalcular totales
    await CotizacionModel.recalcularTotales(cotizacionId);

    return result;
  }

  // ============================================
  // ELIMINAR DESCUENTO
  // ============================================
  static async eliminar(id) {
    // Obtener cotizacion_id antes de eliminar
    const [data] = await pool.query(
      'SELECT cotizacion_id FROM cotizacion_descuentos WHERE id = ?',
      [id]
    );

    if (!data[0]) {
      throw new Error('Descuento no encontrado');
    }

    const cotizacionId = data[0].cotizacion_id;

    const [result] = await pool.query(
      'DELETE FROM cotizacion_descuentos WHERE id = ?',
      [id]
    );

    // Recalcular totales
    await CotizacionModel.recalcularTotales(cotizacionId);

    return result;
  }

  // ============================================
  // ELIMINAR TODOS DE UNA COTIZACIÓN
  // ============================================
  static async eliminarTodosDeCotizacion(cotizacionId) {
    const [result] = await pool.query(
      'DELETE FROM cotizacion_descuentos WHERE cotizacion_id = ?',
      [cotizacionId]
    );

    // Recalcular totales
    await CotizacionModel.recalcularTotales(cotizacionId);

    return result;
  }

  // ============================================
  // OBTENER TOTAL DESCUENTOS
  // ============================================
  static async obtenerTotalDescuentos(cotizacionId) {
    const [result] = await pool.query(
      'SELECT COALESCE(SUM(monto_calculado), 0) AS total FROM cotizacion_descuentos WHERE cotizacion_id = ?',
      [cotizacionId]
    );
    return parseFloat(result[0].total);
  }
}

module.exports = CotizacionDescuentoModel;
