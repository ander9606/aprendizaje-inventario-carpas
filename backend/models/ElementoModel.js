// ============================================
// MODEL: ElementoModel (VERSIÓN CORREGIDA)
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
                    e.categoria_id,
                    c.nombre AS categoria_nombre,
                    c.emoji AS categoria_emoji,
                    c.padre_id AS categoria_padre_id,
                    cp.nombre AS categoria_padre_nombre,
                    cp.emoji AS categoria_padre_emoji,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN categorias cp ON c.padre_id = cp.id
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
            // Mapeo de campos válidos con su tabla
            const sortFieldMap = {
                'nombre': 'e.nombre',
                'cantidad': 'e.cantidad',
                'estado': 'e.estado',
                'fecha_ingreso': 'e.fecha_ingreso',
                'id': 'e.id'
            };

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
                    e.categoria_id,
                    c.nombre AS categoria_nombre,
                    c.emoji AS categoria_emoji,
                    c.padre_id AS categoria_padre_id,
                    cp.nombre AS categoria_padre_nombre,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN categorias cp ON c.padre_id = cp.id
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
            `;

            const params = [];

            // Agregar búsqueda si existe
            if (search) {
                query += ` WHERE e.nombre LIKE ?`;
                params.push(`%${search}%`);
            }

            // Agregar ordenamiento seguro
            const sortField = sortFieldMap[sortBy] || 'e.nombre';
            const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${sortField} ${sortOrder}`;

            // Agregar paginación
            query += ` LIMIT ? OFFSET ?`;
            params.push(Number(limit), Number(offset));

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
    // CORREGIDO: Eliminados campos inexistentes
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
                    e.estado,
                    e.ubicacion,
                    e.fecha_ingreso,
                    e.categoria_id,
                    e.material_id,
                    e.unidad_id,
                    c.nombre AS categoria_nombre,
                    c.emoji AS categoria_emoji,
                    c.padre_id AS categoria_padre_id,
                    cp.id AS padre_id,
                    cp.nombre AS categoria_padre_nombre,
                    cp.emoji AS categoria_padre_emoji,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN categorias cp ON c.padre_id = cp.id
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
                WHERE e.id = ?
            `;
            
            const [rows] = await pool.query(query, [id]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // OBTENER ELEMENTOS POR CATEGORÍA
    // (Incluye elementos de la categoría padre Y sus subcategorías)
    // ============================================
    static async obtenerPorCategoria(categoriaId) {
        try {
            const query = `
                SELECT
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.cantidad,
                    e.requiere_series,
                    e.estado,
                    e.categoria_id,
                    c.nombre AS categoria_nombre,
                    c.emoji AS categoria_emoji,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
                LEFT JOIN categorias c ON e.categoria_id = c.id
                LEFT JOIN materiales m ON e.material_id = m.id
                LEFT JOIN unidades u ON e.unidad_id = u.id
                WHERE e.categoria_id = ?
                   OR e.categoria_id IN (SELECT id FROM categorias WHERE padre_id = ?)
                ORDER BY e.nombre
            `;

            const [rows] = await pool.query(query, [categoriaId, categoriaId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER ELEMENTOS POR SUBCATEGORÍA CON INFO
    // CORREGIDO: Alias consistentes
    // ============================================
    static async obtenerPorSubcategoriaConInfo(subcategoriaId) {
        try {
            // Obtener elementos de esta subcategoría específica
            const queryElementos = `
                SELECT
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.cantidad,
                    e.requiere_series,
                    e.estado,
                    e.categoria_id,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
                FROM elementos e
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
                    c.emoji,
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

            return {
                elementos,
                subcategoria
            };
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // OBTENER ELEMENTOS DIRECTOS DE UNA CATEGORÍA
    // (Solo elementos asignados directamente, sin subcategorías)
    // ============================================
    static async obtenerDirectosPorCategoria(categoriaId) {
        try {
            const query = `
                SELECT
                    e.id,
                    e.nombre,
                    e.descripcion,
                    e.cantidad,
                    e.requiere_series,
                    e.estado,
                    e.categoria_id,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
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
                    e.categoria_id,
                    c.nombre AS categoria_nombre,
                    c.emoji AS categoria_emoji,
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
                    e.categoria_id,
                    c.nombre AS categoria_nombre,
                    c.emoji AS categoria_emoji,
                    m.nombre AS material,
                    u.nombre AS unidad,
                    u.abreviatura AS unidad_abrev
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
    // CORREGIDO: Manejo seguro de valores nulos y tipos
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

            // Normalizar valores
            const valores = [
                nombre,
                descripcion !== undefined && descripcion !== '' ? descripcion : null,
                cantidad !== undefined && cantidad !== null ? Number(cantidad) : 0,
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
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================
    // ACTUALIZAR ELEMENTO
    // CORREGIDO: Manejo seguro de valores nulos y tipos
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

            // Normalizar valores
            const valores = [
                nombre,
                descripcion !== undefined && descripcion !== '' ? descripcion : null,
                cantidad !== undefined && cantidad !== null ? Number(cantidad) : 0,
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
                    e.descripcion,
                    e.cantidad,
                    e.estado,
                    e.categoria_id,
                    c.nombre AS categoria_nombre,
                    c.emoji AS categoria_emoji,
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

    // ============================================
    // VERIFICAR SI EXISTE POR ID
    // ============================================
    static async existe(id) {
        try {
            const [rows] = await pool.query(
                'SELECT id FROM elementos WHERE id = ?',
                [id]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    // ============================================
    // CONTAR ELEMENTOS POR CATEGORÍA
    // ============================================
    static async contarPorCategoria(categoriaId) {
        try {
            const [rows] = await pool.query(
                'SELECT COUNT(*) as total FROM elementos WHERE categoria_id = ?',
                [categoriaId]
            );
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ElementoModel;