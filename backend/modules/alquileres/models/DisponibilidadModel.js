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
        e.requiere_series,
        SUM(cc.cantidad * cp.cantidad) AS cantidad_requerida
      FROM cotizacion_productos cp
      INNER JOIN compuesto_componentes cc ON cp.compuesto_id = cc.compuesto_id
      INNER JOIN elementos e ON cc.elemento_id = e.id
      WHERE cp.cotizacion_id = ?
        AND cc.tipo IN ('fijo', 'alternativa')
        AND (cc.tipo = 'fijo' OR cc.es_default = TRUE)
      GROUP BY cc.elemento_id, e.nombre, e.requiere_series
      ORDER BY e.nombre
    `;
    const [rows] = await pool.query(query, [cotizacionId]);
    return rows;
  }

  // ============================================
  // OBTENER STOCK TOTAL POR ELEMENTO
  // Respeta requiere_series: TRUE = series, FALSE = lotes
  // ============================================
  static async obtenerStockTotal(elementoId, requiereSeries) {
    if (requiereSeries) {
      // Contar series disponibles
      const [result] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM series
        WHERE elemento_id = ? AND estado = 'disponible'
      `, [elementoId]);
      return parseInt(result[0].total);
    } else {
      // Sumar cantidad de lotes disponibles
      const [result] = await pool.query(`
        SELECT COALESCE(SUM(cantidad), 0) AS total
        FROM lotes
        WHERE elemento_id = ? AND estado = 'disponible'
      `, [elementoId]);
      return parseInt(result[0].total);
    }
  }

  // ============================================
  // OBTENER CANTIDAD OCUPADA EN RANGO DE FECHAS
  // Respeta requiere_series: TRUE = series, FALSE = lotes
  // ============================================
  static async obtenerCantidadOcupada(elementoId, requiereSeries, fechaInicio, fechaFin) {
    if (requiereSeries) {
      // Contar series ocupadas en el rango
      const [result] = await pool.query(`
        SELECT COUNT(DISTINCT ae.serie_id) AS total
        FROM alquiler_elementos ae
        INNER JOIN alquileres a ON ae.alquiler_id = a.id
        WHERE ae.elemento_id = ?
          AND ae.serie_id IS NOT NULL
          AND a.estado IN ('programado', 'activo')
          AND NOT (a.fecha_retorno_esperado < ? OR a.fecha_salida > ?)
      `, [elementoId, fechaInicio, fechaFin]);
      return parseInt(result[0].total);
    } else {
      // Sumar cantidad de lotes ocupada en el rango
      const [result] = await pool.query(`
        SELECT COALESCE(SUM(ae.cantidad_lote), 0) AS total
        FROM alquiler_elementos ae
        INNER JOIN alquileres a ON ae.alquiler_id = a.id
        WHERE ae.elemento_id = ?
          AND ae.lote_id IS NOT NULL
          AND a.estado IN ('programado', 'activo')
          AND NOT (a.fecha_retorno_esperado < ? OR a.fecha_salida > ?)
      `, [elementoId, fechaInicio, fechaFin]);
      return parseInt(result[0].total);
    }
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
      const requiereSeries = elemento.requiere_series === 1 || elemento.requiere_series === true;

      const stockTotal = await this.obtenerStockTotal(elemento.elemento_id, requiereSeries);
      const ocupados = await this.obtenerCantidadOcupada(
        elemento.elemento_id,
        requiereSeries,
        fechaInicio,
        fechaFin
      );

      const disponibles = stockTotal - ocupados;
      const cantidadRequerida = parseInt(elemento.cantidad_requerida);
      const faltantes = Math.max(0, cantidadRequerida - disponibles);
      const tieneProblema = faltantes > 0;

      if (tieneProblema) hayProblemas = true;

      analisis.push({
        elemento_id: elemento.elemento_id,
        elemento_nombre: elemento.elemento_nombre,
        requiere_series: requiereSeries,
        cantidad_requerida: cantidadRequerida,
        stock_total: stockTotal,
        ocupados_en_fecha: ocupados,
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
  // Solo para elementos con requiere_series = TRUE
  // ============================================
  static async obtenerSeriesDisponibles(elementoId, fechaInicio, fechaFin, limite = null) {
    let query = `
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

    if (limite) {
      query += ` LIMIT ${parseInt(limite)}`;
    }

    const [rows] = await pool.query(query, [elementoId, fechaInicio, fechaFin]);
    return rows;
  }

  // ============================================
  // OBTENER LOTES DISPONIBLES PARA ELEMENTO EN FECHAS
  // Solo para elementos con requiere_series = FALSE
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
      ORDER BY (l.cantidad - cantidad_ocupada) DESC
    `;
    const [rows] = await pool.query(query, [fechaInicio, fechaFin, elementoId]);

    return rows.map(lote => ({
      ...lote,
      cantidad_disponible: lote.cantidad_total - lote.cantidad_ocupada
    }));
  }

  // ============================================
  // ASIGNAR ELEMENTOS AUTOMÁTICAMENTE
  // Selecciona series/lotes disponibles para cada elemento requerido
  // ============================================
  static async asignarAutomaticamente(cotizacionId, fechaInicio, fechaFin) {
    const elementosRequeridos = await this.obtenerElementosRequeridos(cotizacionId);
    const asignaciones = [];
    const advertencias = [];

    for (const elemento of elementosRequeridos) {
      const requiereSeries = elemento.requiere_series === 1 || elemento.requiere_series === true;
      const cantidadRequerida = parseInt(elemento.cantidad_requerida);

      if (requiereSeries) {
        // Asignar series específicas
        const seriesDisponibles = await this.obtenerSeriesDisponibles(
          elemento.elemento_id,
          fechaInicio,
          fechaFin,
          cantidadRequerida
        );

        for (const serie of seriesDisponibles) {
          asignaciones.push({
            elemento_id: elemento.elemento_id,
            elemento_nombre: elemento.elemento_nombre,
            serie_id: serie.id,
            numero_serie: serie.numero_serie,
            ubicacion_original_id: serie.ubicacion_id,
            lote_id: null,
            cantidad_lote: null
          });
        }

        if (seriesDisponibles.length < cantidadRequerida) {
          advertencias.push({
            elemento_id: elemento.elemento_id,
            elemento_nombre: elemento.elemento_nombre,
            requerido: cantidadRequerida,
            asignado: seriesDisponibles.length,
            faltante: cantidadRequerida - seriesDisponibles.length
          });
        }
      } else {
        // Asignar de lotes
        const lotesDisponibles = await this.obtenerLotesDisponibles(
          elemento.elemento_id,
          fechaInicio,
          fechaFin
        );

        let cantidadPendiente = cantidadRequerida;

        for (const lote of lotesDisponibles) {
          if (cantidadPendiente <= 0) break;

          const cantidadAsignar = Math.min(cantidadPendiente, lote.cantidad_disponible);

          asignaciones.push({
            elemento_id: elemento.elemento_id,
            elemento_nombre: elemento.elemento_nombre,
            serie_id: null,
            numero_serie: null,
            lote_id: lote.id,
            lote_numero: lote.lote_numero,
            cantidad_lote: cantidadAsignar,
            ubicacion_original_id: lote.ubicacion_id
          });

          cantidadPendiente -= cantidadAsignar;
        }

        if (cantidadPendiente > 0) {
          advertencias.push({
            elemento_id: elemento.elemento_id,
            elemento_nombre: elemento.elemento_nombre,
            requerido: cantidadRequerida,
            asignado: cantidadRequerida - cantidadPendiente,
            faltante: cantidadPendiente
          });
        }
      }
    }

    return {
      asignaciones,
      advertencias,
      hay_advertencias: advertencias.length > 0
    };
  }
}

module.exports = DisponibilidadModel;
