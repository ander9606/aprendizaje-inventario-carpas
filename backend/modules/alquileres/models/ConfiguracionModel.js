// ============================================
// MODELO: ConfiguracionModel
// Configuración del sistema de alquileres
// ============================================

const { pool } = require('../../../config/database');

class ConfiguracionModel {

  // ============================================
  // VALORES POR DEFECTO (fallback)
  // ============================================
  static DEFAULTS = {
    dias_gratis_montaje: 2,
    dias_gratis_desmontaje: 1,
    porcentaje_dias_extra: 15,
    porcentaje_iva: 19,
    aplicar_iva: true,
    vigencia_cotizacion_dias: 15,
    // Seguimiento de cotizaciones
    dias_advertencia_vencimiento_cotizacion: 3,
    dias_seguimiento_borrador: 7,
    dias_seguimiento_pendiente: 5,
    habilitar_seguimiento_cotizaciones: true
  };

  // ============================================
  // OBTENER TODAS LAS CONFIGURACIONES
  // ============================================
  static async obtenerTodas() {
    const query = `
      SELECT id, clave, valor, tipo, descripcion, categoria, orden
      FROM configuracion_alquileres
      ORDER BY categoria, orden
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR CATEGORÍA
  // ============================================
  static async obtenerPorCategoria(categoria) {
    const query = `
      SELECT id, clave, valor, tipo, descripcion, categoria, orden
      FROM configuracion_alquileres
      WHERE categoria = ?
      ORDER BY orden
    `;
    const [rows] = await pool.query(query, [categoria]);
    return rows;
  }

  // ============================================
  // OBTENER VALOR POR CLAVE
  // ============================================
  static async obtenerValor(clave) {
    const query = `
      SELECT valor, tipo
      FROM configuracion_alquileres
      WHERE clave = ?
    `;
    const [rows] = await pool.query(query, [clave]);

    if (!rows[0]) {
      return this.DEFAULTS[clave] || null;
    }

    return this.convertirValor(rows[0].valor, rows[0].tipo);
  }

  // ============================================
  // OBTENER MÚLTIPLES VALORES
  // ============================================
  static async obtenerValores(claves) {
    const placeholders = claves.map(() => '?').join(',');
    const query = `
      SELECT clave, valor, tipo
      FROM configuracion_alquileres
      WHERE clave IN (${placeholders})
    `;
    const [rows] = await pool.query(query, claves);

    const resultado = {};
    for (const clave of claves) {
      const row = rows.find(r => r.clave === clave);
      if (row) {
        resultado[clave] = this.convertirValor(row.valor, row.tipo);
      } else {
        resultado[clave] = this.DEFAULTS[clave] || null;
      }
    }
    return resultado;
  }

  // ============================================
  // OBTENER CONFIGURACIÓN COMPLETA (OBJETO)
  // ============================================
  static async obtenerConfiguracionCompleta() {
    const rows = await this.obtenerTodas();
    const config = {};

    for (const row of rows) {
      config[row.clave] = this.convertirValor(row.valor, row.tipo);
    }

    // Asegurar que existan los valores por defecto
    return { ...this.DEFAULTS, ...config };
  }

  // ============================================
  // ACTUALIZAR VALOR
  // ============================================
  static async actualizarValor(clave, valor) {
    const query = `
      UPDATE configuracion_alquileres
      SET valor = ?
      WHERE clave = ?
    `;
    const [result] = await pool.query(query, [String(valor), clave]);
    return result;
  }

  // ============================================
  // ACTUALIZAR MÚLTIPLES VALORES
  // ============================================
  static async actualizarValores(valores) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const [clave, valor] of Object.entries(valores)) {
        await connection.query(
          'UPDATE configuracion_alquileres SET valor = ? WHERE clave = ?',
          [String(valor), clave]
        );
      }

      await connection.commit();
      return { success: true, actualizados: Object.keys(valores).length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // HELPER: CONVERTIR VALOR SEGÚN TIPO
  // ============================================
  static convertirValor(valor, tipo) {
    switch (tipo) {
      case 'numero':
        return parseInt(valor, 10);
      case 'porcentaje':
        return parseFloat(valor);
      case 'booleano':
        return valor === 'true' || valor === '1';
      default:
        return valor;
    }
  }

  // ============================================
  // OBTENER CATEGORÍAS DISPONIBLES
  // ============================================
  static async obtenerCategorias() {
    const query = `
      SELECT DISTINCT categoria
      FROM configuracion_alquileres
      ORDER BY categoria
    `;
    const [rows] = await pool.query(query);
    return rows.map(r => r.categoria);
  }
}

module.exports = ConfiguracionModel;
