// ============================================
// COMPONENTE: ElementoCompuestoDetalle
// Vista detallada de una plantilla de producto compuesto
// ============================================

import { Layers, RefreshCw, Plus, Package, Star, Loader2 } from 'lucide-react'
import { useGetComponentesAgrupados } from '../../hooks/UseElementosCompuestos'

/**
 * ElementoCompuestoDetalle
 *
 * Muestra el detalle completo de un elemento compuesto, incluyendo:
 * - Información básica (código, precio, depósito, estado)
 * - Descripción
 * - Componentes agrupados por tipo:
 *   - Fijos (siempre incluidos)
 *   - Alternativas (intercambiables)
 *   - Adicionales (opcionales)
 *
 * @param {Object} elemento - Datos del elemento compuesto
 * @param {Function} formatPrecio - Función para formatear precios
 */
function ElementoCompuestoDetalle({ elemento, formatPrecio }) {
  const { componentes, isLoading } = useGetComponentesAgrupados(elemento?.id)

  const fijos = componentes?.fijos || []
  const alternativas = componentes?.alternativas || []
  const adicionales = componentes?.adicionales || []

  return (
    <div className="p-4">
      <div className="grid gap-4">
        {/* Info básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-500">Código</label>
            <p className="font-medium">{elemento.codigo || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-slate-500">Precio Base</label>
            <p className="font-medium text-emerald-600">
              {formatPrecio(elemento.precio_base)}
            </p>
          </div>
          <div>
            <label className="text-sm text-slate-500">Depósito</label>
            <p className="font-medium">{formatPrecio(elemento.deposito)}</p>
          </div>
          <div>
            <label className="text-sm text-slate-500">Estado</label>
            <p className="font-medium">
              {elemento.activo !== false ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>

        {/* Descripción */}
        {elemento.descripcion && (
          <div>
            <label className="text-sm text-slate-500">Descripción</label>
            <p className="text-slate-700">{elemento.descripcion}</p>
          </div>
        )}

        {/* Componentes */}
        <div className="mt-4 border-t pt-4">
          <h4 className="font-medium text-slate-900 mb-3">Componentes</h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-600">
                Cargando componentes...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Componentes Fijos */}
              {fijos.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Componentes Fijos
                    </span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      Incluidos siempre
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {fijos.map((comp, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700">
                          • {comp.elemento_nombre || 'Elemento'}
                        </span>
                        <span className="text-slate-500">
                          × {comp.cantidad}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grupos de Alternativas */}
              {alternativas.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-900">
                      Alternativas
                    </span>
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      Intercambiables
                    </span>
                  </div>
                  {alternativas.map((grupo, grupoIdx) => (
                    <div key={grupoIdx} className="mb-2 last:mb-0">
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        {grupo.nombre} (requiere {grupo.cantidad_requerida || 1}
                        ):
                      </p>
                      <ul className="ml-4 space-y-1">
                        {(grupo.opciones || []).map((opt, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-sm"
                          >
                            {opt.es_default ? (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-slate-300" />
                            )}
                            <span className="text-slate-700">
                              {opt.elemento_nombre || 'Elemento'}
                            </span>
                            {!opt.es_default && opt.precio_adicional > 0 && (
                              <span className="text-emerald-600 text-xs">
                                +{formatPrecio(opt.precio_adicional)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Componentes Adicionales */}
              {adicionales.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">
                      Adicionales
                    </span>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                      Opcionales
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {adicionales.map((comp, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700">
                          • {comp.elemento_nombre || 'Elemento'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">
                            × {comp.cantidad}
                          </span>
                          {comp.precio_adicional > 0 && (
                            <span className="text-emerald-600">
                              +{formatPrecio(comp.precio_adicional)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sin componentes */}
              {fijos.length === 0 &&
                alternativas.length === 0 &&
                adicionales.length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Esta plantilla no tiene componentes definidos</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ElementoCompuestoDetalle
