// ============================================
// COMPONENTE: ComponentesModal
// Modal para ver y gestionar componentes de un elemento compuesto
// ============================================

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Package,
  Link2,
  Star,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Check,
  X as CloseIcon
} from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Badge from '../common/Badge'
import Spinner from '../common/Spinner'
import {
  useGetComponentes,
  useAddComponente,
  useDeleteComponente,
  useUpdateComponente
} from '../../hooks/UseElementosCompuestos'
import { useGetCategorias } from '../../hooks/Usecategorias'

/**
 * COMPONENTE: ComponentesModal
 *
 * Modal para gestionar los componentes de un elemento compuesto
 *
 * Tipos de componentes:
 * - FIJO: Siempre incluido, no afecta precio
 * - ALTERNATIVA: Obligatorio, combinable con otras opciones del grupo
 * - ADICIONAL: Opcional, siempre suma al precio
 */
const ComponentesModal = ({
  isOpen,
  onClose,
  elemento,
  onSuccess
}) => {
  // ============================================
  // HOOKS
  // ============================================

  const {
    componentes,
    isLoading: loadingComponentes,
    refetch: refetchComponentes
  } = useGetComponentes(elemento?.id)

  const { categorias } = useGetCategorias()
  const { addComponente, isLoading: isAdding } = useAddComponente()
  const { deleteComponente, isLoading: isDeleting } = useDeleteComponente()
  const { updateComponente, isLoading: isUpdating } = useUpdateComponente()

  // ============================================
  // STATE
  // ============================================

  const [activeTab, setActiveTab] = useState('fijos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'fijo',
    elemento_id: '',
    cantidad: 1,
    grupo: '',
    es_default: false,
    precio_adicional: 0
  })
  const [expandedGroups, setExpandedGroups] = useState({})

  // ============================================
  // COMPUTED: Precio calculado
  // ============================================

  const precioCalculado = useMemo(() => {
    if (!elemento) return 0

    let precio = elemento.precio_base || 0

    // Los componentes fijos no afectan el precio
    // Los adicionales siempre suman
    componentes.adicionales?.forEach(comp => {
      precio += (comp.precio_adicional || 0) * (comp.cantidad || 1)
    })

    return precio
  }, [elemento, componentes])

  // ============================================
  // COMPUTED: Grupos de alternativas
  // ============================================

  const gruposAlternativas = useMemo(() => {
    const grupos = {}
    componentes.alternativas?.forEach(comp => {
      const grupo = comp.grupo || 'Sin grupo'
      if (!grupos[grupo]) {
        grupos[grupo] = {
          nombre: grupo,
          cantidad_requerida: comp.cantidad_requerida || 0,
          opciones: []
        }
      }
      grupos[grupo].opciones.push(comp)
    })
    return grupos
  }, [componentes.alternativas])

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddComponente = async () => {
    if (!formData.elemento_id) return

    try {
      await addComponente({
        elementoId: elemento.id,
        componente: {
          ...formData,
          elemento_inventario_id: parseInt(formData.elemento_id),
          cantidad: parseInt(formData.cantidad),
          precio_adicional: parseFloat(formData.precio_adicional) || 0
        }
      })

      setFormData({
        tipo: 'fijo',
        elemento_id: '',
        cantidad: 1,
        grupo: '',
        es_default: false,
        precio_adicional: 0
      })
      setShowAddForm(false)
      refetchComponentes()
      onSuccess?.()
    } catch (error) {
      console.error('Error al agregar componente:', error)
      alert('Error al agregar el componente')
    }
  }

  const handleDeleteComponente = async (componenteId) => {
    if (!window.confirm('¿Eliminar este componente?')) return

    try {
      await deleteComponente({
        elementoId: elemento.id,
        componenteId
      })
      refetchComponentes()
      onSuccess?.()
    } catch (error) {
      console.error('Error al eliminar componente:', error)
      alert('Error al eliminar el componente')
    }
  }

  const toggleGroup = (grupo) => {
    setExpandedGroups(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }))
  }

  // ============================================
  // RENDER: Si no hay elemento
  // ============================================

  if (!elemento) return null

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Link2 className="w-5 h-5 text-purple-600" />
          <span>Componentes de {elemento.nombre}</span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Resumen de precio */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Precio base del producto</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(elemento.precio_base || 0).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Total con adicionales</p>
              <p className="text-2xl font-bold text-purple-600">
                ${precioCalculado.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loadingComponentes ? (
          <div className="py-12 flex justify-center">
            <Spinner size="lg" text="Cargando componentes..." />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('fijos')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'fijos'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Fijos ({componentes.fijos?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('alternativas')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'alternativas'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Alternativas ({componentes.alternativas?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('adicionales')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'adicionales'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Adicionales ({componentes.adicionales?.length || 0})
              </button>
            </div>

            {/* Contenido de tabs */}
            <div className="min-h-[300px]">
              {/* Tab: Fijos */}
              {activeTab === 'fijos' && (
                <ComponentesList
                  componentes={componentes.fijos || []}
                  tipo="fijo"
                  onDelete={handleDeleteComponente}
                  isDeleting={isDeleting}
                />
              )}

              {/* Tab: Alternativas */}
              {activeTab === 'alternativas' && (
                <div className="space-y-4">
                  {Object.keys(gruposAlternativas).length === 0 ? (
                    <EmptyComponentes tipo="alternativa" />
                  ) : (
                    Object.entries(gruposAlternativas).map(([grupoNombre, grupo]) => (
                      <div key={grupoNombre} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* Header del grupo */}
                        <button
                          onClick={() => toggleGroup(grupoNombre)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {expandedGroups[grupoNombre] ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-medium text-slate-900">{grupoNombre}</span>
                            <Badge variant="info" size="sm">
                              {grupo.opciones.length} opciones
                            </Badge>
                          </div>
                          <span className="text-sm text-slate-500">
                            Requiere: {grupo.cantidad_requerida || '?'} unidades
                          </span>
                        </button>

                        {/* Opciones del grupo */}
                        {expandedGroups[grupoNombre] !== false && (
                          <div className="divide-y divide-slate-100">
                            {grupo.opciones.map(comp => (
                              <ComponenteItem
                                key={comp.id}
                                componente={comp}
                                showDefault
                                showPrecio
                                onDelete={() => handleDeleteComponente(comp.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Adicionales */}
              {activeTab === 'adicionales' && (
                <ComponentesList
                  componentes={componentes.adicionales || []}
                  tipo="adicional"
                  showPrecio
                  onDelete={handleDeleteComponente}
                  isDeleting={isDeleting}
                />
              )}
            </div>

            {/* Formulario para agregar componente */}
            {showAddForm ? (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <h4 className="font-medium text-slate-900">Agregar nuevo componente</h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tipo de componente */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="fijo">Fijo</option>
                      <option value="alternativa">Alternativa</option>
                      <option value="adicional">Adicional</option>
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidad}
                      onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Grupo (solo para alternativas) */}
                {formData.tipo === 'alternativa' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Grupo
                      </label>
                      <input
                        type="text"
                        value={formData.grupo}
                        onChange={(e) => setFormData(prev => ({ ...prev, grupo: e.target.value }))}
                        placeholder="Ej: Anclajes, Postes..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="es_default"
                        checked={formData.es_default}
                        onChange={(e) => setFormData(prev => ({ ...prev, es_default: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <label htmlFor="es_default" className="text-sm text-slate-700">
                        Opción por defecto
                      </label>
                    </div>
                  </div>
                )}

                {/* Precio adicional (alternativas y adicionales) */}
                {(formData.tipo === 'alternativa' || formData.tipo === 'adicional') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio adicional
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.precio_adicional}
                        onChange={(e) => setFormData(prev => ({ ...prev, precio_adicional: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formData.tipo === 'alternativa'
                        ? 'La opción por defecto debe tener precio $0'
                        : 'Este valor se sumará al precio base'}
                    </p>
                  </div>
                )}

                {/* Elemento del inventario */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Elemento del inventario *
                  </label>
                  <select
                    value={formData.elemento_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, elemento_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar elemento...</option>
                    {/* Aquí irían los elementos del inventario */}
                    <option value="1">Elemento de ejemplo 1</option>
                    <option value="2">Elemento de ejemplo 2</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Selecciona un elemento del inventario para agregar como componente
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    disabled={isAdding}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddComponente}
                    loading={isAdding}
                    disabled={!formData.elemento_id || isAdding}
                  >
                    Agregar Componente
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddForm(true)}
                fullWidth
              >
                Agregar Componente
              </Button>
            )}
          </>
        )}

        {/* Footer */}
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

// ============================================
// COMPONENTE AUXILIAR: Lista de componentes
// ============================================

function ComponentesList({ componentes, tipo, showPrecio, onDelete, isDeleting }) {
  if (componentes.length === 0) {
    return <EmptyComponentes tipo={tipo} />
  }

  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
      {componentes.map(comp => (
        <ComponenteItem
          key={comp.id}
          componente={comp}
          showPrecio={showPrecio}
          onDelete={() => onDelete(comp.id)}
        />
      ))}
    </div>
  )
}

// ============================================
// COMPONENTE AUXILIAR: Item de componente
// ============================================

function ComponenteItem({ componente, showDefault, showPrecio, onDelete }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Package className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">
              {componente.elemento_nombre || `Elemento #${componente.elemento_inventario_id}`}
            </span>
            {showDefault && componente.es_default && (
              <Badge variant="success" size="sm">
                <Star className="w-3 h-3 mr-1" />
                Default
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Cantidad: {componente.cantidad}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {showPrecio && (
          <div className="text-right">
            <p className={`font-medium ${componente.precio_adicional > 0 ? 'text-green-600' : 'text-slate-500'}`}>
              {componente.precio_adicional > 0
                ? `+$${componente.precio_adicional.toLocaleString()}`
                : 'Incluido'
              }
            </p>
          </div>
        )}
        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE AUXILIAR: Estado vacío
// ============================================

function EmptyComponentes({ tipo }) {
  const mensajes = {
    fijo: {
      titulo: 'Sin componentes fijos',
      descripcion: 'Los componentes fijos siempre se incluyen en el producto'
    },
    alternativa: {
      titulo: 'Sin alternativas',
      descripcion: 'Las alternativas permiten opciones combinables al cotizar'
    },
    adicional: {
      titulo: 'Sin adicionales',
      descripcion: 'Los adicionales son opcionales y suman al precio base'
    }
  }

  const msg = mensajes[tipo] || mensajes.fijo

  return (
    <div className="py-12 text-center">
      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="font-medium text-slate-700">{msg.titulo}</p>
      <p className="text-sm text-slate-500">{msg.descripcion}</p>
    </div>
  )
}

export default ComponentesModal
