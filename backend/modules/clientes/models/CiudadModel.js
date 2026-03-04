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
    // Obtener ciudades
    const queryCiudades = `
      SELECT id, nombre, departamento, activo, created_at, updated_at
      FROM ciudades
      ORDER BY nombre
    `;
    const [ciudades] = await pool.query(queryCiudades);

    // Para cada ciudad, obtener sus tarifas
    for (const ciudad of ciudades) {
      const queryTarifas = `
        SELECT tipo_camion, precio
        FROM tarifas_transporte
        WHERE ciudad_id = ?
      `;
      const [tarifas] = await pool.query(queryTarifas, [ciudad.id]);

      // Crear objeto de tarifas
      ciudad.tarifas = {};
      for (const tarifa of tarifas) {
        ciudad.tarifas[tarifa.tipo_camion] = tarifa.precio;
      }
    }

    return ciudades;
  }

  // ============================================
  // OBTENER ACTIVAS
  // ============================================
  static async obtenerActivas() {
    const query = `
      SELECT id, nombre, departamento
      FROM ciudades
      WHERE activo = TRUE
      ORDER BY nombre
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  // ============================================
  // OBTENER POR ID CON TARIFAS
  // ============================================
  static async obtenerPorId(id) {
    const queryCiudad = `
      SELECT id, nombre, departamento, activo, created_at, updated_at
      FROM ciudades
      WHERE id = ?
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
      SELECT id, nombre, departamento, activo
      FROM ciudades
      WHERE nombre = ?
    `;
    const [rows] = await pool.query(query, [nombre]);
    return rows[0];
  }

  // ============================================
  // CREAR CON TARIFAS
  // ============================================
  static async crear({ nombre, departamento, tarifas }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Crear ciudad
      const queryCiudad = `
        INSERT INTO ciudades (nombre, departamento)
        VALUES (?, ?)
      `;
      const [result] = await connection.query(queryCiudad, [nombre, departamento || null]);
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
  static async actualizar(id, { nombre, departamento, activo, tarifas }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Actualizar ciudad
      const queryCiudad = `
        UPDATE ciudades
        SET nombre = ?, departamento = ?, activo = ?
        WHERE id = ?
      `;
      await connection.query(queryCiudad, [
        nombre,
        departamento || null,
        activo !== undefined ? activo : true,
        id
      ]);

      // Actualizar tarifas si se proporcionan
      if (tarifas) {
        for (const tipoCamion of TIPOS_CAMION) {
          const precio = tarifas[tipoCamion];

          // Verificar si ya existe la tarifa
          const [existing] = await connection.query(
            'SELECT id FROM tarifas_transporte WHERE ciudad_id = ? AND tipo_camion = ?',
            [id, tipoCamion]
          );

          if (precio !== undefined && precio !== null && precio !== '') {
            if (existing.length > 0) {
              // Actualizar
              await connection.query(
                'UPDATE tarifas_transporte SET precio = ? WHERE id = ?',
                [parseFloat(precio), existing[0].id]
              );
            } else {
              // Crear
              await connection.query(
                'INSERT INTO tarifas_transporte (tipo_camion, ciudad_id, precio) VALUES (?, ?, ?)',
                [tipoCamion, id, parseFloat(precio)]
              );
            }
          } else if (existing.length > 0) {
            // Eliminar si el precio está vacío
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
