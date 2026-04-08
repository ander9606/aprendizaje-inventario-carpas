// ============================================
// MODELO: CiudadModel
// Catálogo maestro de ciudades
// ============================================

const { pool } = require('../../../config/database');

// Tipos de camión disponibles
const TIPOS_CAMION = ['Pequeño', 'Mediano', 'Grande', 'Extragrande'];

class CiudadModel {

  // ============================================
  // OBTENER TODAS CON TARIFAS
  // ============================================
  static async obtenerTodas(tenantId) {
    const query = `
      SELECT c.id, c.nombre, c.departamento_id,
             COALESCE(d.nombre, c.departamento) as departamento,
             c.activo, c.created_at, c.updated_at,
             t.tipo_camion, t.precio
      FROM ciudades c
      LEFT JOIN departamentos d ON c.departamento_id = d.id AND d.tenant_id = ?
      LEFT JOIN tarifas_transporte t ON t.ciudad_id = c.id AND t.tenant_id = ?
      WHERE c.tenant_id = ?
      ORDER BY c.nombre, t.tipo_camion
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId, tenantId]);

    // Agrupar tarifas por ciudad
    const ciudadesMap = new Map();
    for (const row of rows) {
      if (!ciudadesMap.has(row.id)) {
        ciudadesMap.set(row.id, {
          id: row.id,
          nombre: row.nombre,
          departamento_id: row.departamento_id,
          departamento: row.departamento,
          activo: row.activo,
          created_at: row.created_at,
          updated_at: row.updated_at,
          tarifas: {}
        });
      }
      if (row.tipo_camion) {
        ciudadesMap.get(row.id).tarifas[row.tipo_camion] = row.precio;
      }
    }

    return Array.from(ciudadesMap.values());
  }

  // ============================================
  // OBTENER ACTIVAS
  // ============================================
  static async obtenerActivas(tenantId) {
    const query = `
      SELECT c.id, c.nombre, c.departamento_id,
             COALESCE(d.nombre, c.departamento) as departamento
      FROM ciudades c
      LEFT JOIN departamentos d ON c.departamento_id = d.id AND d.tenant_id = ?
      WHERE c.activo = TRUE AND c.tenant_id = ?
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query, [tenantId, tenantId]);
    return rows;
  }

  // ============================================
  // OBTENER POR ID CON TARIFAS
  // ============================================
  static async obtenerPorId(tenantId, id) {
    const queryCiudad = `
      SELECT c.id, c.nombre, c.departamento_id,
             COALESCE(d.nombre, c.departamento) as departamento,
             c.activo, c.created_at, c.updated_at
      FROM ciudades c
      LEFT JOIN departamentos d ON c.departamento_id = d.id AND d.tenant_id = ?
      WHERE c.id = ? AND c.tenant_id = ?
    `;
    const [rows] = await pool.query(queryCiudad, [tenantId, id, tenantId]);

    if (!rows[0]) return null;

    const ciudad = rows[0];

    // Obtener tarifas
    const queryTarifas = `
      SELECT tipo_camion, precio
      FROM tarifas_transporte
      WHERE ciudad_id = ? AND tenant_id = ?
    `;
    const [tarifas] = await pool.query(queryTarifas, [id, tenantId]);

    ciudad.tarifas = {};
    for (const tarifa of tarifas) {
      ciudad.tarifas[tarifa.tipo_camion] = tarifa.precio;
    }

    return ciudad;
  }

  // ============================================
  // OBTENER POR NOMBRE
  // ============================================
  static async obtenerPorNombre(tenantId, nombre) {
    const query = `
      SELECT id, nombre, departamento_id, departamento, activo
      FROM ciudades
      WHERE nombre = ? AND tenant_id = ?
    `;
    const [rows] = await pool.query(query, [nombre, tenantId]);
    return rows[0];
  }

  // ============================================
  // CREAR CON TARIFAS
  // ============================================
  static async crear(tenantId, { nombre, departamento_id, departamento, tarifas }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Crear ciudad
      const queryCiudad = `
        INSERT INTO ciudades (nombre, departamento_id, departamento, tenant_id)
        VALUES (?, ?, ?, ?)
      `;
      const [result] = await connection.query(queryCiudad, [
        nombre,
        departamento_id || null,
        departamento || null,
        tenantId
      ]);
      const ciudadId = result.insertId;

      // Crear tarifas si se proporcionan
      if (tarifas) {
        for (const tipoCamion of TIPOS_CAMION) {
          const precio = tarifas[tipoCamion];
          if (precio !== undefined && precio !== null && precio !== '') {
            const queryTarifa = `
              INSERT INTO tarifas_transporte (tipo_camion, ciudad_id, precio, tenant_id)
              VALUES (?, ?, ?, ?)
            `;
            await connection.query(queryTarifa, [tipoCamion, ciudadId, parseFloat(precio), tenantId]);
          }
        }
      }

      await connection.commit();
      return { insertId: ciudadId };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // ACTUALIZAR CON TARIFAS
  // ============================================
  static async actualizar(tenantId, id, { nombre, departamento_id, departamento, activo, tarifas }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Actualizar ciudad
      const queryCiudad = `
        UPDATE ciudades
        SET nombre = ?, departamento_id = ?, departamento = ?, activo = ?
        WHERE id = ? AND tenant_id = ?
      `;
      await connection.query(queryCiudad, [
        nombre,
        departamento_id || null,
        departamento || null,
        activo !== undefined ? activo : true,
        id,
        tenantId
      ]);

      // Actualizar tarifas si se proporcionan
      if (tarifas) {
        for (const tipoCamion of TIPOS_CAMION) {
          const precio = tarifas[tipoCamion];

          const [existing] = await connection.query(
            'SELECT id FROM tarifas_transporte WHERE ciudad_id = ? AND tipo_camion = ? AND tenant_id = ?',
            [id, tipoCamion, tenantId]
          );

          if (precio !== undefined && precio !== null && precio !== '') {
            if (existing.length > 0) {
              await connection.query(
                'UPDATE tarifas_transporte SET precio = ? WHERE id = ? AND tenant_id = ?',
                [parseFloat(precio), existing[0].id, tenantId]
              );
            } else {
              await connection.query(
                'INSERT INTO tarifas_transporte (tipo_camion, ciudad_id, precio, tenant_id) VALUES (?, ?, ?, ?)',
                [tipoCamion, id, parseFloat(precio), tenantId]
              );
            }
          } else if (existing.length > 0) {
            await connection.query(
              'DELETE FROM tarifas_transporte WHERE id = ? AND tenant_id = ?',
              [existing[0].id, tenantId]
            );
          }
        }
      }

      await connection.commit();
      return { affectedRows: 1 };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================
  static async eliminar(tenantId, id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar si tiene ubicaciones asociadas
      const [ubicaciones] = await connection.query(
        'SELECT COUNT(*) as total FROM ubicaciones WHERE ciudad_id = ? AND tenant_id = ?',
        [id, tenantId]
      );

      if (ubicaciones[0].total > 0) {
        throw new Error('No se puede eliminar una ciudad con ubicaciones asociadas');
      }

      // Eliminar tarifas asociadas
      await connection.query('DELETE FROM tarifas_transporte WHERE ciudad_id = ? AND tenant_id = ?', [id, tenantId]);

      // Eliminar ciudad
      const [result] = await connection.query('DELETE FROM ciudades WHERE id = ? AND tenant_id = ?', [id, tenantId]);

      await connection.commit();
      return result;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================
  // DESACTIVAR
  // ============================================
  static async desactivar(tenantId, id) {
    const [result] = await pool.query(
      'UPDATE ciudades SET activo = FALSE WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    return result;
  }

  // ============================================
  // VERIFICAR SI NOMBRE EXISTE
  // ============================================
  static async nombreExiste(tenantId, nombre, excluirId = null) {
    let query = 'SELECT COUNT(*) as total FROM ciudades WHERE nombre = ? AND tenant_id = ?';
    const params = [nombre, tenantId];

    if (excluirId) {
      query += ' AND id != ?';
      params.push(excluirId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }
}

module.exports = CiudadModel;
