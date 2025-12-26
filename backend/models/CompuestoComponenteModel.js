// ============================================
// MODELO: CompuestoComponenteModel
// Componentes de cada plantilla (fijos, alternativas, adicionales)
// ============================================

const { pool } = require('../config/database');

class CompuestoComponenteModel {

  // ============================================
  // OBTENER COMPONENTES DE UN COMPUESTO
  // ============================================
  static async obtenerPorCompuesto(compuestoId) {
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
        e.codigo AS elemento_codigo,
        c.nombre AS elemento_categoria,
        c.emoji AS elemento_emoji
      FROM compuesto_componentes cc
      INNER JOIN elementos e ON cc.elemento_id = e.id
      LEFT JOIN categorias c ON e.categoria_id = c.id
      WHERE cc.compuesto_id = ?
      ORDER BY cc.tipo, cc.grupo, cc.orden, e.nombre
    `;
    const [rows] = await pool.query(query, [compuestoId]);
    return rows;
  }

  // ============================================
  // OBTENER COMPONENTES AGRUPADOS
  // ============================================
  static async obtenerAgrupados(compuestoId) {
    const componentes = await this.obtenerPorCompuesto(compuestoId);

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
  static async obtenerPorId(id) {
    const query = `
      SELECT
        cc.*,
        e.nombre AS elemento_nombre,
        e.codigo AS elemento_codigo
      FROM compuesto_componentes cc
      INNER JOIN elementos e ON cc.elemento_id = e.id
      WHERE cc.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // ============================================
  // AGREGAR COMPONENTE
  // ============================================
  static async agregar({ compuesto_id, elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden }) {
    const query = `
      INSERT INTO compuesto_componentes
        (compuesto_id, elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
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
  static async agregarMultiples(compuestoId, componentes) {
    if (!componentes || componentes.length === 0) return { affectedRows: 0 };

    const query = `
      INSERT INTO compuesto_componentes
        (compuesto_id, elemento_id, cantidad, tipo, grupo, es_default, precio_adicional, orden)
      VALUES ?
    `;

    const valores = componentes.map((c, index) => [
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
  static async actualizar(id, { cantidad, tipo, grupo, es_default, precio_adicional, orden }) {
    const query = `
      UPDATE compuesto_componentes
      SET cantidad = ?, tipo = ?, grupo = ?, es_default = ?, precio_adicional = ?, orden = ?
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [
      cantidad || 1,
      tipo || 'fijo',
      grupo || null,
      es_default || false,
      precio_adicional || 0,
      orden || 0,
      id
    ]);
    return result;
  }

  // ============================================
  // ELIMINAR COMPONENTE
  // ============================================
  static async eliminar(id) {
    const [result] = await pool.query('DELETE FROM compuesto_componentes WHERE id = ?', [id]);
    return result;
  }

  // ============================================
  // ELIMINAR TODOS LOS COMPONENTES DE UN COMPUESTO
  // ============================================
  static async eliminarPorCompuesto(compuestoId) {
    const [result] = await pool.query('DELETE FROM compuesto_componentes WHERE compuesto_id = ?', [compuestoId]);
    return result;
  }

  // ============================================
  // VERIFICAR SI EXISTE COMPONENTE EN COMPUESTO
  // ============================================
  static async existeEnCompuesto(compuestoId, elementoId) {
    const [rows] = await pool.query(
      'SELECT id FROM compuesto_componentes WHERE compuesto_id = ? AND elemento_id = ?',
      [compuestoId, elementoId]
    );
    return rows.length > 0;
  }
}

module.exports = CompuestoComponenteModel;
