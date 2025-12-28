// ============================================
// MODELO: ClienteModel
// Clientes para cotizaciones y alquileres
// ============================================

const { pool } = require('../../../config/database');

class ClienteModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos() {
    const query = `
      SELECT
        id,
        tipo_documento,
        numero_documento,
        nombre,
        telefono,
        email,
        direccion,
        ciudad,
        notas,
        activo,
        created_at,
        updated_at
      FROM clientes
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER ACTIVOS
  // ============================================
  static async obtenerActivos() {
    const query = `
      SELECT
        id,
        tipo_documento,
        numero_documento,
        nombre,
        telefono,
        email,
        ciudad
      FROM clientes
      WHERE activo = TRUE
      ORDER BY nombre
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
        id,
        tipo_documento,
        numero_documento,
        nombre,
        telefono,
        email,
        direccion,
        ciudad,
        notas,
        activo,
        created_at,
        updated_at
      FROM clientes
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR DOCUMENTO
  // ============================================
  static async obtenerPorDocumento(tipoDocumento, numeroDocumento) {
    const query = `
      SELECT * FROM clientes
      WHERE tipo_documento = ? AND numero_documento = ?
    `;
    const [rows] = await pool.query(query, [tipoDocumento, numeroDocumento]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ tipo_documento, numero_documento, nombre, telefono, email, direccion, ciudad, notas }) {
    const query = `
      INSERT INTO clientes
        (tipo_documento, numero_documento, nombre, telefono, email, direccion, ciudad, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      tipo_documento || 'CC',
      numero_documento,
      nombre,
      telefono || null,
      email || null,
      direccion || null,
      ciudad || null,
      notas || null
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { tipo_documento, numero_documento, nombre, telefono, email, direccion, ciudad, notas, activo }) {
    const query = `
      UPDATE clientes
      SET tipo_documento = ?, numero_documento = ?, nombre = ?, telefono = ?,
          email = ?, direccion = ?, ciudad = ?, notas = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      tipo_documento || 'CC',
      numero_documento,
      nombre,
      telefono || null,
      email || null,
      direccion || null,
      ciudad || null,
      notas || null,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // BUSCAR
  // ============================================
  static async buscar(termino) {
    const query = `
      SELECT
        id,
        tipo_documento,
        numero_documento,
        nombre,
        telefono,
        email,
        ciudad
      FROM clientes
      WHERE activo = TRUE
        AND (nombre LIKE ? OR numero_documento LIKE ? OR email LIKE ?)
      ORDER BY nombre
      LIMIT 20
    `;
    const busqueda = `%${termino}%`;
    const [rows] = await pool.query(query, [busqueda, busqueda, busqueda]);
    return rows;
  }

  // ============================================
  // VERIFICAR SI TIENE COTIZACIONES
  // ============================================
  static async tieneCotizaciones(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM cotizaciones WHERE cliente_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }
}

module.exports = ClienteModel;
