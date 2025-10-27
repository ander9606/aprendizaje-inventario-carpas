// frontend/src/utils/apiDiagnostics.js
// Herramienta de diagnóstico para verificar la conexión con el backend

import apiService from '../services/api';

/**
 * Diagnóstico completo de la API
 * Prueba todos los endpoints y reporta el estado
 */
export class ApiDiagnostics {
  constructor() {
    this.results = {
      baseURL: apiService.request ? 'Configurado' : 'No configurado',
      endpoints: {},
      errors: [],
      success: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Probar endpoint de elementos
   */
  async testElementos() {
    console.log('🔍 Probando endpoint: /elementos');
    try {
      const data = await apiService.getElementos(false);
      this.results.endpoints.elementos = {
        status: '✅ OK',
        method: 'GET /api/elementos',
        response: data,
        count: Array.isArray(data) ? data.length : 'No es array'
      };
      this.results.success.push('elementos');
      return { success: true, data };
    } catch (error) {
      this.results.endpoints.elementos = {
        status: '❌ ERROR',
        method: 'GET /api/elementos',
        error: error.message
      };
      this.results.errors.push({ endpoint: 'elementos', error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Probar endpoint de categorías
   */
  async testCategorias() {
    console.log('🔍 Probando endpoint: /categorias');
    try {
      const data = await apiService.getCategorias();
      this.results.endpoints.categorias = {
        status: '✅ OK',
        method: 'GET /api/categorias',
        response: data,
        count: Array.isArray(data) ? data.length : 'No es array'
      };
      this.results.success.push('categorias');
      return { success: true, data };
    } catch (error) {
      this.results.endpoints.categorias = {
        status: '❌ ERROR',
        method: 'GET /api/categorias',
        error: error.message
      };
      this.results.errors.push({ endpoint: 'categorias', error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Probar endpoint de materiales
   */
  async testMateriales() {
    console.log('🔍 Probando endpoint: /materiales');
    try {
      const data = await apiService.getMateriales();
      this.results.endpoints.materiales = {
        status: '✅ OK',
        method: 'GET /api/materiales',
        response: data,
        count: Array.isArray(data) ? data.length : 'No es array'
      };
      this.results.success.push('materiales');
      return { success: true, data };
    } catch (error) {
      this.results.endpoints.materiales = {
        status: '❌ ERROR',
        method: 'GET /api/materiales',
        error: error.message
      };
      this.results.errors.push({ endpoint: 'materiales', error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Probar endpoint de unidades
   */
  async testUnidades() {
    console.log('🔍 Probando endpoint: /unidades');
    try {
      const data = await apiService.getUnidades();
      this.results.endpoints.unidades = {
        status: '✅ OK',
        method: 'GET /api/unidades',
        response: data,
        count: Array.isArray(data) ? data.length : 'No es array'
      };
      this.results.success.push('unidades');
      return { success: true, data };
    } catch (error) {
      this.results.endpoints.unidades = {
        status: '❌ ERROR',
        method: 'GET /api/unidades',
        error: error.message
      };
      this.results.errors.push({ endpoint: 'unidades', error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Probar endpoint de series
   */
  async testSeries() {
    console.log('🔍 Probando endpoint: /series/disponibles');
    try {
      const data = await apiService.getSeriesDisponibles();
      this.results.endpoints.series = {
        status: '✅ OK',
        method: 'GET /api/series/disponibles',
        response: data,
        count: Array.isArray(data) ? data.length : 'No es array'
      };
      this.results.success.push('series');
      return { success: true, data };
    } catch (error) {
      this.results.endpoints.series = {
        status: '❌ ERROR',
        method: 'GET /api/series/disponibles',
        error: error.message
      };
      this.results.errors.push({ endpoint: 'series', error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Probar endpoint de lotes
   */
  async testLotes() {
    console.log('🔍 Probando endpoint: /lotes/resumen');
    try {
      const data = await apiService.getLotesResumen();
      this.results.endpoints.lotes = {
        status: '✅ OK',
        method: 'GET /api/lotes/resumen',
        response: data,
        count: Array.isArray(data) ? data.length : 'No es array'
      };
      this.results.success.push('lotes');
      return { success: true, data };
    } catch (error) {
      this.results.endpoints.lotes = {
        status: '❌ ERROR',
        method: 'GET /api/lotes/resumen',
        error: error.message
      };
      this.results.errors.push({ endpoint: 'lotes', error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Probar endpoint de estadísticas
   */
  async testEstadisticas() {
    console.log('🔍 Probando endpoint: /estadisticas');
    try {
      const data = await apiService.getEstadisticas();
      this.results.endpoints.estadisticas = {
        status: '✅ OK',
        method: 'GET /api/estadisticas',
        response: data
      };
      this.results.success.push('estadisticas');
      return { success: true, data };
    } catch (error) {
      this.results.endpoints.estadisticas = {
        status: '❌ ERROR',
        method: 'GET /api/estadisticas',
        error: error.message
      };
      this.results.errors.push({ endpoint: 'estadisticas', error: error.message });
      return { success: false, error };
    }
  }

  /**
   * Ejecutar todos los tests
   */
  async runAllTests() {
    console.log('🚀 Iniciando diagnóstico de API...\n');

    await this.testElementos();
    await this.testCategorias();
    await this.testMateriales();
    await this.testUnidades();
    await this.testSeries();
    await this.testLotes();
    await this.testEstadisticas();

    return this.getReport();
  }

  /**
   * Generar reporte de resultados
   */
  getReport() {
    const total = Object.keys(this.results.endpoints).length;
    const successCount = this.results.success.length;
    const errorCount = this.results.errors.length;

    const report = {
      summary: {
        total,
        success: successCount,
        errors: errorCount,
        successRate: `${Math.round((successCount / total) * 100)}%`
      },
      details: this.results.endpoints,
      errors: this.results.errors,
      timestamp: this.results.timestamp
    };

    // Log en consola
    console.log('\n📊 REPORTE DE DIAGNÓSTICO');
    console.log('========================\n');
    console.log(`Total endpoints: ${total}`);
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Con errores: ${errorCount}`);
    console.log(`📈 Tasa de éxito: ${report.summary.successRate}\n`);

    if (errorCount > 0) {
      console.log('❌ ERRORES ENCONTRADOS:');
      this.results.errors.forEach(err => {
        console.log(`  - ${err.endpoint}: ${err.error}`);
      });
      console.log('');
    }

    console.log('📋 DETALLES POR ENDPOINT:');
    Object.keys(this.results.endpoints).forEach(key => {
      const endpoint = this.results.endpoints[key];
      console.log(`  ${endpoint.status} ${endpoint.method}`);
      if (endpoint.count !== undefined) {
        console.log(`     Registros: ${endpoint.count}`);
      }
      if (endpoint.error) {
        console.log(`     Error: ${endpoint.error}`);
      }
    });

    return report;
  }

  /**
   * Generar reporte HTML
   */
  getHTMLReport() {
    const report = this.getReport();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Diagnóstico de API</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 1200px; 
            margin: 40px auto; 
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 { color: #333; margin-bottom: 10px; }
          .timestamp { color: #666; font-size: 14px; margin-bottom: 30px; }
          .summary { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin-bottom: 40px;
          }
          .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ddd;
          }
          .stat-card.success { border-left-color: #10b981; }
          .stat-card.error { border-left-color: #ef4444; }
          .stat-card.total { border-left-color: #3b82f6; }
          .stat-card.rate { border-left-color: #8b5cf6; }
          .stat-label { 
            font-size: 12px; 
            color: #666; 
            text-transform: uppercase; 
            font-weight: 600;
            margin-bottom: 8px;
          }
          .stat-value { 
            font-size: 36px; 
            font-weight: bold; 
            color: #333;
          }
          .endpoint {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #ddd;
          }
          .endpoint.success { border-left-color: #10b981; }
          .endpoint.error { border-left-color: #ef4444; }
          .endpoint-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .status { 
            font-size: 24px; 
          }
          .method {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #333;
          }
          .count {
            color: #666;
            font-size: 14px;
          }
          .error-msg {
            background: #fee;
            border: 1px solid #fcc;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            color: #c00;
            font-size: 14px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin: 30px 0 20px 0;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Diagnóstico de API</h1>
          <div class="timestamp">Ejecutado: ${new Date(report.timestamp).toLocaleString('es-CO')}</div>
          
          <div class="summary">
            <div class="stat-card total">
              <div class="stat-label">Total Endpoints</div>
              <div class="stat-value">${report.summary.total}</div>
            </div>
            <div class="stat-card success">
              <div class="stat-label">Exitosos</div>
              <div class="stat-value">${report.summary.success}</div>
            </div>
            <div class="stat-card error">
              <div class="stat-label">Con Errores</div>
              <div class="stat-value">${report.summary.errors}</div>
            </div>
            <div class="stat-card rate">
              <div class="stat-label">Tasa de Éxito</div>
              <div class="stat-value">${report.summary.successRate}</div>
            </div>
          </div>

          <div class="section-title">Detalles por Endpoint</div>
          
          ${Object.keys(report.details).map(key => {
            const endpoint = report.details[key];
            const isSuccess = endpoint.status.includes('✅');
            return `
              <div class="endpoint ${isSuccess ? 'success' : 'error'}">
                <div class="endpoint-header">
                  <div>
                    <span class="status">${endpoint.status}</span>
                    <span class="method">${endpoint.method}</span>
                  </div>
                  ${endpoint.count !== undefined ? `<div class="count">Registros: ${endpoint.count}</div>` : ''}
                </div>
                ${endpoint.error ? `<div class="error-msg">❌ ${endpoint.error}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Ejecutar diagnóstico rápido
 */
export async function quickDiagnostic() {
  const diagnostics = new ApiDiagnostics();
  return await diagnostics.runAllTests();
}

/**
 * Ejecutar y descargar reporte HTML
 */
export async function downloadDiagnosticReport() {
  const diagnostics = new ApiDiagnostics();
  await diagnostics.runAllTests();
  
  const html = diagnostics.getHTMLReport();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-diagnostic-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default ApiDiagnostics;