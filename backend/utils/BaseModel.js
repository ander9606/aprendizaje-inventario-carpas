// ============================================
// BASE MODEL: Reusable CRUD operations
// ============================================

const { pool } = require('../config/database');

class BaseModel {

  /**
   * @param {Object} config
   * @param {string} config.table - Table name
   * @param {string} [config.alias] - Table alias for queries (default: first letter)
   * @param {string[]} [config.columns] - Columns for SELECT (default: ['*'])
   * @param {string} [config.defaultSort] - Default ORDER BY column (default: 'nombre')
   * @param {Object} [config.sortFieldMap] - Allowed sort fields mapping
   * @param {string[]} [config.searchColumns] - Columns to search with LIKE (default: ['nombre'])
   */
  constructor(config) {
    this.table = config.table;
    this.alias = config.alias || config.table[0];
    this.columns = config.columns || ['*'];
    this.defaultSort = config.defaultSort || 'nombre';
    this.searchColumns = config.searchColumns || ['nombre'];
    this.sortFieldMap = config.sortFieldMap || {
      nombre: `${this.alias}.nombre`,
      id: `${this.alias}.id`,
      created_at: `${this.alias}.created_at`
    };
  }

  get selectColumns() {
    if (this.columns[0] === '*') {
      return `${this.alias}.*`;
    }
    return this.columns.map(c => c.includes('.') ? c : `${this.alias}.${c}`).join(', ');
  }

  async obtenerTodos() {
    const [rows] = await pool.query(
      `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias} ORDER BY ${this.alias}.${this.defaultSort}`
    );
    return rows;
  }

  async obtenerPorId(id) {
    const [rows] = await pool.query(
      `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias} WHERE ${this.alias}.id = ?`,
      [id]
    );
    return rows[0];
  }

  async obtenerConPaginacion({ limit, offset, sortBy, order = 'ASC', search = null }) {
    let query = `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias}`;
    const params = [];

    if (search) {
      const conditions = this.searchColumns
        .map(col => `${col.includes('.') ? col : `${this.alias}.${col}`} LIKE ?`)
        .join(' OR ');
      query += ` WHERE (${conditions})`;
      for (let i = 0; i < this.searchColumns.length; i++) {
        params.push(`%${search}%`);
      }
    }

    const sortField = this.sortFieldMap[sortBy] || `${this.alias}.${this.defaultSort}`;
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async contarTodos(search = null) {
    let query = `SELECT COUNT(*) as total FROM ${this.table} ${this.alias}`;
    const params = [];

    if (search) {
      const conditions = this.searchColumns
        .map(col => `${col.includes('.') ? col : `${this.alias}.${col}`} LIKE ?`)
        .join(' OR ');
      query += ` WHERE (${conditions})`;
      for (let i = 0; i < this.searchColumns.length; i++) {
        params.push(`%${search}%`);
      }
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  async obtenerPorNombre(nombre) {
    const [rows] = await pool.query(
      `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias} WHERE ${this.alias}.nombre = ? LIMIT 1`,
      [nombre]
    );
    return rows[0];
  }

  async nombreExiste(nombre, excluirId = null) {
    let query = `SELECT COUNT(*) as total FROM ${this.table} WHERE nombre = ?`;
    const params = [nombre];
    if (excluirId) {
      query += ' AND id != ?';
      params.push(excluirId);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }

  async crear(data) {
    const campos = Object.keys(data);
    const valores = Object.values(data);
    const placeholders = campos.map(() => '?').join(', ');

    const [result] = await pool.query(
      `INSERT INTO ${this.table} (${campos.join(', ')}) VALUES (${placeholders})`,
      valores
    );
    return result.insertId;
  }

  async actualizar(id, data) {
    const campos = Object.keys(data);
    const valores = Object.values(data);
    const setClause = campos.map(c => `${c} = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE ${this.table} SET ${setClause} WHERE id = ?`,
      [...valores, id]
    );
    return result.affectedRows;
  }

  async eliminar(id) {
    const [result] = await pool.query(
      `DELETE FROM ${this.table} WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = BaseModel;
