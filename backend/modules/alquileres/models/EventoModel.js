// ============================================
// MODELO: EventoModel
// Eventos para cotizaciones
// ============================================

const { pool } = require('../../../config/database');

class EventoModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos() {
    const query = `
      SELECT
        e.id,
        e.cliente_id,
        e.nombre,
        e.descripcion,
        e.fecha_inicio,
        e.fecha_fin,
        e.direccion,
        e.ciudad_id,
        e.notas,
        e.estado,
        e.created_at,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        ci.nombre AS ciudad_nombre,
        (SELECT COUNT(*) FROM cotizaciones WHERE evento_id = e.id) AS total_cotizaciones,
        (SELECT COALESCE(SUM(total), 0) FROM cotizaciones WHERE evento_id = e.id) AS total_valor
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      ORDER BY e.fecha_inicio DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    // Obtener evento con info básica
    const query = `
      SELECT
        e.*,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email,
        ci.nombre AS ciudad_nombre
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      WHERE e.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    const evento = rows[0];

    if (!evento) return null;

    // Obtener cotizaciones del evento
    const cotizacionesQuery = `
      SELECT
        cot.id,
        cot.subtotal,
        cot.total,
        cot.descuento,
        cot.estado,
        cot.fecha_evento,
        cot.fecha_montaje,
        cot.fecha_desmontaje,
        cot.created_at,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos,
        (SELECT COUNT(*) FROM alquileres WHERE cotizacion_id = cot.id) AS tiene_alquiler
      FROM cotizaciones cot
      WHERE cot.evento_id = ?
      ORDER BY cot.created_at DESC
    `;
    const [cotizaciones] = await pool.query(cotizacionesQuery, [id]);

    // Calcular resumen
    const resumen = {
      total_cotizaciones: cotizaciones.length,
      total_valor: cotizaciones.reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0),
      cotizaciones_pendientes: cotizaciones.filter(c => c.estado === 'pendiente').length,
      cotizaciones_aprobadas: cotizaciones.filter(c => c.estado === 'aprobada').length
    };

    return {
      ...evento,
      cotizaciones,
      resumen
    };
  }

  // ============================================
  // OBTENER POR CLIENTE
  // ============================================
  static async obtenerPorCliente(clienteId) {
    const query = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_inicio,
        e.fecha_fin,
        e.ciudad_id,
        ci.nombre AS ciudad_nombre,
        e.estado,
        e.created_at,
        (SELECT COUNT(*) FROM cotizaciones WHERE evento_id = e.id) AS total_cotizaciones
      FROM eventos e
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      WHERE e.cliente_id = ?
      ORDER BY e.fecha_inicio DESC
    `;
    const [rows] = await pool.query(query, [clienteId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ESTADO
  // ============================================
  static async obtenerPorEstado(estado) {
    const query = `
      SELECT
        e.id,
        e.cliente_id,
        e.nombre,
        e.fecha_inicio,
        e.fecha_fin,
        e.ciudad_id,
        ci.nombre AS ciudad_nombre,
        e.estado,
        c.nombre AS cliente_nombre
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      WHERE e.estado = ?
      ORDER BY e.fecha_inicio ASC
    `;
    const [rows] = await pool.query(query, [estado]);
    return rows;
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ cliente_id, nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas }) {
    const query = `
      INSERT INTO eventos
        (cliente_id, nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cliente_id,
      nombre,
      descripcion || null,
      fecha_inicio,
      fecha_fin || fecha_inicio,
      direccion || null,
      ciudad_id || null,
      notas || null
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas, estado }) {
    const query = `
      UPDATE eventos
      SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?,
          direccion = ?, ciudad_id = ?, notas = ?, estado = COALESCE(?, estado)
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      descripcion || null,
      fecha_inicio,
      fecha_fin || fecha_inicio,
      direccion || null,
      ciudad_id || null,
      notas || null,
      estado,
      id
    ]);
    return result;
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================
  static async cambiarEstado(id, estado) {
    const query = `UPDATE eventos SET estado = ? WHERE id = ?`;
    const [result] = await pool.query(query, [estado, id]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM eventos WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // OBTENER COTIZACIONES DEL EVENTO
  // ============================================
  static async obtenerCotizaciones(eventoId) {
    const query = `
      SELECT
        c.id,
        c.subtotal,
        c.total,
        c.estado,
        c.created_at,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = c.id) AS total_productos
      FROM cotizaciones c
      WHERE c.evento_id = ?
      ORDER BY c.created_at DESC
    `;
    const [rows] = await pool.query(query, [eventoId]);
    return rows;
  }

  // ============================================
  // VERIFICAR SI TIENE COTIZACIONES
  // ============================================
  static async tieneCotizaciones(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM cotizaciones WHERE evento_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }
}

module.exports = EventoModel;
