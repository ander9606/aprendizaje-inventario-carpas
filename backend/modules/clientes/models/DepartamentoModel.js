// ============================================
// MODELO: DepartamentoModel
// Catalogo maestro de departamentos
// ============================================

const { pool } = require('../../../config/database');

class DepartamentoModel {

  static async obtenerTodos(tenantId) {
    const [rows] = await pool.query(`
      SELECT d.id, d.nombre, d.activo, d.created_at, d.updated_at,
             COUNT(c.id) as total_ciudades
      FROM departamentos d
      LEFT JOIN ciudades c ON c.departamento_id = d.id AND c.activo = TRUE AND c.tenant_id = ?
      WHERE d.tenant_id = ?
      GROUP BY d.id
      ORDER BY d.nombre
    `, [tenantId, tenantId]);
    return rows;
  }

  static async obtenerActivos(tenantId) {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM departamentos WHERE activo = TRUE AND tenant_id = ? ORDER BY nombre',
      [tenantId]
    );
    return rows;
  }

  static async obtenerPorId(tenantId, id) {
    const [rows] = await pool.query(
      'SELECT id, nombre, activo, created_at, updated_at FROM departamentos WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    return rows[0];
  }

  static async crear(tenantId, { nombre }) {
    const [result] = await pool.query(
      'INSERT INTO departamentos (nombre, tenant_id) VALUES (?, ?)',
      [nombre, tenantId]
    );
    return result.insertId;
  }

  static async actualizar(tenantId, id, { nombre, activo }) {
    const [result] = await pool.query(
      'UPDATE departamentos SET nombre = ?, activo = ? WHERE id = ? AND tenant_id = ?',
      [nombre, activo !== undefined ? activo : true, id, tenantId]
    );
    return result.affectedRows;
  }

  static async eliminar(tenantId, id) {
    const [ciudades] = await pool.query(
      'SELECT COUNT(*) as total FROM ciudades WHERE departamento_id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (ciudades[0].total > 0) {
      throw new Error('No se puede eliminar un departamento con ciudades asociadas');
    }
    const [result] = await pool.query(
      'DELETE FROM departamentos WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    return result.affectedRows;
  }

  static async nombreExiste(tenantId, nombre, excluirId = null) {
    let query = 'SELECT COUNT(*) as total FROM departamentos WHERE nombre = ? AND tenant_id = ?';
    const params = [nombre, tenantId];

    if (excluirId) {
      query += ' AND id != ?';
      params.push(excluirId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }
}

module.exports = DepartamentoModel;
