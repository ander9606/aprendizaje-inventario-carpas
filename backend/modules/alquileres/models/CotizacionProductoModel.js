// ============================================
// MODELO: CotizacionProductoModel
// Productos (elementos compuestos) en cada cotización
// ============================================

const { pool } = require('../../../config/database');

class CotizacionProductoModel {

  // ============================================
  // OBTENER POR COTIZACIÓN
  // ============================================
  static async obtenerPorCotizacion(cotizacionId) {
    const query = `
      SELECT
        cp.id,
        cp.cotizacion_id,
        cp.compuesto_id,
        cp.cantidad,
        cp.precio_base,
        cp.deposito,
        cp.precio_adicionales,
        cp.subtotal,
        cp.notas,
        cp.created_at,
        ec.nombre AS producto_nombre,
        ec.codigo AS producto_codigo,
        cat.nombre AS categoria_nombre,
        cat.emoji AS categoria_emoji
      FROM cotizacion_productos cp
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
      LEFT JOIN categorias_productos cat ON ec.categoria_id = cat.id
      WHERE cp.cotizacion_id = ?
      ORDER BY cp.id
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
        cp.*,
        ec.nombre AS producto_nombre,
        ec.codigo AS producto_codigo
      FROM cotizacion_productos cp
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
      WHERE cp.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // AGREGAR PRODUCTO A COTIZACIÓN
  // ============================================
  static async agregar({ cotizacion_id, compuesto_id, cantidad, precio_base, deposito, precio_adicionales, notas }) {
    const subtotal = ((precio_base || 0) + (precio_adicionales || 0)) * (cantidad || 1);

    const query = `
      INSERT INTO cotizacion_productos
        (cotizacion_id, compuesto_id, cantidad, precio_base, deposito, precio_adicionales, subtotal, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cotizacion_id,
      compuesto_id,
      cantidad || 1,
      precio_base || 0,
      deposito || 0,
      precio_adicionales || 0,
      subtotal,
      notas || null
    ]);
    return result;
  }

  // ============================================
  // AGREGAR MÚLTIPLES PRODUCTOS
  // ============================================
  static async agregarMultiples(cotizacionId, productos) {
    if (!productos || productos.length === 0) return { affectedRows: 0 };

    const query = `
      INSERT INTO cotizacion_productos
        (cotizacion_id, compuesto_id, cantidad, precio_base, deposito, precio_adicionales, subtotal, notas)
      VALUES ?
    `;

    const valores = productos.map(p => {
      const subtotal = ((p.precio_base || 0) + (p.precio_adicionales || 0)) * (p.cantidad || 1);
      return [
        cotizacionId,
        p.compuesto_id,
        p.cantidad || 1,
        p.precio_base || 0,
        p.deposito || 0,
        p.precio_adicionales || 0,
        subtotal,
        p.notas || null
      ];
    });

    const [result] = await pool.query(query, [valores]);
    return result;
  }

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================
  static async actualizar(id, { cantidad, precio_base, deposito, precio_adicionales, notas }) {
    const subtotal = ((precio_base || 0) + (precio_adicionales || 0)) * (cantidad || 1);

    const query = `
      UPDATE cotizacion_productos
      SET cantidad = ?, precio_base = ?, deposito = ?, precio_adicionales = ?, subtotal = ?, notas = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      cantidad || 1,
      precio_base || 0,
      deposito || 0,
      precio_adicionales || 0,
      subtotal,
      notas || null,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR PRODUCTO
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM cotizacion_productos WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // ELIMINAR TODOS DE UNA COTIZACIÓN
  // ============================================
  static async eliminarPorCotizacion(cotizacionId) {
    const [result] = await pool.query(
      'DELETE FROM cotizacion_productos WHERE cotizacion_id = ?',
      [cotizacionId]
    );
    return result;
  }

  // ============================================
  // CALCULAR SUBTOTAL DE COTIZACIÓN
  // ============================================
  static async calcularSubtotalCotizacion(cotizacionId) {
    const query = `
      SELECT
        COALESCE(SUM(subtotal), 0) AS subtotal_productos,
        COALESCE(SUM(deposito * cantidad), 0) AS total_deposito
      FROM cotizacion_productos
      WHERE cotizacion_id = ?
    `;
    const [rows] = await pool.query(query, [cotizacionId]);
    return rows[0];
  }

  // ============================================
  // OBTENER CON DETALLES (componentes elegidos)
  // ============================================
  static async obtenerConDetalles(cotizacionProductoId) {
    const producto = await this.obtenerPorId(cotizacionProductoId);
    if (!producto) return null;

    const queryDetalles = `
      SELECT
        cd.id,
        cd.elemento_id,
        cd.cantidad,
        cd.precio_unitario,
        cd.subtotal,
        cd.grupo,
        cd.tipo,
        e.nombre AS elemento_nombre
      FROM cotizacion_detalles cd
      INNER JOIN elementos e ON cd.elemento_id = e.id
      WHERE cd.cotizacion_producto_id = ?
      ORDER BY cd.tipo, cd.grupo, e.nombre
    `;
    const [detalles] = await pool.query(queryDetalles, [cotizacionProductoId]);

    return {
      ...producto,
      detalles
    };
  }
}

module.exports = CotizacionProductoModel;
