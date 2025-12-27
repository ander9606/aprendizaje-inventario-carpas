// ============================================
// MODELO: CotizacionModel
// Cotizaciones generadas para clientes
// ============================================

const { pool } = require('../../../config/database');

class CotizacionModel {

  // ============================================
  // OBTENER TODAS
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT
        cot.id,
        cot.cliente_id,
        cot.compuesto_id,
        cot.fecha_evento,
        cot.fecha_fin_evento,
        cot.evento_nombre,
        cot.evento_ciudad,
        cot.subtotal,
        cot.descuento,
        cot.total,
        cot.estado,
        cot.vigencia_dias,
        cot.created_at,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        ec.nombre AS producto_nombre,
        ec.codigo AS producto_codigo
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      ORDER BY cot.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ESTADO
  // ============================================
  static async obtenerPorEstado(estado) {
    const query = `
      SELECT
        cot.id,
        cot.cliente_id,
        cot.fecha_evento,
        cot.evento_nombre,
        cot.total,
        cot.estado,
        cot.created_at,
        cl.nombre AS cliente_nombre,
        ec.nombre AS producto_nombre
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      WHERE cot.estado = ?
      ORDER BY cot.fecha_evento ASC
    `;
    const [rows] = await pool.query(query, [estado]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT
        cot.*,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        cl.email AS cliente_email,
        cl.direccion AS cliente_direccion,
        ec.nombre AS producto_nombre,
        ec.codigo AS producto_codigo,
        ec.precio_base AS producto_precio_base
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      WHERE cot.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR ID CON DETALLES
  // ============================================
  static async obtenerPorIdConDetalles(id) {
    const cotizacion = await this.obtenerPorId(id);
    if (!cotizacion) return null;

    // Obtener detalles
    const queryDetalles = `
      SELECT
        cd.id,
        cd.elemento_id,
        cd.cantidad,
        cd.precio_unitario,
        cd.subtotal,
        cd.grupo,
        e.nombre AS elemento_nombre,
        e.codigo AS elemento_codigo,
        c.emoji AS elemento_emoji
      FROM cotizacion_detalles cd
      INNER JOIN elementos e ON cd.elemento_id = e.id
      LEFT JOIN categorias c ON e.categoria_id = c.id
      WHERE cd.cotizacion_id = ?
      ORDER BY cd.grupo, e.nombre
    `;
    const [detalles] = await pool.query(queryDetalles, [id]);

    return {
      ...cotizacion,
      detalles
    };
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ cliente_id, compuesto_id, fecha_evento, fecha_fin_evento, evento_nombre, evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas }) {
    const query = `
      INSERT INTO cotizaciones
        (cliente_id, compuesto_id, fecha_evento, fecha_fin_evento, evento_nombre,
         evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cliente_id,
      compuesto_id,
      fecha_evento,
      fecha_fin_evento || null,
      evento_nombre || null,
      evento_direccion || null,
      evento_ciudad || null,
      subtotal || 0,
      descuento || 0,
      total || 0,
      vigencia_dias || 15,
      notas || null
    ]);
    return result;
  }

  // ============================================
  // AGREGAR DETALLES
  // ============================================
  static async agregarDetalles(cotizacionId, detalles) {
    if (!detalles || detalles.length === 0) return { affectedRows: 0 };

    const query = `
      INSERT INTO cotizacion_detalles
        (cotizacion_id, elemento_id, cantidad, precio_unitario, subtotal, grupo)
      VALUES ?
    `;

    const valores = detalles.map(d => [
      cotizacionId,
      d.elemento_id,
      d.cantidad || 1,
      d.precio_unitario || 0,
      d.subtotal || (d.cantidad * d.precio_unitario) || 0,
      d.grupo || null
    ]);

    const [result] = await pool.query(query, [valores]);
    return result;
  }

  // ============================================
  // ACTUALIZAR ESTADO
  // ============================================
  static async actualizarEstado(id, estado) {
    const query = `UPDATE cotizaciones SET estado = ? WHERE id = ?`;
    const [result] = await pool.query(query, [estado, id]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { fecha_evento, fecha_fin_evento, evento_nombre, evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas }) {
    const query = `
      UPDATE cotizaciones
      SET fecha_evento = ?, fecha_fin_evento = ?, evento_nombre = ?,
          evento_direccion = ?, evento_ciudad = ?, subtotal = ?,
          descuento = ?, total = ?, vigencia_dias = ?, notas = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      fecha_evento,
      fecha_fin_evento || null,
      evento_nombre || null,
      evento_direccion || null,
      evento_ciudad || null,
      subtotal || 0,
      descuento || 0,
      total || 0,
      vigencia_dias || 15,
      notas || null,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR DETALLES
  // ============================================
  static async eliminarDetalles(cotizacionId) {
    const [result] = await pool.query('DELETE FROM cotizacion_detalles WHERE cotizacion_id = ?', [cotizacionId]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    // Primero eliminar detalles
    await this.eliminarDetalles(id);
    const [result] = await pool.query('DELETE FROM cotizaciones WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // OBTENER POR CLIENTE
  // ============================================
  static async obtenerPorCliente(clienteId) {
    const query = `
      SELECT
        cot.id,
        cot.fecha_evento,
        cot.evento_nombre,
        cot.total,
        cot.estado,
        cot.created_at,
        ec.nombre AS producto_nombre
      FROM cotizaciones cot
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      WHERE cot.cliente_id = ?
      ORDER BY cot.created_at DESC
    `;
    const [rows] = await pool.query(query, [clienteId]);
    return rows;
  }

  // ============================================
  // VERIFICAR SI TIENE ALQUILER
  // ============================================
  static async tieneAlquiler(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM alquileres WHERE cotizacion_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }
}

module.exports = CotizacionModel;
