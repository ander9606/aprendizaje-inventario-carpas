// ============================================
// MODELO: ELEMENTOS
// Refactorizado: query fragments DRY
// ============================================

const { pool } = require('../../../config/database');

// ============================================
// FRAGMENTOS DE QUERY REUTILIZABLES
// ============================================

const SELECT_FULL = `
    e.id, e.nombre, e.descripcion, e.imagen, e.cantidad, e.stock_minimo,
    e.costo_adquisicion, e.precio_unitario,
    e.requiere_series, e.estado, e.ubicacion, e.fecha_ingreso, e.categoria_id,
    c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
    c.padre_id AS categoria_padre_id,
    cp.nombre AS categoria_padre_nombre, cp.emoji AS categoria_padre_emoji,
    m.nombre AS material,
    u.nombre AS unidad, u.abreviatura AS unidad_abrev
`;

const SELECT_DETAIL = `
    e.id, e.nombre, e.descripcion, e.imagen, e.cantidad, e.stock_minimo,
    e.costo_adquisicion, e.precio_unitario,
    e.requiere_series, e.estado, e.ubicacion, e.fecha_ingreso,
    e.categoria_id, e.material_id, e.unidad_id,
    c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
    c.padre_id AS categoria_padre_id,
    cp.id AS padre_id, cp.nombre AS categoria_padre_nombre, cp.emoji AS categoria_padre_emoji,
    m.nombre AS material,
    u.nombre AS unidad, u.abreviatura AS unidad_abrev
`;

const SELECT_PARTIAL = `
    e.id, e.nombre, e.descripcion, e.imagen, e.cantidad, e.requiere_series,
    e.estado, e.categoria_id,
    c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
    m.nombre AS material,
    u.nombre AS unidad, u.abreviatura AS unidad_abrev
`;

const SELECT_MINIMAL = `
    e.id, e.nombre, e.descripcion, e.imagen, e.cantidad, e.requiere_series,
    e.estado, e.categoria_id,
    m.nombre AS material,
    u.nombre AS unidad, u.abreviatura AS unidad_abrev
`;

const JOIN_FULL = `
    FROM elementos e
    LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = e.tenant_id
    LEFT JOIN categorias cp ON c.padre_id = cp.id AND cp.tenant_id = e.tenant_id
    LEFT JOIN materiales m ON e.material_id = m.id AND m.tenant_id = e.tenant_id
    LEFT JOIN unidades u ON e.unidad_id = u.id AND u.tenant_id = e.tenant_id
`;

const JOIN_PARTIAL = `
    FROM elementos e
    LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = e.tenant_id
    LEFT JOIN materiales m ON e.material_id = m.id AND m.tenant_id = e.tenant_id
    LEFT JOIN unidades u ON e.unidad_id = u.id AND u.tenant_id = e.tenant_id
`;

const JOIN_MINIMAL = `
    FROM elementos e
    LEFT JOIN materiales m ON e.material_id = m.id AND m.tenant_id = e.tenant_id
    LEFT JOIN unidades u ON e.unidad_id = u.id AND u.tenant_id = e.tenant_id
`;

class ElementoModel {

    // ============================================
    // OBTENER TODOS LOS ELEMENTOS (con relaciones)
    // ============================================
    static async obtenerTodos(tenantId) {
        const query = `SELECT ${SELECT_FULL} ${JOIN_FULL} WHERE e.tenant_id = ? ORDER BY e.nombre`;
        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion(tenantId, { limit, offset, sortBy = 'nombre', order = 'ASC', search = null }) {
        const sortFieldMap = {
            'nombre': 'e.nombre',
            'cantidad': 'e.cantidad',
            'estado': 'e.estado',
            'fecha_ingreso': 'e.fecha_ingreso',
            'id': 'e.id'
        };

        let query = `SELECT ${SELECT_FULL} ${JOIN_FULL} WHERE e.tenant_id = ?`;
        const params = [tenantId];

        if (search) {
            query += ` AND e.nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const sortField = sortFieldMap[sortBy] || 'e.nombre';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortField} ${sortOrder}`;
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // ============================================
    // CONTAR TOTAL DE ELEMENTOS
    // ============================================
    static async contarTodos(tenantId, search = null) {
        let query = `SELECT COUNT(*) as total FROM elementos e WHERE e.tenant_id = ?`;
        const params = [tenantId];

        if (search) {
            query += ` AND e.nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    // ============================================
    // OBTENER ELEMENTO POR ID (con relaciones)
    // ============================================
    static async obtenerPorId(tenantId, id) {
        const query = `SELECT ${SELECT_DETAIL} ${JOIN_FULL} WHERE e.id = ? AND e.tenant_id = ?`;
        const [rows] = await pool.query(query, [id, tenantId]);
        return rows[0] || null;
    }

    // ============================================
    // OBTENER ELEMENTOS POR CATEGORÍA
    // (Incluye elementos de la categoría padre Y sus subcategorías)
    // ============================================
    static async obtenerPorCategoria(tenantId, categoriaId) {
        const query = `
            SELECT ${SELECT_PARTIAL} ${JOIN_PARTIAL}
            WHERE e.tenant_id = ?
              AND (e.categoria_id = ?
               OR e.categoria_id IN (SELECT id FROM categorias WHERE padre_id = ? AND tenant_id = ?))
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [tenantId, categoriaId, categoriaId, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS POR SUBCATEGORÍA CON INFO
    // ============================================
    static async obtenerPorSubcategoriaConInfo(tenantId, subcategoriaId) {
        const queryElementos = `
            SELECT ${SELECT_MINIMAL} ${JOIN_MINIMAL}
            WHERE e.categoria_id = ? AND e.tenant_id = ?
            ORDER BY e.nombre
        `;

        const querySubcategoria = `
            SELECT
                c.id, c.nombre, c.emoji,
                c.padre_id AS categoria_padre_id,
                cp.nombre AS categoria_padre_nombre,
                cp.emoji AS categoria_padre_emoji
            FROM categorias c
            LEFT JOIN categorias cp ON c.padre_id = cp.id AND cp.tenant_id = ?
            WHERE c.id = ? AND c.tenant_id = ?
        `;

        const [elementos] = await pool.query(queryElementos, [subcategoriaId, tenantId]);
        const [subcategoriaRows] = await pool.query(querySubcategoria, [tenantId, subcategoriaId, tenantId]);
        const subcategoria = subcategoriaRows[0] || null;

        return { elementos, subcategoria };
    }

    // ============================================
    // OBTENER ELEMENTOS DIRECTOS DE UNA CATEGORÍA
    // (Solo elementos asignados directamente, sin subcategorías)
    // ============================================
    static async obtenerDirectosPorCategoria(tenantId, categoriaId) {
        const query = `
            SELECT ${SELECT_MINIMAL} ${JOIN_MINIMAL}
            WHERE e.categoria_id = ? AND e.tenant_id = ?
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [categoriaId, tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS QUE REQUIEREN SERIES
    // ============================================
    static async obtenerConSeries(tenantId) {
        const query = `
            SELECT
                e.id, e.nombre, e.cantidad, e.estado, e.categoria_id,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                COUNT(s.id) AS total_series
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = e.tenant_id
            LEFT JOIN series s ON e.id = s.id_elemento AND s.tenant_id = e.tenant_id
            WHERE e.requiere_series = TRUE AND e.tenant_id = ?
            GROUP BY e.id, e.nombre, e.cantidad, e.estado, e.categoria_id, c.nombre, c.emoji
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS SIN SERIES (stock general)
    // ============================================
    static async obtenerSinSeries(tenantId) {
        const query = `
            SELECT
                e.id, e.nombre, e.cantidad, e.estado, e.ubicacion,
                e.categoria_id,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                m.nombre AS material,
                u.nombre AS unidad, u.abreviatura AS unidad_abrev
            ${JOIN_PARTIAL}
            WHERE e.requiere_series = FALSE AND e.tenant_id = ?
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // CREAR NUEVO ELEMENTO
    // ============================================
    static async crear(tenantId, datos) {
        const {
            nombre, descripcion, cantidad, stock_minimo, costo_adquisicion,
            precio_unitario, requiere_series, categoria_id, material_id, unidad_id,
            estado, ubicacion, fecha_ingreso
        } = datos;

        const query = `
            INSERT INTO elementos
            (tenant_id, nombre, descripcion, cantidad, stock_minimo, costo_adquisicion,
             precio_unitario, requiere_series, categoria_id, material_id, unidad_id,
             estado, ubicacion, fecha_ingreso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            tenantId,
            nombre,
            descripcion !== undefined && descripcion !== '' ? descripcion : null,
            cantidad !== undefined && cantidad !== null ? Number(cantidad) : 0,
            stock_minimo !== undefined && stock_minimo !== null ? Number(stock_minimo) : 0,
            costo_adquisicion !== undefined && costo_adquisicion !== null && costo_adquisicion !== '' ? Number(costo_adquisicion) : null,
            precio_unitario !== undefined && precio_unitario !== null && precio_unitario !== '' ? Number(precio_unitario) : null,
            requiere_series === true || requiere_series === 1 || requiere_series === '1',
            categoria_id !== undefined && categoria_id !== null && categoria_id !== '' ? Number(categoria_id) : null,
            material_id !== undefined && material_id !== null && material_id !== '' ? Number(material_id) : null,
            unidad_id !== undefined && unidad_id !== null && unidad_id !== '' ? Number(unidad_id) : null,
            estado || 'bueno',
            ubicacion !== undefined && ubicacion !== '' ? ubicacion : null,
            fecha_ingreso !== undefined && fecha_ingreso !== '' ? fecha_ingreso : null
        ];

        const [result] = await pool.query(query, valores);
        return result.insertId;
    }

    // ============================================
    // ACTUALIZAR ELEMENTO
    // ============================================
    static async actualizar(tenantId, id, datos) {
        const {
            nombre, descripcion, cantidad, stock_minimo, costo_adquisicion,
            precio_unitario, requiere_series, categoria_id, material_id, unidad_id,
            estado, ubicacion, fecha_ingreso
        } = datos;

        const query = `
            UPDATE elementos
            SET nombre = ?, descripcion = ?, cantidad = ?,
                stock_minimo = ?, costo_adquisicion = ?, precio_unitario = ?,
                requiere_series = ?, categoria_id = ?, material_id = ?,
                unidad_id = ?, estado = ?, ubicacion = ?, fecha_ingreso = ?
            WHERE id = ? AND tenant_id = ?
        `;

        const valores = [
            nombre,
            descripcion !== undefined && descripcion !== '' ? descripcion : null,
            cantidad !== undefined && cantidad !== null ? Number(cantidad) : 0,
            stock_minimo !== undefined && stock_minimo !== null ? Number(stock_minimo) : 0,
            costo_adquisicion !== undefined && costo_adquisicion !== null && costo_adquisicion !== '' ? Number(costo_adquisicion) : null,
            precio_unitario !== undefined && precio_unitario !== null && precio_unitario !== '' ? Number(precio_unitario) : null,
            requiere_series === true || requiere_series === 1 || requiere_series === '1',
            categoria_id !== undefined && categoria_id !== null && categoria_id !== '' ? Number(categoria_id) : null,
            material_id !== undefined && material_id !== null && material_id !== '' ? Number(material_id) : null,
            unidad_id !== undefined && unidad_id !== null && unidad_id !== '' ? Number(unidad_id) : null,
            estado || 'bueno',
            ubicacion !== undefined && ubicacion !== '' ? ubicacion : null,
            fecha_ingreso !== undefined && fecha_ingreso !== '' ? fecha_ingreso : null,
            id,
            tenantId
        ];

        const [result] = await pool.query(query, valores);
        return result.affectedRows;
    }

    // ============================================
    // ELIMINAR ELEMENTO
    // ============================================
    static async eliminar(tenantId, id) {
        const [result] = await pool.query(
            'DELETE FROM elementos WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return result.affectedRows;
    }

    // ============================================
    // ACTUALIZAR IMAGEN
    // ============================================
    static async actualizarImagen(tenantId, id, imagenUrl) {
        const [result] = await pool.query(
            'UPDATE elementos SET imagen = ? WHERE id = ? AND tenant_id = ?',
            [imagenUrl, id, tenantId]
        );
        return result.affectedRows;
    }

    // ============================================
    // BUSCAR ELEMENTOS POR NOMBRE
    // ============================================
    static async buscarPorNombre(tenantId, termino) {
        const query = `
            SELECT
                e.id, e.nombre, e.descripcion, e.cantidad,
                e.estado, e.categoria_id,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                m.nombre AS material
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = e.tenant_id
            LEFT JOIN materiales m ON e.material_id = m.id AND m.tenant_id = e.tenant_id
            WHERE e.nombre LIKE ? AND e.tenant_id = ?
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [`%${termino}%`, tenantId]);
        return rows;
    }

    // ============================================
    // VERIFICAR SI EXISTE POR ID
    // ============================================
    static async existe(tenantId, id) {
        const [rows] = await pool.query(
            'SELECT id FROM elementos WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return rows.length > 0;
    }

    // ============================================
    // CONTAR ELEMENTOS POR CATEGORÍA
    // ============================================
    static async contarPorCategoria(tenantId, categoriaId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM elementos WHERE categoria_id = ? AND tenant_id = ?',
            [categoriaId, tenantId]
        );
        return rows[0].total;
    }

    // ============================================
    // OBTENER ELEMENTOS CON STOCK BAJO
    // Elementos donde la disponibilidad < stock_minimo
    // ============================================
    static async obtenerConStockBajo(tenantId) {
        const query = `
            SELECT
                e.id, e.nombre, e.cantidad, e.stock_minimo,
                e.costo_adquisicion, e.precio_unitario,
                e.requiere_series, e.estado,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                CASE
                    WHEN e.requiere_series = TRUE THEN (
                        SELECT COUNT(*) FROM series s
                        WHERE s.id_elemento = e.id AND s.tenant_id = e.tenant_id AND s.estado NOT IN ('alquilado', 'dañado')
                    )
                    ELSE (
                        SELECT COALESCE(SUM(l.cantidad), 0) FROM lotes l
                        WHERE l.elemento_id = e.id AND l.tenant_id = e.tenant_id AND l.estado NOT IN ('alquilado', 'dañado')
                    )
                END AS stock_disponible
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = e.tenant_id
            WHERE e.stock_minimo > 0 AND e.tenant_id = ?
            HAVING stock_disponible < e.stock_minimo
            ORDER BY (e.stock_minimo - stock_disponible) DESC
        `;

        const [rows] = await pool.query(query, [tenantId]);
        return rows;
    }

    // ============================================
    // ESTADISTICAS GENERALES DE INVENTARIO
    // ============================================
    static async obtenerEstadisticasGenerales(tenantId) {
        const query = `
            SELECT
                COUNT(*) AS total_elementos,
                SUM(CASE WHEN requiere_series = TRUE THEN 1 ELSE 0 END) AS elementos_con_series,
                SUM(CASE WHEN requiere_series = FALSE THEN 1 ELSE 0 END) AS elementos_con_lotes,
                COALESCE(SUM(costo_adquisicion * cantidad), 0) AS valor_total,
                COALESCE(SUM(precio_unitario * cantidad), 0) AS valor_precio_unitario
            FROM elementos
            WHERE tenant_id = ?
        `;
        const [rows] = await pool.query(query, [tenantId]);

        // Total series
        const [seriesCount] = await pool.query('SELECT COUNT(*) AS total FROM series WHERE tenant_id = ?', [tenantId]);
        // Total unidades en lotes
        const [lotesSum] = await pool.query('SELECT COALESCE(SUM(cantidad), 0) AS total FROM lotes WHERE tenant_id = ?', [tenantId]);

        return {
            ...rows[0],
            total_series: seriesCount[0].total,
            total_unidades_lotes: Number(lotesSum[0].total),
            total_unidades: seriesCount[0].total + Number(lotesSum[0].total)
        };
    }

    // ============================================
    // DISTRIBUCION POR ESTADO
    // ============================================
    static async obtenerDistribucionPorEstado(tenantId) {
        // Series por estado
        const querySeries = `
            SELECT estado, COUNT(*) AS cantidad
            FROM series
            WHERE tenant_id = ?
            GROUP BY estado
        `;
        // Lotes por estado
        const queryLotes = `
            SELECT estado, SUM(cantidad) AS cantidad
            FROM lotes
            WHERE tenant_id = ?
            GROUP BY estado
        `;

        const [series] = await pool.query(querySeries, [tenantId]);
        const [lotes] = await pool.query(queryLotes, [tenantId]);

        // Combinar
        const estadosMap = {};
        series.forEach(s => {
            estadosMap[s.estado] = (estadosMap[s.estado] || 0) + Number(s.cantidad);
        });
        lotes.forEach(l => {
            estadosMap[l.estado] = (estadosMap[l.estado] || 0) + Number(l.cantidad);
        });

        return Object.entries(estadosMap).map(([estado, cantidad]) => ({
            estado,
            cantidad
        }));
    }

    // ============================================
    // TOP CATEGORIAS POR CANTIDAD
    // ============================================
    static async obtenerTopCategorias(tenantId, limit = 10) {
        const query = `
            SELECT
                COALESCE(c.nombre, 'Sin categoría') AS categoria,
                c.emoji,
                COUNT(DISTINCT e.id) AS total_elementos,
                COALESCE(
                    (SELECT COUNT(*) FROM series s
                     INNER JOIN elementos e2 ON s.id_elemento = e2.id AND e2.tenant_id = ?
                     WHERE e2.categoria_id = c.id AND s.tenant_id = ?),
                0) +
                COALESCE(
                    (SELECT SUM(l.cantidad) FROM lotes l
                     INNER JOIN elementos e2 ON l.elemento_id = e2.id AND e2.tenant_id = ?
                     WHERE e2.categoria_id = c.id AND l.tenant_id = ?),
                0) AS cantidad_total
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = e.tenant_id
            WHERE e.tenant_id = ?
            GROUP BY c.id, c.nombre, c.emoji
            ORDER BY cantidad_total DESC
            LIMIT ?
        `;

        const [rows] = await pool.query(query, [tenantId, tenantId, tenantId, tenantId, tenantId, limit]);
        return rows;
    }

    // ============================================
    // DISTRIBUCION POR UBICACION
    // ============================================
    static async obtenerDistribucionPorUbicacion(tenantId) {
        const query = `
            SELECT
                ub.nombre AS ubicacion,
                COALESCE(s_count.total_series, 0) AS series,
                COALESCE(l_count.total_lotes, 0) AS lotes,
                COALESCE(s_count.total_series, 0) + COALESCE(l_count.total_lotes, 0) AS total
            FROM ubicaciones ub
            LEFT JOIN (
                SELECT ubicacion_id, COUNT(*) as total_series
                FROM series WHERE ubicacion_id IS NOT NULL AND tenant_id = ?
                GROUP BY ubicacion_id
            ) s_count ON ub.id = s_count.ubicacion_id
            LEFT JOIN (
                SELECT ubicacion_id, SUM(cantidad) as total_lotes
                FROM lotes WHERE ubicacion_id IS NOT NULL AND tenant_id = ?
                GROUP BY ubicacion_id
            ) l_count ON ub.id = l_count.ubicacion_id
            WHERE ub.activo = TRUE
              AND ub.tenant_id = ?
              AND (COALESCE(s_count.total_series, 0) + COALESCE(l_count.total_lotes, 0)) > 0
            ORDER BY total DESC
        `;

        const [rows] = await pool.query(query, [tenantId, tenantId, tenantId]);
        return rows;
    }
}

module.exports = ElementoModel;
