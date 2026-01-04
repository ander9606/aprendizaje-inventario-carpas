// ============================================
// PÁGINA: CONFIGURACIÓN
// Dashboard para gestión de datos maestros
// ============================================

import { useNavigate } from 'react-router-dom'
import {
  Settings,
  MapPin,
  Truck,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

/**
 * ConfiguracionPage
 *
 * Dashboard para gestionar los datos maestros del sistema:
 * - Ubicaciones: Lugares donde puede estar el inventario
 * - Tarifas de Transporte: Precios por ciudad y tipo de camión
 */
export default function ConfiguracionPage() {
  const navigate = useNavigate()

  const opciones = [
    {
      id: 'ubicaciones',
      nombre: 'Ubicaciones',
      descripcion: 'Gestiona bodegas, lugares de eventos y destinos donde puede estar el inventario.',
      icon: MapPin,
      color: 'blue',
      ruta: '/configuracion/ubicaciones'
    },
    {
      id: 'tarifas',
      nombre: 'Tarifas de Transporte',
      descripcion: 'Define precios de transporte por ciudad y tipo de camión.',
      icon: Truck,
      color: 'orange',
      ruta: '/configuracion/tarifas-transporte'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200 hover:border-blue-400',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-600',
        hover: 'hover:shadow-lg hover:shadow-blue-100'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200 hover:border-orange-400',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-600',
        hover: 'hover:shadow-lg hover:shadow-orange-100'
      }
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Settings className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Configuración
                </h1>
                <p className="text-slate-600">
                  Gestiona los datos maestros del sistema
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Datos Maestros
          </h2>
          <p className="text-slate-600 text-sm">
            Estos datos alimentan los demás módulos del sistema
          </p>
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {opciones.map((opcion) => {
            const Icon = opcion.icon
            const colors = getColorClasses(opcion.color)

            return (
              <div
                key={opcion.id}
                onClick={() => navigate(opcion.ruta)}
                className={`
                  rounded-xl border-2 p-6 transition-all duration-300 cursor-pointer
                  ${colors.border} ${colors.hover}
                `}
              >
                {/* Icono */}
                <div className={`
                  inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
                  ${colors.icon}
                `}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Contenido */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {opcion.nombre}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  {opcion.descripcion}
                </p>

                {/* Footer */}
                <div className={`flex items-center gap-2 font-medium text-sm ${colors.text}`}>
                  <span>Gestionar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-4xl">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Las ciudades disponibles en el sistema se definen a través de las Tarifas de Transporte.
            Primero crea las tarifas y luego podrás asignar esas ciudades a las ubicaciones.
          </p>
        </div>
      </div>
    </div>
  )
}
