// ============================================
// COMPONENTE: PRODUCTO SELECTOR
// Selector avanzado de productos con búsqueda y categorías
// ============================================

import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, ChevronDown, Package, X, ChevronRight } from 'lucide-react'
import { useGetProductosAlquiler } from '../../hooks/UseProductosAlquiler'
import { useGetCategoriasProductosActivasArbol } from '../../hooks/UseCategoriasProductos'
import IconoCategoria from './IconoCategoria'

/**
 * ProductoSelector - Selector de productos con búsqueda y filtro por categorías
 *
 * @param {string|number} value - ID del producto seleccionado
 * @param {function} onChange - Callback cuando cambia el producto (recibe el producto completo)
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} error - Mensaje de error
 * @param {string} placeholder - Placeholder del input
 */
const ProductoSelector = ({
  value = '',
  onChange,
  disabled = false,
  error = null,
  placeholder = 'Buscar producto...'
}) => {
  // ============================================
  // HOOKS
  // ============================================

  const { productos, isLoading: loadingProductos } = useGetProductosAlquiler()
  const { categorias, isLoading: loadingCategorias } = useGetCategoriasProductosActivasArbol()

  // ============================================
  // ESTADO LOCAL
  // ============================================

  const [isOpen, setIsOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // ============================================
  // PRODUCTO SELECCIONADO
  // ============================================

  const productoSeleccionado = useMemo(() => {
    if (!value) return null
    return productos.find(p => p.id === parseInt(value))
  }, [value, productos])

  // ============================================
  // PRODUCTOS AGRUPADOS POR CATEGORÍA
  // ============================================

  const productosAgrupados = useMemo(() => {
    // Filtrar por búsqueda
    let productosFiltrados = productos.filter(p => p.activo !== false)

    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase().trim()
      productosFiltrados = productosFiltrados.filter(p =>
        p.nombre.toLowerCase().includes(terminoBusqueda) ||
        (p.codigo && p.codigo.toLowerCase().includes(terminoBusqueda))
      )
    }

    // Filtrar por categoría si hay una seleccionada
    if (categoriaSeleccionada) {
      productosFiltrados = productosFiltrados.filter(p =>
        p.categoria_id === categoriaSeleccionada.id
      )
    }

    // Agrupar por categoría
    const grupos = {}
    productosFiltrados.forEach(producto => {
      const categoriaKey = producto.categoria_id || 'sin-categoria'
      if (!grupos[categoriaKey]) {
        grupos[categoriaKey] = {
          categoria_id: producto.categoria_id,
          categoria_nombre: producto.categoria_nombre || 'Sin categoría',
          categoria_emoji: producto.categoria_emoji,
          productos: []
        }
      }
      grupos[categoriaKey].productos.push(producto)
    })

    // Convertir a array y ordenar por nombre de categoría
    return Object.values(grupos).sort((a, b) =>
      a.categoria_nombre.localeCompare(b.categoria_nombre)
    )
  }, [productos, busqueda, categoriaSeleccionada])

  // Total de productos filtrados
  const totalProductosFiltrados = useMemo(() =>
    productosAgrupados.reduce((total, grupo) => total + grupo.productos.length, 0),
    [productosAgrupados]
  )

  // ============================================
  // EFECTOS
  // ============================================

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setBusqueda('')
        setCategoriaSeleccionada(null)
      }
    }
  }

  const handleSelectProducto = (producto) => {
    onChange(producto)
    setIsOpen(false)
    setBusqueda('')
    setCategoriaSeleccionada(null)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange(null)
  }

  const handleSelectCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria)
  }

  const handleVolverCategorias = () => {
    setCategoriaSeleccionada(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // ============================================
  // FORMATO DE MONEDA
  // ============================================

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0)
  }

  // ============================================
  // RENDER
  // ============================================

  const isLoading = loadingProductos || loadingCategorias

  return (
    <div ref={containerRef} className="relative">
      {/* Input/Button principal */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          w-full px-3 py-2 border rounded-lg text-left
          flex items-center justify-between gap-2
          transition-colors
          ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-slate-400'}
          ${error ? 'border-red-300' : 'border-slate-300'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />

          {productoSeleccionado ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {productoSeleccionado.categoria_emoji && (
                <IconoCategoria
                  emoji={productoSeleccionado.categoria_emoji}
                  className="w-4 h-4 flex-shrink-0"
                />
              )}
              <span className="truncate text-sm">
                {productoSeleccionado.nombre}
              </span>
              <span className="text-xs text-slate-500 flex-shrink-0">
                {formatearMoneda(productoSeleccionado.precio_base)}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">
              {isLoading ? 'Cargando...' : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {productoSeleccionado && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Navegación de categoría */}
          {categoriaSeleccionada && !busqueda && (
            <button
              type="button"
              onClick={handleVolverCategorias}
              className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-b border-slate-100"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Volver a categorías
            </button>
          )}

          {/* Lista de categorías o productos */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-slate-500">Cargando productos...</p>
              </div>
            ) : totalProductosFiltrados === 0 ? (
              <div className="px-4 py-8 text-center">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  {busqueda
                    ? `No se encontraron productos con "${busqueda}"`
                    : 'No hay productos disponibles'
                  }
                </p>
              </div>
            ) : !busqueda && !categoriaSeleccionada ? (
              // Mostrar lista de categorías
              <>
                {productosAgrupados.map((grupo) => (
                  <button
                    key={grupo.categoria_id || 'sin-categoria'}
                    type="button"
                    onClick={() => handleSelectCategoria({ id: grupo.categoria_id, nombre: grupo.categoria_nombre })}
                    className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-2 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {grupo.categoria_emoji ? (
                        <IconoCategoria emoji={grupo.categoria_emoji} className="w-5 h-5" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-slate-700">
                        {grupo.categoria_nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {grupo.productos.length} producto{grupo.productos.length !== 1 ? 's' : ''}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                ))}
              </>
            ) : (
              // Mostrar productos (filtrados por categoría o búsqueda)
              <>
                {productosAgrupados.map((grupo) => (
                  <div key={grupo.categoria_id || 'sin-categoria'}>
                    {/* Header de categoría (solo si hay búsqueda y múltiples categorías) */}
                    {busqueda && productosAgrupados.length > 1 && (
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          {grupo.categoria_emoji ? (
                            <IconoCategoria emoji={grupo.categoria_emoji} className="w-4 h-4" />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-xs font-medium text-slate-500 uppercase">
                            {grupo.categoria_nombre}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Lista de productos */}
                    {grupo.productos.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => handleSelectProducto(producto)}
                        className={`
                          w-full px-3 py-2 text-left hover:bg-blue-50
                          flex items-center justify-between gap-2
                          border-b border-slate-50 last:border-0
                          ${parseInt(value) === producto.id ? 'bg-blue-50' : ''}
                        `}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {grupo.categoria_emoji && !busqueda ? (
                            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-slate-300" />
                            </div>
                          ) : grupo.categoria_emoji ? (
                            <IconoCategoria emoji={grupo.categoria_emoji} className="w-5 h-5 flex-shrink-0" />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 truncate">
                              {producto.nombre}
                            </p>
                            {producto.codigo && (
                              <p className="text-xs text-slate-400 truncate">
                                {producto.codigo}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600 flex-shrink-0">
                          {formatearMoneda(producto.precio_base)}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer con total */}
          {!isLoading && totalProductosFiltrados > 0 && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
              {busqueda ? (
                `${totalProductosFiltrados} resultado${totalProductosFiltrados !== 1 ? 's' : ''}`
              ) : categoriaSeleccionada ? (
                `${totalProductosFiltrados} producto${totalProductosFiltrados !== 1 ? 's' : ''} en ${categoriaSeleccionada.nombre}`
              ) : (
                `${productos.length} producto${productos.length !== 1 ? 's' : ''} en ${productosAgrupados.length} categoría${productosAgrupados.length !== 1 ? 's' : ''}`
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default ProductoSelector
