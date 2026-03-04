// ============================================
// PÁGINA: PRODUCTOS
// Navegación principal entre módulos
// ============================================

import { useNavigate } from 'react-router-dom'
import { Package, Tent, ArrowRight, Box, Layers, MapPin, Wrench } from 'lucide-react'

/**
 * ProductosPage - Página de navegación entre módulos
 *
 * Separa los dos módulos principales:
 * 1. Inventario Individual - Stock físico
 * 2. Productos de Alquiler - Plantillas/Elementos Compuestos
 */
function ProductosPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Gestión de Productos
          </h1>
          <p className="text-slate-600">
            Administra tu inventario físico y configura los productos para alquiler
          </p>
        </div>

        {/* Cards de navegación */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Card: Inventario Individual */}
          <div
            onClick={() => navigate('/')}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  Inventario Individual
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                </h2>
                <p className="text-slate-600 mb-4">
                  Gestión de elementos físicos del inventario: control de stock, series y lotes.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Layers className="w-4 h-4" />
                    <span>Categorías y Subcategorías</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Box className="w-4 h-4" />
                    <span>Elementos (Series y Lotes)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>Ubicaciones</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Wrench className="w-4 h-4" />
                    <span>Materiales y Unidades</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-blue-600 font-medium group-hover:underline">
                Ir al Inventario →
              </span>
            </div>
          </div>

          {/* Card: Productos de Alquiler */}
          <div
            onClick={() => navigate('/productos/alquiler')}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                <Tent className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  Productos de Alquiler
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                </h2>
                <p className="text-slate-600 mb-4">
                  Plantillas de productos para cotizar y alquilar. Combina elementos del inventario.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Layers className="w-4 h-4" />
                    <span>Categorías de Productos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Tent className="w-4 h-4" />
                    <span>Elementos Compuestos (Plantillas)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Box className="w-4 h-4" />
                    <span>Componentes: Fijos, Alternativas, Adicionales</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-emerald-600 font-medium group-hover:underline">
                Ir a Productos de Alquiler →
              </span>
            </div>
          </div>

        </div>

        {/* Info adicional */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-medium text-amber-900 mb-1">¿Cómo funciona?</h3>
              <p className="text-sm text-amber-800">
                Primero registra los elementos individuales en el <strong>Inventario</strong> (carpas, postes, estacas, etc.).
                Luego, en <strong>Productos de Alquiler</strong>, crea plantillas que combinan esos elementos
                para formar productos completos como "Carpa P10 Completa" con todos sus accesorios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductosPage
