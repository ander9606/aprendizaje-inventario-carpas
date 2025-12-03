/**
 * ============================================
 * SCRIPT DE PRUEBA: Verificación de Cards API
 * ============================================
 *
 * Este script verifica que todos los endpoints usados
 * por las cards del frontend estén funcionando correctamente
 *
 * USO: node backend/test-api-cards.js
 */

const http = require('http');

// Configuración
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TIMEOUT = 5000;

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Contadores de resultados
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Helper para hacer peticiones HTTP
 */
const request = async (method, endpoint, data = null) => {
  return new Promise((resolve) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(body);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: parsedData,
            status: res.statusCode
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Invalid JSON response: ${body}`,
            status: res.statusCode
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        status: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        status: null
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

/**
 * Función de test genérica
 */
const test = async (name, testFn) => {
  totalTests++;
  process.stdout.write(`\n${colors.cyan}TEST:${colors.reset} ${name}... `);

  try {
    await testFn();
    passedTests++;
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    return true;
  } catch (error) {
    failedTests++;
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
};

/**
 * Helper para verificar estructura de datos
 */
const assertStructure = (obj, requiredFields, name) => {
  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`Campo requerido '${field}' no encontrado en ${name}`);
    }
  }
};

/**
 * ============================================
 * TESTS PARA CATEGORIAS PADRE CARD
 * ============================================
 */
const testCategoriasPadreCard = async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════`);
  console.log(`  CATEGORIA PADRE CARD TESTS`);
  console.log(`═══════════════════════════════════════${colors.reset}`);

  await test('GET /api/categorias/padres - Obtener categorías padres', async () => {
    const result = await request('GET', '/categorias/padres');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    if (!result.data.success) {
      throw new Error('Response success is false');
    }

    if (!Array.isArray(result.data.data)) {
      throw new Error('Data is not an array');
    }

    // Verificar estructura de cada categoría padre
    if (result.data.data.length > 0) {
      const categoria = result.data.data[0];
      assertStructure(categoria, ['id', 'nombre', 'emoji', 'total_subcategorias'], 'Categoria Padre');
      console.log(`    ${colors.yellow}→ ${result.data.data.length} categorías padres encontradas${colors.reset}`);
    }
  });

  await test('PUT /api/categorias/:id - Actualizar emoji de categoría', async () => {
    // Primero obtener una categoría para actualizar
    const getCategorias = await request('GET', '/categorias/padres');

    if (!getCategorias.success || getCategorias.data.data.length === 0) {
      console.log(`    ${colors.yellow}⚠ Saltado - No hay categorías para actualizar${colors.reset}`);
      return;
    }

    const categoria = getCategorias.data.data[0];
    const nuevoEmoji = '🎯';

    const result = await request('PUT', `/categorias/${categoria.id}`, {
      nombre: categoria.nombre,
      emoji: nuevoEmoji,
      padre_id: categoria.padre_id
    });

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    console.log(`    ${colors.yellow}→ Emoji actualizado a ${nuevoEmoji}${colors.reset}`);
  });
};

/**
 * ============================================
 * TESTS PARA SUBCATEGORIA CARD
 * ============================================
 */
const testSubcategoriaCard = async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════`);
  console.log(`  SUBCATEGORIA CARD TESTS`);
  console.log(`═══════════════════════════════════════${colors.reset}`);

  let categoriaId = null;

  await test('GET /api/categorias/:id/subcategorias - Obtener subcategorías', async () => {
    // Primero obtener una categoría padre
    const getCategorias = await request('GET', '/categorias/padres');

    if (!getCategorias.success || getCategorias.data.data.length === 0) {
      console.log(`    ${colors.yellow}⚠ Saltado - No hay categorías padre${colors.reset}`);
      return;
    }

    categoriaId = getCategorias.data.data[0].id;
    const result = await request('GET', `/categorias/${categoriaId}/subcategorias`);

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    if (!Array.isArray(result.data.data)) {
      throw new Error('Data is not an array');
    }

    // Verificar estructura de subcategoría
    if (result.data.data.length > 0) {
      const subcategoria = result.data.data[0];
      assertStructure(subcategoria, ['id', 'nombre', 'emoji', 'total_elementos'], 'Subcategoria');
      console.log(`    ${colors.yellow}→ ${result.data.data.length} subcategorías encontradas${colors.reset}`);
    }
  });
};

/**
 * ============================================
 * TESTS PARA STAT CARD
 * ============================================
 */
const testStatCard = async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════`);
  console.log(`  STAT CARD TESTS`);
  console.log(`═══════════════════════════════════════${colors.reset}`);

  await test('GET /api/elementos - Obtener elementos para stats', async () => {
    const result = await request('GET', '/elementos');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    if (!result.data.success) {
      throw new Error('Response success is false');
    }

    // Verificar que tiene total
    if (typeof result.data.total !== 'number') {
      throw new Error('Total no es un número');
    }

    console.log(`    ${colors.yellow}→ Total elementos: ${result.data.total}${colors.reset}`);
  });

  await test('GET /api/categorias - Obtener total de categorías', async () => {
    const result = await request('GET', '/categorias');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    console.log(`    ${colors.yellow}→ Total categorías: ${result.data.data?.length || 0}${colors.reset}`);
  });
};

/**
 * ============================================
 * TESTS PARA ELEMENTO LOTE CARD
 * ============================================
 */
const testElementoLoteCard = async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════`);
  console.log(`  ELEMENTO LOTE CARD TESTS`);
  console.log(`═══════════════════════════════════════${colors.reset}`);

  await test('GET /api/lotes - Obtener lotes', async () => {
    const result = await request('GET', '/lotes');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    if (!result.data.success) {
      throw new Error('Response success is false');
    }

    if (!Array.isArray(result.data.data)) {
      throw new Error('Data is not an array');
    }

    // Verificar estructura de lote
    if (result.data.data.length > 0) {
      const lote = result.data.data[0];
      assertStructure(lote, ['id', 'elemento_id', 'lote_numero', 'cantidad', 'estado'], 'Lote');
      console.log(`    ${colors.yellow}→ ${result.data.data.length} lotes encontrados${colors.reset}`);
    }
  });

  await test('GET /api/lotes/elemento/:elementoId - Obtener lotes de elemento', async () => {
    // Primero obtener un elemento sin series
    const getElementos = await request('GET', '/elementos');

    if (!getElementos.success || !getElementos.data.data) {
      console.log(`    ${colors.yellow}⚠ Saltado - No hay elementos${colors.reset}`);
      return;
    }

    const elementosSinSeries = getElementos.data.data.filter(e => !e.requiere_series);

    if (elementosSinSeries.length === 0) {
      console.log(`    ${colors.yellow}⚠ Saltado - No hay elementos sin series${colors.reset}`);
      return;
    }

    const elementoId = elementosSinSeries[0].id;
    const result = await request('GET', `/lotes/elemento/${elementoId}`);

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    console.log(`    ${colors.yellow}→ Lotes del elemento: ${result.data.total_lotes || 0}${colors.reset}`);
  });
};

/**
 * ============================================
 * TESTS PARA ELEMENTO SERIE CARD
 * ============================================
 */
const testElementoSerieCard = async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════`);
  console.log(`  ELEMENTO SERIE CARD TESTS`);
  console.log(`═══════════════════════════════════════${colors.reset}`);

  await test('GET /api/series - Obtener series', async () => {
    const result = await request('GET', '/series');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    if (!result.data.success) {
      throw new Error('Response success is false');
    }

    if (!Array.isArray(result.data.data)) {
      throw new Error('Data is not an array');
    }

    // Verificar estructura de serie
    if (result.data.data.length > 0) {
      const serie = result.data.data[0];
      assertStructure(serie, ['id', 'numero_serie', 'id_elemento', 'estado'], 'Serie');
      console.log(`    ${colors.yellow}→ ${result.data.data.length} series encontradas${colors.reset}`);
    }
  });

  await test('GET /api/series/elemento/:elementoId - Obtener series de elemento', async () => {
    // Primero obtener un elemento con series
    const getElementos = await request('GET', '/elementos');

    if (!getElementos.success || !getElementos.data.data) {
      console.log(`    ${colors.yellow}⚠ Saltado - No hay elementos${colors.reset}`);
      return;
    }

    const elementosConSeries = getElementos.data.data.filter(e => e.requiere_series);

    if (elementosConSeries.length === 0) {
      console.log(`    ${colors.yellow}⚠ Saltado - No hay elementos con series${colors.reset}`);
      return;
    }

    const elementoId = elementosConSeries[0].id;
    const result = await request('GET', `/series/elemento/${elementoId}`);

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    console.log(`    ${colors.yellow}→ Series del elemento: ${result.data.total_series || 0}${colors.reset}`);
  });
};

/**
 * ============================================
 * TESTS ADICIONALES
 * ============================================
 */
const testPaginacion = async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════`);
  console.log(`  PAGINACION TESTS`);
  console.log(`═══════════════════════════════════════${colors.reset}`);

  await test('GET /api/elementos?page=1&limit=5 - Paginación de elementos', async () => {
    const result = await request('GET', '/elementos?page=1&limit=5');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    if (!result.data.pagination) {
      throw new Error('No pagination data in response');
    }

    assertStructure(result.data.pagination, ['page', 'limit', 'total', 'totalPages'], 'Pagination');
    console.log(`    ${colors.yellow}→ Página ${result.data.pagination.page} de ${result.data.pagination.totalPages}${colors.reset}`);
  });

  await test('GET /api/lotes?page=1&limit=10 - Paginación de lotes', async () => {
    const result = await request('GET', '/lotes?page=1&limit=10');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    if (!result.data.pagination) {
      // Sin paginación es válido si no hay parámetros
      console.log(`    ${colors.yellow}→ Sin paginación (modo retrocompatible)${colors.reset}`);
      return;
    }

    console.log(`    ${colors.yellow}→ Página ${result.data.pagination.page} de ${result.data.pagination.totalPages}${colors.reset}`);
  });
};

/**
 * ============================================
 * EJECUTAR TODOS LOS TESTS
 * ============================================
 */
const runAllTests = async () => {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════╗`);
  console.log(`║  🧪 TEST DE VERIFICACIÓN DE CARDS API           ║`);
  console.log(`║  API: ${API_BASE_URL.padEnd(40)}║`);
  console.log(`╚═══════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Ejecutar todos los grupos de tests
    await testCategoriasPadreCard();
    await testSubcategoriaCard();
    await testStatCard();
    await testElementoLoteCard();
    await testElementoSerieCard();
    await testPaginacion();

    // Resumen final
    console.log(`\n${colors.cyan}═══════════════════════════════════════`);
    console.log(`  RESUMEN DE TESTS`);
    console.log(`═══════════════════════════════════════${colors.reset}`);
    console.log(`\n  Total:  ${totalTests}`);
    console.log(`  ${colors.green}Pasados: ${passedTests}${colors.reset}`);
    console.log(`  ${colors.red}Fallados: ${failedTests}${colors.reset}`);

    const percentage = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`  ${colors.yellow}Tasa de éxito: ${percentage}%${colors.reset}\n`);

    // Exit code
    process.exit(failedTests > 0 ? 1 : 0);

  } catch (error) {
    console.error(`\n${colors.red}Error fatal durante los tests:${colors.reset}`, error.message);
    process.exit(1);
  }
};

// Ejecutar
runAllTests();
