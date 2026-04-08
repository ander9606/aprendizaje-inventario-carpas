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

  async obtenerTodos(tenantId) {
    const [rows] = await pool.query(
      `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias} WHERE ${this.alias}.tenant_id = ? ORDER BY ${this.alias}.${this.defaultSort}`,
      [tenantId]
    );
    return rows;
  }

  async obtenerPorId(tenantId, id) {
    const [rows] = await pool.query(
      `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias} WHERE ${this.alias}.id = ? AND ${this.alias}.tenant_id = ?`,
      [id, tenantId]
    );
    return rows[0];
  }

  async obtenerConPaginacion(tenantId, { limit, offset, sortBy, order = 'ASC', search = null }) {
    let query = `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias} WHERE ${this.alias}.tenant_id = ?`;
    const params = [tenantId];

    if (search) {
      const conditions = this.searchColumns
        .map(col => `${col.includes('.') ? col : `${this.alias}.${col}`} LIKE ?`)
        .join(' OR ');
      query += ` AND (${conditions})`;
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

  async contarTodos(tenantId, search = null) {
    let query = `SELECT COUNT(*) as total FROM ${this.table} ${this.alias} WHERE ${this.alias}.tenant_id = ?`;
    const params = [tenantId];

    if (search) {
      const conditions = this.searchColumns
        .map(col => `${col.includes('.') ? col : `${this.alias}.${col}`} LIKE ?`)
        .join(' OR ');
      query += ` AND (${conditions})`;
      for (let i = 0; i < this.searchColumns.length; i++) {
        params.push(`%${search}%`);
      }
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  async obtenerPorNombre(tenantId, nombre) {
    const [rows] = await pool.query(
      `SELECT ${this.selectColumns} FROM ${this.table} ${this.alias} WHERE ${this.alias}.nombre = ? AND ${this.alias}.tenant_id = ? LIMIT 1`,
      [nombre, tenantId]
    );
    return rows[0];
  }

  async nombreExiste(tenantId, nombre, excluirId = null) {
    let query = `SELECT COUNT(*) as total FROM ${this.table} WHERE nombre = ? AND tenant_id = ?`;
    const params = [nombre, tenantId];
    if (excluirId) {
      query += ' AND id != ?';
      params.push(excluirId);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }

  async crear(tenantId, data) {
    const dataWithTenant = { ...data, tenant_id: tenantId };
    const campos = Object.keys(dataWithTenant);
    const valores = Object.values(dataWithTenant);
    const placeholders = campos.map(() => '?').join(', ');

    const [result] = await pool.query(
      `INSERT INTO ${this.table} (${campos.join(', ')}) VALUES (${placeholders})`,
      valores
    );
    return result.insertId;
  }

  async actualizar(tenantId, id, data) {
    const campos = Object.keys(data);
    const valores = Object.values(data);
    const setClause = campos.map(c => `${c} = ?`).join(', ');

    const [result] = await pool.query(
      `UPDATE ${this.table} SET ${setClause} WHERE id = ? AND tenant_id = ?`,
      [...valores, id, tenantId]
    );
    return result.affectedRows;
  }

  async eliminar(tenantId, id) {
    const [result] = await pool.query(
      `DELETE FROM ${this.table} WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );
    return result.affectedRows;
  }
}

module.exports = BaseModel;
