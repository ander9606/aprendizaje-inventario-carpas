// ============================================
// COMPONENTE: ProductoSelectorTarjetas
// Selector de productos con tarjetas en 2 pasos
// Paso 1: Seleccionar categoria
// Paso 2: Seleccionar productos de esa categoria
// Con verificación de disponibilidad por fechas
// ============================================

import { useState, useEffect } from 'react'
import { ArrowLeft, Package, Search, Loader2, Calendar } from 'lucide-react'
import { useGetCategoriasConConteo } from '@productos/hooks/useCategoriasProductos'
import { useGetProductosPorCategoria } from '@productos/hooks/useProductosAlquiler'
import apiDisponibilidad from '@alquileres/api/apiDisponibilidad'
import CategoriaCardSelector from './CategoriaCardSelector'
import ProductoCardSelector from './ProductoCardSelector'
import Button from '@shared/components/Button'
import Spinner from '@shared/components/Spinner'

const ProductoSelectorTarjetas = ({
  onProductoAgregado,
  disabled = false,
  fechaMontaje = null,
  fechaDesmontaje = null
}) => {
  // ============================================
  // ESTADO
  // ============================================
  const [paso, setPaso] = useState('categorias') // 'categorias' | 'productos'
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // ============================================
  // HOOKS
  // ============================================
  const { categorias, isLoading: loadingCategorias, error: errorCategorias } = useGetCategoriasConConteo()
  const { productos, isLoading: loadingProductos, error: errorProductos } = useGetProductosPorCategoria(
    categoriaSeleccionada?.id
  )

  // Estado local para disponibilidad por producto
  const [disponibilidadPorProducto, setDisponibilidadPorProducto] = useState({})
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false)

  // ============================================
  // DISPONIBILIDAD: Verificar cada producto individualmente
  // Se hace una llamada separada por producto para que los elementos
  // de un producto no contaminen la disponibilidad de otros
  // ============================================
  useEffect(() => {
    if (paso !== 'productos' || !fechaMontaje || productos.length === 0) {
      setDisponibilidadPorProducto({})
      setLoadingDisponibilidad(false)
      return
    }

    let cancelled = false
    setLoadingDisponibilidad(true)

    const timer = setTimeout(async () => {
      try {
        // Verificar cada producto por separado en paralelo
        const promesas = productos.map(async (producto) => {
          try {
            const response = await apiDisponibilidad.verificarProductos(
              [{ compuesto_id: producto.id, cantidad: 1 }],
              fechaMontaje,
              fechaDesmontaje || fechaMontaje
            )
            const elementos = response?.data?.elementos || response?.elementos || []

            if (elementos.length === 0) {
              return { id: producto.id, disponibles: Infinity, estado: 'ok' }
            }

            let minDisponibles = Infinity
            let hayInsuficiente = false

            elementos.forEach(elem => {
              if (elem.disponibles < minDisponibles) minDisponibles = elem.disponibles
              if (elem.estado === 'insuficiente') hayInsuficiente = true
            })

            return {
              id: producto.id,
              disponibles: minDisponibles === Infinity ? 0 : minDisponibles,
              estado: hayInsuficiente ? 'insuficiente' : 'ok'
            }
          } catch {
            return { id: producto.id, disponibles: 0, estado: 'error' }
          }
        })

        const resultados = await Promise.all(promesas)

        if (!cancelled) {
          const mapa = {}
          resultados.forEach(r => {
            mapa[r.id] = { disponibles: r.disponibles, estado: r.estado }
          })
          setDisponibilidadPorProducto(mapa)
          setLoadingDisponibilidad(false)
        }
      } catch (error) {
        console.error('Error verificando disponibilidad:', error)
        if (!cancelled) setLoadingDisponibilidad(false)
      }
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [paso, productos.length, fechaMontaje, fechaDesmontaje])

  // ============================================
  // HANDLERS
  // ============================================

  const handleSeleccionarCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria)
    setPaso('productos')
    setBusqueda('')
  }

  const handleVolverCategorias = () => {
    setPaso('categorias')
    setCategoriaSeleccionada(null)
    setBusqueda('')
  }

  const handleAgregarProducto = (producto, cantidad) => {
    onProductoAgregado?.(producto, cantidad)
  }

  // ============================================
  // FILTRADO
  // ============================================

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ============================================
  // RENDER: PASO 1 - CATEGORIAS
  // ============================================

  if (paso === 'categorias') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-700 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Seleccionar Categoria
          </h4>
        </div>

        {/* Grid de categorias */}
        {loadingCategorias ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : errorCategorias ? (
          <div className="text-center py-8 text-red-500">
            Error al cargar categorías: {errorCategorias.message}
          </div>
        ) : categorias.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No hay categorías con productos disponibles
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categorias.map(categoria => (
              <CategoriaCardSelector
                key={categoria.id}
                categoria={categoria}
                onClick={handleSeleccionarCategoria}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ============================================
  // RENDER: PASO 2 - PRODUCTOS
  // ============================================

  return (
    <div className="space-y-4">
      {/* Header con boton volver */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleVolverCategorias}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Categorias
        </Button>

        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-2xl">{categoriaSeleccionada?.emoji || '📦'}</span>
          <h4 className="font-semibold">{categoriaSeleccionada?.nombre}</h4>
          <span className="text-sm text-slate-500">
            ({productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      {/* Indicador de fechas para disponibilidad */}
      {!fechaMontaje ? (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
          <Calendar className="w-5 h-5" />
          <span className="text-sm">
            Seleccione fechas de montaje para ver disponibilidad en tiempo real
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            Disponibilidad para: {fechaMontaje} - {fechaDesmontaje || fechaMontaje}
          </span>
          {loadingDisponibilidad && (
            <Loader2 className="w-4 h-4 animate-spin ml-auto" />
          )}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar en esta categoria..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grid de productos */}
      {loadingProductos ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : errorProductos ? (
        <div className="text-center py-8 text-red-500">
          Error al cargar productos: {errorProductos.message}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          {busqueda
            ? 'No se encontraron productos con ese nombre'
            : 'No hay productos en esta categoría'
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {productosFiltrados.map(producto => (
            <ProductoCardSelector
              key={producto.id}
              producto={producto}
              onAgregar={handleAgregarProducto}
              disabled={disabled}
              fechaMontaje={fechaMontaje}
              fechaDesmontaje={fechaDesmontaje}
              disponibilidadInfo={disponibilidadPorProducto[producto.id]}
              loadingDisponibilidad={loadingDisponibilidad}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductoSelectorTarjetas
