// ============================================
// SERVICIO: SincronizacionAlquilerService
// Sincroniza estados entre Operaciones y Alquileres
// ============================================

const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');
const logger = require('../../../utils/logger');

class SincronizacionAlquilerService {

  // ============================================
  // OBTENER ELEMENTOS DISPONIBLES PARA ORDEN
  // Basado en los productos de la cotización
  // ============================================
  static async obtenerElementosDisponibles(ordenId) {
    // Obtener la orden con su alquiler y cotización
    const [orden] = await pool.query(`
      SELECT
        ot.id AS orden_id,
        ot.alquiler_id,
        ot.tipo,
        a.cotizacion_id,
        cot.evento_nombre
      FROM ordenes_trabajo ot
      INNER JOIN alquileres a ON ot.alquiler_id = a.id
      INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
      WHERE ot.id = ?
    `, [ordenId]);

    if (!orden.length) {
      throw new AppError('Orden no encontrada', 404);
    }

    const { cotizacion_id } = orden[0];

    // Obtener productos de la cotización con sus componentes
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
    `, [cotizacion_id]);

    // Para cada producto, obtener sus componentes y elementos disponibles
    const resultado = [];

    for (const producto of productos) {
      // Obtener componentes del producto
      const [componentes] = await pool.query(`
        SELECT
          ecc.id AS componente_id,
          ecc.elemento_id,
          ecc.cantidad_por_unidad,
          (ecc.cantidad_por_unidad * ?) AS cantidad_total_requerida,
          e.nombre AS elemento_nombre,
          e.requiere_series
        FROM elemento_compuesto_componentes ecc
        INNER JOIN elementos e ON ecc.elemento_id = e.id
        WHERE ecc.compuesto_id = ?
      `, [producto.cantidad_requerida, producto.compuesto_id]);

      const componentesConDisponibilidad = [];

      for (const componente of componentes) {
        let disponibles = [];

        if (componente.requiere_series) {
          // Obtener series disponibles
          const [series] = await pool.query(`
            SELECT
              s.id AS serie_id,
              s.numero_serie,
              s.estado,
              u.nombre AS ubicacion
            FROM series s
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
            WHERE s.id_elemento = ?
              AND s.estado IN ('nuevo', 'bueno')
            ORDER BY s.numero_serie
          `, [componente.elemento_id]);

          disponibles = series.map(s => ({
            tipo: 'serie',
            id: s.serie_id,
            identificador: s.numero_serie,
            estado: s.estado,
            ubicacion: s.ubicacion,
            cantidad: 1
          }));
        } else {
          // Obtener lotes disponibles
          const [lotes] = await pool.query(`
            SELECT
              l.id AS lote_id,
              l.lote_numero,
              l.cantidad_disponible,
              u.nombre AS ubicacion
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
            cantidad: l.cantidad_disponible
          }));
        }

        componentesConDisponibilidad.push({
          ...componente,
          disponibles,
          total_disponible: disponibles.reduce((sum, d) => sum + d.cantidad, 0)
        });
      }

      resultado.push({
        ...producto,
        componentes: componentesConDisponibilidad
      });
    }

    return {
      orden: orden[0],
      productos: resultado
    };
  }

  // ============================================
  // ASIGNAR ELEMENTOS A ORDEN
  // Guarda en orden_trabajo_elementos
  // ============================================
  static async asignarElementosAOrden(ordenId, elementos) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que la orden existe y está en estado válido
      const [orden] = await connection.query(`
        SELECT id, alquiler_id, tipo, estado
        FROM ordenes_trabajo
        WHERE id = ?
      `, [ordenId]);

      if (!orden.length) {
        throw new AppError('Orden no encontrada', 404);
      }

      if (!['pendiente', 'confirmado', 'en_preparacion'].includes(orden[0].estado)) {
        throw new AppError('La orden debe estar en estado pendiente, confirmado o en_preparacion para asignar elementos', 400);
      }

      // Limpiar asignaciones previas (por si se está reasignando)
      await connection.query(
        'DELETE FROM orden_trabajo_elementos WHERE orden_id = ?',
        [ordenId]
      );

      // Insertar nuevos elementos
      for (const elem of elementos) {
        // Validar disponibilidad
        if (elem.serie_id) {
          const [serie] = await connection.query(
            'SELECT id, estado FROM series WHERE id = ? AND estado IN ("nuevo", "bueno")',
            [elem.serie_id]
          );
          if (!serie.length) {
            throw new AppError(`Serie ${elem.serie_id} no disponible`, 400);
          }
        }

        if (elem.lote_id) {
          const [lote] = await connection.query(
            'SELECT id, cantidad_disponible FROM lotes WHERE id = ? AND cantidad_disponible >= ?',
            [elem.lote_id, elem.cantidad || 1]
          );
          if (!lote.length) {
            throw new AppError(`Lote ${elem.lote_id} no tiene suficiente cantidad disponible`, 400);
          }
        }

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
      }

      // Actualizar estado de la orden a "en_preparacion"
      await connection.query(`
        UPDATE ordenes_trabajo
        SET estado = 'en_preparacion'
        WHERE id = ?
      `, [ordenId]);

      await connection.commit();

      logger.info(`Elementos asignados a orden ${ordenId}: ${elementos.length} elementos`);

      return {
        success: true,
        mensaje: `${elementos.length} elementos asignados correctamente`,
        orden_id: ordenId
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // EJECUTAR SALIDA
  // Cuando el montaje inicia (orden "en_ruta")
  // ============================================
  static async ejecutarSalida(ordenId, datos = {}) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar orden
      const [orden] = await connection.query(`
        SELECT ot.*, a.id AS alquiler_id, a.estado AS alquiler_estado
        FROM ordenes_trabajo ot
        INNER JOIN alquileres a ON ot.alquiler_id = a.id
        WHERE ot.id = ? AND ot.tipo = 'montaje'
      `, [ordenId]);

      if (!orden.length) {
        throw new AppError('Orden de montaje no encontrada', 404);
      }

      if (orden[0].estado !== 'en_preparacion') {
        throw new AppError('La orden debe estar en preparación para ejecutar salida', 400);
      }

      const alquilerId = orden[0].alquiler_id;

      // Obtener elementos de la orden
      const [elementosOrden] = await connection.query(`
        SELECT * FROM orden_trabajo_elementos WHERE orden_id = ?
      `, [ordenId]);

      if (!elementosOrden.length) {
        throw new AppError('No hay elementos asignados a esta orden', 400);
      }

      // Copiar elementos a alquiler_elementos
      for (const elem of elementosOrden) {
        // Obtener ubicación original
        let ubicacionOriginalId = null;
        if (elem.serie_id) {
          const [serie] = await connection.query(
            'SELECT ubicacion_id FROM series WHERE id = ?',
            [elem.serie_id]
          );
          ubicacionOriginalId = serie[0]?.ubicacion_id;
        } else if (elem.lote_id) {
          const [lote] = await connection.query(
            'SELECT ubicacion_id FROM lotes WHERE id = ?',
            [elem.lote_id]
          );
          ubicacionOriginalId = lote[0]?.ubicacion_id;
        }

        // Insertar en alquiler_elementos
        await connection.query(`
          INSERT INTO alquiler_elementos
          (alquiler_id, elemento_id, serie_id, lote_id, cantidad_lote,
           estado_salida, ubicacion_original_id, fecha_asignacion)
          VALUES (?, ?, ?, ?, ?, 'bueno', ?, NOW())
        `, [
          alquilerId,
          elem.elemento_id,
          elem.serie_id,
          elem.lote_id,
          elem.cantidad,
          ubicacionOriginalId
        ]);

        // Actualizar estado de series a "alquilado"
        if (elem.serie_id) {
          await connection.query(
            'UPDATE series SET estado = "alquilado", ubicacion_id = NULL WHERE id = ?',
            [elem.serie_id]
          );
        }

        // Reducir cantidad disponible en lotes
        if (elem.lote_id) {
          await connection.query(
            'UPDATE lotes SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?',
            [elem.cantidad, elem.lote_id]
          );
        }

        // Actualizar estado en orden_trabajo_elementos
        await connection.query(
          'UPDATE orden_trabajo_elementos SET estado = "cargado", verificado_salida = TRUE WHERE id = ?',
          [elem.id]
        );
      }

      // Actualizar estado de la orden a "en_ruta"
      await connection.query(`
        UPDATE ordenes_trabajo
        SET estado = 'en_ruta'
        WHERE id = ?
      `, [ordenId]);

      // Actualizar estado del alquiler a "activo"
      await connection.query(`
        UPDATE alquileres
        SET estado = 'activo', fecha_salida = NOW()
        WHERE id = ?
      `, [alquilerId]);

      await connection.commit();

      logger.info(`Salida ejecutada - Orden: ${ordenId}, Alquiler: ${alquilerId}`);

      return {
        success: true,
        mensaje: 'Salida ejecutada correctamente',
        orden_id: ordenId,
        alquiler_id: alquilerId,
        elementos_despachados: elementosOrden.length
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // EJECUTAR RETORNO
  // Cuando el desmontaje termina
  // ============================================
  static async ejecutarRetorno(ordenId, retornos) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar orden de desmontaje
      const [orden] = await connection.query(`
        SELECT ot.*, a.id AS alquiler_id, a.deposito_cobrado
        FROM ordenes_trabajo ot
        INNER JOIN alquileres a ON ot.alquiler_id = a.id
        WHERE ot.id = ? AND ot.tipo = 'desmontaje'
      `, [ordenId]);

      if (!orden.length) {
        throw new AppError('Orden de desmontaje no encontrada', 404);
      }

      if (!['en_proceso', 'en_sitio'].includes(orden[0].estado)) {
        throw new AppError('La orden debe estar en proceso para registrar retorno', 400);
      }

      const alquilerId = orden[0].alquiler_id;
      let totalDanos = 0;

      // Procesar cada elemento retornado
      for (const retorno of retornos) {
        const { alquiler_elemento_id, estado_retorno, costo_dano, notas } = retorno;

        // Validar estado
        if (!['bueno', 'dañado', 'perdido'].includes(estado_retorno)) {
          throw new AppError(`Estado de retorno inválido: ${estado_retorno}`, 400);
        }

        // Obtener elemento del alquiler
        const [elemento] = await connection.query(
          'SELECT * FROM alquiler_elementos WHERE id = ? AND alquiler_id = ?',
          [alquiler_elemento_id, alquilerId]
        );

        if (!elemento.length) {
          throw new AppError(`Elemento ${alquiler_elemento_id} no encontrado en este alquiler`, 404);
        }

        const elem = elemento[0];

        // Actualizar alquiler_elementos
        await connection.query(`
          UPDATE alquiler_elementos
          SET estado_retorno = ?,
              costo_dano = ?,
              notas_retorno = ?,
              fecha_retorno = NOW()
          WHERE id = ?
        `, [estado_retorno, costo_dano || 0, notas || null, alquiler_elemento_id]);

        // Sumar daños
        if (costo_dano) {
          totalDanos += parseFloat(costo_dano);
        }

        // Actualizar estado de series/lotes según retorno
        if (elem.serie_id) {
          let nuevoEstado;
          let nuevaUbicacion = elem.ubicacion_original_id;

          switch (estado_retorno) {
            case 'bueno':
              nuevoEstado = 'bueno';
              break;
            case 'dañado':
              nuevoEstado = 'mantenimiento';
              nuevaUbicacion = null; // Va a taller
              break;
            case 'perdido':
              nuevoEstado = 'dañado'; // O podría ser eliminado
              nuevaUbicacion = null;
              break;
          }

          await connection.query(
            'UPDATE series SET estado = ?, ubicacion_id = ? WHERE id = ?',
            [nuevoEstado, nuevaUbicacion, elem.serie_id]
          );
        }

        // Restaurar cantidad en lotes (si no está perdido)
        if (elem.lote_id && estado_retorno !== 'perdido') {
          const cantidadRetornar = estado_retorno === 'bueno'
            ? elem.cantidad_lote
            : 0; // Si está dañado, no vuelve a disponible

          if (cantidadRetornar > 0) {
            await connection.query(
              'UPDATE lotes SET cantidad_disponible = cantidad_disponible + ? WHERE id = ?',
              [cantidadRetornar, elem.lote_id]
            );
          }
        }
      }

      // Actualizar estado de la orden a "completado"
      await connection.query(`
        UPDATE ordenes_trabajo
        SET estado = 'completado'
        WHERE id = ?
      `, [ordenId]);

      // Actualizar alquiler
      await connection.query(`
        UPDATE alquileres
        SET estado = 'finalizado',
            fecha_retorno_real = NOW(),
            costo_danos = ?
        WHERE id = ?
      `, [totalDanos, alquilerId]);

      await connection.commit();

      logger.info(`Retorno ejecutado - Orden: ${ordenId}, Alquiler: ${alquilerId}, Daños: ${totalDanos}`);

      return {
        success: true,
        mensaje: 'Retorno registrado correctamente',
        orden_id: ordenId,
        alquiler_id: alquilerId,
        total_danos: totalDanos,
        deposito: orden[0].deposito_cobrado,
        saldo: orden[0].deposito_cobrado - totalDanos
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = SincronizacionAlquilerService;
