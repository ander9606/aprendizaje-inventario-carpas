// ============================================
// FORMULARIO: ELEMENTO COMPUESTO (Multi-paso)
// Modal para crear o editar plantillas de alquiler
// ============================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Package,
  Layers,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  X,
  DollarSign,
  AlertCircle
} from 'lucide-react'

import Modal from '../common/Modal'
import Button from '../common/Button'

// Hooks
import { useGetCategoriasProductos } from '../../hooks/UseCategoriasProductos'
import { useGetElementos } from '../../hooks/Useelementos'
import {
  useCreateElementoCompuesto,
  useUpdateElementoCompuesto,
  useActualizarComponentes
} from '../../hooks/UseElementosCompuestos'

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ElementoCompuestoFormModal({
  isOpen,
  onClose,
  onSuccess,
  elemento = null
}) {
  const isEditMode = elemento && elemento.id

  // ============================================
  // ESTADOS
  // ============================================

  const [currentStep, setCurrentStep] = useState(1)
  const TOTAL_STEPS = 5

  // Datos del formulario
  const [formData, setFormData] = useState({
    categoria_id: '',
    nombre: '',
    codigo: '',
    descripcion: '',
    precio_base: '',
    deposito: ''
  })

  // Componentes
  const [componentesFijos, setComponentesFijos] = useState([])
  const [gruposAlternativas, setGruposAlternativas] = useState([])
  const [componentesAdicionales, setComponentesAdicionales] = useState([])

  const [errors, setErrors] = useState({})

  // ============================================
  // HOOKS DE DATOS
  // ============================================

  const { categorias, isLoading: loadingCategorias } = useGetCategoriasProductos()
  const { elementos: elementosInventario, isLoading: loadingElementos } = useGetElementos()

  const { createElemento, isPending: isCreating } = useCreateElementoCompuesto()
  const { updateElemento, isPending: isUpdating } = useUpdateElementoCompuesto()
  const { actualizarComponentes, isPending: isUpdatingComponentes } = useActualizarComponentes()

  const isPending = isCreating || isUpdating || isUpdatingComponentes

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // Cargar datos del elemento
        setFormData({
          categoria_id: elemento.categoria_id || '',
          nombre: elemento.nombre || '',
          codigo: elemento.codigo || '',
          descripcion: elemento.descripcion || '',
          precio_base: elemento.precio_base || '',
          deposito: elemento.deposito || ''
        })
        // TODO: Cargar componentes existentes
        setComponentesFijos([])
        setGruposAlternativas([])
        setComponentesAdicionales([])
      } else {
        // Resetear formulario
        setFormData({
          categoria_id: '',
          nombre: '',
          codigo: '',
          descripcion: '',
          precio_base: '',
          deposito: ''
        })
        setComponentesFijos([])
        setGruposAlternativas([])
        setComponentesAdicionales([])
      }
      setCurrentStep(1)
      setErrors({})
    }
  }, [isOpen, elemento, isEditMode])

  // ============================================
  // PASOS DEL FORMULARIO
  // ============================================

  const steps = [
    { number: 1, title: 'Información', icon: Package },
    { number: 2, title: 'Fijos', icon: Layers },
    { number: 3, title: 'Alternativas', icon: RefreshCw },
    { number: 4, title: 'Adicionales', icon: Plus },
    { number: 5, title: 'Resumen', icon: Check }
  ]

  // ============================================
  // VALIDACIONES POR PASO
  // ============================================

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.categoria_id) {
        newErrors.categoria_id = 'Selecciona una categoría'
      }
      if (!formData.nombre.trim()) {
        newErrors.nombre = 'El nombre es obligatorio'
      } else if (formData.nombre.trim().length < 3) {
        newErrors.nombre = 'Mínimo 3 caracteres'
      }
      if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
        newErrors.precio_base = 'El precio base es obligatorio'
      }
    }

    if (step === 2) {
      if (componentesFijos.length === 0) {
        newErrors.fijos = 'Agrega al menos un componente fijo'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // NAVEGACIÓN
  // ============================================

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const goToStep = (step) => {
    // Solo permitir ir a pasos anteriores o al siguiente si el actual es válido
    if (step < currentStep) {
      setCurrentStep(step)
    } else if (step === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(step)
    }
  }

  // ============================================
  // HANDLERS DE FORMULARIO
  // ============================================

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    // Preparar componentes
    const componentes = [
      ...componentesFijos.map(c => ({
        elemento_id: c.elemento_id,
        cantidad: c.cantidad,
        tipo: 'fijo'
      })),
      ...gruposAlternativas.flatMap(grupo =>
        grupo.opciones.map(opcion => ({
          elemento_id: opcion.elemento_id,
          cantidad: grupo.cantidad_total,
          tipo: 'alternativa',
          grupo: grupo.nombre,
          es_default: opcion.es_default,
          precio_adicional: opcion.precio_adicional || 0
        }))
      ),
      ...componentesAdicionales.map(c => ({
        elemento_id: c.elemento_id,
        cantidad: c.cantidad,
        tipo: 'adicional',
        precio_adicional: c.precio_adicional || 0
      }))
    ]

    const dataToSend = {
      categoria_id: parseInt(formData.categoria_id),
      nombre: formData.nombre.trim(),
      codigo: formData.codigo.trim() || null,
      descripcion: formData.descripcion.trim() || null,
      precio_base: parseFloat(formData.precio_base),
      deposito: parseFloat(formData.deposito) || 0,
      componentes
    }

    try {
      if (isEditMode) {
        await updateElemento({ id: elemento.id, ...dataToSend })
        await actualizarComponentes({
          elementoId: elemento.id,
          componentes
        })
        toast.success('Plantilla actualizada exitosamente')
      } else {
        await createElemento(dataToSend)
        toast.success('Plantilla creada exitosamente')
      }
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar')
    }
  }

  // ============================================
  // CÁLCULOS DE PRECIO
  // ============================================

  const calcularPrecios = () => {
    const base = parseFloat(formData.precio_base) || 0

    // Precio mínimo = base (solo fijos + defaults)
    const minimo = base

    // Precio máximo = base + todas alternativas premium + todos adicionales
    let maxAdicional = 0

    gruposAlternativas.forEach(grupo => {
      const maxOpcion = Math.max(
        ...grupo.opciones.map(o => (o.precio_adicional || 0) * grupo.cantidad_total)
      )
      maxAdicional += maxOpcion
    })

    componentesAdicionales.forEach(c => {
      maxAdicional += (c.precio_adicional || 0) * c.cantidad
    })

    return {
      base,
      minimo,
      maximo: base + maxAdicional,
      deposito: parseFloat(formData.deposito) || 0
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Plantilla' : 'Nueva Plantilla'}
      size="xl"
    >
      {/* Indicador de pasos */}
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Contenido del paso actual */}
      <div className="min-h-[400px] py-4">
        {currentStep === 1 && (
          <Step1InfoBasica
            formData={formData}
            errors={errors}
            categorias={categorias}
            loadingCategorias={loadingCategorias}
            onChange={handleInputChange}
          />
        )}

        {currentStep === 2 && (
          <Step2ComponentesFijos
            componentes={componentesFijos}
            setComponentes={setComponentesFijos}
            elementosInventario={elementosInventario}
            loadingElementos={loadingElementos}
            error={errors.fijos}
          />
        )}

        {currentStep === 3 && (
          <Step3Alternativas
            grupos={gruposAlternativas}
            setGrupos={setGruposAlternativas}
            elementosInventario={elementosInventario}
          />
        )}

        {currentStep === 4 && (
          <Step4Adicionales
            componentes={componentesAdicionales}
            setComponentes={setComponentesAdicionales}
            elementosInventario={elementosInventario}
          />
        )}

        {currentStep === 5 && (
          <Step5Resumen
            formData={formData}
            componentesFijos={componentesFijos}
            gruposAlternativas={gruposAlternativas}
            componentesAdicionales={componentesAdicionales}
            categorias={categorias}
            precios={calcularPrecios()}
          />
        )}
      </div>

      {/* Footer con navegación */}
      <Modal.Footer className="justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="ghost" onClick={handlePrev} disabled={isPending}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button variant="primary" onClick={handleNext}>
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Plantilla')}
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  )
}

// ============================================
// COMPONENTE: Indicador de Pasos
// ============================================

function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex items-center justify-center mb-6 pb-4 border-b border-slate-200">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = step.number === currentStep
        const isCompleted = step.number < currentStep

        return (
          <div key={step.number} className="flex items-center">
            {/* Paso */}
            <button
              onClick={() => onStepClick(step.number)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                ${isActive ? 'bg-emerald-100 text-emerald-700' : ''}
                ${isCompleted ? 'text-emerald-600 hover:bg-emerald-50' : ''}
                ${!isActive && !isCompleted ? 'text-slate-400' : ''}
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isActive ? 'bg-emerald-600 text-white' : ''}
                ${isCompleted ? 'bg-emerald-100 text-emerald-600' : ''}
                ${!isActive && !isCompleted ? 'bg-slate-200 text-slate-500' : ''}
              `}>
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span className="hidden md:inline text-sm font-medium">
                {step.title}
              </span>
            </button>

            {/* Línea conectora */}
            {index < steps.length - 1 && (
              <div className={`
                w-8 h-0.5 mx-1
                ${step.number < currentStep ? 'bg-emerald-400' : 'bg-slate-200'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// PASO 1: Información Básica
// ============================================

function Step1InfoBasica({ formData, errors, categorias, loadingCategorias, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-medium text-slate-900">Información Básica</h3>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Categoría *
        </label>
        <select
          name="categoria_id"
          value={formData.categoria_id}
          onChange={onChange}
          disabled={loadingCategorias}
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            ${errors.categoria_id ? 'border-red-300' : 'border-slate-300'}
          `}
        >
          <option value="">Selecciona una categoría...</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
        {errors.categoria_id && (
          <p className="mt-1 text-sm text-red-600">{errors.categoria_id}</p>
        )}
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={onChange}
          placeholder="Ej: Carpa P10 Completa"
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            ${errors.nombre ? 'border-red-300' : 'border-slate-300'}
          `}
        />
        {errors.nombre && (
          <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
        )}
      </div>

      {/* Código y Precio en grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Código
          </label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={onChange}
            placeholder="Ej: CARPA-P10"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Precio Base *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              name="precio_base"
              value={formData.precio_base}
              onChange={onChange}
              placeholder="500000"
              className={`
                w-full pl-10 pr-4 py-2 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500
                ${errors.precio_base ? 'border-red-300' : 'border-slate-300'}
              `}
            />
          </div>
          {errors.precio_base && (
            <p className="mt-1 text-sm text-red-600">{errors.precio_base}</p>
          )}
        </div>
      </div>

      {/* Depósito */}
      <div className="w-1/2">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Depósito (Garantía)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="number"
            name="deposito"
            value={formData.deposito}
            onChange={onChange}
            placeholder="200000"
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={onChange}
          rows={3}
          placeholder="Descripción del producto..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>
    </div>
  )
}

// ============================================
// PASO 2: Componentes Fijos
// ============================================

function Step2ComponentesFijos({ componentes, setComponentes, elementosInventario, loadingElementos, error }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const elementosFiltrados = elementosInventario.filter(el =>
    el.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !componentes.find(c => c.elemento_id === el.id)
  )

  const agregarComponente = (elemento) => {
    setComponentes(prev => [...prev, {
      elemento_id: elemento.id,
      nombre: elemento.nombre,
      cantidad: 1,
      requiere_series: elemento.requiere_series
    }])
    setSearchTerm('')
    setShowSearch(false)
  }

  const actualizarCantidad = (index, cantidad) => {
    setComponentes(prev => prev.map((c, i) =>
      i === index ? { ...c, cantidad: Math.max(1, parseInt(cantidad) || 1) } : c
    ))
  }

  const eliminarComponente = (index) => {
    setComponentes(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-medium text-slate-900">Componentes Fijos</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>

      <p className="text-sm text-slate-600">
        Elementos esenciales que siempre se incluyen. No alteran el precio.
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Buscador */}
      {showSearch && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar elemento del inventario..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>

          {loadingElementos ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {elementosFiltrados.slice(0, 10).map(el => (
                <button
                  key={el.id}
                  onClick={() => agregarComponente(el)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-slate-700">{el.nombre}</span>
                  <span className="text-xs text-slate-500">
                    {el.requiere_series ? 'Serie' : 'Lote'}
                  </span>
                </button>
              ))}
              {elementosFiltrados.length === 0 && searchTerm && (
                <p className="text-sm text-slate-500 py-2">No se encontraron elementos</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de componentes */}
      <div className="space-y-2">
        {componentes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay componentes fijos</p>
            <p className="text-sm">Agrega los elementos esenciales de esta plantilla</p>
          </div>
        ) : (
          componentes.map((comp, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
            >
              <div className="flex-1">
                <span className="font-medium text-slate-800">{comp.nombre}</span>
                <span className="ml-2 text-xs text-slate-500">
                  ({comp.requiere_series ? 'Serie' : 'Lote'})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-600">Cant:</span>
                  <input
                    type="number"
                    value={comp.cantidad}
                    onChange={(e) => actualizarCantidad(index, e.target.value)}
                    min="1"
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                  />
                </div>

                <button
                  onClick={() => eliminarComponente(index)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================
// PASO 3: Alternativas
// ============================================

function Step3Alternativas({ grupos, setGrupos, elementosInventario }) {
  const [nuevoGrupo, setNuevoGrupo] = useState('')

  const agregarGrupo = () => {
    if (!nuevoGrupo.trim()) return
    setGrupos(prev => [...prev, {
      nombre: nuevoGrupo.trim(),
      cantidad_total: 1,
      opciones: []
    }])
    setNuevoGrupo('')
  }

  const eliminarGrupo = (index) => {
    setGrupos(prev => prev.filter((_, i) => i !== index))
  }

  const actualizarGrupo = (index, field, value) => {
    setGrupos(prev => prev.map((g, i) =>
      i === index ? { ...g, [field]: value } : g
    ))
  }

  const agregarOpcion = (grupoIndex, elemento) => {
    setGrupos(prev => prev.map((g, i) => {
      if (i !== grupoIndex) return g
      const esDefault = g.opciones.length === 0
      return {
        ...g,
        opciones: [...g.opciones, {
          elemento_id: elemento.id,
          nombre: elemento.nombre,
          es_default: esDefault,
          precio_adicional: 0
        }]
      }
    }))
  }

  const actualizarOpcion = (grupoIndex, opcionIndex, field, value) => {
    setGrupos(prev => prev.map((g, i) => {
      if (i !== grupoIndex) return g
      return {
        ...g,
        opciones: g.opciones.map((o, j) => {
          if (j !== opcionIndex) {
            // Si estamos marcando es_default, desmarcar las demás
            if (field === 'es_default' && value === true) {
              return { ...o, es_default: false }
            }
            return o
          }
          return { ...o, [field]: value }
        })
      }
    }))
  }

  const eliminarOpcion = (grupoIndex, opcionIndex) => {
    setGrupos(prev => prev.map((g, i) => {
      if (i !== grupoIndex) return g
      return {
        ...g,
        opciones: g.opciones.filter((_, j) => j !== opcionIndex)
      }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-medium text-slate-900">Grupos de Alternativas</h3>
      </div>

      <p className="text-sm text-slate-600">
        Elementos intercambiables. El cliente puede elegir entre las opciones o combinarlas.
      </p>

      {/* Agregar grupo */}
      <div className="flex gap-2">
        <input
          type="text"
          value={nuevoGrupo}
          onChange={(e) => setNuevoGrupo(e.target.value)}
          placeholder="Nombre del grupo (ej: anclajes)"
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          onKeyDown={(e) => e.key === 'Enter' && agregarGrupo()}
        />
        <Button variant="outline" onClick={agregarGrupo}>
          <Plus className="w-4 h-4 mr-1" />
          Grupo
        </Button>
      </div>

      {/* Lista de grupos */}
      <div className="space-y-4">
        {grupos.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay grupos de alternativas</p>
            <p className="text-sm">Este paso es opcional</p>
          </div>
        ) : (
          grupos.map((grupo, grupoIndex) => (
            <GrupoAlternativaCard
              key={grupoIndex}
              grupo={grupo}
              grupoIndex={grupoIndex}
              elementosInventario={elementosInventario}
              onActualizarGrupo={(field, value) => actualizarGrupo(grupoIndex, field, value)}
              onAgregarOpcion={(el) => agregarOpcion(grupoIndex, el)}
              onActualizarOpcion={(opIdx, field, value) => actualizarOpcion(grupoIndex, opIdx, field, value)}
              onEliminarOpcion={(opIdx) => eliminarOpcion(grupoIndex, opIdx)}
              onEliminarGrupo={() => eliminarGrupo(grupoIndex)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Sub-componente para grupo de alternativa
function GrupoAlternativaCard({
  grupo,
  elementosInventario,
  onActualizarGrupo,
  onAgregarOpcion,
  onActualizarOpcion,
  onEliminarOpcion,
  onEliminarGrupo
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const elementosFiltrados = elementosInventario.filter(el =>
    el.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !grupo.opciones.find(o => o.elemento_id === el.id)
  )

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-900">{grupo.nombre}</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-slate-600">Cantidad:</span>
            <input
              type="number"
              value={grupo.cantidad_total}
              onChange={(e) => onActualizarGrupo('cantidad_total', parseInt(e.target.value) || 1)}
              min="1"
              className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-sm"
            />
          </div>
        </div>
        <button
          onClick={onEliminarGrupo}
          className="text-slate-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Opciones del grupo */}
      <div className="space-y-2 mb-3">
        {grupo.opciones.map((opcion, opIdx) => (
          <div
            key={opIdx}
            className="flex items-center gap-3 p-2 bg-slate-50 rounded"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={opcion.es_default}
                onChange={() => onActualizarOpcion(opIdx, 'es_default', true)}
                className="text-emerald-600"
              />
              <span className="text-sm">Default</span>
            </label>

            <span className="flex-1 font-medium text-slate-700">{opcion.nombre}</span>

            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">+$</span>
              <input
                type="number"
                value={opcion.precio_adicional}
                onChange={(e) => onActualizarOpcion(opIdx, 'precio_adicional', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                disabled={opcion.es_default}
              />
            </div>

            <button
              onClick={() => onEliminarOpcion(opIdx)}
              className="text-slate-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Agregar opción */}
      <button
        onClick={() => setShowSearch(!showSearch)}
        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
      >
        <Plus className="w-3 h-3" />
        Agregar opción
      </button>

      {showSearch && (
        <div className="mt-2 p-2 bg-slate-100 rounded">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar elemento..."
            className="w-full px-3 py-1 border border-slate-300 rounded text-sm mb-2"
            autoFocus
          />
          <div className="max-h-32 overflow-y-auto">
            {elementosFiltrados.slice(0, 5).map(el => (
              <button
                key={el.id}
                onClick={() => {
                  onAgregarOpcion(el)
                  setSearchTerm('')
                  setShowSearch(false)
                }}
                className="w-full text-left px-2 py-1 text-sm hover:bg-emerald-50 rounded"
              >
                {el.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// PASO 4: Adicionales
// ============================================

function Step4Adicionales({ componentes, setComponentes, elementosInventario }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const elementosFiltrados = elementosInventario.filter(el =>
    el.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !componentes.find(c => c.elemento_id === el.id)
  )

  const agregarComponente = (elemento) => {
    setComponentes(prev => [...prev, {
      elemento_id: elemento.id,
      nombre: elemento.nombre,
      cantidad: 1,
      precio_adicional: 0
    }])
    setSearchTerm('')
    setShowSearch(false)
  }

  const actualizarComponente = (index, field, value) => {
    setComponentes(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    ))
  }

  const eliminarComponente = (index) => {
    setComponentes(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-medium text-slate-900">Componentes Adicionales</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>

      <p className="text-sm text-slate-600">
        Extras opcionales. El producto funciona sin ellos. Siempre suman al precio.
      </p>

      {/* Buscador */}
      {showSearch && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar elemento adicional..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {elementosFiltrados.slice(0, 10).map(el => (
              <button
                key={el.id}
                onClick={() => agregarComponente(el)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <span className="font-medium text-slate-700">{el.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {componentes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay componentes adicionales</p>
            <p className="text-sm">Este paso es opcional</p>
          </div>
        ) : (
          componentes.map((comp, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
            >
              <span className="font-medium text-slate-800">{comp.nombre}</span>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-600">Cant:</span>
                  <input
                    type="number"
                    value={comp.cantidad}
                    onChange={(e) => actualizarComponente(index, 'cantidad', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-600">+$</span>
                  <input
                    type="number"
                    value={comp.precio_adicional}
                    onChange={(e) => actualizarComponente(index, 'precio_adicional', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-center"
                  />
                </div>

                <button
                  onClick={() => eliminarComponente(index)}
                  className="p-1 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================
// PASO 5: Resumen
// ============================================

function Step5Resumen({ formData, componentesFijos, gruposAlternativas, componentesAdicionales, categorias, precios }) {
  const categoriaNombre = categorias.find(c => c.id === parseInt(formData.categoria_id))?.nombre || '-'

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Check className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-medium text-slate-900">Resumen</h3>
      </div>

      {/* Info básica */}
      <div className="p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-900 mb-3">{formData.nombre}</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Código:</span>
            <span className="ml-2 text-slate-700">{formData.codigo || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500">Categoría:</span>
            <span className="ml-2 text-slate-700">{categoriaNombre}</span>
          </div>
        </div>
      </div>

      {/* Resumen de componentes */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-700">{componentesFijos.length}</div>
          <div className="text-sm text-blue-600">Fijos</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-amber-700">{gruposAlternativas.length}</div>
          <div className="text-sm text-amber-600">Grupos Alt.</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-700">{componentesAdicionales.length}</div>
          <div className="text-sm text-purple-600">Adicionales</div>
        </div>
      </div>

      {/* Cálculo de precios */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <h4 className="font-medium text-emerald-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Cálculo de Precios
        </h4>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Precio Base:</span>
            <span className="font-medium">{formatPrecio(precios.base)}</span>
          </div>

          <div className="border-t border-emerald-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Precio Mínimo (solo defaults):</span>
              <span className="font-medium text-emerald-700">{formatPrecio(precios.minimo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Precio Máximo (todo premium):</span>
              <span className="font-medium text-emerald-700">{formatPrecio(precios.maximo)}</span>
            </div>
          </div>

          <div className="border-t border-emerald-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Depósito:</span>
              <span className="font-medium">{formatPrecio(precios.deposito)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listas detalladas */}
      {componentesFijos.length > 0 && (
        <div>
          <h5 className="font-medium text-slate-700 mb-2">Componentes Fijos:</h5>
          <ul className="text-sm text-slate-600 space-y-1">
            {componentesFijos.map((c, i) => (
              <li key={i}>• {c.nombre} × {c.cantidad}</li>
            ))}
          </ul>
        </div>
      )}

      {gruposAlternativas.length > 0 && (
        <div>
          <h5 className="font-medium text-slate-700 mb-2">Grupos de Alternativas:</h5>
          {gruposAlternativas.map((g, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm font-medium text-slate-600">{g.nombre} ({g.cantidad_total} requeridos):</p>
              <ul className="text-sm text-slate-500 ml-4">
                {g.opciones.map((o, j) => (
                  <li key={j}>
                    {o.es_default ? '⭐' : '○'} {o.nombre}
                    {!o.es_default && o.precio_adicional > 0 && ` (+${formatPrecio(o.precio_adicional)} c/u)`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {componentesAdicionales.length > 0 && (
        <div>
          <h5 className="font-medium text-slate-700 mb-2">Adicionales:</h5>
          <ul className="text-sm text-slate-600 space-y-1">
            {componentesAdicionales.map((c, i) => (
              <li key={i}>• {c.nombre} × {c.cantidad} (+{formatPrecio(c.precio_adicional)} c/u)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ElementoCompuestoFormModal
