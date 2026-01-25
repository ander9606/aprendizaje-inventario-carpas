// ============================================
// MODELO: CotizacionModel
// Cotizaciones generadas para clientes
// ============================================

const { pool } = require('../../../config/database');

// Importación diferida para evitar dependencia circular
let ConfiguracionModel = null;
const getConfiguracionModel = () => {
  if (!ConfiguracionModel) {
    ConfiguracionModel = require('./ConfiguracionModel');
  }
  return ConfiguracionModel;
};

class CotizacionModel {

  // ============================================
  // CONSTANTES DE NEGOCIO (valores por defecto)
  // ============================================
  static DIAS_GRATIS_MONTAJE = 2;
  static DIAS_GRATIS_DESMONTAJE = 1;
  static PORCENTAJE_DIAS_EXTRA_DEFAULT = 15.00;
  static PORCENTAJE_IVA_DEFAULT = 19.00;

  // ============================================
  // OBTENER CONFIGURACIÓN DINÁMICA
  // ============================================
  static async obtenerConfiguracion() {
    try {
      const Config = getConfiguracionModel();
      return await Config.obtenerValores([
        'dias_gratis_montaje',
        'dias_gratis_desmontaje',
        'porcentaje_dias_extra',
        'porcentaje_iva',
        'aplicar_iva',
        'vigencia_cotizacion_dias'
      ]);
    } catch (error) {
      // Si falla, usar valores por defecto
      return {
        dias_gratis_montaje: this.DIAS_GRATIS_MONTAJE,
        dias_gratis_desmontaje: this.DIAS_GRATIS_DESMONTAJE,
        porcentaje_dias_extra: this.PORCENTAJE_DIAS_EXTRA_DEFAULT,
        porcentaje_iva: this.PORCENTAJE_IVA_DEFAULT,
        aplicar_iva: true,
        vigencia_cotizacion_dias: 15
      };
    }
  }

  // ============================================
  // OBTENER TODAS
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT
        cot.id,
        cot.cliente_id,
        cot.fecha_montaje,
        cot.fecha_evento,
        cot.fecha_desmontaje,
        cot.evento_nombre,
        cot.evento_ciudad,
        cot.subtotal,
        cot.descuento,
        cot.total,
        cot.estado,
        cot.vigencia_dias,
        cot.created_at,
        cot.dias_montaje_extra,
        cot.dias_desmontaje_extra,
        cot.porcentaje_dias_extra,
        cot.cobro_dias_extra,
        cot.porcentaje_iva,
        cot.valor_iva,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      ORDER BY cot.created_at DESC
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
        cot.id,
        cot.cliente_id,
        cot.fecha_evento,
        cot.evento_nombre,
        cot.total,
        cot.estado,
        cot.created_at,
        cl.nombre AS cliente_nombre,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE cot.estado = ?
      ORDER BY cot.fecha_evento ASC
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
        cot.*,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        cl.email AS cliente_email,
        cl.direccion AS cliente_direccion,
        cl.tipo_documento AS cliente_tipo_documento,
        cl.numero_documento AS cliente_numero_documento
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE cot.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER COMPLETA (con productos, transporte y descuentos)
  // ============================================
  static async obtenerCompleta(id) {
    const cotizacion = await this.obtenerPorId(id);
    if (!cotizacion) return null;

    // Obtener productos
    const queryProductos = `
      SELECT
        cp.id,
        cp.compuesto_id,
        cp.cantidad,
        cp.precio_base,
        cp.deposito,
        cp.precio_adicionales,
        cp.subtotal,
        cp.notas,
        ec.nombre AS producto_nombre,
        ec.codigo AS producto_codigo,
        cat.nombre AS categoria_nombre,
        cat.emoji AS categoria_emoji
      FROM cotizacion_productos cp
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
      LEFT JOIN categorias_productos cat ON ec.categoria_id = cat.id
      WHERE cp.cotizacion_id = ?
      ORDER BY cp.id
    `;
    const [productos] = await pool.query(queryProductos, [id]);

    // Obtener transporte
    const queryTransporte = `
      SELECT
        ct.id,
        ct.tarifa_id,
        ct.cantidad,
        ct.precio_unitario,
        ct.subtotal,
        ct.notas,
        t.tipo_camion,
        c.nombre AS ciudad
      FROM cotizacion_transportes ct
      INNER JOIN tarifas_transporte t ON ct.tarifa_id = t.id
      LEFT JOIN ciudades c ON t.ciudad_id = c.id
      WHERE ct.cotizacion_id = ?
    `;
    const [transporte] = await pool.query(queryTransporte, [id]);

    // Obtener descuentos aplicados
    const queryDescuentos = `
      SELECT
        cd.id,
        cd.descuento_id,
        cd.monto,
        cd.es_porcentaje,
        cd.notas,
        d.nombre AS descuento_nombre,
        d.descripcion AS descuento_descripcion
      FROM cotizacion_descuentos cd
      LEFT JOIN descuentos d ON cd.descuento_id = d.id
      WHERE cd.cotizacion_id = ?
    `;
    const [descuentos] = await pool.query(queryDescuentos, [id]);

    // Calcular totales
    const subtotalProductos = productos.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
    const subtotalTransporte = transporte.reduce((sum, t) => sum + parseFloat(t.subtotal), 0);
    const totalDeposito = productos.reduce((sum, p) => sum + (parseFloat(p.deposito) * p.cantidad), 0);
    const totalDescuentosAplicados = descuentos.reduce((sum, d) => sum + parseFloat(d.monto), 0);

    // Calcular días extra
    const totalDiasExtra = (cotizacion.dias_montaje_extra || 0) + (cotizacion.dias_desmontaje_extra || 0);

    return {
      ...cotizacion,
      productos,
      transporte,
      descuentos_aplicados: descuentos,
      resumen: {
        subtotal_productos: subtotalProductos,
        subtotal_transporte: subtotalTransporte,
        total_deposito: totalDeposito,
        dias_montaje_extra: cotizacion.dias_montaje_extra || 0,
        dias_desmontaje_extra: cotizacion.dias_desmontaje_extra || 0,
        total_dias_extra: totalDiasExtra,
        porcentaje_dias_extra: cotizacion.porcentaje_dias_extra || this.PORCENTAJE_DIAS_EXTRA_DEFAULT,
        cobro_dias_extra: parseFloat(cotizacion.cobro_dias_extra || 0),
        descuento_manual: parseFloat(cotizacion.descuento || 0),
        total_descuentos_aplicados: totalDescuentosAplicados,
        total_descuentos: parseFloat(cotizacion.total_descuentos || 0),
        base_gravable: parseFloat(cotizacion.base_gravable || 0),
        porcentaje_iva: cotizacion.porcentaje_iva || this.PORCENTAJE_IVA_DEFAULT,
        valor_iva: parseFloat(cotizacion.valor_iva || 0),
        total: parseFloat(cotizacion.total || 0)
      }
    };
  }

  // ============================================
  // CALCULAR DÍAS EXTRA (con configuración dinámica)
  // ============================================
  static async calcularDiasExtra(fechaMontaje, fechaEvento, fechaDesmontaje, config = null) {
    // Obtener configuración si no se proporciona
    if (!config) {
      config = await this.obtenerConfiguracion();
    }

    const montaje = new Date(fechaMontaje);
    const evento = new Date(fechaEvento);
    const desmontaje = new Date(fechaDesmontaje);

    const diasGratisMontaje = config.dias_gratis_montaje || this.DIAS_GRATIS_MONTAJE;
    const diasGratisDesmontaje = config.dias_gratis_desmontaje || this.DIAS_GRATIS_DESMONTAJE;

    // Días entre montaje y evento
    const diasMontaje = Math.floor((evento - montaje) / (1000 * 60 * 60 * 24));
    const diasMontajeExtra = Math.max(0, diasMontaje - diasGratisMontaje);

    // Días entre evento y desmontaje
    const diasDesmontaje = Math.floor((desmontaje - evento) / (1000 * 60 * 60 * 24));
    const diasDesmontajeExtra = Math.max(0, diasDesmontaje - diasGratisDesmontaje);

    return { diasMontajeExtra, diasDesmontajeExtra, config };
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({
    cliente_id, fecha_montaje, fecha_evento, fecha_desmontaje, evento_nombre,
    evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas,
    dias_montaje_extra, dias_desmontaje_extra, porcentaje_dias_extra,
    cobro_dias_extra, porcentaje_iva, valor_iva, evento_id
  }) {
    // Obtener configuración dinámica
    const config = await this.obtenerConfiguracion();

    // Calcular días extra si no se proporcionan
    if (dias_montaje_extra === undefined || dias_desmontaje_extra === undefined) {
      const calculados = await this.calcularDiasExtra(
        fecha_montaje || fecha_evento,
        fecha_evento,
        fecha_desmontaje || fecha_evento,
        config
      );
      dias_montaje_extra = dias_montaje_extra ?? calculados.diasMontajeExtra;
      dias_desmontaje_extra = dias_desmontaje_extra ?? calculados.diasDesmontajeExtra;
    }

    // Usar valores de configuración si no se especifican
    porcentaje_dias_extra = porcentaje_dias_extra ?? config.porcentaje_dias_extra;
    porcentaje_iva = porcentaje_iva ?? config.porcentaje_iva;
    vigencia_dias = vigencia_dias ?? config.vigencia_cotizacion_dias;

    const query = `
      INSERT INTO cotizaciones
        (cliente_id, fecha_montaje, fecha_evento, fecha_desmontaje, evento_nombre,
         evento_direccion, evento_ciudad, subtotal, descuento, total, vigencia_dias, notas,
         dias_montaje_extra, dias_desmontaje_extra, porcentaje_dias_extra,
         cobro_dias_extra, porcentaje_iva, valor_iva, evento_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cliente_id,
      fecha_montaje || fecha_evento,
      fecha_evento,
      fecha_desmontaje || fecha_evento,
      evento_nombre || null,
      evento_direccion || null,
      evento_ciudad || null,
      subtotal || 0,
      descuento || 0,
      total || 0,
      vigencia_dias || 15,
      notas || null,
      dias_montaje_extra || 0,
      dias_desmontaje_extra || 0,
      porcentaje_dias_extra || this.PORCENTAJE_DIAS_EXTRA_DEFAULT,
      cobro_dias_extra || 0,
      porcentaje_iva || this.PORCENTAJE_IVA_DEFAULT,
      valor_iva || 0,
      evento_id || null
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, {
    fecha_montaje, fecha_evento, fecha_desmontaje, evento_nombre, evento_direccion,
    evento_ciudad, subtotal, descuento, total, vigencia_dias, notas,
    dias_montaje_extra, dias_desmontaje_extra, porcentaje_dias_extra,
    cobro_dias_extra, porcentaje_iva, valor_iva
  }) {
    // Calcular días extra si las fechas cambian
    if (fecha_evento && (dias_montaje_extra === undefined || dias_desmontaje_extra === undefined)) {
      const calculados = await this.calcularDiasExtra(
        fecha_montaje || fecha_evento,
        fecha_evento,
        fecha_desmontaje || fecha_evento
      );
      dias_montaje_extra = dias_montaje_extra ?? calculados.diasMontajeExtra;
      dias_desmontaje_extra = dias_desmontaje_extra ?? calculados.diasDesmontajeExtra;
    }

    const query = `
      UPDATE cotizaciones
      SET fecha_montaje = ?, fecha_evento = ?, fecha_desmontaje = ?, evento_nombre = ?,
          evento_direccion = ?, evento_ciudad = ?, subtotal = ?,
          descuento = ?, total = ?, vigencia_dias = ?, notas = ?,
          dias_montaje_extra = COALESCE(?, dias_montaje_extra),
          dias_desmontaje_extra = COALESCE(?, dias_desmontaje_extra),
          porcentaje_dias_extra = COALESCE(?, porcentaje_dias_extra),
          cobro_dias_extra = COALESCE(?, cobro_dias_extra),
          porcentaje_iva = COALESCE(?, porcentaje_iva),
          valor_iva = COALESCE(?, valor_iva)
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      fecha_montaje || fecha_evento,
      fecha_evento,
      fecha_desmontaje || fecha_evento,
      evento_nombre || null,
      evento_direccion || null,
      evento_ciudad || null,
      subtotal || 0,
      descuento || 0,
      total || 0,
      vigencia_dias || 15,
      notas || null,
      dias_montaje_extra,
      dias_desmontaje_extra,
      porcentaje_dias_extra,
      cobro_dias_extra,
      porcentaje_iva,
      valor_iva,
      id
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR TOTALES
  // ============================================
  static async actualizarTotales(id, {
    subtotal, descuento, total, cobro_dias_extra, valor_iva,
    subtotal_productos, subtotal_transporte, total_descuentos, base_gravable
  }) {
    const query = `
      UPDATE cotizaciones
      SET subtotal = ?, descuento = ?, total = ?,
          cobro_dias_extra = COALESCE(?, cobro_dias_extra),
          valor_iva = COALESCE(?, valor_iva),
          subtotal_productos = COALESCE(?, subtotal_productos),
          subtotal_transporte = COALESCE(?, subtotal_transporte),
          total_descuentos = COALESCE(?, total_descuentos),
          base_gravable = COALESCE(?, base_gravable)
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      subtotal, descuento || 0, total,
      cobro_dias_extra, valor_iva,
      subtotal_productos, subtotal_transporte, total_descuentos, base_gravable,
      id
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR ESTADO
  // ============================================
  static async actualizarEstado(id, estado) {
    const query = `UPDATE cotizaciones SET estado = ? WHERE id = ?`;
    const [result] = await pool.query(query, [estado, id]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    // Los productos y transporte se eliminan por CASCADE
    const [result] = await pool.query('DELETE FROM cotizaciones WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // OBTENER POR CLIENTE
  // ============================================
  static async obtenerPorCliente(clienteId) {
    const query = `
      SELECT
        cot.id,
        cot.fecha_evento,
        cot.evento_nombre,
        cot.total,
        cot.estado,
        cot.created_at,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos
      FROM cotizaciones cot
      WHERE cot.cliente_id = ?
      ORDER BY cot.created_at DESC
    `;
    const [rows] = await pool.query(query, [clienteId]);
    return rows;
  }

  // ============================================
  // VERIFICAR SI TIENE ALQUILER
  // ============================================
  static async tieneAlquiler(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM alquileres WHERE cotizacion_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // RECALCULAR TOTALES (con IVA y días extra)
  // ============================================
  static async recalcularTotales(id) {
    // Obtener subtotal de productos
    const [productos] = await pool.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM cotizacion_productos WHERE cotizacion_id = ?',
      [id]
    );

    // Obtener subtotal de transporte
    const [transporte] = await pool.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM cotizacion_transportes WHERE cotizacion_id = ?',
      [id]
    );

    // Obtener datos actuales de la cotización
    const [cotizacionData] = await pool.query(
      `SELECT descuento, dias_montaje_extra, dias_desmontaje_extra,
              porcentaje_dias_extra, porcentaje_iva
       FROM cotizaciones WHERE id = ?`,
      [id]
    );

    // Obtener total de descuentos aplicados (tabla pivote)
    const [descuentosAplicados] = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM cotizacion_descuentos WHERE cotizacion_id = ?',
      [id]
    );

    const cot = cotizacionData[0];
    const subtotalProductos = parseFloat(productos[0].subtotal);
    const subtotalTransporte = parseFloat(transporte[0].subtotal);
    const subtotal = subtotalProductos + subtotalTransporte;

    // Calcular cobro por días extra
    const totalDiasExtra = (cot?.dias_montaje_extra || 0) + (cot?.dias_desmontaje_extra || 0);
    const porcentajeDiasExtra = parseFloat(cot?.porcentaje_dias_extra || this.PORCENTAJE_DIAS_EXTRA_DEFAULT);
    const cobroDiasExtra = totalDiasExtra > 0
      ? (subtotalProductos * (porcentajeDiasExtra / 100) * totalDiasExtra)
      : 0;

    // Calcular descuentos totales (manual + aplicados)
    const descuentoManual = parseFloat(cot?.descuento || 0);
    const descuentosTabla = parseFloat(descuentosAplicados[0].total);
    const totalDescuentos = descuentoManual + descuentosTabla;

    // Base gravable = subtotal + días extra - descuentos
    const baseGravable = subtotal + cobroDiasExtra - totalDescuentos;

    // Calcular IVA
    const porcentajeIva = parseFloat(cot?.porcentaje_iva || this.PORCENTAJE_IVA_DEFAULT);
    const valorIva = baseGravable * (porcentajeIva / 100);

    // Total final
    const total = baseGravable + valorIva;

    await this.actualizarTotales(id, {
      subtotal,
      descuento: descuentoManual,
      total,
      cobro_dias_extra: cobroDiasExtra,
      valor_iva: valorIva,
      subtotal_productos: subtotalProductos,
      subtotal_transporte: subtotalTransporte,
      total_descuentos: totalDescuentos,
      base_gravable: baseGravable
    });

    return {
      subtotal_productos: subtotalProductos,
      subtotal_transporte: subtotalTransporte,
      subtotal,
      cobro_dias_extra: cobroDiasExtra,
      total_descuentos: totalDescuentos,
      base_gravable: baseGravable,
      porcentaje_iva: porcentajeIva,
      valor_iva: valorIva,
      total
    };
  }

  // ============================================
  // DUPLICAR COTIZACIÓN
  // ============================================
  static async duplicar(id) {
    const original = await this.obtenerCompleta(id);
    if (!original) return null;

    // Crear nueva cotización
    const resultado = await this.crear({
      cliente_id: original.cliente_id,
      fecha_montaje: original.fecha_montaje,
      fecha_evento: original.fecha_evento,
      fecha_desmontaje: original.fecha_desmontaje,
      evento_nombre: original.evento_nombre ? `${original.evento_nombre} (copia)` : null,
      evento_direccion: original.evento_direccion,
      evento_ciudad: original.evento_ciudad,
      subtotal: original.subtotal,
      descuento: original.descuento,
      total: original.total,
      vigencia_dias: original.vigencia_dias,
      notas: original.notas
    });

    const nuevaCotizacionId = resultado.insertId;

    // Duplicar productos
    if (original.productos && original.productos.length > 0) {
      const queryProductos = `
        INSERT INTO cotizacion_productos
          (cotizacion_id, compuesto_id, cantidad, precio_base, deposito, precio_adicionales, subtotal, notas)
        VALUES ?
      `;
      const valoresProductos = original.productos.map(p => [
        nuevaCotizacionId,
        p.compuesto_id,
        p.cantidad,
        p.precio_base,
        p.deposito,
        p.precio_adicionales,
        p.subtotal,
        p.notas
      ]);
      await pool.query(queryProductos, [valoresProductos]);
    }

    // Duplicar transporte
    if (original.transporte && original.transporte.length > 0) {
      const queryTransporte = `
        INSERT INTO cotizacion_transportes
          (cotizacion_id, tarifa_id, cantidad, precio_unitario, subtotal, notas)
        VALUES ?
      `;
      const valoresTransporte = original.transporte.map(t => [
        nuevaCotizacionId,
        t.tarifa_id,
        t.cantidad,
        t.precio_unitario,
        t.subtotal,
        t.notas
      ]);
      await pool.query(queryTransporte, [valoresTransporte]);
    }

    return nuevaCotizacionId;
  }
}

module.exports = CotizacionModel;
