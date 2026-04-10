// ============================================
// MODEL: SerieModel (ACTUALIZADO CON UBICACIONES)
// Responsabilidad: Consultas SQL de series
// ============================================

const { pool } = require('../../../config/database');

class SerieModel {

    // ============================================
    // OBTENER TODAS LAS SERIES (con elemento y ubicación)
    // ============================================
    static async obtenerTodas(tenantId) {
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
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            WHERE s.tenant_id = ?
            ORDER BY e.nombre, s.numero_serie
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER SERIES CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion(tenantId, { limit, offset, sortBy = 'numero_serie', order = 'ASC', search = null }) {
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
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            WHERE s.tenant_id = ?
        `;

        const params = [tenantId];

        if (search) {
            query += ` AND (s.numero_serie LIKE ? OR e.nombre LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const validSortFields = ['numero_serie', 'estado', 'fecha_ingreso', 'elemento_nombre'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'numero_serie';

        let orderByClause = '';
        if (sortField === 'elemento_nombre') {
            orderByClause = 'e.nombre';
        } else {
            orderByClause = `s.${sortField}`;
        }

        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${orderByClause} ${sortOrder}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // ============================================
    // CONTAR TOTAL DE SERIES
    // ============================================
    static async contarTodas(tenantId, search = null) {
        let query = `
            SELECT COUNT(*) as total
            FROM series s
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            WHERE s.tenant_id = ?
        `;
        const params = [tenantId];

        if (search) {
            query += ` AND (s.numero_serie LIKE ? OR e.nombre LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    // ============================================
    // OBTENER SERIE POR ID
    // ============================================
    static async obtenerPorId(tenantId, id) {
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
                ci.nombre AS ubicacion_ciudad,
                s.fecha_ingreso,
                s.created_at,
                s.updated_at,
                e.nombre AS elemento_nombre,
                e.descripcion AS elemento_descripcion,
                c.nombre AS categoria
            FROM series s
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            LEFT JOIN ciudades ci ON u.ciudad_id = ci.id AND ci.tenant_id = s.tenant_id
            WHERE s.id = ? AND s.tenant_id = ?
        `;

        const [rows] = await pool.query(query, [id, tenantId]);
        return rows[0];
    }

    // ============================================
    // OBTENER SERIE POR NÚMERO DE SERIE
    // ============================================
    static async obtenerPorNumeroSerie(tenantId, numeroSerie) {
        const query = `
            SELECT
                s.*,
                e.nombre AS elemento_nombre,
                u.nombre AS ubicacion_nombre
            FROM series s
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            WHERE s.numero_serie = ? AND s.tenant_id = ?
        `;

        const [rows] = await pool.query(query, [numeroSerie, tenantId]);
        return rows[0];
    }

    // ============================================
    // OBTENER SERIES DE UN ELEMENTO
    // ============================================
    static async obtenerPorElemento(tenantId, elementoId) {
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
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            WHERE s.id_elemento = ? AND s.tenant_id = ?
            ORDER BY s.numero_serie
        `;

        const [rows] = await pool.query(query, [elementoId, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER SERIES POR UBICACIÓN
    // ============================================
    static async obtenerPorUbicacion(tenantId, ubicacionId) {
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
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = s.tenant_id
            WHERE s.ubicacion_id = ? AND s.tenant_id = ?
            ORDER BY e.nombre, s.numero_serie
        `;

        const [rows] = await pool.query(query, [ubicacionId, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER SERIES POR ESTADO
    // ============================================
    static async obtenerPorEstado(tenantId, estado) {
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
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            WHERE s.estado = ? AND s.tenant_id = ?
            ORDER BY e.nombre, s.numero_serie
        `;

        const [rows] = await pool.query(query, [estado, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER SERIES DISPONIBLES
    // ============================================
    static async obtenerDisponibles(tenantId) {
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
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            WHERE s.estado = 'bueno' AND s.tenant_id = ?
            ORDER BY e.nombre, s.numero_serie
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER SERIES ALQUILADAS
    // ============================================
    static async obtenerAlquiladas(tenantId) {
        const query = `
            SELECT
                s.id,
                s.numero_serie,
                u.nombre AS ubicacion_nombre,
                e.nombre AS elemento_nombre,
                c.nombre AS categoria
            FROM series s
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            WHERE s.estado = 'alquilado' AND s.tenant_id = ?
            ORDER BY e.nombre, s.numero_serie
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // CREAR NUEVA SERIE
    // ============================================
    static async crear(tenantId, datos) {
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
            (tenant_id, id_elemento, numero_serie, estado, ubicacion, ubicacion_id, fecha_ingreso)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            tenantId,
            id_elemento,
            numero_serie,
            estado || 'bueno',
            ubicacion || null,
            ubicacion_id || null,
            fecha_ingreso || null
        ]);

        return result.insertId;
    }

    // ============================================
    // ACTUALIZAR SERIE
    // ============================================
    static async actualizar(tenantId, id, datos) {
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
            WHERE id = ? AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [
            numero_serie,
            estado || 'bueno',
            ubicacion || null,
            ubicacion_id || null,
            fecha_ingreso || null,
            id,
            tenantId
        ]);

        return result.affectedRows;
    }

    // ============================================
    // CAMBIAR ESTADO DE SERIE
    // ============================================
    static async cambiarEstado(tenantId, id, nuevoEstado, ubicacion = null, ubicacion_id = null) {
        const query = `
            UPDATE series
            SET estado = ?,
                ubicacion = ?,
                ubicacion_id = ?
            WHERE id = ? AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [
            nuevoEstado,
            ubicacion,
            ubicacion_id,
            id,
            tenantId
        ]);

        return result.affectedRows;
    }

    // ============================================
    // MOVER SERIE A OTRA UBICACIÓN
    // ============================================
    static async moverUbicacion(tenantId, id, ubicacionDestinoId) {
        const [ubicacion] = await pool.query(
            'SELECT nombre FROM ubicaciones WHERE id = ? AND tenant_id = ?',
            [ubicacionDestinoId, tenantId]
        );

        if (!ubicacion || ubicacion.length === 0) {
            throw new Error('Ubicación destino no encontrada');
        }

        const query = `
            UPDATE series
            SET ubicacion_id = ?,
                ubicacion = ?
            WHERE id = ? AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [
            ubicacionDestinoId,
            ubicacion[0].nombre,
            id,
            tenantId
        ]);

        return result.affectedRows;
    }

    // ============================================
    // MOVER MÚLTIPLES SERIES A OTRA UBICACIÓN
    // ============================================
    static async moverMultiples(tenantId, seriesIds, ubicacionDestinoId) {
        const [ubicacion] = await pool.query(
            'SELECT nombre FROM ubicaciones WHERE id = ? AND tenant_id = ?',
            [ubicacionDestinoId, tenantId]
        );

        if (!ubicacion || ubicacion.length === 0) {
            throw new Error('Ubicación destino no encontrada');
        }

        const query = `
            UPDATE series
            SET ubicacion_id = ?,
                ubicacion = ?
            WHERE id IN (?) AND tenant_id = ?
        `;

        const [result] = await pool.query(query, [
            ubicacionDestinoId,
            ubicacion[0].nombre,
            seriesIds,
            tenantId
        ]);

        return result.affectedRows;
    }

    // ============================================
    // ELIMINAR SERIE
    // ============================================
    static async eliminar(tenantId, id) {
        const [result] = await pool.query(
            'DELETE FROM series WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return result.affectedRows;
    }

    // ============================================
    // CONTAR SERIES POR ELEMENTO
    // ============================================
    static async contarPorElemento(tenantId, elementoId) {
        const query = `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                SUM(CASE WHEN estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas,
                SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS en_mantenimiento
            FROM series
            WHERE id_elemento = ? AND tenant_id = ?
        `;

        const [rows] = await pool.query(query, [elementoId, tenantId]);
        return rows[0];
    }

    // ============================================
    // CONTAR SERIES POR UBICACIÓN
    // ============================================
    static async contarPorUbicacion(tenantId, ubicacionId) {
        const query = `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                SUM(CASE WHEN estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas,
                SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS en_mantenimiento,
                SUM(CASE WHEN estado = 'dañado' THEN 1 ELSE 0 END) AS dañados
            FROM series
            WHERE ubicacion_id = ? AND tenant_id = ?
        `;

        const [rows] = await pool.query(query, [ubicacionId, tenantId]);
        return rows[0];
    }

    // ============================================
    // OBTENER RESUMEN POR UBICACIÓN
    // ============================================
    static async obtenerResumenPorUbicaciones(tenantId) {
        const query = `
            SELECT
                u.id AS ubicacion_id,
                u.nombre AS ubicacion_nombre,
                u.tipo AS ubicacion_tipo,
                COUNT(s.id) AS total_series,
                SUM(CASE WHEN s.estado = 'bueno' THEN 1 ELSE 0 END) AS disponibles,
                SUM(CASE WHEN s.estado = 'alquilado' THEN 1 ELSE 0 END) AS alquiladas
            FROM ubicaciones u
            LEFT JOIN series s ON u.id = s.ubicacion_id AND s.tenant_id = u.tenant_id
            WHERE u.activo = TRUE AND u.tenant_id = ?
            GROUP BY u.id, u.nombre, u.tipo
            ORDER BY total_series DESC
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER SERIES CON CONTEXTO DE ALQUILER
    // ============================================
    static async obtenerPorElementoConContexto(tenantId, elementoId) {
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
                CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END AS en_alquiler,
                a.id AS alquiler_id,
                a.estado AS alquiler_estado,
                c.evento_nombre,
                c.fecha_evento AS evento_fecha_inicio,
                c.fecha_desmontaje AS evento_fecha_fin,
                c.evento_direccion AS evento_ubicacion,
                c.evento_ciudad,
                cl.nombre AS cliente_nombre,
                cl.telefono AS cliente_telefono
            FROM series s
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            LEFT JOIN alquiler_elementos ae ON s.id = ae.serie_id AND ae.tenant_id = s.tenant_id
            LEFT JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = s.tenant_id
                AND a.estado IN ('programado', 'activo')
            LEFT JOIN cotizaciones c ON a.cotizacion_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id AND cl.tenant_id = s.tenant_id
            WHERE s.id_elemento = ? AND s.tenant_id = ?
            ORDER BY s.numero_serie
        `;

        const [series] = await pool.query(query, [elementoId, tenantId]);

        const seriesConProximo = await Promise.all(series.map(async (serie) => {
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
                    INNER JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = ae.tenant_id
                    INNER JOIN cotizaciones c ON a.cotizacion_id = c.id AND c.tenant_id = ae.tenant_id
                    INNER JOIN clientes cl ON c.cliente_id = cl.id AND cl.tenant_id = ae.tenant_id
                    WHERE ae.serie_id = ?
                      AND ae.tenant_id = ?
                      AND a.estado = 'programado'
                      AND c.fecha_montaje > NOW()
                    ORDER BY c.fecha_montaje ASC
                    LIMIT 1
                `;
                const [proximo] = await pool.query(queryProximo, [serie.id, tenantId]);
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

        return seriesConProximo;
    }

    // ============================================
    // OBTENER SIGUIENTE NÚMERO DE SERIE
    // ============================================
    static async obtenerSiguienteNumero(tenantId, elementoId) {
        const [elemRows] = await pool.query(
            'SELECT nombre FROM elementos WHERE id = ? AND tenant_id = ?',
            [elementoId, tenantId]
        );

        if (!elemRows[0]) return null;

        const prefijo = elemRows[0].nombre
            .substring(0, 5)
            .toUpperCase()
            .replace(/\s+/g, '');

        const query = `
            SELECT numero_serie FROM series
            WHERE id_elemento = ?
              AND tenant_id = ?
              AND numero_serie LIKE ?
            ORDER BY CAST(SUBSTRING_INDEX(numero_serie, '-', -1) AS UNSIGNED) DESC
            LIMIT 1
        `;

        const [rows] = await pool.query(query, [elementoId, tenantId, `${prefijo}-%`]);

        let siguienteNumero = 1;
        if (rows.length > 0) {
            const partes = rows[0].numero_serie.split('-');
            const ultimoNumero = parseInt(partes[partes.length - 1], 10);
            if (!isNaN(ultimoNumero)) {
                siguienteNumero = ultimoNumero + 1;
            }
        }

        return `${prefijo}-${String(siguienteNumero).padStart(3, '0')}`;
    }

    // ============================================
    // OBTENER SERIE POR ID CON CONTEXTO
    // ============================================
    static async obtenerPorIdConContexto(tenantId, id) {
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
                ci.nombre AS ubicacion_ciudad,
                s.fecha_ingreso,
                s.created_at,
                s.updated_at,
                e.nombre AS elemento_nombre,
                e.descripcion AS elemento_descripcion,
                cat.nombre AS categoria,
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
            INNER JOIN elementos e ON s.id_elemento = e.id AND e.tenant_id = s.tenant_id
            LEFT JOIN categorias cat ON e.categoria_id = cat.id AND cat.tenant_id = s.tenant_id
            LEFT JOIN ubicaciones u ON s.ubicacion_id = u.id AND u.tenant_id = s.tenant_id
            LEFT JOIN ciudades ci ON u.ciudad_id = ci.id AND ci.tenant_id = s.tenant_id
            LEFT JOIN alquiler_elementos ae ON s.id = ae.serie_id AND ae.tenant_id = s.tenant_id
            LEFT JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = s.tenant_id
                AND a.estado IN ('programado', 'activo')
            LEFT JOIN cotizaciones c ON a.cotizacion_id = c.id AND c.tenant_id = s.tenant_id
            LEFT JOIN clientes cl ON c.cliente_id = cl.id AND cl.tenant_id = s.tenant_id
            WHERE s.id = ? AND s.tenant_id = ?
        `;

        const [rows] = await pool.query(query, [id, tenantId]);

        if (!rows[0]) return null;

        const serie = rows[0];

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
                INNER JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = ae.tenant_id
                INNER JOIN cotizaciones c ON a.cotizacion_id = c.id AND c.tenant_id = ae.tenant_id
                INNER JOIN clientes cl ON c.cliente_id = cl.id AND cl.tenant_id = ae.tenant_id
                WHERE ae.serie_id = ?
                  AND ae.tenant_id = ?
                  AND a.estado = 'programado'
                  AND c.fecha_montaje > NOW()
                ORDER BY c.fecha_montaje ASC
                LIMIT 1
            `;
            const [proximo] = await pool.query(queryProximo, [id, tenantId]);
            if (proximo.length > 0) {
                proximo_evento = proximo[0];
            }
        }

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
            INNER JOIN alquileres a ON ae.alquiler_id = a.id AND a.tenant_id = ae.tenant_id
            INNER JOIN cotizaciones c ON a.cotizacion_id = c.id AND c.tenant_id = ae.tenant_id
            INNER JOIN clientes cl ON c.cliente_id = cl.id AND cl.tenant_id = ae.tenant_id
            WHERE ae.serie_id = ? AND ae.tenant_id = ?
            ORDER BY ae.fecha_asignacion DESC
            LIMIT 10
        `;
        const [historial] = await pool.query(queryHistorial, [id, tenantId]);

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
    }
}

module.exports = SerieModel;
