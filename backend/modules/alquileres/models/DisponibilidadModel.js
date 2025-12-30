// ============================================
// MODELO: DisponibilidadModel
// Cálculo de disponibilidad de elementos por fechas
// ============================================

const { pool } = require('../../../config/database');

class DisponibilidadModel {

  // ============================================
  // OBTENER ELEMENTOS REQUERIDOS POR COTIZACIÓN
  // Calcula qué elementos y cantidades necesita una cotización
  // ============================================
  static async obtenerElementosRequeridos(cotizacionId) {
    const query = `
      SELECT
        cc.elemento_id,
        e.nombre AS elemento_nombre,
        e.tipo AS elemento_tipo,
        SUM(cc.cantidad * cp.cantidad) AS cantidad_requerida
      FROM cotizacion_productos cp
      INNER JOIN compuesto_componentes cc ON cp.compuesto_id = cc.compuesto_id
      INNER JOIN elementos e ON cc.elemento_id = e.id
      WHERE cp.cotizacion_id = ?
        AND cc.tipo IN ('fijo', 'alternativa')
        AND (cc.tipo = 'fijo' OR cc.es_default = TRUE)
      GROUP BY cc.elemento_id, e.nombre, e.tipo
      ORDER BY e.nombre
    `;
    const [rows] = await pool.query(query, [cotizacionId]);
    return rows;
  }

  // ============================================
  // OBTENER STOCK TOTAL POR ELEMENTO
  // Total de series/lotes disponibles (estado = 'disponible')
  // ============================================
  static async obtenerStockTotal(elementoId) {
    // Para series (elementos con seguimiento individual)
    const [series] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM series
      WHERE elemento_id = ? AND estado = 'disponible'
    `, [elementoId]);

    // Para lotes (elementos con cantidad)
    const [lotes] = await pool.query(`
      SELECT COALESCE(SUM(cantidad), 0) AS total
      FROM lotes
      WHERE elemento_id = ? AND estado = 'disponible'
    `, [elementoId]);

    return {
      series: parseInt(series[0].total),
      lotes: parseInt(lotes[0].total),
      total: parseInt(series[0].total) + parseInt(lotes[0].total)
    };
  }

  // ============================================
  // OBTENER ELEMENTOS OCUPADOS EN RANGO DE FECHAS
  // Series/lotes asignados a alquileres activos/programados en esas fechas
  // ============================================
  static async obtenerElementosOcupados(elementoId, fechaInicio, fechaFin) {
    // Series ocupadas
    const [seriesOcupadas] = await pool.query(`
      SELECT COUNT(DISTINCT ae.serie_id) AS total
      FROM alquiler_elementos ae
      INNER JOIN alquileres a ON ae.alquiler_id = a.id
      WHERE ae.elemento_id = ?
        AND ae.serie_id IS NOT NULL
        AND a.estado IN ('programado', 'activo')
        AND NOT (
          a.fecha_retorno_esperado < ? OR a.fecha_salida > ?
        )
    `, [elementoId, fechaInicio, fechaFin]);

    // Cantidad de lotes ocupados
    const [lotesOcupados] = await pool.query(`
      SELECT COALESCE(SUM(ae.cantidad_lote), 0) AS total
      FROM alquiler_elementos ae
      INNER JOIN alquileres a ON ae.alquiler_id = a.id
      WHERE ae.elemento_id = ?
        AND ae.lote_id IS NOT NULL
        AND a.estado IN ('programado', 'activo')
        AND NOT (
          a.fecha_retorno_esperado < ? OR a.fecha_salida > ?
        )
    `, [elementoId, fechaInicio, fechaFin]);

    return {
      series: parseInt(seriesOcupadas[0].total),
      lotes: parseInt(lotesOcupados[0].total),
      total: parseInt(seriesOcupadas[0].total) + parseInt(lotesOcupados[0].total)
    };
  }

  // ============================================
  // VERIFICAR DISPONIBILIDAD PARA COTIZACIÓN
  // Retorna análisis completo de disponibilidad
  // ============================================
  static async verificarDisponibilidadCotizacion(cotizacionId, fechaInicio, fechaFin) {
    const elementosRequeridos = await this.obtenerElementosRequeridos(cotizacionId);

    const analisis = [];
    let hayProblemas = false;

    for (const elemento of elementosRequeridos) {
      const stockTotal = await this.obtenerStockTotal(elemento.elemento_id);
      const ocupados = await this.obtenerElementosOcupados(
        elemento.elemento_id,
        fechaInicio,
        fechaFin
      );

      const disponibles = stockTotal.total - ocupados.total;
      const faltantes = Math.max(0, elemento.cantidad_requerida - disponibles);
      const tieneProblema = faltantes > 0;

      if (tieneProblema) hayProblemas = true;

      analisis.push({
        elemento_id: elemento.elemento_id,
        elemento_nombre: elemento.elemento_nombre,
        elemento_tipo: elemento.elemento_tipo,
        cantidad_requerida: parseInt(elemento.cantidad_requerida),
        stock_total: stockTotal.total,
        ocupados_en_fecha: ocupados.total,
        disponibles: disponibles,
        faltantes: faltantes,
        estado: tieneProblema ? 'insuficiente' : 'ok'
      });
    }

    return {
      cotizacion_id: cotizacionId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      hay_problemas: hayProblemas,
      elementos: analisis,
      resumen: {
        total_elementos: analisis.length,
        elementos_ok: analisis.filter(e => e.estado === 'ok').length,
        elementos_insuficientes: analisis.filter(e => e.estado === 'insuficiente').length
      }
    };
  }

  // ============================================
  // OBTENER SERIES DISPONIBLES PARA ELEMENTO EN FECHAS
  // Lista de series específicas que se pueden asignar
  // ============================================
  static async obtenerSeriesDisponibles(elementoId, fechaInicio, fechaFin) {
    const query = `
      SELECT
        s.id,
        s.numero_serie,
        s.estado AS estado_actual,
        u.nombre AS ubicacion_nombre,
        u.id AS ubicacion_id
      FROM series s
      LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
      WHERE s.elemento_id = ?
        AND s.estado = 'disponible'
        AND s.id NOT IN (
          SELECT ae.serie_id
          FROM alquiler_elementos ae
          INNER JOIN alquileres a ON ae.alquiler_id = a.id
          WHERE ae.serie_id IS NOT NULL
            AND a.estado IN ('programado', 'activo')
            AND NOT (a.fecha_retorno_esperado < ? OR a.fecha_salida > ?)
        )
      ORDER BY s.numero_serie
    `;
    const [rows] = await pool.query(query, [elementoId, fechaInicio, fechaFin]);
    return rows;
  }

  // ============================================
  // OBTENER LOTES DISPONIBLES PARA ELEMENTO EN FECHAS
  // Lista de lotes con cantidad disponible
  // ============================================
  static async obtenerLotesDisponibles(elementoId, fechaInicio, fechaFin) {
    const query = `
      SELECT
        l.id,
        l.lote_numero,
        l.cantidad AS cantidad_total,
        l.estado AS estado_actual,
        u.nombre AS ubicacion_nombre,
        u.id AS ubicacion_id,
        COALESCE(
          (SELECT SUM(ae.cantidad_lote)
           FROM alquiler_elementos ae
           INNER JOIN alquileres a ON ae.alquiler_id = a.id
           WHERE ae.lote_id = l.id
             AND a.estado IN ('programado', 'activo')
             AND NOT (a.fecha_retorno_esperado < ? OR a.fecha_salida > ?)
          ), 0
        ) AS cantidad_ocupada
      FROM lotes l
      LEFT JOIN ubicaciones u ON l.ubicacion_id = u.id
      WHERE l.elemento_id = ?
        AND l.estado = 'disponible'
      HAVING (l.cantidad - cantidad_ocupada) > 0
      ORDER BY l.lote_numero
    `;
    const [rows] = await pool.query(query, [fechaInicio, fechaFin, elementoId]);

    // Calcular cantidad disponible
    return rows.map(lote => ({
      ...lote,
      cantidad_disponible: lote.cantidad_total - lote.cantidad_ocupada
    }));
  }
}

module.exports = DisponibilidadModel;
