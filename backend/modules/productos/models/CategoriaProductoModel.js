// ============================================
// MODELO: CategoriaProductoModel
// Categorías para productos de alquiler
// ============================================

const { pool } = require('../../../config/database');

class CategoriaProductoModel {

  // ============================================
  // OBTENER TODAS LAS CATEGORÍAS (plano)
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT
        cp.id,
        cp.categoria_padre_id,
        cp.nombre,
        cp.descripcion,
        cp.emoji,
        cp.activo,
        cp.created_at,
        cp.updated_at,
        padre.nombre AS categoria_padre_nombre
      FROM categorias_productos cp
      LEFT JOIN categorias_productos padre ON cp.categoria_padre_id = padre.id
      ORDER BY COALESCE(padre.nombre, cp.nombre), cp.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER TODAS EN ÁRBOL JERÁRQUICO
  // ============================================
  static async obtenerArbol() {
    const query = `
      SELECT
        id,
        categoria_padre_id,
        nombre,
        descripcion,
        emoji,
        activo,
        created_at,
        updated_at
      FROM categorias_productos
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);

    // Construir árbol
    const categoriasMap = new Map();
    const raices = [];

    // Primer paso: crear mapa
    rows.forEach(cat => {
      categoriasMap.set(cat.id, { ...cat, hijos: [] });
    });

    // Segundo paso: asignar hijos a padres
    rows.forEach(cat => {
      const categoria = categoriasMap.get(cat.id);
      if (cat.categoria_padre_id) {
        const padre = categoriasMap.get(cat.categoria_padre_id);
        if (padre) {
          padre.hijos.push(categoria);
        } else {
          raices.push(categoria);
        }
      } else {
        raices.push(categoria);
      }
    });

    return raices;
  }

  // ============================================
  // OBTENER CATEGORÍAS RAÍZ (sin padre)
  // ============================================
  static async obtenerRaices() {
    const query = `
      SELECT
        id,
        nombre,
        descripcion,
        emoji,
        activo
      FROM categorias_productos
      WHERE categoria_padre_id IS NULL
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER HIJOS DE UNA CATEGORÍA
  // ============================================
  static async obtenerHijos(categoriaId) {
    const query = `
      SELECT
        id,
        categoria_padre_id,
        nombre,
        descripcion,
        emoji,
        activo
      FROM categorias_productos
      WHERE categoria_padre_id = ?
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query, [categoriaId]);
    return rows;
  }

  // ============================================
  // OBTENER SOLO ACTIVAS (plano)
  // ============================================
  static async obtenerActivas() {
    const query = `
      SELECT
        cp.id,
        cp.categoria_padre_id,
        cp.nombre,
        cp.descripcion,
        cp.emoji,
        cp.created_at,
        padre.nombre AS categoria_padre_nombre
      FROM categorias_productos cp
      LEFT JOIN categorias_productos padre ON cp.categoria_padre_id = padre.id
      WHERE cp.activo = TRUE
      ORDER BY COALESCE(padre.nombre, cp.nombre), cp.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER ACTIVAS EN ÁRBOL
  // ============================================
  static async obtenerActivasArbol() {
    const query = `
      SELECT
        id,
        categoria_padre_id,
        nombre,
        descripcion,
        emoji
      FROM categorias_productos
      WHERE activo = TRUE
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);

    // Construir árbol (solo activas)
    const categoriasMap = new Map();
    const raices = [];

    rows.forEach(cat => {
      categoriasMap.set(cat.id, { ...cat, hijos: [] });
    });

    rows.forEach(cat => {
      const categoria = categoriasMap.get(cat.id);
      if (cat.categoria_padre_id && categoriasMap.has(cat.categoria_padre_id)) {
        categoriasMap.get(cat.categoria_padre_id).hijos.push(categoria);
      } else {
        raices.push(categoria);
      }
    });

    return raices;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT
        cp.id,
        cp.categoria_padre_id,
        cp.nombre,
        cp.descripcion,
        cp.emoji,
        cp.activo,
        cp.created_at,
        cp.updated_at,
        padre.nombre AS categoria_padre_nombre
      FROM categorias_productos cp
      LEFT JOIN categorias_productos padre ON cp.categoria_padre_id = padre.id
      WHERE cp.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ nombre, descripcion, emoji, categoria_padre_id }) {
    const query = `
      INSERT INTO categorias_productos (categoria_padre_id, nombre, descripcion, emoji)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      categoria_padre_id || null,
      nombre,
      descripcion || null,
      emoji || null
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { nombre, descripcion, emoji, activo, categoria_padre_id }) {
    const query = `
      UPDATE categorias_productos
      SET categoria_padre_id = ?, nombre = ?, descripcion = ?, emoji = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      categoria_padre_id || null,
      nombre,
      descripcion || null,
      emoji || null,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM categorias_productos WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // VERIFICAR SI TIENE PRODUCTOS
  // ============================================
  static async tieneProductos(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM elementos_compuestos WHERE categoria_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // OBTENER CATEGORÍAS CON CONTEO DE PRODUCTOS
  // Para el selector de productos en cotizaciones
  // Muestra todas las categorías que tienen productos
  // ============================================
  static async obtenerCategoriasConConteo() {
    const query = `
      SELECT
        cp.id,
        cp.nombre,
        cp.descripcion,
        cp.emoji,
        cp.categoria_padre_id,
        padre.nombre AS categoria_padre_nombre,
        COUNT(ec.id) AS total_productos
      FROM categorias_productos cp
      LEFT JOIN categorias_productos padre ON cp.categoria_padre_id = padre.id
      LEFT JOIN elementos_compuestos ec ON ec.categoria_id = cp.id AND ec.activo = TRUE
      WHERE cp.activo = TRUE
      GROUP BY cp.id, cp.nombre, cp.descripcion, cp.emoji, cp.categoria_padre_id, padre.nombre
      HAVING COUNT(ec.id) > 0
      ORDER BY COALESCE(padre.nombre, cp.nombre), cp.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // CONTAR TODAS
  // ============================================
  static async contarTodas() {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM categorias_productos');
    return rows[0].total;
  }

  // ============================================
  // VERIFICAR SI TIENE SUBCATEGORÍAS
  // ============================================
  static async tieneSubcategorias(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM categorias_productos WHERE categoria_padre_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }
}

module.exports = CategoriaProductoModel;
