// ============================================
// MODELO: AlquilerModel
// Alquileres confirmados (cotización aprobada)
// ============================================

const { pool } = require('../../../config/database');

class AlquilerModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos(tenantId) {
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
        (SELECT COUNT(*) FROM cotizacion_productos WHERE tenant_id = a.tenant_id AND cotizacion_id = cot.id) AS total_productos,
        (SELECT COUNT(*) FROM alquiler_elementos WHERE tenant_id = a.tenant_id AND alquiler_id = a.id) AS total_elementos,
        (
          SELECT GROUP_CONCAT(CONCAT(ec.nombre, ' x', cp.cantidad) SEPARATOR ', ')
          FROM cotizacion_productos cp
          INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id AND ec.tenant_id = cp.tenant_id
          WHERE cp.tenant_id = a.tenant_id AND cp.cotizacion_id = cot.id
        ) AS productos_resumen
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
      INNER JOIN clientes cl ON cot.cliente_id = cl.id AND cl.tenant_id = ?
      WHERE a.tenant_id = ?
      ORDER BY a.fecha_salida DESC
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ESTADO
  // ============================================
  static async obtenerPorEstado(tenantId, estado) {
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
        (SELECT COUNT(*) FROM cotizacion_productos WHERE tenant_id = a.tenant_id AND cotizacion_id = cot.id) AS total_productos,
        (
          SELECT GROUP_CONCAT(CONCAT(ec.nombre, ' x', cp.cantidad) SEPARATOR ', ')
          FROM cotizacion_productos cp
          INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id AND ec.tenant_id = cp.tenant_id
          WHERE cp.tenant_id = a.tenant_id AND cp.cotizacion_id = cot.id
        ) AS productos_resumen
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
      INNER JOIN clientes cl ON cot.cliente_id = cl.id AND cl.tenant_id = ?
      WHERE a.tenant_id = ? AND a.estado = ?
      ORDER BY a.fecha_salida ASC
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, estado]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(tenantId, id) {
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
        cl.numero_documento AS cliente_numero_documento,
        (SELECT ot.id FROM ordenes_trabajo ot WHERE ot.tenant_id = a.tenant_id AND ot.alquiler_id = a.id AND ot.tipo = 'montaje' LIMIT 1) AS orden_montaje_id,
        (SELECT ot.estado FROM ordenes_trabajo ot WHERE ot.tenant_id = a.tenant_id AND ot.alquiler_id = a.id AND ot.tipo = 'montaje' LIMIT 1) AS orden_montaje_estado,
        (SELECT ot.id FROM ordenes_trabajo ot WHERE ot.tenant_id = a.tenant_id AND ot.alquiler_id = a.id AND ot.tipo = 'desmontaje' LIMIT 1) AS orden_desmontaje_id,
        (SELECT ot.estado FROM ordenes_trabajo ot WHERE ot.tenant_id = a.tenant_id AND ot.alquiler_id = a.id AND ot.tipo = 'desmontaje' LIMIT 1) AS orden_desmontaje_estado
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
      INNER JOIN clientes cl ON cot.cliente_id = cl.id AND cl.tenant_id = ?
      WHERE a.tenant_id = ? AND a.id = ?
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, id]);
    return rows[0];
  }

  // ============================================
  // OBTENER COMPLETO (con productos y elementos)
  // ============================================
  static async obtenerCompleto(tenantId, id) {
    const alquiler = await this.obtenerPorId(tenantId, id);
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
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id AND ec.tenant_id = ?
      WHERE cp.tenant_id = ? AND cp.cotizacion_id = ?
    `;
    const [productos] = await pool.query(queryProductos, [tenantId, tenantId, alquiler.cotizacion_id]);

    // Obtener elementos asignados (con estado_retorno derivado del checklist de bodega si no está guardado)
    const queryElementos = `
      SELECT
        ae.id,
        ae.elemento_id,
        ae.serie_id,
        ae.lote_id,
        ae.cantidad_lote,
        ae.estado_salida,
        COALESCE(
          ae.estado_retorno,
          CASE
            WHEN ote.verificado_bodega = TRUE AND ote.marcado_dano = TRUE THEN 'dañado'
            WHEN ote.verificado_bodega = TRUE THEN 'bueno'
            ELSE NULL
          END
        ) AS estado_retorno,
        ae.costo_dano,
        ae.notas_retorno,
        ae.fecha_asignacion,
        ae.fecha_retorno,
        e.nombre AS elemento_nombre,
        s.numero_serie AS serie_codigo,
        l.lote_numero AS lote_codigo,
        u.nombre AS ubicacion_original
      FROM alquiler_elementos ae
      INNER JOIN elementos e ON ae.elemento_id = e.id AND e.tenant_id = ?
      LEFT JOIN series s ON ae.serie_id = s.id AND s.tenant_id = ?
      LEFT JOIN lotes l ON ae.lote_id = l.id AND l.tenant_id = ?
      LEFT JOIN ubicaciones u ON ae.ubicacion_original_id = u.id AND u.tenant_id = ?
      LEFT JOIN ordenes_trabajo ot ON ot.alquiler_id = ae.alquiler_id AND ot.tenant_id = ae.tenant_id AND ot.tipo = 'desmontaje'
      LEFT JOIN orden_trabajo_elementos ote ON
        ote.orden_id = ot.id
        AND ote.tenant_id = ae.tenant_id
        AND ote.elemento_id = ae.elemento_id
        AND (ote.serie_id = ae.serie_id OR (ote.serie_id IS NULL AND ae.serie_id IS NULL))
        AND (ote.lote_id = ae.lote_id OR (ote.lote_id IS NULL AND ae.lote_id IS NULL))
      WHERE ae.tenant_id = ? AND ae.alquiler_id = ?
      ORDER BY e.nombre
    `;
    const [elementos] = await pool.query(queryElementos, [tenantId, tenantId, tenantId, tenantId, tenantId, id]);

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
      INNER JOIN tarifas_transporte t ON ct.tarifa_id = t.id AND t.tenant_id = ?
      LEFT JOIN ciudades c ON t.ciudad_id = c.id AND c.tenant_id = ?
      WHERE ct.tenant_id = ? AND ct.cotizacion_id = ?
    `;
    const [transporte] = await pool.query(queryTransporte, [tenantId, tenantId, tenantId, alquiler.cotizacion_id]);

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
  static async crear(tenantId, { cotizacion_id, fecha_salida, fecha_retorno_esperado, total, deposito_cobrado, notas_salida }) {
    const query = `
      INSERT INTO alquileres
        (tenant_id, cotizacion_id, fecha_salida, fecha_retorno_esperado, total, deposito_cobrado, notas_salida, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'programado')
    `;
    const [result] = await pool.query(query, [
      tenantId,
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
  static async actualizarEstado(tenantId, id, estado) {
    const query = `UPDATE alquileres SET estado = ? WHERE tenant_id = ? AND id = ?`;
    const [result] = await pool.query(query, [estado, tenantId, id]);
    return result;
  }

  // ============================================
  // MARCAR COMO ACTIVO (salida)
  // ============================================
  static async marcarActivo(tenantId, id, { fecha_salida, notas_salida }) {
    const query = `
      UPDATE alquileres
      SET estado = 'activo', fecha_salida = ?, notas_salida = ?
      WHERE tenant_id = ? AND id = ?
    `;
    const [result] = await pool.query(query, [
      fecha_salida || new Date(),
      notas_salida || null,
      tenantId,
      id
    ]);
    return result;
  }

  // ============================================
  // MARCAR COMO FINALIZADO (retorno)
  // ============================================
  static async marcarFinalizado(tenantId, id, { fecha_retorno_real, costo_danos, notas_retorno }) {
    const query = `
      UPDATE alquileres
      SET estado = 'finalizado', fecha_retorno_real = ?, costo_danos = ?, notas_retorno = ?
      WHERE tenant_id = ? AND id = ?
    `;
    const [result] = await pool.query(query, [
      fecha_retorno_real || new Date(),
      costo_danos || 0,
      notas_retorno || null,
      tenantId,
      id
    ]);
    return result;
  }

  // ============================================
  // CANCELAR
  // ============================================
  static async cancelar(tenantId, id, notas) {
    const query = `
      UPDATE alquileres
      SET estado = 'cancelado', notas_retorno = ?
      WHERE tenant_id = ? AND id = ?
    `;
    const [result] = await pool.query(query, [notas || 'Cancelado', tenantId, id]);
    return result;
  }

  // ============================================
  // OBTENER ACTIVOS (en curso)
  // ============================================
  static async obtenerActivos(tenantId) {
    return this.obtenerPorEstado(tenantId, 'activo');
  }

  // ============================================
  // OBTENER PROGRAMADOS
  // ============================================
  static async obtenerProgramados(tenantId) {
    return this.obtenerPorEstado(tenantId, 'programado');
  }

  // ============================================
  // OBTENER POR RANGO DE FECHAS
  // ============================================
  static async obtenerPorRangoFechas(tenantId, fechaInicio, fechaFin) {
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
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
      INNER JOIN clientes cl ON cot.cliente_id = cl.id AND cl.tenant_id = ?
      WHERE a.tenant_id = ? AND a.fecha_salida BETWEEN ? AND ?
      ORDER BY a.fecha_salida ASC
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, fechaInicio, fechaFin]);
    return rows;
  }

  // ============================================
  // ACTUALIZAR COSTO DE DAÑOS
  // ============================================
  static async actualizarCostoDanos(tenantId, id) {
    const query = `
      UPDATE alquileres a
      SET costo_danos = (
        SELECT COALESCE(SUM(costo_dano), 0)
        FROM alquiler_elementos
        WHERE tenant_id = ? AND alquiler_id = ?
      )
      WHERE a.tenant_id = ? AND a.id = ?
    `;
    const [result] = await pool.query(query, [tenantId, id, tenantId, id]);
    return result;
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  static async obtenerEstadisticas(tenantId, fechaInicio, fechaFin) {
    let where = 'WHERE tenant_id = ?';
    const params = [tenantId];
    if (fechaInicio && fechaFin) {
      where += ' AND created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(fechaInicio, fechaFin);
    }
    const query = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'programado' THEN 1 ELSE 0 END) AS programados,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN estado = 'finalizado' THEN 1 ELSE 0 END) AS finalizados,
        SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) AS cancelados,
        COALESCE(SUM(CASE WHEN estado = 'finalizado' THEN total ELSE 0 END), 0) AS ingresos_realizados,
        COALESCE(SUM(CASE WHEN estado IN ('programado', 'activo') THEN total ELSE 0 END), 0) AS ingresos_esperados
      FROM alquileres
      ${where}
    `;
    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  // ============================================
  // REPORTES: Ingresos por mes
  // ============================================
  static async obtenerIngresosPorMes(tenantId, fechaInicio, fechaFin) {
    let dateFilter = 'a.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
    const params = [tenantId];
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
      WHERE a.tenant_id = ?
        AND a.estado != 'cancelado'
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
  static async obtenerTopClientes(tenantId, limite = 10, fechaInicio, fechaFin) {
    let dateFilter = '';
    const params = [tenantId, tenantId, tenantId];
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
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
      INNER JOIN clientes cl ON cot.cliente_id = cl.id AND cl.tenant_id = ?
      WHERE a.tenant_id = ? AND a.estado != 'cancelado'
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
  static async obtenerProductosMasAlquilados(tenantId, limite = 10, fechaInicio, fechaFin) {
    let dateFilter = '';
    const params = [tenantId, tenantId, tenantId];
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
      INNER JOIN cotizacion_productos cp ON cp.cotizacion_id = a.cotizacion_id AND cp.tenant_id = ?
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id AND ec.tenant_id = ?
      WHERE a.tenant_id = ? AND a.estado != 'cancelado'
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
  static async obtenerAlquileresPorCiudad(tenantId, fechaInicio, fechaFin) {
    let dateFilter = '';
    const params = [tenantId, tenantId];
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
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
      WHERE a.tenant_id = ? AND a.estado != 'cancelado'
      ${dateFilter}
      GROUP BY ciudad
      ORDER BY cantidad DESC
      LIMIT 10
    `;
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // ============================================
  // EXTENSION DE ALQUILER
  // ============================================

  /**
   * Extender la fecha de retorno de un alquiler.
   * @param {number} tenantId - ID del tenant
   * @param {number} id - ID del alquiler
   * @param {Object} datos - Datos de la extensión
   */
  static async extenderFechaRetorno(tenantId, id, { nueva_fecha_retorno, razon, costo_extension = 0, registrado_por = null }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Obtener alquiler actual
      const [alquileres] = await connection.query(
        'SELECT fecha_retorno_esperado, fecha_retorno_original, extensiones_count FROM alquileres WHERE tenant_id = ? AND id = ?',
        [tenantId, id]
      );
      const alquiler = alquileres[0];
      if (!alquiler) throw new Error('Alquiler no encontrado');

      const fechaRetornoAnterior = alquiler.fecha_retorno_esperado;
      const diasExtension = Math.ceil(
        (new Date(nueva_fecha_retorno) - new Date(fechaRetornoAnterior)) / (1000 * 60 * 60 * 24)
      );

      // Registrar en historial de extensiones
      await connection.query(
        `INSERT INTO alquiler_extensiones
          (tenant_id, alquiler_id, fecha_retorno_anterior, fecha_retorno_nueva, dias_extension, razon, costo_extension, registrado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, id, fechaRetornoAnterior, nueva_fecha_retorno, diasExtension, razon || null, costo_extension, registrado_por]
      );

      // Actualizar alquiler
      await connection.query(
        `UPDATE alquileres
        SET fecha_retorno_esperado = ?,
            extensiones_count = extensiones_count + 1,
            fecha_retorno_original = COALESCE(fecha_retorno_original, ?)
        WHERE tenant_id = ? AND id = ?`,
        [nueva_fecha_retorno, fechaRetornoAnterior, tenantId, id]
      );

      await connection.commit();

      return {
        alquiler_id: id,
        fecha_retorno_anterior: fechaRetornoAnterior,
        fecha_retorno_nueva: nueva_fecha_retorno,
        dias_extension: diasExtension,
        costo_extension,
        extensiones_count: (alquiler.extensiones_count || 0) + 1
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener historial de extensiones de un alquiler.
   * @param {number} tenantId - ID del tenant
   * @param {number} alquilerId - ID del alquiler
   */
  static async obtenerExtensiones(tenantId, alquilerId) {
    const query = `
      SELECT
        id,
        fecha_retorno_anterior,
        fecha_retorno_nueva,
        dias_extension,
        razon,
        costo_extension,
        registrado_por,
        created_at
      FROM alquiler_extensiones
      WHERE tenant_id = ? AND alquiler_id = ?
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.query(query, [tenantId, alquilerId]);
    return rows;
  }
}

module.exports = AlquilerModel;
