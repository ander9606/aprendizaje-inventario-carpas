// ============================================
// FORMULARIO: ELEMENTO
// Modal para crear o editar un elemento
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Emojipicker from '../common/Emojipicker'
import { useCreateElemento, useUpdateElemento } from '../../hooks/Useelementos'

/**
 * ============================================
 * COMPONENTE: ElementoFormModal
 * ============================================
 *
 * Modal para crear o editar un elemento.
 *
 * MODOS:
 * 1. CREAR: Si NO se pasa 'elemento' prop
 * 2. EDITAR: Si se pasa 'elemento' con datos existentes
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {function} onSuccess - Función que se llama después de guardar exitosamente
 * @param {number} subcategoriaId - ID de la subcategoría (obligatorio para crear)
 * @param {Object} elemento - Elemento a editar (opcional, si no se pasa, es modo crear)
 *
 * @example
 * // CREAR NUEVO
 * <ElementoFormModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={handleSuccess}
 *   subcategoriaId={5}
 * />
 *
 * @example
 * // EDITAR EXISTENTE
 * <ElementoFormModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={handleSuccess}
 *   elemento={elementoExistente}
 * />
 */
function ElementoFormModal({
  isOpen,
  onClose,
  onSuccess,
  subcategoriaId,
  elemento = null // Si es null = crear, si tiene datos = editar
}) {
  // ============================================
  // 1. DETERMINAR MODO (Crear vs Editar)
  // ============================================

  /**
   * isEditMode: true si estamos editando, false si estamos creando
   *
   * LÓGICA:
   * Si 'elemento' tiene un ID, estamos editando
   */
  const isEditMode = elemento && elemento.id

  // ============================================
  // 2. ESTADOS DEL FORMULARIO
  // ============================================

  /**
   * formData: Objeto que guarda todos los valores del formulario
   *
   * CAMPOS:
   * - nombre: Nombre del elemento (ej: "Carpa Doite 3x3")
   * - descripcion: Descripción opcional
   * - icono: Emoji del elemento (ej: "🏕️")
   * - requiere_series: true = gestión por series, false = gestión por lotes
   * - precio_alquiler: Precio de alquiler por día (opcional)
   * - notas: Notas adicionales (opcional)
   */
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    icono: '📦',
    requiere_series: true,
    precio_alquiler: '',
    notas: ''
  })

  /**
   * errors: Objeto que guarda errores de validación
   * Ejemplo: { nombre: 'El nombre es obligatorio' }
   */
  const [errors, setErrors] = useState({})

  // ============================================
  // 3. HOOKS DE MUTATIONS (React Query)
  // ============================================

  /**
   * useCreateElemento: Mutation para crear elemento
   *
   * DEVUELVE:
   * - mutate: Función para ejecutar la creación
   * - isPending: true mientras se ejecuta
   * - isError: true si hubo error
   * - error: Objeto de error
   */
  const createElemento = useCreateElemento()

  /**
   * useUpdateElemento: Mutation para actualizar elemento
   *
   * Similar a create, pero para actualizar
   */
  const updateElemento = useUpdateElemento()

  /**
   * mutation: Selecciona la mutation correcta según el modo
   */
  const mutation = isEditMode ? updateElemento : createElemento

  // ============================================
  // 4. EFECTOS (useEffect)
  // ============================================

  /**
   * EFECTO: Cargar datos del elemento al abrir en modo edición
   *
   * ¿CUÁNDO SE EJECUTA?
   * - Al abrir el modal (isOpen cambia a true)
   * - Cuando cambia 'elemento'
   *
   * ¿QUÉ HACE?
   * Si estamos editando, carga los datos del elemento al formulario
   */
  useEffect(() => {
    if (isOpen && isEditMode) {
      // Cargar datos existentes al formulario
      setFormData({
        nombre: elemento.nombre || '',
        descripcion: elemento.descripcion || '',
        icono: elemento.icono || '📦',
        requiere_series: elemento.requiere_series ?? true,
        precio_alquiler: elemento.precio_alquiler || '',
        notas: elemento.notas || ''
      })
    } else if (isOpen && !isEditMode) {
      // Resetear formulario en modo crear
      setFormData({
        nombre: '',
        descripcion: '',
        icono: '📦',
        requiere_series: true,
        precio_alquiler: '',
        notas: ''
      })
    }

    // Limpiar errores al abrir
    setErrors({})
  }, [isOpen, elemento, isEditMode])

  // ============================================
  // 5. FUNCIONES DE VALIDACIÓN
  // ============================================

  /**
   * validateForm: Valida todos los campos del formulario
   *
   * @returns {boolean} - true si es válido, false si tiene errores
   *
   * REGLAS DE VALIDACIÓN:
   * - nombre: Obligatorio, mínimo 3 caracteres
   * - icono: Obligatorio
   * - precio_alquiler: Si se ingresa, debe ser número positivo
   */
  const validateForm = () => {
    const newErrors = {}

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres'
    }

    // Validar icono
    if (!formData.icono) {
      newErrors.icono = 'Selecciona un icono'
    }

    // Validar precio (opcional, pero si existe debe ser válido)
    if (formData.precio_alquiler) {
      const precio = parseFloat(formData.precio_alquiler)
      if (isNaN(precio) || precio < 0) {
        newErrors.precio_alquiler = 'Ingresa un precio válido'
      }
    }

    // Guardar errores en el estado
    setErrors(newErrors)

    // Retornar true si NO hay errores
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // 6. HANDLERS (Manejadores de eventos)
  // ============================================

  /**
   * handleInputChange: Maneja cambios en inputs de texto
   *
   * @param {Event} e - Evento del input
   *
   * ¿CÓMO FUNCIONA?
   * 1. Extrae el 'name' y 'value' del input
   * 2. Actualiza solo ese campo en formData
   * 3. Limpia el error de ese campo si existe
   *
   * EJEMPLO:
   * <input name="nombre" value={formData.nombre} onChange={handleInputChange} />
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Actualizar el campo en formData
    setFormData(prev => ({
      ...prev,      // Mantener los otros campos
      [name]: value // Actualizar solo este campo
    }))

    // Limpiar error de este campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  /**
   * handleCheckboxChange: Maneja cambios en checkboxes
   *
   * @param {Event} e - Evento del checkbox
   *
   * DIFERENCIA CON handleInputChange:
   * Los checkboxes usan 'checked' en lugar de 'value'
   */
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  /**
   * handleEmojiSelect: Maneja selección de emoji
   *
   * @param {string} emoji - El emoji seleccionado
   *
   * ¿QUÉ HACE?
   * Actualiza el campo 'icono' con el emoji seleccionado
   */
  const handleEmojiSelect = (emoji) => {
    setFormData(prev => ({
      ...prev,
      icono: emoji
    }))

    // Limpiar error del icono si existe
    if (errors.icono) {
      setErrors(prev => ({
        ...prev,
        icono: undefined
      }))
    }
  }

  /**
   * handleSubmit: Maneja el envío del formulario
   *
   * @param {Event} e - Evento del formulario
   *
   * FLUJO:
   * 1. Prevenir recarga de página
   * 2. Validar formulario
   * 3. Si es válido, preparar datos
   * 4. Ejecutar mutation (crear o actualizar)
   * 5. Manejar éxito o error
   */
  const handleSubmit = (e) => {
    e.preventDefault() // Evitar recarga de página

    // Validar formulario
    if (!validateForm()) {
      // Si hay errores, mostrar toast y no continuar
      toast.error('Por favor corrige los errores del formulario')
      return
    }

    // Preparar datos para enviar
    const dataToSend = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      icono: formData.icono,
      requiere_series: formData.requiere_series,
      precio_alquiler: formData.precio_alquiler
        ? parseFloat(formData.precio_alquiler)
        : null,
      notas: formData.notas.trim() || null
    }

    // Si estamos creando, agregar subcategoria_id
    if (!isEditMode) {
      dataToSend.subcategoria_id = subcategoriaId
    }

    // Ejecutar mutation
    if (isEditMode) {
      // ACTUALIZAR
      updateElemento.mutate(
        {
          id: elemento.id,
          data: dataToSend
        },
        {
          // Callbacks de éxito/error
          onSuccess: () => {
            toast.success('Elemento actualizado exitosamente')
            onSuccess() // Llamar callback del padre
            onClose()   // Cerrar modal
          },
          onError: (error) => {
            console.error('Error al actualizar:', error)
            toast.error(error.message || 'Error al actualizar elemento')
          }
        }
      )
    } else {
      // CREAR
      createElemento.mutate(dataToSend, {
        onSuccess: () => {
          toast.success('Elemento creado exitosamente')
          onSuccess()
          onClose()
        },
        onError: (error) => {
          console.error('Error al crear:', error)
          toast.error(error.message || 'Error al crear elemento')
        }
      })
    }
  }

  /**
   * handleCancel: Maneja el clic en cancelar
   *
   * ¿QUÉ HACE?
   * 1. Cierra el modal
   * 2. Resetea el formulario (los datos se resetean con useEffect)
   */
  const handleCancel = () => {
    onClose()
  }

  // ============================================
  // 7. RENDERIZADO
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Elemento' : 'Nuevo Elemento'}
      size="lg"
    >
      {/* ============================================
          FORMULARIO
          ============================================ */}
      <form onSubmit={handleSubmit}>

        {/* ============================================
            CAMPO: Nombre
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nombre del elemento *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ej: Carpa Doite 3x3"
            className={`
              w-full px-4 py-2 border rounded-lg
              focus:outline-none focus:ring-2
              ${errors.nombre
                ? 'border-red-300 focus:ring-red-500'
                : 'border-slate-300 focus:ring-blue-500'
              }
            `}
          />
          {/* Mostrar error si existe */}
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">
              {errors.nombre}
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Descripción (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            placeholder="Descripción detallada del elemento..."
            rows={3}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* ============================================
            CAMPO: Icono (Emoji Picker)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Icono *
          </label>
          <Emojipicker
            value={formData.icono}
            onChange={handleEmojiSelect}
          />
          {errors.icono && (
            <p className="mt-1 text-sm text-red-600">
              {errors.icono}
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Tipo de gestión (Series vs Lotes)
            ============================================

            IMPORTANTE: Solo se puede cambiar al CREAR
            Una vez creado, no se puede cambiar el tipo
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Tipo de gestión *
          </label>

          <div className="space-y-3">
            {/* Opción 1: Gestión por Series */}
            <label
              className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer
                transition-all
                ${formData.requiere_series
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                }
                ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="requiere_series"
                checked={formData.requiere_series === true}
                onChange={() => !isEditMode && setFormData(prev => ({ ...prev, requiere_series: true }))}
                disabled={isEditMode}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  📋 Gestión por Series
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Tracking individual
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Cada unidad tiene número de serie único. Ideal para elementos importantes
                  como carpas, proyectores, equipos de sonido.
                </p>
              </div>
            </label>

            {/* Opción 2: Gestión por Lotes */}
            <label
              className={`
                flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer
                transition-all
                ${!formData.requiere_series
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
                }
                ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="requiere_series"
                checked={formData.requiere_series === false}
                onChange={() => !isEditMode && setFormData(prev => ({ ...prev, requiere_series: false }))}
                disabled={isEditMode}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  📊 Gestión por Lotes
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Tracking por cantidad
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Gestión por cantidad agrupada. Ideal para elementos genéricos
                  como sillas, platos, vasos, estacas.
                </p>
              </div>
            </label>
          </div>

          {/* Mensaje si está en modo edición */}
          {isEditMode && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
              <span>⚠️</span>
              No se puede cambiar el tipo de gestión una vez creado el elemento
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Precio de alquiler (opcional)
            ============================================ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Precio de alquiler (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              $
            </span>
            <input
              type="number"
              name="precio_alquiler"
              value={formData.precio_alquiler}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`
                w-full pl-8 pr-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2
                ${errors.precio_alquiler
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-blue-500'
                }
              `}
            />
          </div>
          {errors.precio_alquiler && (
            <p className="mt-1 text-sm text-red-600">
              {errors.precio_alquiler}
            </p>
          )}
        </div>

        {/* ============================================
            CAMPO: Notas (opcional)
            ============================================ */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleInputChange}
            placeholder="Información adicional, observaciones..."
            rows={2}
            className="
              w-full px-4 py-2 border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* ============================================
            FOOTER: Botones de acción
            ============================================ */}
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? (isEditMode ? 'Guardando...' : 'Creando...')
              : (isEditMode ? 'Guardar Cambios' : 'Crear Elemento')
            }
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default ElementoFormModal

/**
 * ============================================
 * 🎓 CONCEPTOS CLAVE
 * ============================================
 *
 * 1. ESTADO DEL FORMULARIO:
 * ─────────────────────────
 * Usamos un objeto 'formData' que contiene todos los campos.
 * Esto es más limpio que tener useState() para cada campo.
 *
 *
 * 2. VALIDACIÓN:
 * ──────────────
 * - validateForm() revisa todos los campos
 * - Devuelve true/false
 * - Guarda errores en objeto 'errors'
 * - Mostramos errores debajo de cada campo
 *
 *
 * 3. MODO CREAR vs EDITAR:
 * ────────────────────────
 * - Detectamos con: isEditMode = !!elemento?.id
 * - Creamos título dinámico
 * - Usamos mutation diferente según modo
 * - En editar, cargamos datos existentes con useEffect
 *
 *
 * 4. MUTATIONS DE REACT QUERY:
 * ────────────────────────────
 * - createElemento.mutate(data, { onSuccess, onError })
 * - isPending para deshabilitar botón mientras guarda
 * - onSuccess para cerrar modal y recargar datos
 * - onError para mostrar mensaje de error
 *
 *
 * 5. CONTROLLED INPUTS:
 * ─────────────────────
 * Todos los inputs tienen:
 * - value={formData.campo}
 * - onChange={handleInputChange}
 *
 * React controla el valor del input (controlled component)
 *
 *
 * 6. PREVENCIÓN DE CAMBIO DE TIPO:
 * ─────────────────────────────────
 * Una vez creado, no se puede cambiar de series a lotes
 * porque ya puede tener datos asociados.
 * Usamos disabled={isEditMode} en los radio buttons.
 */
