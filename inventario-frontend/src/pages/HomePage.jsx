// ============================================
// PÁGINA: HOME PAGE
// Página principal de navegación del sistema
// ============================================

import { useNavigate } from 'react-router-dom'
import {
  Package,
  Layers,
  FileText,
  MapPin,
  ArrowRight,
  Boxes,
  Users,
  ClipboardList
} from 'lucide-react'
import Button from '../components/common/Button'

/**
 * Página HomePage - Punto de entrada principal
 *
 * Permite navegar a los diferentes módulos:
 * - Inventario Individual (gestión de categorías/elementos)
 * - Elementos Compuestos (plantillas de productos)
 * - Alquileres (cotizaciones y alquileres)
 * - Ubicaciones (bodegas y ubicaciones)
 */
export default function HomePage() {
  const navigate = useNavigate()

  // ============================================
  // CONFIGURACIÓN DE MÓDULOS
  // ============================================
  const modulos = [
    {
      id: 'inventario',
      titulo: 'Inventario Individual',
      descripcion: 'Gestiona categorías, subcategorías y elementos individuales del inventario (series y lotes)',
      icono: Package,
      color: 'blue',
      ruta: '/inventario',
      disponible: true
    },
    {
      id: 'elementos-compuestos',
      titulo: 'Elementos Compuestos',
      descripcion: 'Crea y gestiona plantillas de productos compuestos por múltiples elementos del inventario',
      icono: Layers,
      color: 'purple',
      ruta: '/productos/elementos-compuestos',
      disponible: true
    },
    {
      id: 'alquileres',
      titulo: 'Alquileres',
      descripcion: 'Gestiona clientes, cotizaciones y alquileres activos de productos',
      icono: ClipboardList,
      color: 'green',
      ruta: '/alquileres',
      disponible: true
    },
    {
      id: 'ubicaciones',
      titulo: 'Ubicaciones',
      descripcion: 'Administra las ubicaciones y bodegas donde se almacena el inventario',
      icono: MapPin,
      color: 'amber',
      ruta: '/ubicaciones',
      disponible: true
    }
  ]

  // ============================================
  // ESTILOS POR COLOR
  // ============================================
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600 bg-blue-100',
      hover: 'hover:border-blue-400 hover:shadow-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600 bg-purple-100',
      hover: 'hover:border-purple-400 hover:shadow-purple-100',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600 bg-green-100',
      hover: 'hover:border-green-400 hover:shadow-green-100',
      button: 'bg-green-600 hover:bg-green-700'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600 bg-amber-100',
      hover: 'hover:border-amber-400 hover:shadow-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ============================================
          HEADER
          ============================================ */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Boxes className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                VENTO SAS
              </h1>
              <p className="text-lg text-slate-600">
                Sistema de Inventario y Alquiler de Carpas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          CONTENIDO PRINCIPAL
          ============================================ */}
      <div className="container mx-auto px-6 py-12">
        {/* Título de sección */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Selecciona un módulo
          </h2>
          <p className="text-slate-600">
            Elige el área del sistema que deseas gestionar
          </p>
        </div>

        {/* ============================================
            GRID DE MÓDULOS
            ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {modulos.map((modulo) => {
            const Icono = modulo.icono
            const styles = colorStyles[modulo.color]

            return (
              <div
                key={modulo.id}
                onClick={() => modulo.disponible && navigate(modulo.ruta)}
                className={`
                  relative overflow-hidden
                  bg-white rounded-xl border-2 ${styles.border}
                  p-6 cursor-pointer
                  transition-all duration-300
                  ${styles.hover}
                  hover:shadow-lg hover:-translate-y-1
                  ${!modulo.disponible ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                {/* Fondo decorativo */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${styles.bg} rounded-full -mr-16 -mt-16 opacity-50`} />

                {/* Contenido */}
                <div className="relative">
                  {/* Icono */}
                  <div className={`inline-flex p-3 rounded-xl ${styles.icon} mb-4`}>
                    <Icono className="w-8 h-8" />
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {modulo.titulo}
                  </h3>

                  {/* Descripción */}
                  <p className="text-slate-600 mb-4 min-h-[48px]">
                    {modulo.descripcion}
                  </p>

                  {/* Botón */}
                  <div className="flex items-center justify-between">
                    {modulo.disponible ? (
                      <button
                        className={`
                          inline-flex items-center gap-2 px-4 py-2
                          ${styles.button} text-white
                          rounded-lg font-medium
                          transition-colors
                        `}
                      >
                        Acceder
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-sm text-slate-500 italic">
                        Próximamente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ============================================
            ACCESOS RÁPIDOS
            ============================================ */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">Accesos rápidos</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={<Users className="w-4 h-4" />}
              onClick={() => navigate('/clientes')}
            >
              Clientes
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4" />}
              onClick={() => navigate('/cotizaciones')}
            >
              Cotizaciones
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<MapPin className="w-4 h-4" />}
              onClick={() => navigate('/ubicaciones')}
            >
              Ubicaciones
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================
          FOOTER
          ============================================ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-slate-500">
            Sistema de Inventario VENTO SAS - v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
