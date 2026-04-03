// ============================================
// PÁGINA: Gestión de Descuentos
// CRUD de descuentos predefinidos
// ============================================

import { useState } from 'react'
import { Tag, Plus, Edit, Trash2, Percent, DollarSign, Check, X } from 'lucide-react'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import Modal from '@shared/components/Modal'
import { useTranslation } from 'react-i18next'
import {
  useGetDescuentos,
  useCreateDescuento,
  useUpdateDescuento,
  useDeleteDescuento
} from '../hooks/descuentos'

const DescuentosPage = () => {
  const { t } = useTranslation()
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
    if (confirm(t('rentals.deactivateDiscountConfirm'))) {
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
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              {t('rentals.discounts')}
            </h1>
            <p className="text-slate-500 mt-1">
              {t('rentals.discountsDescription')}
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleNuevo}
          >
            {t('rentals.newDiscount')}
          </Button>
        </div>
      </div>

      {/* Lista de descuentos */}
      {isLoading ? (
        <div className="py-12">
          <Spinner size="lg" text={t('rentals.loadingDiscounts')} />
        </div>
      ) : descuentos?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            {t('rentals.noDiscountsConfigured')}
          </h3>
          <p className="text-slate-500 mb-4">
            {t('rentals.createDiscountsHint')}
          </p>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={handleNuevo}
          >
            {t('rentals.createFirstDiscount')}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  {t('common.name')}
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                  {t('common.description')}
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700">
                  {t('common.type')}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  {t('common.total')}
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700">
                  {t('common.status')}
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                  {t('common.actions')}
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
                        <><Percent className="w-3 h-3" /> {t('rentals.percentage')}</>
                      ) : (
                        <><DollarSign className="w-3 h-3" /> {t('rentals.fixed')}</>
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
                        <><Check className="w-3 h-3" /> {t('common.active')}</>
                      ) : (
                        <><X className="w-3 h-3" /> {t('common.inactive')}</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditar(descuento)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(descuento.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
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
        title={editando ? t('rentals.editDiscount') : t('rentals.newDiscount')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('common.name')} *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('rentals.discountNamePlaceholder')}
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('common.description')}
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('rentals.optionalDescription')}
            />
          </div>

          {/* Tipo y Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('common.type')} *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="porcentaje">{t('rentals.percentageOption')}</option>
                <option value="fijo">{t('rentals.fixedAmountOption')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('rentals.value')} *
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
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editando ? t('rentals.saveChanges') : t('rentals.createDiscount')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DescuentosPage
