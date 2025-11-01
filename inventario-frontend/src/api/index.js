// ============================================
// API: INDEX
// Exportación centralizada de todos los servicios
// ============================================

export { default as categoriasAPI } from './apiCategorias'
export { default as elementosAPI } from './apiElementos'
export { default as seriesAPI } from './apiSeries'
export { default as lotesAPI } from './apiLotes'
export { default as materialesAPI } from './apiMateriales'
export { default as unidadesAPI } from './apiUnidades'

// También exportar la instancia de axios por si se necesita
export { default as api } from './Axios.config'