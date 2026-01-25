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
        e.fecha_evento,
        e.fecha_montaje,
        e.fecha_desmontaje,
        e.direccion,
        e.ciudad,
        e.notas,
        e.estado,
        e.created_at,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        (SELECT COUNT(*) FROM cotizaciones WHERE evento_id = e.id) AS total_cotizaciones
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      ORDER BY e.fecha_evento DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT
        e.*,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      WHERE e.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR CLIENTE
  // ============================================
  static async obtenerPorCliente(clienteId) {
    const query = `
      SELECT
        e.id,
        e.nombre,
        e.fecha_evento,
        e.ciudad,
        e.estado,
        e.created_at,
        (SELECT COUNT(*) FROM cotizaciones WHERE evento_id = e.id) AS total_cotizaciones
      FROM eventos e
      WHERE e.cliente_id = ?
      ORDER BY e.fecha_evento DESC
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
        e.fecha_evento,
        e.ciudad,
        e.estado,
        c.nombre AS cliente_nombre
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      WHERE e.estado = ?
      ORDER BY e.fecha_evento ASC
    `;
    const [rows] = await pool.query(query, [estado]);
    return rows;
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ cliente_id, nombre, fecha_evento, fecha_montaje, fecha_desmontaje, direccion, ciudad, notas }) {
    const query = `
      INSERT INTO eventos
        (cliente_id, nombre, fecha_evento, fecha_montaje, fecha_desmontaje, direccion, ciudad, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cliente_id,
      nombre,
      fecha_evento,
      fecha_montaje || fecha_evento,
      fecha_desmontaje || fecha_evento,
      direccion || null,
      ciudad || null,
      notas || null
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { nombre, fecha_evento, fecha_montaje, fecha_desmontaje, direccion, ciudad, notas, estado }) {
    const query = `
      UPDATE eventos
      SET nombre = ?, fecha_evento = ?, fecha_montaje = ?, fecha_desmontaje = ?,
          direccion = ?, ciudad = ?, notas = ?, estado = COALESCE(?, estado)
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      fecha_evento,
      fecha_montaje || fecha_evento,
      fecha_desmontaje || fecha_evento,
      direccion || null,
      ciudad || null,
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
