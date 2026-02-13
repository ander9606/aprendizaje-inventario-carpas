// ============================================
// MODELO: EXPORT (consultas para exportación)
// ============================================

const { pool } = require('../../../config/database');

class ExportModel {

    /**
     * Obtiene inventario completo con detalle por estado y ubicación.
     * Combina series (individuales) y lotes (a granel) en un formato unificado.
     */
    static async obtenerInventarioCompleto() {
        // Series: cada serie individual agrupada por elemento + estado + ubicación
        const querySeries = `
            SELECT
                e.id AS elemento_id,
                e.nombre AS elemento,
                COALESCE(cp.nombre, c.nombre, 'Sin categoría') AS categoria_padre,
                CASE WHEN cp.nombre IS NOT NULL THEN c.nombre ELSE NULL END AS subcategoria,
                COALESCE(m.nombre, '-') AS material,
                COALESCE(CONCAT(u.nombre, ' (', u.abreviatura, ')'), '-') AS unidad,
                s.estado,
                COALESCE(ub.nombre, 'Sin ubicación') AS ubicacion,
                COUNT(*) AS cantidad,
                e.stock_minimo,
                e.costo_adquisicion,
                'serie' AS tipo_tracking
            FROM series s
            INNER JOIN elementos e ON s.id_elemento = e.id
            LEFT JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN categorias cp ON c.padre_id = cp.id
            LEFT JOIN materiales m ON e.material_id = m.id
            LEFT JOIN unidades u ON e.unidad_id = u.id
            LEFT JOIN ubicaciones ub ON s.ubicacion_id = ub.id
            GROUP BY e.id, e.nombre, categoria_padre, subcategoria, m.nombre,
                     u.nombre, u.abreviatura, s.estado, ub.nombre
            ORDER BY categoria_padre, subcategoria, e.nombre, s.estado
        `;

        // Lotes: cantidades agrupadas por elemento + estado + ubicación
        const queryLotes = `
            SELECT
                e.id AS elemento_id,
                e.nombre AS elemento,
                COALESCE(cp.nombre, c.nombre, 'Sin categoría') AS categoria_padre,
                CASE WHEN cp.nombre IS NOT NULL THEN c.nombre ELSE NULL END AS subcategoria,
                COALESCE(m.nombre, '-') AS material,
                COALESCE(CONCAT(u.nombre, ' (', u.abreviatura, ')'), '-') AS unidad,
                l.estado,
                COALESCE(ub.nombre, 'Sin ubicación') AS ubicacion,
                SUM(l.cantidad) AS cantidad,
                e.stock_minimo,
                e.costo_adquisicion,
                'lote' AS tipo_tracking
            FROM lotes l
            INNER JOIN elementos e ON l.elemento_id = e.id
            LEFT JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN categorias cp ON c.padre_id = cp.id
            LEFT JOIN materiales m ON e.material_id = m.id
            LEFT JOIN unidades u ON e.unidad_id = u.id
            LEFT JOIN ubicaciones ub ON l.ubicacion_id = ub.id
            GROUP BY e.id, e.nombre, categoria_padre, subcategoria, m.nombre,
                     u.nombre, u.abreviatura, l.estado, ub.nombre
            ORDER BY categoria_padre, subcategoria, e.nombre, l.estado
        `;

        const [series] = await pool.query(querySeries);
        const [lotes] = await pool.query(queryLotes);

        return [...series, ...lotes].sort((a, b) => {
            if (a.categoria_padre !== b.categoria_padre) return a.categoria_padre.localeCompare(b.categoria_padre);
            if ((a.subcategoria || '') !== (b.subcategoria || '')) return (a.subcategoria || '').localeCompare(b.subcategoria || '');
            if (a.elemento !== b.elemento) return a.elemento.localeCompare(b.elemento);
            return a.estado.localeCompare(b.estado);
        });
    }

    /**
     * Resumen agrupado por categoría
     */
    static async obtenerResumenPorCategoria() {
        const query = `
            SELECT
                COALESCE(cp.nombre, c.nombre, 'Sin categoría') AS categoria_padre,
                CASE WHEN cp.nombre IS NOT NULL THEN c.nombre ELSE NULL END AS subcategoria,
                COUNT(DISTINCT e.id) AS total_elementos,
                (
                    SELECT COALESCE(SUM(sub_l.cantidad), 0)
                    FROM lotes sub_l
                    INNER JOIN elementos sub_e ON sub_l.elemento_id = sub_e.id
                    WHERE sub_e.categoria_id = c.id
                ) +
                (
                    SELECT COUNT(*)
                    FROM series sub_s
                    INNER JOIN elementos sub_e ON sub_s.id_elemento = sub_e.id
                    WHERE sub_e.categoria_id = c.id
                ) AS cantidad_total
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN categorias cp ON c.padre_id = cp.id
            GROUP BY cp.nombre, c.nombre, c.id
            ORDER BY categoria_padre, subcategoria
        `;

        const [rows] = await pool.query(query);
        return rows;
    }

    /**
     * Resumen agrupado por ubicación
     */
    static async obtenerResumenPorUbicacion() {
        const query = `
            SELECT
                ub.nombre AS ubicacion,
                ub.tipo,
                COALESCE(s_count.total_series, 0) AS total_series,
                COALESCE(l_count.total_lotes, 0) AS total_lotes,
                COALESCE(s_count.total_series, 0) + COALESCE(l_count.total_lotes, 0) AS total
            FROM ubicaciones ub
            LEFT JOIN (
                SELECT ubicacion_id, COUNT(*) as total_series
                FROM series
                WHERE ubicacion_id IS NOT NULL
                GROUP BY ubicacion_id
            ) s_count ON ub.id = s_count.ubicacion_id
            LEFT JOIN (
                SELECT ubicacion_id, SUM(cantidad) as total_lotes
                FROM lotes
                WHERE ubicacion_id IS NOT NULL
                GROUP BY ubicacion_id
            ) l_count ON ub.id = l_count.ubicacion_id
            WHERE ub.activo = TRUE
              AND (COALESCE(s_count.total_series, 0) + COALESCE(l_count.total_lotes, 0)) > 0
            ORDER BY total DESC
        `;

        const [rows] = await pool.query(query);
        return rows;
    }

    /**
     * Elementos con stock disponible por debajo del mínimo
     */
    static async obtenerAlertasStockBajo() {
        const query = `
            SELECT
                e.nombre AS elemento,
                COALESCE(cp.nombre, c.nombre, 'Sin categoría') AS categoria,
                e.stock_minimo,
                COALESCE(e.costo_adquisicion, 0) AS costo_adquisicion,
                COALESCE(series_disp.total, 0) AS series_disponibles,
                COALESCE(lotes_disp.total, 0) AS lotes_disponibles,
                COALESCE(series_disp.total, 0) + COALESCE(lotes_disp.total, 0) AS stock_disponible,
                e.stock_minimo - (COALESCE(series_disp.total, 0) + COALESCE(lotes_disp.total, 0)) AS deficit
            FROM elementos e
            LEFT JOIN categorias c ON e.categoria_id = c.id
            LEFT JOIN categorias cp ON c.padre_id = cp.id
            LEFT JOIN (
                SELECT id_elemento, COUNT(*) AS total
                FROM series
                WHERE estado IN ('disponible', 'bueno', 'nuevo')
                GROUP BY id_elemento
            ) series_disp ON e.id = series_disp.id_elemento
            LEFT JOIN (
                SELECT elemento_id, SUM(cantidad) AS total
                FROM lotes
                WHERE estado IN ('disponible', 'bueno', 'nuevo')
                GROUP BY elemento_id
            ) lotes_disp ON e.id = lotes_disp.elemento_id
            WHERE e.stock_minimo > 0
            HAVING stock_disponible < e.stock_minimo
            ORDER BY deficit DESC
        `;

        const [rows] = await pool.query(query);
        return rows;
    }
}

module.exports = ExportModel;
