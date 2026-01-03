// ============================================
// COMPONENTE: ProductoConfiguracion
// Configuración de componentes de un producto
// ============================================

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Package, Settings } from 'lucide-react'
import apiProductosAlquiler from '../../api/apiProductosAlquiler'

/**
 * ProductoConfiguracion
 *
 * Muestra y permite configurar los componentes de un producto:
 * - Fijos: solo informativos
 * - Alternativas: elegir cantidades que sumen lo requerido
 * - Adicionales: marcar los que se quieren
 */
const ProductoConfiguracion = ({
  productoId,
  cantidad = 1,
  configuracion,
  onConfiguracionChange,
  disabled = false
}) => {
  const [componentes, setComponentes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // ============================================
  // FUNCIONES HELPER (definidas antes del useEffect)
  // ============================================

  // Inicializar configuración con defaults
  const inicializarConfiguracion = (comps) => {
    const config = {
      alternativas: {},
      adicionales: {}
    }

    // Para alternativas, poner cantidad en el default
    comps.alternativas?.forEach(grupo => {
      config.alternativas[grupo.nombre] = {}
      grupo.opciones.forEach(opcion => {
        // Si es default, poner la cantidad requerida, si no, 0
        config.alternativas[grupo.nombre][opcion.id] = opcion.es_default ? grupo.cantidad_requerida : 0
      })
    })

    // Para adicionales, empezar en 0
    comps.adicionales?.forEach(adicional => {
      config.adicionales[adicional.id] = 0
    })

    return config
  }

  // Calcular precio total de una configuracion
  const calcularPrecioTotal = (config, comps, cant) => {
    if (!comps || !config) return 0

    let total = 0

    // Precio de alternativas no-default
    comps.alternativas?.forEach(grupo => {
      grupo.opciones.forEach(opcion => {
        const cantidadSeleccionada = config.alternativas?.[grupo.nombre]?.[opcion.id] || 0
        if (!opcion.es_default && cantidadSeleccionada > 0) {
          total += opcion.precio_adicional * cantidadSeleccionada
        }
      })
    })

    // Precio de adicionales
    comps.adicionales?.forEach(adicional => {
      const cantidadSeleccionada = config.adicionales?.[adicional.id] || 0
      if (cantidadSeleccionada > 0) {
        total += adicional.precio_adicional * cantidadSeleccionada
      }
    })

    return total * cant
  }

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // ============================================
  // EFFECT: Cargar componentes
  // ============================================

  useEffect(() => {
    if (!productoId) {
      setComponentes(null)
      return
    }

    const cargarComponentes = async () => {
      setLoading(true)
      try {
        const response = await apiProductosAlquiler.obtenerComponentes(productoId)
        // La respuesta tiene estructura: { success, data: { elemento, componentes } }
        const comps = response.data?.componentes || response.componentes || response
        setComponentes(comps)

        // Inicializar configuración si no existe
        if (!configuracion && comps) {
          const configInicial = inicializarConfiguracion(comps)
          const precioInicial = calcularPrecioTotal(configInicial, comps, cantidad)
          onConfiguracionChange(configInicial, precioInicial)
        }
      } catch (error) {
        console.error('Error cargando componentes:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarComponentes()
  }, [productoId])

  // ============================================
  // HANDLERS
  // ============================================

  // Actualizar cantidad de alternativa
  const handleAlternativaChange = (grupoNombre, opcionId, nuevaCantidad) => {
    const nuevaConfig = { ...configuracion }
    if (!nuevaConfig.alternativas) nuevaConfig.alternativas = {}
    if (!nuevaConfig.alternativas[grupoNombre]) nuevaConfig.alternativas[grupoNombre] = {}

    nuevaConfig.alternativas[grupoNombre][opcionId] = parseInt(nuevaCantidad) || 0
    const precioTotal = calcularPrecioTotal(nuevaConfig, componentes, cantidad)
    onConfiguracionChange(nuevaConfig, precioTotal)
  }

  // Actualizar cantidad de adicional
  const handleAdicionalChange = (adicionalId, nuevaCantidad) => {
    const nuevaConfig = { ...configuracion }
    if (!nuevaConfig.adicionales) nuevaConfig.adicionales = {}

    nuevaConfig.adicionales[adicionalId] = parseInt(nuevaCantidad) || 0
    const precioTotal = calcularPrecioTotal(nuevaConfig, componentes, cantidad)
    onConfiguracionChange(nuevaConfig, precioTotal)
  }

  // Calcular total de un grupo de alternativas
  const getTotalGrupo = (grupoNombre) => {
    if (!configuracion?.alternativas?.[grupoNombre]) return 0
    return Object.values(configuracion.alternativas[grupoNombre]).reduce((sum, val) => sum + (parseInt(val) || 0), 0)
  }

  // Calcular precio adicional de alternativas (para mostrar en UI)
  const calcularPrecioAlternativas = () => {
    if (!componentes?.alternativas || !configuracion?.alternativas) return 0

    let total = 0
    componentes.alternativas.forEach(grupo => {
      grupo.opciones.forEach(opcion => {
        const cantidadSeleccionada = configuracion.alternativas[grupo.nombre]?.[opcion.id] || 0
        if (!opcion.es_default && cantidadSeleccionada > 0) {
          total += opcion.precio_adicional * cantidadSeleccionada
        }
      })
    })
    return total * cantidad
  }

  // Calcular precio adicional de adicionales (para mostrar en UI)
  const calcularPrecioAdicionales = () => {
    if (!componentes?.adicionales || !configuracion?.adicionales) return 0

    let total = 0
    componentes.adicionales.forEach(adicional => {
      const cantidadSeleccionada = configuracion.adicionales[adicional.id] || 0
      if (cantidadSeleccionada > 0) {
        total += adicional.precio_adicional * cantidadSeleccionada
      }
    })
    return total * cantidad
  }

  // ============================================
  // RENDER
  // ============================================

  if (!productoId) return null
  if (loading) return <div className="text-sm text-slate-500 py-2">Cargando componentes...</div>
  if (!componentes) return null

  const tieneComponentes = componentes.fijos?.length > 0 ||
                           componentes.alternativas?.length > 0 ||
                           componentes.adicionales?.length > 0

  if (!tieneComponentes) return null

  const precioAlternativas = calcularPrecioAlternativas()
  const precioAdicionales = calcularPrecioAdicionales()

  return (
    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
      {/* Header colapsable */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
        disabled={disabled}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Settings className="w-4 h-4" />
          Configurar componentes
        </span>
        <div className="flex items-center gap-2">
          {(precioAlternativas > 0 || precioAdicionales > 0) && (
            <span className="text-xs text-blue-600 font-medium">
              +{formatearMoneda(precioAlternativas + precioAdicionales)}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-4 text-sm">
          {/* Fijos */}
          {componentes.fijos?.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">Componentes incluidos</h4>
              <ul className="space-y-1 text-slate-600">
                {componentes.fijos.map(comp => (
                  <li key={comp.id} className="flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    {comp.cantidad}x {comp.elemento_nombre}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternativas */}
          {componentes.alternativas?.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">Alternativas</h4>
              <div className="space-y-3">
                {componentes.alternativas.map(grupo => {
                  const totalGrupo = getTotalGrupo(grupo.nombre)
                  const esValido = totalGrupo === grupo.cantidad_requerida

                  return (
                    <div key={grupo.nombre} className="border border-slate-200 rounded-lg p-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{grupo.nombre}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          esValido ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {totalGrupo}/{grupo.cantidad_requerida}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {grupo.opciones.map(opcion => (
                          <div key={opcion.id} className="flex items-center justify-between gap-2">
                            <span className="flex-1 text-slate-600">
                              {opcion.elemento_nombre}
                              {opcion.es_default && (
                                <span className="text-xs text-green-600 ml-1">(incluido)</span>
                              )}
                              {!opcion.es_default && opcion.precio_adicional > 0 && (
                                <span className="text-xs text-blue-600 ml-1">
                                  (+{formatearMoneda(opcion.precio_adicional)} c/u)
                                </span>
                              )}
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={grupo.cantidad_requerida}
                              value={configuracion?.alternativas?.[grupo.nombre]?.[opcion.id] || 0}
                              onChange={(e) => handleAlternativaChange(grupo.nombre, opcion.id, e.target.value)}
                              disabled={disabled}
                              className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Adicionales */}
          {componentes.adicionales?.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">Adicionales opcionales</h4>
              <div className="space-y-1">
                {componentes.adicionales.map(adicional => (
                  <div key={adicional.id} className="flex items-center justify-between gap-2">
                    <span className="flex-1 text-slate-600">
                      {adicional.elemento_nombre}
                      <span className="text-xs text-blue-600 ml-1">
                        (+{formatearMoneda(adicional.precio_adicional)} c/u)
                      </span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={configuracion?.adicionales?.[adicional.id] || 0}
                      onChange={(e) => handleAdicionalChange(adicional.id, e.target.value)}
                      disabled={disabled}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen de precios adicionales */}
          {(precioAlternativas > 0 || precioAdicionales > 0) && (
            <div className="border-t pt-2 text-right text-xs text-slate-600">
              {precioAlternativas > 0 && (
                <div>Alternativas: +{formatearMoneda(precioAlternativas)}</div>
              )}
              {precioAdicionales > 0 && (
                <div>Adicionales: +{formatearMoneda(precioAdicionales)}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductoConfiguracion
