// ============================================
// MODELO: DescuentoModel
// Catálogo de descuentos predefinidos
// ============================================

const { pool } = require('../../../config/database');

class DescuentoModel {

  // ============================================
  // OBTENER TODOS (activos por defecto)
  // ============================================
  static async obtenerTodos(incluirInactivos = false) {
    let query = `
      SELECT id, nombre, descripcion, tipo, valor, activo, created_at
      FROM descuentos
    `;
    if (!incluirInactivos) {
      query += ' WHERE activo = TRUE';
    }
    query += ' ORDER BY nombre ASC';

    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(id) {
    const query = `
      SELECT id, nombre, descripcion, tipo, valor, activo, created_at
      FROM descuentos
      WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // CREAR
  // ============================================
  static async crear({ nombre, descripcion, tipo, valor }) {
    const query = `
      INSERT INTO descuentos (nombre, descripcion, tipo, valor)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
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
  static async actualizar(id, { nombre, descripcion, tipo, valor, activo }) {
    const query = `
      UPDATE descuentos
      SET nombre = ?, descripcion = ?, tipo = ?, valor = ?, activo = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      nombre,
      descripcion || null,
      tipo || 'porcentaje',
      valor || 0,
      activo !== undefined ? activo : true,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR (soft delete - desactivar)
  // ============================================
  static async eliminar(id) {
    const query = `UPDATE descuentos SET activo = FALSE WHERE id = ?`;
    const [result] = await pool.query(query, [id]);
    return result;
  }

  // ============================================
  // ELIMINAR PERMANENTE
  // ============================================
  static async eliminarPermanente(id) {
    const [result] = await pool.query('DELETE FROM descuentos WHERE id = ?', [id]);
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
