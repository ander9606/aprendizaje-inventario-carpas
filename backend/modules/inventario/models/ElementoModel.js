// ============================================
// MODELO: ELEMENTOS
// Refactorizado: query fragments DRY
// ============================================

const { pool } = require('../../../config/database');

// ============================================
// FRAGMENTOS DE QUERY REUTILIZABLES
// ============================================

const SELECT_FULL = `
    e.id, e.nombre, e.descripcion, e.cantidad, e.stock_minimo,
    e.costo_adquisicion, e.precio_unitario,
    e.requiere_series, e.estado, e.ubicacion, e.fecha_ingreso, e.categoria_id,
    c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
    c.padre_id AS categoria_padre_id,
    cp.nombre AS categoria_padre_nombre, cp.emoji AS categoria_padre_emoji,
    m.nombre AS material,
    u.nombre AS unidad, u.abreviatura AS unidad_abrev
`;

const SELECT_DETAIL = `
    e.id, e.nombre, e.descripcion, e.cantidad, e.stock_minimo,
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
    e.id, e.nombre, e.descripcion, e.cantidad, e.requiere_series,
    e.estado, e.categoria_id,
    c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
    m.nombre AS material,
    u.nombre AS unidad, u.abreviatura AS unidad_abrev
`;

const SELECT_MINIMAL = `
    e.id, e.nombre, e.descripcion, e.cantidad, e.requiere_series,
    e.estado, e.categoria_id,
    m.nombre AS material,
    u.nombre AS unidad, u.abreviatura AS unidad_abrev
`;

const JOIN_FULL = `
    FROM elementos e
    LEFT JOIN categorias c ON e.categoria_id = c.id
    LEFT JOIN categorias cp ON c.padre_id = cp.id
    LEFT JOIN materiales m ON e.material_id = m.id
    LEFT JOIN unidades u ON e.unidad_id = u.id
`;

const JOIN_PARTIAL = `
    FROM elementos e
    LEFT JOIN categorias c ON e.categoria_id = c.id
    LEFT JOIN materiales m ON e.material_id = m.id
    LEFT JOIN unidades u ON e.unidad_id = u.id
`;

const JOIN_MINIMAL = `
    FROM elementos e
    LEFT JOIN materiales m ON e.material_id = m.id
    LEFT JOIN unidades u ON e.unidad_id = u.id
`;

class ElementoModel {

    // ============================================
    // OBTENER TODOS LOS ELEMENTOS (con relaciones)
    // ============================================
    static async obtenerTodos() {
        const query = `SELECT ${SELECT_FULL} ${JOIN_FULL} ORDER BY e.nombre`;
        const [rows] = await pool.query(query);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion({ limit, offset, sortBy = 'nombre', order = 'ASC', search = null }) {
        const sortFieldMap = {
            'nombre': 'e.nombre',
            'cantidad': 'e.cantidad',
            'estado': 'e.estado',
            'fecha_ingreso': 'e.fecha_ingreso',
            'id': 'e.id'
        };

        let query = `SELECT ${SELECT_FULL} ${JOIN_FULL}`;
        const params = [];

        if (search) {
            query += ` WHERE e.nombre LIKE ?`;
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
    static async contarTodos(search = null) {
        let query = `SELECT COUNT(*) as total FROM elementos e`;
        const params = [];

        if (search) {
            query += ` WHERE e.nombre LIKE ?`;
            params.push(`%${search}%`);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    // ============================================
    // OBTENER ELEMENTO POR ID (con relaciones)
    // ============================================
    static async obtenerPorId(id) {
        const query = `SELECT ${SELECT_DETAIL} ${JOIN_FULL} WHERE e.id = ?`;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    // ============================================
    // OBTENER ELEMENTOS POR CATEGORÍA
    // (Incluye elementos de la categoría padre Y sus subcategorías)
    // ============================================
    static async obtenerPorCategoria(categoriaId) {
        const query = `
            SELECT ${SELECT_PARTIAL} ${JOIN_PARTIAL}
            WHERE e.categoria_id = ?
               OR e.categoria_id IN (SELECT id FROM categorias WHERE padre_id = ?)
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [categoriaId, categoriaId]);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS POR SUBCATEGORÍA CON INFO
    // ============================================
    static async obtenerPorSubcategoriaConInfo(subcategoriaId) {
        const queryElementos = `
            SELECT ${SELECT_MINIMAL} ${JOIN_MINIMAL}
            WHERE e.categoria_id = ?
            ORDER BY e.nombre
        `;

        const querySubcategoria = `
            SELECT
                c.id, c.nombre, c.emoji,
                c.padre_id AS categoria_padre_id,
                cp.nombre AS categoria_padre_nombre,
                cp.emoji AS categoria_padre_emoji
            FROM categorias c
            LEFT JOIN categorias cp ON c.padre_id = cp.id
            WHERE c.id = ?
        `;

        const [elementos] = await pool.query(queryElementos, [subcategoriaId]);
        const [subcategoriaRows] = await pool.query(querySubcategoria, [subcategoriaId]);
        const subcategoria = subcategoriaRows[0] || null;

        return { elementos, subcategoria };
    }

    // ============================================
    // OBTENER ELEMENTOS DIRECTOS DE UNA CATEGORÍA
    // (Solo elementos asignados directamente, sin subcategorías)
    // ============================================
    static async obtenerDirectosPorCategoria(categoriaId) {
        const query = `
            SELECT ${SELECT_MINIMAL} ${JOIN_MINIMAL}
            WHERE e.categoria_id = ?
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [categoriaId]);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS QUE REQUIEREN SERIES
    // ============================================
    static async obtenerConSeries() {
        const query = `
            SELECT
                e.id, e.nombre, e.cantidad, e.estado, e.categoria_id,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                COUNT(s.id) AS total_series
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN series s ON e.id = s.id_elemento
            WHERE e.requiere_series = TRUE
            GROUP BY e.id, e.nombre, e.cantidad, e.estado, e.categoria_id, c.nombre, c.emoji
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query);
        return rows;
    }

    // ============================================
    // OBTENER ELEMENTOS SIN SERIES (stock general)
    // ============================================
    static async obtenerSinSeries() {
        const query = `
            SELECT
                e.id, e.nombre, e.cantidad, e.estado, e.ubicacion,
                e.categoria_id,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                m.nombre AS material,
                u.nombre AS unidad, u.abreviatura AS unidad_abrev
            ${JOIN_PARTIAL}
            WHERE e.requiere_series = FALSE
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query);
        return rows;
    }

    // ============================================
    // CREAR NUEVO ELEMENTO
    // ============================================
    static async crear(datos) {
        const {
            nombre, descripcion, cantidad, stock_minimo, costo_adquisicion,
            precio_unitario, requiere_series, categoria_id, material_id, unidad_id,
            estado, ubicacion, fecha_ingreso
        } = datos;

        const query = `
            INSERT INTO elementos
            (nombre, descripcion, cantidad, stock_minimo, costo_adquisicion,
             precio_unitario, requiere_series, categoria_id, material_id, unidad_id,
             estado, ubicacion, fecha_ingreso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            fecha_ingreso !== undefined && fecha_ingreso !== '' ? fecha_ingreso : null
        ];

        const [result] = await pool.query(query, valores);
        return result.insertId;
    }

    // ============================================
    // ACTUALIZAR ELEMENTO
    // ============================================
    static async actualizar(id, datos) {
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
            WHERE id = ?
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
            id
        ];

        const [result] = await pool.query(query, valores);
        return result.affectedRows;
    }

    // ============================================
    // ELIMINAR ELEMENTO
    // ============================================
    static async eliminar(id) {
        const [result] = await pool.query(
            'DELETE FROM elementos WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    // ============================================
    // BUSCAR ELEMENTOS POR NOMBRE
    // ============================================
    static async buscarPorNombre(termino) {
        const query = `
            SELECT
                e.id, e.nombre, e.descripcion, e.cantidad,
                e.estado, e.categoria_id,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                m.nombre AS material
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN materiales m ON e.material_id = m.id
            WHERE e.nombre LIKE ?
            ORDER BY e.nombre
        `;

        const [rows] = await pool.query(query, [`%${termino}%`]);
        return rows;
    }

    // ============================================
    // VERIFICAR SI EXISTE POR ID
    // ============================================
    static async existe(id) {
        const [rows] = await pool.query(
            'SELECT id FROM elementos WHERE id = ?',
            [id]
        );
        return rows.length > 0;
    }

    // ============================================
    // CONTAR ELEMENTOS POR CATEGORÍA
    // ============================================
    static async contarPorCategoria(categoriaId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM elementos WHERE categoria_id = ?',
            [categoriaId]
        );
        return rows[0].total;
    }

    // ============================================
    // OBTENER ELEMENTOS CON STOCK BAJO
    // Elementos donde la disponibilidad < stock_minimo
    // ============================================
    static async obtenerConStockBajo() {
        const query = `
            SELECT
                e.id, e.nombre, e.cantidad, e.stock_minimo,
                e.costo_adquisicion, e.precio_unitario,
                e.requiere_series, e.estado,
                c.nombre AS categoria_nombre, c.emoji AS categoria_emoji,
                CASE
                    WHEN e.requiere_series = TRUE THEN (
                        SELECT COUNT(*) FROM series s
                        WHERE s.id_elemento = e.id AND s.estado NOT IN ('alquilado', 'dañado')
                    )
                    ELSE (
                        SELECT COALESCE(SUM(l.cantidad), 0) FROM lotes l
                        WHERE l.elemento_id = e.id AND l.estado NOT IN ('alquilado', 'dañado')
                    )
                END AS stock_disponible
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id
            WHERE e.stock_minimo > 0
            HAVING stock_disponible < e.stock_minimo
            ORDER BY (e.stock_minimo - stock_disponible) DESC
        `;

        const [rows] = await pool.query(query);
        return rows;
    }

    // ============================================
    // ESTADISTICAS GENERALES DE INVENTARIO
    // ============================================
    static async obtenerEstadisticasGenerales() {
        const query = `
            SELECT
                COUNT(*) AS total_elementos,
                SUM(CASE WHEN requiere_series = TRUE THEN 1 ELSE 0 END) AS elementos_con_series,
                SUM(CASE WHEN requiere_series = FALSE THEN 1 ELSE 0 END) AS elementos_con_lotes,
                COALESCE(SUM(costo_adquisicion * cantidad), 0) AS valor_total,
                COALESCE(SUM(precio_unitario * cantidad), 0) AS valor_precio_unitario
            FROM elementos
        `;
        const [rows] = await pool.query(query);

        // Total series
        const [seriesCount] = await pool.query('SELECT COUNT(*) AS total FROM series');
        // Total unidades en lotes
        const [lotesSum] = await pool.query('SELECT COALESCE(SUM(cantidad), 0) AS total FROM lotes');

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
    static async obtenerDistribucionPorEstado() {
        // Series por estado
        const querySeries = `
            SELECT estado, COUNT(*) AS cantidad
            FROM series
            GROUP BY estado
        `;
        // Lotes por estado
        const queryLotes = `
            SELECT estado, SUM(cantidad) AS cantidad
            FROM lotes
            GROUP BY estado
        `;

        const [series] = await pool.query(querySeries);
        const [lotes] = await pool.query(queryLotes);

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
    static async obtenerTopCategorias(limit = 10) {
        const query = `
            SELECT
                COALESCE(c.nombre, 'Sin categoría') AS categoria,
                c.emoji,
                COUNT(DISTINCT e.id) AS total_elementos,
                COALESCE(
                    (SELECT COUNT(*) FROM series s
                     INNER JOIN elementos e2 ON s.id_elemento = e2.id
                     WHERE e2.categoria_id = c.id),
                0) +
                COALESCE(
                    (SELECT SUM(l.cantidad) FROM lotes l
                     INNER JOIN elementos e2 ON l.elemento_id = e2.id
                     WHERE e2.categoria_id = c.id),
                0) AS cantidad_total
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id
            GROUP BY c.id, c.nombre, c.emoji
            ORDER BY cantidad_total DESC
            LIMIT ?
        `;

        const [rows] = await pool.query(query, [limit]);
        return rows;
    }

    // ============================================
    // DISTRIBUCION POR UBICACION
    // ============================================
    static async obtenerDistribucionPorUbicacion() {
        const query = `
            SELECT
                ub.nombre AS ubicacion,
                COALESCE(s_count.total_series, 0) AS series,
                COALESCE(l_count.total_lotes, 0) AS lotes,
                COALESCE(s_count.total_series, 0) + COALESCE(l_count.total_lotes, 0) AS total
            FROM ubicaciones ub
            LEFT JOIN (
                SELECT ubicacion_id, COUNT(*) as total_series
                FROM series WHERE ubicacion_id IS NOT NULL
                GROUP BY ubicacion_id
            ) s_count ON ub.id = s_count.ubicacion_id
            LEFT JOIN (
                SELECT ubicacion_id, SUM(cantidad) as total_lotes
                FROM lotes WHERE ubicacion_id IS NOT NULL
                GROUP BY ubicacion_id
            ) l_count ON ub.id = l_count.ubicacion_id
            WHERE ub.activo = TRUE
              AND (COALESCE(s_count.total_series, 0) + COALESCE(l_count.total_lotes, 0)) > 0
            ORDER BY total DESC
        `;

        const [rows] = await pool.query(query);
        return rows;
    }
}

module.exports = ElementoModel;
