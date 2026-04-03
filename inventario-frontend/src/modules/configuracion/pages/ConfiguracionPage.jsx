// ============================================
// PÁGINA: CONFIGURACIÓN
// Dashboard para gestión de datos maestros
// ============================================

import { useNavigate } from 'react-router-dom'
import {
  Settings,
  MapPin,
  ArrowRight,
  Shield,
  Building
} from 'lucide-react'
import { useAuth } from '@auth/hooks/useAuth'
import PageHeader from '@shared/components/PageHeader'
import InfoBox from '@shared/components/InfoBox'
import { useTranslation } from 'react-i18next'

export default function ConfiguracionPage() {
  const { t } = useTranslation()
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
      nombre: 'Ubicaciones y Destinos',
      descripcion: 'Bodegas y talleres de almacenamiento, mas destinos de evento agrupados por ciudad.',
      icon: MapPin,
      color: 'blue',
      ruta: '/configuracion/ubicaciones',
      tags: ['Almacenamiento', 'Destinos', 'Ciudades']
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
      <PageHeader
        icon={Settings}
        iconColor="bg-slate-500"
        title="Configuración"
        subtitle="Gestiona los datos maestros del sistema"
        backTo="/"
        backLabel="Volver a Módulos"
      />

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Datos Maestros
          </h2>
          <p className="text-slate-500 text-sm">
            Estos datos alimentan los demás módulos del sistema
          </p>
        </div>

        {/* Grid de opciones - mismo estilo que ModulosDashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {opciones.map((opcion) => {
            const Icon = opcion.icon
            const colors = colorConfig[opcion.color] || colorConfig.blue

            return (
              <div
                key={opcion.id}
                onClick={() => navigate(opcion.ruta)}
                className={`
                  group relative bg-white rounded-2xl border p-5 lg:p-6
                  cursor-pointer transition-all duration-150 select-none
                  hover:shadow-lg active:scale-[0.97] active:shadow-sm
                  ${colors.card}
                `}
              >
                {/* Icono */}
                <div className={`
                  w-14 h-14 rounded-xl ${colors.iconBg}
                  flex items-center justify-center mb-4 shadow-sm
                `}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Contenido */}
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                  {opcion.nombre}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {opcion.descripcion}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {opcion.tags.map(tag => (
                    <span
                      key={tag}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.tag}`}
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
        <div className="mt-8">
          <InfoBox variant="warning">
            <strong>Flujo recomendado:</strong> Primero crea las ciudades con
            sus tarifas de transporte, y luego agrega destinos de evento
            desde Ubicaciones y Destinos o directamente desde el catalogo de Ciudades.
          </InfoBox>
        </div>
      </main>
    </div>
  )
}
