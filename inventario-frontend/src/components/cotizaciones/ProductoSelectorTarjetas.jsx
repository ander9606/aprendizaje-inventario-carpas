// ============================================
// COMPONENTE: ProductoSelectorTarjetas
// Selector de productos con tarjetas en 2 pasos
// Paso 1: Seleccionar categoria
// Paso 2: Seleccionar productos de esa categoria
// Con verificación de disponibilidad por fechas
// ============================================

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Package, Search, Loader2, Calendar } from 'lucide-react'
import { useGetCategoriasConConteo } from '../../hooks/UseCategoriasProductos'
import { useGetProductosPorCategoria } from '../../hooks/UseProductosAlquiler'
import { useVerificarDisponibilidadProductos } from '../../hooks/useDisponibilidad'
import CategoriaCardSelector from './CategoriaCardSelector'
import ProductoCardSelector from './ProductoCardSelector'
import Button from '../common/Button'
import Spinner from '../common/Spinner'

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

  // Hook para verificar disponibilidad
  const { verificar, resultado: disponibilidadResultado, isLoading: loadingDisponibilidad, limpiar } = useVerificarDisponibilidadProductos()

  // ============================================
  // DISPONIBILIDAD: Verificar cuando hay productos y fechas
  // ============================================
  useEffect(() => {
    if (paso === 'productos' && productos.length > 0 && fechaMontaje) {
      // Preparar productos para verificación (1 de cada uno)
      const productosParaVerificar = productos.map(p => ({
        compuesto_id: p.id,
        cantidad: 1
      }))
      verificar(productosParaVerificar, fechaMontaje, fechaDesmontaje || fechaMontaje)
    } else {
      limpiar()
    }
  }, [paso, productos.length, fechaMontaje, fechaDesmontaje])

  // Crear mapa de disponibilidad por producto_id
  const disponibilidadPorProducto = useMemo(() => {
    if (!disponibilidadResultado?.elementos) return {}

    // El resultado tiene elementos por elemento_id, necesitamos mapearlo por producto
    // Para cada producto, encontramos el elemento más limitante
    const mapa = {}

    productos.forEach(producto => {
      // Buscar si algún elemento del resultado corresponde a este producto
      // Como verificamos con cantidad 1, el disponible es el mínimo entre componentes
      const elementosDelProducto = disponibilidadResultado.elementos

      if (elementosDelProducto && elementosDelProducto.length > 0) {
        // Encontrar el componente más limitante
        let minDisponibles = Infinity
        let hayInsuficiente = false

        elementosDelProducto.forEach(elem => {
          if (elem.disponibles < minDisponibles) {
            minDisponibles = elem.disponibles
          }
          if (elem.estado === 'insuficiente') {
            hayInsuficiente = true
          }
        })

        // Como todos los productos verificados comparten elementos, distribuimos proporcionalmente
        // Pero por ahora mostramos el mínimo disponible global
        mapa[producto.id] = {
          disponibles: minDisponibles === Infinity ? 0 : minDisponibles,
          estado: hayInsuficiente ? 'insuficiente' : 'ok'
        }
      }
    })

    return mapa
  }, [disponibilidadResultado, productos])

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
