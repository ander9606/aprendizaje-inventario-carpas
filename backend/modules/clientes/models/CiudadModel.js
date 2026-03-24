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
  static async obtenerTodas() {
    const query = `
      SELECT c.id, c.nombre, c.departamento_id,
             COALESCE(d.nombre, c.departamento) as departamento,
             c.activo, c.created_at, c.updated_at,
             t.tipo_camion, t.precio
      FROM ciudades c
      LEFT JOIN departamentos d ON c.departamento_id = d.id
      LEFT JOIN tarifas_transporte t ON t.ciudad_id = c.id
      ORDER BY c.nombre, t.tipo_camion
    `;
    const [rows] = await pool.query(query);

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
  static async obtenerActivas() {
    const query = `
      SELECT c.id, c.nombre, c.departamento_id,
             COALESCE(d.nombre, c.departamento) as departamento
      FROM ciudades c
      LEFT JOIN departamentos d ON c.departamento_id = d.id
      WHERE c.activo = TRUE
      ORDER BY c.nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID CON TARIFAS
  // ============================================
  static async obtenerPorId(id) {
    const queryCiudad = `
      SELECT c.id, c.nombre, c.departamento_id,
             COALESCE(d.nombre, c.departamento) as departamento,
             c.activo, c.created_at, c.updated_at
      FROM ciudades c
      LEFT JOIN departamentos d ON c.departamento_id = d.id
      WHERE c.id = ?
    `;
    const [rows] = await pool.query(queryCiudad, [id]);

    if (!rows[0]) return null;

    const ciudad = rows[0];

    // Obtener tarifas
    const queryTarifas = `
      SELECT tipo_camion, precio
      FROM tarifas_transporte
      WHERE ciudad_id = ?
    `;
    const [tarifas] = await pool.query(queryTarifas, [id]);

    ciudad.tarifas = {};
    for (const tarifa of tarifas) {
      ciudad.tarifas[tarifa.tipo_camion] = tarifa.precio;
    }

    return ciudad;
  }

  // ============================================
  // OBTENER POR NOMBRE
  // ============================================
  static async obtenerPorNombre(nombre) {
    const query = `
      SELECT id, nombre, departamento_id, departamento, activo
      FROM ciudades
      WHERE nombre = ?
    `;
    const [rows] = await pool.query(query, [nombre]);
    return rows[0];
  }

  // ============================================
  // CREAR CON TARIFAS
  // ============================================
  static async crear({ nombre, departamento_id, departamento, tarifas }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Crear ciudad
      const queryCiudad = `
        INSERT INTO ciudades (nombre, departamento_id, departamento)
        VALUES (?, ?, ?)
      `;
      const [result] = await connection.query(queryCiudad, [
        nombre,
        departamento_id || null,
        departamento || null
      ]);
      const ciudadId = result.insertId;

      // Crear tarifas si se proporcionan
      if (tarifas) {
        for (const tipoCamion of TIPOS_CAMION) {
          const precio = tarifas[tipoCamion];
          if (precio !== undefined && precio !== null && precio !== '') {
            const queryTarifa = `
              INSERT INTO tarifas_transporte (tipo_camion, ciudad_id, precio)
              VALUES (?, ?, ?)
            `;
            await connection.query(queryTarifa, [tipoCamion, ciudadId, parseFloat(precio)]);
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
  static async actualizar(id, { nombre, departamento_id, departamento, activo, tarifas }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Actualizar ciudad
      const queryCiudad = `
        UPDATE ciudades
        SET nombre = ?, departamento_id = ?, departamento = ?, activo = ?
        WHERE id = ?
      `;
      await connection.query(queryCiudad, [
        nombre,
        departamento_id || null,
        departamento || null,
        activo !== undefined ? activo : true,
        id
      ]);

      // Actualizar tarifas si se proporcionan
      if (tarifas) {
        for (const tipoCamion of TIPOS_CAMION) {
          const precio = tarifas[tipoCamion];

          const [existing] = await connection.query(
            'SELECT id FROM tarifas_transporte WHERE ciudad_id = ? AND tipo_camion = ?',
            [id, tipoCamion]
          );

          if (precio !== undefined && precio !== null && precio !== '') {
            if (existing.length > 0) {
              await connection.query(
                'UPDATE tarifas_transporte SET precio = ? WHERE id = ?',
                [parseFloat(precio), existing[0].id]
              );
            } else {
              await connection.query(
                'INSERT INTO tarifas_transporte (tipo_camion, ciudad_id, precio) VALUES (?, ?, ?)',
                [tipoCamion, id, parseFloat(precio)]
              );
            }
          } else if (existing.length > 0) {
            await connection.query(
              'DELETE FROM tarifas_transporte WHERE id = ?',
              [existing[0].id]
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
  static async eliminar(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar si tiene ubicaciones asociadas
      const [ubicaciones] = await connection.query(
        'SELECT COUNT(*) as total FROM ubicaciones WHERE ciudad_id = ?',
        [id]
      );

      if (ubicaciones[0].total > 0) {
        throw new Error('No se puede eliminar una ciudad con ubicaciones asociadas');
      }

      // Eliminar tarifas asociadas
      await connection.query('DELETE FROM tarifas_transporte WHERE ciudad_id = ?', [id]);

      // Eliminar ciudad
      const [result] = await connection.query('DELETE FROM ciudades WHERE id = ?', [id]);

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
  static async desactivar(id) {
    const [result] = await pool.query(
      'UPDATE ciudades SET activo = FALSE WHERE id = ?',
      [id]
    );
    return result;
  }

  // ============================================
  // VERIFICAR SI NOMBRE EXISTE
  // ============================================
  static async nombreExiste(nombre, excluirId = null) {
    let query = 'SELECT COUNT(*) as total FROM ciudades WHERE nombre = ?';
    const params = [nombre];

    if (excluirId) {
      query += ' AND id != ?';
      params.push(excluirId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total > 0;
  }
}

module.exports = CiudadModel;
