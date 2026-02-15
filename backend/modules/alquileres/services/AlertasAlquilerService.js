// ============================================
// SERVICIO: AlertasAlquilerService
// ============================================
/**
 * Servicio para detectar y gestionar alertas de alquileres.
 *
 * Este servicio calcula alertas en tiempo real basándose en:
 * - Fechas de retorno vencidas o próximas
 * - Órdenes de trabajo pasadas sin completar
 * - Alquileres programados que no iniciaron
 *
 * TIPOS DE ALERTA:
 *
 * | Código                    | Severidad | Descripción                              |
 * |---------------------------|-----------|------------------------------------------|
 * | RETORNO_VENCIDO           | critico   | Alquiler activo pasó fecha de retorno    |
 * | ORDEN_MONTAJE_VENCIDA     | critico   | Montaje programado no ejecutado          |
 * | ORDEN_DESMONTAJE_VENCIDA  | critico   | Desmontaje programado no completado      |
 * | ALQUILER_NO_INICIADO      | critico   | Alquiler programado pasó fecha inicio    |
 * | RETORNO_PROXIMO           | advertencia | Retorno en los próximos N días         |
 * | SALIDA_PROXIMA            | advertencia | Montaje programado para próximos días  |
 * | DESMONTAJE_PROXIMO        | advertencia | Desmontaje programado próximamente     |
 *
 * CONFIGURACIÓN:
 * - DIAS_ADVERTENCIA_RETORNO: 2 días antes del retorno
 * - DIAS_ADVERTENCIA_SALIDA: 1 día antes del montaje
 */

const { pool } = require('../../../config/database');
const logger = require('../../../utils/logger');

// ============================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================

const TIPOS_ALERTA = {
  RETORNO_VENCIDO: 'RETORNO_VENCIDO',
  ORDEN_MONTAJE_VENCIDA: 'ORDEN_MONTAJE_VENCIDA',
  ORDEN_DESMONTAJE_VENCIDA: 'ORDEN_DESMONTAJE_VENCIDA',
  ALQUILER_NO_INICIADO: 'ALQUILER_NO_INICIADO',
  RETORNO_PROXIMO: 'RETORNO_PROXIMO',
  SALIDA_PROXIMA: 'SALIDA_PROXIMA',
  DESMONTAJE_PROXIMO: 'DESMONTAJE_PROXIMO',
  // Seguimiento de cotizaciones
  COTIZACION_VENCIDA: 'COTIZACION_VENCIDA',
  COTIZACION_POR_VENCER: 'COTIZACION_POR_VENCER',
  BORRADOR_ANTIGUO: 'BORRADOR_ANTIGUO',
  COTIZACION_SIN_SEGUIMIENTO: 'COTIZACION_SIN_SEGUIMIENTO'
};

const SEVERIDAD = {
  CRITICO: 'critico',
  ADVERTENCIA: 'advertencia',
  INFO: 'info'
};

// Configuración de días de anticipación
const CONFIG = {
  DIAS_ADVERTENCIA_RETORNO: 2,  // Alertar 2 días antes del retorno
  DIAS_ADVERTENCIA_SALIDA: 1    // Alertar 1 día antes de la salida
};

class AlertasAlquilerService {

  // ==========================================================================
  // MÉTODO PRINCIPAL: Obtener todas las alertas
  // ==========================================================================
  /**
   * Obtiene todas las alertas activas del sistema.
   *
   * @param {Object} opciones - Opciones de filtrado
   * @param {number} opciones.usuario_id - ID del usuario (para excluir alertas ignoradas)
   * @param {boolean} opciones.solo_criticas - Si true, solo retorna críticas
   * @returns {Promise<Array>} Lista de alertas ordenadas por severidad
   */
  static async obtenerTodasLasAlertas(opciones = {}) {
    logger.info('[AlertasAlquilerService] Obteniendo todas las alertas...');

    const alertas = [];
    const { usuario_id, solo_criticas = false } = opciones;

    // Obtener alertas ignoradas por el usuario
    let alertasIgnoradas = [];
    if (usuario_id) {
      alertasIgnoradas = await this.obtenerAlertasIgnoradas(usuario_id);
    }

    // -----------------------------------------------------------------
    // ALERTAS CRÍTICAS
    // -----------------------------------------------------------------
    const retornosVencidos = await this.getAlertasRetornoVencido();
    const ordenesMontajeVencidas = await this.getAlertasOrdenesMontajeVencidas();
    const ordenesDesmontajeVencidas = await this.getAlertasOrdenesDesmontajeVencidas();
    const alquileresNoIniciados = await this.getAlertasAlquilerNoIniciado();

    alertas.push(...retornosVencidos);
    alertas.push(...ordenesMontajeVencidas);
    alertas.push(...ordenesDesmontajeVencidas);
    alertas.push(...alquileresNoIniciados);

    // -----------------------------------------------------------------
    // ALERTAS DE COTIZACIONES (seguimiento)
    // -----------------------------------------------------------------
    const configSeguimiento = await this.obtenerConfigSeguimiento();
    if (configSeguimiento.habilitar_seguimiento_cotizaciones) {
      const cotizacionesVencidas = await this.getAlertasCotizacionVencida();
      alertas.push(...cotizacionesVencidas);
    }

    // -----------------------------------------------------------------
    // ALERTAS DE ADVERTENCIA (solo si no se piden solo críticas)
    // -----------------------------------------------------------------
    if (!solo_criticas) {
      const retornosProximos = await this.getAlertasRetornoProximo(CONFIG.DIAS_ADVERTENCIA_RETORNO);
      const salidasProximas = await this.getAlertasSalidaProxima(CONFIG.DIAS_ADVERTENCIA_SALIDA);
      const desmontajesProximos = await this.getAlertasDesmontajeProximo(CONFIG.DIAS_ADVERTENCIA_SALIDA);

      alertas.push(...retornosProximos);
      alertas.push(...salidasProximas);
      alertas.push(...desmontajesProximos);

      // Cotizaciones por vencer, borradores antiguos y sin seguimiento
      if (configSeguimiento.habilitar_seguimiento_cotizaciones) {
        const cotizacionesPorVencer = await this.getAlertasCotizacionPorVencer(
          configSeguimiento.dias_advertencia_vencimiento_cotizacion
        );
        const borradoresAntiguos = await this.getAlertasBorradorAntiguo(
          configSeguimiento.dias_seguimiento_borrador
        );
        const sinSeguimiento = await this.getAlertasCotizacionSinSeguimiento(
          configSeguimiento.dias_seguimiento_pendiente
        );

        alertas.push(...cotizacionesPorVencer);
        alertas.push(...borradoresAntiguos);
        alertas.push(...sinSeguimiento);
      }
    }

    // -----------------------------------------------------------------
    // Filtrar alertas ignoradas
    // -----------------------------------------------------------------
    const alertasFiltradas = alertas.filter(alerta => {
      const clave = `${alerta.tipo}_${alerta.referencia_id}`;
      return !alertasIgnoradas.includes(clave);
    });

    // -----------------------------------------------------------------
    // Ordenar por severidad (crítico primero) y luego por fecha
    // -----------------------------------------------------------------
    const ordenSeveridad = { critico: 0, advertencia: 1, info: 2 };
    alertasFiltradas.sort((a, b) => {
      const diffSeveridad = ordenSeveridad[a.severidad] - ordenSeveridad[b.severidad];
      if (diffSeveridad !== 0) return diffSeveridad;
      return new Date(a.fecha) - new Date(b.fecha);
    });

    logger.info(`[AlertasAlquilerService] Total alertas: ${alertasFiltradas.length}`);
    return alertasFiltradas;
  }

  // ==========================================================================
  // ALERTAS CRÍTICAS
  // ==========================================================================

  /**
   * Obtiene alquileres con retorno vencido.
   * Condición: estado='activo' AND fecha_retorno_esperado < HOY
   */
  static async getAlertasRetornoVencido() {
    const query = `
      SELECT
        a.id,
        a.fecha_retorno_esperado,
        a.total,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        DATEDIFF(CURDATE(), a.fecha_retorno_esperado) AS dias_vencido
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE a.estado = 'activo'
        AND DATE(a.fecha_retorno_esperado) < CURDATE()
      ORDER BY a.fecha_retorno_esperado ASC
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.RETORNO_VENCIDO,
      severidad: SEVERIDAD.CRITICO,
      referencia_tipo: 'alquiler',
      referencia_id: row.id,
      titulo: 'Retorno vencido',
      mensaje: `Alquiler #${row.id} - "${row.evento_nombre}" debió retornar hace ${row.dias_vencido} día(s)`,
      fecha: row.fecha_retorno_esperado,
      datos: {
        alquiler_id: row.id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        dias_vencido: row.dias_vencido,
        total: row.total
      },
      acciones: [
        { label: 'Ver alquiler', url: `/alquileres/${row.id}` },
        { label: 'Contactar cliente', telefono: row.cliente_telefono }
      ]
    }));
  }

  /**
   * Obtiene órdenes de montaje pasadas sin ejecutar.
   * Condición: tipo='montaje' AND fecha < HOY AND estado NOT IN ('completado','cancelado','en_ruta')
   */
  static async getAlertasOrdenesMontajeVencidas() {
    const query = `
      SELECT
        ot.id,
        ot.fecha_programada,
        ot.estado,
        ot.alquiler_id,
        a.estado AS alquiler_estado,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        DATEDIFF(CURDATE(), DATE(ot.fecha_programada)) AS dias_vencido
      FROM ordenes_trabajo ot
      INNER JOIN alquileres a ON ot.alquiler_id = a.id
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE ot.tipo = 'montaje'
        AND DATE(ot.fecha_programada) < CURDATE()
        AND ot.estado NOT IN ('completado', 'cancelado', 'en_ruta', 'en_sitio', 'en_proceso')
      ORDER BY ot.fecha_programada ASC
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.ORDEN_MONTAJE_VENCIDA,
      severidad: SEVERIDAD.CRITICO,
      referencia_tipo: 'orden',
      referencia_id: row.id,
      titulo: 'Montaje no ejecutado',
      mensaje: `Orden #${row.id} - "${row.evento_nombre}" debió ejecutarse hace ${row.dias_vencido} día(s)`,
      fecha: row.fecha_programada,
      datos: {
        orden_id: row.id,
        alquiler_id: row.alquiler_id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        estado_orden: row.estado,
        dias_vencido: row.dias_vencido
      },
      acciones: [
        { label: 'Ir a orden', url: `/operaciones/ordenes/${row.id}` },
        { label: 'Ejecutar salida', accion: 'ejecutar_salida' }
      ]
    }));
  }

  /**
   * Obtiene órdenes de desmontaje pasadas sin completar.
   * Condición: tipo='desmontaje' AND fecha < HOY AND estado NOT IN ('completado','cancelado')
   */
  static async getAlertasOrdenesDesmontajeVencidas() {
    const query = `
      SELECT
        ot.id,
        ot.fecha_programada,
        ot.estado,
        ot.alquiler_id,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        DATEDIFF(CURDATE(), DATE(ot.fecha_programada)) AS dias_vencido
      FROM ordenes_trabajo ot
      INNER JOIN alquileres a ON ot.alquiler_id = a.id
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE ot.tipo = 'desmontaje'
        AND DATE(ot.fecha_programada) < CURDATE()
        AND ot.estado NOT IN ('completado', 'cancelado')
      ORDER BY ot.fecha_programada ASC
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.ORDEN_DESMONTAJE_VENCIDA,
      severidad: SEVERIDAD.CRITICO,
      referencia_tipo: 'orden',
      referencia_id: row.id,
      titulo: 'Desmontaje pendiente',
      mensaje: `Orden #${row.id} - "${row.evento_nombre}" debió completarse hace ${row.dias_vencido} día(s)`,
      fecha: row.fecha_programada,
      datos: {
        orden_id: row.id,
        alquiler_id: row.alquiler_id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        estado_orden: row.estado,
        dias_vencido: row.dias_vencido
      },
      acciones: [
        { label: 'Ir a orden', url: `/operaciones/ordenes/${row.id}` },
        { label: 'Registrar retorno', accion: 'registrar_retorno' }
      ]
    }));
  }

  /**
   * Obtiene alquileres que siguen programados pero su fecha de inicio ya pasó.
   * Condición: estado='programado' AND fecha de orden_montaje < HOY
   */
  static async getAlertasAlquilerNoIniciado() {
    const query = `
      SELECT
        a.id,
        a.created_at,
        cot.evento_nombre,
        cot.fecha_montaje,
        cl.nombre AS cliente_nombre,
        ot.id AS orden_montaje_id,
        ot.fecha_programada AS fecha_montaje_programada,
        DATEDIFF(CURDATE(), DATE(ot.fecha_programada)) AS dias_sin_iniciar
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      LEFT JOIN ordenes_trabajo ot ON ot.alquiler_id = a.id AND ot.tipo = 'montaje'
      WHERE a.estado = 'programado'
        AND ot.fecha_programada IS NOT NULL
        AND DATE(ot.fecha_programada) < CURDATE()
      ORDER BY ot.fecha_programada ASC
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.ALQUILER_NO_INICIADO,
      severidad: SEVERIDAD.CRITICO,
      referencia_tipo: 'alquiler',
      referencia_id: row.id,
      titulo: 'Alquiler sin iniciar',
      mensaje: `Alquiler #${row.id} - "${row.evento_nombre}" debió iniciar hace ${row.dias_sin_iniciar} día(s)`,
      fecha: row.fecha_montaje_programada,
      datos: {
        alquiler_id: row.id,
        orden_montaje_id: row.orden_montaje_id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        dias_sin_iniciar: row.dias_sin_iniciar
      },
      acciones: [
        { label: 'Ver alquiler', url: `/alquileres/${row.id}` },
        { label: 'Ejecutar salida', url: `/operaciones/ordenes/${row.orden_montaje_id}` }
      ]
    }));
  }

  // ==========================================================================
  // ALERTAS DE ADVERTENCIA
  // ==========================================================================

  /**
   * Obtiene alquileres con retorno próximo (dentro de N días).
   * @param {number} dias - Días de anticipación
   */
  static async getAlertasRetornoProximo(dias = 2) {
    const query = `
      SELECT
        a.id,
        a.fecha_retorno_esperado,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        DATEDIFF(a.fecha_retorno_esperado, CURDATE()) AS dias_restantes
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE a.estado = 'activo'
        AND DATE(a.fecha_retorno_esperado) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY a.fecha_retorno_esperado ASC
    `;

    const [rows] = await pool.query(query, [dias]);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.RETORNO_PROXIMO,
      severidad: SEVERIDAD.ADVERTENCIA,
      referencia_tipo: 'alquiler',
      referencia_id: row.id,
      titulo: `Retorno en ${row.dias_restantes} día(s)`,
      mensaje: `Alquiler #${row.id} - "${row.evento_nombre}" retorna el ${this.formatearFecha(row.fecha_retorno_esperado)}`,
      fecha: row.fecha_retorno_esperado,
      datos: {
        alquiler_id: row.id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        dias_restantes: row.dias_restantes
      },
      acciones: [
        { label: 'Ver alquiler', url: `/alquileres/${row.id}` }
      ]
    }));
  }

  /**
   * Obtiene órdenes de montaje próximas (dentro de N días).
   * @param {number} dias - Días de anticipación
   */
  static async getAlertasSalidaProxima(dias = 1) {
    const query = `
      SELECT
        ot.id,
        ot.fecha_programada,
        ot.estado,
        ot.alquiler_id,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        DATEDIFF(DATE(ot.fecha_programada), CURDATE()) AS dias_restantes
      FROM ordenes_trabajo ot
      INNER JOIN alquileres a ON ot.alquiler_id = a.id
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE ot.tipo = 'montaje'
        AND DATE(ot.fecha_programada) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND ot.estado NOT IN ('completado', 'cancelado', 'en_ruta', 'en_sitio', 'en_proceso')
      ORDER BY ot.fecha_programada ASC
    `;

    const [rows] = await pool.query(query, [dias]);

    return rows.map(row => {
      const esHoy = row.dias_restantes === 0;
      const esManana = row.dias_restantes === 1;

      return {
        tipo: TIPOS_ALERTA.SALIDA_PROXIMA,
        severidad: SEVERIDAD.ADVERTENCIA,
        referencia_tipo: 'orden',
        referencia_id: row.id,
        titulo: esHoy ? 'Salida HOY' : esManana ? 'Salida mañana' : `Salida en ${row.dias_restantes} días`,
        mensaje: `Orden montaje #${row.id} - "${row.evento_nombre}"`,
        fecha: row.fecha_programada,
        datos: {
          orden_id: row.id,
          alquiler_id: row.alquiler_id,
          evento_nombre: row.evento_nombre,
          cliente_nombre: row.cliente_nombre,
          dias_restantes: row.dias_restantes,
          estado_orden: row.estado
        },
        acciones: [
          { label: 'Ir a orden', url: `/operaciones/ordenes/${row.id}` }
        ]
      };
    });
  }

  /**
   * Obtiene órdenes de desmontaje próximas (dentro de N días).
   * @param {number} dias - Días de anticipación
   */
  static async getAlertasDesmontajeProximo(dias = 1) {
    const query = `
      SELECT
        ot.id,
        ot.fecha_programada,
        ot.estado,
        ot.alquiler_id,
        cot.evento_nombre,
        cl.nombre AS cliente_nombre,
        DATEDIFF(DATE(ot.fecha_programada), CURDATE()) AS dias_restantes
      FROM ordenes_trabajo ot
      INNER JOIN alquileres a ON ot.alquiler_id = a.id
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE ot.tipo = 'desmontaje'
        AND DATE(ot.fecha_programada) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND ot.estado NOT IN ('completado', 'cancelado')
      ORDER BY ot.fecha_programada ASC
    `;

    const [rows] = await pool.query(query, [dias]);

    return rows.map(row => {
      const esHoy = row.dias_restantes === 0;
      const esManana = row.dias_restantes === 1;

      return {
        tipo: TIPOS_ALERTA.DESMONTAJE_PROXIMO,
        severidad: SEVERIDAD.ADVERTENCIA,
        referencia_tipo: 'orden',
        referencia_id: row.id,
        titulo: esHoy ? 'Desmontaje HOY' : esManana ? 'Desmontaje mañana' : `Desmontaje en ${row.dias_restantes} días`,
        mensaje: `Orden desmontaje #${row.id} - "${row.evento_nombre}"`,
        fecha: row.fecha_programada,
        datos: {
          orden_id: row.id,
          alquiler_id: row.alquiler_id,
          evento_nombre: row.evento_nombre,
          cliente_nombre: row.cliente_nombre,
          dias_restantes: row.dias_restantes,
          estado_orden: row.estado
        },
        acciones: [
          { label: 'Ir a orden', url: `/operaciones/ordenes/${row.id}` }
        ]
      };
    });
  }

  // ==========================================================================
  // ALERTAS DE COTIZACIONES (SEGUIMIENTO)
  // ==========================================================================

  /**
   * Obtiene la configuración de seguimiento desde la BD.
   * @returns {Promise<Object>} Configuración con valores o defaults
   */
  static async obtenerConfigSeguimiento() {
    try {
      const query = `
        SELECT clave, valor, tipo
        FROM configuracion_alquileres
        WHERE clave IN (
          'dias_advertencia_vencimiento_cotizacion',
          'dias_seguimiento_borrador',
          'dias_seguimiento_pendiente',
          'habilitar_seguimiento_cotizaciones'
        )
      `;
      const [rows] = await pool.query(query);

      const config = {
        dias_advertencia_vencimiento_cotizacion: 3,
        dias_seguimiento_borrador: 7,
        dias_seguimiento_pendiente: 5,
        habilitar_seguimiento_cotizaciones: true
      };

      for (const row of rows) {
        if (row.tipo === 'numero') {
          config[row.clave] = parseInt(row.valor, 10);
        } else if (row.tipo === 'booleano') {
          config[row.clave] = row.valor === 'true' || row.valor === '1';
        } else {
          config[row.clave] = row.valor;
        }
      }

      return config;
    } catch (error) {
      logger.warn('[AlertasAlquilerService] Error obteniendo config seguimiento, usando defaults');
      return {
        dias_advertencia_vencimiento_cotizacion: 3,
        dias_seguimiento_borrador: 7,
        dias_seguimiento_pendiente: 5,
        habilitar_seguimiento_cotizaciones: true
      };
    }
  }

  /**
   * Cotizaciones pendientes cuya vigencia ya venció.
   * Condición: estado='pendiente' AND (created_at + vigencia_dias) < HOY
   */
  static async getAlertasCotizacionVencida() {
    const query = `
      SELECT
        cot.id,
        cot.evento_nombre,
        cot.total,
        cot.vigencia_dias,
        cot.created_at,
        cot.ultimo_seguimiento,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        DATEDIFF(CURDATE(), DATE(DATE_ADD(cot.created_at, INTERVAL cot.vigencia_dias DAY))) AS dias_vencida
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE cot.estado = 'pendiente'
        AND DATE(DATE_ADD(cot.created_at, INTERVAL cot.vigencia_dias DAY)) < CURDATE()
      ORDER BY cot.created_at ASC
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.COTIZACION_VENCIDA,
      severidad: SEVERIDAD.CRITICO,
      referencia_tipo: 'cotizacion',
      referencia_id: row.id,
      titulo: 'Cotizacion vencida',
      mensaje: `Cotizacion #${row.id} - "${row.evento_nombre}" vencio hace ${row.dias_vencida} dia(s)`,
      fecha: row.created_at,
      datos: {
        cotizacion_id: row.id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        total: row.total,
        dias_vencida: row.dias_vencida,
        vigencia_dias: row.vigencia_dias,
        ultimo_seguimiento: row.ultimo_seguimiento
      },
      acciones: [
        { label: 'Ver cotizacion', url: `/cotizaciones/${row.id}` },
        { label: 'Contactar cliente', telefono: row.cliente_telefono }
      ]
    }));
  }

  /**
   * Cotizaciones pendientes que están por vencer.
   * Condición: estado='pendiente' AND vigencia expira dentro de N días
   * @param {number} diasAnticipacion - Días antes del vencimiento para alertar
   */
  static async getAlertasCotizacionPorVencer(diasAnticipacion = 3) {
    const query = `
      SELECT
        cot.id,
        cot.evento_nombre,
        cot.total,
        cot.vigencia_dias,
        cot.created_at,
        cot.ultimo_seguimiento,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        DATEDIFF(DATE(DATE_ADD(cot.created_at, INTERVAL cot.vigencia_dias DAY)), CURDATE()) AS dias_restantes
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE cot.estado = 'pendiente'
        AND DATE(DATE_ADD(cot.created_at, INTERVAL cot.vigencia_dias DAY)) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY dias_restantes ASC
    `;

    const [rows] = await pool.query(query, [diasAnticipacion]);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.COTIZACION_POR_VENCER,
      severidad: SEVERIDAD.ADVERTENCIA,
      referencia_tipo: 'cotizacion',
      referencia_id: row.id,
      titulo: row.dias_restantes === 0
        ? 'Cotizacion vence HOY'
        : row.dias_restantes === 1
          ? 'Cotizacion vence manana'
          : `Cotizacion vence en ${row.dias_restantes} dias`,
      mensaje: `Cotizacion #${row.id} - "${row.evento_nombre}" para ${row.cliente_nombre}`,
      fecha: new Date(new Date(row.created_at).getTime() + row.vigencia_dias * 86400000),
      datos: {
        cotizacion_id: row.id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        total: row.total,
        dias_restantes: row.dias_restantes,
        ultimo_seguimiento: row.ultimo_seguimiento
      },
      acciones: [
        { label: 'Ver cotizacion', url: `/cotizaciones/${row.id}` },
        { label: 'Contactar cliente', telefono: row.cliente_telefono }
      ]
    }));
  }

  /**
   * Borradores antiguos sin actividad.
   * Condición: estado='borrador' AND (ultimo_seguimiento o created_at) > N días
   * @param {number} diasSinActividad - Días sin actividad para alertar
   */
  static async getAlertasBorradorAntiguo(diasSinActividad = 7) {
    const query = `
      SELECT
        cot.id,
        cot.evento_nombre,
        cot.total,
        cot.created_at,
        cot.updated_at,
        cot.ultimo_seguimiento,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        DATEDIFF(CURDATE(), DATE(COALESCE(cot.ultimo_seguimiento, cot.updated_at, cot.created_at))) AS dias_sin_actividad
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE cot.estado = 'borrador'
        AND DATEDIFF(CURDATE(), DATE(COALESCE(cot.ultimo_seguimiento, cot.updated_at, cot.created_at))) >= ?
      ORDER BY dias_sin_actividad DESC
    `;

    const [rows] = await pool.query(query, [diasSinActividad]);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.BORRADOR_ANTIGUO,
      severidad: SEVERIDAD.ADVERTENCIA,
      referencia_tipo: 'cotizacion',
      referencia_id: row.id,
      titulo: 'Borrador sin actividad',
      mensaje: `Cotizacion #${row.id} - "${row.evento_nombre}" lleva ${row.dias_sin_actividad} dia(s) como borrador`,
      fecha: row.created_at,
      datos: {
        cotizacion_id: row.id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        total: row.total,
        dias_sin_actividad: row.dias_sin_actividad,
        ultimo_seguimiento: row.ultimo_seguimiento
      },
      acciones: [
        { label: 'Ver cotizacion', url: `/cotizaciones/${row.id}` },
        { label: 'Contactar cliente', telefono: row.cliente_telefono }
      ]
    }));
  }

  /**
   * Cotizaciones pendientes sin seguimiento reciente.
   * Condición: estado='pendiente' AND no se ha contactado al cliente en N días
   * @param {number} diasSinSeguimiento - Días sin seguimiento para alertar
   */
  static async getAlertasCotizacionSinSeguimiento(diasSinSeguimiento = 5) {
    const query = `
      SELECT
        cot.id,
        cot.evento_nombre,
        cot.total,
        cot.created_at,
        cot.ultimo_seguimiento,
        cot.vigencia_dias,
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        DATEDIFF(CURDATE(), DATE(COALESCE(cot.ultimo_seguimiento, cot.created_at))) AS dias_sin_seguimiento,
        DATEDIFF(DATE(DATE_ADD(cot.created_at, INTERVAL cot.vigencia_dias DAY)), CURDATE()) AS dias_para_vencer
      FROM cotizaciones cot
      INNER JOIN clientes cl ON cot.cliente_id = cl.id
      WHERE cot.estado = 'pendiente'
        AND DATEDIFF(CURDATE(), DATE(COALESCE(cot.ultimo_seguimiento, cot.created_at))) >= ?
        -- Excluir las que ya están vencidas (esas tienen su propia alerta)
        AND DATE(DATE_ADD(cot.created_at, INTERVAL cot.vigencia_dias DAY)) >= CURDATE()
      ORDER BY dias_sin_seguimiento DESC
    `;

    const [rows] = await pool.query(query, [diasSinSeguimiento]);

    return rows.map(row => ({
      tipo: TIPOS_ALERTA.COTIZACION_SIN_SEGUIMIENTO,
      severidad: SEVERIDAD.INFO,
      referencia_tipo: 'cotizacion',
      referencia_id: row.id,
      titulo: 'Seguimiento pendiente',
      mensaje: `Cotizacion #${row.id} - "${row.evento_nombre}" sin contacto hace ${row.dias_sin_seguimiento} dia(s)`,
      fecha: row.ultimo_seguimiento || row.created_at,
      datos: {
        cotizacion_id: row.id,
        evento_nombre: row.evento_nombre,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        total: row.total,
        dias_sin_seguimiento: row.dias_sin_seguimiento,
        dias_para_vencer: row.dias_para_vencer,
        ultimo_seguimiento: row.ultimo_seguimiento
      },
      acciones: [
        { label: 'Ver cotizacion', url: `/cotizaciones/${row.id}` },
        { label: 'Contactar cliente', telefono: row.cliente_telefono }
      ]
    }));
  }

  // ==========================================================================
  // RESUMEN DE ALERTAS
  // ==========================================================================

  /**
   * Obtiene un resumen con conteo de alertas por severidad y tipo.
   * @param {number} usuario_id - ID del usuario para excluir ignoradas
   */
  static async obtenerResumen(usuario_id = null) {
    const alertas = await this.obtenerTodasLasAlertas({ usuario_id });

    const resumen = {
      total: alertas.length,
      criticas: alertas.filter(a => a.severidad === SEVERIDAD.CRITICO).length,
      advertencias: alertas.filter(a => a.severidad === SEVERIDAD.ADVERTENCIA).length,
      informativas: alertas.filter(a => a.severidad === SEVERIDAD.INFO).length,
      por_tipo: {}
    };

    // Contar por tipo
    alertas.forEach(alerta => {
      if (!resumen.por_tipo[alerta.tipo]) {
        resumen.por_tipo[alerta.tipo] = 0;
      }
      resumen.por_tipo[alerta.tipo]++;
    });

    return resumen;
  }

  // ==========================================================================
  // GESTIÓN DE ALERTAS IGNORADAS
  // ==========================================================================

  /**
   * Marca una alerta como ignorada por un período de tiempo.
   * @param {string} tipo - Tipo de alerta
   * @param {number} referencia_id - ID del alquiler/orden
   * @param {number} usuario_id - ID del usuario
   * @param {number} dias - Días a ignorar (0 = hasta mañana)
   */
  static async ignorarAlerta(tipo, referencia_id, usuario_id, dias = 1) {
    const fechaIgnorarHasta = new Date();
    fechaIgnorarHasta.setDate(fechaIgnorarHasta.getDate() + dias);

    const query = `
      INSERT INTO alertas_alquiler_vistas (tipo, referencia_id, usuario_id, ignorar_hasta, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        ignorar_hasta = VALUES(ignorar_hasta),
        created_at = NOW()
    `;

    await pool.query(query, [tipo, referencia_id, usuario_id, fechaIgnorarHasta]);

    logger.info(`[AlertasAlquilerService] Alerta ${tipo}:${referencia_id} ignorada por ${dias} días por usuario ${usuario_id}`);

    return { ignorada: true, ignorar_hasta: fechaIgnorarHasta };
  }

  /**
   * Obtiene las alertas ignoradas por un usuario (que aún no expiraron).
   * @param {number} usuario_id - ID del usuario
   */
  static async obtenerAlertasIgnoradas(usuario_id) {
    const query = `
      SELECT tipo, referencia_id
      FROM alertas_alquiler_vistas
      WHERE usuario_id = ?
        AND ignorar_hasta > NOW()
    `;

    const [rows] = await pool.query(query, [usuario_id]);
    return rows.map(r => `${r.tipo}_${r.referencia_id}`);
  }

  /**
   * Limpia las alertas ignoradas que ya expiraron.
   */
  static async limpiarAlertasExpiradas() {
    const query = `
      DELETE FROM alertas_alquiler_vistas
      WHERE ignorar_hasta < NOW()
    `;

    const [result] = await pool.query(query);
    logger.info(`[AlertasAlquilerService] Limpieza: ${result.affectedRows} alertas expiradas eliminadas`);
    return result.affectedRows;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Formatea una fecha para mostrar.
   */
  static formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

module.exports = AlertasAlquilerService;
module.exports.TIPOS_ALERTA = TIPOS_ALERTA;
module.exports.SEVERIDAD = SEVERIDAD;
