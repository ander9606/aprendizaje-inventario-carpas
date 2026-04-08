// ============================================
// MODELO: ElementoCompuestoModel
// Plantillas de productos de alquiler
// ============================================

const { pool } = require('../../../config/database');

class ElementoCompuestoModel {

  // ============================================
  // OBTENER TODOS
  // ============================================
  static async obtenerTodos(tenantId) {
    const query = `
      SELECT
        ec.id,
        ec.categoria_id,
        ec.nombre,
        ec.codigo,
        ec.descripcion,
        ec.imagen,
        ec.precio_base,
        ec.deposito,
        ec.activo,
        ec.created_at,
        ec.updated_at,
        cp.nombre AS categoria_nombre,
        cp.emoji AS categoria_emoji,
        (SELECT COUNT(*) FROM compuesto_componentes cc WHERE cc.compuesto_id = ec.id) AS total_componentes
      FROM elementos_compuestos ec
      LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id AND cp.tenant_id = ?
      WHERE ec.tenant_id = ?
      ORDER BY ec.nombre
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER POR CATEGORÍA
  // ============================================
  static async obtenerPorCategoria(tenantId, categoriaId) {
    const query = `
      SELECT
        ec.id,
        ec.categoria_id,
        ec.nombre,
        ec.codigo,
        ec.descripcion,
        ec.imagen,
        ec.precio_base,
        ec.deposito,
        ec.activo,
        ec.created_at,
        (SELECT COUNT(*) FROM compuesto_componentes cc WHERE cc.compuesto_id = ec.id) AS total_componentes
      FROM elementos_compuestos ec
      WHERE ec.tenant_id = ? AND ec.categoria_id = ? AND ec.activo = TRUE
      ORDER BY ec.nombre
    `;
    const [rows] = await pool.query(query, [tenantId, categoriaId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(tenantId, id) {
    const query = `
      SELECT
        ec.id,
        ec.categoria_id,
        ec.nombre,
        ec.codigo,
        ec.descripcion,
        ec.imagen,
        ec.precio_base,
        ec.deposito,
        ec.activo,
        ec.created_at,
        ec.updated_at,
        cp.nombre AS categoria_nombre,
        cp.emoji AS categoria_emoji
      FROM elementos_compuestos ec
      LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id AND cp.tenant_id = ?
      WHERE ec.tenant_id = ? AND ec.id = ?
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, id]);
    return rows[0];
  }

  // ============================================
  // OBTENER POR ID CON COMPONENTES
  // ============================================
  static async obtenerPorIdConComponentes(tenantId, id) {
    // Obtener el elemento compuesto
    const elemento = await this.obtenerPorId(tenantId, id);
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
      INNER JOIN elementos e ON cc.elemento_id = e.id AND e.tenant_id = ?
      LEFT JOIN categorias c ON e.categoria_id = c.id AND c.tenant_id = ?
      WHERE cc.compuesto_id = ?
      ORDER BY cc.tipo, cc.grupo, cc.orden, e.nombre
    `;
    const [componentes] = await pool.query(queryComponentes, [tenantId, tenantId, id]);

    return {
      ...elemento,
      componentes
    };
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear(tenantId, { categoria_id, nombre, codigo, descripcion, precio_base, deposito }) {
    const query = `
      INSERT INTO elementos_compuestos
        (tenant_id, categoria_id, nombre, codigo, descripcion, precio_base, deposito)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      tenantId,
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
  static async actualizar(tenantId, id, { categoria_id, nombre, codigo, descripcion, precio_base, deposito, activo }) {
    const query = `
      UPDATE elementos_compuestos
      SET categoria_id = ?, nombre = ?, codigo = ?, descripcion = ?,
          precio_base = ?, deposito = ?, activo = ?
      WHERE tenant_id = ? AND id = ?
    `;
    const [result] = await pool.query(query, [
      categoria_id,
      nombre,
      codigo || null,
      descripcion || null,
      precio_base || 0,
      deposito || 0,
      activo !== undefined ? activo : true,
      tenantId,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(tenantId, id) {
    const [result] = await pool.query('DELETE FROM elementos_compuestos WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return result;
  }

  // ============================================
  // VERIFICAR SI TIENE COTIZACIONES
  // ============================================
  static async tieneCotizaciones(tenantId, id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM cotizaciones WHERE tenant_id = ? AND compuesto_id = ?',
      [tenantId, id]
    );
    return rows[0].total > 0;
  }

  // ============================================
  // ACTUALIZAR IMAGEN
  // ============================================
  static async actualizarImagen(tenantId, id, imagenUrl) {
    const [result] = await pool.query(
      'UPDATE elementos_compuestos SET imagen = ? WHERE tenant_id = ? AND id = ?',
      [imagenUrl, tenantId, id]
    );
    return result.affectedRows;
  }

  // ============================================
  // BUSCAR
  // ============================================
  static async buscar(tenantId, termino) {
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
      LEFT JOIN categorias_productos cp ON ec.categoria_id = cp.id AND cp.tenant_id = ?
      WHERE ec.tenant_id = ? AND ec.activo = TRUE
        AND (ec.nombre LIKE ? OR ec.codigo LIKE ?)
      ORDER BY ec.nombre
      LIMIT 20
    `;
    const busqueda = `%${termino}%`;
    const [rows] = await pool.query(query, [tenantId, tenantId, busqueda, busqueda]);
    return rows;
  }
}

module.exports = ElementoCompuestoModel;
