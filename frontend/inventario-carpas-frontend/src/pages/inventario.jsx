// frontend/src/pages/inventario.jsx
// VERSIÓN REFACTORIZADA Y MODULARIZADA

import React, { useState, useMemo } from 'react';
import { useInventario } from '../hooks';
import { useMateriales } from '../hooks/useMateriales';
import { useUnidades } from '../hooks/useUnidades';

// Componentes modulares
import InventoryHeader from '../components/inventario/InventoryHeader';
import InventoryStats from '../components/inventario/InventoryStats';
import InventoryFilters from '../components/inventario/InventoryFilters';
import InventoryGrid from '../components/inventario/InventoryGrid';
import Notifications from '../components/common/Notifications';

// Modales
import CreateElementoModal from '../components/common/modals/CreateElementoModal';
import EditElementoModal from '../components/common/modals/EditElementoModal';
import MovimientoModal from '../components/common/modals/MovimientoModal';

/**
 * Componente principal de Inventario
 * Ahora modularizado y más limpio
 */
const Inventario = () => {
  // ============================================
  // ESTADOS LOCALES
  // ============================================
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [selectedElemento, setSelectedElemento] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');

  // ============================================
  // HOOKS
  // ============================================
  
  const {
    elementos,
    lotes,
    categorias,
    loading,
    errors,
    successMessages,
    refreshAll,
    clearAllMessages
  } = useInventario({
    fetchElementos: true,
    fetchLotes: true,
    fetchCategorias: true,
    conSeries: true
  });

  const { materiales } = useMateriales(true);
  const { unidades } = useUnidades(true);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  /**
   * Elementos filtrados
   */
  const elementosFiltrados = useMemo(() => {
    let resultado = elementos.data;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(elem => 
        elem.nombre.toLowerCase().includes(term) ||
        elem.descripcion?.toLowerCase().includes(term) ||
        elem.categoria?.toLowerCase().includes(term) ||
        elem.ubicacion?.toLowerCase().includes(term)
      );
    }

    if (selectedCategoria) {
      resultado = resultado.filter(elem => 
        elem.categoria_id === parseInt(selectedCategoria)
      );
    }

    if (selectedEstado) {
      resultado = resultado.filter(elem => elem.estado === selectedEstado);
    }

    if (selectedTipo === 'series') {
      resultado = resultado.filter(elem => elem.requiere_series === true);
    } else if (selectedTipo === 'lote') {
      resultado = resultado.filter(elem => elem.requiere_series === false);
    }

    return resultado;
  }, [elementos.data, searchTerm, selectedCategoria, selectedEstado, selectedTipo]);

  /**
   * Estadísticas calculadas
   */
  const estadisticas = useMemo(() => {
    const total = elementosFiltrados.length;
    const conSeries = elementosFiltrados.filter(e => e.requiere_series).length;
    const sinSeries = elementosFiltrados.filter(e => !e.requiere_series).length;
    
    const estados = {
      bueno: elementosFiltrados.filter(e => e.estado === 'bueno').length,
      regular: elementosFiltrados.filter(e => e.estado === 'regular').length,
      malo: elementosFiltrados.filter(e => e.estado === 'malo').length,
      en_reparacion: elementosFiltrados.filter(e => e.estado === 'en_reparacion').length,
    };

    return { total, conSeries, sinSeries, estados };
  }, [elementosFiltrados]);

  /**
   * Verificar si hay filtros activos
   */
  const hasActiveFilters = searchTerm || selectedCategoria || selectedEstado || selectedTipo;

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleCreateElemento = async (formData) => {
    await elementos.createElemento(formData);
    setShowCreateModal(false);
  };

  const handleUpdateElemento = async (id, formData) => {
    await elementos.updateElemento(id, formData);
    setShowEditModal(false);
    setSelectedElemento(null);
  };

  const handleDeleteElemento = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este elemento?')) {
      await elementos.deleteElemento(id);
    }
  };

  const handleCreateMovimiento = async (movimientoData) => {
    await lotes.createMovimientoLote(movimientoData);
    setShowMovimientoModal(false);
  };

  const handleOpenEditModal = (elemento) => {
    setSelectedElemento(elemento);
    setShowEditModal(true);
  };

  const handleViewSeries = (elemento) => {
    alert(`Ver series de: ${elemento.nombre}\nTotal: ${elemento.total_series || 0} series`);
  };

  const handleLimpiarFiltros = () => {
    setSearchTerm('');
    setSelectedCategoria('');
    setSelectedEstado('');
    setSelectedTipo('');
  };

  // ============================================
  // LOADING STATE
  // ============================================
  
  if (loading && elementos.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
        </div>
        <p className="text-lg text-gray-600 mt-4 font-medium">Cargando inventario...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Notificaciones */}
        <Notifications 
          errors={errors}
          successMessages={successMessages}
          onClear={clearAllMessages}
        />

        {/* Header */}
        <InventoryHeader 
          estadisticas={estadisticas}
          onCreateElemento={() => setShowCreateModal(true)}
          onCreateMovimiento={() => setShowMovimientoModal(true)}
          onRefresh={refreshAll}
          loading={loading}
        />

        {/* Estadísticas */}
        <InventoryStats estados={estadisticas.estados} />

        {/* Filtros */}
        <InventoryFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategoria={selectedCategoria}
          onCategoriaChange={setSelectedCategoria}
          selectedEstado={selectedEstado}
          onEstadoChange={setSelectedEstado}
          selectedTipo={selectedTipo}
          onTipoChange={setSelectedTipo}
          categorias={categorias.data}
          onLimpiar={handleLimpiarFiltros}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Grid de Elementos */}
        <InventoryGrid 
          elementos={elementosFiltrados}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteElemento}
          onViewSeries={handleViewSeries}
          hasActiveFilters={hasActiveFilters}
          onCreateElemento={() => setShowCreateModal(true)}
        />

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
