// ============================================
// PÁGINA: DASHBOARD DE MÓDULOS
// Página principal para navegar entre módulos del sistema
// ============================================

import { useNavigate } from 'react-router-dom'
import {
  Package,
  Tent,
  Calendar,
  ArrowRight,
  Boxes,
  ClipboardList
} from 'lucide-react'

/**
 * ModulosDashboard
 *
 * Página de inicio que muestra los módulos disponibles del sistema:
 * - Inventario Individual: Gestión de elementos del inventario
 * - Productos de Alquiler: Plantillas de productos para cotizar
 * - Alquileres: Gestión de contratos y reservas (próximamente)
 */
export default function ModulosDashboard() {
  const navigate = useNavigate()

  const modulos = [
    {
      id: 'inventario',
      nombre: 'Inventario Individual',
      descripcion: 'Gestiona los elementos físicos del inventario. Carpas, mesas, sillas, accesorios y más.',
      icon: Package,
      color: 'blue',
      ruta: '/inventario',
      estado: 'activo',
      stats: [
        { label: 'Categorías', icon: Boxes },
        { label: 'Elementos', icon: ClipboardList }
      ]
    },
    {
      id: 'productos',
      nombre: 'Productos de Alquiler',
      descripcion: 'Crea plantillas de productos combinando elementos del inventario para cotizar fácilmente.',
      icon: Tent,
      color: 'emerald',
      ruta: '/productos/alquiler',
      estado: 'activo',
      stats: [
        { label: 'Plantillas', icon: ClipboardList },
        { label: 'Categorías', icon: Boxes }
      ]
    },
    {
      id: 'alquileres',
      nombre: 'Alquileres',
      descripcion: 'Gestiona contratos, reservas y seguimiento de alquileres activos.',
      icon: Calendar,
      color: 'purple',
      ruta: '/alquileres',
      estado: 'proximamente',
      stats: [
        { label: 'Reservas', icon: Calendar },
        { label: 'Contratos', icon: ClipboardList }
      ]
    }
  ]

  const getColorClasses = (color, estado) => {
    if (estado === 'proximamente') {
      return {
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        icon: 'bg-slate-200 text-slate-400',
        text: 'text-slate-400',
        hover: ''
      }
    }

    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200 hover:border-blue-400',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-600',
        hover: 'hover:shadow-lg hover:shadow-blue-100'
      },
      emerald: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200 hover:border-emerald-400',
        icon: 'bg-emerald-100 text-emerald-600',
        text: 'text-emerald-600',
        hover: 'hover:shadow-lg hover:shadow-emerald-100'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200 hover:border-purple-400',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-600',
        hover: 'hover:shadow-lg hover:shadow-purple-100'
      }
    }

    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
              <Tent className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              VENTO SAS
            </h1>
            <p className="text-lg text-slate-600">
              Sistema de Gestión de Inventario y Alquileres
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Módulos del Sistema
          </h2>
          <p className="text-slate-600">
            Selecciona un módulo para comenzar
          </p>
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulos.map((modulo) => {
            const Icon = modulo.icon
            const colors = getColorClasses(modulo.color, modulo.estado)
            const isDisabled = modulo.estado === 'proximamente'

            return (
              <div
                key={modulo.id}
                onClick={() => !isDisabled && navigate(modulo.ruta)}
                className={`
                  relative rounded-2xl border-2 p-6 transition-all duration-300
                  ${colors.border} ${colors.hover}
                  ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
              >
                {/* Badge de próximamente */}
                {isDisabled && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">
                      Próximamente
                    </span>
                  </div>
                )}

                {/* Icono */}
                <div className={`
                  inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4
                  ${colors.icon}
                `}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Contenido */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {modulo.nombre}
                </h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  {modulo.descripcion}
                </p>

                {/* Footer con acción */}
                {!isDisabled && (
                  <div className={`
                    flex items-center gap-2 font-medium text-sm
                    ${colors.text}
                  `}>
                    <span>Ir al módulo</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Info adicional */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Sistema desarrollado para la gestión integral de alquiler de carpas y eventos
          </p>
        </div>
      </div>
    </div>
  )
}
