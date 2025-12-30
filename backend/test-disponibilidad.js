/**
 * PRUEBA: Verificación de disponibilidad por fechas
 *
 * Ejecutar con: node test-disponibilidad.js
 *
 * Requisitos:
 * - Base de datos con datos de prueba
 * - Servidor corriendo en localhost:3000
 */

const BASE_URL = 'http://localhost:3000/api';

// Simular fetch si no existe
const fetch = globalThis.fetch || require('node-fetch');

async function test() {
  console.log('='.repeat(60));
  console.log('PRUEBA DE DISPONIBILIDAD POR FECHAS');
  console.log('='.repeat(60));

  // ─────────────────────────────────────────────────────────
  // PASO 1: Crear cotización 1 para fecha 2025-02-15
  // ─────────────────────────────────────────────────────────
  console.log('\n[PASO 1] Crear cotización 1 para fecha 2025-02-15');

  const cotizacion1 = await fetch(`${BASE_URL}/cotizaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente_id: 1,  // Ajustar según tus datos
      fecha_evento: '2025-02-15',
      fecha_fin_evento: '2025-02-16',
      evento_nombre: 'Evento Prueba 1',
      evento_ciudad: 'Bogotá'
    })
  }).then(r => r.json());

  console.log('Cotización 1 creada:', cotizacion1.data?.id);

  // Agregar producto a cotización 1
  await fetch(`${BASE_URL}/cotizaciones/${cotizacion1.data.id}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compuesto_id: 1,  // Ajustar según tus datos
      cantidad: 1
    })
  });

  // ─────────────────────────────────────────────────────────
  // PASO 2: Aprobar cotización 1
  // ─────────────────────────────────────────────────────────
  console.log('\n[PASO 2] Aprobar cotización 1');

  const aprobacion1 = await fetch(`${BASE_URL}/cotizaciones/${cotizacion1.data.id}/aprobar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(r => r.json());

  console.log('Aprobación 1:', aprobacion1.mensaje);
  console.log('Elementos asignados:', aprobacion1.elementos_asignados);

  if (aprobacion1.data?.elementos) {
    console.log('Series asignadas:');
    aprobacion1.data.elementos
      .filter(e => e.serie_id)
      .forEach(e => console.log(`  - ${e.numero_serie} (elemento: ${e.elemento_nombre})`));
  }

  // ─────────────────────────────────────────────────────────
  // PASO 3: Crear cotización 2 para MISMA FECHA
  // ─────────────────────────────────────────────────────────
  console.log('\n[PASO 3] Crear cotización 2 para MISMA fecha 2025-02-15');

  const cotizacion2 = await fetch(`${BASE_URL}/cotizaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente_id: 2,  // Diferente cliente
      fecha_evento: '2025-02-15',  // MISMA FECHA
      fecha_fin_evento: '2025-02-16',
      evento_nombre: 'Evento Prueba 2',
      evento_ciudad: 'Medellín'
    })
  }).then(r => r.json());

  console.log('Cotización 2 creada:', cotizacion2.data?.id);

  // Agregar MISMO producto a cotización 2
  await fetch(`${BASE_URL}/cotizaciones/${cotizacion2.data.id}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compuesto_id: 1,  // MISMO producto
      cantidad: 1
    })
  });

  // ─────────────────────────────────────────────────────────
  // PASO 4: Verificar disponibilidad para cotización 2
  // ─────────────────────────────────────────────────────────
  console.log('\n[PASO 4] Verificar disponibilidad para cotización 2');

  const disponibilidad = await fetch(
    `${BASE_URL}/cotizaciones/${cotizacion2.data.id}/disponibilidad`
  ).then(r => r.json());

  console.log('¿Hay problemas?:', disponibilidad.data?.hay_problemas);

  if (disponibilidad.data?.elementos) {
    console.log('\nAnálisis por elemento:');
    disponibilidad.data.elementos.forEach(e => {
      console.log(`  ${e.elemento_nombre}:`);
      console.log(`    - Requiere: ${e.cantidad_requerida}`);
      console.log(`    - Stock total: ${e.stock_total}`);
      console.log(`    - Ocupados en fecha: ${e.ocupados_en_fecha}`);
      console.log(`    - Disponibles: ${e.disponibles}`);
      console.log(`    - Estado: ${e.estado}`);
    });
  }

  // ─────────────────────────────────────────────────────────
  // PASO 5: Intentar aprobar cotización 2
  // ─────────────────────────────────────────────────────────
  console.log('\n[PASO 5] Intentar aprobar cotización 2');

  const aprobacion2 = await fetch(`${BASE_URL}/cotizaciones/${cotizacion2.data.id}/aprobar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})  // Sin forzar
  }).then(r => r.json());

  console.log('Resultado:', aprobacion2.mensaje);

  if (aprobacion2.advertencia) {
    console.log('\n⚠️  ADVERTENCIA DETECTADA:');
    console.log('Elementos faltantes:', aprobacion2.elementos_faltantes);
  }

  // ─────────────────────────────────────────────────────────
  // RESUMEN
  // ─────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN DE LA PRUEBA');
  console.log('='.repeat(60));

  if (disponibilidad.data?.hay_problemas || aprobacion2.advertencia) {
    console.log('✅ El sistema DETECTÓ correctamente el conflicto de disponibilidad');
  } else {
    console.log('❌ El sistema NO detectó el conflicto - revisar lógica');
  }
}

// Ejecutar
test().catch(err => {
  console.error('Error en prueba:', err.message);
});
