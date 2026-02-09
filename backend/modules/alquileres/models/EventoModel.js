// ============================================
// MODELO: EventoModel
// Eventos para cotizaciones
// ============================================

const { pool } = require('../../../config/database');

class EventoModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos() {
    const query = `
      SELECT
        e.id,
        e.cliente_id,
        e.nombre,
        e.descripcion,
        DATE_FORMAT(e.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d') AS fecha_fin,
        e.direccion,
        e.ciudad_id,
        e.notas,
        e.estado,
        e.created_at,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        ci.nombre AS ciudad_nombre,
        (SELECT COUNT(*) FROM cotizaciones WHERE evento_id = e.id) AS total_cotizaciones,
        (SELECT COALESCE(SUM(total), 0) FROM cotizaciones WHERE evento_id = e.id) AS total_valor,
        (SELECT COUNT(*) FROM cotizaciones cot
          INNER JOIN alquileres a ON a.cotizacion_id = cot.id
          WHERE cot.evento_id = e.id) AS total_alquileres,
        (SELECT COUNT(*) FROM cotizaciones cot
          INNER JOIN alquileres a ON a.cotizacion_id = cot.id
          WHERE cot.evento_id = e.id AND a.estado = 'finalizado') AS alquileres_finalizados,
        (SELECT COUNT(*) FROM cotizaciones cot
          INNER JOIN alquileres a ON a.cotizacion_id = cot.id
          WHERE cot.evento_id = e.id AND a.estado = 'activo') AS alquileres_activos
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      ORDER BY e.fecha_inicio DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    // Obtener evento con info básica
    const query = `
      SELECT
        e.id,
        e.cliente_id,
        e.nombre,
        e.descripcion,
        DATE_FORMAT(e.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d') AS fecha_fin,
        e.direccion,
        e.ciudad_id,
        e.notas,
        e.estado,
        e.created_at,
        e.updated_at,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email,
        ci.nombre AS ciudad_nombre
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      WHERE e.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    const evento = rows[0];

    if (!evento) return null;

    // Obtener cotizaciones del evento
    const cotizacionesQuery = `
      SELECT
        cot.id,
        cot.subtotal,
        cot.total,
        cot.descuento,
        cot.estado,
        DATE_FORMAT(cot.fecha_evento, '%Y-%m-%d') AS fecha_evento,
        DATE_FORMAT(cot.fecha_montaje, '%Y-%m-%d') AS fecha_montaje,
        DATE_FORMAT(cot.fecha_desmontaje, '%Y-%m-%d') AS fecha_desmontaje,
        cot.created_at,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = cot.id) AS total_productos,
        (SELECT COUNT(*) FROM alquileres WHERE cotizacion_id = cot.id) AS tiene_alquiler
      FROM cotizaciones cot
      WHERE cot.evento_id = ?
      ORDER BY cot.created_at DESC
    `;
    const [cotizaciones] = await pool.query(cotizacionesQuery, [id]);

    // Calcular resumen
    const resumen = {
      total_cotizaciones: cotizaciones.length,
      total_valor: cotizaciones.reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0),
      cotizaciones_pendientes: cotizaciones.filter(c => c.estado === 'pendiente').length,
      cotizaciones_aprobadas: cotizaciones.filter(c => c.estado === 'aprobada').length
    };

    return {
      ...evento,
      cotizaciones,
      resumen
    };
  }

  // ============================================
  // OBTENER POR CLIENTE
  // ============================================
  static async obtenerPorCliente(clienteId) {
    const query = `
      SELECT
        e.id,
        e.nombre,
        DATE_FORMAT(e.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d') AS fecha_fin,
        e.ciudad_id,
        ci.nombre AS ciudad_nombre,
        e.estado,
        e.created_at,
        (SELECT COUNT(*) FROM cotizaciones WHERE evento_id = e.id) AS total_cotizaciones
      FROM eventos e
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      WHERE e.cliente_id = ?
      ORDER BY e.fecha_inicio DESC
    `;
    const [rows] = await pool.query(query, [clienteId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ESTADO
  // ============================================
  static async obtenerPorEstado(estado) {
    const query = `
      SELECT
        e.id,
        e.cliente_id,
        e.nombre,
        DATE_FORMAT(e.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d') AS fecha_fin,
        e.ciudad_id,
        ci.nombre AS ciudad_nombre,
        e.estado,
        c.nombre AS cliente_nombre
      FROM eventos e
      INNER JOIN clientes c ON e.cliente_id = c.id
      LEFT JOIN ciudades ci ON e.ciudad_id = ci.id
      WHERE e.estado = ?
      ORDER BY e.fecha_inicio ASC
    `;
    const [rows] = await pool.query(query, [estado]);
    return rows;
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ cliente_id, nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas }) {
    const query = `
      INSERT INTO eventos
        (cliente_id, nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      cliente_id,
      nombre,
      descripcion || null,
      fecha_inicio,
      fecha_fin || fecha_inicio,
      direccion || null,
      ciudad_id || null,
      notas || null
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { nombre, descripcion, fecha_inicio, fecha_fin, direccion, ciudad_id, notas, estado }) {
    const query = `
      UPDATE eventos
      SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?,
          direccion = ?, ciudad_id = ?, notas = ?, estado = COALESCE(?, estado)
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      descripcion || null,
      fecha_inicio,
      fecha_fin || fecha_inicio,
      direccion || null,
      ciudad_id || null,
      notas || null,
      estado,
      id
    ]);
    return result;
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================
  static async cambiarEstado(id, estado) {
    const query = `UPDATE eventos SET estado = ? WHERE id = ?`;
    const [result] = await pool.query(query, [estado, id]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM eventos WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // OBTENER COTIZACIONES DEL EVENTO
  // ============================================
  static async obtenerCotizaciones(eventoId) {
    const query = `
      SELECT
        c.id,
        c.subtotal,
        c.total,
        c.estado,
        c.created_at,
        (SELECT COUNT(*) FROM cotizacion_productos WHERE cotizacion_id = c.id) AS total_productos
      FROM cotizaciones c
      WHERE c.evento_id = ?
      ORDER BY c.created_at DESC
    `;
    const [rows] = await pool.query(query, [eventoId]);
    return rows;
  }

  // ============================================
  // VERIFICAR SI TIENE COTIZACIONES
  // ============================================
  static async tieneCotizaciones(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM cotizaciones WHERE evento_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // VERIFICAR SI TODOS LOS ALQUILERES ESTÁN FINALIZADOS
  // Retorna true si el evento tiene al menos una cotización aprobada
  // con alquiler y TODOS esos alquileres están finalizados o cancelados
  // ============================================
  static async todosAlquileresFinalizados(eventoId) {
    const query = `
      SELECT
        COUNT(a.id) AS total_alquileres,
        SUM(CASE WHEN a.estado IN ('finalizado', 'cancelado') THEN 1 ELSE 0 END) AS alquileres_terminados
      FROM cotizaciones c
      INNER JOIN alquileres a ON a.cotizacion_id = c.id
      WHERE c.evento_id = ?
    `;
    const [rows] = await pool.query(query, [eventoId]);
    const { total_alquileres, alquileres_terminados } = rows[0];

    // Solo auto-finalizar si hay al menos un alquiler y todos terminaron
    return total_alquileres > 0 && total_alquileres === alquileres_terminados;
  }

  // ============================================
  // AUTO-FINALIZAR EVENTO SI TODOS LOS ALQUILERES TERMINARON
  // Llamado después de ejecutarRetorno en SincronizacionAlquilerService
  // ============================================
  static async autoFinalizarSiCompleto(eventoId) {
    if (!eventoId) return { actualizado: false, motivo: 'Sin evento_id' };

    const evento = await this.obtenerPorId(eventoId);
    if (!evento) return { actualizado: false, motivo: 'Evento no encontrado' };

    // Solo auto-finalizar si el evento está activo
    if (evento.estado !== 'activo') {
      return { actualizado: false, motivo: `Evento en estado ${evento.estado}` };
    }

    const todosFinalizados = await this.todosAlquileresFinalizados(eventoId);
    if (todosFinalizados) {
      await this.cambiarEstado(eventoId, 'completado');
      return { actualizado: true, estado_nuevo: 'completado' };
    }

    return { actualizado: false, motivo: 'Aún hay alquileres pendientes' };
  }

  // ============================================
  // OBTENER EVENTO_ID DESDE UN ALQUILER_ID
  // Busca: alquiler -> cotización -> evento
  // ============================================
  static async obtenerEventoIdDesdeAlquiler(alquilerId) {
    const query = `
      SELECT c.evento_id
      FROM alquileres a
      INNER JOIN cotizaciones c ON a.cotizacion_id = c.id
      WHERE a.id = ?
        AND c.evento_id IS NOT NULL
    `;
    const [rows] = await pool.query(query, [alquilerId]);
    return rows[0]?.evento_id || null;
  }

  // ============================================
  // VERIFICAR SI SE PUEDEN AGREGAR COTIZACIONES
  // No se permite si el evento está completado/cancelado
  // o si la fecha_fin ya pasó
  // ============================================
  static async puedeAgregarCotizaciones(eventoId) {
    const query = `
      SELECT
        e.estado,
        DATE_FORMAT(e.fecha_fin, '%Y-%m-%d') AS fecha_fin
      FROM eventos e
      WHERE e.id = ?
    `;
    const [rows] = await pool.query(query, [eventoId]);
    if (!rows.length) return { permitido: false, motivo: 'Evento no encontrado' };

    const evento = rows[0];

    if (evento.estado === 'completado') {
      return { permitido: false, motivo: 'El evento ya está completado. No se pueden agregar más cotizaciones.' };
    }
    if (evento.estado === 'cancelado') {
      return { permitido: false, motivo: 'El evento está cancelado. No se pueden agregar cotizaciones.' };
    }

    // Verificar si la fecha del evento ya pasó
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaFin = new Date(evento.fecha_fin + 'T23:59:59');
    if (fechaFin < hoy) {
      return { permitido: false, motivo: 'La fecha del evento ya pasó. No se pueden agregar más cotizaciones.' };
    }

    return { permitido: true };
  }
}

module.exports = EventoModel;
