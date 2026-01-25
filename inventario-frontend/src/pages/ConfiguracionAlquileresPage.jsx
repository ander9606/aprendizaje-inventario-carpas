// ============================================
// PÁGINA: Configuración de Alquileres
// Gestión de parámetros del sistema
// ============================================

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Settings, Percent, Calendar, Building, Save, RotateCcw } from 'lucide-react'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import { useGetConfiguraciones, useUpdateConfiguraciones } from '../hooks'

const ConfiguracionPage = () => {
  const [searchParams] = useSearchParams()
  const categoriaParam = searchParams.get('categoria') || 'impuestos'

  const [categoriaActiva, setCategoriaActiva] = useState(categoriaParam)
  const [valores, setValores] = useState({})
  const [cambios, setCambios] = useState(false)

  // Hooks
  const { data, isLoading, refetch } = useGetConfiguraciones()
  const updateMutation = useUpdateConfiguraciones()

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

  // Renderizar input según tipo
  const renderInput = (config) => {
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              min="0"
              step={config.tipo === 'porcentaje' ? '0.01' : '1'}
            />
            {config.tipo === 'porcentaje' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
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
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )
    }
  }

  // Obtener configuraciones de la categoría activa
  const configuracionesCategoria = data?.agrupadas?.[categoriaActiva] || []

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Configuración
          </h1>
          <p className="text-slate-500 mt-1">
            Ajusta los parámetros del sistema de alquileres
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

      {/* Tabs de categorías */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {Object.entries(categorias).map(([key, cat]) => {
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
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Los cambios en la configuración afectarán a las nuevas cotizaciones.
              Las cotizaciones existentes mantienen los valores con los que fueron creadas.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfiguracionPage
