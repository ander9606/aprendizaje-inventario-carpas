// ============================================
// MODELO: AlquilerElementoModel
// Series/lotes asignados a cada alquiler
// ============================================

const { pool } = require('../../../config/database');

class AlquilerElementoModel {

  // ============================================
  // OBTENER POR ALQUILER
  // ============================================
  static async obtenerPorAlquiler(tenantId, alquilerId) {
    const query = `
      SELECT
        ae.id,
        ae.alquiler_id,
        ae.elemento_id,
        ae.serie_id,
        ae.lote_id,
        ae.cantidad_lote,
        ae.estado_salida,
        ae.estado_retorno,
        ae.costo_dano,
        ae.notas_retorno,
        ae.ubicacion_original_id,
        ae.fecha_asignacion,
        ae.fecha_retorno,
        e.nombre AS elemento_nombre,
        s.numero_serie AS serie_codigo,
        l.lote_numero AS lote_codigo,
        u.nombre AS ubicacion_original_nombre
      FROM alquiler_elementos ae
      INNER JOIN elementos e ON ae.elemento_id = e.id AND e.tenant_id = ?
      LEFT JOIN series s ON ae.serie_id = s.id AND s.tenant_id = ?
      LEFT JOIN lotes l ON ae.lote_id = l.id AND l.tenant_id = ?
      LEFT JOIN ubicaciones u ON ae.ubicacion_original_id = u.id AND u.tenant_id = ?
      WHERE ae.tenant_id = ? AND ae.alquiler_id = ?
      ORDER BY e.nombre, s.numero_serie
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, tenantId, tenantId, alquilerId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(tenantId, id) {
    const query = `
      SELECT
        ae.*,
        e.nombre AS elemento_nombre,
        e.requiere_series,
        s.numero_serie AS serie_codigo,
        l.lote_numero AS lote_codigo,
        la.lote_numero AS lote_alquilado_numero
      FROM alquiler_elementos ae
      INNER JOIN elementos e ON ae.elemento_id = e.id AND e.tenant_id = ?
      LEFT JOIN series s ON ae.serie_id = s.id AND s.tenant_id = ?
      LEFT JOIN lotes l ON ae.lote_id = l.id AND l.tenant_id = ?
      LEFT JOIN lotes la ON ae.lote_alquilado_id = la.id AND la.tenant_id = ?
      WHERE ae.tenant_id = ? AND ae.id = ?
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, tenantId, tenantId, id]);
    return rows[0];
  }

  // ============================================
  // ASIGNAR SERIE
  // ============================================
  static async asignarSerie(tenantId, { alquiler_id, elemento_id, serie_id, estado_salida, ubicacion_original_id }) {
    const query = `
      INSERT INTO alquiler_elementos
        (tenant_id, alquiler_id, elemento_id, serie_id, estado_salida, ubicacion_original_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      tenantId,
      alquiler_id,
      elemento_id,
      serie_id,
      estado_salida || 'bueno',
      ubicacion_original_id
    ]);
    return result;
  }

  // ============================================
  // ASIGNAR LOTE (cantidad parcial)
  // ============================================
  static async asignarLote(tenantId, { alquiler_id, elemento_id, lote_id, cantidad_lote, estado_salida, ubicacion_original_id }) {
    const query = `
      INSERT INTO alquiler_elementos
        (tenant_id, alquiler_id, elemento_id, lote_id, cantidad_lote, estado_salida, ubicacion_original_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      tenantId,
      alquiler_id,
      elemento_id,
      lote_id,
      cantidad_lote,
      estado_salida || 'bueno',
      ubicacion_original_id
    ]);
    return result;
  }

  // ============================================
  // ASIGNAR MÚLTIPLES ELEMENTOS
  // ============================================
  static async asignarMultiples(tenantId, alquilerId, elementos) {
    if (!elementos || elementos.length === 0) return { affectedRows: 0 };

    const query = `
      INSERT INTO alquiler_elementos
        (tenant_id, alquiler_id, elemento_id, serie_id, lote_id, cantidad_lote, estado_salida, ubicacion_original_id)
      VALUES ?
    `;

    const valores = elementos.map(e => [
      tenantId,
      alquilerId,
      e.elemento_id,
      e.serie_id || null,
      e.lote_id || null,
      e.cantidad_lote || null,
      e.estado_salida || 'bueno',
      e.ubicacion_original_id || null
    ]);

    const [result] = await pool.query(query, [valores]);
    return result;
  }

  // ============================================
  // REGISTRAR RETORNO DE ELEMENTO
  // ============================================
  static async registrarRetorno(tenantId, id, { estado_retorno, costo_dano, notas_retorno }) {
    const query = `
      UPDATE alquiler_elementos
      SET estado_retorno = ?, costo_dano = ?, notas_retorno = ?, fecha_retorno = NOW()
      WHERE tenant_id = ? AND id = ?
    `;
    const [result] = await pool.query(query, [
      estado_retorno,
      costo_dano || 0,
      notas_retorno || null,
      tenantId,
      id
    ]);
    return result;
  }

  // ============================================
  // SINCRONIZAR ESTADO RETORNO DESDE BODEGA
  // ============================================
  /**
   * Sincroniza estado_retorno en alquiler_elementos basándose en la
   * verificación de bodega del checklist de la orden de trabajo.
   * @param {number} tenantId - ID del tenant
   * @param {number} ordenElementoId - ID del registro en orden_trabajo_elementos
   * @param {boolean} verificadoBodega - si el elemento fue verificado en bodega
   * @param {boolean} marcadoDano - si el elemento está marcado con daño
   * @returns {Promise<Object|null>} registro actualizado o null si no hay match
   */
  static async sincronizarEstadoRetornoDesdeBodega(tenantId, ordenElementoId, verificadoBodega, marcadoDano) {
    const [rows] = await pool.query(`
      SELECT ae.id
      FROM alquiler_elementos ae
      INNER JOIN ordenes_trabajo ot ON ot.alquiler_id = ae.alquiler_id AND ot.tenant_id = ?
      INNER JOIN orden_trabajo_elementos ote ON ote.orden_id = ot.id AND ote.tenant_id = ?
      WHERE ae.tenant_id = ? AND ote.id = ?
        AND ot.alquiler_id IS NOT NULL
        AND ae.elemento_id = ote.elemento_id
        AND (ae.serie_id = ote.serie_id OR (ae.serie_id IS NULL AND ote.serie_id IS NULL))
        AND (ae.lote_id = ote.lote_id OR (ae.lote_id IS NULL AND ote.lote_id IS NULL))
      LIMIT 1
    `, [tenantId, tenantId, tenantId, ordenElementoId]);

    if (rows.length === 0) return null;

    const estadoRetorno = verificadoBodega ? (marcadoDano ? 'dañado' : 'bueno') : null;

    await pool.query(
      'UPDATE alquiler_elementos SET estado_retorno = ? WHERE tenant_id = ? AND id = ?',
      [estadoRetorno, tenantId, rows[0].id]
    );

    return { id: rows[0].id, estado_retorno: estadoRetorno };
  }

  // ============================================
  // REGISTRAR RETORNO MASIVO
  // ============================================
  static async registrarRetornoMasivo(tenantId, alquilerId, estadoRetorno) {
    const query = `
      UPDATE alquiler_elementos
      SET estado_retorno = ?, fecha_retorno = NOW()
      WHERE tenant_id = ? AND alquiler_id = ? AND estado_retorno IS NULL
    `;
    const [result] = await pool.query(query, [estadoRetorno, tenantId, alquilerId]);
    return result;
  }

  // ============================================
  // ACTUALIZAR LOTE ALQUILADO
  // Guarda el ID del lote con estado 'alquilado' para tracking
  // ============================================
  static async actualizarLoteAlquilado(tenantId, id, loteAlquiladoId) {
    const query = `
      UPDATE alquiler_elementos
      SET lote_alquilado_id = ?
      WHERE tenant_id = ? AND id = ?
    `;
    const [result] = await pool.query(query, [loteAlquiladoId, tenantId, id]);
    return result;
  }

  // ============================================
  // ELIMINAR ASIGNACIÓN
  // ============================================
  static async eliminar(tenantId, id) {
    const [result] = await pool.query('DELETE FROM alquiler_elementos WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return result;
  }

  // ============================================
  // ELIMINAR TODAS DE UN ALQUILER
  // ============================================
  static async eliminarPorAlquiler(tenantId, alquilerId) {
    const [result] = await pool.query(
      'DELETE FROM alquiler_elementos WHERE tenant_id = ? AND alquiler_id = ?',
      [tenantId, alquilerId]
    );
    return result;
  }

  // ============================================
  // CALCULAR TOTAL DAÑOS DE UN ALQUILER
  // ============================================
  static async calcularTotalDanos(tenantId, alquilerId) {
    const query = `
      SELECT COALESCE(SUM(costo_dano), 0) AS total_danos
      FROM alquiler_elementos
      WHERE tenant_id = ? AND alquiler_id = ?
    `;
    const [rows] = await pool.query(query, [tenantId, alquilerId]);
    return rows[0].total_danos;
  }

  // ============================================
  // VERIFICAR SI SERIE ESTÁ EN ALQUILER ACTIVO
  // ============================================
  static async serieEnAlquilerActivo(tenantId, serieId) {
    const query = `
      SELECT ae.id
      FROM alquiler_elementos ae
      INNER JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = ?
      WHERE ae.tenant_id = ? AND ae.serie_id = ? AND a.estado IN ('programado', 'activo')
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, serieId]);
    return rows.length > 0;
  }

  // ============================================
  // OBTENER ELEMENTOS PENDIENTES DE RETORNO
  // ============================================
  static async obtenerPendientesRetorno(tenantId, alquilerId) {
    const query = `
      SELECT
        ae.*,
        e.nombre AS elemento_nombre,
        s.numero_serie AS serie_codigo,
        l.lote_numero AS lote_codigo
      FROM alquiler_elementos ae
      INNER JOIN elementos e ON ae.elemento_id = e.id AND e.tenant_id = ?
      LEFT JOIN series s ON ae.serie_id = s.id AND s.tenant_id = ?
      LEFT JOIN lotes l ON ae.lote_id = l.id AND l.tenant_id = ?
      WHERE ae.tenant_id = ? AND ae.alquiler_id = ? AND ae.estado_retorno IS NULL
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, tenantId, alquilerId]);
    return rows;
  }

  // ============================================
  // OBTENER RESUMEN POR ALQUILER
  // ============================================
  static async obtenerResumen(tenantId, alquilerId) {
    const query = `
      SELECT
        COUNT(*) AS total_elementos,
        SUM(CASE WHEN estado_retorno IS NOT NULL THEN 1 ELSE 0 END) AS retornados,
        SUM(CASE WHEN estado_retorno IS NULL THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado_retorno = 'dañado' THEN 1 ELSE 0 END) AS danados,
        SUM(CASE WHEN estado_retorno = 'perdido' THEN 1 ELSE 0 END) AS perdidos,
        COALESCE(SUM(costo_dano), 0) AS total_danos
      FROM alquiler_elementos
      WHERE tenant_id = ? AND alquiler_id = ?
    `;
    const [rows] = await pool.query(query, [tenantId, alquilerId]);
    return rows[0];
  }
}

module.exports = AlquilerElementoModel;
