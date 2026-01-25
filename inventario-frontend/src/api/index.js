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

// Autenticación
export { default as authAPI } from './apiAuth'

// Configuración (Empleados, Vehículos)
export { default as empleadosAPI } from './apiEmpleados'
export { default as vehiculosAPI } from './apiVehiculos'

// Operaciones (Órdenes de trabajo, Alertas)
export { default as operacionesAPI } from './apiOperaciones'
export { ordenesAPI, elementosAPI as ordenElementosAPI, alertasAPI, validacionAPI } from './apiOperaciones'

// También exportar la instancia de axios por si se necesita
export { default as api } from './Axios.config'