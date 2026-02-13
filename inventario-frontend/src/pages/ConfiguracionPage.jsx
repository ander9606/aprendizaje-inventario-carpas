// ============================================
// PÁGINA: CONFIGURACIÓN
// Dashboard para gestión de datos maestros
// ============================================

import { useNavigation } from '../hooks/UseNavigation'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Shield,
  Building
} from 'lucide-react'
import { useAuth } from '../hooks/auth/useAuth'

export default function ConfiguracionPage() {
  const { volverAModulos } = useNavigation()
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const canSeeEmpleados = hasRole(['admin', 'gerente'])

  const opciones = [
    {
      id: 'ciudades',
      nombre: 'Ciudades',
      descripcion: 'Catálogo maestro de ciudades con sus tarifas de transporte por tipo de camión.',
      icon: MapPin,
      color: 'green',
      ruta: '/configuracion/ciudades',
      tags: ['Tarifas', 'Transporte']
    },
    {
      id: 'ubicaciones',
      nombre: 'Ubicaciones',
      descripcion: 'Gestiona bodegas, lugares de eventos y destinos donde puede estar el inventario.',
      icon: MapPin,
      color: 'blue',
      ruta: '/configuracion/ubicaciones',
      tags: ['Bodegas', 'Destinos']
    },
    {
      id: 'empresa',
      nombre: 'Datos Empresa',
      descripcion: 'Logo, nombre, NIT, dirección y datos de contacto que aparecen en documentos.',
      icon: Building,
      color: 'orange',
      ruta: '/configuracion/empresa',
      tags: ['Logo', 'NIT', 'Contacto']
    },
    ...(canSeeEmpleados ? [{
      id: 'empleados',
      nombre: 'Empleados',
      descripcion: 'Gestiona usuarios del sistema, asigna roles y controla permisos de acceso.',
      icon: Shield,
      color: 'purple',
      ruta: '/configuracion/empleados',
      tags: ['Roles', 'Permisos']
    }] : [])
  ]

  const colorConfig = {
    blue: {
      card: 'border-blue-200/60 hover:border-blue-400 hover:shadow-blue-100/50',
      iconBg: 'bg-blue-500',
      tag: 'bg-blue-50 text-blue-700',
      arrow: 'text-blue-500 group-hover:translate-x-1'
    },
    green: {
      card: 'border-green-200/60 hover:border-green-400 hover:shadow-green-100/50',
      iconBg: 'bg-green-500',
      tag: 'bg-green-50 text-green-700',
      arrow: 'text-green-500 group-hover:translate-x-1'
    },
    orange: {
      card: 'border-orange-200/60 hover:border-orange-400 hover:shadow-orange-100/50',
      iconBg: 'bg-orange-500',
      tag: 'bg-orange-50 text-orange-700',
      arrow: 'text-orange-500 group-hover:translate-x-1'
    },
    purple: {
      card: 'border-purple-200/60 hover:border-purple-400 hover:shadow-purple-100/50',
      iconBg: 'bg-purple-500',
      tag: 'bg-purple-50 text-purple-700',
      arrow: 'text-purple-500 group-hover:translate-x-1'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={volverAModulos}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Módulos</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-500 flex items-center justify-center shadow-sm">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Configuración
              </h1>
              <p className="text-slate-500">
                Gestiona los datos maestros del sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Datos Maestros
          </h2>
          <p className="text-slate-500 text-sm">
            Estos datos alimentan los demás módulos del sistema
          </p>
        </div>

        {/* Grid de opciones - mismo estilo que ModulosDashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {opciones.map((opcion) => {
            const Icon = opcion.icon
            const colors = colorConfig[opcion.color] || colorConfig.blue

            return (
              <div
                key={opcion.id}
                onClick={() => navigate(opcion.ruta)}
                className={`
                  group relative bg-white rounded-2xl border p-6
                  cursor-pointer transition-all duration-200
                  hover:shadow-lg ${colors.card}
                `}
              >
                {/* Icono */}
                <div className={`
                  w-12 h-12 rounded-xl ${colors.iconBg}
                  flex items-center justify-center mb-4 shadow-sm
                `}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Contenido */}
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                  {opcion.nombre}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {opcion.descripcion}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {opcion.tags.map(tag => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow indicator */}
                <div className="flex items-center gap-1.5">
                  <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${colors.arrow}`} />
                  <span className={`text-sm font-medium ${colors.arrow.split(' ')[0]}`}>
                    Gestionar
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Flujo recomendado:</strong> Primero crea las ciudades con
            sus tarifas de transporte, y luego crea las ubicaciones
            seleccionando una ciudad del catálogo.
          </p>
        </div>
      </main>
    </div>
  )
}
