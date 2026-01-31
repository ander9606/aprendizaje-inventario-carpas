// ============================================
// PÁGINA: Gestión de Descuentos
// CRUD de descuentos predefinidos
// ============================================

import { useState } from 'react'
import { Tag, Plus, Edit, Trash2, Percent, DollarSign, Check, X } from 'lucide-react'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import Modal from '../components/common/Modal'
import {
  useGetDescuentos,
  useCreateDescuento,
  useUpdateDescuento,
  useDeleteDescuento
} from '../hooks'

const DescuentosPage = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'porcentaje',
    valor: ''
  })

  // Hooks
  const { data: descuentos, isLoading } = useGetDescuentos(true) // Incluir inactivos
  const createMutation = useCreateDescuento()
  const updateMutation = useUpdateDescuento()
  const deleteMutation = useDeleteDescuento()

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // Handlers
  const handleNuevo = () => {
    setFormData({ nombre: '', descripcion: '', tipo: 'porcentaje', valor: '' })
    setEditando(null)
    setModalOpen(true)
  }

  const handleEditar = (descuento) => {
    setFormData({
      nombre: descuento.nombre,
      descripcion: descuento.descripcion || '',
      tipo: descuento.tipo,
      valor: descuento.valor
    })
    setEditando(descuento)
    setModalOpen(true)
  }

  const handleEliminar = async (id) => {
    if (confirm('¿Desactivar este descuento? Podrá reactivarlo más tarde.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleToggleActivo = async (descuento) => {
    await updateMutation.mutateAsync({
      id: descuento.id,
      data: { ...descuento, activo: !descuento.activo }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor)
    }

    if (editando) {
      await updateMutation.mutateAsync({ id: editando.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }

    setModalOpen(false)
    setEditando(null)
    setFormData({ nombre: '', descripcion: '', tipo: 'porcentaje', valor: '' })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-7 h-7 text-blue-600" />
            Descuentos
          </h1>
          <p className="text-slate-500 mt-1">
            Administra los descuentos predefinidos para cotizaciones
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleNuevo}
        >
          Nuevo Descuento
        </Button>
      </div>

      {/* Lista de descuentos */}
      {isLoading ? (
        <div className="py-12">
          <Spinner size="lg" text="Cargando descuentos..." />
        </div>
      ) : descuentos?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            No hay descuentos configurados
          </h3>
          <p className="text-slate-500 mb-4">
            Crea descuentos predefinidos para aplicarlos fácilmente a las cotizaciones
          </p>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleNuevo}
          >
            Crear primer descuento
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Nombre
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  Descripción
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700">
                  Tipo
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  Valor
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700">
                  Estado
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {descuentos?.map((descuento) => (
                <tr
                  key={descuento.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${
                    !descuento.activo ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-900">
                        {descuento.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {descuento.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${descuento.tipo === 'porcentaje'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                      }
                    `}>
                      {descuento.tipo === 'porcentaje' ? (
                        <><Percent className="w-3 h-3" /> Porcentaje</>
                      ) : (
                        <><DollarSign className="w-3 h-3" /> Fijo</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">
                    {descuento.tipo === 'porcentaje'
                      ? `${descuento.valor}%`
                      : formatearMoneda(descuento.valor)
                    }
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActivo(descuento)}
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors
                        ${descuento.activo
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }
                      `}
                    >
                      {descuento.activo ? (
                        <><Check className="w-3 h-3" /> Activo</>
                      ) : (
                        <><X className="w-3 h-3" /> Inactivo</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditar(descuento)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(descuento.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de crear/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Descuento' : 'Nuevo Descuento'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Descuento cliente frecuente"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción opcional"
            />
          </div>

          {/* Tipo y Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                  placeholder={formData.tipo === 'porcentaje' ? '10' : '50000'}
                  min="0"
                  step={formData.tipo === 'porcentaje' ? '1' : '1000'}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {formData.tipo === 'porcentaje' ? '%' : '$'}
                </span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editando ? 'Guardar cambios' : 'Crear descuento'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DescuentosPage
