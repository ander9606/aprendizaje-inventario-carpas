// ============================================
// MODEL: NovedadModel
// Novedades en campo reportadas por operarios
// ============================================

const { pool } = require('../../../config/database');

const NovedadModel = {
    /**
     * Crear novedad + alerta automáticamente
     */
    async crear(tenantId, datos) {
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
                 LEFT JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
                 LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
                 LEFT JOIN clientes c ON cot.cliente_id = c.id AND c.tenant_id = ?
                 WHERE ot.tenant_id = ? AND ot.id = ?`,
                [tenantId, tenantId, tenantId, tenantId, orden_id]
            );

            const ordenInfo = ordenRows[0] || {};

            // Crear alerta tipo novedad
            const tituloAlerta = NovedadModel._generarTituloAlerta(tipo_novedad, ordenInfo);
            const [alertaResult] = await connection.query(
                `INSERT INTO alertas_operaciones (tenant_id, orden_id, tipo, severidad, titulo, mensaje, estado)
                 VALUES (?, ?, 'novedad', ?, ?, ?, 'pendiente')`,
                [
                    tenantId,
                    orden_id,
                    tipo_novedad === 'dano_elemento' ? 'alta' : 'media',
                    tituloAlerta,
                    descripcion
                ]
            );

            // Crear novedad
            const [novedadResult] = await connection.query(
                `INSERT INTO orden_trabajo_novedades
                 (tenant_id, orden_id, alerta_id, tipo_novedad, descripcion, producto_id, elemento_orden_id, cantidad_afectada, imagen_url, reportada_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tenantId,
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
    async obtenerPorOrden(tenantId, ordenId) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre,
                    ao.estado as alerta_estado
             FROM orden_trabajo_novedades n
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id AND e_rep.tenant_id = ?
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id AND e_res.tenant_id = ?
             LEFT JOIN alertas_operaciones ao ON n.alerta_id = ao.id AND ao.tenant_id = ?
             WHERE n.tenant_id = ? AND n.orden_id = ?
             ORDER BY n.created_at DESC`,
            [tenantId, tenantId, tenantId, tenantId, ordenId]
        );
        return rows;
    },

    /**
     * Obtener novedades de todas las órdenes de un alquiler
     */
    async obtenerPorAlquiler(tenantId, alquilerId) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    ot.tipo as orden_tipo,
                    ot.id as orden_id,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre
             FROM orden_trabajo_novedades n
             INNER JOIN ordenes_trabajo ot ON n.orden_id = ot.id AND ot.tenant_id = ?
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id AND e_rep.tenant_id = ?
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id AND e_res.tenant_id = ?
             WHERE n.tenant_id = ? AND ot.alquiler_id = ?
             ORDER BY n.created_at DESC`,
            [tenantId, tenantId, tenantId, tenantId, alquilerId]
        );
        return rows;
    },

    /**
     * Obtener novedades consolidadas de un evento
     * JOIN: evento → cotizaciones → alquileres → órdenes → novedades
     */
    async obtenerPorEvento(tenantId, eventoId) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    ot.tipo as orden_tipo,
                    ot.id as orden_id,
                    a.id as alquiler_id,
                    cot.evento_nombre,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre
             FROM orden_trabajo_novedades n
             INNER JOIN ordenes_trabajo ot ON n.orden_id = ot.id AND ot.tenant_id = ?
             INNER JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
             INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id AND e_rep.tenant_id = ?
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id AND e_res.tenant_id = ?
             WHERE n.tenant_id = ? AND cot.evento_id = ?
             ORDER BY n.created_at DESC`,
            [tenantId, tenantId, tenantId, tenantId, tenantId, tenantId, eventoId]
        );
        return rows;
    },

    /**
     * Resolver una novedad
     */
    async resolver(tenantId, id, { resolucion, resuelta_por }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Actualizar novedad
            await connection.query(
                `UPDATE orden_trabajo_novedades
                 SET estado = 'resuelta', resolucion = ?, resuelta_por = ?, fecha_resolucion = NOW()
                 WHERE tenant_id = ? AND id = ?`,
                [resolucion, resuelta_por, tenantId, id]
            );

            // Resolver alerta asociada
            const [novedad] = await connection.query(
                'SELECT alerta_id FROM orden_trabajo_novedades WHERE tenant_id = ? AND id = ?',
                [tenantId, id]
            );

            if (novedad[0]?.alerta_id) {
                await connection.query(
                    `UPDATE alertas_operaciones
                     SET estado = 'resuelta', resuelta_por = ?, fecha_resolucion = NOW(), notas_resolucion = ?
                     WHERE tenant_id = ? AND id = ?`,
                    [resuelta_por, resolucion, tenantId, novedad[0].alerta_id]
                );
            }

            await connection.commit();

            const [updated] = await pool.query(
                'SELECT * FROM orden_trabajo_novedades WHERE tenant_id = ? AND id = ?', [tenantId, id]
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
    async obtenerPendientes(tenantId) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    ot.tipo as orden_tipo,
                    cot.evento_nombre,
                    c.nombre as cliente_nombre,
                    e_rep.nombre as reportada_por_nombre
             FROM orden_trabajo_novedades n
             INNER JOIN ordenes_trabajo ot ON n.orden_id = ot.id AND ot.tenant_id = ?
             LEFT JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
             LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
             LEFT JOIN clientes c ON cot.cliente_id = c.id AND c.tenant_id = ?
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id AND e_rep.tenant_id = ?
             WHERE n.tenant_id = ? AND n.estado IN ('pendiente', 'en_revision')
             ORDER BY
                CASE n.tipo_novedad
                    WHEN 'dano_elemento' THEN 1
                    WHEN 'solicitud_adicional' THEN 2
                    WHEN 'cancelacion_producto' THEN 3
                    ELSE 4
                END,
                n.created_at ASC`,
            [tenantId, tenantId, tenantId, tenantId, tenantId, tenantId]
        );
        return rows;
    },

    /**
     * Obtener por ID
     */
    async obtenerPorId(tenantId, id) {
        const [rows] = await pool.query(
            `SELECT n.*,
                    e_rep.nombre as reportada_por_nombre,
                    e_res.nombre as resuelta_por_nombre
             FROM orden_trabajo_novedades n
             LEFT JOIN empleados e_rep ON n.reportada_por = e_rep.id AND e_rep.tenant_id = ?
             LEFT JOIN empleados e_res ON n.resuelta_por = e_res.id AND e_res.tenant_id = ?
             WHERE n.tenant_id = ? AND n.id = ?`,
            [tenantId, tenantId, tenantId, id]
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
