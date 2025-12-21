// ============================================
// SCRIPT DEBUG: Ver elementos de categoría 5
// ============================================

const { pool } = require('./config/database');

async function debugCategoria5() {
  try {
    console.log('\n========================================');
    console.log('🔍 VERIFICANDO CATEGORÍA 5 (Accesorios)');
    console.log('========================================\n');

    // 1. Información de la categoría
    const [categoria] = await pool.query(
      'SELECT * FROM categorias WHERE id = 5'
    );

    console.log('📁 CATEGORÍA:');
    console.log(categoria[0]);
    console.log('\n');

    // 2. Elementos asociados directamente
    const [elementos] = await pool.query(`
      SELECT
        e.id,
        e.nombre,
        e.descripcion,
        e.cantidad,
        e.categoria_id,
        e.estado,
        e.ubicacion,
        e.fecha_ingreso,
        e.requiere_series
      FROM elementos e
      WHERE e.categoria_id = 5
      ORDER BY e.id
    `);

    console.log(`📦 ELEMENTOS ASOCIADOS: ${elementos.length} elementos`);
    console.log('----------------------------------------\n');

    if (elementos.length > 0) {
      elementos.forEach((elem, index) => {
        console.log(`${index + 1}. ID: ${elem.id}`);
        console.log(`   Nombre: ${elem.nombre}`);
        console.log(`   Descripción: ${elem.descripcion || 'N/A'}`);
        console.log(`   Cantidad: ${elem.cantidad}`);
        console.log(`   Estado: ${elem.estado}`);
        console.log(`   Ubicación: ${elem.ubicacion || 'N/A'}`);
        console.log(`   Requiere series: ${elem.requiere_series ? 'Sí' : 'No'}`);
        console.log(`   Fecha ingreso: ${elem.fecha_ingreso || 'N/A'}`);
        console.log('');
      });
    }

    // 3. Verificar subcategorías
    const [subcategorias] = await pool.query(
      'SELECT id, nombre FROM categorias WHERE padre_id = 5'
    );

    console.log(`📂 SUBCATEGORÍAS: ${subcategorias.length} subcategorías`);
    if (subcategorias.length > 0) {
      subcategorias.forEach(sub => {
        console.log(`   - ${sub.nombre} (ID: ${sub.id})`);
      });
    } else {
      console.log('   (ninguna)');
    }
    console.log('\n');

    // 4. Resumen y opciones
    console.log('========================================');
    console.log('💡 OPCIONES DISPONIBLES:');
    console.log('========================================\n');

    if (elementos.length > 0) {
      console.log('Para poder eliminar la categoría "Accesorios", puedes:');
      console.log('');
      console.log('A) Eliminar todos estos elementos manualmente desde la UI');
      console.log('B) Mover estos elementos a otra categoría');
      console.log('C) Eliminarlos directamente desde la base de datos (¡CUIDADO!)');
      console.log('');
      console.log('Si quieres eliminarlos desde la base de datos, ejecuta:');
      console.log('   DELETE FROM elementos WHERE categoria_id = 5;');
      console.log('');
      console.log('⚠️  ADVERTENCIA: Esta acción NO se puede deshacer.');
    } else {
      console.log('✅ La categoría no tiene elementos. Puedes eliminarla.');
    }

    console.log('\n========================================\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

// Ejecutar
debugCategoria5();
