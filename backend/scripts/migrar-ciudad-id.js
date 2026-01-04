#!/usr/bin/env node
// ============================================
// SCRIPT: Migración a ciudad_id
// Ejecuta la migración de ciudades
// ============================================

require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aprendizaje_inventario',
  multipleStatements: true
};

async function ejecutarMigracion() {
  console.log('🚀 Iniciando migración a ciudad_id...\n');

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión a BD establecida\n');

    // PASO 1: Crear tabla ciudades
    console.log('📦 Paso 1: Creando tabla ciudades...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ciudades (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        departamento VARCHAR(100),
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_ciudad_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabla ciudades creada\n');

    // PASO 2: Migrar ciudades existentes desde tarifas_transporte
    console.log('📦 Paso 2: Migrando ciudades existentes...');

    // Verificar si existe columna 'ciudad' en tarifas_transporte
    const [columnasTarifas] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tarifas_transporte' AND COLUMN_NAME = 'ciudad'
    `, [config.database]);

    if (columnasTarifas.length > 0) {
      await connection.query(`
        INSERT IGNORE INTO ciudades (nombre)
        SELECT DISTINCT ciudad FROM tarifas_transporte WHERE ciudad IS NOT NULL AND ciudad != ''
      `);
      console.log('   ✓ Ciudades migradas desde tarifas_transporte');
    }

    // Verificar si existe columna 'ciudad' en ubicaciones
    const [columnasUbicaciones] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ubicaciones' AND COLUMN_NAME = 'ciudad'
    `, [config.database]);

    if (columnasUbicaciones.length > 0) {
      await connection.query(`
        INSERT IGNORE INTO ciudades (nombre)
        SELECT DISTINCT ciudad FROM ubicaciones WHERE ciudad IS NOT NULL AND ciudad != ''
      `);
      console.log('   ✓ Ciudades migradas desde ubicaciones\n');
    }

    // PASO 3: Modificar tarifas_transporte
    console.log('📦 Paso 3: Modificando tarifas_transporte...');

    // Verificar si ciudad_id ya existe
    const [ciudadIdTarifas] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tarifas_transporte' AND COLUMN_NAME = 'ciudad_id'
    `, [config.database]);

    if (ciudadIdTarifas.length === 0) {
      // Hacer ciudad nullable primero
      if (columnasTarifas.length > 0) {
        await connection.query(`ALTER TABLE tarifas_transporte MODIFY COLUMN ciudad VARCHAR(100) NULL`);
      }

      // Agregar ciudad_id
      await connection.query(`ALTER TABLE tarifas_transporte ADD COLUMN ciudad_id INT AFTER tipo_camion`);
      console.log('   ✓ Columna ciudad_id agregada');

      // Migrar datos
      if (columnasTarifas.length > 0) {
        await connection.query(`
          UPDATE tarifas_transporte t
          INNER JOIN ciudades c ON t.ciudad = c.nombre
          SET t.ciudad_id = c.id
        `);
        console.log('   ✓ Datos migrados a ciudad_id');

        // Eliminar índice único antiguo si existe
        const [indices] = await connection.query(`
          SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tarifas_transporte' AND INDEX_NAME = 'uk_tipo_ciudad'
        `, [config.database]);

        if (indices.length > 0) {
          await connection.query(`ALTER TABLE tarifas_transporte DROP INDEX uk_tipo_ciudad`);
        }

        // Eliminar columna ciudad
        await connection.query(`ALTER TABLE tarifas_transporte DROP COLUMN ciudad`);
        console.log('   ✓ Columna ciudad eliminada');
      }
    } else {
      console.log('   ℹ️  ciudad_id ya existe, saltando...');

      // Aún así eliminar columna ciudad si existe
      if (columnasTarifas.length > 0) {
        const [indices] = await connection.query(`
          SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tarifas_transporte' AND INDEX_NAME = 'uk_tipo_ciudad'
        `, [config.database]);

        if (indices.length > 0) {
          await connection.query(`ALTER TABLE tarifas_transporte DROP INDEX uk_tipo_ciudad`);
        }
        await connection.query(`ALTER TABLE tarifas_transporte DROP COLUMN ciudad`);
        console.log('   ✓ Columna ciudad eliminada');
      }
    }

    // Crear índice único si no existe
    const [indiceNuevo] = await connection.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tarifas_transporte' AND INDEX_NAME = 'uk_tipo_ciudad_id'
    `, [config.database]);

    if (indiceNuevo.length === 0) {
      await connection.query(`ALTER TABLE tarifas_transporte ADD UNIQUE KEY uk_tipo_ciudad_id (tipo_camion, ciudad_id)`);
    }
    console.log('   ✓ tarifas_transporte actualizada\n');

    // PASO 4: Modificar ubicaciones
    console.log('📦 Paso 4: Modificando ubicaciones...');

    const [ciudadIdUbicaciones] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ubicaciones' AND COLUMN_NAME = 'ciudad_id'
    `, [config.database]);

    if (ciudadIdUbicaciones.length === 0) {
      // Hacer ciudad nullable primero
      if (columnasUbicaciones.length > 0) {
        await connection.query(`ALTER TABLE ubicaciones MODIFY COLUMN ciudad VARCHAR(100) NULL`);
      }

      // Agregar ciudad_id
      await connection.query(`ALTER TABLE ubicaciones ADD COLUMN ciudad_id INT AFTER ciudad`);
      console.log('   ✓ Columna ciudad_id agregada');

      // Migrar datos
      if (columnasUbicaciones.length > 0) {
        await connection.query(`
          UPDATE ubicaciones u
          INNER JOIN ciudades c ON u.ciudad = c.nombre
          SET u.ciudad_id = c.id
        `);
        console.log('   ✓ Datos migrados a ciudad_id');

        // Eliminar columna ciudad
        await connection.query(`ALTER TABLE ubicaciones DROP COLUMN ciudad`);
        console.log('   ✓ Columna ciudad eliminada');
      }
    } else {
      console.log('   ℹ️  ciudad_id ya existe, saltando...');

      // Aún así eliminar columna ciudad si existe
      if (columnasUbicaciones.length > 0) {
        await connection.query(`ALTER TABLE ubicaciones DROP COLUMN ciudad`);
        console.log('   ✓ Columna ciudad eliminada');
      }
    }
    console.log('   ✓ ubicaciones actualizada\n');

    // PASO 5: Crear FKs
    console.log('📦 Paso 5: Creando claves foráneas...');

    // FK tarifas -> ciudades
    const [fkTarifas] = await connection.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tarifas_transporte' AND CONSTRAINT_NAME = 'fk_tarifa_ciudad'
    `, [config.database]);

    if (fkTarifas.length === 0) {
      try {
        await connection.query(`
          ALTER TABLE tarifas_transporte
          ADD CONSTRAINT fk_tarifa_ciudad FOREIGN KEY (ciudad_id) REFERENCES ciudades(id)
        `);
        console.log('   ✓ FK tarifas_transporte -> ciudades creada');
      } catch (e) {
        console.log('   ⚠️  No se pudo crear FK (puede haber datos huérfanos)');
      }
    }

    // FK ubicaciones -> ciudades
    const [fkUbicaciones] = await connection.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ubicaciones' AND CONSTRAINT_NAME = 'fk_ubicacion_ciudad'
    `, [config.database]);

    if (fkUbicaciones.length === 0) {
      try {
        await connection.query(`
          ALTER TABLE ubicaciones
          ADD CONSTRAINT fk_ubicacion_ciudad FOREIGN KEY (ciudad_id) REFERENCES ciudades(id)
        `);
        console.log('   ✓ FK ubicaciones -> ciudades creada');
      } catch (e) {
        console.log('   ⚠️  No se pudo crear FK (puede haber datos huérfanos)');
      }
    }

    // RESUMEN
    console.log('\n========================================');
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('========================================\n');

    // Mostrar resumen
    const [ciudades] = await connection.query('SELECT COUNT(*) as total FROM ciudades');
    const [tarifas] = await connection.query('SELECT COUNT(*) as total FROM tarifas_transporte WHERE ciudad_id IS NOT NULL');
    const [ubicaciones] = await connection.query('SELECT COUNT(*) as total FROM ubicaciones');

    console.log('📊 Resumen:');
    console.log(`   - Ciudades: ${ciudades[0].total}`);
    console.log(`   - Tarifas con ciudad_id: ${tarifas[0].total}`);
    console.log(`   - Ubicaciones: ${ubicaciones[0].total}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

ejecutarMigracion();
