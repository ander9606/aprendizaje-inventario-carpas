// ============================================
// API: INDEX
// Exportación centralizada de todos los servicios
// ============================================

// Inventario Individual
export { default as categoriasAPI } from './apiCategorias'
export { default as elementosAPI } from './apiElementos'
export { default as seriesAPI } from './apiSeries'
export { default as lotesAPI } from './apiLotes'
export { default as materialesAPI } from './apiMateriales'
export { default as unidadesAPI } from './apiUnidades'

// Productos de Alquiler (Elementos Compuestos)
export { default as categoriasProductosAPI } from './apiCategoriasProductos'
export { default as elementosCompuestosAPI } from './apiElementosCompuestos'

// También exportar la instancia de axios por si se necesita
export { default as api } from './Axios.config'