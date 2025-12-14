// ============================================
// MODELO: CategoriaModel (Versión combinada)
// Clase + soporte para emoji + relaciones
// ============================================

const { pool } = require('../config/database');

class CategoriaModel {

  // ============================================
  // OBTENER TODAS LAS CATEGORÍAS
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.emoji,
        c.padre_id,
        c.created_at,
        padre.nombre AS padre_nombre,
        padre.emoji AS padre_emoji,
        (
          SELECT COUNT(*) 
          FROM categorias 
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id
      ORDER BY 
        c.padre_id IS NULL DESC,
        c.padre_id,
        c.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER SOLO CATEGORÍAS PADRE
  // ============================================
  static async obtenerPadres() {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.emoji,
        c.created_at,
        (
          SELECT COUNT(*) 
          FROM categorias 
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      WHERE c.padre_id IS NULL
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER CATEGORÍA POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.emoji,
        c.padre_id,
        c.created_at,
        padre.nombre AS padre_nombre,
        padre.emoji AS padre_emoji,
        (
          SELECT COUNT(*) 
          FROM categorias 
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id
      WHERE c.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER SUBCATEGORÍAS DE UNA CATEGORÍA
  // ============================================
  static async obtenerHijas(padreId) {
    const query = `
      SELECT 
        id,
        nombre,
        emoji,
        padre_id,
        created_at,
        (
          SELECT COUNT(*) 
          FROM elementos 
          WHERE categoria_id = categorias.id
        ) AS total_elementos
      FROM categorias
      WHERE padre_id = ?
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query, [padreId]);
    return rows;
  }

  // ============================================
  // CREAR NUEVA CATEGORÍA
  // ============================================
  static async crear({ nombre, emoji, padre_id }) {
    const query = `
      INSERT INTO categorias (nombre, emoji, padre_id)
      VALUES (?, ?, ?)
    `;
    const values = [nombre, emoji || null, padre_id || null];
    const [result] = await pool.query(query, values);
    return result;
  }

  // ============================================
  // ACTUALIZAR CATEGORÍA
  // ============================================
  static async actualizar(id, { nombre, emoji, padre_id }) {
    const query = `
      UPDATE categorias 
      SET nombre = ?, emoji = ?, padre_id = ?
      WHERE id = ?
    `;
    const values = [nombre, emoji || null, padre_id || null, id];
    const [result] = await pool.query(query, values);
    return result;
  }

  // ============================================
  // ELIMINAR CATEGORÍA
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // VERIFICAR SI TIENE SUBCATEGORÍAS
  // ============================================
  static async tieneSubcategorias(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM categorias WHERE padre_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // VERIFICAR SI TIENE ELEMENTOS
  // ============================================
  static async tieneElementos(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM elementos WHERE categoria_id = ?',
      [id]
    );
    const total = rows[0].total;
    console.log(`[DEBUG] tieneElementos(${id}): total=${total}, result=${total > 0}`);

    // Si es una categoría padre, también verificar subcategorías
    const [subcategoriasRows] = await pool.query(
      'SELECT id FROM categorias WHERE padre_id = ?',
      [id]
    );

    if (subcategoriasRows.length > 0) {
      console.log(`[DEBUG] Categoría ${id} tiene ${subcategoriasRows.length} subcategorías`);
      // Verificar elementos en subcategorías
      for (const subcat of subcategoriasRows) {
        const [elementosEnSubcat] = await pool.query(
          'SELECT COUNT(*) AS total FROM elementos WHERE categoria_id = ?',
          [subcat.id]
        );
        console.log(`[DEBUG] Subcategoría ${subcat.id} tiene ${elementosEnSubcat[0].total} elementos`);
        if (elementosEnSubcat[0].total > 0) {
          return true;
        }
      }
    }

    return total > 0;
  }

  // ============================================
  // OBTENER CATEGORÍAS CON PAGINACIÓN
  // ============================================
  /**
   * Obtiene categorías con paginación y ordenamiento
   * @param {Object} options - Opciones de paginación
   * @param {number} options.limit - Elementos por página
   * @param {number} options.offset - Offset
   * @param {string} options.sortBy - Campo de ordenamiento (default: 'nombre')
   * @param {string} options.order - Orden ASC/DESC (default: 'ASC')
   * @param {string} options.search - Término de búsqueda (opcional)
   * @returns {Array} Categorías paginadas
   */
  static async obtenerConPaginacion({ limit = 20, offset = 0, sortBy = 'nombre', order = 'ASC', search = null }) {
    // Construir query base
    let query = `
      SELECT
        c.id,
        c.nombre,
        c.emoji,
        c.padre_id,
        c.created_at,
        padre.nombre AS padre_nombre,
        padre.emoji AS padre_emoji,
        (
          SELECT COUNT(*)
          FROM categorias
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id
    `;

    const params = [];

    // Agregar búsqueda si existe
    if (search) {
      query += ' WHERE c.nombre LIKE ?';
      params.push(`%${search}%`);
    }

    // Agregar ordenamiento
    const validSortFields = ['nombre', 'id', 'created_at', 'padre_id'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY c.${sortField} ${sortOrder}`;

    // Agregar paginación
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Obtiene el total de categorías (para paginación)
   * @param {string} search - Término de búsqueda (opcional)
   * @returns {number} Total de categorías
   */
  static async contarTodas(search = null) {
    let query = 'SELECT COUNT(*) AS total FROM categorias';
    const params = [];

    if (search) {
      query += ' WHERE nombre LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  /**
   * Obtiene categorías padre con paginación
   * @param {Object} options - Opciones de paginación
   * @returns {Array} Categorías padre paginadas
   */
  static async obtenerPadresConPaginacion({ limit = 20, offset = 0, sortBy = 'nombre', order = 'ASC', search = null }) {
    let query = `
      SELECT
        c.id,
        c.nombre,
        c.emoji,
        c.created_at,
        (
          SELECT COUNT(*)
          FROM categorias
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      WHERE c.padre_id IS NULL
    `;

    const params = [];

    // Agregar búsqueda
    if (search) {
      query += ' AND c.nombre LIKE ?';
      params.push(`%${search}%`);
    }

    // Ordenamiento
    const validSortFields = ['nombre', 'id', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY c.${sortField} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Cuenta categorías padre (para paginación)
   * @param {string} search - Término de búsqueda (opcional)
   * @returns {number} Total de categorías padre
   */
  static async contarPadres(search = null) {
    let query = 'SELECT COUNT(*) AS total FROM categorias WHERE padre_id IS NULL';
    const params = [];

    if (search) {
      query += ' AND nombre LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }
}

module.exports = CategoriaModel;
