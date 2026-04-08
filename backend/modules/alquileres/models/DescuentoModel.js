// ============================================
// MODELO: DescuentoModel
// Catálogo de descuentos predefinidos
// ============================================

const { pool } = require('../../../config/database');

class DescuentoModel {

  // ============================================
  // OBTENER TODOS (activos por defecto)
  // ============================================
  static async obtenerTodos(tenantId, incluirInactivos = false) {
    let query = `
      SELECT id, nombre, descripcion, tipo, valor, activo, created_at
      FROM descuentos
      WHERE tenant_id = ?
    `;
    const params = [tenantId];
    if (!incluirInactivos) {
      query += ' AND activo = TRUE';
    }
    query += ' ORDER BY nombre ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(tenantId, id) {
    const query = `
      SELECT id, nombre, descripcion, tipo, valor, activo, created_at
      FROM descuentos
      WHERE id = ? AND tenant_id = ?
    `;
    const [rows] = await pool.query(query, [id, tenantId]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear(tenantId, { nombre, descripcion, tipo, valor }) {
    const query = `
      INSERT INTO descuentos (tenant_id, nombre, descripcion, tipo, valor)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      tenantId,
      nombre,
      descripcion || null,
      tipo || 'porcentaje',
      valor || 0
    ]);
    return result;
  }

  // ============================================
  // ACTUALIZAR
  // ============================================
  static async actualizar(tenantId, id, { nombre, descripcion, tipo, valor, activo }) {
    const query = `
      UPDATE descuentos
      SET nombre = ?, descripcion = ?, tipo = ?, valor = ?, activo = ?
      WHERE id = ? AND tenant_id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      descripcion || null,
      tipo || 'porcentaje',
      valor || 0,
      activo !== undefined ? activo : true,
      id,
      tenantId
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR (soft delete - desactivar)
  // ============================================
  static async eliminar(tenantId, id) {
    const query = `UPDATE descuentos SET activo = FALSE WHERE id = ? AND tenant_id = ?`;
    const [result] = await pool.query(query, [id, tenantId]);
    return result;
  }

  // ============================================
  // ELIMINAR PERMANENTE
  // ============================================
  static async eliminarPermanente(tenantId, id) {
    const [result] = await pool.query('DELETE FROM descuentos WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return result;
  }

  // ============================================
  // CALCULAR MONTO DE DESCUENTO
  // ============================================
  static calcularMonto(descuento, baseCalculo) {
    if (descuento.tipo === 'porcentaje') {
      return baseCalculo * (parseFloat(descuento.valor) / 100);
    }
    return parseFloat(descuento.valor);
  }
}

module.exports = DescuentoModel;
