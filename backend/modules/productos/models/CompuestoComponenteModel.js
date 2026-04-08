// ============================================
// MODELO: CompuestoComponenteModel
// Componentes de cada plantilla (fijos, alternativas, adicionales)
// ============================================

const { pool } = require('../../../config/database');

class CompuestoComponenteModel {

  // ============================================
  // OBTENER COMPONENTES DE UN COMPUESTO
  // ============================================
  static async obtenerPorCompuesto(tenantId, compuestoId) {
    const query = `
      SELECT
        cc.id,
        cc.compuesto_id,
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
      WHERE cc.compuesto_id = ? AND cc.tenant_id = ?
      ORDER BY cc.tipo, cc.grupo, cc.orden, e.nombre
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, compuestoId, tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER COMPONENTES AGRUPADOS
  // ============================================
  static async obtenerAgrupados(tenantId, compuestoId) {
    const componentes = await this.obtenerPorCompuesto(tenantId, compuestoId);

    // Agrupar por tipo
    const fijos = componentes.filter(c => c.tipo === 'fijo');
    const alternativas = componentes.filter(c => c.tipo === 'alternativa');
    const adicionales = componentes.filter(c => c.tipo === 'adicional');

    // Agrupar alternativas por grupo
    const gruposAlternativas = {};
    alternativas.forEach(comp => {
      if (!gruposAlternativas[comp.grupo]) {
        gruposAlternativas[comp.grupo] = {
          nombre: comp.grupo,
          cantidad_requerida: comp.cantidad,
          opciones: []
        };
      }
      gruposAlternativas[comp.grupo].opciones.push(comp);
    });

    return {
      fijos,
      alternativas: Object.values(gruposAlternativas),
      adicionales
    };
  }

  // ============================================
  // OBTENER POR ID
  // ============================================
  static async obtenerPorId(tenantId, id) {
    const query = `
      SELECT
        cc.*,
        e.nombre AS elemento_nombre,
        e.requiere_series
      FROM compuesto_componentes cc
      INNER JOIN elementos e ON cc.elemento_id = e.id AND e.tenant_id = ?
      WHERE cc.tenant_id = ? AND cc.id = ?
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, id]);
    return rows[0];
  }

  // ============================================
  // AGREGAR COMPONENTE
  // ============================================
  static async agregar(tenantId, { compuesto_id, elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden }) {
    const query = `
      INSERT INTO compuesto_componentes
        (tenant_id, compuesto_id, elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      tenantId,
      compuesto_id,
      elemento_id,
      cantidad || 1,
      tipo || 'fijo',
      grupo || null,
      es_default || false,
      precio_adicional || 0,
      orden || 0
    ]);
    return result;
  }

  // ============================================
  // AGREGAR MÚLTIPLES COMPONENTES
  // ============================================
  static async agregarMultiples(tenantId, compuestoId, componentes) {
    if (!componentes || componentes.length === 0) return { affectedRows: 0 };

    const query = `
      INSERT INTO compuesto_componentes
        (tenant_id, compuesto_id, elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden)
      VALUES ?
    `;

    const valores = componentes.map((c, index) => [
      tenantId,
      compuestoId,
      c.elemento_id,
      c.cantidad || 1,
      c.tipo || 'fijo',
      c.grupo || null,
      c.es_default || false,
      c.precio_adicional || 0,
      c.orden || index
    ]);

    const [result] = await pool.query(query, [valores]);
    return result;
  }

  // ============================================
  // ACTUALIZAR COMPONENTE
  // ============================================
  static async actualizar(tenantId, id, { cantidad, tipo, grupo, es_default, precio_adicional, orden }) {
    const query = `
      UPDATE compuesto_componentes
      SET cantidad = ?, tipo = ?, grupo = ?, es_default = ?, precio_adicional = ?, orden = ?
      WHERE tenant_id = ? AND id = ?
    `;
    const [result] = await pool.query(query, [
      cantidad || 1,
      tipo || 'fijo',
      grupo || null,
      es_default || false,
      precio_adicional || 0,
      orden || 0,
      tenantId,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR COMPONENTE
  // ============================================
  static async eliminar(tenantId, id) {
    const [result] = await pool.query('DELETE FROM compuesto_componentes WHERE tenant_id = ? AND id = ?', [tenantId, id]);
    return result;
  }

  // ============================================
  // ELIMINAR TODOS LOS COMPONENTES DE UN COMPUESTO
  // ============================================
  static async eliminarPorCompuesto(tenantId, compuestoId) {
    const [result] = await pool.query('DELETE FROM compuesto_componentes WHERE tenant_id = ? AND compuesto_id = ?', [tenantId, compuestoId]);
    return result;
  }

  // ============================================
  // VERIFICAR SI EXISTE COMPONENTE EN COMPUESTO
  // ============================================
  static async existeEnCompuesto(tenantId, compuestoId, elementoId) {
    const [rows] = await pool.query(
      'SELECT id FROM compuesto_componentes WHERE tenant_id = ? AND compuesto_id = ? AND elemento_id = ?',
      [tenantId, compuestoId, elementoId]
    );
    return rows.length > 0;
  }
}

module.exports = CompuestoComponenteModel;
