// ============================================
// MODEL: ElementoModel
// Responsabilidad: Consultas SQL de elementos
// ============================================

const { pool } = require('../config/database');

class ElementoModel {
    
    // ============================================
    // OBTENER TODOS LOS ELEMENTOS (con relaciones)
    // ============================================
    static async obtenerTodos() {
        try {
            const query = `
                SELECT
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.cantidad,
                    e.requiere_series,
                    e.estado,
                    e.ubicacion,
                    e.fecha_ingreso,
                    c.nombre AS categoria,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
                ORDER BY e.nombre
            `;

            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER ELEMENTOS CON PAGINACIÓN
    // ============================================
    static async obtenerConPaginacion({ limit, offset, sortBy = 'nombre', order = 'ASC', search = null }) {
        try {
            let query = `
                SELECT
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.cantidad,
                    e.requiere_series,
                    e.estado,
                    e.ubicacion,
                    e.fecha_ingreso,
                    c.nombre AS categoria,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
            `;

            const params = [];

            // Agregar búsqueda si existe
            if (search) {
                query += ` WHERE e.nombre LIKE ?`;
                params.push(`%${search}%`);
            }

            // Agregar ordenamiento
            const validSortFields = ['nombre', 'cantidad', 'estado', 'fecha_ingreso'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
            const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY e.${sortField} ${sortOrder}`;

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
    // CONTAR TOTAL DE ELEMENTOS
    // ============================================
    static async contarTodos(search = null) {
        try {
            let query = `SELECT COUNT(*) as total FROM elementos e`;
            const params = [];

            if (search) {
                query += ` WHERE e.nombre LIKE ?`;
                params.push(`%${search}%`);
            }

            const [rows] = await pool.query(query, params);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER ELEMENTO POR ID (con relaciones)
    // ============================================
    static async obtenerPorId(id) {
        try {
            const query = `
                SELECT
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.cantidad,
                    e.requiere_series,
                    e.categoria_id,
                    e.categoria_padre_id,
                    e.subcategoria_id,
                    e.estado,
                    e.ubicacion,
                    e.fecha_ingreso,
                    c.nombre AS categoria_nombre,
                    c.icono AS subcategoria_icono,
                    cp.id AS categoria_padre_id,
                    cp.nombre AS categoria_padre_nombre
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN categorias cp ON c.padre_id = cp.id
                WHERE e.id = ?
            `;
            
            const [rows] = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER ELEMENTOS POR CATEGORÍA
    // ============================================
    static async obtenerPorCategoria(categoriaId) {
        try {
            const query = `
                SELECT
                    e.id,
                    e.nombre,
                    e.cantidad,
                    e.requiere_series,
                    e.estado,
                    m.nombre AS material,
                    u.abreviatura AS unidad
                FROM elementos e
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
                WHERE e.categoria_id = ?
                ORDER BY e.nombre
            `;

            const [rows] = await pool.query(query, [categoriaId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER ELEMENTOS POR SUBCATEGORÍA CON INFO
    // ============================================
    static async obtenerPorSubcategoriaConInfo(subcategoriaId) {
        try {
            // Obtener elementos
            const queryElementos = `
                SELECT
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.cantidad,
                    e.requiere_series,
                    e.estado,
                    e.categoria_id AS subcategoria_id,
                    c.icono,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
                WHERE e.categoria_id = ?
                ORDER BY e.nombre
            `;

            // Obtener info de la subcategoría
            const querySubcategoria = `
                SELECT
                    c.id,
                    c.nombre,
                    c.icono,
                    cp.id AS categoria_padre_id,
                    cp.nombre AS categoria_padre_nombre
                FROM categorias c
                LEFT JOIN categorias cp ON c.padre_id = cp.id
                WHERE c.id = ?
            `;

            const [elementos] = await pool.query(queryElementos, [subcategoriaId]);
            const [subcategoriaRows] = await pool.query(querySubcategoria, [subcategoriaId]);
            const subcategoria = subcategoriaRows[0] || null;

            // ============================================
            // ENRIQUECER CADA ELEMENTO CON SERIES O LOTES
            // ============================================
            for (const elemento of elementos) {
                if (elemento.requiere_series) {
                    // Obtener series del elemento
                    const querySeries = `
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
                    const [series] = await pool.query(querySeries, [elemento.id]);

                    // Calcular estadísticas de series
                    const queryStatsSeries = `
                        SELECT
                            COUNT(*) AS total,
                            SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) AS disponible,
                            SUM(CASE WHEN estado = 'alquilado' THEN 1 ELSE 0 END) AS alquilado,
                            SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) AS mantenimiento
                        FROM series
                        WHERE id_elemento = ?
                    `;
                    const [statsRows] = await pool.query(queryStatsSeries, [elemento.id]);
                    const stats = statsRows[0] || { total: 0, disponible: 0, alquilado: 0, mantenimiento: 0 };

                    // Adjuntar datos al elemento
                    elemento.series = series;
                    elemento.estadisticas = stats;
                } else {
                    // Obtener lotes del elemento
                    const queryLotes = `
                        SELECT
                            l.id,
                            l.lote_numero,
                            l.cantidad,
                            l.estado,
                            l.ubicacion,
                            l.fecha_ingreso
                        FROM lotes l
                        WHERE l.elemento_id = ?
                        ORDER BY l.ubicacion, l.lote_numero DESC
                    `;
                    const [lotes] = await pool.query(queryLotes, [elemento.id]);

                    // Calcular estadísticas de lotes
                    const queryStatsLotes = `
                        SELECT
                            COUNT(*) AS total_lotes,
                            COALESCE(SUM(cantidad), 0) AS total,
                            COALESCE(SUM(CASE WHEN estado = 'nuevo' THEN cantidad ELSE 0 END), 0) AS nuevo,
                            COALESCE(SUM(CASE WHEN estado = 'bueno' THEN cantidad ELSE 0 END), 0) AS bueno,
                            COALESCE(SUM(CASE WHEN estado = 'mantenimiento' THEN cantidad ELSE 0 END), 0) AS mantenimiento,
                            COALESCE(SUM(CASE WHEN estado = 'dañado' THEN cantidad ELSE 0 END), 0) AS danado
                        FROM lotes
                        WHERE elemento_id = ?
                    `;
                    const [statsRows] = await pool.query(queryStatsLotes, [elemento.id]);
                    const stats = statsRows[0] || { total: 0, nuevo: 0, bueno: 0, mantenimiento: 0, danado: 0 };

                    // Organizar lotes por ubicación
                    const ubicacionesMap = {};
                    for (const lote of lotes) {
                        const ubicacionNombre = lote.ubicacion || 'Sin ubicación';
                        if (!ubicacionesMap[ubicacionNombre]) {
                            ubicacionesMap[ubicacionNombre] = {
                                nombre: ubicacionNombre,
                                cantidad_total: 0,
                                lotes: []
                            };
                        }
                        ubicacionesMap[ubicacionNombre].cantidad_total += lote.cantidad;
                        ubicacionesMap[ubicacionNombre].lotes.push(lote);
                    }
                    const ubicaciones = Object.values(ubicacionesMap);

                    // Adjuntar datos al elemento
                    elemento.ubicaciones = ubicaciones;
                    elemento.estadisticas = stats;
                }
            }

            return {
                elementos,
                subcategoria
            };
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER ELEMENTOS QUE REQUIEREN SERIES
    // ============================================
    static async obtenerConSeries() {
        try {
            const query = `
                SELECT 
                    e.id,
                    e.nombre,
                    e.cantidad,
                    e.estado,
                    c.nombre AS categoria,
                    COUNT(s.id) AS total_series
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN series s ON e.id = s.id_elemento
                WHERE e.requiere_series = TRUE
                GROUP BY e.id, e.nombre, e.cantidad, e.estado, c.nombre
                ORDER BY e.nombre
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER ELEMENTOS SIN SERIES (stock general)
    // ============================================
    static async obtenerSinSeries() {
        try {
            const query = `
                SELECT 
                    e.id,
                    e.nombre,
                    e.cantidad,
                    e.estado,
                    e.ubicacion,
                    c.nombre AS categoria,
                    m.nombre AS material,
                    u.abreviatura AS unidad
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
                WHERE e.requiere_series = FALSE
                ORDER BY e.nombre
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // CREAR NUEVO ELEMENTO
    // ============================================
    static async crear(datos) {
        try {
            const {
                nombre,
                descripcion,
                cantidad,
                requiere_series,
                categoria_id,
                material_id,
                unidad_id,
                estado,
                ubicacion,
                fecha_ingreso
            } = datos;
            
            const query = `
                INSERT INTO elementos
                (nombre, descripcion, cantidad, requiere_series, categoria_id,
                 material_id, unidad_id, estado, ubicacion, fecha_ingreso)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await pool.query(query, [
                nombre,
                descripcion || null,
                cantidad || 0,
                requiere_series || false,
                categoria_id || null,
                material_id || null,
                unidad_id || null,
                estado || 'bueno',
                ubicacion || null,
                fecha_ingreso || null
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR ELEMENTO
    // ============================================
    static async actualizar(id, datos) {
        try {
            const {
                nombre,
                descripcion,
                cantidad,
                requiere_series,
                categoria_id,
                material_id,
                unidad_id,
                estado,
                ubicacion,
                fecha_ingreso
            } = datos;
            
            const query = `
                UPDATE elementos
                SET nombre = ?,
                    descripcion = ?,
                    cantidad = ?,
                    requiere_series = ?,
                    categoria_id = ?,
                    material_id = ?,
                    unidad_id = ?,
                    estado = ?,
                    ubicacion = ?,
                    fecha_ingreso = ?
                WHERE id = ?
            `;

            const [result] = await pool.query(query, [
                nombre,
                descripcion || null,
                cantidad || 0,
                requiere_series || false,
                categoria_id || null,
                material_id || null,
                unidad_id || null,
                estado || 'bueno',
                ubicacion || null,
                fecha_ingreso || null,
                id
            ]);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ELIMINAR ELEMENTO
    // ============================================
    static async eliminar(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM elementos WHERE id = ?',
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // BUSCAR ELEMENTOS POR NOMBRE
    // ============================================
    static async buscarPorNombre(termino) {
        try {
            const query = `
                SELECT 
                    e.id,
                    e.nombre,
                    e.cantidad,
                    e.estado,
                    c.nombre AS categoria,
                    m.nombre AS material
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN materiales m ON e.material_id = m.id
                WHERE e.nombre LIKE ?
                ORDER BY e.nombre
            `;
            
            const [rows] = await pool.query(query, [`%${termino}%`]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ElementoModel;