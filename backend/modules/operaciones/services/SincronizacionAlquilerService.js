/**
 * ============================================================================
 * SERVICIO: SincronizacionAlquilerService
 * ============================================================================
 *
 * PROPÓSITO:
 * Este servicio es el PUENTE CRÍTICO entre el módulo de Operaciones y el módulo
 * de Alquileres. Garantiza la consistencia de datos cuando se ejecutan acciones
 * operativas (salida y retorno de elementos).
 *
 * RESPONSABILIDADES:
 * 1. Gestionar la asignación de elementos físicos (series/lotes) a órdenes
 * 2. Ejecutar la salida de elementos (cuando inicia un montaje)
 * 3. Registrar el retorno de elementos (cuando termina un desmontaje)
 * 4. Mantener sincronizado el estado del alquiler con las órdenes de trabajo
 * 5. Actualizar el inventario (estados de series y cantidades de lotes)
 *
 * FLUJO DE DATOS:
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                     FLUJO DE MONTAJE (SALIDA)                       │
 *   ├─────────────────────────────────────────────────────────────────────┤
 *   │                                                                     │
 *   │  1. Cotización APROBADA                                             │
 *   │        ↓                                                            │
 *   │  2. Se crea ALQUILER (estado: "programado")                         │
 *   │        ↓                                                            │
 *   │  3. Se crean ÓRDENES DE TRABAJO (montaje + desmontaje)              │
 *   │        ↓                                                            │
 *   │  4. Se asignan elementos automáticamente a orden_trabajo_elementos  │
 *   │        ↓                                                            │
 *   │  5. EJECUTAR SALIDA (este servicio):                                │
 *   │     - Copia elementos a alquiler_elementos                          │
 *   │     - Actualiza series: estado → "alquilado"                        │
 *   │     - Actualiza lotes: cantidad_disponible -= cantidad              │
 *   │     - Orden montaje: estado → "en_ruta"                             │
 *   │     - Alquiler: estado → "activo"                                   │
 *   │                                                                     │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                    FLUJO DE DESMONTAJE (RETORNO)                    │
 *   ├─────────────────────────────────────────────────────────────────────┤
 *   │                                                                     │
 *   │  1. Orden desmontaje llega al sitio (estado: "en_sitio")            │
 *   │        ↓                                                            │
 *   │  2. Equipo desmonta y carga elementos                               │
 *   │        ↓                                                            │
 *   │  3. REGISTRAR RETORNO (este servicio):                              │
 *   │     - Actualiza alquiler_elementos con estado_retorno               │
 *   │     - Actualiza series según condición:                             │
 *   │       • bueno → "bueno" + ubicación original                        │
 *   │       • dañado → "mantenimiento" + sin ubicación                    │
 *   │       • perdido → "dañado" + sin ubicación                          │
 *   │     - Restaura cantidades en lotes (si estado es "bueno")           │
 *   │     - Registra costo de daños                                       │
 *   │     - Orden desmontaje: estado → "completado"                       │
 *   │     - Alquiler: estado → "finalizado"                               │
 *   │                                                                     │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * TABLAS AFECTADAS:
 * - ordenes_trabajo: Estado de la orden
 * - orden_trabajo_elementos: Elementos asignados a la orden
 * - alquileres: Estado del alquiler, fechas, daños
 * - alquiler_elementos: Elementos del alquiler con estados de salida/retorno
 * - series: Estado y ubicación de items con número de serie
 * - lotes: Cantidad disponible de items por lotes
 *
 * TRANSACCIONES:
 * Todas las operaciones usan transacciones para garantizar atomicidad.
 * Si cualquier paso falla, se hace rollback completo.
 *
 * @module SincronizacionAlquilerService
 * @author Sistema de Inventario
 * @version 2.0.0
 */

const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

// ============================================================================
// CONSTANTES: Estados válidos para máquinas de estado
// ============================================================================

/**
 * Estados válidos para órdenes de trabajo
 * @constant {Object}
 */
const ESTADOS_ORDEN = {
  PENDIENTE: 'pendiente',
  CONFIRMADO: 'confirmado',
  EN_PREPARACION: 'en_preparacion',
  EN_RUTA: 'en_ruta',
  EN_SITIO: 'en_sitio',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
};

/**
 * Estados válidos para alquileres
 * @constant {Object}
 */
const ESTADOS_ALQUILER = {
  PROGRAMADO: 'programado',
  ACTIVO: 'activo',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado'
};

/**
 * Estados válidos para series (items individuales)
 * @constant {Object}
 */
const ESTADOS_SERIE = {
  NUEVO: 'nuevo',
  BUENO: 'bueno',
  ALQUILADO: 'alquilado',
  MANTENIMIENTO: 'mantenimiento',
  DANADO: 'dañado'
};

/**
 * Estados de retorno válidos
 * @constant {Object}
 */
const ESTADOS_RETORNO = {
  BUENO: 'bueno',
  DANADO: 'dañado',
  PERDIDO: 'perdido'
};

/**
 * Tipos de órdenes de trabajo
 * @constant {Object}
 */
const TIPOS_ORDEN = {
  MONTAJE: 'montaje',
  DESMONTAJE: 'desmontaje'
};

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

class SincronizacionAlquilerService {

  // ==========================================================================
  // MÉTODO: obtenerElementosDisponibles
  // ==========================================================================
  /**
   * Obtiene los elementos disponibles para asignar a una orden de trabajo.
   *
   * Este método es utilizado durante la fase de preparación para mostrar
   * qué series y lotes están disponibles para cada componente de los
   * productos cotizados.
   *
   * PROCESO:
   * 1. Obtiene la orden y su cotización asociada
   * 2. Para cada producto de la cotización:
   *    a. Obtiene los componentes del elemento compuesto
   *    b. Para cada componente:
   *       - Si requiere series: busca series en estado 'nuevo' o 'bueno'
   *       - Si usa lotes: busca lotes con cantidad_disponible > 0
   * 3. Retorna estructura jerárquica con disponibilidad
   *
   * @param {number} ordenId - ID de la orden de trabajo
   * @returns {Promise<Object>} Objeto con:
   *   - orden: {Object} Datos básicos de la orden
   *   - productos: {Array} Lista de productos con componentes y disponibilidad
   *
   * @throws {AppError} 404 si la orden no existe
   *
   * @example
   * // Retorno esperado:
   * {
   *   orden: { orden_id: 1, alquiler_id: 5, tipo: 'montaje', ... },
   *   productos: [{
   *     cotizacion_producto_id: 10,
   *     producto_nombre: 'Carpa 6x12',
   *     cantidad_requerida: 2,
   *     componentes: [{
   *       elemento_id: 15,
   *       elemento_nombre: 'Lona 6x12',
   *       cantidad_total_requerida: 2,
   *       requiere_series: true,
   *       disponibles: [
   *         { tipo: 'serie', id: 101, identificador: 'LN-001', estado: 'bueno', ... }
   *       ],
   *       total_disponible: 5
   *     }]
   *   }]
   * }
   */
  static async obtenerElementosDisponibles(ordenId) {
    logger.info(`[SincronizacionAlquilerService] Obteniendo elementos disponibles para orden ${ordenId}`);

    // -----------------------------------------------------------------------
    // PASO 1: Obtener la orden con su alquiler y cotización
    // -----------------------------------------------------------------------
    const [ordenRows] = await pool.query(`
      SELECT
        ot.id AS orden_id,
        ot.alquiler_id,
        ot.tipo,
        ot.estado AS orden_estado,
        a.cotizacion_id,
        a.estado AS alquiler_estado,
        cot.evento_nombre
      FROM ordenes_trabajo ot
      INNER JOIN alquileres a ON ot.alquiler_id = a.id
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      WHERE ot.id = ?
    `, [ordenId]);

    if (!ordenRows.length) {
      logger.warn(`[SincronizacionAlquilerService] Orden ${ordenId} no encontrada`);
      throw new AppError('Orden de trabajo no encontrada', 404);
    }

    const orden = ordenRows[0];
    logger.debug(`[SincronizacionAlquilerService] Orden encontrada: tipo=${orden.tipo}, cotización=${orden.cotizacion_id}`);

    // -----------------------------------------------------------------------
    // PASO 2: Obtener productos de la cotización
    // -----------------------------------------------------------------------
    const [productos] = await pool.query(`
      SELECT
        cp.id AS cotizacion_producto_id,
        cp.compuesto_id,
        cp.cantidad AS cantidad_requerida,
        ec.nombre AS producto_nombre,
        ec.codigo AS producto_codigo
      FROM cotizacion_productos cp
      INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
      WHERE cp.cotizacion_id = ?
      ORDER BY ec.nombre
    `, [orden.cotizacion_id]);

    logger.debug(`[SincronizacionAlquilerService] Productos en cotización: ${productos.length}`);

    // -----------------------------------------------------------------------
    // PASO 3: Para cada producto, obtener componentes y disponibilidad
    // -----------------------------------------------------------------------
    const resultado = [];

    for (const producto of productos) {
      // Obtener componentes del elemento compuesto
      const [componentes] = await pool.query(`
        SELECT
          ecc.id AS componente_id,
          ecc.elemento_id,
          ecc.cantidad_por_unidad,
          (ecc.cantidad_por_unidad * ?) AS cantidad_total_requerida,
          e.nombre AS elemento_nombre,
          e.codigo AS elemento_codigo,
          e.requiere_series
        FROM elemento_compuesto_componentes ecc
        INNER JOIN elementos e ON ecc.elemento_id = e.id
        WHERE ecc.compuesto_id = ?
        ORDER BY e.nombre
      `, [producto.cantidad_requerida, producto.compuesto_id]);

      const componentesConDisponibilidad = [];

      for (const componente of componentes) {
        let disponibles = [];

        if (componente.requiere_series) {
          // ---------------------------------------------------------------
          // CASO A: Elemento requiere series (items individuales)
          // Buscar series en estado 'nuevo' o 'bueno' (no alquiladas)
          // ---------------------------------------------------------------
          const [series] = await pool.query(`
            SELECT
              s.id AS serie_id,
              s.numero_serie,
              s.estado,
              s.fecha_adquisicion,
              u.nombre AS ubicacion,
              u.id AS ubicacion_id
            FROM series s
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
            WHERE s.id_elemento = ?
              AND s.estado IN (?, ?)
            ORDER BY u.nombre, s.numero_serie
          `, [componente.elemento_id, ESTADOS_SERIE.NUEVO, ESTADOS_SERIE.BUENO]);

          disponibles = series.map(s => ({
            tipo: 'serie',
            id: s.serie_id,
            identificador: s.numero_serie,
            estado: s.estado,
            ubicacion: s.ubicacion,
            ubicacion_id: s.ubicacion_id,
            cantidad: 1 // Las series siempre son 1 unidad
          }));

        } else {
          // ---------------------------------------------------------------
          // CASO B: Elemento usa lotes (cantidades)
          // Buscar lotes con cantidad disponible > 0
          // ---------------------------------------------------------------
          const [lotes] = await pool.query(`
            SELECT
              l.id AS lote_id,
              l.lote_numero,
              l.cantidad_disponible,
              l.cantidad_total,
              u.nombre AS ubicacion,
              u.id AS ubicacion_id
            FROM lotes l
            LEFT JOIN ubicaciones u ON l.ubicacion_id = u.id
            WHERE l.elemento_id = ?
              AND l.cantidad_disponible > 0
            ORDER BY l.cantidad_disponible DESC
          `, [componente.elemento_id]);

          disponibles = lotes.map(l => ({
            tipo: 'lote',
            id: l.lote_id,
            identificador: l.lote_numero,
            estado: 'disponible',
            ubicacion: l.ubicacion,
            ubicacion_id: l.ubicacion_id,
            cantidad: l.cantidad_disponible,
            cantidad_total: l.cantidad_total
          }));
        }

        componentesConDisponibilidad.push({
          ...componente,
          disponibles,
          total_disponible: disponibles.reduce((sum, d) => sum + d.cantidad, 0),
          suficiente: disponibles.reduce((sum, d) => sum + d.cantidad, 0) >= componente.cantidad_total_requerida
        });
      }

      resultado.push({
        ...producto,
        componentes: componentesConDisponibilidad
      });
    }

    logger.info(`[SincronizacionAlquilerService] Elementos disponibles obtenidos para orden ${ordenId}`);

    return {
      orden,
      productos: resultado
    };
  }

  // ==========================================================================
  // MÉTODO: asignarElementosAOrden
  // ==========================================================================
  /**
   * Asigna elementos físicos (series/lotes) a una orden de trabajo.
   *
   * Este método se ejecuta durante la preparación de una orden. Los elementos
   * se guardan en la tabla `orden_trabajo_elementos` y la orden pasa a
   * estado "en_preparacion".
   *
   * VALIDACIONES:
   * - La orden debe existir
   * - La orden debe estar en estado válido (pendiente, confirmado, en_preparacion)
   * - Cada serie debe estar disponible (estado 'nuevo' o 'bueno')
   * - Cada lote debe tener suficiente cantidad disponible
   *
   * NOTA IMPORTANTE:
   * Este método NO modifica el inventario todavía. Solo registra qué elementos
   * se van a usar. La modificación del inventario ocurre en `ejecutarSalida()`.
   *
   * @param {number} ordenId - ID de la orden de trabajo
   * @param {Array<Object>} elementos - Array de elementos a asignar:
   *   - elemento_id: {number} ID del elemento base
   *   - serie_id: {number|null} ID de la serie (si aplica)
   *   - lote_id: {number|null} ID del lote (si aplica)
   *   - cantidad: {number} Cantidad (relevante solo para lotes)
   *
   * @returns {Promise<Object>} Resultado de la operación:
   *   - success: {boolean} true si fue exitoso
   *   - mensaje: {string} Descripción del resultado
   *   - orden_id: {number} ID de la orden
   *   - elementos_asignados: {number} Cantidad de elementos asignados
   *
   * @throws {AppError} 404 si la orden no existe
   * @throws {AppError} 400 si el estado no permite asignación
   * @throws {AppError} 400 si una serie/lote no está disponible
   *
   * @example
   * await SincronizacionAlquilerService.asignarElementosAOrden(1, [
   *   { elemento_id: 15, serie_id: 101, cantidad: 1 },
   *   { elemento_id: 15, serie_id: 102, cantidad: 1 },
   *   { elemento_id: 20, lote_id: 50, cantidad: 100 }
   * ]);
   */
  static async asignarElementosAOrden(ordenId, elementos) {
    logger.info(`[SincronizacionAlquilerService] Iniciando asignación de ${elementos.length} elementos a orden ${ordenId}`);

    // Obtener conexión para transacción
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      logger.debug(`[SincronizacionAlquilerService] Transacción iniciada`);

      // ---------------------------------------------------------------------
      // PASO 1: Verificar que la orden existe y está en estado válido
      // ---------------------------------------------------------------------
      const [ordenRows] = await connection.query(`
        SELECT id, alquiler_id, tipo, estado
        FROM ordenes_trabajo
        WHERE id = ?
        FOR UPDATE
      `, [ordenId]);

      if (!ordenRows.length) {
        throw new AppError('Orden de trabajo no encontrada', 404);
      }

      const orden = ordenRows[0];
      const estadosPermitidos = [
        ESTADOS_ORDEN.PENDIENTE,
        ESTADOS_ORDEN.CONFIRMADO,
        ESTADOS_ORDEN.EN_PREPARACION
      ];

      if (!estadosPermitidos.includes(orden.estado)) {
        throw new AppError(
          `La orden debe estar en estado ${estadosPermitidos.join(', ')} para asignar elementos. ` +
          `Estado actual: ${orden.estado}`,
          400
        );
      }

      logger.debug(`[SincronizacionAlquilerService] Orden válida: tipo=${orden.tipo}, estado=${orden.estado}`);

      // ---------------------------------------------------------------------
      // PASO 2: Limpiar asignaciones previas (permite reasignación)
      // ---------------------------------------------------------------------
      const [deleteResult] = await connection.query(
        'DELETE FROM orden_trabajo_elementos WHERE orden_id = ?',
        [ordenId]
      );

      if (deleteResult.affectedRows > 0) {
        logger.debug(`[SincronizacionAlquilerService] Eliminadas ${deleteResult.affectedRows} asignaciones previas`);
      }

      // ---------------------------------------------------------------------
      // PASO 3: Validar e insertar cada elemento
      // ---------------------------------------------------------------------
      let elementosInsertados = 0;

      for (const elem of elementos) {
        // -------------------------------------------------------------------
        // VALIDACIÓN: Serie disponible
        // -------------------------------------------------------------------
        if (elem.serie_id) {
          const [serieRows] = await connection.query(`
            SELECT id, numero_serie, estado
            FROM series
            WHERE id = ?
            FOR UPDATE
          `, [elem.serie_id]);

          if (!serieRows.length) {
            throw new AppError(`Serie con ID ${elem.serie_id} no encontrada`, 404);
          }

          const serie = serieRows[0];
          if (![ESTADOS_SERIE.NUEVO, ESTADOS_SERIE.BUENO].includes(serie.estado)) {
            throw new AppError(
              `Serie ${serie.numero_serie} no está disponible. Estado actual: ${serie.estado}`,
              400
            );
          }

          logger.debug(`[SincronizacionAlquilerService] Serie ${serie.numero_serie} validada`);
        }

        // -------------------------------------------------------------------
        // VALIDACIÓN: Lote con cantidad suficiente
        // -------------------------------------------------------------------
        if (elem.lote_id) {
          const cantidadRequerida = elem.cantidad || 1;

          const [loteRows] = await connection.query(`
            SELECT id, lote_numero, cantidad_disponible
            FROM lotes
            WHERE id = ?
            FOR UPDATE
          `, [elem.lote_id]);

          if (!loteRows.length) {
            throw new AppError(`Lote con ID ${elem.lote_id} no encontrado`, 404);
          }

          const lote = loteRows[0];
          if (lote.cantidad_disponible < cantidadRequerida) {
            throw new AppError(
              `Lote ${lote.lote_numero} no tiene suficiente cantidad. ` +
              `Disponible: ${lote.cantidad_disponible}, Requerido: ${cantidadRequerida}`,
              400
            );
          }

          logger.debug(`[SincronizacionAlquilerService] Lote ${lote.lote_numero} validado (disponible: ${lote.cantidad_disponible})`);
        }

        // -------------------------------------------------------------------
        // INSERTAR: Registro en orden_trabajo_elementos
        // -------------------------------------------------------------------
        await connection.query(`
          INSERT INTO orden_trabajo_elementos
          (orden_id, elemento_id, serie_id, lote_id, cantidad, estado)
          VALUES (?, ?, ?, ?, ?, 'pendiente')
        `, [
          ordenId,
          elem.elemento_id,
          elem.serie_id || null,
          elem.lote_id || null,
          elem.cantidad || 1
        ]);

        elementosInsertados++;
      }

      // ---------------------------------------------------------------------
      // PASO 4: Actualizar estado de la orden a "en_preparacion"
      // ---------------------------------------------------------------------
      await connection.query(`
        UPDATE ordenes_trabajo
        SET estado = ?
        WHERE id = ?
      `, [ESTADOS_ORDEN.EN_PREPARACION, ordenId]);

      // ---------------------------------------------------------------------
      // COMMIT: Confirmar transacción
      // ---------------------------------------------------------------------
      await connection.commit();

      logger.info(
        `[SincronizacionAlquilerService] Asignación completada: ` +
        `orden=${ordenId}, elementos=${elementosInsertados}`
      );

      return {
        success: true,
        mensaje: `${elementosInsertados} elementos asignados correctamente`,
        orden_id: ordenId,
        elementos_asignados: elementosInsertados
      };

    } catch (error) {
      // ROLLBACK: Revertir cambios en caso de error
      await connection.rollback();
      logger.error(`[SincronizacionAlquilerService] Error en asignación: ${error.message}`);
      throw error;

    } finally {
      // SIEMPRE: Liberar conexión
      connection.release();
    }
  }

  // ==========================================================================
  // MÉTODO: ejecutarSalida
  // ==========================================================================
  /**
   * Ejecuta la salida de elementos para una orden de MONTAJE.
   *
   * Este es un método CRÍTICO que sincroniza:
   * 1. La orden de trabajo (pasa a "en_ruta")
   * 2. El alquiler (pasa a "activo")
   * 3. Los elementos del alquiler (se copian de orden_trabajo_elementos)
   * 4. El inventario (series pasan a "alquilado", lotes reducen cantidad)
   *
   * PRECONDICIONES:
   * - La orden debe ser de tipo "montaje"
   * - La orden debe estar en estado "en_preparacion"
   * - Debe haber elementos asignados a la orden
   *
   * POSTCONDICIONES:
   * - Orden: estado = "en_ruta"
   * - Alquiler: estado = "activo", fecha_salida = NOW()
   * - alquiler_elementos: contiene copia de elementos con ubicación original
   * - series: estado = "alquilado", ubicacion_id = NULL
   * - lotes: cantidad_disponible reducida
   *
   * ATOMICIDAD:
   * Toda la operación es transaccional. Si falla cualquier paso,
   * se revierte TODO y el sistema queda en el estado anterior.
   *
   * @param {number} ordenId - ID de la orden de montaje
   * @param {Object} datos - Datos adicionales (reservado para uso futuro)
   *   - notas_salida: {string} Notas opcionales sobre la salida
   *
   * @returns {Promise<Object>} Resultado de la operación:
   *   - success: {boolean} true si fue exitoso
   *   - mensaje: {string} Descripción del resultado
   *   - orden_id: {number} ID de la orden
   *   - alquiler_id: {number} ID del alquiler actualizado
   *   - elementos_despachados: {number} Cantidad de elementos despachados
   *   - resumen: {Object} Detalle de series y lotes afectados
   *
   * @throws {AppError} 404 si la orden de montaje no existe
   * @throws {AppError} 400 si la orden no está en estado correcto
   * @throws {AppError} 400 si no hay elementos asignados
   *
   * @example
   * const resultado = await SincronizacionAlquilerService.ejecutarSalida(1, {
   *   notas_salida: 'Salida autorizada por Juan Pérez'
   * });
   * // resultado.alquiler_id -> ID del alquiler ahora activo
   */
  static async ejecutarSalida(ordenId, datos = {}) {
    logger.info(`[SincronizacionAlquilerService] ========== INICIANDO EJECUTAR SALIDA ==========`);
    logger.info(`[SincronizacionAlquilerService] Orden ID: ${ordenId}`);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      logger.debug(`[SincronizacionAlquilerService] Transacción iniciada`);

      // ---------------------------------------------------------------------
      // PASO 1: Verificar orden de MONTAJE
      // ---------------------------------------------------------------------
      const [ordenRows] = await connection.query(`
        SELECT
          ot.id,
          ot.tipo,
          ot.estado,
          ot.alquiler_id,
          a.estado AS alquiler_estado,
          a.cotizacion_id
        FROM ordenes_trabajo ot
        INNER JOIN alquileres a ON ot.alquiler_id = a.id
        WHERE ot.id = ?
        FOR UPDATE
      `, [ordenId]);

      if (!ordenRows.length) {
        throw new AppError('Orden de trabajo no encontrada', 404);
      }

      const orden = ordenRows[0];

      // Validar que sea orden de montaje
      if (orden.tipo !== TIPOS_ORDEN.MONTAJE) {
        throw new AppError(
          `Solo se puede ejecutar salida en órdenes de MONTAJE. ` +
          `Esta orden es de tipo: ${orden.tipo}`,
          400
        );
      }

      // Validar estado de la orden
      if (orden.estado !== ESTADOS_ORDEN.EN_PREPARACION) {
        throw new AppError(
          `La orden debe estar en estado "${ESTADOS_ORDEN.EN_PREPARACION}" para ejecutar salida. ` +
          `Estado actual: ${orden.estado}`,
          400
        );
      }

      logger.debug(`[SincronizacionAlquilerService] Orden validada: montaje, en_preparacion`);

      const alquilerId = orden.alquiler_id;

      // ---------------------------------------------------------------------
      // PASO 2: Obtener elementos asignados a la orden
      // ---------------------------------------------------------------------
      const [elementosOrden] = await connection.query(`
        SELECT
          ote.id,
          ote.elemento_id,
          ote.serie_id,
          ote.lote_id,
          ote.cantidad,
          e.nombre AS elemento_nombre
        FROM orden_trabajo_elementos ote
        INNER JOIN elementos e ON ote.elemento_id = e.id
        WHERE ote.orden_id = ?
      `, [ordenId]);

      if (!elementosOrden.length) {
        throw new AppError(
          'No hay elementos asignados a esta orden. ' +
          'Debe asignar elementos antes de ejecutar la salida.',
          400
        );
      }

      logger.info(`[SincronizacionAlquilerService] Elementos a despachar: ${elementosOrden.length}`);

      // ---------------------------------------------------------------------
      // PASO 3: Procesar cada elemento
      // ---------------------------------------------------------------------
      const resumen = {
        series_actualizadas: [],
        lotes_actualizados: []
      };

      // Validar que TODOS los elementos tengan serie o lote asignado
      const elementosSinAsignar = elementosOrden.filter(elem => {
        const serieValida = elem.serie_id && Number.isFinite(Number(elem.serie_id));
        const loteValido = elem.lote_id && Number.isFinite(Number(elem.lote_id));
        return !serieValida && !loteValido;
      });

      if (elementosSinAsignar.length > 0) {
        const nombres = elementosSinAsignar.map(e => e.elemento_nombre).join(', ');
        throw new AppError(
          `No se puede ejecutar la salida. ${elementosSinAsignar.length} elemento(s) no tienen ` +
          `serie o lote asignado del inventario: ${nombres}. ` +
          `Debe asignar elementos reales del inventario antes de despachar.`,
          400
        );
      }

      for (const elem of elementosOrden) {
        logger.debug(`[SincronizacionAlquilerService] Procesando: ${elem.elemento_nombre}`);

        const serieId = Number(elem.serie_id) || null;
        const loteId = Number(elem.lote_id) || null;

        // -----------------------------------------------------------------
        // Obtener ubicación original (para poder restaurar en retorno)
        // -----------------------------------------------------------------
        let ubicacionOriginalId = null;

        if (serieId) {
          const [serieInfo] = await connection.query(
            'SELECT ubicacion_id FROM series WHERE id = ?',
            [serieId]
          );
          ubicacionOriginalId = serieInfo[0]?.ubicacion_id;
        } else if (loteId) {
          const [loteInfo] = await connection.query(
            'SELECT ubicacion_id FROM lotes WHERE id = ?',
            [loteId]
          );
          ubicacionOriginalId = loteInfo[0]?.ubicacion_id;
        }

        // -----------------------------------------------------------------
        // Insertar en alquiler_elementos
        // -----------------------------------------------------------------
        await connection.query(`
          INSERT INTO alquiler_elementos
          (alquiler_id, elemento_id, serie_id, lote_id, cantidad_lote,
           estado_salida, ubicacion_original_id, fecha_asignacion)
          VALUES (?, ?, ?, ?, ?, 'bueno', ?, NOW())
        `, [
          alquilerId,
          elem.elemento_id,
          serieId,
          loteId,
          elem.cantidad,
          ubicacionOriginalId
        ]);

        // -----------------------------------------------------------------
        // Actualizar inventario: SERIES
        // -----------------------------------------------------------------
        if (serieId) {
          await connection.query(`
            UPDATE series
            SET estado = ?,
                ubicacion_id = NULL
            WHERE id = ?
          `, [ESTADOS_SERIE.ALQUILADO, serieId]);

          // Obtener número de serie para log
          const [serieData] = await connection.query(
            'SELECT numero_serie FROM series WHERE id = ?',
            [serieId]
          );

          resumen.series_actualizadas.push({
            id: serieId,
            numero_serie: serieData[0]?.numero_serie,
            estado_anterior: 'bueno/nuevo',
            estado_nuevo: ESTADOS_SERIE.ALQUILADO
          });

          logger.debug(`[SincronizacionAlquilerService] Serie ${serieData[0]?.numero_serie} → alquilado`);
        }

        // -----------------------------------------------------------------
        // Actualizar inventario: LOTES
        // -----------------------------------------------------------------
        if (loteId) {
          await connection.query(`
            UPDATE lotes
            SET cantidad_disponible = cantidad_disponible - ?
            WHERE id = ?
          `, [elem.cantidad, loteId]);

          // Obtener info del lote para log
          const [loteData] = await connection.query(
            'SELECT lote_numero, cantidad_disponible FROM lotes WHERE id = ?',
            [loteId]
          );

          resumen.lotes_actualizados.push({
            id: loteId,
            lote_numero: loteData[0]?.lote_numero,
            cantidad_reducida: elem.cantidad,
            cantidad_restante: loteData[0]?.cantidad_disponible
          });

          logger.debug(
            `[SincronizacionAlquilerService] Lote ${loteData[0]?.lote_numero}: ` +
            `-${elem.cantidad} → ${loteData[0]?.cantidad_disponible} disponibles`
          );
        }

        // -----------------------------------------------------------------
        // Actualizar estado en orden_trabajo_elementos
        // -----------------------------------------------------------------
        await connection.query(`
          UPDATE orden_trabajo_elementos
          SET estado = 'cargado',
              verificado_salida = TRUE
          WHERE id = ?
        `, [elem.id]);
      }

      // ---------------------------------------------------------------------
      // PASO 4: Actualizar estado de la ORDEN a "en_ruta"
      // ---------------------------------------------------------------------
      await connection.query(`
        UPDATE ordenes_trabajo
        SET estado = ?
        WHERE id = ?
      `, [ESTADOS_ORDEN.EN_RUTA, ordenId]);

      logger.info(`[SincronizacionAlquilerService] Orden ${ordenId} → estado: ${ESTADOS_ORDEN.EN_RUTA}`);

      // ---------------------------------------------------------------------
      // PASO 5: Actualizar estado del ALQUILER a "activo"
      // ---------------------------------------------------------------------
      await connection.query(`
        UPDATE alquileres
        SET estado = ?,
            fecha_salida = NOW()
        WHERE id = ?
      `, [ESTADOS_ALQUILER.ACTIVO, alquilerId]);

      logger.info(`[SincronizacionAlquilerService] Alquiler ${alquilerId} → estado: ${ESTADOS_ALQUILER.ACTIVO}`);

      // ---------------------------------------------------------------------
      // COMMIT: Confirmar transacción
      // ---------------------------------------------------------------------
      await connection.commit();

      logger.info(`[SincronizacionAlquilerService] ========== SALIDA EJECUTADA EXITOSAMENTE ==========`);
      logger.info(`[SincronizacionAlquilerService] Resumen:`);
      logger.info(`[SincronizacionAlquilerService]   - Orden: ${ordenId}`);
      logger.info(`[SincronizacionAlquilerService]   - Alquiler: ${alquilerId}`);
      logger.info(`[SincronizacionAlquilerService]   - Series actualizadas: ${resumen.series_actualizadas.length}`);
      logger.info(`[SincronizacionAlquilerService]   - Lotes actualizados: ${resumen.lotes_actualizados.length}`);

      return {
        success: true,
        mensaje: 'Salida ejecutada correctamente. El alquiler está ahora activo.',
        orden_id: ordenId,
        alquiler_id: alquilerId,
        elementos_despachados: elementosOrden.length,
        resumen
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`[SincronizacionAlquilerService] ERROR en ejecutarSalida: ${error.message}`);
      logger.error(`[SincronizacionAlquilerService] Stack: ${error.stack}`);
      throw error;

    } finally {
      connection.release();
    }
  }

  // ==========================================================================
  // MÉTODO: ejecutarRetorno
  // ==========================================================================
  /**
   * Registra el retorno de elementos para una orden de DESMONTAJE.
   *
   * Este es un método CRÍTICO que sincroniza:
   * 1. La orden de trabajo (pasa a "completado")
   * 2. El alquiler (pasa a "finalizado", registra daños)
   * 3. Los elementos del alquiler (registra estado de retorno)
   * 4. El inventario (restaura series según condición, restaura lotes)
   *
   * PRECONDICIONES:
   * - La orden debe ser de tipo "desmontaje"
   * - La orden debe estar en estado "en_sitio" o "en_proceso"
   * - Deben existir elementos en alquiler_elementos para este alquiler
   *
   * POSTCONDICIONES:
   * - Orden: estado = "completado"
   * - Alquiler: estado = "finalizado", fecha_retorno_real = NOW(), costo_danos calculado
   * - alquiler_elementos: estado_retorno, costo_dano, notas_retorno actualizados
   * - series: estado según condición de retorno, ubicación restaurada si "bueno"
   * - lotes: cantidad_disponible restaurada si estado es "bueno"
   *
   * LÓGICA DE RESTAURACIÓN DE INVENTARIO:
   *
   * | Estado Retorno | Series                    | Lotes                    |
   * |----------------|---------------------------|--------------------------|
   * | bueno          | estado="bueno"            | +cantidad a disponible   |
   * |                | ubicacion=original        |                          |
   * |----------------|---------------------------|--------------------------|
   * | dañado         | estado="mantenimiento"    | NO se restaura cantidad  |
   * |                | ubicacion=NULL (taller)   |                          |
   * |----------------|---------------------------|--------------------------|
   * | perdido        | estado="dañado"           | NO se restaura cantidad  |
   * |                | ubicacion=NULL            |                          |
   *
   * @param {number} ordenId - ID de la orden de desmontaje
   * @param {Array<Object>} retornos - Array con estado de cada elemento:
   *   - alquiler_elemento_id: {number} ID del registro en alquiler_elementos
   *   - estado_retorno: {string} 'bueno' | 'dañado' | 'perdido'
   *   - costo_dano: {number} Costo del daño (0 si está bueno)
   *   - notas: {string} Descripción del daño (opcional)
   *
   * @returns {Promise<Object>} Resultado de la operación:
   *   - success: {boolean} true si fue exitoso
   *   - mensaje: {string} Descripción del resultado
   *   - orden_id: {number} ID de la orden
   *   - alquiler_id: {number} ID del alquiler finalizado
   *   - total_danos: {number} Suma total de daños
   *   - deposito: {number} Depósito que se había cobrado
   *   - saldo: {number} Diferencia (deposito - daños)
   *   - resumen: {Object} Detalle de elementos procesados
   *
   * @throws {AppError} 404 si la orden de desmontaje no existe
   * @throws {AppError} 400 si la orden no está en estado correcto
   * @throws {AppError} 400 si el estado de retorno es inválido
   * @throws {AppError} 404 si un elemento no pertenece al alquiler
   *
   * @example
   * const resultado = await SincronizacionAlquilerService.ejecutarRetorno(5, [
   *   { alquiler_elemento_id: 10, estado_retorno: 'bueno', costo_dano: 0, notas: '' },
   *   { alquiler_elemento_id: 11, estado_retorno: 'dañado', costo_dano: 50000, notas: 'Rasgadura' }
   * ]);
   */
  static async ejecutarRetorno(ordenId, retornos) {
    logger.info(`[SincronizacionAlquilerService] ========== INICIANDO EJECUTAR RETORNO ==========`);
    logger.info(`[SincronizacionAlquilerService] Orden ID: ${ordenId}`);
    logger.info(`[SincronizacionAlquilerService] Elementos a procesar: ${retornos.length}`);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      logger.debug(`[SincronizacionAlquilerService] Transacción iniciada`);

      // ---------------------------------------------------------------------
      // PASO 1: Verificar orden de DESMONTAJE
      // ---------------------------------------------------------------------
      const [ordenRows] = await connection.query(`
        SELECT
          ot.id,
          ot.tipo,
          ot.estado,
          ot.alquiler_id,
          a.estado AS alquiler_estado,
          a.deposito_cobrado
        FROM ordenes_trabajo ot
        INNER JOIN alquileres a ON ot.alquiler_id = a.id
        WHERE ot.id = ?
        FOR UPDATE
      `, [ordenId]);

      if (!ordenRows.length) {
        throw new AppError('Orden de trabajo no encontrada', 404);
      }

      const orden = ordenRows[0];

      // Validar que sea orden de desmontaje
      if (orden.tipo !== TIPOS_ORDEN.DESMONTAJE) {
        throw new AppError(
          `Solo se puede registrar retorno en órdenes de DESMONTAJE. ` +
          `Esta orden es de tipo: ${orden.tipo}`,
          400
        );
      }

      // Validar estado de la orden
      const estadosPermitidos = [ESTADOS_ORDEN.EN_SITIO, ESTADOS_ORDEN.EN_PROCESO];
      if (!estadosPermitidos.includes(orden.estado)) {
        throw new AppError(
          `La orden debe estar en estado "${estadosPermitidos.join('" o "')}" para registrar retorno. ` +
          `Estado actual: ${orden.estado}`,
          400
        );
      }

      logger.debug(`[SincronizacionAlquilerService] Orden validada: desmontaje, ${orden.estado}`);

      const alquilerId = orden.alquiler_id;
      const depositoCobrado = parseFloat(orden.deposito_cobrado) || 0;

      // ---------------------------------------------------------------------
      // PASO 2: Procesar cada elemento retornado
      // ---------------------------------------------------------------------
      let totalDanos = 0;
      const resumen = {
        buenos: 0,
        danados: 0,
        perdidos: 0,
        series_restauradas: [],
        lotes_restaurados: []
      };

      for (const retorno of retornos) {
        const {
          alquiler_elemento_id,
          estado_retorno,
          costo_dano = 0,
          notas = ''
        } = retorno;

        // -----------------------------------------------------------------
        // Validar estado de retorno
        // -----------------------------------------------------------------
        const estadosRetornoValidos = Object.values(ESTADOS_RETORNO);
        if (!estadosRetornoValidos.includes(estado_retorno)) {
          throw new AppError(
            `Estado de retorno inválido: "${estado_retorno}". ` +
            `Valores válidos: ${estadosRetornoValidos.join(', ')}`,
            400
          );
        }

        // -----------------------------------------------------------------
        // Obtener elemento del alquiler
        // -----------------------------------------------------------------
        const [elementoRows] = await connection.query(`
          SELECT
            ae.*,
            e.nombre AS elemento_nombre
          FROM alquiler_elementos ae
          INNER JOIN elementos e ON ae.elemento_id = e.id
          WHERE ae.id = ? AND ae.alquiler_id = ?
          FOR UPDATE
        `, [alquiler_elemento_id, alquilerId]);

        if (!elementoRows.length) {
          throw new AppError(
            `Elemento con ID ${alquiler_elemento_id} no encontrado en el alquiler ${alquilerId}`,
            404
          );
        }

        const elem = elementoRows[0];
        const costoDanoNumerico = parseFloat(costo_dano) || 0;

        logger.debug(
          `[SincronizacionAlquilerService] Procesando: ${elem.elemento_nombre} ` +
          `→ estado: ${estado_retorno}, daño: ${costoDanoNumerico}`
        );

        // -----------------------------------------------------------------
        // Actualizar alquiler_elementos
        // -----------------------------------------------------------------
        await connection.query(`
          UPDATE alquiler_elementos
          SET estado_retorno = ?,
              costo_dano = ?,
              notas_retorno = ?,
              fecha_retorno = NOW()
          WHERE id = ?
        `, [estado_retorno, costoDanoNumerico, notas || null, alquiler_elemento_id]);

        // Acumular daños
        totalDanos += costoDanoNumerico;

        // Contadores para resumen
        if (estado_retorno === ESTADOS_RETORNO.BUENO) resumen.buenos++;
        else if (estado_retorno === ESTADOS_RETORNO.DANADO) resumen.danados++;
        else if (estado_retorno === ESTADOS_RETORNO.PERDIDO) resumen.perdidos++;

        // -----------------------------------------------------------------
        // Restaurar inventario: SERIES
        // -----------------------------------------------------------------
        if (elem.serie_id) {
          let nuevoEstado;
          let nuevaUbicacion;

          switch (estado_retorno) {
            case ESTADOS_RETORNO.BUENO:
              // Vuelve a estado "bueno" y a su ubicación original
              nuevoEstado = ESTADOS_SERIE.BUENO;
              nuevaUbicacion = elem.ubicacion_original_id;
              break;

            case ESTADOS_RETORNO.DANADO:
              // Va a mantenimiento, sin ubicación fija
              nuevoEstado = ESTADOS_SERIE.MANTENIMIENTO;
              nuevaUbicacion = null;
              break;

            case ESTADOS_RETORNO.PERDIDO:
              // Se marca como dañado (baja), sin ubicación
              nuevoEstado = ESTADOS_SERIE.DANADO;
              nuevaUbicacion = null;
              break;
          }

          await connection.query(`
            UPDATE series
            SET estado = ?,
                ubicacion_id = ?
            WHERE id = ?
          `, [nuevoEstado, nuevaUbicacion, elem.serie_id]);

          // Obtener info para log
          const [serieData] = await connection.query(
            'SELECT numero_serie FROM series WHERE id = ?',
            [elem.serie_id]
          );

          resumen.series_restauradas.push({
            id: elem.serie_id,
            numero_serie: serieData[0]?.numero_serie,
            estado_retorno,
            estado_nuevo: nuevoEstado
          });

          logger.debug(
            `[SincronizacionAlquilerService] Serie ${serieData[0]?.numero_serie} ` +
            `→ ${nuevoEstado}`
          );
        }

        // -----------------------------------------------------------------
        // Restaurar inventario: LOTES
        // Solo se restaura cantidad si el estado es "bueno"
        // -----------------------------------------------------------------
        if (elem.lote_id) {
          if (estado_retorno === ESTADOS_RETORNO.BUENO) {
            // Restaurar cantidad al lote
            await connection.query(`
              UPDATE lotes
              SET cantidad_disponible = cantidad_disponible + ?
              WHERE id = ?
            `, [elem.cantidad_lote, elem.lote_id]);

            // Obtener info para log
            const [loteData] = await connection.query(
              'SELECT lote_numero, cantidad_disponible FROM lotes WHERE id = ?',
              [elem.lote_id]
            );

            resumen.lotes_restaurados.push({
              id: elem.lote_id,
              lote_numero: loteData[0]?.lote_numero,
              cantidad_restaurada: elem.cantidad_lote,
              cantidad_actual: loteData[0]?.cantidad_disponible
            });

            logger.debug(
              `[SincronizacionAlquilerService] Lote ${loteData[0]?.lote_numero} ` +
              `+${elem.cantidad_lote} → ${loteData[0]?.cantidad_disponible}`
            );
          } else {
            // Si está dañado o perdido, la cantidad NO se restaura
            logger.debug(
              `[SincronizacionAlquilerService] Lote ID ${elem.lote_id}: ` +
              `cantidad NO restaurada (estado: ${estado_retorno})`
            );
          }
        }
      }

      // ---------------------------------------------------------------------
      // PASO 3: Actualizar estado de la ORDEN a "completado"
      // ---------------------------------------------------------------------
      await connection.query(`
        UPDATE ordenes_trabajo
        SET estado = ?
        WHERE id = ?
      `, [ESTADOS_ORDEN.COMPLETADO, ordenId]);

      logger.info(`[SincronizacionAlquilerService] Orden ${ordenId} → estado: ${ESTADOS_ORDEN.COMPLETADO}`);

      // ---------------------------------------------------------------------
      // PASO 4: Actualizar estado del ALQUILER a "finalizado"
      // ---------------------------------------------------------------------
      await connection.query(`
        UPDATE alquileres
        SET estado = ?,
            fecha_retorno_real = NOW(),
            costo_danos = ?
        WHERE id = ?
      `, [ESTADOS_ALQUILER.FINALIZADO, totalDanos, alquilerId]);

      logger.info(`[SincronizacionAlquilerService] Alquiler ${alquilerId} → estado: ${ESTADOS_ALQUILER.FINALIZADO}`);

      // ---------------------------------------------------------------------
      // COMMIT: Confirmar transacción
      // ---------------------------------------------------------------------
      await connection.commit();

      const saldo = depositoCobrado - totalDanos;

      logger.info(`[SincronizacionAlquilerService] ========== RETORNO EJECUTADO EXITOSAMENTE ==========`);
      logger.info(`[SincronizacionAlquilerService] Resumen:`);
      logger.info(`[SincronizacionAlquilerService]   - Orden: ${ordenId}`);
      logger.info(`[SincronizacionAlquilerService]   - Alquiler: ${alquilerId}`);
      logger.info(`[SincronizacionAlquilerService]   - Elementos buenos: ${resumen.buenos}`);
      logger.info(`[SincronizacionAlquilerService]   - Elementos dañados: ${resumen.danados}`);
      logger.info(`[SincronizacionAlquilerService]   - Elementos perdidos: ${resumen.perdidos}`);
      logger.info(`[SincronizacionAlquilerService]   - Total daños: $${totalDanos.toLocaleString()}`);
      logger.info(`[SincronizacionAlquilerService]   - Depósito: $${depositoCobrado.toLocaleString()}`);
      logger.info(`[SincronizacionAlquilerService]   - Saldo: $${saldo.toLocaleString()}`);

      return {
        success: true,
        mensaje: 'Retorno registrado correctamente. El alquiler está finalizado.',
        orden_id: ordenId,
        alquiler_id: alquilerId,
        total_danos: totalDanos,
        deposito: depositoCobrado,
        saldo,
        resumen
      };

    } catch (error) {
      await connection.rollback();
      logger.error(`[SincronizacionAlquilerService] ERROR en ejecutarRetorno: ${error.message}`);
      logger.error(`[SincronizacionAlquilerService] Stack: ${error.stack}`);
      throw error;

    } finally {
      connection.release();
    }
  }

  // ==========================================================================
  // MÉTODO: verificarConsistencia (Utilidad de diagnóstico)
  // ==========================================================================
  /**
   * Verifica la consistencia de datos entre un alquiler y sus órdenes.
   *
   * Este método es útil para:
   * - Debugging de problemas de sincronización
   * - Auditoría de datos
   * - Validación antes de operaciones críticas
   *
   * @param {number} alquilerId - ID del alquiler a verificar
   * @returns {Promise<Object>} Reporte de consistencia
   */
  static async verificarConsistencia(alquilerId) {
    logger.info(`[SincronizacionAlquilerService] Verificando consistencia del alquiler ${alquilerId}`);

    const [alquiler] = await pool.query(`
      SELECT
        a.*,
        cot.evento_nombre,
        cot.id AS cotizacion_id
      FROM alquileres a
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      WHERE a.id = ?
    `, [alquilerId]);

    if (!alquiler.length) {
      throw new AppError('Alquiler no encontrado', 404);
    }

    // Obtener órdenes de trabajo
    const [ordenes] = await pool.query(`
      SELECT id, tipo, estado
      FROM ordenes_trabajo
      WHERE alquiler_id = ?
    `, [alquilerId]);

    // Obtener elementos del alquiler
    const [elementosAlquiler] = await pool.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN estado_retorno IS NOT NULL THEN 1 ELSE 0 END) as retornados
      FROM alquiler_elementos
      WHERE alquiler_id = ?
    `, [alquilerId]);

    // Obtener elementos de las órdenes
    const [elementosOrdenes] = await pool.query(`
      SELECT COUNT(*) as total
      FROM orden_trabajo_elementos ote
      INNER JOIN ordenes_trabajo ot ON ote.orden_id = ot.id
      WHERE ot.alquiler_id = ?
    `, [alquilerId]);

    const reporte = {
      alquiler: alquiler[0],
      ordenes: ordenes,
      elementos_alquiler: elementosAlquiler[0],
      elementos_ordenes: elementosOrdenes[0],
      consistente: true,
      problemas: []
    };

    // Verificar consistencia de estados
    const ordenMontaje = ordenes.find(o => o.tipo === TIPOS_ORDEN.MONTAJE);
    const ordenDesmontaje = ordenes.find(o => o.tipo === TIPOS_ORDEN.DESMONTAJE);

    // Regla: Si alquiler está activo, orden montaje debe estar >= en_ruta
    if (alquiler[0].estado === ESTADOS_ALQUILER.ACTIVO) {
      if (ordenMontaje && ![ESTADOS_ORDEN.EN_RUTA, ESTADOS_ORDEN.EN_SITIO, ESTADOS_ORDEN.EN_PROCESO, ESTADOS_ORDEN.COMPLETADO].includes(ordenMontaje.estado)) {
        reporte.consistente = false;
        reporte.problemas.push(`Alquiler activo pero orden montaje en estado ${ordenMontaje.estado}`);
      }
    }

    // Regla: Si alquiler está finalizado, orden desmontaje debe estar completado
    if (alquiler[0].estado === ESTADOS_ALQUILER.FINALIZADO) {
      if (ordenDesmontaje && ordenDesmontaje.estado !== ESTADOS_ORDEN.COMPLETADO) {
        reporte.consistente = false;
        reporte.problemas.push(`Alquiler finalizado pero orden desmontaje en estado ${ordenDesmontaje.estado}`);
      }
    }

    logger.info(`[SincronizacionAlquilerService] Consistencia verificada: ${reporte.consistente ? 'OK' : 'PROBLEMAS'}`);

    return reporte;
  }

  // ==========================================================================
  // MÉTODO: sincronizarEstadoAlquiler
  // ==========================================================================
  /**
   * Sincroniza el estado del alquiler cuando cambia el estado de una orden.
   *
   * Este método se llama automáticamente cuando una orden cambia de estado
   * para mantener la consistencia entre órdenes y alquileres.
   *
   * REGLAS DE SINCRONIZACIÓN:
   *
   * | Tipo Orden  | Nuevo Estado Orden | Acción sobre Alquiler              |
   * |-------------|--------------------|------------------------------------|
   * | montaje     | en_ruta            | → activo (si estaba programado)    |
   * | montaje     | completado         | → activo (si no lo está ya)        |
   * | desmontaje  | completado         | → finalizado                       |
   * | cualquiera  | cancelado          | → cancelado (si ambas canceladas)  |
   *
   * @param {number} ordenId - ID de la orden que cambió de estado
   * @param {string} nuevoEstado - Nuevo estado de la orden
   * @param {string} estadoAnterior - Estado anterior de la orden (opcional)
   *
   * @returns {Promise<Object>} Resultado de la sincronización:
   *   - sincronizado: {boolean} true si se hizo algún cambio
   *   - alquiler_id: {number} ID del alquiler
   *   - estado_anterior: {string} Estado anterior del alquiler
   *   - estado_nuevo: {string} Nuevo estado del alquiler (si cambió)
   *   - mensaje: {string} Descripción de lo que se hizo
   *
   * @example
   * // Cuando orden de montaje pasa a en_ruta
   * await SincronizacionAlquilerService.sincronizarEstadoAlquiler(5, 'en_ruta', 'en_preparacion');
   */
  static async sincronizarEstadoAlquiler(ordenId, nuevoEstado, estadoAnterior = null) {
    logger.info(`[SincronizacionAlquilerService] ========== SINCRONIZANDO ESTADO ALQUILER ==========`);
    logger.info(`[SincronizacionAlquilerService] Orden: ${ordenId}, Nuevo estado: ${nuevoEstado}`);

    // Obtener información de la orden y su alquiler
    const [ordenRows] = await pool.query(`
      SELECT
        ot.id,
        ot.tipo,
        ot.estado,
        ot.alquiler_id,
        a.estado AS alquiler_estado
      FROM ordenes_trabajo ot
      LEFT JOIN alquileres a ON ot.alquiler_id = a.id
      WHERE ot.id = ?
    `, [ordenId]);

    if (!ordenRows.length) {
      logger.warn(`[SincronizacionAlquilerService] Orden ${ordenId} no encontrada`);
      return { sincronizado: false, mensaje: 'Orden no encontrada' };
    }

    const orden = ordenRows[0];

    // Si no tiene alquiler asociado, no hay nada que sincronizar
    if (!orden.alquiler_id) {
      logger.info(`[SincronizacionAlquilerService] Orden ${ordenId} no tiene alquiler asociado`);
      return { sincronizado: false, mensaje: 'Orden sin alquiler asociado' };
    }

    const alquilerId = orden.alquiler_id;
    const alquilerEstadoActual = orden.alquiler_estado;
    let nuevoEstadoAlquiler = null;
    let mensaje = '';

    // ---------------------------------------------------------------------
    // REGLA 1: Orden MONTAJE pasa a en_ruta → Alquiler debe ser ACTIVO
    // ---------------------------------------------------------------------
    if (orden.tipo === TIPOS_ORDEN.MONTAJE) {
      if ([ESTADOS_ORDEN.EN_RUTA, ESTADOS_ORDEN.EN_SITIO, ESTADOS_ORDEN.EN_PROCESO, ESTADOS_ORDEN.COMPLETADO].includes(nuevoEstado)) {
        if (alquilerEstadoActual === ESTADOS_ALQUILER.PROGRAMADO) {
          nuevoEstadoAlquiler = ESTADOS_ALQUILER.ACTIVO;
          mensaje = 'Alquiler activado por avance de orden de montaje';
        }
      }
    }

    // ---------------------------------------------------------------------
    // REGLA 2: Orden DESMONTAJE pasa a completado → Alquiler FINALIZADO
    // ---------------------------------------------------------------------
    if (orden.tipo === TIPOS_ORDEN.DESMONTAJE) {
      if (nuevoEstado === ESTADOS_ORDEN.COMPLETADO) {
        if (alquilerEstadoActual === ESTADOS_ALQUILER.ACTIVO) {
          nuevoEstadoAlquiler = ESTADOS_ALQUILER.FINALIZADO;
          mensaje = 'Alquiler finalizado por completar orden de desmontaje';
        }
      }
    }

    // ---------------------------------------------------------------------
    // REGLA 3: Orden CANCELADA → Verificar si ambas órdenes están canceladas
    // ---------------------------------------------------------------------
    if (nuevoEstado === ESTADOS_ORDEN.CANCELADO) {
      // Obtener la otra orden del mismo alquiler
      const [otrasOrdenes] = await pool.query(`
        SELECT id, tipo, estado
        FROM ordenes_trabajo
        WHERE alquiler_id = ? AND id != ?
      `, [alquilerId, ordenId]);

      // Si la otra orden también está cancelada (o no existe), cancelar alquiler
      const otraOrden = otrasOrdenes[0];
      const otraCancelada = !otraOrden || otraOrden.estado === ESTADOS_ORDEN.CANCELADO;

      if (otraCancelada && alquilerEstadoActual !== ESTADOS_ALQUILER.CANCELADO) {
        nuevoEstadoAlquiler = ESTADOS_ALQUILER.CANCELADO;
        mensaje = 'Alquiler cancelado porque todas las órdenes fueron canceladas';
      }
    }

    // ---------------------------------------------------------------------
    // Aplicar el cambio si es necesario
    // ---------------------------------------------------------------------
    if (nuevoEstadoAlquiler) {
      await pool.query(`
        UPDATE alquileres
        SET estado = ?
        WHERE id = ?
      `, [nuevoEstadoAlquiler, alquilerId]);

      logger.info(`[SincronizacionAlquilerService] Alquiler ${alquilerId}: ${alquilerEstadoActual} → ${nuevoEstadoAlquiler}`);
      logger.info(`[SincronizacionAlquilerService] Motivo: ${mensaje}`);

      return {
        sincronizado: true,
        alquiler_id: alquilerId,
        estado_anterior: alquilerEstadoActual,
        estado_nuevo: nuevoEstadoAlquiler,
        mensaje
      };
    }

    logger.info(`[SincronizacionAlquilerService] No se requiere sincronización`);
    return {
      sincronizado: false,
      alquiler_id: alquilerId,
      estado_actual: alquilerEstadoActual,
      mensaje: 'No se requiere cambio de estado'
    };
  }

  // ==========================================================================
  // MÉTODO: obtenerEstadoSincronizacion
  // ==========================================================================
  /**
   * Obtiene un resumen del estado de sincronización entre orden y alquiler.
   * Útil para debugging y UI.
   *
   * @param {number} alquilerId - ID del alquiler
   * @returns {Promise<Object>} Estado de sincronización
   */
  static async obtenerEstadoSincronizacion(alquilerId) {
    const [resultado] = await pool.query(`
      SELECT
        a.id AS alquiler_id,
        a.estado AS alquiler_estado,
        a.fecha_salida,
        a.fecha_retorno_real,
        GROUP_CONCAT(
          CONCAT(ot.tipo, ':', ot.estado)
          ORDER BY ot.tipo
          SEPARATOR ', '
        ) AS ordenes_estados,
        (SELECT COUNT(*) FROM alquiler_elementos WHERE alquiler_id = a.id) AS total_elementos,
        (SELECT COUNT(*) FROM alquiler_elementos WHERE alquiler_id = a.id AND estado_retorno IS NOT NULL) AS elementos_retornados
      FROM alquileres a
      LEFT JOIN ordenes_trabajo ot ON ot.alquiler_id = a.id
      WHERE a.id = ?
      GROUP BY a.id
    `, [alquilerId]);

    if (!resultado.length) {
      return null;
    }

    const datos = resultado[0];

    // Parsear los estados de órdenes
    const ordenesEstados = {};
    if (datos.ordenes_estados) {
      datos.ordenes_estados.split(', ').forEach(par => {
        const [tipo, estado] = par.split(':');
        ordenesEstados[tipo] = estado;
      });
    }

    return {
      alquiler_id: datos.alquiler_id,
      alquiler_estado: datos.alquiler_estado,
      fecha_salida: datos.fecha_salida,
      fecha_retorno_real: datos.fecha_retorno_real,
      ordenes: ordenesEstados,
      elementos: {
        total: datos.total_elementos,
        retornados: datos.elementos_retornados,
        pendientes: datos.total_elementos - datos.elementos_retornados
      },
      sincronizado: this._verificarSincronizacion(datos.alquiler_estado, ordenesEstados)
    };
  }

  /**
   * Verifica si el estado del alquiler es consistente con las órdenes.
   * @private
   */
  static _verificarSincronizacion(alquilerEstado, ordenesEstados) {
    const montaje = ordenesEstados['montaje'];
    const desmontaje = ordenesEstados['desmontaje'];

    // Alquiler programado: montaje debe estar pendiente/confirmado/en_preparacion
    if (alquilerEstado === ESTADOS_ALQUILER.PROGRAMADO) {
      return ['pendiente', 'confirmado', 'en_preparacion'].includes(montaje);
    }

    // Alquiler activo: montaje debe estar >= en_ruta
    if (alquilerEstado === ESTADOS_ALQUILER.ACTIVO) {
      return ['en_ruta', 'en_sitio', 'en_proceso', 'completado'].includes(montaje);
    }

    // Alquiler finalizado: desmontaje debe estar completado
    if (alquilerEstado === ESTADOS_ALQUILER.FINALIZADO) {
      return desmontaje === 'completado';
    }

    return true;
  }
}

module.exports = SincronizacionAlquilerService;
