// ============================================
// MODELO: AlquilerModel
// Alquileres confirmados (cotización aprobada)
// ============================================

const { pool } = require('../../../config/database');

class AlquilerModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos() {
    const query = `
      SELECT
        a.id,
        a.cotizacion_id,
        a.fecha_salida,
        a.fecha_retorno_esperado,
        a.fecha_retorno_real,
        a.total,
        a.deposito_cobrado,
        a.costo_danos,
        a.estado,
        a.created_at,
        cot.evento_nombre,
        cot.evento_ciudad,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        ec.nombre AS producto_nombre
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      ORDER BY a.fecha_salida DESC
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
        a.id,
        a.fecha_salida,
        a.fecha_retorno_esperado,
        a.total,
        a.estado,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        ec.nombre AS producto_nombre
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      WHERE a.estado = ?
      ORDER BY a.fecha_salida ASC
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
        a.*,
        cot.cliente_id,
        cot.compuesto_id,
        cot.evento_nombre,
        cot.evento_direccion,
        cot.evento_ciudad,
        cot.fecha_evento,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        cl.email AS cliente_email,
        ec.nombre AS producto_nombre,
        ec.codigo AS producto_codigo
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      WHERE a.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // CREAR (desde cotización aprobada)
  // ============================================
  static async crear({ cotizacion_id, fecha_salida, fecha_retorno_esperado, total, deposito_cobrado, notas_salida }) {
    const query = `
      INSERT INTO alquileres
        (cotizacion_id, fecha_salida, fecha_retorno_esperado, total, deposito_cobrado, notas_salida, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'programado')
    `;
    const [result] = await pool.query(query, [
      cotizacion_id,
      fecha_salida,
      fecha_retorno_esperado,
      total,
      deposito_cobrado || 0,
      notas_salida || null
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR ESTADO
  // ============================================
  static async actualizarEstado(id, estado) {
    const query = `UPDATE alquileres SET estado = ? WHERE id = ?`;
    const [result] = await pool.query(query, [estado, id]);
    return result;
  }

  // ============================================
  // MARCAR COMO ACTIVO (salida)
  // ============================================
  static async marcarActivo(id, { fecha_salida, notas_salida }) {
    const query = `
      UPDATE alquileres
      SET estado = 'activo', fecha_salida = ?, notas_salida = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      fecha_salida || new Date(),
      notas_salida || null,
      id
    ]);
    return result;
  }

  // ============================================
  // MARCAR COMO FINALIZADO (retorno)
  // ============================================
  static async marcarFinalizado(id, { fecha_retorno_real, costo_danos, notas_retorno }) {
    const query = `
      UPDATE alquileres
      SET estado = 'finalizado', fecha_retorno_real = ?, costo_danos = ?, notas_retorno = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      fecha_retorno_real || new Date(),
      costo_danos || 0,
      notas_retorno || null,
      id
    ]);
    return result;
  }

  // ============================================
  // CANCELAR
  // ============================================
  static async cancelar(id, notas) {
    const query = `
      UPDATE alquileres
      SET estado = 'cancelado', notas_retorno = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [notas || 'Cancelado', id]);
    return result;
  }

  // ============================================
  // OBTENER ACTIVOS (en curso)
  // ============================================
  static async obtenerActivos() {
    return this.obtenerPorEstado('activo');
  }

  // ============================================
  // OBTENER PROGRAMADOS
  // ============================================
  static async obtenerProgramados() {
    return this.obtenerPorEstado('programado');
  }

  // ============================================
  // OBTENER POR RANGO DE FECHAS
  // ============================================
  static async obtenerPorRangoFechas(fechaInicio, fechaFin) {
    const query = `
      SELECT
        a.id,
        a.fecha_salida,
        a.fecha_retorno_esperado,
        a.total,
        a.estado,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        ec.nombre AS producto_nombre
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      INNER JOIN elementos_compuestos ec ON cot.compuesto_id = ec.id
      WHERE a.fecha_salida BETWEEN ? AND ?
      ORDER BY a.fecha_salida ASC
    `;
    const [rows] = await pool.query(query, [fechaInicio, fechaFin]);
    return rows;
  }
}

module.exports = AlquilerModel;
