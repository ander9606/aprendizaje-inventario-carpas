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
  // Prioridad: series > lotes > cantidad en tabla elementos
  // ============================================
  static async obtenerStockTotal(elementoId, requiereSeries) {
    if (requiereSeries) {
      // Contar series disponibles
      const [result] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM series
        WHERE id_elemento = ? AND estado = 'disponible'
      `, [elementoId]);
      const totalSeries = parseInt(result[0].total);

      // Si hay series, usarlas
      if (totalSeries > 0) {
        return totalSeries;
      }

      // Fallback: usar cantidad de la tabla elementos
      return await this.obtenerCantidadElemento(elementoId);
    } else {
      // Sumar cantidad de lotes disponibles
      const [result] = await pool.query(`
        SELECT COALESCE(SUM(cantidad), 0) AS total
        FROM lotes
        WHERE elemento_id = ? AND estado = 'disponible'
      `, [elementoId]);
      const totalLotes = parseInt(result[0].total);

      // Si hay lotes, usarlos
      if (totalLotes > 0) {
        return totalLotes;
      }

      // Fallback: usar cantidad de la tabla elementos
      return await this.obtenerCantidadElemento(elementoId);
    }
  }

  // ============================================
  // OBTENER CANTIDAD DESDE TABLA ELEMENTOS (fallback)
  // ============================================
  static async obtenerCantidadElemento(elementoId) {
    const [result] = await pool.query(`
      SELECT COALESCE(cantidad, 0) AS total
      FROM elementos
      WHERE id = ?
    `, [elementoId]);
    return result.length > 0 ? parseInt(result[0].total) : 0;
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
      WHERE s.id_elemento = ?
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

  // ============================================
  // VERIFICAR DISPONIBILIDAD PARA PRODUCTOS (SIN COTIZACIÓN)
  // Útil para verificar ANTES de guardar la cotización
  // ============================================
  static async verificarDisponibilidadProductos(productos, fechaInicio, fechaFin) {
    // productos = [{ compuesto_id, cantidad, configuracion }]

    // Primero obtenemos los elementos requeridos de los productos
    const elementosRequeridos = await this.obtenerElementosDeProductos(productos);

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
  // OBTENER ELEMENTOS DE PRODUCTOS (SIN COTIZACIÓN)
  // Calcula qué elementos necesitan los productos seleccionados
  // ============================================
  static async obtenerElementosDeProductos(productos) {
    // productos = [{ compuesto_id, cantidad, configuracion }]

    if (!productos || productos.length === 0) {
      return [];
    }

    const elementosAgrupados = {};

    for (const producto of productos) {
      const compuestoId = producto.compuesto_id;
      const cantidadProducto = parseInt(producto.cantidad) || 1;
      const configuracion = producto.configuracion || {};

      // Obtener componentes fijos y alternativas default del producto
      const query = `
        SELECT
          cc.elemento_id,
          e.nombre AS elemento_nombre,
          e.requiere_series,
          cc.cantidad,
          cc.tipo,
          cc.grupo,
          cc.es_default
        FROM compuesto_componentes cc
        INNER JOIN elementos e ON cc.elemento_id = e.id
        WHERE cc.compuesto_id = ?
        ORDER BY cc.tipo, cc.grupo, cc.orden
      `;
      const [componentes] = await pool.query(query, [compuestoId]);

      for (const comp of componentes) {
        let incluir = false;
        let cantidadComponente = parseInt(comp.cantidad) || 1;

        if (comp.tipo === 'fijo') {
          // Los fijos siempre se incluyen
          incluir = true;
        } else if (comp.tipo === 'alternativa') {
          // Verificar si está en la configuración o es default
          if (configuracion.alternativas && configuracion.alternativas[comp.grupo]) {
            const seleccion = configuracion.alternativas[comp.grupo];
            if (seleccion[comp.elemento_id]) {
              incluir = true;
              cantidadComponente = parseInt(seleccion[comp.elemento_id]) || cantidadComponente;
            }
          } else if (comp.es_default) {
            // Si no hay configuración, usar el default
            incluir = true;
          }
        } else if (comp.tipo === 'adicional') {
          // Verificar si está en la configuración
          if (configuracion.adicionales && configuracion.adicionales[comp.elemento_id]) {
            incluir = true;
            cantidadComponente = parseInt(configuracion.adicionales[comp.elemento_id]) || cantidadComponente;
          }
        }

        if (incluir) {
          const elementoId = comp.elemento_id;
          const cantidadTotal = cantidadComponente * cantidadProducto;

          if (elementosAgrupados[elementoId]) {
            elementosAgrupados[elementoId].cantidad_requerida += cantidadTotal;
          } else {
            elementosAgrupados[elementoId] = {
              elemento_id: elementoId,
              elemento_nombre: comp.elemento_nombre,
              requiere_series: comp.requiere_series,
              cantidad_requerida: cantidadTotal
            };
          }
        }
      }
    }

    return Object.values(elementosAgrupados);
  }

  // ============================================
  // OBTENER CALENDARIO DE OCUPACIÓN
  // Retorna ocupaciones por elemento en un rango de fechas
  // ============================================
  static async obtenerCalendarioOcupacion(fechaInicio, fechaFin, elementoIds = null) {
    let query = `
      SELECT
        ae.elemento_id,
        e.nombre AS elemento_nombre,
        e.requiere_series,
        a.id AS alquiler_id,
        a.fecha_salida,
        a.fecha_retorno_esperado,
        a.estado AS alquiler_estado,
        c.evento_nombre,
        cl.nombre AS cliente_nombre,
        CASE
          WHEN ae.serie_id IS NOT NULL THEN 1
          ELSE ae.cantidad_lote
        END AS cantidad_ocupada,
        ae.serie_id,
        s.numero_serie
      FROM alquiler_elementos ae
      INNER JOIN alquileres a ON ae.alquiler_id = a.id
      INNER JOIN elementos e ON ae.elemento_id = e.id
      LEFT JOIN cotizaciones c ON a.cotizacion_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN series s ON ae.serie_id = s.id
      WHERE a.estado IN ('programado', 'activo')
        AND NOT (a.fecha_retorno_esperado < ? OR a.fecha_salida > ?)
    `;

    const params = [fechaInicio, fechaFin];

    if (elementoIds && elementoIds.length > 0) {
      query += ` AND ae.elemento_id IN (?)`;
      params.push(elementoIds);
    }

    query += ` ORDER BY ae.elemento_id, a.fecha_salida`;

    const [rows] = await pool.query(query, params);

    // Agrupar por elemento
    const calendario = {};
    for (const row of rows) {
      const elementoId = row.elemento_id;
      if (!calendario[elementoId]) {
        calendario[elementoId] = {
          elemento_id: elementoId,
          elemento_nombre: row.elemento_nombre,
          requiere_series: row.requiere_series,
          ocupaciones: []
        };
      }

      calendario[elementoId].ocupaciones.push({
        alquiler_id: row.alquiler_id,
        fecha_inicio: row.fecha_salida,
        fecha_fin: row.fecha_retorno_esperado,
        estado: row.alquiler_estado,
        evento: row.evento_nombre,
        cliente: row.cliente_nombre,
        cantidad: row.cantidad_ocupada,
        serie_id: row.serie_id,
        numero_serie: row.numero_serie
      });
    }

    return Object.values(calendario);
  }
}

module.exports = DisponibilidadModel;
