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
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos,
        (SELECT COUNT(*) FROM alquiler_elementos WHERE alquiler_id = a.id) AS total_elementos,
        (
          SELECT GROUP_CONCAT(CONCAT(ec.nombre, ' x', cp.cantidad) SEPARATOR ', ')
          FROM cotizacion_productos cp
          INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
          WHERE cp.cotizacion_id = cot.id
        ) AS productos_resumen
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
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
        a.cotizacion_id,
        a.fecha_salida,
        a.fecha_retorno_esperado,
        a.total,
        a.deposito_cobrado,
        a.costo_danos,
        a.estado,
        cot.evento_nombre,
        cot.evento_ciudad,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos,
        (
          SELECT GROUP_CONCAT(CONCAT(ec.nombre, ' x', cp.cantidad) SEPARATOR ', ')
          FROM cotizacion_productos cp
          INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
          WHERE cp.cotizacion_id = cot.id
        ) AS productos_resumen
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
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
        cot.evento_nombre,
        cot.evento_direccion,
        cot.evento_ciudad,
        cot.fecha_evento,
        cot.subtotal AS cotizacion_subtotal,
        cot.descuento AS cotizacion_descuento,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        cl.email AS cliente_email,
        cl.tipo_documento AS cliente_tipo_documento,
        cl.numero_documento AS cliente_numero_documento
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE a.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER COMPLETO (con productos y elementos)
  // ============================================
  static async obtenerCompleto(id) {
    const alquiler = await this.obtenerPorId(id);
    if (!alquiler) return null;

    // Obtener productos de la cotización
    const queryProductos = `
      SELECT
        cp.id,
        cp.compuesto_id,
        cp.cantidad,
        cp.precio_base,
        cp.subtotal,
        ec.nombre AS nombre,
        ec.codigo AS codigo
      FROM cotizacion_productos cp
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
      WHERE cp.cotizacion_id = ?
    `;
    const [productos] = await pool.query(queryProductos, [alquiler.cotizacion_id]);

    // Obtener elementos asignados
    const queryElementos = `
      SELECT
        ae.id,
        ae.elemento_id,
        ae.serie_id,
        ae.lote_id,
        ae.cantidad_lote,
        ae.estado_salida,
        ae.estado_retorno,
        ae.costo_dano,
        ae.notas_retorno,
        ae.fecha_asignacion,
        ae.fecha_retorno,
        e.nombre AS elemento_nombre,
        s.numero_serie AS serie_codigo,
        l.lote_numero AS lote_codigo,
        u.nombre AS ubicacion_original
      FROM alquiler_elementos ae
      INNER JOIN elementos e ON ae.elemento_id = e.id
      LEFT JOIN series s ON ae.serie_id = s.id
      LEFT JOIN lotes l ON ae.lote_id = l.id
      LEFT JOIN ubicaciones u ON ae.ubicacion_original_id = u.id
      WHERE ae.alquiler_id = ?
      ORDER BY e.nombre
    `;
    const [elementos] = await pool.query(queryElementos, [id]);

    // Obtener transporte de la cotización
    const queryTransporte = `
      SELECT
        ct.id,
        ct.cantidad,
        ct.precio_unitario,
        ct.subtotal,
        t.tipo_camion,
        c.nombre AS ciudad
      FROM cotizacion_transportes ct
      INNER JOIN tarifas_transporte t ON ct.tarifa_id = t.id
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE ct.cotizacion_id = ?
    `;
    const [transporte] = await pool.query(queryTransporte, [alquiler.cotizacion_id]);

    return {
      ...alquiler,
      productos,
      elementos,
      transporte,
      resumen_elementos: {
        total: elementos.length,
        retornados: elementos.filter(e => e.estado_retorno).length,
        pendientes: elementos.filter(e => !e.estado_retorno).length,
        danados: elementos.filter(e => e.estado_retorno === 'dañado').length,
        perdidos: elementos.filter(e => e.estado_retorno === 'perdido').length
      }
    };
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
        cot.evento_ciudad,
        cl.nombre AS cliente_nombre
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE a.fecha_salida BETWEEN ? AND ?
      ORDER BY a.fecha_salida ASC
    `;
    const [rows] = await pool.query(query, [fechaInicio, fechaFin]);
    return rows;
  }

  // ============================================
  // ACTUALIZAR COSTO DE DAÑOS
  // ============================================
  static async actualizarCostoDanos(id) {
    const query = `
      UPDATE alquileres a
      SET costo_danos = (
        SELECT COALESCE(SUM(costo_dano), 0)
        FROM alquiler_elementos
        WHERE alquiler_id = ?
      )
      WHERE a.id = ?
    `;
    const [result] = await pool.query(query, [id, id]);
    return result;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  static async obtenerEstadisticas(fechaInicio, fechaFin) {
    let where = '';
    const params = [];
    if (fechaInicio && fechaFin) {
      where = 'WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(fechaInicio, fechaFin);
    }
    const query = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'programado' THEN 1 ELSE 0 END) AS programados,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN estado = 'finalizado' THEN 1 ELSE 0 END) AS finalizados,
        SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) AS cancelados,
        COALESCE(SUM(CASE WHEN estado != 'cancelado' THEN total ELSE 0 END), 0) AS ingresos_totales
      FROM alquileres
      ${where}
    `;
    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  // ============================================
  // REPORTES: Ingresos por mes
  // ============================================
  static async obtenerIngresosPorMes(fechaInicio, fechaFin) {
    let dateFilter = 'a.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
    const params = [];
    if (fechaInicio && fechaFin) {
      dateFilter = 'a.created_at >= ? AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(fechaInicio, fechaFin);
    }
    const query = `
      SELECT
        DATE_FORMAT(a.created_at, '%Y-%m') AS mes,
        COUNT(*) AS cantidad,
        COALESCE(SUM(a.total), 0) AS ingresos
      FROM alquileres a
      WHERE a.estado != 'cancelado'
        AND ${dateFilter}
      GROUP BY mes
      ORDER BY mes
    `;
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // ============================================
  // REPORTES: Top clientes por ingresos
  // ============================================
  static async obtenerTopClientes(limite = 10, fechaInicio, fechaFin) {
    let dateFilter = '';
    const params = [];
    if (fechaInicio && fechaFin) {
      dateFilter = 'AND a.created_at >= ? AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(fechaInicio, fechaFin);
    }
    params.push(limite);
    const query = `
      SELECT
        cl.id AS cliente_id,
        cl.nombre AS cliente_nombre,
        COUNT(a.id) AS total_alquileres,
        COALESCE(SUM(a.total), 0) AS ingresos
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE a.estado != 'cancelado'
      ${dateFilter}
      GROUP BY cl.id, cl.nombre
      ORDER BY ingresos DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // ============================================
  // REPORTES: Productos más alquilados
  // ============================================
  static async obtenerProductosMasAlquilados(limite = 10, fechaInicio, fechaFin) {
    let dateFilter = '';
    const params = [];
    if (fechaInicio && fechaFin) {
      dateFilter = 'AND a.created_at >= ? AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(fechaInicio, fechaFin);
    }
    params.push(limite);
    const query = `
      SELECT
        ec.id AS producto_id,
        ec.nombre AS producto_nombre,
        SUM(cp.cantidad) AS veces_alquilado,
        COALESCE(SUM(cp.subtotal), 0) AS ingresos
      FROM alquileres a
      INNER JOIN cotizacion_productos cp ON cp.cotizacion_id = a.cotizacion_id
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
      WHERE a.estado != 'cancelado'
      ${dateFilter}
      GROUP BY ec.id, ec.nombre
      ORDER BY veces_alquilado DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // ============================================
  // REPORTES: Ciudades con más eventos
  // ============================================
  static async obtenerAlquileresPorCiudad(fechaInicio, fechaFin) {
    let dateFilter = '';
    const params = [];
    if (fechaInicio && fechaFin) {
      dateFilter = 'AND a.created_at >= ? AND a.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(fechaInicio, fechaFin);
    }
    const query = `
      SELECT
        COALESCE(cot.evento_ciudad, 'Sin ciudad') AS ciudad,
        COUNT(a.id) AS cantidad,
        COALESCE(SUM(a.total), 0) AS ingresos
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      WHERE a.estado != 'cancelado'
      ${dateFilter}
      GROUP BY ciudad
      ORDER BY cantidad DESC
      LIMIT 10
    `;
    const [rows] = await pool.query(query, params);
    return rows;
  }
}

module.exports = AlquilerModel;
