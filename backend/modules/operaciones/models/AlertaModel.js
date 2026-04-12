const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class AlertaModel {
    /**
     * Obtener todas las alertas con filtros
     * @param {number} tenantId
     * @param {Object} filtros
     * @returns {Promise<Object>}
     */
    static async obtenerTodas(tenantId, filtros = {}) {
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
        const params = [tenantId, tenantId, tenantId, tenantId, tenantId];
        let whereClause = 'WHERE ao.tenant_id = ?';

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
                ao.resuelta_por,
                ao.fecha_resolucion,
                ao.notas_resolucion,
                ao.created_at,
                ot.tipo as orden_tipo,
                ot.fecha_programada,
                cot.evento_nombre,
                c.nombre as cliente_nombre,
                e.nombre as resolutor_nombre,
                e.apellido as resolutor_apellido
            FROM alertas_operaciones ao
            LEFT JOIN ordenes_trabajo ot ON ao.orden_id = ot.id AND ot.tenant_id = ?
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
            LEFT JOIN clientes c ON cot.cliente_id = c.id AND c.tenant_id = ?
            LEFT JOIN empleados e ON ao.resuelta_por = e.id AND e.tenant_id = ?
            ${whereClause}
            ORDER BY ao.${ordenarCampo} ${ordenarDireccion}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Reorder params for count: just tenantId for WHERE ao.tenant_id = ?
        const countParams = [tenantId];
        if (tipo) countParams.push(tipo);
        if (severidad) countParams.push(severidad);
        if (estado) countParams.push(estado);
        if (orden_id) countParams.push(orden_id);

        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM alertas_operaciones ao
            ${whereClause}
        `, countParams);

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
     * @param {number} tenantId
     * @returns {Promise<Array>}
     */
    static async obtenerPendientes(tenantId) {
        const [rows] = await pool.query(`
            SELECT
                ao.id,
                ao.orden_id,
                ao.tipo,
                ao.severidad,
                ao.titulo,
                ao.mensaje,
                ao.created_at,
                ot.tipo as orden_tipo,
                ot.fecha_programada,
                a.nombre_evento,
                c.nombre as cliente_nombre
            FROM alertas_operaciones ao
            LEFT JOIN ordenes_trabajo ot ON ao.orden_id = ot.id AND ot.tenant_id = ?
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
            LEFT JOIN clientes c ON cot.cliente_id = c.id AND c.tenant_id = ?
            WHERE ao.tenant_id = ? AND ao.estado = 'pendiente'
            ORDER BY
                CASE ao.severidad
                    WHEN 'critica' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    WHEN 'baja' THEN 4
                END,
                ao.created_at DESC
        `, [tenantId, tenantId, tenantId, tenantId, tenantId]);

        return rows;
    }

    /**
     * Obtener alerta por ID
     * @param {number} tenantId
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(tenantId, id) {
        const [rows] = await pool.query(`
            SELECT
                ao.*,
                ot.tipo as orden_tipo,
                ot.fecha_programada,
                ot.estado as orden_estado,
                cot.evento_nombre,
                c.nombre as cliente_nombre,
                e.nombre as resolutor_nombre,
                e.apellido as resolutor_apellido
            FROM alertas_operaciones ao
            LEFT JOIN ordenes_trabajo ot ON ao.orden_id = ot.id AND ot.tenant_id = ?
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
            LEFT JOIN clientes c ON cot.cliente_id = c.id AND c.tenant_id = ?
            LEFT JOIN empleados e ON ao.resuelta_por = e.id AND e.tenant_id = ?
            WHERE ao.tenant_id = ? AND ao.id = ?
        `, [tenantId, tenantId, tenantId, tenantId, tenantId, tenantId, id]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    }

    /**
     * Crear nueva alerta
     * @param {number} tenantId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async crear(tenantId, datos) {
        const {
            orden_id,
            tipo,
            severidad = 'media',
            titulo,
            mensaje
        } = datos;

        const tiposValidos = ['conflicto_fecha', 'conflicto_disponibilidad', 'conflicto_equipo',
                             'conflicto_vehiculo', 'cambio_fecha', 'incidencia', 'novedad',
                             'stock_disponible', 'asignacion', 'rechazo_asignacion', 'otro'];
        if (!tiposValidos.includes(tipo)) {
            throw new AppError(`Tipo de alerta inválido. Valores permitidos: ${tiposValidos.join(', ')}`, 400);
        }

        const severidadesValidas = ['baja', 'media', 'alta', 'critica'];
        if (!severidadesValidas.includes(severidad)) {
            throw new AppError(`Severidad inválida. Valores permitidos: ${severidadesValidas.join(', ')}`, 400);
        }

        const [result] = await pool.query(`
            INSERT INTO alertas_operaciones
            (tenant_id, orden_id, destinatario_id, tipo, severidad, titulo, mensaje)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            tenantId,
            orden_id || null,
            datos.destinatario_id || null,
            tipo,
            severidad,
            titulo,
            mensaje
        ]);

        return this.obtenerPorId(tenantId, result.insertId);
    }

    /**
     * Resolver alerta
     * @param {number} tenantId
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async resolver(tenantId, id, datos) {
        const { resuelta_por, notas_resolucion, estado = 'resuelta' } = datos;

        const alerta = await this.obtenerPorId(tenantId, id);
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
            WHERE tenant_id = ? AND id = ?
        `, [estado, resuelta_por, notas_resolucion || null, tenantId, id]);

        return this.obtenerPorId(tenantId, id);
    }

    /**
     * Escalar alerta
     * @param {number} tenantId
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async escalar(tenantId, id, datos) {
        const { notas } = datos;

        const alerta = await this.obtenerPorId(tenantId, id);
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
            WHERE tenant_id = ? AND id = ?
        `, [nuevaSeveridad, notas || 'Alerta escalada', tenantId, id]);

        return this.obtenerPorId(tenantId, id);
    }

    /**
     * Obtener conteo de alertas por severidad
     * @param {number} tenantId
     * @returns {Promise<Object>}
     */
    static async obtenerResumen(tenantId) {
        const [porSeveridad] = await pool.query(`
            SELECT
                severidad,
                COUNT(*) as cantidad
            FROM alertas_operaciones
            WHERE tenant_id = ? AND estado = 'pendiente'
            GROUP BY severidad
        `, [tenantId]);

        const [porTipo] = await pool.query(`
            SELECT
                tipo,
                COUNT(*) as cantidad
            FROM alertas_operaciones
            WHERE tenant_id = ? AND estado = 'pendiente'
            GROUP BY tipo
        `, [tenantId]);

        const [totales] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'pendiente' AND severidad = 'critica' THEN 1 ELSE 0 END) as criticas_pendientes
            FROM alertas_operaciones
            WHERE tenant_id = ?
        `, [tenantId]);

        return {
            ...totales[0],
            porSeveridad,
            porTipo
        };
    }

    /**
     * Crear alerta de conflicto de disponibilidad
     * @param {number} tenantId
     * @param {number} ordenId
     * @param {Array} conflictos
     * @returns {Promise<Object>}
     */
    static async crearAlertaDisponibilidad(tenantId, ordenId, conflictos) {
        const totalFaltantes = conflictos.reduce((sum, c) => sum + (c.faltantes || 0), 0);

        let severidad = 'media';
        if (totalFaltantes > 5) {
            severidad = 'critica';
        } else if (totalFaltantes > 2) {
            severidad = 'alta';
        }

        return this.crear(tenantId, {
            orden_id: ordenId,
            tipo: 'conflicto_disponibilidad',
            severidad,
            titulo: `Conflicto de disponibilidad - ${conflictos.length} elemento(s)`,
            mensaje: `Se detectaron ${conflictos.length} elementos con problemas de disponibilidad. Total faltante: ${totalFaltantes} unidades.`
        });
    }

    /**
     * Crear alerta de cambio de fecha
     * @param {number} tenantId
     * @param {number} ordenId
     * @param {Date} fechaAnterior
     * @param {Date} fechaNueva
     * @param {string} motivo
     * @returns {Promise<Object>}
     */
    static async crearAlertaCambioFecha(tenantId, ordenId, fechaAnterior, fechaNueva, motivo) {
        return this.crear(tenantId, {
            orden_id: ordenId,
            tipo: 'cambio_fecha',
            severidad: 'media',
            titulo: 'Solicitud de cambio de fecha',
            mensaje: `Se solicita cambiar la fecha de ${fechaAnterior} a ${fechaNueva}. Motivo: ${motivo}`
        });
    }

    /**
     * Obtener alertas pendientes de disponibilidad (para verificar tras retorno de inventario)
     * @param {number} tenantId
     * @returns {Promise<Array>}
     */
    static async obtenerAlertasDisponibilidadPendientes(tenantId) {
        const [rows] = await pool.query(`
            SELECT
                ao.id,
                ao.orden_id,
                ao.titulo,
                ao.mensaje,
                ot.alquiler_id,
                a.cotizacion_id,
                a.fecha_salida,
                a.fecha_retorno_esperado,
                cot.evento_nombre,
                c.nombre AS cliente_nombre
            FROM alertas_operaciones ao
            INNER JOIN ordenes_trabajo ot ON ao.orden_id = ot.id AND ot.tenant_id = ?
            INNER JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
            INNER JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
            INNER JOIN clientes c ON cot.cliente_id = c.id AND c.tenant_id = ?
            WHERE ao.tenant_id = ?
              AND ao.tipo = 'conflicto_disponibilidad'
              AND ao.estado = 'pendiente'
              AND ot.estado NOT IN ('completado', 'cancelado')
              AND a.estado IN ('programado', 'activo')
            ORDER BY ao.created_at ASC
        `, [tenantId, tenantId, tenantId, tenantId, tenantId]);

        return rows;
    }

    /**
     * Crear alerta de stock disponible (cuando inventario vuelve a estar completo)
     * @param {number} tenantId
     * @param {number} ordenId
     * @param {string} eventoNombre
     * @param {string} clienteNombre
     * @returns {Promise<Object>}
     */
    static async crearAlertaStockDisponible(tenantId, ordenId, eventoNombre, clienteNombre) {
        return this.crear(tenantId, {
            orden_id: ordenId,
            tipo: 'stock_disponible',
            severidad: 'media',
            titulo: `Stock disponible - ${eventoNombre || 'Orden #' + ordenId}`,
            mensaje: `El inventario requerido para la orden #${ordenId} (${clienteNombre || 'Cliente'} - ${eventoNombre || ''}) ya está disponible. Se puede proceder con la asignación de inventario y el montaje.`
        });
    }

    /**
     * Crear alerta de asignación dirigida a un empleado
     * @param {number} tenantId
     * @param {number} ordenId
     * @param {number} destinatarioId - Empleado asignado
     * @param {string} ordenTipo - 'montaje' o 'desmontaje'
     * @param {string} eventoNombre
     * @param {string} fechaProgramada
     * @param {string} asignadoPor - Nombre de quien asignó
     * @returns {Promise<Object>}
     */
    static async crearAlertaAsignacion(tenantId, ordenId, destinatarioId, { ordenTipo, eventoNombre, fechaProgramada, asignadoPor }) {
        return this.crear(tenantId, {
            orden_id: ordenId,
            destinatario_id: destinatarioId,
            tipo: 'asignacion',
            severidad: 'alta',
            titulo: `Asignación de ${ordenTipo} - ${eventoNombre || 'Orden #' + ordenId}`,
            mensaje: `Se te ha asignado como responsable del ${ordenTipo} para "${eventoNombre || 'Orden #' + ordenId}" programado para el ${fechaProgramada}. Asignado por: ${asignadoPor}. Por favor acepta o rechaza esta asignación.`
        });
    }

    /**
     * Crear alerta de rechazo (notifica al admin/gerente)
     * @param {number} tenantId
     * @param {number} ordenId
     * @param {string} empleadoNombre
     * @param {string} motivo
     * @returns {Promise<Object>}
     */
    static async crearAlertaRechazoAsignacion(tenantId, ordenId, empleadoNombre, motivo) {
        return this.crear(tenantId, {
            orden_id: ordenId,
            tipo: 'rechazo_asignacion',
            severidad: 'alta',
            titulo: `Asignación rechazada por ${empleadoNombre}`,
            mensaje: `${empleadoNombre} ha rechazado la asignación a la orden #${ordenId}. Motivo: ${motivo}`
        });
    }

    /**
     * Obtener alertas pendientes dirigidas a un empleado
     * @param {number} tenantId
     * @param {number} empleadoId
     * @returns {Promise<Array>}
     */
    static async obtenerPorDestinatario(tenantId, empleadoId) {
        const [rows] = await pool.query(`
            SELECT
                ao.id,
                ao.orden_id,
                ao.tipo,
                ao.severidad,
                ao.titulo,
                ao.mensaje,
                ao.estado,
                ao.created_at,
                ot.tipo as orden_tipo,
                ot.fecha_programada,
                ot.direccion_evento,
                ot.ciudad_evento,
                cot.evento_nombre,
                c.nombre as cliente_nombre
            FROM alertas_operaciones ao
            LEFT JOIN ordenes_trabajo ot ON ao.orden_id = ot.id AND ot.tenant_id = ?
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id AND a.tenant_id = ?
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id AND cot.tenant_id = ?
            LEFT JOIN clientes c ON cot.cliente_id = c.id AND c.tenant_id = ?
            WHERE ao.tenant_id = ?
              AND ao.destinatario_id = ?
              AND ao.estado = 'pendiente'
            ORDER BY ao.created_at DESC
        `, [tenantId, tenantId, tenantId, tenantId, tenantId, empleadoId]);

        return rows;
    }

    /**
     * Obtener alertas de una orden
     * @param {number} tenantId
     * @param {number} ordenId
     * @returns {Promise<Array>}
     */
    static async obtenerPorOrden(tenantId, ordenId) {
        const [rows] = await pool.query(`
            SELECT
                ao.*,
                e.nombre as resolutor_nombre,
                e.apellido as resolutor_apellido
            FROM alertas_operaciones ao
            LEFT JOIN empleados e ON ao.resuelta_por = e.id AND e.tenant_id = ?
            WHERE ao.tenant_id = ? AND ao.orden_id = ?
            ORDER BY ao.created_at DESC
        `, [tenantId, tenantId, ordenId]);

        return rows;
    }
}

module.exports = AlertaModel;
