// frontend/src/components/dev/ApiDiagnosticPanel.jsx
// Panel visual para diagnosticar la conexión con el backend

import React, { useState } from 'react';
import { ApiDiagnostics } from '../../utils/apiDiagnostics';

const ApiDiagnosticPanel = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  /**
   * Ejecutar diagnóstico completo
   */
  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnostics(null);
    const diag = new ApiDiagnostics();
    
    // Ejecutar tests uno por uno para mostrar progreso
    setCurrentTest('Elementos');
    await diag.testElementos();
    
    setCurrentTest('Categorías');
    await diag.testCategorias();
    
    setCurrentTest('Materiales');
    await diag.testMateriales();
    
    setCurrentTest('Unidades');
    await diag.testUnidades();
    
    setCurrentTest('Series');
    await diag.testSeries();
    
    setCurrentTest('Lotes');
    await diag.testLotes();
    
    setCurrentTest('Estadísticas');
    await diag.testEstadisticas();
    
    const report = diag.getReport();
    setDiagnostics(report);
    setIsRunning(false);
    setCurrentTest('');
  };

  /**
   * Renderizar tarjeta de resumen
   */
  const renderSummary = () => {
    if (!diagnostics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="text-xs text-blue-600 font-semibold uppercase mb-1">
            Total Endpoints
          </div>
          <div className="text-3xl font-bold text-blue-700">
            {diagnostics.summary.total}
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="text-xs text-green-600 font-semibold uppercase mb-1">
            Exitosos
          </div>
          <div className="text-3xl font-bold text-green-700">
            {diagnostics.summary.success}
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="text-xs text-red-600 font-semibold uppercase mb-1">
            Con Errores
          </div>
          <div className="text-3xl font-bold text-red-700">
            {diagnostics.summary.errors}
          </div>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
          <div className="text-xs text-purple-600 font-semibold uppercase mb-1">
            Tasa de Éxito
          </div>
          <div className="text-3xl font-bold text-purple-700">
            {diagnostics.summary.successRate}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderizar detalles de endpoints
   */
  const renderEndpoints = () => {
    if (!diagnostics) return null;

    return (
      <div className="space-y-3">
        {Object.keys(diagnostics.details).map(key => {
          const endpoint = diagnostics.details[key];
          const isSuccess = endpoint.status.includes('✅');

          return (
            <div 
              key={key}
              className={`p-4 rounded-lg border-l-4 ${
                isSuccess 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-2xl mr-2">{endpoint.status}</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {endpoint.method}
                  </span>
                </div>
                {endpoint.count !== undefined && (
                  <div className="text-sm text-gray-600">
                    📊 {endpoint.count} registros
                  </div>
                )}
              </div>

              {endpoint.error && (
                <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                  <strong>Error:</strong> {endpoint.error}
                </div>
              )}

              {endpoint.response && isSuccess && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Ver respuesta
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(endpoint.response, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 Diagnóstico de API
          </h1>
          <p className="text-gray-600 mb-4">
            Verifica la conexión y disponibilidad de todos los endpoints del backend
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Probando {currentTest}...
                </>
              ) : (
                <>
                  🚀 Ejecutar Diagnóstico
                </>
              )}
            </button>

            {diagnostics && (
              <button
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify(diagnostics, null, 2)], 
                    { type: 'application/json' }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `api-diagnostic-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                💾 Descargar JSON
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isRunning && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">
              Probando: <strong>{currentTest}</strong>
            </p>
          </div>
        )}

        {/* Results */}
        {diagnostics && (
          <>
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📊 Resumen
              </h2>
              {renderSummary()}
              
              <div className="text-sm text-gray-500">
                Ejecutado: {new Date(diagnostics.timestamp).toLocaleString('es-CO')}
              </div>
            </div>

            {/* Endpoints Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📋 Detalles por Endpoint
              </h2>
              {renderEndpoints()}
            </div>

            {/* Recommendations */}
            {diagnostics.summary.errors > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-bold text-yellow-800 mb-3">
                  ⚠️ Recomendaciones
                </h3>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li>• Verifica que el backend esté corriendo en <code className="bg-yellow-100 px-2 py-1 rounded">http://localhost:3000</code></li>
                  <li>• Revisa la consola del backend para ver errores específicos</li>
                  <li>• Asegúrate de que las rutas existan en el backend</li>
                  <li>• Verifica que la base de datos esté conectada</li>
                  <li>• Comprueba que las tablas existan y tengan datos</li>
                </ul>
              </div>
            )}

            {diagnostics.summary.errors === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-bold text-green-800 mb-3">
                  ✅ ¡Conexión Exitosa!
                </h3>
                <p className="text-sm text-green-700">
                  Todos los endpoints están funcionando correctamente. El frontend puede comunicarse con el backend sin problemas.
                </p>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {!diagnostics && !isRunning && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📖 Instrucciones
            </h2>
            <div className="prose text-gray-600">
              <ol className="space-y-2">
                <li>1. Asegúrate de que tu backend esté corriendo en <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000</code></li>
                <li>2. Haz clic en el botón "Ejecutar Diagnóstico"</li>
                <li>3. Revisa los resultados para ver qué endpoints funcionan</li>
                <li>4. Si hay errores, sigue las recomendaciones para solucionarlos</li>
              </ol>

              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">Endpoints que se probarán:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• GET /api/elementos</li>
                  <li>• GET /api/categorias</li>
                  <li>• GET /api/materiales</li>
                  <li>• GET /api/unidades</li>
                  <li>• GET /api/series/disponibles</li>
                  <li>• GET /api/lotes/resumen</li>
                  <li>• GET /api/estadisticas</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDiagnosticPanel;