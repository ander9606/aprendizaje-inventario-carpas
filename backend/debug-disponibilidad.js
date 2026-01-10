/**
 * SCRIPT DE DIAGNÓSTICO: Disponibilidad
 *
 * Ejecutar con: node debug-disponibilidad.js
 *
 * Este script verifica paso a paso qué datos hay
 * en las tablas relacionadas con disponibilidad
 */

const { pool } = require('./config/database');

async function diagnosticar() {
  console.log('='.repeat(70));
  console.log('DIAGNÓSTICO DE DISPONIBILIDAD');
  console.log('='.repeat(70));

  try {
    // 1. Verificar elementos en tabla elementos
    console.log('\n📦 [1] TABLA ELEMENTOS:');
    const [elementos] = await pool.query(`
      SELECT id, nombre, cantidad, requiere_series, estado
      FROM elementos
      ORDER BY id
      LIMIT 10
    `);
    console.table(elementos);

    // 2. Verificar series
    console.log('\n🔢 [2] TABLA SERIES:');
    const [series] = await pool.query(`
      SELECT s.id, s.id_elemento, e.nombre as elemento, s.numero_serie, s.estado
      FROM series s
      LEFT JOIN elementos e ON s.id_elemento = e.id
      LIMIT 10
    `);
    if (series.length === 0) {
      console.log('   ⚠️  NO HAY SERIES REGISTRADAS');
    } else {
      console.table(series);
    }

    // 3. Verificar lotes
    console.log('\n📦 [3] TABLA LOTES:');
    const [lotes] = await pool.query(`
      SELECT l.id, l.elemento_id, e.nombre as elemento, l.lote_numero, l.cantidad, l.estado
      FROM lotes l
      LEFT JOIN elementos e ON l.elemento_id = e.id
      LIMIT 10
    `);
    if (lotes.length === 0) {
      console.log('   ⚠️  NO HAY LOTES REGISTRADOS');
    } else {
      console.table(lotes);
    }

    // 4. Verificar elementos compuestos (plantillas)
    console.log('\n🏗️  [4] ELEMENTOS COMPUESTOS (PLANTILLAS):');
    const [compuestos] = await pool.query(`
      SELECT id, nombre, precio_base
      FROM elementos_compuestos
      LIMIT 10
    `);
    console.table(compuestos);

    // 5. Verificar componentes de plantillas
    console.log('\n🔧 [5] COMPUESTO_COMPONENTES (qué elementos necesita cada plantilla):');
    const [componentes] = await pool.query(`
      SELECT
        cc.compuesto_id,
        ec.nombre as plantilla,
        cc.elemento_id,
        e.nombre as elemento,
        e.cantidad as stock_en_elementos,
        cc.cantidad as cantidad_en_plantilla,
        cc.tipo,
        e.requiere_series
      FROM compuesto_componentes cc
      INNER JOIN elementos_compuestos ec ON cc.compuesto_id = ec.id
      INNER JOIN elementos e ON cc.elemento_id = e.id
      ORDER BY cc.compuesto_id, cc.tipo
      LIMIT 20
    `);
    console.table(componentes);

    // 6. Simulación de verificación de stock
    console.log('\n📊 [6] SIMULACIÓN DE STOCK PARA CADA ELEMENTO:');

    for (const comp of componentes.slice(0, 5)) {
      const elementoId = comp.elemento_id;
      const requiereSeries = comp.requiere_series;

      console.log(`\n   Elemento: ${comp.elemento} (ID: ${elementoId})`);
      console.log(`   requiere_series: ${requiereSeries}`);

      // Stock en tabla elementos
      const [stockElementos] = await pool.query(
        'SELECT cantidad FROM elementos WHERE id = ?',
        [elementoId]
      );
      console.log(`   Stock en tabla elementos: ${stockElementos[0]?.cantidad || 0}`);

      // Stock en series
      const [stockSeries] = await pool.query(
        "SELECT COUNT(*) as total FROM series WHERE id_elemento = ? AND estado = 'disponible'",
        [elementoId]
      );
      console.log(`   Series disponibles: ${stockSeries[0]?.total || 0}`);

      // Stock en lotes
      const [stockLotes] = await pool.query(
        "SELECT COALESCE(SUM(cantidad), 0) as total FROM lotes WHERE elemento_id = ? AND estado = 'disponible'",
        [elementoId]
      );
      console.log(`   Cantidad en lotes: ${stockLotes[0]?.total || 0}`);
    }

    // 7. Conclusión
    console.log('\n' + '='.repeat(70));
    console.log('CONCLUSIÓN:');
    console.log('='.repeat(70));

    const tieneElementos = elementos.length > 0;
    const tieneSeries = series.length > 0;
    const tieneLotes = lotes.length > 0;
    const elementosConStock = elementos.filter(e => e.cantidad > 0).length;

    console.log(`\n✅ Elementos registrados: ${elementos.length}`);
    console.log(`✅ Elementos con cantidad > 0: ${elementosConStock}`);
    console.log(`${tieneSeries ? '✅' : '❌'} Series registradas: ${series.length}`);
    console.log(`${tieneLotes ? '❌' : '❌'} Lotes registrados: ${lotes.length}`);

    if (!tieneSeries && !tieneLotes) {
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('   No hay series ni lotes registrados.');
      console.log('   El sistema usará el campo "cantidad" de la tabla elementos como fallback.');
      console.log('   Verifica que los elementos tengan cantidad > 0 en la tabla elementos.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticar();
