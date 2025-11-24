/**
 * SCRIPT DE MIGRACIÓN: AGREGAR ÍNDICES
 *
 * Ejecuta la migración SQL para agregar índices de performance a la BD
 *
 * Uso:
 *   node migrations/run_migration.js
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const MIGRATION_FILE = path.join(__dirname, 'add_indexes.sql');

/**
 * Lee el archivo SQL y lo divide en statements individuales
 */
const readSQLFile = (filePath) => {
  const sql = fs.readFileSync(filePath, 'utf8');

  // Remover comentarios y dividir por ;
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))  // Remover comentarios
    .join('\n')
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*'));  // Remover vacíos y comentarios de bloque

  return statements;
};

/**
 * Ejecuta la migración
 */
const runMigration = async () => {
  console.log('\n🚀 Iniciando migración: Agregar índices de performance...\n');

  try {
    // Leer archivo SQL
    console.log('📖 Leyendo archivo de migración...');
    const statements = readSQLFile(MIGRATION_FILE);
    console.log(`✅ ${statements.length} statements encontrados\n`);

    // Ejecutar cada statement
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip statements que no son ejecutables
      if (statement.startsWith('USE ') ||
          statement.startsWith('SHOW ') ||
          statement.startsWith('ANALYZE ')) {
        continue;
      }

      try {
        // Intentar ejecutar el statement
        await pool.query(statement);

        // Extraer nombre del índice del statement
        const indexMatch = statement.match(/idx_\w+/);
        const indexName = indexMatch ? indexMatch[0] : `statement ${i + 1}`;

        console.log(`✅ Creado: ${indexName}`);
        successCount++;
      } catch (error) {
        // Si el índice ya existe, solo notificar
        if (error.code === 'ER_DUP_KEYNAME') {
          const indexMatch = statement.match(/idx_\w+/);
          const indexName = indexMatch ? indexMatch[0] : `statement ${i + 1}`;
          console.log(`⏭️  Ya existe: ${indexName}`);
          skipCount++;
        } else {
          console.error(`❌ Error en statement ${i + 1}:`, error.message);
          console.error('   Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`   ✅ Índices creados: ${successCount}`);
    console.log(`   ⏭️  Índices existentes: ${skipCount}`);
    console.log(`   📈 Total procesados: ${successCount + skipCount}\n`);

    // Ejecutar ANALYZE TABLE para actualizar estadísticas
    console.log('🔄 Actualizando estadísticas de tablas...');
    const tables = ['categorias', 'elementos', 'series', 'lotes', 'ubicaciones', 'materiales', 'unidades'];

    for (const table of tables) {
      try {
        await pool.query(`ANALYZE TABLE ${table}`);
        console.log(`✅ Analizando: ${table}`);
      } catch (error) {
        console.error(`❌ Error al analizar ${table}:`, error.message);
      }
    }

    console.log('\n✅ Migración completada exitosamente!\n');
    console.log('💡 Los índices mejorarán el rendimiento de las consultas.');
    console.log('💡 Inserts/Updates serán ligeramente más lentos (actualización de índices).\n');

  } catch (error) {
    console.error('\n❌ Error en la migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cerrar pool de conexiones
    await pool.end();
  }
};

// Ejecutar migración
runMigration();
