const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class AlertaModel {
    /**
     * Obtener todas las alertas con filtros
     * @param {Object} filtros
     * @returns {Promise<Object>}
     */
    static async obtenerTodas(filtros = {}) {
        const {
            page = 1,
            limit = 20,
            tipo = null,
            severidad = null,
            estado = null,
            orden_id = null,
            ordenar = 'created_at',
            direccion = 'DESC'
        } = filtros;

        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (tipo) {
            whereClause += ` AND ao.tipo = ?`;
            params.push(tipo);
        }

        if (severidad) {
            whereClause += ` AND ao.severidad = ?`;
            params.push(severidad);
        }

        if (estado) {
            whereClause += ` AND ao.estado = ?`;
            params.push(estado);
        }

        if (orden_id) {
            whereClause += ` AND ao.orden_id = ?`;
            params.push(orden_id);
        }

        const camposValidos = ['created_at', 'severidad', 'tipo', 'estado'];
        const ordenarCampo = camposValidos.includes(ordenar) ? ordenar : 'created_at';
        const ordenarDireccion = direccion.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const [rows] = await pool.query(`
            SELECT
                ao.id,
                ao.orden_id,
                ao.tipo,
                ao.severidad,
                ao.titulo,
                ao.mensaje,
                ao.estado,
                ao.datos,
                ao.resuelta_por,
                ao.fecha_resolucion,
                ao.notas_resolucion,
                ao.created_at,
                ot.tipo as orden_tipo,
                ot.fecha_programada,
                a.nombre_evento,
                c.nombre as cliente_nombre,
                e.nombre as resolutor_nombre,
                e.apellido as resolutor_apellido
            FROM alertas_operaciones ao
            LEFT JOIN ordenes_trabajo ot ON ao.orden_id = ot.id
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN empleados e ON ao.resuelta_por = e.id
            ${whereClause}
            ORDER BY ao.${ordenarCampo} ${ordenarDireccion}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Parsear datos JSON
        for (const row of rows) {
            if (row.datos && typeof row.datos === 'string') {
                row.datos = JSON.parse(row.datos);
            }
        }

        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM alertas_operaciones ao
            ${whereClause}
        `, params);

        return {
            alertas: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    /**
     * Obtener alertas pendientes
     * @returns {Promise<Array>}
     */
    static async obtenerPendientes() {
        const [rows] = await pool.query(`
            SELECT
                ao.id,
                ao.orden_id,
                ao.tipo,
                ao.severidad,
                ao.titulo,
                ao.mensaje,
                ao.datos,
                ao.created_at,
                ot.tipo as orden_tipo,
                ot.fecha_programada,
                a.nombre_evento,
                c.nombre as cliente_nombre
            FROM alertas_operaciones ao
            LEFT JOIN ordenes_trabajo ot ON ao.orden_id = ot.id
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN clientes c ON a.cliente_id = c.id
            WHERE ao.estado = 'pendiente'
            ORDER BY
                CASE ao.severidad
                    WHEN 'critica' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    WHEN 'baja' THEN 4
                END,
                ao.created_at DESC
        `);

        for (const row of rows) {
            if (row.datos && typeof row.datos === 'string') {
                row.datos = JSON.parse(row.datos);
            }
        }

        return rows;
    }

    /**
     * Obtener alerta por ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT
                ao.*,
                ot.tipo as orden_tipo,
                ot.fecha_programada,
                ot.estado as orden_estado,
                a.nombre_evento,
                c.nombre as cliente_nombre,
                e.nombre as resolutor_nombre,
                e.apellido as resolutor_apellido
            FROM alertas_operaciones ao
            LEFT JOIN ordenes_trabajo ot ON ao.orden_id = ot.id
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN empleados e ON ao.resuelta_por = e.id
            WHERE ao.id = ?
        `, [id]);

        if (rows.length === 0) {
            return null;
        }

        const alerta = rows[0];
        if (alerta.datos && typeof alerta.datos === 'string') {
            alerta.datos = JSON.parse(alerta.datos);
        }

        return alerta;
    }

    /**
     * Crear nueva alerta
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async crear(datos) {
        const {
            orden_id,
            tipo,
            severidad = 'media',
            titulo,
            mensaje,
            datos: datosExtra
        } = datos;

        const tiposValidos = ['conflicto_fecha', 'conflicto_disponibilidad', 'conflicto_equipo',
                             'conflicto_vehiculo', 'cambio_fecha', 'incidencia', 'otro'];
        if (!tiposValidos.includes(tipo)) {
            throw new AppError(`Tipo de alerta inválido. Valores permitidos: ${tiposValidos.join(', ')}`, 400);
        }

        const severidadesValidas = ['baja', 'media', 'alta', 'critica'];
        if (!severidadesValidas.includes(severidad)) {
            throw new AppError(`Severidad inválida. Valores permitidos: ${severidadesValidas.join(', ')}`, 400);
        }

        const [result] = await pool.query(`
            INSERT INTO alertas_operaciones
            (orden_id, tipo, severidad, titulo, mensaje, datos)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            orden_id || null,
            tipo,
            severidad,
            titulo,
            mensaje,
            datosExtra ? JSON.stringify(datosExtra) : null
        ]);

        return this.obtenerPorId(result.insertId);
    }

    /**
     * Resolver alerta
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async resolver(id, datos) {
        const { resuelta_por, notas_resolucion, estado = 'resuelta' } = datos;

        const alerta = await this.obtenerPorId(id);
        if (!alerta) {
            throw new AppError('Alerta no encontrada', 404);
        }

        if (alerta.estado !== 'pendiente') {
            throw new AppError('Esta alerta ya fue procesada', 400);
        }

        const estadosValidos = ['resuelta', 'descartada', 'escalada'];
        if (!estadosValidos.includes(estado)) {
            throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
        }

        await pool.query(`
            UPDATE alertas_operaciones
            SET estado = ?,
                resuelta_por = ?,
                notas_resolucion = ?,
                fecha_resolucion = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [estado, resuelta_por, notas_resolucion || null, id]);

        return this.obtenerPorId(id);
    }

    /**
     * Escalar alerta
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async escalar(id, datos) {
        const { notas } = datos;

        const alerta = await this.obtenerPorId(id);
        if (!alerta) {
            throw new AppError('Alerta no encontrada', 404);
        }

        // Aumentar severidad si no es crítica
        let nuevaSeveridad = alerta.severidad;
        const escalaSeveridad = ['baja', 'media', 'alta', 'critica'];
        const indiceActual = escalaSeveridad.indexOf(alerta.severidad);
        if (indiceActual < escalaSeveridad.length - 1) {
            nuevaSeveridad = escalaSeveridad[indiceActual + 1];
        }

        await pool.query(`
            UPDATE alertas_operaciones
            SET severidad = ?,
                estado = 'escalada',
                notas_resolucion = CONCAT(COALESCE(notas_resolucion, ''), '\n[ESCALADA] ', ?)
            WHERE id = ?
        `, [nuevaSeveridad, notas || 'Alerta escalada', id]);

        return this.obtenerPorId(id);
    }

    /**
     * Obtener conteo de alertas por severidad
     * @returns {Promise<Object>}
     */
    static async obtenerResumen() {
        const [porSeveridad] = await pool.query(`
            SELECT
                severidad,
                COUNT(*) as cantidad
            FROM alertas_operaciones
            WHERE estado = 'pendiente'
            GROUP BY severidad
        `);

        const [porTipo] = await pool.query(`
            SELECT
                tipo,
                COUNT(*) as cantidad
            FROM alertas_operaciones
            WHERE estado = 'pendiente'
            GROUP BY tipo
        `);

        const [totales] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'pendiente' AND severidad = 'critica' THEN 1 ELSE 0 END) as criticas_pendientes
            FROM alertas_operaciones
        `);

        return {
            ...totales[0],
            porSeveridad,
            porTipo
        };
    }

    /**
     * Crear alerta de conflicto de disponibilidad
     * @param {number} ordenId
     * @param {Array} conflictos
     * @returns {Promise<Object>}
     */
    static async crearAlertaDisponibilidad(ordenId, conflictos) {
        const totalFaltantes = conflictos.reduce((sum, c) => sum + (c.faltantes || 0), 0);

        let severidad = 'media';
        if (totalFaltantes > 5) {
            severidad = 'critica';
        } else if (totalFaltantes > 2) {
            severidad = 'alta';
        }

        return this.crear({
            orden_id: ordenId,
            tipo: 'conflicto_disponibilidad',
            severidad,
            titulo: `Conflicto de disponibilidad - ${conflictos.length} elemento(s)`,
            mensaje: `Se detectaron ${conflictos.length} elementos con problemas de disponibilidad. Total faltante: ${totalFaltantes} unidades.`,
            datos: { conflictos, totalFaltantes }
        });
    }

    /**
     * Crear alerta de cambio de fecha
     * @param {number} ordenId
     * @param {Date} fechaAnterior
     * @param {Date} fechaNueva
     * @param {string} motivo
     * @returns {Promise<Object>}
     */
    static async crearAlertaCambioFecha(ordenId, fechaAnterior, fechaNueva, motivo) {
        return this.crear({
            orden_id: ordenId,
            tipo: 'cambio_fecha',
            severidad: 'media',
            titulo: 'Solicitud de cambio de fecha',
            mensaje: `Se solicita cambiar la fecha de ${fechaAnterior} a ${fechaNueva}. Motivo: ${motivo}`,
            datos: { fechaAnterior, fechaNueva, motivo }
        });
    }

    /**
     * Obtener alertas de una orden
     * @param {number} ordenId
     * @returns {Promise<Array>}
     */
    static async obtenerPorOrden(ordenId) {
        const [rows] = await pool.query(`
            SELECT
                ao.*,
                e.nombre as resolutor_nombre,
                e.apellido as resolutor_apellido
            FROM alertas_operaciones ao
            LEFT JOIN empleados e ON ao.resuelta_por = e.id
            WHERE ao.orden_id = ?
            ORDER BY ao.created_at DESC
        `, [ordenId]);

        for (const row of rows) {
            if (row.datos && typeof row.datos === 'string') {
                row.datos = JSON.parse(row.datos);
            }
        }

        return rows;
    }
}

module.exports = AlertaModel;
