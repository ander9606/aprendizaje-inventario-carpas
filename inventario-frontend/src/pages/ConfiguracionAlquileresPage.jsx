// ============================================
// PÁGINA: Configuración de Alquileres
// Gestión de parámetros del sistema
// ============================================

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { Settings, Percent, Calendar, Building, Save, RotateCcw, Upload, Trash2, ImageIcon, ArrowLeft } from 'lucide-react'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { useGetConfiguraciones, useUpdateConfiguraciones, useSubirLogo, useEliminarLogo } from '../hooks'
import InfoBox from '../components/common/InfoBox'

// URL base del backend (sin /api)
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')

const ConfiguracionPage = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Detectar si estamos en /configuracion/empresa (modo standalone)
  const isStandalone = location.pathname.startsWith('/configuracion/empresa')
  const categoriaParam = isStandalone ? 'empresa' : (searchParams.get('categoria') || 'impuestos')

  const [categoriaActiva, setCategoriaActiva] = useState(categoriaParam)
  const [valores, setValores] = useState({})
  const [cambios, setCambios] = useState(false)

  // Hooks
  const { data, isLoading, refetch } = useGetConfiguraciones()
  const updateMutation = useUpdateConfiguraciones()
  const subirLogoMutation = useSubirLogo()
  const eliminarLogoMutation = useEliminarLogo()
  const fileInputRef = useRef(null)

  // Categorías disponibles con sus configuraciones
  const categorias = {
    impuestos: {
      label: 'Impuestos',
      icon: Percent,
      descripcion: 'Configuración de IVA y otros impuestos'
    },
    dias_extra: {
      label: 'Días Extra',
      icon: Calendar,
      descripcion: 'Días gratis y recargos por tiempo adicional'
    },
    empresa: {
      label: 'Datos Empresa',
      icon: Building,
      descripcion: 'Información de la empresa para documentos'
    },
    cotizaciones: {
      label: 'Cotizaciones',
      icon: Settings,
      descripcion: 'Configuración de cotizaciones'
    }
  }

  // Cargar valores iniciales
  useEffect(() => {
    if (data?.configuraciones) {
      const valoresIniciales = {}
      data.configuraciones.forEach(config => {
        valoresIniciales[config.clave] = config.valor
      })
      setValores(valoresIniciales)
      setCambios(false)
    }
  }, [data])

  // Handler para cambiar valor
  const handleChange = (clave, valor) => {
    setValores(prev => ({ ...prev, [clave]: valor }))
    setCambios(true)
  }

  // Handler para guardar
  const handleGuardar = async () => {
    // Solo enviar valores que cambiaron
    const configuracionesActuales = data?.configuraciones || []
    const cambiosAGuardar = {}

    configuracionesActuales.forEach(config => {
      if (valores[config.clave] !== config.valor) {
        cambiosAGuardar[config.clave] = valores[config.clave]
      }
    })

    if (Object.keys(cambiosAGuardar).length > 0) {
      await updateMutation.mutateAsync(cambiosAGuardar)
      setCambios(false)
      refetch()
    }
  }

  // Handler para resetear
  const handleResetear = () => {
    if (data?.configuraciones) {
      const valoresIniciales = {}
      data.configuraciones.forEach(config => {
        valoresIniciales[config.clave] = config.valor
      })
      setValores(valoresIniciales)
      setCambios(false)
    }
  }

  // Handler para subir logo
  const handleSubirLogo = async (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    try {
      await subirLogoMutation.mutateAsync(archivo)
      refetch()
    } catch (err) {
      console.error('Error al subir logo:', err)
    }

    // Limpiar input para permitir subir el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handler para eliminar logo
  const handleEliminarLogo = async () => {
    if (!confirm('¿Eliminar el logo de la empresa?')) return

    try {
      await eliminarLogoMutation.mutateAsync()
      refetch()
    } catch (err) {
      console.error('Error al eliminar logo:', err)
    }
  }

  // Renderizar input según tipo
  const renderInput = (config) => {
    // No renderizar empresa_logo como input de texto, se maneja aparte
    if (config.clave === 'empresa_logo') return null

    const valor = valores[config.clave] ?? config.valor

    switch (config.tipo) {
      case 'numero':
      case 'porcentaje':
        return (
          <div className="relative">
            <input
              type="number"
              value={valor}
              onChange={(e) => handleChange(config.clave, e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900 pr-10"
              min="0"
              step={config.tipo === 'porcentaje' ? '0.01' : '1'}
            />
            {config.tipo === 'porcentaje' && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
            )}
          </div>
        )

      case 'booleano':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={valor === 'true' || valor === true}
              onChange={(e) => handleChange(config.clave, e.target.checked ? 'true' : 'false')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            <span className="ml-3 text-sm text-slate-600">
              {valor === 'true' || valor === true ? 'Activo' : 'Inactivo'}
            </span>
          </label>
        )

      default:
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => handleChange(config.clave, e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900"
          />
        )
    }
  }

  // Obtener configuraciones de la categoría activa (filtrar empresa_logo)
  const configuracionesCategoria = (data?.agrupadas?.[categoriaActiva] || [])
    .filter(c => c.clave !== 'empresa_logo')

  // Obtener URL del logo actual
  const logoUrl = valores.empresa_logo

  // Componente de logo
  const renderLogoUpload = () => {
    const cargando = subirLogoMutation.isPending || eliminarLogoMutation.isPending

    return (
      <div className="mb-6 pb-6 border-b border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Logo de la empresa
        </label>
        <div className="flex items-start gap-6">
          {/* Preview del logo */}
          <div className="w-40 h-40 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img
                src={`${BACKEND_URL}${logoUrl}`}
                alt="Logo empresa"
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className={`flex-col items-center justify-center text-slate-400 ${logoUrl ? 'hidden' : 'flex'}`}
            >
              <ImageIcon className="w-10 h-10 mb-1" />
              <span className="text-xs">Sin logo</span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">
              Sube el logo de tu empresa para que aparezca en cotizaciones y facturas.
              Formatos: JPG, PNG, WebP o SVG. Tamaño máximo: 2MB.
            </p>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleSubirLogo}
                className="hidden"
                id="logo-upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={cargando}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {cargando ? (
                  <Spinner size="sm" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {logoUrl ? 'Cambiar logo' : 'Subir logo'}
              </button>

              {logoUrl && (
                <button
                  onClick={handleEliminarLogo}
                  disabled={cargando}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              )}
            </div>

            {subirLogoMutation.isError && (
              <p className="text-sm text-red-600">
                Error al subir: {subirLogoMutation.error?.response?.data?.message || 'Intenta de nuevo'}
              </p>
            )}
            {subirLogoMutation.isSuccess && (
              <p className="text-sm text-green-600">Logo actualizado correctamente</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // En modo standalone, solo mostrar la categoría empresa
  const categoriasVisibles = isStandalone
    ? { empresa: categorias.empresa }
    : categorias

  return (
    <div className="p-6">
      {/* Botón volver (solo en modo standalone) */}
      {isStandalone && (
        <button
          onClick={() => navigate('/configuracion')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Configuración</span>
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center shadow-sm">
                {isStandalone ? <Building className="w-5 h-5 text-white" /> : <Settings className="w-5 h-5 text-white" />}
              </div>
              {isStandalone ? 'Datos de la Empresa' : 'Configuración'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isStandalone ? 'Logo, nombre y datos de contacto para documentos' : 'Ajusta los parámetros del sistema de alquileres'}
            </p>
          </div>

          {/* Botones de acción */}
          {cambios && (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleResetear}
              >
                Descartar
              </Button>
              <Button
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                onClick={handleGuardar}
                loading={updateMutation.isPending}
              >
                Guardar cambios
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs de categorías (ocultar si solo hay una) */}
      {!isStandalone && (
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {Object.entries(categoriasVisibles).map(([key, cat]) => {
          const Icon = cat.icon
          return (
            <button
              key={key}
              onClick={() => setCategoriaActiva(key)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${categoriaActiva === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          )
        })}
      </div>
      )}

      {/* Contenido */}
      {isLoading ? (
        <div className="py-12">
          <Spinner size="lg" text="Cargando configuración..." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Descripción de la categoría */}
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              {categorias[categoriaActiva]?.label}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {categorias[categoriaActiva]?.descripcion}
            </p>
          </div>

          {/* Logo upload - solo en pestaña empresa */}
          {categoriaActiva === 'empresa' && renderLogoUpload()}

          {/* Formulario de configuraciones */}
          {configuracionesCategoria.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No hay configuraciones en esta categoría
            </p>
          ) : (
            <div className="space-y-6">
              {configuracionesCategoria.map((config) => (
                <div key={config.clave} className="grid grid-cols-3 gap-4 items-start">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700">
                      {config.descripcion || config.clave}
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {config.clave}
                    </p>
                  </div>
                  <div className="col-span-2">
                    {renderInput(config)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nota informativa */}
          <div className="mt-8">
            <InfoBox variant="info">
              <strong>Nota:</strong> Los cambios en la configuración afectarán a las nuevas cotizaciones.
              Las cotizaciones existentes mantienen los valores con los que fueron creadas.
            </InfoBox>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfiguracionPage
