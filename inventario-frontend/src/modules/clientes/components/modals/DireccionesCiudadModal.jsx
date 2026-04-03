// ============================================
// COMPONENTE: DireccionesCiudadModal
// Modal para gestionar direcciones/ubicaciones de una ciudad
// ============================================

import { useState } from 'react'
import { Plus, Trash2, MapPin, Pencil, X, Check, Navigation } from 'lucide-react'
import Modal from '@shared/components/Modal'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'
import { useGetUbicacionesPorCiudad, useCreateUbicacion, useUpdateUbicacion, useDeleteUbicacion } from '@inventario/hooks/useUbicaciones'
import { useTranslation } from 'react-i18next'

// Tipos de lugar para eventos
const TIPOS_LUGAR = [
  { id: 'finca', nombre: 'Finca', emoji: '🏡' },
  { id: 'hacienda', nombre: 'Hacienda', emoji: '🏘️' },
  { id: 'jardin', nombre: 'Jardin', emoji: '🌿' },
  { id: 'club', nombre: 'Club', emoji: '🏛️' },
  { id: 'hotel', nombre: 'Hotel', emoji: '🏨' },
  { id: 'playa', nombre: 'Playa', emoji: '🏖️' },
  { id: 'parque', nombre: 'Parque', emoji: '🌳' },
  { id: 'residencia', nombre: 'Residencia', emoji: '🏠' },
  { id: 'evento', nombre: 'Salon de eventos', emoji: '🎪' },
  { id: 'otro', nombre: 'Otro', emoji: '📍' }
]

const FORM_INICIAL = {
  nombre: '',
  tipo: 'evento',
  direccion: '',
  observaciones: ''
}

/**
 * DireccionesCiudadModal
 * Gestiona direcciones/ubicaciones frecuentes para una ciudad
 */
export default function DireccionesCiudadModal({ isOpen, onClose, ciudad }) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState(FORM_INICIAL)
  const [editingId, setEditingId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [errors, setErrors] = useState({})

  // Hooks
  const { ubicaciones, isLoading } = useGetUbicacionesPorCiudad(ciudad?.id)
  const { mutateAsync: crearUbicacion, isLoading: isCreating } = useCreateUbicacion()
  const { mutateAsync: actualizarUbicacion, isLoading: isUpdating } = useUpdateUbicacion()
  const { mutateAsync: eliminarUbicacion, isLoading: isDeleting } = useDeleteUbicacion()

  const isSaving = isCreating || isUpdating

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenCrear = () => {
    setEditingId(null)
    setFormData(FORM_INICIAL)
    setErrors({})
    setMostrarForm(true)
  }

  const handleOpenEditar = (ubicacion) => {
    setEditingId(ubicacion.id)
    setFormData({
      nombre: ubicacion.nombre || '',
      tipo: ubicacion.tipo || 'evento',
      direccion: ubicacion.direccion || '',
      observaciones: ubicacion.observaciones || ''
    })
    setErrors({})
    setMostrarForm(true)
  }

  const handleCancelarForm = () => {
    setMostrarForm(false)
    setEditingId(null)
    setFormData(FORM_INICIAL)
    setErrors({})
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const dataToSend = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo,
        direccion: formData.direccion.trim() || null,
        ciudad_id: ciudad.id,
        observaciones: formData.observaciones.trim() || null,
        activo: true,
        es_principal: false
      }

      if (editingId) {
        await actualizarUbicacion({ id: editingId, data: dataToSend })
      } else {
        await crearUbicacion(dataToSend)
      }
      handleCancelarForm()
    } catch (error) {
      const mensaje = error.response?.data?.message || 'Error al guardar'
      setErrors({ submit: mensaje })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta direccion?')) return
    try {
      await eliminarUbicacion(id)
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar')
    }
  }

  const getTipoInfo = (tipo) => {
    return TIPOS_LUGAR.find(t => t.id === tipo) || TIPOS_LUGAR[TIPOS_LUGAR.length - 1]
  }

  if (!ciudad) return null

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Direcciones - ${ciudad.nombre}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Header con contador y boton agregar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-600">
              {ubicaciones.length} direccion{ubicaciones.length !== 1 ? 'es' : ''} registrada{ubicaciones.length !== 1 ? 's' : ''}
            </span>
          </div>
          {!mostrarForm && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCrear}
            >
              Agregar direccion
            </Button>
          )}
        </div>

        {/* Formulario de crear/editar */}
        {mostrarForm && (
          <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-blue-800">
                {editingId ? 'Editar direccion' : 'Nueva direccion'}
              </h4>
              <button
                type="button"
                onClick={handleCancelarForm}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errors.submit && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors.submit}</p>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nombre del lugar *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Finca La Esperanza, Hotel Dann Carlton..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre ? 'border-red-300' : 'border-slate-300'}`}
                disabled={isSaving}
              />
              {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
            </div>

            {/* Tipo de lugar */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tipo de lugar
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS_LUGAR.map(tipo => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: tipo.id })}
                    disabled={isSaving}
                    className={`
                      px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1
                      ${formData.tipo === tipo.id
                        ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span>{tipo.emoji}</span>
                    {tipo.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Direccion */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Direccion
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Ej: Km 5 Via Las Palmas, Calle 10 #43-20..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Indicaciones de acceso, contacto del lugar..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCancelarForm}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                icon={isSaving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
              >
                {isSaving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Agregar')}
              </Button>
            </div>
          </form>
        )}

        {/* Lista de direcciones */}
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Spinner size="md" text="Cargando direcciones..." />
          </div>
        ) : ubicaciones.length === 0 && !mostrarForm ? (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Navigation className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No hay direcciones para {ciudad.nombre}</p>
            <p className="text-xs text-slate-500 mt-1">Agrega lugares frecuentes para agilizar las cotizaciones</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {ubicaciones.map(ubicacion => {
              const tipoInfo = getTipoInfo(ubicacion.tipo)
              return (
                <div
                  key={ubicacion.id}
                  className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors group"
                >
                  {/* Icono tipo */}
                  <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg text-lg">
                    {tipoInfo.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 text-sm truncate">
                        {ubicacion.nombre}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full flex-shrink-0">
                        {tipoInfo.nombre}
                      </span>
                    </div>
                    {ubicacion.direccion && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {ubicacion.direccion}
                      </p>
                    )}
                    {ubicacion.observaciones && (
                      <p className="text-xs text-slate-400 mt-0.5 italic truncate">
                        {ubicacion.observaciones}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditar(ubicacion)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                      disabled={isSaving || isDeleting}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ubicacion.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                      disabled={isSaving || isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
