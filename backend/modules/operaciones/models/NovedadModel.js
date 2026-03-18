// ============================================
// MODEL: NovedadModel
// Novedades en campo reportadas por operarios
// ============================================

const { pool } = require('../../../config/database');

const NovedadModel = {
    /**
     * Crear novedad + alerta automáticamente
     */
    async crear(datos) {
        const {
            orden_id, tipo_novedad, descripcion,
            producto_id, elemento_orden_id, cantidad_afectada,
            imagen_url, reportada_por
        } = datos;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener info de la orden para la alerta
            const [ordenRows] = await connection.query(
                `SELECT ot.tipo, ot.alquiler_id, cot.evento_nombre, c.nombre as cliente_nombre
                 FROM ordenes_trabajo ot
                 LEFT JOIN alquileres a ON ot.alquiler_id = a.id
                 LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id
                 LEFT JOIN clientes c ON cot.cliente_id = c.id
                 WHERE ot.id = ?`,
                [orden_id]
            );

            const ordenInfo = ordenRows[0] || {};

            // Crear alerta tipo novedad
            const tituloAlerta = NovedadModel._generarTituloAlerta(tipo_novedad, ordenInfo);
            const [alertaResult] = await connection.query(
                `INSERT INTO alertas_operaciones (orden_id, tipo, severidad, titulo, mensaje, estado)
                 VALUES (?, 'novedad', ?, ?, ?, 'pendiente')`,
                [
                    orden_id,
                    tipo_novedad === 'dano_elemento' ? 'alta' : 'media',
                    tituloAlerta,
                    descripcion
                ]
            );

            // Crear novedad
            const [novedadResult] = await connection.query(
                `INSERT INTO orden_trabajo_novedades
                 (orden_id, alerta_id, tipo_novedad, descripcion, producto_id, elemento_orden_id, cantidad_afectada, imagen_url, reportada_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orden_id, alertaResult.insertId, tipo_novedad, descripcion,
                    producto_id || null, elemento_orden_id || null,
                    cantidad_afectada || 1, imagen_url || null,
                    reportada_por || null
                ]
            );

            await connection.commit();

            return {
                id: novedadResult.insertId,
                alerta_id: alertaResult.insertId,
                ...datos
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Obtener novedades de una orden
     */
    async obtenerPorOrden(ordenId) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre,
                    ao.estado as alerta_estado
             FROM orden_trabajo_novedades n
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id
             LEFT JOIN alertas_operaciones ao ON n.alerta_id = ao.id
             WHERE n.orden_id = ?
             ORDER BY n.created_at DESC`,
            [ordenId]
        );
        return rows;
    },

    /**
     * Obtener novedades de todas las órdenes de un alquiler
     */
    async obtenerPorAlquiler(alquilerId) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    ot.tipo as orden_tipo,
                    ot.id as orden_id,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre
             FROM orden_trabajo_novedades n
             INNER JOIN ordenes_trabajo ot ON n.orden_id = ot.id
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id
             WHERE ot.alquiler_id = ?
             ORDER BY n.created_at DESC`,
            [alquilerId]
        );
        return rows;
    },

    /**
     * Obtener novedades consolidadas de un evento
     * JOIN: evento → cotizaciones → alquileres → órdenes → novedades
     */
    async obtenerPorEvento(eventoId) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    ot.tipo as orden_tipo,
                    ot.id as orden_id,
                    a.id as alquiler_id,
                    cot.evento_nombre,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre
             FROM orden_trabajo_novedades n
             INNER JOIN ordenes_trabajo ot ON n.orden_id = ot.id
             INNER JOIN alquileres a ON ot.alquiler_id = a.id
             INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id
             WHERE cot.evento_id = ?
             ORDER BY n.created_at DESC`,
            [eventoId]
        );
        return rows;
    },

    /**
     * Resolver una novedad
     */
    async resolver(id, { resolucion, resuelta_por }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Actualizar novedad
            await connection.query(
                `UPDATE orden_trabajo_novedades
                 SET estado = 'resuelta', resolucion = ?, resuelta_por = ?, fecha_resolucion = NOW()
                 WHERE id = ?`,
                [resolucion, resuelta_por, id]
            );

            // Resolver alerta asociada
            const [novedad] = await connection.query(
                'SELECT alerta_id FROM orden_trabajo_novedades WHERE id = ?',
                [id]
            );

            if (novedad[0]?.alerta_id) {
                await connection.query(
                    `UPDATE alertas_operaciones
                     SET estado = 'resuelta', resuelta_por = ?, fecha_resolucion = NOW(), notas_resolucion = ?
                     WHERE id = ?`,
                    [resuelta_por, resolucion, novedad[0].alerta_id]
                );
            }

            await connection.commit();

            const [updated] = await pool.query(
                'SELECT * FROM orden_trabajo_novedades WHERE id = ?', [id]
            );
            return updated[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Obtener novedades pendientes (para dashboard admin)
     */
    async obtenerPendientes() {
        const [rows] = await pool.query(
            `SELECT n.*,
                    ot.tipo as orden_tipo,
                    cot.evento_nombre,
                    c.nombre as cliente_nombre,
                    e_rep.nombre as reportada_por_nombre
             FROM orden_trabajo_novedades n
             INNER JOIN ordenes_trabajo ot ON n.orden_id = ot.id
             LEFT JOIN alquileres a ON ot.alquiler_id = a.id
             LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id
             LEFT JOIN clientes c ON cot.cliente_id = c.id
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id
             WHERE n.estado IN ('pendiente', 'en_revision')
             ORDER BY
                CASE n.tipo_novedad
                    WHEN 'dano_elemento' THEN 1
                    WHEN 'solicitud_adicional' THEN 2
                    WHEN 'cancelacion_producto' THEN 3
                    ELSE 4
                END,
                n.created_at ASC`
        );
        return rows;
    },

    /**
     * Obtener por ID
     */
    async obtenerPorId(id) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre
             FROM orden_trabajo_novedades n
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id
             WHERE n.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Generar título descriptivo para la alerta
     */
    _generarTituloAlerta(tipo_novedad, ordenInfo) {
        const prefijo = ordenInfo.cliente_nombre
            ? `${ordenInfo.cliente_nombre} - `
            : '';

        const tipoLabels = {
            cancelacion_producto: 'Cancelación de producto',
            solicitud_adicional: 'Solicitud adicional',
            cambio_ubicacion: 'Cambio de ubicación',
            dano_elemento: 'Daño en elemento',
            otro: 'Novedad en campo'
        };

        return `${prefijo}${tipoLabels[tipo_novedad] || 'Novedad'}`;
    }
};

module.exports = NovedadModel;
