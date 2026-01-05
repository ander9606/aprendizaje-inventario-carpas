// ============================================
// COMPONENTE: TarifaFormModal
// Modal para crear/editar tarifas de transporte
// ============================================

import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useCreateTarifa, useUpdateTarifa } from '../../hooks/UseTarifasTransporte'
import { useGetCiudadesActivas } from '../../hooks/UseCiudades'
import { CATEGORIAS_CAMION } from '../../api/apiTarifasTransporte'

/**
 * COMPONENTE: TarifaFormModal
 */
const TarifaFormModal = ({
  isOpen,
  onClose,
  mode = 'crear',
  tarifa = null
}) => {

  // ============================================
  // ESTADO LOCAL DEL FORMULARIO
  // ============================================

  const [formData, setFormData] = useState({
    tipo_camion: '',
    ciudad_id: '',
    precio: '',
    activo: true
  })

  const [errors, setErrors] = useState({})

  // ============================================
  // HOOKS DE API
  // ============================================

  const { ciudades, isLoading: loadingCiudades } = useGetCiudadesActivas()
  const { mutateAsync: createTarifa, isLoading: isCreating } = useCreateTarifa()
  const { mutateAsync: updateTarifa, isLoading: isUpdating } = useUpdateTarifa()

  const isLoading = isCreating || isUpdating

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (mode === 'editar' && tarifa) {
      setFormData({
        tipo_camion: tarifa.tipo_camion || '',
        ciudad_id: tarifa.ciudad_id || '',
        precio: tarifa.precio || '',
        activo: tarifa.activo !== undefined ? tarifa.activo : true
      })
    } else {
      setFormData({
        tipo_camion: '',
        ciudad_id: '',
        precio: '',
        activo: true
      })
    }
    setErrors({})
  }, [mode, tarifa, isOpen])

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.tipo_camion) {
      newErrors.tipo_camion = 'Seleccione un tipo de camión'
    }

    if (!formData.ciudad_id) {
      newErrors.ciudad_id = 'Seleccione una ciudad'
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    const dataToSend = {
      tipo_camion: formData.tipo_camion,
      ciudad_id: parseInt(formData.ciudad_id),
      precio: parseFloat(formData.precio),
      activo: formData.activo
    }

    try {
      if (mode === 'crear') {
        await createTarifa(dataToSend)
      } else {
        await updateTarifa({ id: tarifa.id, data: dataToSend })
      }
      onClose()
    } catch (error) {
      console.error('Error al guardar tarifa:', error)
      const mensajeError = error.response?.data?.message || 'Error al guardar la tarifa'
      setErrors({ submit: mensajeError })
    }
  }

  const handleClose = () => {
    if (!isLoading) onClose()
  }

  const formatearPrecio = (valor) => {
    const numero = valor.replace(/[^\d]/g, '')
    return numero ? new Intl.NumberFormat('es-CO').format(numero) : ''
  }

  const handlePrecioChange = (e) => {
    const valorSinFormato = e.target.value.replace(/[^\d]/g, '')
    setFormData(prev => ({ ...prev, precio: valorSinFormato }))
    if (errors.precio) {
      setErrors(prev => ({ ...prev, precio: '' }))
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'crear' ? 'Nueva Tarifa de Transporte' : 'Editar Tarifa'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ERROR GENERAL */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{errors.submit}</p>
          </div>
        )}

        {/* TIPO DE CAMIÓN */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tipo de Camión *
          </label>
          <select
            name="tipo_camion"
            value={formData.tipo_camion}
            onChange={handleChange}
            disabled={isLoading}
            className={`
              w-full px-4 py-2.5 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-slate-100 disabled:cursor-not-allowed
              ${errors.tipo_camion ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
          >
            <option value="">Seleccionar tipo...</option>
            {CATEGORIAS_CAMION.map(cat => (
              <option key={cat.id} value={cat.nombre}>
                {cat.nombre} - {cat.descripcion}
              </option>
            ))}
          </select>
          {errors.tipo_camion && (
            <p className="mt-1 text-sm text-red-600">{errors.tipo_camion}</p>
          )}
        </div>

        {/* CIUDAD */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ciudad *
          </label>
          <select
            name="ciudad_id"
            value={formData.ciudad_id}
            onChange={handleChange}
            disabled={isLoading || loadingCiudades}
            className={`
              w-full px-4 py-2.5 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-slate-100 disabled:cursor-not-allowed
              ${errors.ciudad_id ? 'border-red-300 bg-red-50' : 'border-slate-300'}
            `}
          >
            <option value="">
              {loadingCiudades ? 'Cargando ciudades...' : 'Seleccionar ciudad...'}
            </option>
            {ciudades.map(ciudad => (
              <option key={ciudad.id} value={ciudad.id}>
                {ciudad.nombre}{ciudad.departamento ? ` (${ciudad.departamento})` : ''}
              </option>
            ))}
          </select>
          {errors.ciudad_id && (
            <p className="mt-1 text-sm text-red-600">{errors.ciudad_id}</p>
          )}
          {ciudades.length === 0 && !loadingCiudades && (
            <p className="mt-1 text-sm text-amber-600">
              No hay ciudades registradas. Crea una en Configuración {'>'} Ciudades.
            </p>
          )}
        </div>

        {/* PRECIO */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Precio *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              $
            </span>
            <input
              type="text"
              value={formatearPrecio(formData.precio.toString())}
              onChange={handlePrecioChange}
              placeholder="0"
              disabled={isLoading}
              className={`
                w-full pl-8 pr-4 py-2.5 border rounded-lg text-right
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-slate-100 disabled:cursor-not-allowed
                ${errors.precio ? 'border-red-300 bg-red-50' : 'border-slate-300'}
              `}
            />
          </div>
          {errors.precio && (
            <p className="mt-1 text-sm text-red-600">{errors.precio}</p>
          )}
        </div>

        {/* ESTADO */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="activo"
            id="activo"
            checked={formData.activo}
            onChange={handleChange}
            disabled={isLoading}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="activo" className="text-sm font-medium text-slate-700">
            Tarifa activa
          </label>
        </div>

        {/* BOTONES */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            fullWidth
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            fullWidth
          >
            {mode === 'crear' ? 'Crear Tarifa' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default TarifaFormModal
