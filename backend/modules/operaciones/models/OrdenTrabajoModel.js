const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

class OrdenTrabajoModel {
    /**
     * Obtener todas las órdenes de trabajo con filtros
     * Optimizado: Usa JOINs con conteos agregados en lugar de subconsultas correlacionadas
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
            whereClause += ` AND ot.fecha_programada >= ?`;
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            whereClause += ` AND ot.fecha_programada < DATE_ADD(?, INTERVAL 1 DAY)`;
            params.push(fecha_hasta);
        }

        if (alquiler_id) {
            whereClause += ` AND ot.alquiler_id = ?`;
            params.push(alquiler_id);
        }

        if (empleado_id) {
            whereClause += ` AND EXISTS (SELECT 1 FROM orden_trabajo_equipo ote WHERE ote.orden_id = ot.id AND ote.empleado_id = ?)`;
            params.push(empleado_id);
        }

        if (vehiculo_id) {
            whereClause += ` AND ot.vehiculo_id = ?`;
            params.push(vehiculo_id);
        }

        const camposValidos = ['fecha_programada', 'tipo', 'estado', 'prioridad', 'created_at'];
        const ordenarCampo = camposValidos.includes(ordenar) ? ordenar : 'fecha_programada';
        const ordenarDireccion = direccion.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Query optimizada: usa LEFT JOINs con agregación en lugar de subconsultas correlacionadas
        const [rows] = await pool.query(`
            SELECT
                ot.id,
                ot.alquiler_id,
                ot.tipo,
                ot.estado,
                ot.fecha_programada,
                ot.direccion_evento,
                ot.ciudad_evento,
                ot.notas,
                ot.prioridad,
                ot.vehiculo_id,
                ot.created_at,
                cot.id as cotizacion_id,
                cot.evento_nombre,
                cot.evento_ciudad,
                cot.fecha_montaje,
                cot.fecha_evento,
                cot.fecha_desmontaje,
                cot.total as cotizacion_total,
                cot.cliente_id,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                v.placa as vehiculo_placa,
                v.marca as vehiculo_marca,
                COALESCE(elem_count.total, 0) as total_elementos,
                COALESCE(equipo_count.total, 0) as total_equipo
            FROM ordenes_trabajo ot
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id
            LEFT JOIN clientes c ON cot.cliente_id = c.id
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            LEFT JOIN (
                SELECT orden_id, COUNT(*) as total
                FROM orden_trabajo_elementos
                GROUP BY orden_id
            ) elem_count ON elem_count.orden_id = ot.id
            LEFT JOIN (
                SELECT orden_id, COUNT(*) as total
                FROM orden_trabajo_equipo
                GROUP BY orden_id
            ) equipo_count ON equipo_count.orden_id = ot.id
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
     * Optimizado: Incluye info completa de cotización y reduce queries
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerPorId(id) {
        // Query principal con toda la info de cotización
        const [rows] = await pool.query(`
            SELECT
                ot.*,
                a.id as alquiler_id,
                a.fecha_salida as alquiler_fecha_inicio,
                a.fecha_retorno_esperado as alquiler_fecha_fin,
                a.estado as alquiler_estado,
                a.total as alquiler_total,
                cot.id as cotizacion_id,
                cot.evento_nombre,
                cot.evento_direccion as cotizacion_direccion,
                cot.evento_ciudad as cotizacion_ciudad,
                cot.fecha_montaje,
                cot.fecha_evento,
                cot.fecha_desmontaje,
                cot.subtotal as cotizacion_subtotal,
                cot.descuento as cotizacion_descuento,
                cot.total as cotizacion_total,
                cot.notas as cotizacion_notas,
                cot.cliente_id,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                c.direccion as cliente_direccion,
                c.tipo_documento as cliente_tipo_documento,
                c.numero_documento as cliente_numero_documento,
                v.id as vehiculo_id,
                v.placa as vehiculo_placa,
                v.marca as vehiculo_marca,
                v.modelo as vehiculo_modelo
            FROM ordenes_trabajo ot
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id
            LEFT JOIN clientes c ON cot.cliente_id = c.id
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            WHERE ot.id = ?
        `, [id]);

        if (rows.length === 0) {
            return null;
        }

        const orden = rows[0];

        // Ejecutar las 3 queries de detalle en paralelo para mejor rendimiento
        const [equipoResult, elementosResult, cambiosFechaResult] = await Promise.all([
            // Equipo asignado
            pool.query(`
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
                LEFT JOIN roles r ON e.rol_id = r.id
                WHERE ote.orden_id = ?
            `, [id]),
            // Elementos de la orden
            pool.query(`
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
                    s.numero_serie,
                    l.lote_numero
                FROM orden_trabajo_elementos ote
                INNER JOIN elementos el ON ote.elemento_id = el.id
                LEFT JOIN series s ON ote.serie_id = s.id
                LEFT JOIN lotes l ON ote.lote_id = l.id
                WHERE ote.orden_id = ?
            `, [id]),
            // Historial de cambios de fecha
            pool.query(`
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
            `, [id])
        ]);

        orden.equipo = equipoResult[0];
        orden.elementos = elementosResult[0];
        orden.cambiosFecha = cambiosFechaResult[0];

        return orden;
    }

    /**
     * Obtener orden completa con toda la información de cotización
     * Incluye: productos, transporte, elementos asignados del alquiler
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async obtenerOrdenCompleta(id) {
        const orden = await this.obtenerPorId(id);
        if (!orden) return null;

        // Si no hay cotización asociada, retornar solo la orden básica
        if (!orden.cotizacion_id) {
            return {
                ...orden,
                cotizacion: null,
                productos: [],
                transporte: [],
                alquiler_elementos: []
            };
        }

        // Ejecutar queries adicionales en paralelo
        const [productosResult, transporteResult, alquilerElementosResult] = await Promise.all([
            // Productos de la cotización
            pool.query(`
                SELECT
                    cp.id,
                    cp.compuesto_id,
                    cp.cantidad,
                    cp.precio_base,
                    cp.deposito,
                    cp.precio_adicionales,
                    cp.subtotal,
                    cp.notas,
                    ec.nombre as producto_nombre,
                    ec.codigo as producto_codigo,
                    cat.nombre as categoria_nombre,
                    cat.emoji as categoria_emoji
                FROM cotizacion_productos cp
                INNER JOIN elementos_compuestos ec ON cp.compuesto_id = ec.id
                LEFT JOIN categorias_productos cat ON ec.categoria_id = cat.id
                WHERE cp.cotizacion_id = ?
                ORDER BY cat.nombre, ec.nombre
            `, [orden.cotizacion_id]),
            // Transporte de la cotización
            pool.query(`
                SELECT
                    ct.id,
                    ct.tarifa_id,
                    ct.cantidad,
                    ct.precio_unitario,
                    ct.subtotal,
                    ct.notas,
                    t.tipo_camion,
                    c.nombre as ciudad
                FROM cotizacion_transportes ct
                INNER JOIN tarifas_transporte t ON ct.tarifa_id = t.id
                LEFT JOIN ciudades c ON t.ciudad_id = c.id
                WHERE ct.cotizacion_id = ?
            `, [orden.cotizacion_id]),
            // Elementos asignados al alquiler (si existe)
            orden.alquiler_id ? pool.query(`
                SELECT
                    ae.id,
                    ae.elemento_id,
                    ae.serie_id,
                    ae.lote_id,
                    ae.cantidad_lote,
                    ae.estado_salida,
                    ae.estado_retorno,
                    ae.costo_dano,
                    ae.notas_retorno,
                    e.nombre as elemento_nombre,
                    s.numero_serie,
                    l.lote_numero
                FROM alquiler_elementos ae
                INNER JOIN elementos e ON ae.elemento_id = e.id
                LEFT JOIN series s ON ae.serie_id = s.id
                LEFT JOIN lotes l ON ae.lote_id = l.id
                WHERE ae.alquiler_id = ?
                ORDER BY e.nombre
            `, [orden.alquiler_id]) : Promise.resolve([[]])
        ]);

        // Calcular resúmenes
        const productos = productosResult[0];
        const transporte = transporteResult[0];
        const alquilerElementos = alquilerElementosResult[0];

        const subtotalProductos = productos.reduce((sum, p) => sum + parseFloat(p.subtotal || 0), 0);
        const subtotalTransporte = transporte.reduce((sum, t) => sum + parseFloat(t.subtotal || 0), 0);
        const totalDeposito = productos.reduce((sum, p) => sum + (parseFloat(p.deposito || 0) * p.cantidad), 0);

        return {
            ...orden,
            productos,
            transporte,
            alquiler_elementos: alquilerElementos,
            resumen_cotizacion: {
                subtotal_productos: subtotalProductos,
                subtotal_transporte: subtotalTransporte,
                total_deposito: totalDeposito,
                total_productos: productos.length,
                total_transportes: transporte.length
            },
            resumen_elementos: {
                total: alquilerElementos.length,
                retornados: alquilerElementos.filter(e => e.estado_retorno).length,
                pendientes: alquilerElementos.filter(e => !e.estado_retorno).length,
                danados: alquilerElementos.filter(e => e.estado_retorno === 'dañado').length,
                perdidos: alquilerElementos.filter(e => e.estado_retorno === 'perdido').length
            }
        };
    }

    /**
     * Obtener órdenes de un alquiler
     * Optimizado: Usa JOIN con agregación en lugar de subconsulta correlacionada
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
                ot.prioridad,
                ot.direccion_evento,
                ot.ciudad_evento,
                v.placa as vehiculo_placa,
                v.marca as vehiculo_marca,
                COALESCE(equipo_count.total, 0) as total_equipo
            FROM ordenes_trabajo ot
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            LEFT JOIN (
                SELECT orden_id, COUNT(*) as total
                FROM orden_trabajo_equipo
                GROUP BY orden_id
            ) equipo_count ON equipo_count.orden_id = ot.id
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
            direccion_evento,
            ciudad_evento,
            notas,
            prioridad = 'normal',
            vehiculo_id,
            creado_por
        } = datos;

        const [result] = await pool.query(`
            INSERT INTO ordenes_trabajo
            (alquiler_id, tipo, estado, fecha_programada, direccion_evento, ciudad_evento, notas, prioridad, vehiculo_id, creado_por)
            VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?)
        `, [
            alquiler_id,
            tipo,
            fecha_programada,
            direccion_evento || null,
            ciudad_evento || null,
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
            'notas', 'prioridad', 'vehiculo_id'
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
     * Optimizado: Usa JOINs con agregación e incluye info de cotización
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
                ot.direccion_evento,
                ot.ciudad_evento,
                ot.prioridad,
                cot.id as cotizacion_id,
                cot.evento_nombre,
                cot.fecha_montaje,
                cot.fecha_evento,
                cot.fecha_desmontaje,
                cot.total as cotizacion_total,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                v.placa as vehiculo_placa,
                v.marca as vehiculo_marca,
                equipo_agg.equipo_nombres,
                equipo_agg.total_equipo
            FROM ordenes_trabajo ot
            LEFT JOIN alquileres a ON ot.alquiler_id = a.id
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id
            LEFT JOIN clientes c ON cot.cliente_id = c.id
            LEFT JOIN vehiculos v ON ot.vehiculo_id = v.id
            LEFT JOIN (
                SELECT
                    ote.orden_id,
                    GROUP_CONCAT(CONCAT(e.nombre, ' ', e.apellido) SEPARATOR ', ') as equipo_nombres,
                    COUNT(*) as total_equipo
                FROM orden_trabajo_equipo ote
                INNER JOIN empleados e ON ote.empleado_id = e.id
                GROUP BY ote.orden_id
            ) equipo_agg ON equipo_agg.orden_id = ot.id
            WHERE ot.fecha_programada >= ?
              AND ot.fecha_programada < DATE_ADD(?, INTERVAL 1 DAY)
              AND ot.estado != 'cancelado'
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

        // Obtener información del alquiler y cotización para dirección/ciudad
        const [alquilerInfo] = await pool.query(`
            SELECT
                cot.evento_direccion,
                cot.evento_ciudad
            FROM alquileres a
            LEFT JOIN cotizaciones cot ON a.cotizacion_id = cot.id
            WHERE a.id = ?
        `, [alquilerId]);

        const direccionEvento = alquilerInfo[0]?.evento_direccion || null;
        const ciudadEvento = alquilerInfo[0]?.evento_ciudad || null;

        // Crear orden de montaje
        const ordenMontaje = await this.crear({
            alquiler_id: alquilerId,
            tipo: 'montaje',
            fecha_programada: montaje.fecha,
            direccion_evento: direccionEvento,
            ciudad_evento: ciudadEvento,
            notas: montaje.notas,
            prioridad: montaje.prioridad || 'normal',
            creado_por
        });

        // Crear orden de desmontaje
        const ordenDesmontaje = await this.crear({
            alquiler_id: alquilerId,
            tipo: 'desmontaje',
            fecha_programada: desmontaje.fecha,
            direccion_evento: direccionEvento,
            ciudad_evento: ciudadEvento,
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

            // Actualizar estado de orden de montaje a "en_preparacion"
            // ya que los elementos fueron asignados automáticamente
            await pool.query(
                'UPDATE ordenes_trabajo SET estado = ? WHERE id = ?',
                ['en_preparacion', ordenMontaje.id]
            );
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

        // Próximas órdenes sin responsable asignado
        const [sinResponsable] = await pool.query(`
            SELECT COUNT(*) as total
            FROM ordenes_trabajo ot
            WHERE ot.estado IN ('pendiente', 'confirmado')
              AND ot.fecha_programada >= CURDATE()
              AND NOT EXISTS (
                  SELECT 1 FROM orden_trabajo_equipo WHERE orden_id = ot.id
              )
        `);

        return {
            ...stats[0],
            hoy: hoy[0],
            alertas: {
                sinResponsable: sinResponsable[0].total
            }
        };
    }
}

module.exports = OrdenTrabajoModel;
