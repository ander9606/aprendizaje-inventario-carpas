// ============================================
// HOOKS: INDEX
// Exportación centralizada de todos los hooks
// ============================================

// Autenticación
export { default as useAuth } from './auth/useAuth'

// Empleados
export {
    useGetEmpleados,
    useGetEmpleado,
    useGetRoles,
    useGetEmpleadosCampo,
    useGetEmpleadosEstadisticas,
    useCreateEmpleado,
    useUpdateEmpleado,
    useDeleteEmpleado,
    useReactivarEmpleado,
    useCambiarPasswordEmpleado
} from './useEmpleados'

// Vehículos
export {
    useGetVehiculos,
    useGetVehiculo,
    useGetVehiculosDisponibles,
    useGetVehiculosEstadisticas,
    useCreateVehiculo,
    useUpdateVehiculo,
    useDeleteVehiculo,
    useRegistrarUsoVehiculo,
    useRegistrarMantenimiento,
    useActualizarMantenimiento
} from './useVehiculos'

// Órdenes de Trabajo
export {
    useGetOrdenes,
    useGetOrden,
    useGetOrdenesPorAlquiler,
    useGetCalendario,
    useGetEstadisticasOperaciones,
    useUpdateOrden,
    useCambiarFechaOrden,
    useCambiarEstadoOrden,
    useAsignarEquipo,
    useAsignarVehiculo,
    useValidarCambioFecha,
    useGetElementosOrden,
    useCambiarEstadoElemento,
    useReportarIncidencia,
    useSubirFotoElemento
} from './useOrdenesTrabajo'

// Alertas
export {
    useGetAlertas,
    useGetAlertasPendientes,
    useGetResumenAlertas,
    useResolverAlerta,
    useAlertasCount,
    useAlertasCriticas
} from './useAlertas'

// Clientes
export {
    useGetClientes,
    useGetClientesActivos,
    useGetCliente,
    useBuscarClientes,
    useCreateCliente,
    useUpdateCliente,
    useDeleteCliente
} from './UseClientes'

// Categorías
export { useGetCategorias, useCreateCategoria, useUpdateCategoria, useDeleteCategoria } from './Usecategorias'

// Elementos
export { useGetElementos, useCreateElemento, useUpdateElemento, useDeleteElemento } from './Useelementos'

// Series
export { useGetSeriesByElemento, useCreateSerie, useUpdateSerie, useDeleteSerie } from './Useseries'

// Lotes
export { useGetLotes, useGetLotesByMaterial, useCreateLote, useUpdateLote, useDeleteLote } from './Uselotes'

// Materiales
export { useGetMateriales, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, useGetMaterialById } from './Usemateriales'

// Unidades
export { useGetUnidades, useGetUnidadesByMaterial, useCreateUnidad, useUpdateUnidad, useDeleteUnidad, useUpdateStockUnidad } from './Useunidades'

// Ubicaciones
export { useGetUbicaciones, useCreateUbicacion, useUpdateUbicacion, useDeleteUbicacion, useGetArbolUbicaciones } from './Useubicaciones'

// Ciudades
export { useGetCiudades, useGetDepartamentos, useGetCiudadesPorDepartamento, useCreateCiudad, useUpdateCiudad, useDeleteCiudad } from './UseCiudades'

// Elementos Compuestos
export { useGetElementosCompuestos, useGetElementoCompuesto, useCreateElementoCompuesto, useUpdateElementoCompuesto, useDeleteElementoCompuesto } from './UseElementosCompuestos'

// Categorías de Productos
export { useGetCategoriasProductos, useCreateCategoriaProducto, useUpdateCategoriaProducto, useDeleteCategoriaProducto } from './UseCategoriasProductos'

// Productos de Alquiler
export { useGetProductosAlquiler, useGetProductoAlquiler, useCreateProductoAlquiler, useUpdateProductoAlquiler, useDeleteProductoAlquiler, useDuplicateProductoAlquiler } from './UseProductosAlquiler'

// Tarifas de Transporte
export { useGetTarifasTransporte, useCreateTarifaTransporte, useUpdateTarifaTransporte, useDeleteTarifaTransporte, useCalcularTransporte } from './UseTarifasTransporte'

// Disponibilidad
export { useDisponibilidad, useCheckDisponibilidad, useFechasOcupadas } from './useDisponibilidad'

// Descuentos
export {
    useGetDescuentos,
    useGetDescuento,
    useGetDescuentosCotizacion,
    useCreateDescuento,
    useUpdateDescuento,
    useDeleteDescuento,
    useAplicarDescuento,
    useEliminarDescuentoCotizacion
} from './descuentos'

// Configuración de Alquileres
export {
    useGetConfiguraciones,
    useGetConfiguracionCompleta,
    useGetConfiguracionPorCategoria,
    useUpdateConfiguracion,
    useUpdateConfiguraciones
} from './useConfiguracion'
