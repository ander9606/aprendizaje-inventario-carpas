const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class OrdenTrabajoModel {
    /**
     * Obtener todas las órdenes de trabajo con filtros
     * @param {Object} filtros
     * @returns {Promise<Object>}
     */
    static async obtenerTodas(filtros = {}) {
        const {
            page = 1,
            limit = 20,
            tipo = null,
            estado = null,
            fecha_desde = null,
            fecha_hasta = null,
            alquiler_id = null,
            empleado_id = null,
            vehiculo_id = null,
            ordenar = 'fecha_programada',
            direccion = 'ASC'
        } = filtros;

        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (tipo) {
            whereClause += ` AND ot.tipo = ?`;
            params.push(tipo);
        }

        if (estado) {
            whereClause += ` AND ot.estado = ?`;
            params.push(estado);
        }

        if (fecha_desde) {
            whereClause += ` AND DATE(ot.fecha_programada) >= ?`;
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            whereClause += ` AND DATE(ot.fecha_programada) <= ?`;
            params.push(fecha_hasta);
        }

        if (alquiler_id) {
            whereClause += ` AND ot.alquiler_id = ?`;
            params.push(alquiler_id);
        }

        if (empleado_id) {
            whereClause += ` AND ot.id IN (SELECT orden_id FROM orden_trabajo_equipo WHERE empleado_id = ?)`;
            params.push(empleado_id);
        }

        if (vehiculo_id) {
            whereClause += ` AND ot.vehiculo_id = ?`;
            params.push(vehiculo_id);
        }

        const camposValidos = ['fecha_programada', 'tipo', 'estado', 'prioridad', 'created_at'];
        const ordenarCampo = camposValidos.includes(ordenar) ? ordenar : 'fecha_programada';
        const ordenarDireccion = direccion.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const [rows] = await pool.query(`
            SELECT
                ot.id,
                ot.alquiler_id,
                ot.tipo,
                ot.estado,
                ot.fecha_programada,
                ot.direccion,
                ot.notas,
                ot.prioridad,
                ot.vehiculo_id,
                ot.created_at,
                a.nombre_evento,
                a.cliente_id,
                c.nombre as cliente_nombre,
                v.placa as vehiculo_placa,
                v.marca as vehiculo_marca,
                (SELECT COUNT(*) FROM orden_trabajo_elementos WHERE orden_id = ot.id) as total_elementos,
                (SELECT COUNT(*) FROM orden_trabajo_equipo WHERE orden_id = ot.id) as total_equipo
            FROM ordenes_trabajo ot
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            ${whereClause}
            ORDER BY ot.${ordenarCampo} ${ordenarDireccion}
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM ordenes_trabajo ot
            ${whereClause}
        `, params);

        return {
            ordenes: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    /**
     * Obtener orden de trabajo por ID con detalle completo
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT
                ot.*,
                a.nombre_evento,
                a.fecha_inicio as alquiler_fecha_inicio,
                a.fecha_fin as alquiler_fecha_fin,
                a.cliente_id,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                v.placa as vehiculo_placa,
                v.marca as vehiculo_marca,
                v.modelo as vehiculo_modelo
            FROM ordenes_trabajo ot
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            WHERE ot.id = ?
        `, [id]);

        if (rows.length === 0) {
            return null;
        }

        const orden = rows[0];

        // Obtener equipo asignado
        const [equipo] = await pool.query(`
            SELECT
                ote.id,
                ote.empleado_id,
                ote.rol_en_orden,
                e.nombre,
                e.apellido,
                e.telefono,
                r.nombre as rol_empleado
            FROM orden_trabajo_equipo ote
            INNER JOIN empleados e ON ote.empleado_id = e.id
            INNER JOIN roles r ON e.rol_id = r.id
            WHERE ote.orden_id = ?
        `, [id]);

        // Obtener elementos de la orden
        const [elementos] = await pool.query(`
            SELECT
                ote.id,
                ote.elemento_id,
                ote.serie_id,
                ote.lote_id,
                ote.cantidad,
                ote.estado,
                ote.verificado_salida,
                ote.verificado_retorno,
                ote.notas,
                el.nombre as elemento_nombre,
                el.codigo as elemento_codigo,
                s.numero_serie,
                l.codigo_lote
            FROM orden_trabajo_elementos ote
            INNER JOIN elementos el ON ote.elemento_id = el.id
            LEFT JOIN series s ON ote.serie_id = s.id
            LEFT JOIN lotes l ON ote.lote_id = l.id
            WHERE ote.orden_id = ?
        `, [id]);

        // Obtener historial de cambios de fecha
        const [cambiosFecha] = await pool.query(`
            SELECT
                otc.id,
                otc.fecha_anterior,
                otc.fecha_nueva,
                otc.motivo,
                otc.aprobado_por,
                otc.created_at,
                e.nombre as aprobador_nombre,
                e.apellido as aprobador_apellido
            FROM orden_trabajo_cambios_fecha otc
            LEFT JOIN empleados e ON otc.aprobado_por = e.id
            WHERE otc.orden_id = ?
            ORDER BY otc.created_at DESC
        `, [id]);

        orden.equipo = equipo;
        orden.elementos = elementos;
        orden.cambiosFecha = cambiosFecha;

        return orden;
    }

    /**
     * Obtener órdenes de un alquiler
     * @param {number} alquilerId
     * @returns {Promise<Array>}
     */
    static async obtenerPorAlquiler(alquilerId) {
        const [rows] = await pool.query(`
            SELECT
                ot.id,
                ot.tipo,
                ot.estado,
                ot.fecha_programada,
                ot.direccion,
                ot.prioridad,
                v.placa as vehiculo_placa,
                (SELECT COUNT(*) FROM orden_trabajo_equipo WHERE orden_id = ot.id) as total_equipo
            FROM ordenes_trabajo ot
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            WHERE ot.alquiler_id = ?
            ORDER BY ot.fecha_programada ASC
        `, [alquilerId]);

        return rows;
    }

    /**
     * Crear orden de trabajo
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async crear(datos) {
        const {
            alquiler_id,
            tipo,
            fecha_programada,
            direccion,
            notas,
            prioridad = 'normal',
            vehiculo_id,
            creado_por
        } = datos;

        const [result] = await pool.query(`
            INSERT INTO ordenes_trabajo
            (alquiler_id, tipo, estado, fecha_programada, direccion, notas, prioridad, vehiculo_id, creado_por)
            VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, ?)
        `, [
            alquiler_id,
            tipo,
            fecha_programada,
            direccion || null,
            notas || null,
            prioridad,
            vehiculo_id || null,
            creado_por || null
        ]);

        return this.obtenerPorId(result.insertId);
    }

    /**
     * Actualizar orden de trabajo
     * @param {number} id
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async actualizar(id, datos) {
        const orden = await this.obtenerPorId(id);
        if (!orden) {
            throw new AppError('Orden de trabajo no encontrada', 404);
        }

        const campos = [];
        const valores = [];

        const camposPermitidos = [
            'direccion', 'notas', 'prioridad', 'vehiculo_id'
        ];

        for (const campo of camposPermitidos) {
            if (datos[campo] !== undefined) {
                campos.push(`${campo} = ?`);
                valores.push(datos[campo]);
            }
        }

        if (campos.length === 0) {
            return orden;
        }

        valores.push(id);

        await pool.query(`
            UPDATE ordenes_trabajo
            SET ${campos.join(', ')}
            WHERE id = ?
        `, valores);

        return this.obtenerPorId(id);
    }

    /**
     * Cambiar fecha de la orden (con registro de cambio)
     * @param {number} id
     * @param {Date} nuevaFecha
     * @param {string} motivo
     * @param {number} aprobadoPor
     * @returns {Promise<Object>}
     */
    static async cambiarFecha(id, nuevaFecha, motivo, aprobadoPor = null) {
        const orden = await this.obtenerPorId(id);
        if (!orden) {
            throw new AppError('Orden de trabajo no encontrada', 404);
        }

        // Registrar el cambio
        await pool.query(`
            INSERT INTO orden_trabajo_cambios_fecha
            (orden_id, fecha_anterior, fecha_nueva, motivo, aprobado_por)
            VALUES (?, ?, ?, ?, ?)
        `, [id, orden.fecha_programada, nuevaFecha, motivo, aprobadoPor]);

        // Actualizar la fecha
        await pool.query(`
            UPDATE ordenes_trabajo
            SET fecha_programada = ?
            WHERE id = ?
        `, [nuevaFecha, id]);

        return this.obtenerPorId(id);
    }

    /**
     * Cambiar estado de la orden
     * @param {number} id
     * @param {string} estado
     * @returns {Promise<Object>}
     */
    static async cambiarEstado(id, estado) {
        const estadosValidos = [
            'pendiente', 'confirmado', 'en_preparacion', 'en_ruta',
            'en_sitio', 'en_proceso', 'completado', 'cancelado'
        ];

        if (!estadosValidos.includes(estado)) {
            throw new AppError(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`, 400);
        }

        const orden = await this.obtenerPorId(id);
        if (!orden) {
            throw new AppError('Orden de trabajo no encontrada', 404);
        }

        await pool.query(`
            UPDATE ordenes_trabajo
            SET estado = ?
            WHERE id = ?
        `, [estado, id]);

        return this.obtenerPorId(id);
    }

    /**
     * Asignar equipo a la orden
     * @param {number} ordenId
     * @param {Array} empleados - [{empleado_id, rol_en_orden}]
     * @returns {Promise<Array>}
     */
    static async asignarEquipo(ordenId, empleados) {
        const orden = await this.obtenerPorId(ordenId);
        if (!orden) {
            throw new AppError('Orden de trabajo no encontrada', 404);
        }

        // Eliminar asignaciones anteriores
        await pool.query('DELETE FROM orden_trabajo_equipo WHERE orden_id = ?', [ordenId]);

        // Insertar nuevas asignaciones
        for (const emp of empleados) {
            await pool.query(`
                INSERT INTO orden_trabajo_equipo (orden_id, empleado_id, rol_en_orden)
                VALUES (?, ?, ?)
            `, [ordenId, emp.empleado_id, emp.rol_en_orden || 'operario']);
        }

        const ordenActualizada = await this.obtenerPorId(ordenId);
        return ordenActualizada.equipo;
    }

    /**
     * Asignar vehículo a la orden
     * @param {number} ordenId
     * @param {number} vehiculoId
     * @returns {Promise<Object>}
     */
    static async asignarVehiculo(ordenId, vehiculoId) {
        const orden = await this.obtenerPorId(ordenId);
        if (!orden) {
            throw new AppError('Orden de trabajo no encontrada', 404);
        }

        await pool.query(`
            UPDATE ordenes_trabajo
            SET vehiculo_id = ?
            WHERE id = ?
        `, [vehiculoId, ordenId]);

        return this.obtenerPorId(ordenId);
    }

    /**
     * Obtener calendario de órdenes
     * @param {Date} desde
     * @param {Date} hasta
     * @returns {Promise<Array>}
     */
    static async obtenerCalendario(desde, hasta) {
        const [rows] = await pool.query(`
            SELECT
                ot.id,
                ot.alquiler_id,
                ot.tipo,
                ot.estado,
                ot.fecha_programada,
                ot.direccion,
                ot.prioridad,
                a.nombre_evento,
                c.nombre as cliente_nombre,
                v.placa as vehiculo_placa,
                (SELECT GROUP_CONCAT(CONCAT(e.nombre, ' ', e.apellido) SEPARATOR ', ')
                 FROM orden_trabajo_equipo ote
                 INNER JOIN empleados e ON ote.empleado_id = e.id
                 WHERE ote.orden_id = ot.id) as equipo_nombres
            FROM ordenes_trabajo ot
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            WHERE DATE(ot.fecha_programada) BETWEEN ? AND ?
              AND ot.estado NOT IN ('cancelado')
            ORDER BY ot.fecha_programada ASC
        `, [desde, hasta]);

        return rows;
    }

    /**
     * Crear órdenes desde un alquiler (montaje y desmontaje)
     * @param {number} alquilerId
     * @param {Object} datos
     * @returns {Promise<Object>}
     */
    static async crearDesdeAlquiler(alquilerId, datos) {
        const { montaje, desmontaje, elementos, creado_por } = datos;

        // Crear orden de montaje
        const ordenMontaje = await this.crear({
            alquiler_id: alquilerId,
            tipo: 'montaje',
            fecha_programada: montaje.fecha,
            direccion: montaje.direccion,
            notas: montaje.notas,
            prioridad: montaje.prioridad || 'normal',
            creado_por
        });

        // Crear orden de desmontaje
        const ordenDesmontaje = await this.crear({
            alquiler_id: alquilerId,
            tipo: 'desmontaje',
            fecha_programada: desmontaje.fecha,
            direccion: desmontaje.direccion || montaje.direccion,
            notas: desmontaje.notas,
            prioridad: desmontaje.prioridad || 'normal',
            creado_por
        });

        // Agregar elementos a ambas órdenes si se proporcionan
        if (elementos && elementos.length > 0) {
            for (const elem of elementos) {
                // Agregar a montaje
                await pool.query(`
                    INSERT INTO orden_trabajo_elementos
                    (orden_id, elemento_id, serie_id, lote_id, cantidad, estado)
                    VALUES (?, ?, ?, ?, ?, 'pendiente')
                `, [
                    ordenMontaje.id,
                    elem.elemento_id,
                    elem.serie_id || null,
                    elem.lote_id || null,
                    elem.cantidad || 1
                ]);

                // Agregar a desmontaje
                await pool.query(`
                    INSERT INTO orden_trabajo_elementos
                    (orden_id, elemento_id, serie_id, lote_id, cantidad, estado)
                    VALUES (?, ?, ?, ?, ?, 'pendiente')
                `, [
                    ordenDesmontaje.id,
                    elem.elemento_id,
                    elem.serie_id || null,
                    elem.lote_id || null,
                    elem.cantidad || 1
                ]);
            }
        }

        return {
            montaje: await this.obtenerPorId(ordenMontaje.id),
            desmontaje: await this.obtenerPorId(ordenDesmontaje.id)
        };
    }

    /**
     * Obtener estadísticas de órdenes
     * @param {Date} desde
     * @param {Date} hasta
     * @returns {Promise<Object>}
     */
    static async obtenerEstadisticas(desde = null, hasta = null) {
        let whereClause = '';
        const params = [];

        if (desde && hasta) {
            whereClause = 'WHERE DATE(fecha_programada) BETWEEN ? AND ?';
            params.push(desde, hasta);
        }

        const [stats] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'confirmado' THEN 1 ELSE 0 END) as confirmadas,
                SUM(CASE WHEN estado IN ('en_preparacion', 'en_ruta', 'en_sitio', 'en_proceso') THEN 1 ELSE 0 END) as en_progreso,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completadas,
                SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
                SUM(CASE WHEN tipo = 'montaje' THEN 1 ELSE 0 END) as montajes,
                SUM(CASE WHEN tipo = 'desmontaje' THEN 1 ELSE 0 END) as desmontajes
            FROM ordenes_trabajo
            ${whereClause}
        `, params);

        // Órdenes de hoy
        const [hoy] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN estado NOT IN ('completado', 'cancelado') THEN 1 ELSE 0 END) as pendientes
            FROM ordenes_trabajo
            WHERE DATE(fecha_programada) = CURDATE()
        `);

        // Próximas órdenes sin equipo asignado
        const [sinEquipo] = await pool.query(`
            SELECT COUNT(*) as total
            FROM ordenes_trabajo ot
            WHERE ot.estado IN ('pendiente', 'confirmado')
              AND ot.fecha_programada >= CURDATE()
              AND NOT EXISTS (
                  SELECT 1 FROM orden_trabajo_equipo WHERE orden_id = ot.id
              )
        `);

        // Próximas órdenes sin vehículo asignado
        const [sinVehiculo] = await pool.query(`
            SELECT COUNT(*) as total
            FROM ordenes_trabajo
            WHERE estado IN ('pendiente', 'confirmado')
              AND fecha_programada >= CURDATE()
              AND vehiculo_id IS NULL
        `);

        return {
            ...stats[0],
            hoy: hoy[0],
            alertas: {
                sinEquipo: sinEquipo[0].total,
                sinVehiculo: sinVehiculo[0].total
            }
        };
    }
}

module.exports = OrdenTrabajoModel;
