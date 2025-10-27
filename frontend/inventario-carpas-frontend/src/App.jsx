// frontend/src/App.jsx
// VERSIÓN CON PANEL DE DIAGNÓSTICO

import React, { useState } from 'react';
import StatsCard from './components/common/statsCard';
import Inventario from './pages/inventario';
import ApiDiagnosticPanel from './components/dev/ApiDiagnosticPanel';
import { useEstadisticas } from './hooks';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, inventario, diagnostic
  const { estadisticas, loading } = useEstadisticas(currentView === 'dashboard');

  /**
   * Renderizar Dashboard
   */
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Sistema de Inventario de Carpas
        </h1>
        <p className="text-gray-600">
          Panel de control y gestión de inventario
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Elementos"
          value={estadisticas?.totalElementos || 0}
          icon="📦"
          color="blue"
          subtitle="En el inventario"
          onClick={() => setCurrentView('inventario')}
        />

        <StatsCard
          title="Disponibles"
          value={estadisticas?.disponibles || 0}
          icon="✓"
          color="green"
          subtitle="Listos para alquilar"
        />

        <StatsCard
          title="Alquilados"
          value={estadisticas?.alquilados || 0}
          icon="📤"
          color="yellow"
          subtitle="En uso actualmente"
        />

        <StatsCard
          title="En Mantenimiento"
          value={estadisticas?.enMantenimiento || 0}
          icon="🔧"
          color="red"
          subtitle="Requieren atención"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Con Series"
          value={estadisticas?.conSeries || 0}
          icon="📋"
          color="purple"
          subtitle="Elementos individualizados"
        />

        <StatsCard
          title="Stock General"
          value={estadisticas?.sinSeries || 0}
          icon="📊"
          color="gray"
          subtitle="Manejo por cantidad"
        />

        <StatsCard
          title="Categorías"
          value={estadisticas?.totalCategorias || 0}
          icon="🏷️"
          color="blue"
          subtitle="Tipos de elementos"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setCurrentView('inventario')}
            className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl">📦</span>
            <div className="text-left">
              <p className="font-semibold">Ver Inventario</p>
              <p className="text-sm text-blue-600">Gestionar elementos</p>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('diagnostic')}
            className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-2xl">🔍</span>
            <div className="text-left">
              <p className="font-semibold">Diagnóstico API</p>
              <p className="text-sm text-purple-600">Verificar conexión</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <p className="font-semibold">Reportes</p>
              <p className="text-sm text-green-600">Ver estadísticas</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * Renderizar vista actual
   */
  const renderContent = () => {
    switch (currentView) {
      case 'inventario':
        return <Inventario />;
      case 'diagnostic':
        return <ApiDiagnosticPanel />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm mb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-blue-600">
                🏕️ Carpas App
              </h1>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('inventario')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'inventario'
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Inventario
                </button>
                <button
                  onClick={() => setCurrentView('diagnostic')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'diagnostic'
                      ? 'bg-purple-100 text-purple-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🔍 Diagnóstico
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className={currentView !== 'diagnostic' ? 'container mx-auto px-4 pb-8' : ''}>
        {loading && currentView === 'dashboard' ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Cargando estadísticas...</span>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}

export default App;