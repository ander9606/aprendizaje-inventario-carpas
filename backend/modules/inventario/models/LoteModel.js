// ============================================
// MODEL: LoteModel
// Responsabilidad: Consultas SQL de lotes
// ============================================

const { pool } = require('../../../config/database');

class LoteModel {

    // ============================================
    // OBTENER TODOS LOS LOTES
    // ============================================
    static async obtenerTodos(tenantId) {
        const query = `
            SELECT
                l.id,
                l.elemento_id,
                l.lote_numero,
                l.cantidad,
                l.estado,
                l.ubicacion,
                l.created_at,
                e.nombre AS elemento_nombre,
                e.descripcion AS elemento_descripcion,
                c.nombre AS categoria
            FROM lotes l
            INNER JOIN elementos e ON l.elemento_id = e.id AND e.tenant_id = l.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = l.tenant_id
            WHERE l.tenant_id = ?
            ORDER BY e.nombre, l.lote_numero
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER LOTES CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion(tenantId, { limit, offset, sortBy = 'lote_numero', order = 'ASC', search = null }) {
        let query = `
            SELECT
                l.id,
                l.elemento_id,
                l.lote_numero,
                l.cantidad,
                l.estado,
                l.ubicacion,
                l.created_at,
                e.nombre AS elemento_nombre,
                e.descripcion AS elemento_descripcion,
                c.nombre AS categoria
            FROM lotes l
            INNER JOIN elementos e ON l.elemento_id = e.id AND e.tenant_id = l.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = l.tenant_id
            WHERE l.tenant_id = ?
        `;

        const params = [tenantId];

        if (search) {
            query += ` AND (l.lote_numero LIKE ? OR e.nombre LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const validSortFields = ['lote_numero', 'cantidad', 'estado', 'elemento_nombre'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'lote_numero';

        let orderByClause = '';
        if (sortField === 'elemento_nombre') {
            orderByClause = 'e.nombre';
        } else {
            orderByClause = `l.${sortField}`;
        }

        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${orderByClause} ${sortOrder}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // ============================================
    // CONTAR TOTAL DE LOTES
    // ============================================
    static async contarTodos(tenantId, search = null) {
        let query = `
            SELECT COUNT(*) as total
            FROM lotes l
            INNER JOIN elementos e ON l.elemento_id = e.id AND e.tenant_id = l.tenant_id
            WHERE l.tenant_id = ?
        `;
        const params = [tenantId];

        if (search) {
            query += ` AND (l.lote_numero LIKE ? OR e.nombre LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    // ============================================
    // OBTENER LOTE POR ID
    // ============================================
    static async obtenerPorId(tenantId, id) {
        const query = `
            SELECT
                l.*,
                e.nombre AS elemento_nombre,
                e.descripcion AS elemento_descripcion,
                c.nombre AS categoria
            FROM lotes l
            INNER JOIN elementos e ON l.elemento_id = e.id AND e.tenant_id = l.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = l.tenant_id
            WHERE l.id = ? AND l.tenant_id = ?
        `;

        const [rows] = await pool.query(query, [id, tenantId]);
        return rows[0];
    }

    // ============================================
    // OBTENER LOTES DE UN ELEMENTO
    // ============================================
    static async obtenerPorElemento(tenantId, elementoId) {
        const query = `
            SELECT
                l.id,
                l.lote_numero,
                l.cantidad,
                l.estado,
                l.ubicacion,
                l.created_at
            FROM lotes l
            WHERE l.elemento_id = ? AND l.tenant_id = ?
            ORDER BY l.lote_numero DESC
        `;

        const [rows] = await pool.query(query, [elementoId, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER LOTES POR ESTADO
    // ============================================
    static async obtenerPorEstado(tenantId, estado) {
        const query = `
            SELECT
                l.*,
                e.nombre AS elemento_nombre,
                c.nombre AS categoria
            FROM lotes l
            INNER JOIN elementos e ON l.elemento_id = e.id AND e.tenant_id = l.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = l.tenant_id
            WHERE l.estado = ? AND l.tenant_id = ?
            ORDER BY e.nombre, l.lote_numero
        `;

        const [rows] = await pool.query(query, [estado, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER ESTADÍSTICAS DE LOTES POR ELEMENTO
    // ============================================
    static async obtenerEstadisticas(tenantId, elementoId) {
        const query = `
            SELECT
                COUNT(*) AS total_lotes,
                COALESCE(SUM(cantidad), 0) AS cantidad_total,
                COALESCE(SUM(CASE WHEN estado = 'bueno' THEN cantidad ELSE 0 END), 0) AS disponibles,
                COALESCE(SUM(CASE WHEN estado = 'alquilado' THEN cantidad ELSE 0 END), 0) AS alquilados,
                COALESCE(SUM(CASE WHEN estado = 'mantenimiento' THEN cantidad ELSE 0 END), 0) AS en_mantenimiento,
                COALESCE(SUM(CASE WHEN estado = 'dañado' THEN cantidad ELSE 0 END), 0) AS dañados
            FROM lotes
            WHERE elemento_id = ? AND tenant_id = ?
        `;

        const [rows] = await pool.query(query, [elementoId, tenantId]);
        return rows[0];
    }

    // ============================================
    // CREAR NUEVO LOTE
    // ============================================
    static async crear(tenantId, datos) {
        const {
            elemento_id,
            lote_numero,
            cantidad,
            estado,
            ubicacion,
            ubicacion_id
        } = datos;

        const query = `
            INSERT INTO lotes
            (tenant_id, elemento_id, lote_numero, cantidad, estado, ubicacion, ubicacion_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            tenantId,
            elemento_id,
            lote_numero,
            cantidad || 0,
            estado || 'bueno',
            ubicacion || null,
            ubicacion_id || null
        ]);

        return result.insertId;
    }

    // ============================================
    // BUSCAR LOTE ESPECÍFICO (por elemento, estado y ubicación)
    // ============================================
    static async buscarLoteEspecifico(tenantId, elementoId, estado, ubicacion) {
        const query = `
            SELECT * FROM lotes
            WHERE elemento_id = ?
            AND estado = ?
            AND ubicacion ${ubicacion === null ? 'IS NULL' : '= ?'}
            AND tenant_id = ?
            LIMIT 1
        `;

        const params = ubicacion === null
            ? [elementoId, estado, tenantId]
            : [elementoId, estado, ubicacion, tenantId];

        const [rows] = await pool.query(query, params);
        return rows[0];
    }

    // ============================================
    // SUMAR CANTIDAD A UN LOTE
    // ============================================
    static async sumarCantidad(tenantId, id, cantidad) {
        const query = `
            UPDATE lotes
            SET cantidad = cantidad + ?
            WHERE id = ? AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [cantidad, id, tenantId]);
        return result.affectedRows;
    }

    // ============================================
    // RESTAR CANTIDAD DE UN LOTE
    // ============================================
    static async restarCantidad(tenantId, id, cantidad) {
        const query = `
            UPDATE lotes
            SET cantidad = cantidad - ?
            WHERE id = ? AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [cantidad, id, tenantId]);
        return result.affectedRows;
    }

    // ============================================
    // ACTUALIZAR CANTIDAD DE UN LOTE (set absoluto)
    // ============================================
    static async actualizarCantidad(tenantId, id, cantidad) {
        const query = `
            UPDATE lotes
            SET cantidad = ?
            WHERE id = ? AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [cantidad, id, tenantId]);
        return result.affectedRows;
    }

    // ============================================
    // ELIMINAR LOTE
    // ============================================
    static async eliminar(tenantId, id) {
        const [result] = await pool.query(
            'DELETE FROM lotes WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return result.affectedRows;
    }

    // ============================================
    // REGISTRAR MOVIMIENTO EN HISTORIAL
    // ============================================
    static async registrarMovimiento(tenantId, datos) {
        const {
            lote_origen_id,
            lote_destino_id,
            cantidad,
            motivo,
            descripcion,
            estado_origen,
            estado_destino,
            ubicacion_origen,
            ubicacion_destino,
            costo_reparacion
        } = datos;

        const query = `
            INSERT INTO lotes_movimientos
            (tenant_id, lote_origen_id, lote_destino_id, cantidad, motivo, descripcion,
             estado_origen, estado_destino, ubicacion_origen, ubicacion_destino, costo_reparacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            tenantId,
            lote_origen_id,
            lote_destino_id,
            cantidad,
            motivo || null,
            descripcion || null,
            estado_origen,
            estado_destino,
            ubicacion_origen || null,
            ubicacion_destino || null,
            costo_reparacion || null
        ]);

        return result.insertId;
    }

    // ============================================
    // OBTENER HISTORIAL DE MOVIMIENTOS DE UN LOTE
    // ============================================
    static async obtenerHistorial(tenantId, loteId) {
        const query = `
            SELECT
                h.*,
                lo.lote_numero AS lote_origen_numero,
                ld.lote_numero AS lote_destino_numero
            FROM lotes_movimientos h
            LEFT JOIN lotes lo ON h.lote_origen_id = lo.id AND lo.tenant_id = h.tenant_id
            LEFT JOIN lotes ld ON h.lote_destino_id = ld.id AND ld.tenant_id = h.tenant_id
            WHERE (h.lote_origen_id = ? OR h.lote_destino_id = ?) AND h.tenant_id = ?
            ORDER BY h.fecha_movimiento DESC
        `;

        const [rows] = await pool.query(query, [loteId, loteId, tenantId]);
        return rows;
    }

    // ============================================
    // MOVER CANTIDAD PARA ALQUILER
    // ============================================
    static async moverParaAlquiler(tenantId, loteOrigenId, cantidad, alquilerId) {
        const loteOrigen = await this.obtenerPorId(tenantId, loteOrigenId);
        if (!loteOrigen) {
            throw new Error('Lote origen no encontrado');
        }

        if (loteOrigen.cantidad < cantidad) {
            throw new Error(`Cantidad insuficiente en lote. Disponible: ${loteOrigen.cantidad}, Solicitado: ${cantidad}`);
        }

        let loteDestino = await this.buscarLoteEspecifico(
            tenantId,
            loteOrigen.elemento_id,
            'alquilado',
            null
        );

        let loteDestinoId;

        if (loteDestino) {
            await this.sumarCantidad(tenantId, loteDestino.id, cantidad);
            loteDestinoId = loteDestino.id;
        } else {
            loteDestinoId = await this.crear(tenantId, {
                elemento_id: loteOrigen.elemento_id,
                cantidad: cantidad,
                estado: 'alquilado',
                ubicacion: null,
                lote_numero: `ALQUILER-${alquilerId}-${Date.now()}`
            });
        }

        await this.restarCantidad(tenantId, loteOrigenId, cantidad);

        await this.registrarMovimiento(tenantId, {
            lote_origen_id: loteOrigenId,
            lote_destino_id: loteDestinoId,
            cantidad: cantidad,
            motivo: 'alquiler',
            descripcion: `Alquiler #${alquilerId}`,
            estado_origen: loteOrigen.estado,
            estado_destino: 'alquilado',
            ubicacion_origen: loteOrigen.ubicacion,
            ubicacion_destino: null
        });

        return loteDestinoId;
    }

    // ============================================
    // RETORNAR CANTIDAD DE ALQUILER
    // ============================================
    static async retornarDeAlquiler(tenantId, loteAlquiladoId, cantidad, estadoRetorno, ubicacionDestinoId, alquilerId) {
        const loteAlquilado = await this.obtenerPorId(tenantId, loteAlquiladoId);
        if (!loteAlquilado) {
            throw new Error('Lote alquilado no encontrado');
        }

        if (loteAlquilado.cantidad < cantidad) {
            throw new Error(`Cantidad insuficiente. Disponible: ${loteAlquilado.cantidad}`);
        }

        let estadoLote = 'bueno';
        if (estadoRetorno === 'dañado') estadoLote = 'dañado';
        if (estadoRetorno === 'perdido') estadoLote = 'agotado';

        let ubicacionNombre = null;
        if (ubicacionDestinoId) {
            const [ubic] = await pool.query(
                'SELECT nombre FROM ubicaciones WHERE id = ? AND tenant_id = ?',
                [ubicacionDestinoId, tenantId]
            );
            if (ubic.length > 0) ubicacionNombre = ubic[0].nombre;
        }

        let loteDestino = await this.buscarLoteEspecifico(
            tenantId,
            loteAlquilado.elemento_id,
            estadoLote,
            ubicacionNombre
        );

        let loteDestinoId;

        if (loteDestino) {
            await this.sumarCantidad(tenantId, loteDestino.id, cantidad);
            loteDestinoId = loteDestino.id;
        } else {
            loteDestinoId = await this.crear(tenantId, {
                elemento_id: loteAlquilado.elemento_id,
                cantidad: cantidad,
                estado: estadoLote,
                ubicacion: ubicacionNombre,
                ubicacion_id: ubicacionDestinoId,
                lote_numero: `RETORNO-${alquilerId}-${Date.now()}`
            });
        }

        await this.restarCantidad(tenantId, loteAlquiladoId, cantidad);

        await this.registrarMovimiento(tenantId, {
            lote_origen_id: loteAlquiladoId,
            lote_destino_id: loteDestinoId,
            cantidad: cantidad,
            motivo: 'retorno_alquiler',
            descripcion: `Retorno alquiler #${alquilerId}`,
            estado_origen: 'alquilado',
            estado_destino: estadoLote,
            ubicacion_origen: null,
            ubicacion_destino: ubicacionNombre
        });

        return loteDestinoId;
    }

    // ============================================
    // OBTENER LOTES CON CONTEXTO DE ALQUILER
    // ============================================
    static async obtenerPorElementoConContexto(tenantId, elementoId) {
        const estadisticas = await this.obtenerEstadisticas(tenantId, elementoId);

        const queryLotes = `
            SELECT
                l.id,
                l.lote_numero,
                l.cantidad,
                l.estado,
                l.ubicacion,
                l.ubicacion_id,
                u.nombre AS ubicacion_nombre,
                u.tipo AS ubicacion_tipo,
                l.created_at
            FROM lotes l
            LEFT JOIN ubicaciones u ON l.ubicacion_id = u.id AND u.tenant_id = l.tenant_id
            WHERE l.elemento_id = ?
              AND l.cantidad > 0
              AND l.tenant_id = ?
            ORDER BY l.ubicacion, l.estado, l.lote_numero
        `;
        const [lotes] = await pool.query(queryLotes, [elementoId, tenantId]);

        const queryAlquilados = `
            SELECT
                ae.cantidad_lote,
                ae.lote_id,
                ae.lote_alquilado_id,
                a.id AS alquiler_id,
                a.estado AS alquiler_estado,
                c.evento_nombre,
                c.fecha_evento,
                c.fecha_desmontaje,
                c.evento_direccion,
                c.evento_ciudad,
                cl.nombre AS cliente_nombre
            FROM alquiler_elementos ae
            INNER JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = ae.tenant_id
            INNER JOIN cotizaciones c ON a.cotizacion_id = c.id AND c.tenant_id = ae.tenant_id
            INNER JOIN clientes cl ON c.cliente_id = cl.id AND cl.tenant_id = ae.tenant_id
            WHERE ae.elemento_id = ?
              AND ae.tenant_id = ?
              AND a.estado IN ('programado', 'activo')
              AND ae.lote_id IS NOT NULL
            ORDER BY c.fecha_evento ASC
        `;
        const [alquilados] = await pool.query(queryAlquilados, [elementoId, tenantId]);

        const lotesPorUbicacion = {};

        lotes.forEach(lote => {
            const ubicKey = lote.ubicacion || 'Sin ubicación';

            if (!lotesPorUbicacion[ubicKey]) {
                lotesPorUbicacion[ubicKey] = {
                    ubicacion: ubicKey,
                    ubicacion_id: lote.ubicacion_id,
                    ubicacion_tipo: lote.ubicacion_tipo,
                    lotes: [],
                    total: 0
                };
            }

            lotesPorUbicacion[ubicKey].lotes.push(lote);
            lotesPorUbicacion[ubicKey].total += lote.cantidad;
        });

        const cantidadPorEvento = alquilados.reduce((acc, item) => {
            const key = item.alquiler_id;
            if (!acc[key]) {
                acc[key] = {
                    alquiler_id: item.alquiler_id,
                    estado: item.alquiler_estado,
                    evento_nombre: item.evento_nombre,
                    fecha_evento: item.fecha_evento,
                    fecha_desmontaje: item.fecha_desmontaje,
                    ubicacion: item.evento_direccion,
                    ciudad: item.evento_ciudad,
                    cliente: item.cliente_nombre,
                    cantidad: 0
                };
            }
            acc[key].cantidad += item.cantidad_lote || 0;
            return acc;
        }, {});

        return {
            estadisticas,
            lotes_por_ubicacion: Object.values(lotesPorUbicacion),
            en_eventos: Object.values(cantidadPorEvento),
            total_en_eventos: alquilados.reduce((sum, a) => sum + (a.cantidad_lote || 0), 0)
        };
    }

    // ============================================
    // OBTENER DESGLOSE DE ALQUILERES POR ELEMENTO
    // ============================================
    static async obtenerDesgloseAlquileres(tenantId, elementoId) {
        const query = `
            SELECT
                ae.id AS alquiler_elemento_id,
                ae.cantidad_lote,
                ae.estado_salida,
                ae.fecha_asignacion,
                a.id AS alquiler_id,
                a.estado AS alquiler_estado,
                c.evento_nombre,
                c.fecha_montaje,
                c.fecha_evento,
                c.fecha_desmontaje,
                c.evento_direccion,
                c.evento_ciudad,
                cl.id AS cliente_id,
                cl.nombre AS cliente_nombre,
                cl.telefono AS cliente_telefono
            FROM alquiler_elementos ae
            INNER JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = ae.tenant_id
            INNER JOIN cotizaciones c ON a.cotizacion_id = c.id AND c.tenant_id = ae.tenant_id
            INNER JOIN clientes cl ON c.cliente_id = cl.id AND cl.tenant_id = ae.tenant_id
            WHERE ae.elemento_id = ?
              AND ae.tenant_id = ?
              AND a.estado IN ('programado', 'activo')
              AND ae.lote_id IS NOT NULL
            ORDER BY c.fecha_montaje ASC
        `;

        const [rows] = await pool.query(query, [elementoId, tenantId]);

        const porEvento = rows.reduce((acc, row) => {
            const key = row.alquiler_id;
            if (!acc[key]) {
                acc[key] = {
                    alquiler_id: row.alquiler_id,
                    estado: row.alquiler_estado,
                    evento: {
                        nombre: row.evento_nombre,
                        fecha_montaje: row.fecha_montaje,
                        fecha_evento: row.fecha_evento,
                        fecha_desmontaje: row.fecha_desmontaje,
                        ubicacion: row.evento_direccion,
                        ciudad: row.evento_ciudad
                    },
                    cliente: {
                        id: row.cliente_id,
                        nombre: row.cliente_nombre,
                        telefono: row.cliente_telefono
                    },
                    cantidad_total: 0
                };
            }
            acc[key].cantidad_total += row.cantidad_lote || 0;
            return acc;
        }, {});

        return Object.values(porEvento);
    }
}

module.exports = LoteModel;
