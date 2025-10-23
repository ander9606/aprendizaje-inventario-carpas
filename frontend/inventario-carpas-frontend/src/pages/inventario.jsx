// frontend/src/pages/Inventario.js
// VERSIÓN COMPLETA Y ACTUALIZADA

import React, { useState } from 'react';
import { useInventario } from '../hooks';
import { useMateriales } from '../hooks/useMateriales';
import { useUnidades } from '../hooks/useUnidades';
import CreateElementoModal from '../components/common/modals/CreateElementoModal';
import EditElementoModal from '../components/common/modals/EditElementoModal';
import MovimientoModal from '../components/common/modals/MovimientoModal';

/**
 * Componente principal de Inventario
 * Con modales completamente funcionales y compatibles con el backend
 */
const Inventario = () => {
  // Estado local para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [selectedElemento, setSelectedElemento] = useState(null);

  // Hook de inventario con todas las funcionalidades
  const {
    elementos,
    lotes,
    categorias,
    loading,
    errors,
    successMessages,
    hasError,
    hasSuccess,
    refreshAll,
    clearAllMessages
  } = useInventario({
    fetchElementos: true,
    fetchLotes: true,
    fetchCategorias: true,
    conSeries: true
  });

  // Hooks para materiales y unidades
  const { materiales } = useMateriales(true);
  const { unidades } = useUnidades(true);

  /**
   * Manejar creación de elemento
   */
  const handleCreateElemento = async (formData) => {
    await elementos.createElemento(formData);
    setShowCreateModal(false);
  };

  /**
   * Manejar actualización de elemento
   */
  const handleUpdateElemento = async (id, formData) => {
    await elementos.updateElemento(id, formData);
    setShowEditModal(false);
    setSelectedElemento(null);
  };

  /**
   * Manejar eliminación de elemento
   */
  const handleDeleteElemento = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este elemento? Esta acción no se puede deshacer.')) {
      try {
        await elementos.deleteElemento(id);
      } catch (error) {
        console.error('Error al eliminar elemento:', error);
      }
    }
  };

  /**
   * Manejar creación de movimiento de lote
   */
  const handleCreateMovimiento = async (movimientoData) => {
    await lotes.createMovimientoLote(movimientoData);
    setShowMovimientoModal(false);
  };

  /**
   * Abrir modal de edición
   */
  const handleOpenEditModal = (elemento) => {
    setSelectedElemento(elemento);
    setShowEditModal(true);
  };

  /**
   * Renderizar notificaciones de éxito/error
   */
  const renderNotifications = () => {
    if (!hasError && !hasSuccess) return null;

    return (
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {/* Errores */}
        {errors.map((error, index) => (
          <div 
            key={`error-${index}`}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative shadow-lg animate-slide-in"
            role="alert"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={clearAllMessages}
                className="flex-shrink-0 ml-4 inline-flex text-red-400 hover:text-red-600 focus:outline-none"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
          </div>
        ))}

        {/* Mensajes de éxito */}
        {successMessages.map((message, index) => (
          <div 
            key={`success-${index}`}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative shadow-lg animate-slide-in"
            role="alert"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">Éxito</p>
                <p className="text-sm mt-1">{message}</p>
              </div>
              <button
                onClick={clearAllMessages}
                className="flex-shrink-0 ml-4 inline-flex text-green-400 hover:text-green-600 focus:outline-none"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Obtener badge de estado
   */
  const getEstadoBadge = (estado) => {
    const estados = {
      bueno: { color: 'bg-green-100 text-green-700', icon: '✓', label: 'Bueno' },
      regular: { color: 'bg-yellow-100 text-yellow-700', icon: '⚠️', label: 'Regular' },
      malo: { color: 'bg-red-100 text-red-700', icon: '❌', label: 'Malo' },
      en_reparacion: { color: 'bg-orange-100 text-orange-700', icon: '🔧', label: 'En Reparación' },
    };
    
    const estadoInfo = estados[estado] || estados.bueno;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
        {estadoInfo.icon} {estadoInfo.label}
      </span>
    );
  };

  /**
   * Renderizar estado de carga inicial
   */
  if (loading && elementos.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <span className="ml-4 text-lg text-gray-600 mt-4">Cargando inventario...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Notificaciones */}
        {renderNotifications()}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-gray-600">
                  <span className="font-semibold text-blue-600">{elementos.data.length}</span> elementos
                </p>
                <span className="text-gray-300">•</span>
                <p className="text-gray-600">
                  <span className="font-semibold text-green-600">{lotes.data.length}</span> lotes activos
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Elemento
              </button>
              <button
                onClick={() => setShowMovimientoModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                📦 Nuevo Movimiento
              </button>
              <button
                onClick={refreshAll}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Filtros por categoría */}
        {categorias.data.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrar por categoría:</h3>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Todos
              </button>
              {categorias.data.map(categoria => (
                <button
                  key={categoria.id}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  {categoria.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid de elementos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elementos.data.map(elemento => (
            <div 
              key={elemento.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {elemento.nombre}
                    </h3>
                    {elemento.categoria && (
                      <span className="inline-block px-2 py-1 bg-white bg-opacity-20 text-white rounded text-xs">
                        {elemento.categoria}
                      </span>
                    )}
                  </div>
                  {getEstadoBadge(elemento.estado)}
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 space-y-3">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Cantidad</p>
                    <p className="font-semibold text-gray-900">{elemento.cantidad || 0}</p>
                  </div>
                  {elemento.material && (
                    <div>
                      <p className="text-gray-500">Material</p>
                      <p className="font-semibold text-gray-900">{elemento.material}</p>
                    </div>
                  )}
                  {elemento.unidad_abrev && (
                    <div>
                      <p className="text-gray-500">Unidad</p>
                      <p className="font-semibold text-gray-900">{elemento.unidad_abrev}</p>
                    </div>
                  )}
                  {elemento.ubicacion && (
                    <div>
                      <p className="text-gray-500">Ubicación</p>
                      <p className="font-semibold text-gray-900">{elemento.ubicacion}</p>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {elemento.descripcion && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {elemento.descripcion}
                    </p>
                  </div>
                )}

                {/* Series info */}
                {elemento.requiere_series && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Series registradas</span>
                      <span className="text-lg font-bold text-blue-600">
                        {elemento.total_series || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer - Acciones */}
              <div className="px-6 py-4 bg-gray-50 border-t flex gap-2">
                <button
                  onClick={() => handleOpenEditModal(elemento)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteElemento(elemento.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Estado vacío */}
        {elementos.data.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-7xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No hay elementos en el inventario
            </h3>
            <p className="text-gray-500 mb-6">
              Comienza agregando tu primer elemento
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Primer Elemento
            </button>
          </div>
        )}

        {/* Modales */}
        <CreateElementoModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateElemento}
          categorias={categorias.data}
          materiales={materiales}
          unidades={unidades}
          loading={elementos.loading}
        />

        <EditElementoModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedElemento(null);
          }}
          onSubmit={handleUpdateElemento}
          elemento={selectedElemento}
          categorias={categorias.data}
          materiales={materiales}
          unidades={unidades}
          loading={elementos.loading}
        />

        <MovimientoModal
          isOpen={showMovimientoModal}
          onClose={() => setShowMovimientoModal(false)}
          onSubmit={handleCreateMovimiento}
          elementos={elementos.data}
          loading={lotes.loading}
        />
      </div>
    </div>
  );
};

export default Inventario;