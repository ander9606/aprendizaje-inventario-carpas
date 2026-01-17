// ============================================
// MODEL: SerieModel (ACTUALIZADO CON UBICACIONES)
// Responsabilidad: Consultas SQL de series
// ============================================

const { pool } = require('../../../config/database');

class SerieModel {
    
    // ============================================
    // OBTENER TODAS LAS SERIES (con elemento y ubicación)
    // ============================================
    static async obtenerTodas() {
        try {
            const query = `
                SELECT
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    s.fecha_ingreso,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                ORDER BY e.nombre, s.numero_serie
            `;

            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER SERIES CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion({ limit, offset, sortBy = 'numero_serie', order = 'ASC', search = null }) {
        try {
            let query = `
                SELECT
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    s.fecha_ingreso,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
            `;

            const params = [];

            // Agregar búsqueda si existe
            if (search) {
                query += ` WHERE s.numero_serie LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            // Agregar ordenamiento
            const validSortFields = ['numero_serie', 'estado', 'fecha_ingreso', 'elemento_nombre'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'numero_serie';

            // Mapear campo de ordenamiento a columna real
            let orderByClause = '';
            if (sortField === 'elemento_nombre') {
                orderByClause = 'e.nombre';
            } else {
                orderByClause = `s.${sortField}`;
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
    // CONTAR TOTAL DE SERIES
    // ============================================
    static async contarTodas(search = null) {
        try {
            let query = `
                SELECT COUNT(*) as total
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
            `;
            const params = [];

            if (search) {
                query += ` WHERE s.numero_serie LIKE ? OR e.nombre LIKE ?`;
                params.push(`%${search}%`, `%${search}%`);
            }

            const [rows] = await pool.query(query, params);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIE POR ID
    // ============================================
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.id_elemento,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    u.ciudad AS ubicacion_ciudad,
                    s.fecha_ingreso,
                    s.created_at,
                    s.updated_at,
                    e.nombre AS elemento_nombre,
                    e.descripcion AS elemento_descripcion,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.id = ?
            `;
            
            const [rows] = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIE POR NÚMERO DE SERIE
    // ============================================
    static async obtenerPorNumeroSerie(numeroSerie) {
        try {
            const query = `
                SELECT 
                    s.*,
                    e.nombre AS elemento_nombre,
                    u.nombre AS ubicacion_nombre
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.numero_serie = ?
            `;
            
            const [rows] = await pool.query(query, [numeroSerie]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES DE UN ELEMENTO
    // ============================================
    static async obtenerPorElemento(elementoId) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    s.fecha_ingreso
                FROM series s
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.id_elemento = ?
                ORDER BY s.numero_serie
            `;
            
            const [rows] = await pool.query(query, [elementoId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES POR UBICACIÓN
    // ============================================
    static async obtenerPorUbicacion(ubicacionId) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.fecha_ingreso,
                    e.id AS elemento_id,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                WHERE s.ubicacion_id = ?
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query, [ubicacionId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES POR ESTADO
    // ============================================
    static async obtenerPorEstado(estado) {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.estado = ?
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query, [estado]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES DISPONIBLES
    // ============================================
    static async obtenerDisponibles() {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.estado = 'bueno'
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER SERIES ALQUILADAS
    // ============================================
    static async obtenerAlquiladas() {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.numero_serie,
                    u.nombre AS ubicacion_nombre,
                    e.nombre AS elemento_nombre,
                    c.nombre AS categoria
                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                WHERE s.estado = 'alquilado'
                ORDER BY e.nombre, s.numero_serie
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR NUEVA SERIE
    // ============================================
    static async crear(datos) {
        try {
            const {
                id_elemento,
                numero_serie,
                estado,
                ubicacion,
                ubicacion_id,
                fecha_ingreso
            } = datos;
            
            const query = `
                INSERT INTO series 
                (id_elemento, numero_serie, estado, ubicacion, ubicacion_id, fecha_ingreso)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                id_elemento,
                numero_serie,
                estado || 'bueno',
                ubicacion || null,
                ubicacion_id || null,
                fecha_ingreso || null
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR SERIE
    // ============================================
    static async actualizar(id, datos) {
        try {
            const {
                numero_serie,
                estado,
                ubicacion,
                ubicacion_id,
                fecha_ingreso
            } = datos;
            
            const query = `
                UPDATE series 
                SET numero_serie = ?,
                    estado = ?,
                    ubicacion = ?,
                    ubicacion_id = ?,
                    fecha_ingreso = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                numero_serie,
                estado || 'bueno',
                ubicacion || null,
                ubicacion_id || null,
                fecha_ingreso || null,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CAMBIAR ESTADO DE SERIE
    // ============================================
    static async cambiarEstado(id, nuevoEstado, ubicacion = null, ubicacion_id = null) {
        try {
            const query = `
                UPDATE series 
                SET estado = ?,
                    ubicacion = ?,
                    ubicacion_id = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                nuevoEstado,
                ubicacion,
                ubicacion_id,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // MOVER SERIE A OTRA UBICACIÓN ✨ NUEVO
    // ============================================
    static async moverUbicacion(id, ubicacionDestinoId) {
        try {
            // Obtener nombre de la ubicación destino
            const [ubicacion] = await pool.query(
                'SELECT nombre FROM ubicaciones WHERE id = ?',
                [ubicacionDestinoId]
            );
            
            if (!ubicacion || ubicacion.length === 0) {
                throw new Error('Ubicación destino no encontrada');
            }
            
            const query = `
                UPDATE series 
                SET ubicacion_id = ?,
                    ubicacion = ?
                WHERE id = ?
            `;
            
            const [result] = await pool.query(query, [
                ubicacionDestinoId,
                ubicacion[0].nombre,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // MOVER MÚLTIPLES SERIES A OTRA UBICACIÓN ✨ NUEVO
    // ============================================
    static async moverMultiples(seriesIds, ubicacionDestinoId) {
        try {
            // Obtener nombre de la ubicación destino
            const [ubicacion] = await pool.query(
                'SELECT nombre FROM ubicaciones WHERE id = ?',
                [ubicacionDestinoId]
            );
            
            if (!ubicacion || ubicacion.length === 0) {
                throw new Error('Ubicación destino no encontrada');
            }
            
            const query = `
                UPDATE series 
                SET ubicacion_id = ?,
                    ubicacion = ?
                WHERE id IN (?)
            `;
            
            const [result] = await pool.query(query, [
                ubicacionDestinoId,
                ubicacion[0].nombre,
                seriesIds
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR SERIE
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM series WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CONTAR SERIES POR ELEMENTO
    // ============================================
    static async contarPorElemento(elementoId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                    SUM(CASE WHEN estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas,
                    SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS en_mantenimiento
                FROM series
                WHERE id_elemento = ?
            `;
            
            const [rows] = await pool.query(query, [elementoId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CONTAR SERIES POR UBICACIÓN ✨ NUEVO
    // ============================================
    static async contarPorUbicacion(ubicacionId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                    SUM(CASE WHEN estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas,
                    SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS en_mantenimiento,
                    SUM(CASE WHEN estado = 'dañado' THEN 1 ELSE 0 END) AS dañados
                FROM series
                WHERE ubicacion_id = ?
            `;
            
            const [rows] = await pool.query(query, [ubicacionId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER RESUMEN POR UBICACIÓN ✨ NUEVO
    // ============================================
    static async obtenerResumenPorUbicaciones() {
        try {
            const query = `
                SELECT
                    u.id AS ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    COUNT(s.id) AS total_series,
                    SUM(CASE WHEN s.estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                    SUM(CASE WHEN s.estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas
                FROM ubicaciones u
                LEFT JOIN series s ON u.id = s.ubicacion_id
                WHERE u.activo = TRUE
                GROUP BY u.id, u.nombre, u.tipo
                ORDER BY total_series DESC
            `;

            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER SERIES CON CONTEXTO DE ALQUILER
    // Incluye información del evento actual y próximo
    // Filtra solo eventos actuales y futuros
    // ============================================
    static async obtenerPorElementoConContexto(elementoId, fechaReferencia = null) {
        try {
            // Fecha de referencia: si no se proporciona, usar hoy
            const hoy = fechaReferencia || new Date().toISOString().split('T')[0];

            // Query principal: series con evento actual (si existe y no ha terminado)
            // Usamos subquery para evitar duplicados cuando una serie tiene múltiples alquileres
            const query = `
                SELECT
                    s.id,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    s.fecha_ingreso,

                    -- Datos del alquiler actual (si está alquilado Y no ha terminado)
                    CASE WHEN a.id IS NOT NULL AND c.fecha_desmontaje >= ? THEN TRUE ELSE FALSE END AS en_alquiler,
                    CASE WHEN c.fecha_desmontaje >= ? THEN a.id ELSE NULL END AS alquiler_id,
                    CASE WHEN c.fecha_desmontaje >= ? THEN a.estado ELSE NULL END AS alquiler_estado,

                    -- Datos del evento actual (solo si no ha terminado)
                    CASE WHEN c.fecha_desmontaje >= ? THEN c.evento_nombre ELSE NULL END AS evento_nombre,
                    CASE WHEN c.fecha_desmontaje >= ? THEN c.fecha_montaje ELSE NULL END AS evento_fecha_montaje,
                    CASE WHEN c.fecha_desmontaje >= ? THEN c.fecha_evento ELSE NULL END AS evento_fecha_inicio,
                    CASE WHEN c.fecha_desmontaje >= ? THEN c.fecha_desmontaje ELSE NULL END AS evento_fecha_fin,
                    CASE WHEN c.fecha_desmontaje >= ? THEN c.evento_direccion ELSE NULL END AS evento_ubicacion,
                    CASE WHEN c.fecha_desmontaje >= ? THEN c.evento_ciudad ELSE NULL END AS evento_ciudad,

                    -- Datos del cliente
                    CASE WHEN c.fecha_desmontaje >= ? THEN cl.nombre ELSE NULL END AS cliente_nombre,
                    CASE WHEN c.fecha_desmontaje >= ? THEN cl.telefono ELSE NULL END AS cliente_telefono

                FROM series s
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id

                -- Subquery para obtener SOLO el alquiler activo más reciente de cada serie
                LEFT JOIN (
                    SELECT ae.serie_id, ae.alquiler_id
                    FROM alquiler_elementos ae
                    INNER JOIN alquileres a ON ae.alquiler_id = a.id
                    WHERE a.estado IN ('programado', 'activo')
                    ORDER BY a.id DESC
                ) ae_activo ON s.id = ae_activo.serie_id
                LEFT JOIN alquileres a ON ae_activo.alquiler_id = a.id
                LEFT JOIN cotizaciones c ON a.cotizacion_id = c.id
                LEFT JOIN clientes cl ON c.cliente_id = cl.id

                WHERE s.id_elemento = ?
                GROUP BY s.id
                ORDER BY s.numero_serie
            `;

            const params = [hoy, hoy, hoy, hoy, hoy, hoy, hoy, hoy, hoy, hoy, hoy, elementoId];
            const [series] = await pool.query(query, params);

            // Para cada serie, buscar próximo evento (si no está en alquiler activo)
            const seriesConProximo = await Promise.all(series.map(async (serie) => {
                let proximo_evento = null;

                // Si no está en alquiler activo, buscar próximo compromiso
                if (!serie.en_alquiler) {
                    const queryProximo = `
                        SELECT
                            a.id AS alquiler_id,
                            c.evento_nombre,
                            c.fecha_montaje,
                            c.fecha_evento,
                            cl.nombre AS cliente_nombre
                        FROM alquiler_elementos ae
                        INNER JOIN alquileres a ON ae.alquiler_id = a.id
                        INNER JOIN cotizaciones c ON a.cotizacion_id = c.id
                        INNER JOIN clientes cl ON c.cliente_id = cl.id
                        WHERE ae.serie_id = ?
                          AND a.estado = 'programado'
                          AND c.fecha_montaje > NOW()
                        ORDER BY c.fecha_montaje ASC
                        LIMIT 1
                    `;
                    const [proximo] = await pool.query(queryProximo, [serie.id]);
                    if (proximo.length > 0) {
                        proximo_evento = proximo[0];
                    }
                }

                return {
                    id: serie.id,
                    numero_serie: serie.numero_serie,
                    estado: serie.estado,
                    ubicacion: serie.ubicacion,
                    ubicacion_id: serie.ubicacion_id,
                    ubicacion_nombre: serie.ubicacion_nombre,
                    ubicacion_tipo: serie.ubicacion_tipo,
                    fecha_ingreso: serie.fecha_ingreso,

                    // Contexto de alquiler
                    en_alquiler: serie.en_alquiler,
                    evento_actual: serie.en_alquiler ? {
                        alquiler_id: serie.alquiler_id,
                        estado: serie.alquiler_estado,
                        nombre: serie.evento_nombre,
                        fecha_inicio: serie.evento_fecha_inicio,
                        fecha_fin: serie.evento_fecha_fin,
                        ubicacion: serie.evento_ubicacion,
                        ciudad: serie.evento_ciudad,
                        cliente: serie.cliente_nombre,
                        cliente_telefono: serie.cliente_telefono
                    } : null,

                    proximo_evento
                };
            }));

            // Calcular resumen de disponibilidad
            const totalSeries = seriesConProximo.length;
            const enAlquiler = seriesConProximo.filter(s => s.en_alquiler).length;
            const disponiblesHoy = seriesConProximo.filter(s =>
                !s.en_alquiler && ['bueno', 'nuevo', 'disponible'].includes(s.estado)
            ).length;

            // Obtener todos los próximos eventos del elemento
            const queryProximosEventos = `
                SELECT DISTINCT
                    a.id AS alquiler_id,
                    c.evento_nombre,
                    c.fecha_montaje,
                    c.fecha_evento,
                    c.fecha_desmontaje,
                    c.evento_direccion,
                    c.evento_ciudad,
                    cl.nombre AS cliente_nombre,
                    COUNT(ae.serie_id) AS cantidad_series
                FROM alquiler_elementos ae
                INNER JOIN alquileres a ON ae.alquiler_id = a.id
                INNER JOIN cotizaciones c ON a.cotizacion_id = c.id
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                INNER JOIN series s ON ae.serie_id = s.id
                WHERE s.id_elemento = ?
                  AND a.estado IN ('programado', 'activo')
                  AND c.fecha_desmontaje >= ?
                GROUP BY a.id, c.evento_nombre, c.fecha_montaje, c.fecha_evento,
                         c.fecha_desmontaje, c.evento_direccion, c.evento_ciudad, cl.nombre
                ORDER BY c.fecha_montaje ASC
            `;
            const [proximosEventos] = await pool.query(queryProximosEventos, [elementoId, hoy]);

            return {
                series: seriesConProximo,
                resumen: {
                    total: totalSeries,
                    en_alquiler: enAlquiler,
                    disponibles_hoy: disponiblesHoy,
                    fecha_consulta: hoy
                },
                proximos_eventos: proximosEventos.map(e => ({
                    alquiler_id: e.alquiler_id,
                    evento_nombre: e.evento_nombre,
                    fecha_montaje: e.fecha_montaje,
                    fecha_evento: e.fecha_evento,
                    fecha_desmontaje: e.fecha_desmontaje,
                    ubicacion: e.evento_direccion,
                    ciudad: e.evento_ciudad,
                    cliente: e.cliente_nombre,
                    cantidad: e.cantidad_series
                }))
            };
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER SERIE POR ID CON CONTEXTO
    // ============================================
    static async obtenerPorIdConContexto(id) {
        try {
            const query = `
                SELECT
                    s.id,
                    s.id_elemento,
                    s.numero_serie,
                    s.estado,
                    s.ubicacion,
                    s.ubicacion_id,
                    u.nombre AS ubicacion_nombre,
                    u.tipo AS ubicacion_tipo,
                    u.ciudad AS ubicacion_ciudad,
                    s.fecha_ingreso,
                    s.created_at,
                    s.updated_at,
                    e.nombre AS elemento_nombre,
                    e.descripcion AS elemento_descripcion,
                    cat.nombre AS categoria,

                    -- Datos del alquiler actual
                    CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END AS en_alquiler,
                    a.id AS alquiler_id,
                    a.estado AS alquiler_estado,
                    c.evento_nombre,
                    c.fecha_evento,
                    c.fecha_desmontaje,
                    c.evento_direccion,
                    c.evento_ciudad,
                    cl.nombre AS cliente_nombre,
                    cl.telefono AS cliente_telefono

                FROM series s
                INNER JOIN elementos e ON s.id_elemento = e.id
                LEFT JOIN categorias cat ON e.categoria_id = cat.id
                LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id
                LEFT JOIN alquiler_elementos ae ON s.id = ae.serie_id
                LEFT JOIN alquileres a ON ae.alquiler_id = a.id
                    AND a.estado IN ('programado', 'activo')
                LEFT JOIN cotizaciones c ON a.cotizacion_id = c.id
                LEFT JOIN clientes cl ON c.cliente_id = cl.id
                WHERE s.id = ?
            `;

            const [rows] = await pool.query(query, [id]);

            if (!rows[0]) return null;

            const serie = rows[0];

            // Buscar próximo evento si no está en alquiler
            let proximo_evento = null;
            if (!serie.en_alquiler) {
                const queryProximo = `
                    SELECT
                        a.id AS alquiler_id,
                        c.evento_nombre,
                        c.fecha_montaje,
                        c.fecha_evento,
                        cl.nombre AS cliente_nombre
                    FROM alquiler_elementos ae
                    INNER JOIN alquileres a ON ae.alquiler_id = a.id
                    INNER JOIN cotizaciones c ON a.cotizacion_id = c.id
                    INNER JOIN clientes cl ON c.cliente_id = cl.id
                    WHERE ae.serie_id = ?
                      AND a.estado = 'programado'
                      AND c.fecha_montaje > NOW()
                    ORDER BY c.fecha_montaje ASC
                    LIMIT 1
                `;
                const [proximo] = await pool.query(queryProximo, [id]);
                if (proximo.length > 0) {
                    proximo_evento = proximo[0];
                }
            }

            // Buscar historial de alquileres
            const queryHistorial = `
                SELECT
                    a.id AS alquiler_id,
                    a.estado AS alquiler_estado,
                    c.evento_nombre,
                    c.fecha_evento,
                    c.fecha_desmontaje,
                    cl.nombre AS cliente_nombre,
                    ae.estado_salida,
                    ae.estado_retorno,
                    ae.fecha_asignacion,
                    ae.fecha_retorno
                FROM alquiler_elementos ae
                INNER JOIN alquileres a ON ae.alquiler_id = a.id
                INNER JOIN cotizaciones c ON a.cotizacion_id = c.id
                INNER JOIN clientes cl ON c.cliente_id = cl.id
                WHERE ae.serie_id = ?
                ORDER BY ae.fecha_asignacion DESC
                LIMIT 10
            `;
            const [historial] = await pool.query(queryHistorial, [id]);

            return {
                ...serie,
                evento_actual: serie.en_alquiler ? {
                    alquiler_id: serie.alquiler_id,
                    estado: serie.alquiler_estado,
                    nombre: serie.evento_nombre,
                    fecha_inicio: serie.fecha_evento,
                    fecha_fin: serie.fecha_desmontaje,
                    ubicacion: serie.evento_direccion,
                    ciudad: serie.evento_ciudad,
                    cliente: serie.cliente_nombre,
                    cliente_telefono: serie.cliente_telefono
                } : null,
                proximo_evento,
                historial_alquileres: historial
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = SerieModel;