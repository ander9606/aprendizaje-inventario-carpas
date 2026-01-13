// ============================================
// MODEL: LoteModel
// Responsabilidad: Consultas SQL de lotes
// ============================================

const { pool } = require('../../../config/database');

class LoteModel {

    // ============================================
    // OBTENER TODOS LOS LOTES
    // ============================================
    static async obtenerTodos() {
        try {
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
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                ORDER BY e.nombre, l.lote_numero
            `;

            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER LOTES CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion({ limit, offset, sortBy = 'lote_numero', order = 'ASC', search = null }) {
        try {
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
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
            `;

            const params = [];

            // Agregar búsqueda si existe
            if (search) {
                query += ` WHERE l.lote_numero LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            // Agregar ordenamiento
            const validSortFields = ['lote_numero', 'cantidad', 'estado', 'elemento_nombre'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'lote_numero';

            // Mapear campo de ordenamiento a columna real
            let orderByClause = '';
            if (sortField === 'elemento_nombre') {
                orderByClause = 'e.nombre';
            } else {
                orderByClause = `l.${sortField}`;
            }

            const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${orderByClause} ${sortOrder}`;

            // Agregar paginación
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // CONTAR TOTAL DE LOTES
    // ============================================
    static async contarTodos(search = null) {
        try {
            let query = `
                SELECT COUNT(*) as total
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
            `;
            const params = [];

            if (search) {
                query += ` WHERE l.lote_numero LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            const [rows] = await pool.query(query, params);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER LOTE POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT
                    l.*,
                    e.nombre AS elemento_nombre,
                    e.descripcion AS elemento_descripcion,
                    c.nombre AS categoria
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                WHERE l.id = ?
            `;

            const [rows] = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER LOTES DE UN ELEMENTO
    // ============================================
    static async obtenerPorElemento(elementoId) {
        try {
            const query = `
                SELECT
                    l.id,
                    l.lote_numero,
                    l.cantidad,
                    l.estado,
                    l.ubicacion,
                    l.created_at
                FROM lotes l
                WHERE l.elemento_id = ?
                ORDER BY l.lote_numero DESC
            `;

            const [rows] = await pool.query(query, [elementoId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER LOTES POR ESTADO
    // ============================================
    static async obtenerPorEstado(estado) {
        try {
            const query = `
                SELECT
                    l.*,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM lotes l
                INNER JOIN elementos e ON l.elemento_id = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                WHERE l.estado = ?
                ORDER BY e.nombre, l.lote_numero
            `;

            const [rows] = await pool.query(query, [estado]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER ESTADÍSTICAS DE LOTES POR ELEMENTO
    // ============================================
    static async obtenerEstadisticas(elementoId) {
        try {
            const query = `
                SELECT
                    COUNT(*) AS total_lotes,
                    COALESCE(SUM(cantidad), 0) AS cantidad_total,
                    COALESCE(SUM(CASE WHEN estado = 'bueno' THEN cantidad ELSE 0 END), 0) AS disponibles,
                    COALESCE(SUM(CASE WHEN estado = 'alquilado' THEN cantidad ELSE 0 END), 0) AS alquilados,
                    COALESCE(SUM(CASE WHEN estado = 'mantenimiento' THEN cantidad ELSE 0 END), 0) AS en_mantenimiento,
                    COALESCE(SUM(CASE WHEN estado = 'dañado' THEN cantidad ELSE 0 END), 0) AS dañados
                FROM lotes
                WHERE elemento_id = ?
            `;

            const [rows] = await pool.query(query, [elementoId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // CREAR NUEVO LOTE
    // ============================================
    static async crear(datos) {
        try {
            const {
                elemento_id,
                lote_numero,
                cantidad,
                estado,
                ubicacion
            } = datos;

            const query = `
                INSERT INTO lotes
                (elemento_id, lote_numero, cantidad, estado, ubicacion)
                VALUES (?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                elemento_id,
                lote_numero,
                cantidad || 0,
                estado || 'bueno',
                ubicacion || null
            ]);

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // BUSCAR LOTE ESPECÍFICO (por elemento, estado y ubicación)
    // ============================================
    static async buscarLoteEspecifico(elementoId, estado, ubicacion) {
        try {
            const query = `
                SELECT * FROM lotes
                WHERE elemento_id = ?
                AND estado = ?
                AND ubicacion = ?
                LIMIT 1
            `;

            const [rows] = await pool.query(query, [elementoId, estado, ubicacion]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // SUMAR CANTIDAD A UN LOTE
    // ============================================
    static async sumarCantidad(id, cantidad) {
        try {
            const query = `
                UPDATE lotes
                SET cantidad = cantidad + ?
                WHERE id = ?
            `;

            const [result] = await pool.query(query, [cantidad, id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // RESTAR CANTIDAD DE UN LOTE
    // ============================================
    static async restarCantidad(id, cantidad) {
        try {
            const query = `
                UPDATE lotes
                SET cantidad = cantidad - ?
                WHERE id = ?
            `;

            const [result] = await pool.query(query, [cantidad, id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // ACTUALIZAR CANTIDAD DE UN LOTE (set absoluto)
    // ============================================
    static async actualizarCantidad(id, cantidad) {
        try {
            const query = `
                UPDATE lotes
                SET cantidad = ?
                WHERE id = ?
            `;

            const [result] = await pool.query(query, [cantidad, id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // ELIMINAR LOTE
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM lotes WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // REGISTRAR MOVIMIENTO EN HISTORIAL
    // ============================================
    static async registrarMovimiento(datos) {
        try {
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
                (lote_origen_id, lote_destino_id, cantidad, motivo, descripcion,
                 estado_origen, estado_destino, ubicacion_origen, ubicacion_destino, costo_reparacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
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
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER HISTORIAL DE MOVIMIENTOS DE UN LOTE
    // ============================================
    static async obtenerHistorial(loteId) {
        try {
            const query = `
                SELECT
                    h.*,
                    lo.lote_numero AS lote_origen_numero,
                    ld.lote_numero AS lote_destino_numero
                FROM lotes_movimientos h
                LEFT JOIN lotes lo ON h.lote_origen_id = lo.id
                LEFT JOIN lotes ld ON h.lote_destino_id = ld.id
                WHERE h.lote_origen_id = ? OR h.lote_destino_id = ?
                ORDER BY h.fecha_movimiento DESC
            `;

            const [rows] = await pool.query(query, [loteId, loteId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // MOVER CANTIDAD PARA ALQUILER
    // Mueve cantidad de un lote a estado 'alquilado'
    // Retorna el ID del lote destino
    // ============================================
    static async moverParaAlquiler(loteOrigenId, cantidad, alquilerId) {
        try {
            const loteOrigen = await this.obtenerPorId(loteOrigenId);
            if (!loteOrigen) {
                throw new Error('Lote origen no encontrado');
            }

            if (loteOrigen.cantidad < cantidad) {
                throw new Error(`Cantidad insuficiente en lote. Disponible: ${loteOrigen.cantidad}, Solicitado: ${cantidad}`);
            }

            // Buscar o crear lote destino con estado 'alquilado'
            let loteDestino = await this.buscarLoteEspecifico(
                loteOrigen.elemento_id,
                'alquilado',
                null  // ubicación null para alquilados
            );

            let loteDestinoId;

            if (loteDestino) {
                await this.sumarCantidad(loteDestino.id, cantidad);
                loteDestinoId = loteDestino.id;
            } else {
                loteDestinoId = await this.crear({
                    elemento_id: loteOrigen.elemento_id,
                    cantidad: cantidad,
                    estado: 'alquilado',
                    ubicacion: null,
                    lote_numero: `ALQUILER-${alquilerId}-${Date.now()}`
                });
            }

            // Restar del lote origen
            await this.restarCantidad(loteOrigenId, cantidad);

            // Registrar movimiento
            await this.registrarMovimiento({
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

            // Si lote origen quedó vacío, no eliminarlo (mantener para historial)

            return loteDestinoId;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // RETORNAR CANTIDAD DE ALQUILER
    // Mueve cantidad de 'alquilado' de vuelta a estado original
    // ============================================
    static async retornarDeAlquiler(loteAlquiladoId, cantidad, estadoRetorno, ubicacionDestinoId, alquilerId) {
        try {
            const loteAlquilado = await this.obtenerPorId(loteAlquiladoId);
            if (!loteAlquilado) {
                throw new Error('Lote alquilado no encontrado');
            }

            if (loteAlquilado.cantidad < cantidad) {
                throw new Error(`Cantidad insuficiente. Disponible: ${loteAlquilado.cantidad}`);
            }

            // Mapear estado de retorno a estado de lote
            let estadoLote = 'disponible';
            if (estadoRetorno === 'dañado') estadoLote = 'mantenimiento';
            if (estadoRetorno === 'perdido') estadoLote = 'baja';

            // Obtener nombre de ubicación
            let ubicacionNombre = null;
            if (ubicacionDestinoId) {
                const [ubic] = await pool.query('SELECT nombre FROM ubicaciones WHERE id = ?', [ubicacionDestinoId]);
                if (ubic.length > 0) ubicacionNombre = ubic[0].nombre;
            }

            // Buscar o crear lote destino
            let loteDestino = await this.buscarLoteEspecifico(
                loteAlquilado.elemento_id,
                estadoLote,
                ubicacionNombre
            );

            let loteDestinoId;

            if (loteDestino) {
                await this.sumarCantidad(loteDestino.id, cantidad);
                loteDestinoId = loteDestino.id;
            } else {
                loteDestinoId = await this.crear({
                    elemento_id: loteAlquilado.elemento_id,
                    cantidad: cantidad,
                    estado: estadoLote,
                    ubicacion: ubicacionNombre,
                    ubicacion_id: ubicacionDestinoId,
                    lote_numero: `RETORNO-${alquilerId}-${Date.now()}`
                });
            }

            // Restar del lote alquilado
            await this.restarCantidad(loteAlquiladoId, cantidad);

            // Registrar movimiento
            await this.registrarMovimiento({
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
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER LOTES CON CONTEXTO DE ALQUILER ✨ NUEVO
    // Incluye desglose de cantidades por evento
    // ============================================
    static async obtenerPorElementoConContexto(elementoId) {
        try {
            // 1. Obtener estadísticas generales
            const estadisticas = await this.obtenerEstadisticas(elementoId);

            // 2. Obtener lotes agrupados por ubicación y estado
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
                LEFT JOIN ubicaciones u ON l.ubicacion_id = u.id
                WHERE l.elemento_id = ?
                  AND l.cantidad > 0
                ORDER BY l.ubicacion, l.estado, l.lote_numero
            `;
            const [lotes] = await pool.query(queryLotes, [elementoId]);

            // 3. Obtener desglose de cantidades alquiladas por evento
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
                INNER JOIN alquileres a ON ae.alquiler_id = a.id
                INNER JOIN cotizaciones c ON a.cotizacion_id = c.id
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                WHERE ae.elemento_id = ?
                  AND a.estado IN ('programado', 'activo')
                  AND ae.lote_id IS NOT NULL
                ORDER BY c.fecha_evento ASC
            `;
            const [alquilados] = await pool.query(queryAlquilados, [elementoId]);

            // 4. Agrupar por ubicación
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

            // 5. Calcular cantidad total alquilada por evento
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
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER DESGLOSE DE ALQUILERES POR ELEMENTO ✨ NUEVO
    // Para mostrar en qué eventos está cada cantidad
    // ============================================
    static async obtenerDesgloseAlquileres(elementoId) {
        try {
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
                INNER JOIN alquileres a ON ae.alquiler_id = a.id
                INNER JOIN cotizaciones c ON a.cotizacion_id = c.id
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                WHERE ae.elemento_id = ?
                  AND a.estado IN ('programado', 'activo')
                  AND ae.lote_id IS NOT NULL
                ORDER BY c.fecha_montaje ASC
            `;

            const [rows] = await pool.query(query, [elementoId]);

            // Agrupar por evento
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
        } catch (error) {
            throw error;
        }
    }
}

module.exports = LoteModel;
