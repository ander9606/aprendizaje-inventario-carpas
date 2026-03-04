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
  // OBTENER HISTORIAL DE EVENTOS DEL CLIENTE
  // ============================================
  static async obtenerHistorialEventos(clienteId) {
    // Eventos del cliente con estadísticas
    const eventosQuery = `
      SELECT
        e.id,
        e.nombre,
        e.descripcion,
        DATE_FORMAT(e.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d') AS fecha_fin,
        e.direccion,
        e.estado,
        ci.nombre AS ciudad_nombre,
        e.created_at,
        (SELECT COUNT(*) FROM cotizaciones WHERE evento_id = e.id) AS total_cotizaciones,
        (SELECT COALESCE(SUM(total), 0) FROM cotizaciones WHERE evento_id = e.id AND estado = 'aprobada') AS valor_aprobado,
        (SELECT COUNT(*) FROM cotizaciones cot
          INNER JOIN alquileres a ON a.cotizacion_id = cot.id
          WHERE cot.evento_id = e.id) AS total_alquileres,
        (SELECT COUNT(*) FROM cotizaciones cot
          INNER JOIN alquileres a ON a.cotizacion_id = cot.id
          WHERE cot.evento_id = e.id AND a.estado = 'finalizado') AS alquileres_finalizados
      FROM eventos e
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      WHERE e.cliente_id = ?
      ORDER BY e.fecha_inicio DESC
    `;
    const [eventos] = await pool.query(eventosQuery, [clienteId]);

    // Para cada evento, obtener los productos alquilados (resumen)
    for (const evento of eventos) {
      const productosQuery = `
        SELECT
          ec.nombre AS nombre_producto,
          cp.cantidad,
          cp.precio_base AS precio_unitario,
          cp.subtotal,
          cot.estado AS estado_cotizacion
        FROM cotizacion_productos cp
        INNER JOIN cotizaciones cot ON cp.cotizacion_id = cot.id
        INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
        WHERE cot.evento_id = ? AND cot.estado = 'aprobada'
        ORDER BY ec.nombre
      `;
      const [productos] = await pool.query(productosQuery, [evento.id]);
      evento.productos = productos;
    }

    // Resumen general del cliente
    const resumenQuery = `
      SELECT
        COUNT(DISTINCT e.id) AS total_eventos,
        COUNT(DISTINCT CASE WHEN e.estado = 'completado' THEN e.id END) AS eventos_completados,
        COUNT(DISTINCT CASE WHEN e.estado = 'activo' THEN e.id END) AS eventos_activos,
        COALESCE(SUM(CASE WHEN cot.estado = 'aprobada' THEN cot.total ELSE 0 END), 0) AS total_facturado
      FROM eventos e
      LEFT JOIN cotizaciones cot ON cot.evento_id = e.id
      WHERE e.cliente_id = ?
    `;
    const [resumenRows] = await pool.query(resumenQuery, [clienteId]);

    return {
      eventos,
      resumen: resumenRows[0]
    };
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
