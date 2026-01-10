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
        cot.fecha_montaje,
        cot.fecha_evento,
        cot.fecha_desmontaje,
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
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
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
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
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
        cl.tipo_documento AS cliente_tipo_documento,
        cl.numero_documento AS cliente_numero_documento
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE cot.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER COMPLETA (con productos y transporte)
  // ============================================
  static async obtenerCompleta(id) {
    const cotizacion = await this.obtenerPorId(id);
    if (!cotizacion) return null;

    // Obtener productos
    const queryProductos = `
      SELECT
        cp.id,
        cp.compuesto_id,
        cp.cantidad,
        cp.precio_base,
        cp.deposito,
        cp.precio_adicionales,
        cp.subtotal,
        cp.notas,
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
    const [productos] = await pool.query(queryProductos, [id]);

    // Obtener transporte
    const queryTransporte = `
      SELECT
        ct.id,
        ct.tarifa_id,
        ct.cantidad,
        ct.precio_unitario,
        ct.subtotal,
        ct.notas,
        t.tipo_camion,
        c.nombre AS ciudad
      FROM cotizacion_transportes ct
      INNER JOIN tarifas_transporte t ON ct.tarifa_id = t.id
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE ct.cotizacion_id = ?
    `;
    const [transporte] = await pool.query(queryTransporte, [id]);

    // Calcular totales
    const subtotalProductos = productos.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
    const subtotalTransporte = transporte.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
    const totalDeposito = productos.reduce((sum, p) => sum + (parseFloat(p.deposito) * p.cantidad), 0);

    return {
      ...cotizacion,
      productos,
      transporte,
      resumen: {
        subtotal_productos: subtotalProductos,
        subtotal_transporte: subtotalTransporte,
        total_deposito: totalDeposito
      }
    };
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ cliente_id, fecha_montaje, fecha_evento, fecha_desmontaje, evento_nombre, evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas }) {
    const query = `
      INSERT INTO cotizaciones
        (cliente_id, fecha_montaje, fecha_evento, fecha_desmontaje, evento_nombre,
         evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cliente_id,
      fecha_montaje || fecha_evento,
      fecha_evento,
      fecha_desmontaje || fecha_evento,
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
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { fecha_montaje, fecha_evento, fecha_desmontaje, evento_nombre, evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas }) {
    const query = `
      UPDATE cotizaciones
      SET fecha_montaje = ?, fecha_evento = ?, fecha_desmontaje = ?, evento_nombre = ?,
          evento_direccion = ?, evento_ciudad = ?, subtotal = ?,
          descuento = ?, total = ?, vigencia_dias = ?, notas = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      fecha_montaje || fecha_evento,
      fecha_evento,
      fecha_desmontaje || fecha_evento,
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
  // ACTUALIZAR TOTALES
  // ============================================
  static async actualizarTotales(id, { subtotal, descuento, total }) {
    const query = `
      UPDATE cotizaciones
      SET subtotal = ?, descuento = ?, total = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [subtotal, descuento || 0, total, id]);
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
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    // Los productos y transporte se eliminan por CASCADE
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
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos
      FROM cotizaciones cot
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

  // ============================================
  // RECALCULAR TOTALES
  // ============================================
  static async recalcularTotales(id) {
    // Obtener subtotal de productos
    const [productos] = await pool.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM cotizacion_productos WHERE cotizacion_id = ?',
      [id]
    );

    // Obtener subtotal de transporte
    const [transporte] = await pool.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM cotizacion_transportes WHERE cotizacion_id = ?',
      [id]
    );

    // Obtener descuento actual
    const [cotizacion] = await pool.query(
      'SELECT descuento FROM cotizaciones WHERE id = ?',
      [id]
    );

    const subtotal = parseFloat(productos[0].subtotal) + parseFloat(transporte[0].subtotal);
    const descuento = parseFloat(cotizacion[0]?.descuento || 0);
    const total = subtotal - descuento;

    await this.actualizarTotales(id, { subtotal, descuento, total });

    return { subtotal, descuento, total };
  }

  // ============================================
  // DUPLICAR COTIZACIÓN
  // ============================================
  static async duplicar(id) {
    const original = await this.obtenerCompleta(id);
    if (!original) return null;

    // Crear nueva cotización
    const resultado = await this.crear({
      cliente_id: original.cliente_id,
      fecha_montaje: original.fecha_montaje,
      fecha_evento: original.fecha_evento,
      fecha_desmontaje: original.fecha_desmontaje,
      evento_nombre: original.evento_nombre ? `${original.evento_nombre} (copia)` : null,
      evento_direccion: original.evento_direccion,
      evento_ciudad: original.evento_ciudad,
      subtotal: original.subtotal,
      descuento: original.descuento,
      total: original.total,
      vigencia_dias: original.vigencia_dias,
      notas: original.notas
    });

    const nuevaCotizacionId = resultado.insertId;

    // Duplicar productos
    if (original.productos && original.productos.length > 0) {
      const queryProductos = `
        INSERT INTO cotizacion_productos
          (cotizacion_id, compuesto_id, cantidad, precio_base, deposito, precio_adicionales, subtotal, notas)
        VALUES ?
      `;
      const valoresProductos = original.productos.map(p => [
        nuevaCotizacionId,
        p.compuesto_id,
        p.cantidad,
        p.precio_base,
        p.deposito,
        p.precio_adicionales,
        p.subtotal,
        p.notas
      ]);
      await pool.query(queryProductos, [valoresProductos]);
    }

    // Duplicar transporte
    if (original.transporte && original.transporte.length > 0) {
      const queryTransporte = `
        INSERT INTO cotizacion_transportes
          (cotizacion_id, tarifa_id, cantidad, precio_unitario, subtotal, notas)
        VALUES ?
      `;
      const valoresTransporte = original.transporte.map(t => [
        nuevaCotizacionId,
        t.tarifa_id,
        t.cantidad,
        t.precio_unitario,
        t.subtotal,
        t.notas
      ]);
      await pool.query(queryTransporte, [valoresTransporte]);
    }

    return nuevaCotizacionId;
  }
}

module.exports = CotizacionModel;
