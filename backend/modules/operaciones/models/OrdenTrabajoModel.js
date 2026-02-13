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
            buscar = null,
            tipo = null,
            estado = null,
            excluir_finalizados = false,
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

        // Búsqueda de texto: cliente, evento, producto, notas, ciudad
        if (buscar) {
            const termino = `%${buscar}%`;
            whereClause += ` AND (
                c.nombre LIKE ?
                OR cot.evento_nombre LIKE ?
                OR ot.notas LIKE ?
                OR ot.ciudad_evento LIKE ?
                OR cot.evento_ciudad LIKE ?
                OR EXISTS (
                    SELECT 1 FROM cotizacion_productos cp2
                    INNER JOIN elementos_compuestos ec2 ON cp2.compuesto_id = ec2.id
                    WHERE cp2.cotizacion_id = cot.id AND ec2.nombre LIKE ?
                )
            )`;
            params.push(termino, termino, termino, termino, termino, termino);
        }

        if (tipo) {
            whereClause += ` AND ot.tipo = ?`;
            params.push(tipo);
        }

        if (estado) {
            whereClause += ` AND ot.estado = ?`;
            params.push(estado);
        }

        if (excluir_finalizados) {
            whereClause += ` AND ot.estado NOT IN ('completado', 'cancelado')`;
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
                COALESCE(equipo_count.total, 0) as total_equipo,
                COALESCE(prod_count.total, 0) as total_productos
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
            LEFT JOIN (
                SELECT cotizacion_id, COUNT(*) as total
                FROM cotizacion_productos
                GROUP BY cotizacion_id
            ) prod_count ON prod_count.cotizacion_id = cot.id
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

        // Si es desmontaje, incluir estado del montaje relacionado
        if (orden.tipo === 'desmontaje' && orden.alquiler_id) {
            const [montajeRows] = await pool.query(
                `SELECT id, estado FROM ordenes_trabajo WHERE alquiler_id = ? AND tipo = 'montaje' AND estado != 'cancelado' LIMIT 1`,
                [orden.alquiler_id]
            );
            if (montajeRows.length > 0) {
                orden.montaje_id = montajeRows[0].id;
                orden.montaje_estado = montajeRows[0].estado;
            }
        }

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
                alquiler_elementos: [],
                orden_elementos: [],
                elementos_cargue: []
            };
        }

        // Ejecutar queries adicionales en paralelo
        const [productosResult, transporteResult, alquilerElementosResult, ordenElementosResult, componentesResult] = await Promise.all([
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
            // Elementos asignados al alquiler (después de ejecutar salida)
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
                    s.numero_serie as serie_codigo,
                    l.lote_numero as lote_codigo
                FROM alquiler_elementos ae
                INNER JOIN elementos e ON ae.elemento_id = e.id
                LEFT JOIN series s ON ae.serie_id = s.id
                LEFT JOIN lotes l ON ae.lote_id = l.id
                WHERE ae.alquiler_id = ?
                ORDER BY e.nombre
            `, [orden.alquiler_id]) : Promise.resolve([[]]),
            // Elementos asignados a la orden (antes de ejecutar salida)
            pool.query(`
                SELECT
                    ote.id,
                    ote.elemento_id,
                    ote.serie_id,
                    ote.lote_id,
                    ote.cantidad,
                    ote.estado,
                    e.nombre as elemento_nombre,
                    s.numero_serie as serie_codigo,
                    l.lote_numero as lote_codigo
                FROM orden_trabajo_elementos ote
                INNER JOIN elementos e ON ote.elemento_id = e.id
                LEFT JOIN series s ON ote.serie_id = s.id
                LEFT JOIN lotes l ON ote.lote_id = l.id
                WHERE ote.orden_id = ?
                ORDER BY e.nombre
            `, [id]),
            // Mapa de elemento_id → compuesto_id para vincular elementos con productos
            orden.cotizacion_id ? pool.query(`
                SELECT DISTINCT cc.elemento_id, cc.compuesto_id
                FROM compuesto_componentes cc
                WHERE cc.compuesto_id IN (
                    SELECT cp.compuesto_id FROM cotizacion_productos cp WHERE cp.cotizacion_id = ?
                )
            `, [orden.cotizacion_id]) : Promise.resolve([[]])
        ]);

        // Calcular resúmenes
        const productos = productosResult[0];
        const transporte = transporteResult[0];
        const alquilerElementos = alquilerElementosResult[0];
        const ordenElementos = ordenElementosResult[0];
        const componentesMap = (componentesResult || [[]])[0];

        // Crear mapa elemento_id → compuesto_id para vincular elementos con productos
        const elementoToCompuesto = {};
        if (componentesMap) {
            componentesMap.forEach(c => {
                elementoToCompuesto[c.elemento_id] = c.compuesto_id;
            });
        }

        // Agregar compuesto_id a cada elemento
        const tagElementos = (elems) => elems.map(e => ({
            ...e,
            compuesto_id: elementoToCompuesto[e.elemento_id] || null
        }));

        const alquilerElementosTagged = tagElementos(alquilerElementos);
        const ordenElementosTagged = tagElementos(ordenElementos);

        const subtotalProductos = productos.reduce((sum, p) => sum + parseFloat(p.subtotal || 0), 0);
        const subtotalTransporte = transporte.reduce((sum, t) => sum + parseFloat(t.subtotal || 0), 0);
        const totalDeposito = productos.reduce((sum, p) => sum + (parseFloat(p.deposito || 0) * p.cantidad), 0);

        // Usar orden_elementos para el resumen de cargue (antes de salida)
        // y alquiler_elementos para retornos (después de salida)
        const elementosParaCargue = ordenElementosTagged.length > 0 ? ordenElementosTagged : alquilerElementosTagged;

        return {
            ...orden,
            productos,
            transporte,
            alquiler_elementos: alquilerElementosTagged,
            orden_elementos: ordenElementosTagged, // Elementos asignados a la orden (para cargue)
            elementos_cargue: elementosParaCargue, // Elementos para mostrar en modal de cargue
            resumen_cotizacion: {
                subtotal_productos: subtotalProductos,
                subtotal_transporte: subtotalTransporte,
                total_deposito: totalDeposito,
                total_productos: productos.length,
                total_transportes: transporte.length
            },
            resumen_elementos: {
                total: elementosParaCargue.length,
                retornados: alquilerElementosTagged.filter(e => e.estado_retorno).length,
                pendientes: alquilerElementosTagged.filter(e => !e.estado_retorno).length,
                danados: alquilerElementosTagged.filter(e => e.estado_retorno === 'dañado').length,
                perdidos: alquilerElementosTagged.filter(e => e.estado_retorno === 'perdido').length
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

    // ============================================
    // HISTORIAL DE ESTADOS Y DURACIONES
    // ============================================

    /**
     * Registrar cambio de estado en historial
     * @param {number} ordenId
     * @param {string} estadoAnterior
     * @param {string} estadoNuevo
     * @param {number|null} cambiadoPor - ID del empleado
     */
    static async registrarCambioEstado(ordenId, estadoAnterior, estadoNuevo, cambiadoPor = null) {
        try {
            await pool.query(`
                INSERT INTO orden_trabajo_historial_estados
                (orden_id, estado_anterior, estado_nuevo, cambiado_por)
                VALUES (?, ?, ?, ?)
            `, [ordenId, estadoAnterior || null, estadoNuevo, cambiadoPor]);
        } catch (error) {
            // Si la tabla no existe aún, no bloquear la operación principal
            if (error.code === 'ER_NO_SUCH_TABLE') return;
            throw error;
        }
    }

    /**
     * Obtener historial de estados de una orden
     * @param {number} ordenId
     * @returns {Promise<Array>}
     */
    static async obtenerHistorialEstados(ordenId) {
        try {
            const [rows] = await pool.query(`
                SELECT
                    h.id,
                    h.estado_anterior,
                    h.estado_nuevo,
                    h.created_at,
                    e.nombre as cambiado_por_nombre,
                    e.apellido as cambiado_por_apellido
                FROM orden_trabajo_historial_estados h
                LEFT JOIN empleados e ON h.cambiado_por = e.id
                WHERE h.orden_id = ?
                ORDER BY h.created_at ASC
            `, [ordenId]);

            return rows;
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') return [];
            throw error;
        }
    }

    /**
     * Calcular duraciones de una orden basado en historial de estados
     * Montaje: mide en_proceso → completado (trabajo en sitio)
     * Desmontaje: mide en_sitio → completado (desmontaje en sitio)
     * También: en_preparacion → en_ruta (preparación)
     *          en_ruta → en_sitio (desplazamiento)
     *          total: primer registro → completado
     * @param {number} ordenId
     * @returns {Promise<Object>}
     */
    static async calcularDuraciones(ordenId) {
        const historial = await this.obtenerHistorialEstados(ordenId);

        if (historial.length === 0) {
            return { historial: [], duraciones: null };
        }

        // Extraer primer timestamp por cada estado
        const timestamps = {};
        historial.forEach(h => {
            if (!timestamps[h.estado_nuevo]) {
                timestamps[h.estado_nuevo] = h.created_at;
            }
        });

        const calcDiff = (desde, hasta) => {
            if (!timestamps[desde] || !timestamps[hasta]) return null;
            const ms = new Date(timestamps[hasta]) - new Date(timestamps[desde]);
            if (ms < 0) return null;
            return ms;
        };

        const duraciones = {
            preparacion_ms: calcDiff('en_preparacion', 'en_ruta'),
            desplazamiento_ms: calcDiff('en_ruta', 'en_sitio'),
            trabajo_montaje_ms: calcDiff('en_proceso', 'completado'),
            trabajo_desmontaje_ms: calcDiff('en_sitio', 'completado'),
            total_ms: null
        };

        // Total: primer registro → completado
        const primerTimestamp = historial[0]?.created_at;
        if (primerTimestamp && timestamps['completado']) {
            duraciones.total_ms = new Date(timestamps['completado']) - new Date(primerTimestamp);
        }

        duraciones.timestamps = {
            inicio: primerTimestamp || null,
            en_preparacion: timestamps['en_preparacion'] || null,
            en_ruta: timestamps['en_ruta'] || null,
            en_sitio: timestamps['en_sitio'] || null,
            en_proceso: timestamps['en_proceso'] || null,
            completado: timestamps['completado'] || null
        };

        return { historial, duraciones };
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
