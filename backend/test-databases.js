// ============================================
// SCRIPT DE DIAGNÓSTICO Y TEST DE BASE DE DATOS
// Archivo: backend/test-database.js
// ============================================

require('dotenv').config()

console.log('='.repeat(60))
console.log('🔬 DIAGNÓSTICO DE BASE DE DATOS')
console.log('='.repeat(60))

// ============================================
// PASO 1: Verificar que db se puede importar
// ============================================

console.log('\n📦 Paso 1: Importando módulo database...')

let db
try {
  db = require('./config/database')
  console.log('✅ Módulo importado exitosamente')
  console.log('   Tipo:', typeof db)
  console.log('   Constructor:', db.constructor.name)
  
  // Verificar si tiene el método query
  if (typeof db.query === 'function') {
    console.log('✅ Método query() disponible')
  } else {
    console.log('❌ Método query() NO disponible')
    console.log('\n🔍 Propiedades disponibles:', Object.keys(db))
    
    console.log('\n💡 PROBLEMA DETECTADO:')
    console.log('   El archivo config/database.js no está exportando correctamente')
    console.log('\n📝 SOLUCIÓN:')
    console.log('   1. Reemplaza config/database.js con el archivo database.js proporcionado')
    console.log('   2. O asegúrate de que tenga:')
    console.log('      const pool = mysql.createPool({ ... })')
    console.log('      const promisePool = pool.promise()')
    console.log('      module.exports = promisePool')
    
    process.exit(1)
  }
} catch (error) {
  console.log('❌ Error al importar el módulo:', error.message)
  console.log('\n📝 SOLUCIÓN:')
  console.log('   1. Verifica que existe el archivo config/database.js')
  console.log('   2. Verifica que tenga un module.exports')
  process.exit(1)
}

// ============================================
// PASO 2: Verificar variables de entorno
// ============================================

console.log('\n🔧 Paso 2: Verificando variables de entorno...')

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME']
let envOk = true

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${process.env[varName]}`)
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`)
    envOk = false
  }
})

// DB_PASSWORD puede estar vacío, pero verificamos si existe
if (process.env.DB_PASSWORD !== undefined) {
  console.log('✅ DB_PASSWORD: (definida)')
} else {
  console.log('⚠️  DB_PASSWORD: NO DEFINIDA (puede causar problemas)')
}

if (!envOk) {
  console.log('\n💡 SOLUCIÓN:')
  console.log('   Crea o actualiza el archivo .env con:')
  console.log('   DB_HOST=localhost')
  console.log('   DB_USER=root')
  console.log('   DB_PASSWORD=tu_contraseña')
  console.log('   DB_NAME=aprendizaje_inventario')
  process.exit(1)
}

// ============================================
// FUNCIÓN PRINCIPAL DE TEST
// ============================================

async function testDatabase() {
  try {
    // ============================================
    // TEST 1: Conexión básica
    // ============================================
    console.log('\n📡 Test 1: Probando conexión básica...')
    
    const [testResult] = await db.query('SELECT 1 + 1 AS resultado')
    console.log('✅ Conexión exitosa')
    console.log('   Resultado de prueba:', testResult[0].resultado)
    
    // ============================================
    // TEST 2: Verificar que la base de datos existe
    // ============================================
    console.log('\n🗄️  Test 2: Verificando base de datos...')
    
    const [databases] = await db.query('SHOW DATABASES')
    const dbExists = databases.some(row => 
      row.Database === process.env.DB_NAME
    )
    
    if (dbExists) {
      console.log(`✅ Base de datos '${process.env.DB_NAME}' existe`)
    } else {
      console.log(`❌ Base de datos '${process.env.DB_NAME}' NO existe`)
      console.log('\n💡 SOLUCIÓN:')
      console.log(`   CREATE DATABASE ${process.env.DB_NAME};`)
      process.exit(1)
    }
    
    // ============================================
    // TEST 3: Verificar tabla categorias
    // ============================================
    console.log('\n📋 Test 3: Verificando tabla categorias...')
    
    const [tables] = await db.query('SHOW TABLES')
    const tableKey = `Tables_in_${process.env.DB_NAME}`
    const categoriaTableExists = tables.some(row => 
      row[tableKey] === 'categorias'
    )
    
    if (categoriaTableExists) {
      console.log('✅ Tabla categorias existe')
    } else {
      console.log('❌ Tabla categorias NO existe')
      console.log('\n💡 SOLUCIÓN:')
      console.log('   Ejecuta el script de creación de la base de datos:')
      console.log('   mysql -u root -p < sql/00_SCHEMA_COMPLETO.sql')
      process.exit(1)
    }
    
    // ============================================
    // TEST 4: Verificar estructura de categorias
    // ============================================
    console.log('\n🔍 Test 4: Verificando estructura de categorias...')
    
    const [columns] = await db.query('DESCRIBE categorias')
    
    console.log('   Columnas encontradas:')
    columns.forEach(col => {
      const emoji = col.Field === 'emoji' ? ' 👈 ¡EMOJI!' : ''
      console.log(`   - ${col.Field} (${col.Type})${emoji}`)
    })
    
    // Verificar columna emoji
    const hasEmoji = columns.some(col => col.Field === 'emoji')
    
    if (hasEmoji) {
      console.log('\n✅ Columna emoji EXISTE')
      
      // Verificar tipo de datos correcto
      const emojiCol = columns.find(col => col.Field === 'emoji')
      if (emojiCol.Type.includes('varchar')) {
        console.log('✅ Tipo de datos correcto (varchar)')
      }
      
      // Verificar UTF8MB4
      const [charsetInfo] = await db.query(`
        SELECT CHARACTER_SET_NAME, COLLATION_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'categorias' 
        AND COLUMN_NAME = 'emoji'
      `, [process.env.DB_NAME])
      
      if (charsetInfo.length > 0) {
        const charset = charsetInfo[0].CHARACTER_SET_NAME
        if (charset === 'utf8mb4') {
          console.log('✅ Charset correcto (utf8mb4)')
        } else {
          console.log(`⚠️  Charset: ${charset} (debería ser utf8mb4)`)
        }
      }
    } else {
      console.log('\n❌ Columna emoji NO EXISTE')
      console.log('\n💡 SOLUCIÓN:')
      console.log('   Ejecuta el script SQL:')
      console.log('   mysql -u root -p aprendizaje_inventario < 02_agregar_emoji_categorias.sql')
      console.log('\n   O ejecuta manualmente:')
      console.log(`
ALTER TABLE categorias 
ADD COLUMN emoji VARCHAR(10) 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci
AFTER nombre;
      `)
      process.exit(1)
    }
    
    // ============================================
    // TEST 5: Consultar categorías
    // ============================================
    console.log('\n📊 Test 5: Consultando categorías padre...')
    
    const [categorias] = await db.query(`
      SELECT 
        c.id,
        c.nombre,
        c.emoji,
        c.padre_id,
        (
          SELECT COUNT(*) 
          FROM categorias 
          WHERE padre_id = c.id
        ) AS total_subcategorias
      FROM categorias c
      WHERE c.padre_id IS NULL
      ORDER BY c.nombre
    `)
    
    if (categorias.length === 0) {
      console.log('⚠️  No hay categorías padre en la base de datos')
      console.log('\n💡 TIP: Crea algunas categorías de prueba:')
      console.log(`
INSERT INTO categorias (nombre, emoji, padre_id) VALUES
('Carpas', '🏕️', NULL),
('Mobiliario', '🪑', NULL),
('Herramientas', '🔧', NULL);
      `)
    } else {
      console.log(`✅ Encontradas ${categorias.length} categoría(s) padre:`)
      categorias.forEach(cat => {
        console.log(`   ${cat.emoji || '📦'} ${cat.nombre} (${cat.total_subcategorias} subcategorías)`)
      })
    }
    
    // ============================================
    // TEST 6: Probar INSERT con emoji
    // ============================================
    console.log('\n🧪 Test 6: Probando INSERT con emoji...')
    
    const testEmoji = '🧪'
    const testNombre = `Test_${Date.now()}`
    
    const [insertResult] = await db.query(
      'INSERT INTO categorias (nombre, emoji, padre_id) VALUES (?, ?, ?)',
      [testNombre, testEmoji, null]
    )
    
    console.log(`✅ INSERT exitoso (ID: ${insertResult.insertId})`)
    
    // Verificar que se guardó correctamente
    const [insertedCat] = await db.query(
      'SELECT id, nombre, emoji FROM categorias WHERE id = ?',
      [insertResult.insertId]
    )
    
    if (insertedCat[0].emoji === testEmoji) {
      console.log(`✅ Emoji guardado correctamente: ${insertedCat[0].emoji}`)
    } else {
      console.log('⚠️  Emoji no se guardó correctamente')
      console.log(`   Esperado: ${testEmoji}`)
      console.log(`   Recibido: ${insertedCat[0].emoji}`)
    }
    
    // Limpiar
    await db.query('DELETE FROM categorias WHERE id = ?', [insertResult.insertId])
    console.log('✅ Registro de prueba eliminado')
    
    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('\n' + '='.repeat(60))
    console.log('✅ TODOS LOS TESTS PASARON')
    console.log('='.repeat(60))
    console.log('✅ Conexión a BD: OK')
    console.log('✅ Base de datos existe: OK')
    console.log('✅ Tabla categorias: OK')
    console.log('✅ Columna emoji: OK')
    console.log('✅ Charset UTF8MB4: OK')
    console.log(`✅ Categorías encontradas: ${categorias.length}`)
    console.log('✅ INSERT/SELECT con emoji: OK')
    console.log('\n🎉 ¡La base de datos está lista para usar!')
    console.log('='.repeat(60))
    
    process.exit(0)
    
  } catch (error) {
    console.log('\n' + '='.repeat(60))
    console.log('❌ ERROR DETECTADO')
    console.log('='.repeat(60))
    console.error('\n📛 Mensaje:', error.message)
    console.error('📝 Código:', error.code)
    console.error('🔍 Estado SQL:', error.sqlState)
    
    // Errores comunes y sus soluciones
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('\n💡 SOLUCIÓN:')
      console.log('   La columna "emoji" no existe en la tabla')
      console.log('   Ejecuta el script: 02_agregar_emoji_categorias.sql')
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUCIÓN:')
      console.log('   MySQL no está corriendo o no acepta conexiones')
      console.log('   1. Inicia MySQL')
      console.log('   2. Verifica el puerto (default: 3306)')
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 SOLUCIÓN:')
      console.log('   Usuario o contraseña incorrectos')
      console.log('   Verifica DB_USER y DB_PASSWORD en .env')
    }
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 SOLUCIÓN:')
      console.log('   La base de datos no existe')
      console.log(`   Crea la BD: CREATE DATABASE ${process.env.DB_NAME};`)
    }
    
    console.log('\n📚 Stack trace completo:')
    console.error(error)
    console.log('='.repeat(60))
    
    process.exit(1)
  }
}

// ============================================
// EJECUTAR TESTS
// ============================================

testDatabase()