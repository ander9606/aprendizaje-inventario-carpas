// ============================================
// MODELO: DepartamentoModel
// Catalogo maestro de departamentos
// ============================================

const { pool } = require('../../../config/database');
const BaseModel = require('../../../utils/BaseModel');

const base = new BaseModel({
  table: 'departamentos',
  alias: 'd',
  columns: ['id', 'nombre', 'activo', 'created_at', 'updated_at']
});

class DepartamentoModel {

  static async obtenerTodos() {
    const [rows] = await pool.query(`
      SELECT d.id, d.nombre, d.activo, d.created_at, d.updated_at,
             COUNT(c.id) as total_ciudades
      FROM departamentos d
      LEFT JOIN ciudades c ON c.departamento_id = d.id AND c.activo = TRUE
      GROUP BY d.id
      ORDER BY d.nombre
    `);
    return rows;
  }

  static async obtenerActivos() {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM departamentos WHERE activo = TRUE ORDER BY nombre'
    );
    return rows;
  }

  static obtenerPorId(id) {
    return base.obtenerPorId(id);
  }

  static crear({ nombre }) {
    return base.crear({ nombre });
  }

  static actualizar(id, { nombre, activo }) {
    return base.actualizar(id, { nombre, activo: activo !== undefined ? activo : true });
  }

  static async eliminar(id) {
    const [ciudades] = await pool.query(
      'SELECT COUNT(*) as total FROM ciudades WHERE departamento_id = ?',
      [id]
    );
    if (ciudades[0].total > 0) {
      throw new Error('No se puede eliminar un departamento con ciudades asociadas');
    }
    return base.eliminar(id);
  }

  static nombreExiste(nombre, excluirId = null) {
    return base.nombreExiste(nombre, excluirId);
  }
}

module.exports = DepartamentoModel;
