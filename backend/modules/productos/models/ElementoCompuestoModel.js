// ============================================
// MODELO: ElementoCompuestoModel
// Plantillas de productos de alquiler
// ============================================

const { pool } = require('../../../config/database');

class ElementoCompuestoModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos() {
    const query = `
      SELECT
        ec.id,
        ec.categoria_id,
        ec.nombre,
        ec.codigo,
        ec.descripcion,
        ec.precio_base,
        ec.deposito,
        ec.activo,
        ec.created_at,
        ec.updated_at,
        cp.nombre AS categoria_nombre,
        cp.emoji AS categoria_emoji,
        (SELECT COUNT(*) FROM compuesto_componentes cc WHERE cc.compuesto_id = ec.id) AS total_componentes
      FROM elementos_compuestos ec
      LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id
      ORDER BY ec.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR CATEGORÍA
  // ============================================
  static async obtenerPorCategoria(categoriaId) {
    const query = `
      SELECT
        ec.id,
        ec.categoria_id,
        ec.nombre,
        ec.codigo,
        ec.descripcion,
        ec.precio_base,
        ec.deposito,
        ec.activo,
        ec.created_at,
        (SELECT COUNT(*) FROM compuesto_componentes cc WHERE cc.compuesto_id = ec.id) AS total_componentes
      FROM elementos_compuestos ec
      WHERE ec.categoria_id = ? AND ec.activo = TRUE
      ORDER BY ec.nombre
    `;
    const [rows] = await pool.query(query, [categoriaId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT
        ec.id,
        ec.categoria_id,
        ec.nombre,
        ec.codigo,
        ec.descripcion,
        ec.precio_base,
        ec.deposito,
        ec.activo,
        ec.created_at,
        ec.updated_at,
        cp.nombre AS categoria_nombre,
        cp.emoji AS categoria_emoji
      FROM elementos_compuestos ec
      LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id
      WHERE ec.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR ID CON COMPONENTES
  // ============================================
  static async obtenerPorIdConComponentes(id) {
    // Obtener el elemento compuesto
    const elemento = await this.obtenerPorId(id);
    if (!elemento) return null;

    // Obtener sus componentes
    const queryComponentes = `
      SELECT
        cc.id,
        cc.elemento_id,
        cc.cantidad,
        cc.tipo,
        cc.grupo,
        cc.es_default,
        cc.precio_adicional,
        cc.orden,
        e.nombre AS elemento_nombre,
        e.requiere_series,
        c.nombre AS elemento_categoria,
        c.emoji AS elemento_emoji
      FROM compuesto_componentes cc
      INNER JOIN elementos e ON cc.elemento_id = e.id
      LEFT JOIN categorias c ON e.categoria_id = c.id
      WHERE cc.compuesto_id = ?
      ORDER BY cc.tipo, cc.grupo, cc.orden, e.nombre
    `;
    const [componentes] = await pool.query(queryComponentes, [id]);

    return {
      ...elemento,
      componentes
    };
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ categoria_id, nombre, codigo, descripcion, precio_base, deposito }) {
    const query = `
      INSERT INTO elementos_compuestos
        (categoria_id, nombre, codigo, descripcion, precio_base, deposito)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      categoria_id,
      nombre,
      codigo || null,
      descripcion || null,
      precio_base || 0,
      deposito || 0
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(id, { categoria_id, nombre, codigo, descripcion, precio_base, deposito, activo }) {
    const query = `
      UPDATE elementos_compuestos
      SET categoria_id = ?, nombre = ?, codigo = ?, descripcion = ?,
          precio_base = ?, deposito = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      categoria_id,
      nombre,
      codigo || null,
      descripcion || null,
      precio_base || 0,
      deposito || 0,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM elementos_compuestos WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // VERIFICAR SI TIENE COTIZACIONES
  // ============================================
  static async tieneCotizaciones(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM cotizaciones WHERE compuesto_id = ?',
      [id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // BUSCAR
  // ============================================
  static async buscar(termino) {
    const query = `
      SELECT
        ec.id,
        ec.nombre,
        ec.codigo,
        ec.precio_base,
        ec.activo,
        cp.nombre AS categoria_nombre,
        cp.emoji AS categoria_emoji
      FROM elementos_compuestos ec
      LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id
      WHERE ec.activo = TRUE
        AND (ec.nombre LIKE ? OR ec.codigo LIKE ?)
      ORDER BY ec.nombre
      LIMIT 20
    `;
    const busqueda = `%${termino}%`;
    const [rows] = await pool.query(query, [busqueda, busqueda]);
    return rows;
  }
}

module.exports = ElementoCompuestoModel;
