// ============================================
// MODELO: CategoriaModel (Versión combinada)
// Clase + soporte para emoji + relaciones
// ============================================

const { pool } = require('../../../config/database');

class CategoriaModel {

  // ============================================
  // OBTENER TODAS LAS CATEGORÍAS
  // ============================================
  static async obtenerTodas(tenantId) {
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
          WHERE padre_id = c.id AND tenant_id = ?
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id AND padre.tenant_id = ?
      WHERE c.tenant_id = ?
      ORDER BY
        c.padre_id IS NULL DESC,
        c.padre_id,
        c.nombre
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER SOLO CATEGORÍAS PADRE
  // ============================================
  static async obtenerPadres(tenantId) {
    const query = `
      SELECT
        c.id,
        c.nombre,
        c.emoji,
        c.created_at,
        (
          SELECT COUNT(*)
          FROM categorias
          WHERE padre_id = c.id AND tenant_id = ?
        ) AS total_subcategorias
      FROM categorias c
      WHERE c.padre_id IS NULL AND c.tenant_id = ?
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER CATEGORÍA POR ID
  // ============================================
  static async obtenerPorId(tenantId, id) {
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
          WHERE padre_id = c.id AND tenant_id = ?
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id AND padre.tenant_id = ?
      WHERE c.id = ? AND c.tenant_id = ?
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, id, tenantId]);
    return rows[0];
  }

  // ============================================
  // OBTENER SUBCATEGORÍAS DE UNA CATEGORÍA
  // ============================================
  static async obtenerHijas(tenantId, padreId) {
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
          WHERE categoria_id = categorias.id AND tenant_id = ?
        ) AS total_elementos
      FROM categorias
      WHERE padre_id = ? AND tenant_id = ?
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query, [tenantId, padreId, tenantId]);
    return rows;
  }

  // ============================================
  // CREAR NUEVA CATEGORÍA
  // ============================================
  static async crear(tenantId, { nombre, emoji, padre_id }) {
    const query = `
      INSERT INTO categorias (nombre, emoji, padre_id, tenant_id)
      VALUES (?, ?, ?, ?)
    `;
    const values = [nombre, emoji || null, padre_id || null, tenantId];
    const [result] = await pool.query(query, values);
    return result;
  }

  // ============================================
  // ACTUALIZAR CATEGORÍA
  // ============================================
  static async actualizar(tenantId, id, { nombre, emoji, padre_id }) {
    const query = `
      UPDATE categorias
      SET nombre = ?, emoji = ?, padre_id = ?
      WHERE id = ? AND tenant_id = ?
    `;
    const values = [nombre, emoji || null, padre_id || null, id, tenantId];
    const [result] = await pool.query(query, values);
    return result;
  }

  // ============================================
  // ELIMINAR CATEGORÍA
  // ============================================
  static async eliminar(tenantId, id) {
    const [result] = await pool.query('DELETE FROM categorias WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return result;
  }

  // ============================================
  // VERIFICAR SI TIENE SUBCATEGORÍAS
  // ============================================
  static async tieneSubcategorias(tenantId, id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM categorias WHERE padre_id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // VERIFICAR SI TIENE ELEMENTOS
  // ============================================
  static async tieneElementos(tenantId, id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM elementos WHERE categoria_id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    const total = rows[0].total;

    // Si es una categoría padre, también verificar subcategorías
    const [subcategoriasRows] = await pool.query(
      'SELECT id FROM categorias WHERE padre_id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (subcategoriasRows.length > 0) {
      for (const subcat of subcategoriasRows) {
        const [elementosEnSubcat] = await pool.query(
          'SELECT COUNT(*) AS total FROM elementos WHERE categoria_id = ? AND tenant_id = ?',
          [subcat.id, tenantId]
        );
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
  static async obtenerConPaginacion(tenantId, { limit = 20, offset = 0, sortBy = 'nombre', order = 'ASC', search = null }) {
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
          WHERE padre_id = c.id AND tenant_id = ?
        ) AS total_subcategorias
      FROM categorias c
      LEFT JOIN categorias padre ON c.padre_id = padre.id AND padre.tenant_id = ?
      WHERE c.tenant_id = ?
    `;

    const params = [tenantId, tenantId, tenantId];

    // Agregar búsqueda si existe
    if (search) {
      query += ' AND c.nombre LIKE ?';
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

  // ============================================
  // CONTAR TOTAL DE CATEGORÍAS
  // ============================================
  static async contarTodas(tenantId, search = null) {
    let query = 'SELECT COUNT(*) AS total FROM categorias WHERE tenant_id = ?';
    const params = [tenantId];

    if (search) {
      query += ' AND nombre LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  // ============================================
  // OBTENER CATEGORÍAS PADRE CON PAGINACIÓN
  // ============================================
  static async obtenerPadresConPaginacion(tenantId, { limit = 20, offset = 0, sortBy = 'nombre', order = 'ASC', search = null }) {
    let query = `
      SELECT
        c.id,
        c.nombre,
        c.emoji,
        c.created_at,
        (
          SELECT COUNT(*)
          FROM categorias
          WHERE padre_id = c.id AND tenant_id = ?
        ) AS total_subcategorias
      FROM categorias c
      WHERE c.padre_id IS NULL AND c.tenant_id = ?
    `;

    const params = [tenantId, tenantId];

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

  // ============================================
  // CONTAR CATEGORÍAS PADRE
  // ============================================
  static async contarPadres(tenantId, search = null) {
    let query = 'SELECT COUNT(*) AS total FROM categorias WHERE padre_id IS NULL AND tenant_id = ?';
    const params = [tenantId];

    if (search) {
      query += ' AND nombre LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }
}

module.exports = CategoriaModel;
